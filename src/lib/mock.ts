export type Student = {
  id: string;
  name: string;
  admissionNo: string;
  class: string;
  section: string;
  rollNo: number;
  gender: "Male" | "Female" | "Other";
  parent: string;
  phone: string;
  feeStatus: "Paid" | "Pending" | "Overdue";
  attendance: number;
  status?: "Active" | "On Leave" | "Inactive";
  dob?: string;
  blood?: string;
  nationality?: string;
  religion?: string;
  category?: string;
  motherTongue?: string;
  previousSchool?: string;
  previousClass?: string;
  board?: string;
  lastPercent?: string;
  address?: string;
  city?: string;
  state?: string;
  pin?: string;
  email?: string;
  motherName?: string;
  parentOccupation?: string;
  parentIncome?: string;
  emergencyContact?: string;
  aadhar?: string;
  birthCertificateNo?: string;
  transportRequired?: string;
  hostelRequired?: string;
  medicalNotes?: string;
  documents?: string[];
  session?: string;
  stream?: string;
  wallet?: number;
  archived?: boolean;
  archiveReason?: string;
  archiveType?: "Left" | "Transferred" | "Graduated" | "Expelled" | "Other";
  archiveDate?: string;
  archiveTargetBranch?: string;
  suspended?: boolean;
  suspendReason?: string;
  suspendDays?: number;
  suspendFrom?: string;
  suspendUntil?: string;
};


export type EmployeeAssignment = {
  id: string;
  class: string;
  section: string;
  subject: string;
};

export type Employee = {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  status: "Active" | "On Leave" | "Inactive";
  joinDate: string;
  type?: "Academic" | "Non-Academic";
  qualification?: string;
  previousEmployment?: string;
  salary?: number;
  basic?: number;
  hra?: number;
  allowances?: number;
  aadhar?: string;
  pan?: string;
  docs?: string[];
  gender?: "Male" | "Female" | "Other";
  dob?: string;
  employmentType?: "Full-time" | "Part-time" | "Contract" | "Visiting";
  specialization?: string;
  experience?: string;
  address?: string;
  city?: string;
  state?: string;
  pin?: string;
  emergencyContact?: string;
  bankName?: string;
  accountNo?: string;
  ifsc?: string;
  pf?: string;
  esi?: string;
  medicalNotes?: string;
  assignments?: EmployeeAssignment[];
};


const firstNames = [
  "Aarav",
  "Vivaan",
  "Aditya",
  "Vihaan",
  "Arjun",
  "Sai",
  "Reyansh",
  "Ayaan",
  "Krishna",
  "Ishaan",
  "Ananya",
  "Aadhya",
  "Diya",
  "Ira",
  "Kiara",
  "Myra",
  "Anika",
  "Pari",
  "Saanvi",
  "Tara",
];
const lastNames = [
  "Sharma",
  "Verma",
  "Patel",
  "Gupta",
  "Singh",
  "Kumar",
  "Reddy",
  "Iyer",
  "Mehta",
  "Nair",
  "Joshi",
  "Khanna",
  "Bose",
  "Das",
  "Menon",
];
const classes = ["VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const sections = ["A", "B", "C", "D"];
const roles = [
  "Teacher",
  "Principal",
  "Vice Principal",
  "Academic Coordinator",
  "Accountant",
  "HR",
  "Librarian",
  "Transport Manager",
  "Hostel Warden",
  "Lab Assistant",
];
const depts = [
  "Science",
  "Mathematics",
  "English",
  "Social Studies",
  "Hindi",
  "Computer Sci",
  "Commerce",
  "Administration",
  "Sports",
  "Arts",
];

const rand = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];

let seed = 42;
const sr = () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};
const pick = <T>(a: T[]) => a[Math.floor(sr() * a.length)];

export const students: Student[] = Array.from({ length: 48 }).map((_, i) => {
  const fee = sr();
  return {
    id: `STU${(1000 + i).toString()}`,
    name: `${pick(firstNames)} ${pick(lastNames)}`,
    admissionNo: `ADM-2025-${(100 + i).toString().padStart(4, "0")}`,
    class: pick(classes),
    section: pick(sections),
    rollNo: Math.floor(sr() * 60) + 1,
    gender: sr() > 0.5 ? "Male" : "Female",
    parent: `${pick(firstNames)} ${pick(lastNames)}`,
    phone: `+91 9${Math.floor(sr() * 900000000 + 100000000)}`,
    feeStatus: fee > 0.7 ? "Overdue" : fee > 0.45 ? "Pending" : "Paid",
    attendance: Math.floor(75 + sr() * 25),
  };
});

