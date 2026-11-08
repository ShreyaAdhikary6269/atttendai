import oracledb from 'oracledb';
import { env, missingDbSettings } from './env.js';

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

export class DbUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DbUnavailableError';
    this.status = 503;
  }
}

export const lowerKeys = (row) =>
  Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]));

const firstLine = (s) => String(s || '').split('\n')[0];

let pool = null;
let pending = null;

async function getPool() {
  if (pool) return pool;
  if (missingDbSettings.length) {
    throw new DbUnavailableError('Database settings are missing in backend/.env: ' + missingDbSettings.join(', ') + '.');
  }
  if (!pending) {
    pending = Promise.race([
      oracledb.createPool({
        user: env.db.user,
        password: env.db.password,
        connectString: env.db.connectString,
        poolMin: 1,
        poolMax: env.db.poolMax,
        poolTimeout: 60,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out after 10 seconds.')), 10000)),
    ])
      .then((p) => { pool = p; return p; })
      .catch((err) => {
        pending = null;
        throw new DbUnavailableError('Cannot connect to Oracle (' + env.db.connectString + '): ' + firstLine(err.message));
      });
  }
  return pending;
}

async function connect() {
  const p = await getPool();
  try {
    return await p.getConnection();
  } catch (err) {
    pool = null;
    pending = null;
    try { await p.close(0); } catch { /* ignore */ }
    throw new DbUnavailableError('Cannot get a database connection: ' + firstLine(err.message));
  }
}

export async function query(sql, binds = {}, opts = {}) {
  const conn = await connect();
  try {
    return await conn.execute(sql, binds, opts);
  } finally {
    await conn.close().catch(() => {});
  }
}

export const exec = (sql, binds = {}, opts = {}) => query(sql, binds, { autoCommit: true, ...opts });

export async function rows(sql, binds = {}) {
  const r = await query(sql, binds);
  return (r.rows || []).map(lowerKeys);
}

// Runs several statements as one unit: all are saved, or none are
export async function withTransaction(work) {
  const conn = await connect();
  try {
    const out = await work(conn);
    await conn.commit();
    return out;
  } catch (err) {
    try { await conn.rollback(); } catch { /* ignore */ }
    throw err;
  } finally {
    await conn.close().catch(() => {});
  }
}

export async function ping() {
  try {
    await query('SELECT 1 AS ok FROM dual');
    return { connected: true };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

export async function closePool() {
  if (pool) await pool.close(5);
}
