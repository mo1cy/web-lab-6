import { readFile } from 'node:fs/promises';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { parse } from 'yaml';
import { db } from './db.js';
import { HttpError } from './errors.js';
import { linksRouter } from './links.js';

const spec = parse(await readFile(new URL('../openapi.yaml', import.meta.url), 'utf8'));

const app = express();
app.use(express.json({ limit: '10kb' }));

app.get('/health', async (req, res) => {
  try {
    await db.one('SELECT 1');
    res.json({ status: 'ok', database: 'up' });
  } catch (err) {
    console.error('Health check:', err.message);
    res.status(503).json({ status: 'error', database: 'down' });
  }
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
app.use('/api/links', linksRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Ресурс не знайдено' });
});

app.use((err, req, res, next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.code, message: err.message });
    return;
  }
  if (err.status >= 400 && err.status < 500) {
    res.status(400).json({ error: 'INVALID_BODY', message: 'Тіло запиту не є коректним JSON' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Внутрішня помилка сервера' });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Сервер слухає порт ${port}`));