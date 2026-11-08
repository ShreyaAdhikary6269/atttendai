import { Router } from 'express';
import { ping } from '../config/db.js';

const router = Router();

router.get('/', async (req, res) => {
  const database = await ping();
  res.json({
    status: database.connected ? 'ok' : 'degraded',
    time: new Date().toISOString(),
    database,
  });
});

export default router;
