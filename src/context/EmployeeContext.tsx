import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { Employee, MergedImageData } from '../types';
import { generateDummyEmployees } from '../utils/dummyData';

interface EmployeeContextType {
  employees: Employee[];
  loading: boolean;
  error: string | null;
  isUsingDummyData: boolean;
  fetchEmployees: () => Promise<void>;
  mergedImages: Record<string, MergedImageData>;
  saveMergedImage: (employeeId: string | number, data: MergedImageData) => void;
}

const EmployeeContext = createContext<EmployeeContextType | null>(null);

function guessDept(position: string): string {
  const p = position.toLowerCase();
  if (p.includes('engineer') || p.includes('developer') || p.includes('architect') || p.includes('technical')) return 'Engineering';
  if (p.includes('designer') || p.includes('ux') || p.includes('ui')) return 'Design';
  if (p.includes('marketing') || p.includes('cmo')) return 'Marketing';
  if (p.includes('sales') || p.includes('pre-sales') || p.includes('post-sales')) return 'Sales';
  if (p.includes('finance') || p.includes('financial') || p.includes('accountant') || p.includes('cfo')) return 'Finance';
  if (p.includes('ceo') || p.includes('coo') || p.includes('director') || p.includes('manager') || p.includes('lead')) return 'Management';
  if (p.includes('support') || p.includes('secretary') || p.includes('office')) return 'Operations';
  if (p.includes('data') || p.includes('coordinator')) return 'Data';
  if (p.includes('hr') || p.includes('personnel')) return 'HR';
  if (p.includes('legal') || p.includes('compliance')) return 'Legal';
  return 'General';
}

function toEmail(name: string, idx: number): string {
  return name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '') + (idx + 1) + '@company.com';
}

export function EmployeeProvider({ children }: { children: React.ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingDummyData, setIsUsingDummyData] = useState(false);
  const [mergedImages, setMergedImages] = useState<Record<string, MergedImageData>>({});
  const hasFetched = useRef(false);

  const fetchEmployees = useCallback(async () => {
    if (hasFetched.current && employees.length > 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('https://backend.jotish.in/backend_dev/gettabledata.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test', password: '123456' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      const rows: string[][] = raw?.TABLE_DATA?.data ?? [];
      const normalized: Employee[] = rows.map((row, i) => ({
        id: i + 1,
        name:         row[0] ?? '—',
        position:     row[1] ?? '—',
        city:         row[2] ?? '—',
        extn:         row[3] ?? '—',
        joining_date: row[4] ?? '—',
        salary:       parseFloat(String(row[5] ?? '0').replace(/[$,]/g, '')) || 0,
        department:   guessDept(row[1] ?? ''),
        email:        toEmail(row[0] ?? '', i),
      }));

      if (normalized.length > 0) {
        setEmployees(normalized);
        setIsUsingDummyData(false);
      } else {
        setEmployees(generateDummyEmployees(120));
        setIsUsingDummyData(true);
      }
      hasFetched.current = true;
    } catch (_err) {
      setEmployees(generateDummyEmployees(120));
      setIsUsingDummyData(true);
      hasFetched.current = true;
    } finally {
      setLoading(false);
    }
  }, [employees.length]);

  const saveMergedImage = useCallback((employeeId: string | number, data: MergedImageData) => {
    setMergedImages(prev => ({ ...prev, [String(employeeId)]: data }));
  }, []);

  return (
    <EmployeeContext.Provider value={{ employees, loading, error, isUsingDummyData, fetchEmployees, mergedImages, saveMergedImage }}>
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployees(): EmployeeContextType {
  const ctx = useContext(EmployeeContext);
  if (!ctx) throw new Error('useEmployees must be used inside EmployeeProvider');
  return ctx;
}