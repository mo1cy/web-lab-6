import { Router } from 'express';
import { db } from './db.js';
import { HttpError } from './errors.js';
import { parseUrl, checkAlias } from './validate.js';
import { generateCode } from './codes.js';

const COLUMNS = 'code, original_url, created_at, clicks';
const UNIQUE_VIOLATION = '23505';
const MAX_ATTEMPTS = 5;

function toLink(row, req) {
  return {
    code: row.code,
    shortUrl: `${req.protocol}://${req.get('host')}/${row.code}`,
    originalUrl: row.original_url,
    createdAt: row.created_at,
    clicks: row.clicks,
  };
}

function insertLink(code, url) {
  return db.one(
    `INSERT INTO links (code, original_url) VALUES ($1, $2) RETURNING ${COLUMNS}`,
    [code, url],
  );
}

function getJsonBody(req) {
  const body = req.body;
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new HttpError(400, 'INVALID_BODY', 'Очікується JSON-об\'єкт з Content-Type: application/json');
  }
  return body;
}

function notFound() {
  return new HttpError(404, 'NOT_FOUND', 'Посилання не знайдено');
}

export const linksRouter = Router();

linksRouter.post('/', async (req, res) => {
  const body = getJsonBody(req);
  const url = parseUrl(body.url);

  let row;
  if (body.alias !== undefined) {
    const alias = checkAlias(body.alias);
    try {
      row = await insertLink(alias, url);
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION) {
        throw new HttpError(409, 'ALIAS_TAKEN', 'Такий alias уже зайнятий');
      }
      throw err;
    }
  } else {
    for (let attempt = 0; attempt < MAX_ATTEMPTS && !row; attempt++) {
      try {
        row = await insertLink(generateCode(), url);
      } catch (err) {
        if (err.code !== UNIQUE_VIOLATION) throw err;
      }
    }
    if (!row) throw new Error('Не вдалося згенерувати унікальний код');
  }

  res.status(201).location(`/api/links/${row.code}`).json(toLink(row, req));
});

linksRouter.get('/', async (req, res) => {
  const rows = await db.any(`SELECT ${COLUMNS} FROM links ORDER BY created_at DESC, id DESC`);
  res.json(rows.map((row) => toLink(row, req)));
});

linksRouter.get('/:code', async (req, res) => {
  const row = await db.oneOrNone(`SELECT ${COLUMNS} FROM links WHERE code = $1`, [req.params.code]);
  if (!row) throw notFound();
  res.json(toLink(row, req));
});

linksRouter.patch('/:code', async (req, res) => {
  const body = getJsonBody(req);
  const url = parseUrl(body.url);
  const row = await db.oneOrNone(
    `UPDATE links SET original_url = $1 WHERE code = $2 RETURNING ${COLUMNS}`,
    [url, req.params.code],
  );
  if (!row) throw notFound();
  res.json(toLink(row, req));
});

linksRouter.delete('/:code', async (req, res) => {
  const deleted = await db.result(
    'DELETE FROM links WHERE code = $1',
    [req.params.code],
    (result) => result.rowCount,
  );
  if (deleted === 0) throw notFound();
  res.status(204).end();
});