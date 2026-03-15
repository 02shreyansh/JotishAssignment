import type { Employee } from '../types';

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Legal', 'Data Science'];
const POSITIONS: Record<string, string[]> = {
  Engineering:    ['Software Engineer', 'Senior Engineer', 'Lead Engineer', 'Principal Engineer', 'DevOps Engineer', 'QA Engineer'],
  Product:        ['Product Manager', 'Senior PM', 'Associate PM', 'Product Lead', 'Head of Product'],
  Design:         ['UI Designer', 'UX Designer', 'Senior Designer', 'Design Lead', 'Graphic Designer'],
  Marketing:      ['Marketing Manager', 'Content Strategist', 'SEO Analyst', 'Brand Manager', 'Growth Hacker'],
  Sales:          ['Sales Executive', 'Account Manager', 'BDM', 'Regional Sales Head', 'Inside Sales Rep'],
  HR:             ['HR Manager', 'Recruiter', 'HR Business Partner', 'Talent Acquisition Lead', 'HR Analyst'],
  Finance:        ['Finance Analyst', 'Accountant', 'CFO', 'Controller', 'Financial Planner'],
  Operations:     ['Operations Manager', 'Process Analyst', 'Supply Chain Lead', 'Logistics Coordinator'],
  Legal:          ['Legal Counsel', 'Compliance Officer', 'Paralegal', 'Contract Manager'],
  'Data Science': ['Data Scientist', 'ML Engineer', 'Data Analyst', 'AI Researcher', 'Data Engineer'],
};

const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune',
  'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat',
  'Lucknow', 'Chandigarh', 'Indore', 'Noida', 'Gurgaon',
];

const FIRST_NAMES = [
  'Aarav','Vivaan','Aditya','Vihaan','Arjun','Sai','Reyansh','Ayaan','Krishna','Ishaan',
  'Ananya','Diya','Priya','Pooja','Sneha','Meera','Riya','Kavya','Nisha','Tanya',
  'Rohan','Raj','Nikhil','Amit','Rahul','Karan','Varun','Suresh','Deepak','Manish',
  'Neha','Swati','Anjali','Divya','Sunita','Rekha','Geeta','Asha','Shalini','Payal',
  'Aryan','Dev','Harsh','Shubham','Yash','Kunal','Mohit','Ravi','Sachin','Vikram',
  'Simran','Rupali','Komal','Preeti','Lata','Usha','Jyoti','Madhuri','Shruti','Pallavi',
];
const LAST_NAMES = [
  'Sharma','Verma','Patel','Gupta','Singh','Kumar','Shah','Mehta','Joshi','Agarwal',
  'Reddy','Nair','Iyer','Pillai','Menon','Rajan','Rao','Mishra','Tiwari','Pandey',
  'Malhotra','Kapoor','Chopra','Khanna','Bose','Banerjee','Chatterjee','Das','Sen','Roy',
  'Patil','Desai','Kulkarni','Jain','Bhatt','Trivedi','Saxena','Bajaj','Tandon','Sinha',
];

function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function generateEmail(first: string, last: string, id: number): string {
  const domains = ['gmail.com','outlook.com','yahoo.com','company.in','techcorp.io','startup.co'];
  const domain = domains[id % domains.length];
  return `${first.toLowerCase()}.${last.toLowerCase()}${id}@${domain}`;
}

function generatePhone(rand: () => number): string {
  const prefix = ['9','8','7','6'][Math.floor(rand() * 4)];
  let num = prefix;
  for (let i = 0; i < 9; i++) num += Math.floor(rand() * 10);
  return `+91 ${num.slice(0,5)} ${num.slice(5)}`;
}

function generateSalary(dept: string, position: string, rand: () => number): number {
  const base: Record<string, number> = {
    Engineering: 120000, 'Data Science': 130000, Product: 110000,
    Design: 90000, Finance: 95000, Legal: 105000,
    Marketing: 80000, Sales: 75000, HR: 70000, Operations: 72000,
  };
  const b = base[dept] ?? 80000;
  const seniority = position.toLowerCase().includes('senior') || position.toLowerCase().includes('lead') ? 1.5
    : position.toLowerCase().includes('head') || position.toLowerCase().includes('principal') ? 2
    : position.toLowerCase().includes('associate') || position.toLowerCase().includes('junior') ? 0.7
    : 1;
  const variance = 0.85 + rand() * 0.3;
  return Math.round(b * seniority * variance / 100) * 100;
}

function randomDate(startYear: number, endYear: number, rand: () => number): string {
  const year = startYear + Math.floor(rand() * (endYear - startYear + 1));
  const month = String(Math.floor(rand() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(rand() * 28) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateDummyEmployees(count = 120): Employee[] {
  const employees: Employee[] = [];
  for (let i = 0; i < count; i++) {
    const rand = rng(i * 7919 + 31337);
    const dept = pick(DEPARTMENTS, rand);
    const positions = POSITIONS[dept];
    const position = pick(positions, rand);
    const firstName = pick(FIRST_NAMES, rand);
    const lastName = pick(LAST_NAMES, rand);
    const city = pick(CITIES, rand);
    const salary = generateSalary(dept, position, rand);

    employees.push({
      id: i + 1,
      name: `${firstName} ${lastName}`,
      email: generateEmail(firstName, lastName, i + 1),
      phone: generatePhone(rand),
      city,
      department: dept,
      position,
      salary,
      age: 22 + Math.floor(rand() * 20),
      joining_date: randomDate(2018, 2024, rand),
      employee_code: `EMP${String(i + 1).padStart(4, '0')}`,
      status: rand() > 0.1 ? 'Active' : 'On Leave',
    });
  }
  return employees;
}