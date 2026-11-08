export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Sends errors from async route handlers to the error middleware
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const CONSTRAINT_MESSAGES = {
  PK_STUDENT: [409, 'A student with this ID already exists.'],
  UQ_STUDENT_EMAIL: [409, 'This email is already used by another student.'],
  PK_SUBJECT: [409, 'A subject with this ID already exists.'],
  UQ_SUBJECT_NAME: [409, 'A subject with this name already exists.'],
  UQ_ATT_RECORD: [409, 'A record for this student, subject and month already exists. Edit that record instead.'],
  CK_ATT_ATTENDED: [422, 'Classes attended cannot be more than classes held.'],
  CK_ATT_HELD: [422, 'Classes held must be at least 1.'],
  CK_ATT_MONTH: [422, 'Month must be the first day of a month.'],
  CK_STUDENT_ID: [422, 'Student ID must look like S1234.'],
  CK_STUDENT_DEPT: [422, 'Department is not one of the allowed values.'],
  CK_STUDENT_SEM: [422, 'Semester must be between 1 and 8.'],
  FK_ATT_STUDENT: [422, 'The selected student does not exist.'],
  FK_ATT_SUBJECT: [422, 'The selected subject does not exist.'],
};

function constraintName(message) {
  const m = /\(([^)]+)\)/.exec(message || '');
  return m ? m[1].split('.').pop().toUpperCase() : '';
}

// Turns Oracle error numbers into friendly messages
function fromOracle(err) {
  const n = err.errorNum;
  if (!n) return null;
  if (n === 1 || n === 2290 || n === 2291) {
    const known = CONSTRAINT_MESSAGES[constraintName(err.message)];
    if (known) return { status: known[0], message: known[1] };
    return n === 1
      ? { status: 409, message: 'This value already exists.' }
      : { status: 422, message: 'A value breaks a database rule.' };
  }
  if (n === 2292) return { status: 409, message: 'This record cannot be deleted because other records depend on it.' };
  if (n === 1400) return { status: 422, message: 'A required value is missing.' };
  if (n === 12899) return { status: 422, message: 'A value is too long for its column.' };
  if (n >= 20000 && n <= 20999) {
    // Messages raised by our own PL/SQL with RAISE_APPLICATION_ERROR
    return { status: 422, message: String(err.message).replace(/^ORA-\d+:\s*/, '').split('\n')[0] };
  }
  return null;
}

export function notFound(req, res) {
  res.status(404).json({ error: 'Route not found: ' + req.method + ' ' + req.originalUrl });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, details: err.details });
  if (err.status === 503) return res.status(503).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body is not valid JSON.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large.' });

  const mapped = fromOracle(err);
  if (mapped) {
    const suffix = err.recordIndex ? ' (record ' + err.recordIndex + ', nothing was saved)' : '';
    return res.status(mapped.status).json({ error: mapped.message + suffix });
  }

  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Unexpected server error. Check the backend terminal for details.' });
}
