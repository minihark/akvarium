import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import sirv from 'sirv';

const PORT = Number(process.env.PORT) || 80;

const DATA_DIR = path.resolve('data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'akvarium.db');
const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS saved_tanks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    creator TEXT NOT NULL,
    liters INTEGER NOT NULL,
    aquascape TEXT NOT NULL,
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

const stmtGetAllTanks = db.prepare('SELECT * FROM saved_tanks ORDER BY updated_at DESC LIMIT 50');
const stmtUpsertTank = db.prepare(`
  INSERT INTO saved_tanks (id, name, creator, liters, aquascape, data_json, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    creator = excluded.creator,
    liters = excluded.liters,
    aquascape = excluded.aquascape,
    data_json = excluded.data_json,
    updated_at = excluded.updated_at
`);
const stmtDeleteTank = db.prepare('DELETE FROM saved_tanks WHERE id = ?');

const assets = sirv(path.resolve('dist'), {
  single: true,
  dev: true,
  gzip: true,
  brotli: true,
});

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 2 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/health' || url.pathname === '/api/health') {
    sendJson(res, 200, {
      status: 'ok',
      service: 'akvarium-fena',
      uptime: process.uptime(),
      db: 'sqlite',
    });
    return;
  }

  if (url.pathname === '/api/tanks' && req.method === 'GET') {
    try {
      const rows = stmtGetAllTanks.all();
      const tanks = rows.map((r) => JSON.parse(r.data_json));
      sendJson(res, 200, { tanks });
    } catch (err) {
      sendJson(res, 500, { error: 'Failed to load tanks' });
    }
    return;
  }

  if (url.pathname === '/api/tanks' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      if (!body || !body.id || !body.name) {
        sendJson(res, 400, { error: 'Tank id and name required' });
        return;
      }
      const now = new Date().toISOString();
      const tankObj = {
        ...body,
        updatedAt: now,
      };
      stmtUpsertTank.run(
        String(body.id),
        String(body.name),
        String(body.creator || 'Familjen'),
        Number(body.liters || 60),
        String(body.aquascape || 'amazonas'),
        JSON.stringify(tankObj),
        now
      );
      sendJson(res, 200, { status: 'ok', tank: tankObj });
    } catch (err) {
      sendJson(res, 500, { error: 'Failed to save tank' });
    }
    return;
  }

  if (url.pathname === '/api/tanks' && req.method === 'DELETE') {
    try {
      const id = url.searchParams.get('id');
      if (id) {
        stmtDeleteTank.run(id);
      }
      sendJson(res, 200, { status: 'ok' });
    } catch (err) {
      sendJson(res, 500, { error: 'Failed to delete tank' });
    }
    return;
  }

  assets(req, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Fena / Akvarium server running on http://0.0.0.0:${PORT}`);
});
