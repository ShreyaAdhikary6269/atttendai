import { Router } from 'express';
import { rows, exec, withTransaction } from '../config/db.js';
import { HttpError, wrap } from '../middleware/errorHandler.js';
import { parseStudent } from '../middleware/validate.js';

const router = Router();
const COLS = 'student_id, student_name, department, semester, email, phone';

async function findStudent(id) {
  const r = await rows('SELECT ' + COLS + ' FROM student WHERE student_id = :id', { id });
  return r[0] || null;
}

router.get('/', wrap(async (req, res) => {
  const where = [];
  const binds = {};
  const q = String(req.query.q || '').trim().toLowerCase().replace(/[%_\\]/g, '');
  if (q) {
    binds.q1 = q;
    binds.q2 = q;
    where.push("(LOWER(student_name) LIKE '%' || :q1 || '%' OR LOWER(student_id) LIKE '%' || :q2 || '%')");
  }
  if (req.query.department) {
    binds.dept = String(req.query.department).toUpperCase();
    where.push('department = :dept');
  }
  if (req.query.semester) {
    binds.sem = Number(req.query.semester);
    where.push('semester = :sem');
  }
  const sql = 'SELECT ' + COLS + ' FROM student' + (where.length ? ' WHERE ' + where.join(' AND ') : '') + ' ORDER BY student_id';
  res.json(await rows(sql, binds));
}));

router.get('/:id', wrap(async (req, res) => {
  const s = await findStudent(req.params.id.toUpperCase());
  if (!s) throw new HttpError(404, 'Student not found.');
  res.json(s);
}));

router.post('/', wrap(async (req, res) => {
  const s = parseStudent(req.body);
  await exec(
    'INSERT INTO student (student_id, student_name, department, semester, email, phone) ' +
      'VALUES (:student_id, :student_name, :department, :semester, :email, :phone)',
    s
  );
  res.status(201).json(await findStudent(s.student_id));
}));

router.put('/:id', wrap(async (req, res) => {
  const s = parseStudent(req.body, req.params.id);
  const r = await exec(
    'UPDATE student SET student_name = :student_name, department = :department, semester = :semester, ' +
      'email = :email, phone = :phone WHERE student_id = :student_id',
    s
  );
  if (!r.rowsAffected) throw new HttpError(404, 'Student not found.');
  res.json(await findStudent(s.student_id));
}));

router.delete('/:id', wrap(async (req, res) => {
  const id = req.params.id.toUpperCase();
  // One transaction: count the attendance rows, then delete (the foreign key cascades to them)
  const out = await withTransaction(async (conn) => {
    const c = await conn.execute('SELECT COUNT(*) AS n FROM attendance WHERE student_id = :id', { id });
    const d = await conn.execute('DELETE FROM student WHERE student_id = :id', { id });
    return { removed: d.rowsAffected, attendance: c.rows[0].N };
  });
  if (!out.removed) throw new HttpError(404, 'Student not found.');
  res.json({ deleted: id, attendance_records_removed: out.attendance });
}));

export default router;
