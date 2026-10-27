import type { World } from '../world';
import { codeCommit, codeCommitFiles, reviewAction } from '../git/code';
import { hostFs } from '../vfs/build';
import { resolveHost } from '../hosts/profile';
import { ROOT } from '../vfs/vfs';
import { journal } from '../journal';
import { schedulePlaybook } from './schedule';

export interface LessonSetup {
  repo: string;
  branch: string;
  path: string;
  text?: string;
  replace?: { from: string; to: string };
  title: string;
  review?: 'open' | 'merged' | 'deployed';
  baseline?: boolean;
  schedule?: { path: string; interval: number; limit: string };
}

/** Data-driven fixtures only run when a new isolated lesson world is created. */
export function setupLesson(world: World, setup: LessonSetup[]) {
  for (const step of setup) {
    const repo = world.git!.repos[step.repo]!;
    const source =
      repo.commits[repo.branches[step.branch] ?? repo.branches.main!]!.tree[step.path]?.text ?? '';
    if (step.replace && !source.includes(step.replace.from))
      throw new Error(`Lesson fixture source mismatch: ${step.path}`);
    const text = step.text ?? source.replace(step.replace!.from, step.replace!.to);
    const commit = codeCommit(world, step.repo, step.branch, step.path, text, step.title);
    if (step.baseline) repo.branches.main = commit.id;
    if (step.review) {
      const pr = reviewAction(world, 'open', undefined, {
        repo: step.repo,
        branch: step.branch,
        title: step.title,
      });
      pr.fixture = true;
      reviewAction(world, 'check', pr.id);
      if (step.review !== 'open') {
        reviewAction(world, 'approve', pr.id);
        reviewAction(world, 'merge', pr.id);
        if (step.review === 'deployed') reviewAction(world, 'deploy', pr.id);
      }
    }
    if (step.schedule)
      schedulePlaybook(
        world,
        step.repo,
        'main',
        step.schedule.path,
        step.schedule.interval,
        step.schedule.limit,
      );
  }
  syncLessonWorkspaces(world);
}
/** An isolated source addition is one normal multi-file commit, without rewriting seed history. */
export function seedRepositoryFiles(
  world: World,
  repo: string,
  branch: string,
  files: Record<string, string>,
  title: string,
) {
  const commit = codeCommitFiles(world, repo, branch, files, title);
  world.git!.repos[repo]!.branches.main = commit.id;
  syncLessonWorkspaces(world);
}
function syncLessonWorkspaces(world: World) {
  // Local clones begin at the fixture's main revision, with feature branches available via fetch.
  for (const checkout of world.git!.checkouts) {
    const repo = world.git!.repos[checkout.repo]!;
    checkout.branches.main = repo.branches.main!;
    checkout.tracking.main = repo.branches.main!;
    checkout.index = structuredClone(repo.commits[repo.branches.main!]!.tree);
    const fs = hostFs(world, resolveHost(world, checkout.host)!);
    for (const [path, file] of Object.entries(checkout.index)) {
      const destination = checkout.root + '/' + path;
      const owner = checkout.root.split('/')[2]!;
      fs.mkdir(
        destination.slice(0, destination.lastIndexOf('/')),
        { user: owner, groups: [owner] },
        { parents: true },
      );
      fs.writeFile(destination, file.text, ROOT);
      fs.setMeta(destination, { owner, group: owner, mode: file.mode }, ROOT);
    }
  }
  journal(world, { k: 'git.state', state: structuredClone(world.git!) });
}
