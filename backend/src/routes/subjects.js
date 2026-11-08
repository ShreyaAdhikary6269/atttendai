import { Router } from 'express';
import { rows, exec } from '../config/db.js';
import { HttpError, wrap } from '../middleware/errorHandler.js';
import { parseSubject } from '../middleware/validate.js';

const router = Router();

async function findSubject(id) {
  const r = await rows('SELECT subject_id, subject_name FROM subject WHERE subject_id = :id', { id });
  return r[0] || null;
}

router.get('/', wrap(async (req, res) => {
  res.json(await rows('SELECT subject_id, subject_name FROM subject ORDER BY subject_id'));
}));

router.post('/', wrap(async (req, res) => {
  const s = parseSubject(req.body);
  await exec('INSERT INTO subject (subject_id, subject_name) VALUES (:subject_id, :subject_name)', s);
  res.status(201).json(await findSubject(s.subject_id));
}));

router.put('/:id', wrap(async (req, res) => {
  const s = parseSubject(req.body, req.params.id);
  const r = await exec('UPDATE subject SET subject_name = :subject_name WHERE subject_id = :subject_id', s);
  if (!r.rowsAffected) throw new HttpError(404, 'Subject not found.');
  res.json(await findSubject(s.subject_id));
}));

router.delete('/:id', wrap(async (req, res) => {
  const id = req.params.id.toUpperCase();
  const r = await exec('DELETE FROM subject WHERE subject_id = :id', { id });
  if (!r.rowsAffected) throw new HttpError(404, 'Subject not found.');
  res.json({ deleted: id });
}));

export default router;
