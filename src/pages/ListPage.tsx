import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployees } from '../context/EmployeeContext';
import { useVirtualization } from '../hooks/useVirtualization';
import type { Employee } from '../types';
import Navbar from '../components/Navbar';

const ROW_HEIGHT = 68;
const CONTAINER_HEIGHT = typeof window !== 'undefined' ? window.innerHeight - 180 : 600;

type SortKey = keyof Employee | '';
type SortDir = 'asc' | 'desc';

export default function ListPage() {
  const { employees, loading, error, isUsingDummyData, fetchEmployees } = useEmployees();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const filtered = useMemo(() => {
    let data = [...employees];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(e =>
        String(e.name ?? '').toLowerCase().includes(q) ||
        String(e.email ?? '').toLowerCase().includes(q) ||
        String(e.city ?? '').toLowerCase().includes(q) ||
        String(e.department ?? '').toLowerCase().includes(q)
      );
    }
    if (sortKey) {
      data.sort((a, b) => {
        const av = a[sortKey] ?? '';
        const bv = b[sortKey] ?? '';
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return data;
  }, [employees, search, sortKey, sortDir]);

  const { visibleItems, totalHeight, containerRef } = useVirtualization({
    totalItems: filtered.length,
    itemHeight: ROW_HEIGHT,
    containerHeight: CONTAINER_HEIGHT,
    bufferSize: 8,
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const columns: { key: keyof Employee; label: string; width: string }[] = [
    { key: 'id', label: '#', width: 'w-16' },
    { key: 'name', label: 'Name', width: 'flex-1' },
    { key: 'email', label: 'Email', width: 'w-56' },
    { key: 'city', label: 'City', width: 'w-32' },
    { key: 'department', label: 'Dept', width: 'w-36' },
    { key: 'salary', label: 'Salary', width: 'w-28' },
  ];

  const SortIcon = ({ col }: { col: keyof Employee }) => (
    <span className={`ml-1 transition-opacity ${sortKey === col ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
      {sortKey === col && sortDir === 'desc' ? '↓' : '↑'}
    </span>
  );

  return (
    <div className="min-h-screen bg-ink-950">
      <Navbar />
      <main className="pt-14 max-w-screen-2xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-ink-50 text-2xl font-display font-semibold">Employee Directory</h1>
            <p className="text-ink-400 text-sm font-body mt-0.5">
              {loading ? 'Loading…' : `${filtered.length} of ${employees.length} employees`}
            </p>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, city…"
              className="bg-ink-800 border border-ink-600 text-ink-100 placeholder-ink-600 rounded-lg pl-10 pr-4 py-2.5 text-sm font-body focus:outline-none focus:border-acid/60 focus:ring-1 focus:ring-acid/20 w-72 transition-all"
            />
          </div>
        </div>

        {isUsingDummyData && (
          <div className="mb-4 flex items-center gap-3 bg-ink-800/80 border border-ink-600 rounded-xl px-4 py-3">
            <div className="w-2 h-2 rounded-full bg-acid animate-pulse shrink-0" />
            <p className="text-ink-300 text-xs font-mono">
              <span className="text-acid font-semibold">Demo mode</span> — showing 120 generated employees. Live API data will replace this automatically when available.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-coral/10 border border-coral/30 rounded-xl p-4 text-coral text-sm font-body">
            ⚠ {error}
          </div>
        )}
        <div className="bg-ink-900 border border-ink-700 rounded-2xl overflow-hidden">
          <div className="flex items-center px-4 py-3 border-b border-ink-700 bg-ink-800/50">
            {columns.map(col => (
              <button
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={`group flex items-center text-left text-xs font-mono uppercase tracking-wider text-ink-400 hover:text-acid transition-colors ${col.width} ${col.key !== 'id' ? 'px-2' : ''}`}
              >
                {col.label}
                <SortIcon col={col.key} />
              </button>
            ))}
            <div className="w-28 text-right text-xs font-mono uppercase tracking-wider text-ink-400 shrink-0">
              Action
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-acid/30 border-t-acid rounded-full animate-spin mx-auto mb-3" />
                <p className="text-ink-400 text-sm font-body">Fetching employees…</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-24">
              <p className="text-ink-500 font-body">No employees found</p>
            </div>
          ) : (
            <div
              ref={containerRef}
              className="overflow-auto"
              style={{ height: Math.min(CONTAINER_HEIGHT, filtered.length * ROW_HEIGHT) }}
            >
              <div style={{ height: totalHeight, position: 'relative' }}>
                {visibleItems.map(({ index, offsetTop }) => {
                  const emp = filtered[index];
                  return (
                    <EmployeeRow
                      key={emp.id}
                      employee={emp}
                      offsetTop={offsetTop}
                      rowHeight={ROW_HEIGHT}
                      columns={columns}
                      onView={() => navigate(`/details/${emp.id}`)}
                      isEven={index % 2 === 0}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {!loading && filtered.length > 0 && (
          <p className="text-ink-600 text-xs font-mono mt-3 text-right">
            Rendering {visibleItems.length} / {filtered.length} rows · Custom virtualization active
          </p>
        )}
      </main>
    </div>
  );
}

function EmployeeRow({
  employee, offsetTop, rowHeight, columns, onView, isEven
}: {
  employee: Employee;
  offsetTop: number;
  rowHeight: number;
  columns: { key: keyof Employee; label: string; width: string }[];
  onView: () => void;
  isEven: boolean;
}) {
  const initials = String(employee.name ?? '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  const hueMap: Record<string, string> = { A: '#b5ff47', B: '#47c8ff', C: '#ff6b6b', D: '#ffb347', E: '#c77dff' };
  const color = hueMap[initials[0]] ?? '#9292b8';

  return (
    <div
      className={`absolute left-0 right-0 flex items-center px-4 border-b border-ink-800/60 group hover:bg-ink-800/40 transition-colors cursor-default ${isEven ? '' : 'bg-ink-900/40'}`}
      style={{ top: offsetTop, height: rowHeight }}
    >
      {columns.map(col => (
        <div key={col.key} className={`${col.width} ${col.key !== 'id' ? 'px-2' : ''} font-body text-sm truncate`}>
          {col.key === 'name' ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-mono font-bold"
                style={{ backgroundColor: color + '22', color }}>
                {initials}
              </div>
              <span className="text-ink-100 truncate">{String(employee.name ?? '—')}</span>
            </div>
          ) : col.key === 'salary' ? (
            <span className="text-acid font-mono font-medium">
              ₹{Number(employee.salary ?? 0).toLocaleString('en-IN')}
            </span>
          ) : col.key === 'id' ? (
            <span className="text-ink-500 font-mono text-xs">{String(employee.id)}</span>
          ) : (
            <span className="text-ink-300 truncate">{String(employee[col.key] ?? '—')}</span>
          )}
        </div>
      ))}
      <div className="w-28 flex justify-end shrink-0">
        <button
          onClick={onView}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-ink-950 bg-acid hover:bg-acid-dark rounded-md transition-all font-semibold shadow-sm shadow-acid/20"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View
        </button>
      </div>
    </div>
  );
}