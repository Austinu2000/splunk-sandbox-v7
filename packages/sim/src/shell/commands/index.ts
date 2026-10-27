import { kvCurl } from '../../kvstore/commands';
import { vaultCommand } from '../../ansible/vault';
import {
  ansiblePlaybook,
  ansibleInventory,
  ansibleAdHoc,
  ansibleConfiguration,
} from '../../ansible/commands';
import { gitCommand } from '../../git/commands';
import type { CommandFn } from '../types';
import { registerBinaries } from '../../vfs/build';
import { viProgram, nanoProgram } from '../programs/editor';
import { awk } from './awk';
import { FILE_COMMANDS } from './files';
import { splunk, splunkd } from './splunk';
import { SYSTEM_COMMANDS } from './system';
import { LINE_FILTERS, TEXT_COMMANDS } from './text';

const vi: CommandFn = ({ sh, argv }) => ({
  program: viProgram(
    sh,
    argv.slice(1).find((a) => !a.startsWith('-') && !a.startsWith('+')),
  ),
});
const nano: CommandFn = ({ sh, argv }) => ({
  program: nanoProgram(
    sh,
    argv.slice(1).find((a) => !a.startsWith('-') && !a.startsWith('+')),
  ),
});

/** Every simulated program, by name. Builtins (cd, ssh, sudo, ...) live in builtins.ts. */
export const COMMANDS: Record<string, CommandFn> = {
  ...FILE_COMMANDS,
  ...TEXT_COMMANDS,
  ...SYSTEM_COMMANDS,
  curl: kvCurl,
  git: gitCommand,
  'ansible-playbook': ansiblePlaybook,
  'ansible-inventory': ansibleInventory,
  'ansible-config': ansibleConfiguration,
  ansible: ansibleAdHoc,
  'ansible-vault': vaultCommand,
  explain: ({ argv }) => ({
    stdout:
      'Offline command guide: ' +
      argv.slice(1).join(' ') +
      '\nGit records source history. add stages files; commit records the staged snapshot; push publishes to the simulated remote; revert makes a new inverse commit. Ansible --check predicts changes, --diff shows file differences, --limit scopes hosts; handlers run after changed tasks. Unsupported flags and modules report errors.\n',
    code: 0,
  }),
  awk,
  gawk: awk,
  vi,
  vim: vi,
  view: (ctx) => vi(ctx),
  nano,
  splunk,
  splunkd,
};

/** Names installed in /usr/bin (splunk lives in $SPLUNK_HOME/bin instead). */
export const COMMAND_NAMES: readonly string[] = [
  ...Object.keys(COMMANDS).filter((n) => n !== 'splunk' && n !== 'splunkd'),
  'ssh',
  'sudo',
  'su',
].sort();

registerBinaries(COMMAND_NAMES);

/** Commands that process input line by line and so can follow `tail -f |`. */
export const STREAMABLE = new Set(LINE_FILTERS);
