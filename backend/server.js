import express from 'express';
import cors from 'cors';
import { env } from './src/config/env.js';
import { closePool } from './src/config/db.js';
import { notFound, errorHandler } from './src/middleware/errorHandler.js';
import healthRoutes from './src/routes/health.js';
import studentRoutes from './src/routes/students.js';
import subjectRoutes from './src/routes/subjects.js';
import attendanceRoutes from './src/routes/attendance.js';

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: env.frontendOrigin }));
app.use(express.json({ limit: '100kb' }));

app.use('/api/health', healthRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(env.port, () => {
  console.log('AttendAI backend running on http://localhost:' + env.port);
});

async function shutdown() {
  server.close();
  await closePool().catch(() => {});
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
