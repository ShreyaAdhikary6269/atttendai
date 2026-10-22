// DEMO DATA ONLY. Generated from a fixed seed, so it is identical on every run.
// It is replaced by live Oracle data once the backend is connected.

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(2026);

export const subjects = [
  { subject_id: 'SUB01', subject_name: 'DBMS' },
  { subject_id: 'SUB02', subject_name: 'Operating Systems' },
  { subject_id: 'SUB03', subject_name: 'Computer Networks' },
  { subject_id: 'SUB04', subject_name: 'Data Structures' },
  { subject_id: 'SUB05', subject_name: 'Web Technologies' },
];

const names = [
  'Aarav Sharma', 'Priya Sharma', 'Rahul Verma', 'Sneha Patel', 'Amit Singh', 'Rohit Kumar',
  'Neha Gupta', 'Vikram Rao', 'Ananya Das', 'Arjun Mehta', 'Isha Banerjee', 'Karan Malhotra',
  'Meera Nair', 'Sourav Ghosh', 'Pooja Iyer', 'Rajat Sen', 'Tanya Kapoor', 'Debjit Roy',
  'Simran Kaur', 'Harsh Vardhan', 'Riya Chatterjee', 'Nikhil Joshi', 'Aditi Mishra',
  'Siddharth Jain', 'Kavya Reddy', 'Manish Yadav', 'Shreya Bose', 'Varun Thakur',
  'Divya Pillai', 'Abhishek Pal', 'Naina Saha', 'Tushar Agarwal',
];

const depts = ['CSE', 'IT', 'ECE', 'ME'];
const semesters = [5, 3, 7, 5];
const subjectEffect = [0.03, -0.01, -0.04, 0.02, -0.02];
const months = ['2026-04-01', '2026-05-01', '2026-06-01', '2026-07-01', '2026-08-01', '2026-09-01'];

export const students = names.map((name, i) => ({
  student_id: 'S' + (1001 + i),
  student_name: name,
  department: depts[i % 4],
  semester: semesters[Math.floor(i / 4) % 4],
}));

export const attendance = [];
students.forEach((s) => {
  const u = rand();
  const base = u < 0.2 ? 0.62 + rand() * 0.12 : u < 0.42 ? 0.76 + rand() * 0.08 : 0.86 + rand() * 0.1;
  const trend = (rand() - 0.5) * 0.06;
  subjects.forEach((sub, si) => {
    months.forEach((m, mi) => {
      const held = 10 + Math.floor(rand() * 5);
      let p = base + subjectEffect[si] + trend * (mi - 2.5) + (rand() - 0.5) * 0.12;
      p = Math.min(1, Math.max(0.3, p));
      attendance.push({
        student_id: s.student_id,
        subject_id: sub.subject_id,
        record_month: m,
        classes_held: held,
        classes_attended: Math.min(held, Math.round(held * p)),
      });
    });
  });
});
