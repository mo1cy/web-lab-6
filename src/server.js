import 'dotenv/config';
import express from 'express';
import pgPromise from 'pg-promise';

const db = pgPromise()(process.env.DATABASE_URL);
const app = express();

app.get('/health', async (req, res) => {
  try {
    await db.one('SELECT 1');
    res.json({ status: 'ok', database: 'up' });
  } catch (err) {
    console.error('Health check:', err.message);
    res.status(503).json({ status: 'error', database: 'down' });
  }
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Сервер слухає порт ${port}`));