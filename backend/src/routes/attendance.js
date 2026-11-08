import { Router } from 'express';
import oracledb from 'oracledb';
import { rows, exec, withTransaction } from '../config/db.js';
import { HttpError, wrap } from '../middleware/errorHandler.js';
import { parseAttendance, parseCounts, parseRowId, monthParam } from '../middleware/validate.js';

const router = Router();

const SELECT_SQL =
  'SELECT a.attendance_id, a.student_id, s.student_name, a.subject_id, sub.subject_name, ' +
  "TO_CHAR(a.record_month, 'YYYY-MM-DD') AS record_month, a.classes_held, a.classes_attended, " +
  'fn_attendance_pct(a.classes_attended, a.classes_held) AS attendance_pct ' +
  'FROM attendance a ' +
  'JOIN student s ON s.student_id = a.student_id ' +
  'JOIN subject sub ON sub.subject_id = a.subject_id';

const INSERT_SQL =
  'INSERT INTO attendance (student_id, subject_id, record_month, classes_held, classes_attended) ' +
  "VALUES (:student_id, :subject_id, TO_DATE(:record_month, 'YYYY-MM-DD'), :classes_held, :classes_attended) " +
  'RETURNING attendance_id INTO :new_id';

const newIdBind = () => ({ dir: oracledb.BIND_OUT, type: oracledb.NUMBER });

async function findRecord(id) {
  const r = await rows(SELECT_SQL + ' WHERE a.attendance_id = :id', { id });
  return r[0] || null;
}

router.get('/', wrap(async (req, res) => {
  const where = [];
  const binds = {};
  const { student_id, subject_id, from, to } = req.query;
  if (student_id) { where.push('a.student_id = :student_id'); binds.student_id = String(student_id).toUpperCase(); }
  if (subject_id) { where.push('a.subject_id = :subject_id'); binds.subject_id = String(subject_id).toUpperCase(); }
  if (from) { where.push("a.record_month >= TO_DATE(:from_m, 'YYYY-MM')"); binds.from_m = monthParam(from, 'from'); }
  if (to) { where.push("a.record_month <= TO_DATE(:to_m, 'YYYY-MM')"); binds.to_m = monthParam(to, 'to'); }
  binds.lim = Math.min(Math.max(parseInt(req.query.limit, 10) || 500, 1), 2000);

  const sql =
    SELECT_SQL +
    (where.length ? ' WHERE ' + where.join(' AND ') : '') +
    ' ORDER BY a.record_month DESC, a.student_id, a.subject_id FETCH FIRST :lim ROWS ONLY';
  res.json(await rows(sql, binds));
}));

router.post('/', wrap(async (req, res) => {
  const a = parseAttendance(req.body);
  const r = await exec(INSERT_SQL, { ...a, new_id: newIdBind() });
  res.status(201).json(await findRecord(r.outBinds.new_id[0]));
}));

// Many records in ONE transaction: if any record fails, none are saved
router.post('/bulk', wrap(async (req, res) => {
  const list = req.body && req.body.records;
  if (!Array.isArray(list) || list.length === 0) {
    throw new HttpError(400, 'Send {"records": [...]} with at least one record.');
  }
  if (list.length > 200) throw new HttpError(400, 'At most 200 records per request.');

  const parsed = list.map((item, i) => {
    try {
      return parseAttendance(item);
    } catch (err) {
      if (err instanceof HttpError) err.message = 'Record ' + (i + 1) + ': ' + err.message;
      throw err;
    }
  });

  const ids = await withTransaction(async (conn) => {
    const out = [];
    for (let i = 0; i < parsed.length; i++) {
      try {
        const r = await conn.execute(INSERT_SQL, { ...parsed[i], new_id: newIdBind() });
        out.push(r.outBinds.new_id[0]);
      } catch (err) {
        err.recordIndex = i + 1;
        throw err;
      }
    }
    return out;
  });
  res.status(201).json({ inserted: ids.length, attendance_ids: ids });
}));

router.put('/:id', wrap(async (req, res) => {
  const id = parseRowId(req.params.id);
  const c = parseCounts(req.body);
  const r = await exec(
    'UPDATE attendance SET classes_held = :classes_held, classes_attended = :classes_attended WHERE attendance_id = :id',
    { ...c, id }
  );
  if (!r.rowsAffected) throw new HttpError(404, 'Attendance record not found.');
  res.json(await findRecord(id));
}));

router.delete('/:id', wrap(async (req, res) => {
  const id = parseRowId(req.params.id);
  const r = await exec('DELETE FROM attendance WHERE attendance_id = :id', { id });
  if (!r.rowsAffected) throw new HttpError(404, 'Attendance record not found.');
  res.json({ deleted: id });
}));

export default router;
