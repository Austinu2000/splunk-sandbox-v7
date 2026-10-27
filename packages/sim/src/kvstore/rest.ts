import type { World } from '../world';
import {
  kvRead,
  kvWrite,
  kvDelete,
  kvDeleteCollection,
  kvCollections,
  kvConfigureCollection,
  kvInspect,
  kvBackup,
  kvRestore,
  KvError,
  KV_APP,
} from './engine';
export function kvRest(w: World, host: string, method: string, path: string, body: unknown = {}) {
  const url = new URL(path, 'https://localhost:8089');
  const match =
    /^\/servicesNS\/[^/]+\/([^/]+)\/storage\/collections\/(config|data)(?:\/([^/]+))?(?:\/([^/]+))?\/?$/.exec(
      url.pathname,
    );
  const data = (body && typeof body === 'object' && !Array.isArray(body) ? body : {}) as Record<
    string,
    unknown
  >;
  if (url.pathname === '/services/kvstore/status' && method === 'GET') return kvInspect(w, host);
  if (url.pathname === '/services/kvstore/backup/create' && method === 'POST')
    return { archiveName: kvBackup(w, host, String(data.archiveName ?? '')) };
  if (url.pathname === '/services/kvstore/backup/restore' && method === 'POST') {
    kvRestore(w, host, String(data.archiveName ?? ''));
    return { restored: true };
  }
  if (!match) throw new KvError('Unsupported simulated KV REST endpoint');
  const [, app = KV_APP, kind, collection, key] = match;
  if (kind === 'config') {
    if (method === 'GET')
      return kvCollections(w, host, app).filter((c) => !collection || c.collection === collection);
    if (method === 'POST') {
      const { name, ...settings } = data;
      kvConfigureCollection(
        w,
        host,
        app,
        collection ?? String(name ?? ''),
        Object.fromEntries(
          Object.entries(settings)
            .filter(([k]) => k !== 'output_mode')
            .map(([k, v]) => [k, String(v)]),
        ),
      );
      return { name: collection ?? name };
    }
    if (method === 'DELETE' && collection) {
      kvDeleteCollection(w, host, app, collection);
      return { deleted: true };
    }
  } else if (collection) {
    const query =
      key && key !== 'batch_save' ? { _key: key } : JSON.parse(url.searchParams.get('query') ?? '{}');
    if (method === 'GET') return kvRead(w, host, app, collection, query);
    if (method === 'DELETE') return { deleted: kvDelete(w, host, app, collection, query) };
    if (method === 'POST') {
      if (key === 'batch_save') return { saved: kvWrite(w, host, app, collection, body, 'upsert') };
      return {
        saved: kvWrite(
          w,
          host,
          app,
          collection,
          [key ? { ...data, _key: key } : data],
          key ? 'upsert' : 'insert',
        ),
      };
    }
  }
  throw new KvError('Unsupported method or missing collection');
}