const academicRoles = ["Teacher", "Principal", "Vice Principal", "Academic Coordinator"];
export const employees: Employee[] = Array.from({ length: 24 }).map((_, i) => {
  const role = pick(roles);
  const salary = 18000 + Math.floor(sr() * 60000);
  return {
    id: `EMP${(2000 + i).toString()}`,
    name: `${pick(firstNames)} ${pick(lastNames)}`,
    role,
    department: pick(depts),
    email: `emp${i}@school.edu.in`,
    phone: `+91 9${Math.floor(sr() * 900000000 + 100000000)}`,
    status: sr() > 0.85 ? "On Leave" : "Active",
    joinDate: `${2018 + Math.floor(sr() * 7)}-0${1 + Math.floor(sr() * 9)}-15`,
    type: academicRoles.includes(role) ? "Academic" : "Non-Academic",
    qualification: pick([
      "B.Ed., M.A.",
      "M.Sc., B.Ed.",
      "MBA",
      "B.Com",
      "CA Inter",
      "B.Tech, M.Tech",
      "M.A. English",
    ]),
    previousEmployment: pick([
      "Ryan International (3y)",
      "DAV (5y)",
      "First job",
      "Kendriya Vidyalaya (4y)",
      "Cambridge School (6y)",
    ]),
    salary,
    basic: Math.round(salary * 0.5),
    hra: Math.round(salary * 0.2),
    allowances: Math.round(salary * 0.3),
    aadhar: `XXXX-XXXX-${1000 + i}`,
    pan: `ABCDE${1000 + i}F`,
    docs: ["Aadhar", "PAN", "Highest Degree", "Resume"],
  };
});

export const feeCollectionTrend = [
  { month: "Apr", collected: 4200000, pending: 800000 },
  { month: "May", collected: 4500000, pending: 720000 },
  { month: "Jun", collected: 4700000, pending: 650000 },
  { month: "Jul", collected: 5100000, pending: 590000 },
  { month: "Aug", collected: 4900000, pending: 620000 },
  { month: "Sep", collected: 5300000, pending: 510000 },
  { month: "Oct", collected: 5600000, pending: 480000 },
  { month: "Nov", collected: 5450000, pending: 530000 },
];

export const attendanceTrend = [
  { day: "Mon", students: 94, staff: 97 },
  { day: "Tue", students: 92, staff: 98 },
  { day: "Wed", students: 95, staff: 96 },
  { day: "Thu", students: 93, staff: 97 },
  { day: "Fri", students: 91, staff: 95 },
  { day: "Sat", students: 88, staff: 94 },
];

export const classDistribution = classes.map((c) => ({
  class: c,
  students: 80 + Math.floor(Math.random() * 60),
}));

export const examPerformance = [
  { subject: "Math", avg: 78, top: 98 },
  { subject: "Science", avg: 82, top: 99 },
  { subject: "English", avg: 75, top: 96 },
  { subject: "Social", avg: 71, top: 94 },
  { subject: "Hindi", avg: 80, top: 97 },
  { subject: "Comp", avg: 85, top: 100 },
];

export const institutes = [
  {
    id: "INS001",
    name: "Mothers Public School — Unit-1",
    city: "Bhubaneswar",
    students: 2840,
    plan: "Enterprise",
    status: "Active",
    mrr: 84000,
  },
  {
    id: "INS002",
    name: "Mothers Public School — CTC",
    city: "Cuttack",
    students: 1920,
    plan: "Business",
    status: "Active",
    mrr: 58000,
  },
  {
    id: "INS003",
    name: "Mothers Public School — Firestation",
    city: "Bhubaneswar",
    students: 3105,
    plan: "Enterprise",
    status: "Active",
    mrr: 92000,
  },
  {
    id: "INS004",
    name: "Mothers Public School — Puri",
    city: "Puri",
    students: 1240,
    plan: "Growth",
    status: "Active",
    mrr: 42000,
  },
  {
    id: "INS005",
    name: "Mothers Public School — RKL",
    city: "Rourkela",
    students: 1680,
    plan: "Business",
    status: "Active",
    mrr: 54000,
  },
];

