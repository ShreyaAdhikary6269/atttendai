import { createContext, useContext, useState } from 'react';
import {
  students as seedStudents,
  attendance as seedAttendance,
  subjects,
} from '../data/demoData';
import { currentMonth } from '../utils/format';

const DataContext = createContext(null);

export const attKey = (a) => a.student_id + '|' + a.subject_id + '|' + a.record_month;

// Mirrors the Oracle CHECK constraints on the ATTENDANCE table
function checkCounts(held, attended) {
  if (!Number.isInteger(held) || held < 1) throw new Error('Classes held must be a whole number of at least 1.');
  if (held > 100) throw new Error('Classes held cannot be more than 100 for one month.');
  if (!Number.isInteger(attended) || attended < 0) throw new Error('Classes attended must be a whole number, 0 or more.');
  if (attended > held) throw new Error('Classes attended cannot be more than classes held.');
}

export function DataProvider({ children }) {
  const [students, setStudents] = useState(seedStudents);
  const [attendance, setAttendance] = useState(seedAttendance);

  function emailTaken(email, exceptId) {
    if (!email) return false;
    return students.some(
      (x) => x.student_id !== exceptId && x.email && x.email.toLowerCase() === email.toLowerCase()
    );
  }

  function addStudent(s) {
    if (students.some((x) => x.student_id === s.student_id)) {
      throw new Error('Student ID ' + s.student_id + ' already exists.');
    }
    if (emailTaken(s.email, null)) throw new Error('This email is already used by another student.');
    setStudents((prev) => [...prev, s]);
  }

  function updateStudent(id, changes) {
    if (emailTaken(changes.email, id)) throw new Error('This email is already used by another student.');
    setStudents((prev) => prev.map((x) => (x.student_id === id ? { ...x, ...changes } : x)));
  }

  function deleteStudent(id) {
    setStudents((prev) => prev.filter((x) => x.student_id !== id));
    setAttendance((prev) => prev.filter((a) => a.student_id !== id));
  }

  function addAttendance(r) {
    if (!students.some((s) => s.student_id === r.student_id)) throw new Error('Selected student does not exist.');
    if (!subjects.some((s) => s.subject_id === r.subject_id)) throw new Error('Selected subject does not exist.');
    if (!/^\d{4}-\d{2}-01$/.test(r.record_month)) throw new Error('Month is not valid.');
    if (r.record_month.slice(0, 7) > currentMonth()) throw new Error('Attendance cannot be recorded for a future month.');
    checkCounts(r.classes_held, r.classes_attended);
    if (attendance.some((a) => attKey(a) === attKey(r))) {
      throw new Error('A record for this student, subject and month already exists. Edit that record instead.');
    }
    setAttendance((prev) => [...prev, r]);
  }

  function updateAttendance(key, changes) {
    checkCounts(changes.classes_held, changes.classes_attended);
    setAttendance((prev) =>
      prev.map((a) =>
        attKey(a) === key
          ? { ...a, classes_held: changes.classes_held, classes_attended: changes.classes_attended }
          : a
      )
    );
  }

  function deleteAttendance(key) {
    setAttendance((prev) => prev.filter((a) => attKey(a) !== key));
  }

  return (
    <DataContext.Provider
      value={{
        students, attendance, subjects,
        addStudent, updateStudent, deleteStudent,
        addAttendance, updateAttendance, deleteAttendance,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
