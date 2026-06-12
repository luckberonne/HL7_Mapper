// Capa SQLite ejecutandose 100% en el navegador via sql.js (WASM).
// La base se persiste en IndexedDB como blob binario tras cada cambio.
// No hay servidor: los datos nunca salen del navegador.

import initSqlJs, { type Database } from 'sql.js/dist/sql-wasm.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

const IDB_NAME = 'hl7-mapper';
const IDB_STORE = 'sqlite';
const IDB_KEY = 'db';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  structure_id TEXT NOT NULL DEFAULT '*',
  segment TEXT NOT NULL,
  field INTEGER NOT NULL,
  requirement TEXT NOT NULL,
  note TEXT
);

CREATE TABLE IF NOT EXISTS history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  processed_at TEXT NOT NULL,
  structure_id TEXT,
  version TEXT,
  valid INTEGER NOT NULL,
  required_missing INTEGER NOT NULL,
  message TEXT NOT NULL,
  counts TEXT
);
`;

// ---- IndexedDB helpers (un solo registro binario) ----

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbLoad(): Promise<Uint8Array | null> {
  const idb = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
    req.onsuccess = () => resolve((req.result as Uint8Array) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSave(bytes: Uint8Array): Promise<void> {
  const idb = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(bytes, IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---- Singleton de la base ----

let dbInstance: Database | null = null;
let initPromise: Promise<Database> | null = null;

async function createDatabase(): Promise<Database> {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const stored = await idbLoad();
  const db = stored ? new SQL.Database(stored) : new SQL.Database();
  db.run(SCHEMA);
  return db;
}

/** Devuelve la base inicializada (la crea/carga la primera vez). */
export function getDb(): Promise<Database> {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (!initPromise) {
    initPromise = createDatabase().then((db) => {
      dbInstance = db;
      return db;
    });
  }
  return initPromise;
}

/** Persiste el estado actual de la base en IndexedDB. */
export async function persist(): Promise<void> {
  const db = await getDb();
  await idbSave(db.export());
}

/** Ejecuta una consulta SELECT y devuelve filas como objetos. */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: Array<number | string | null> = [],
): Promise<T[]> {
  const db = await getDb();
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const rows: T[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as unknown as T);
    }
    return rows;
  } finally {
    stmt.free();
  }
}

/** Ejecuta una sentencia de escritura y persiste. Devuelve el last insert rowid. */
export async function execute(
  sql: string,
  params: Array<number | string | null> = [],
): Promise<number> {
  const db = await getDb();
  db.run(sql, params);
  const res = db.exec('SELECT last_insert_rowid() AS id');
  const id = Number(res[0]?.values[0]?.[0] ?? 0);
  await persist();
  return id;
}
