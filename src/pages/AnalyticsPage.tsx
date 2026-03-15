import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployees } from '../context/EmployeeContext';
import { getCityCoords, parseSalary } from '../utils/cityCoords';
import type { CityData } from '../types';
import Navbar from '../components/Navbar';

export default function AnalyticsPage() {
  const { employees, loading, fetchEmployees, mergedImages, isUsingDummyData } = useEmployees();
  const navigate = useNavigate();

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const cityData: CityData[] = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    employees.forEach(emp => {
      const city = String(emp.city ?? 'Unknown').trim();
      const sal = parseSalary(emp.salary);
      const cur = map.get(city) ?? { total: 0, count: 0 };
      map.set(city, { total: cur.total + sal, count: cur.count + 1 });
    });
    return Array.from(map.entries())
      .map(([city, { total, count }]) => ({
        city,
        totalSalary: total,
        avgSalary: count > 0 ? total / count : 0,
        count,
        ...getCityCoords(city),
      }))
      .sort((a, b) => b.totalSalary - a.totalSalary);
  }, [employees]);

  const top15 = cityData.slice(0, 15);
  const mergedCount = Object.keys(mergedImages).length;
  const totalSalaryBudget = employees.reduce((sum, e) => sum + parseSalary(e.salary), 0);
  const avgSalary = employees.length ? totalSalaryBudget / employees.length : 0;
  const topCity = cityData[0]?.city ?? '—';

  return (
    <div className="min-h-screen bg-ink-950">
      <Navbar />
      <main className="pt-14 max-w-screen-xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-ink-50 text-2xl font-display font-semibold">Analytics & Insights</h1>
          <p className="text-ink-400 text-sm font-body mt-1">Salary distribution across cities · Geospatial employee map</p>
        </div>

        {isUsingDummyData && (
          <div className="mb-6 flex items-center gap-3 bg-ink-800/80 border border-ink-600 rounded-xl px-4 py-3">
            <div className="w-2 h-2 rounded-full bg-acid animate-pulse shrink-0" />
            <p className="text-ink-300 text-xs font-mono">
              <span className="text-acid font-semibold">Demo mode</span> — analytics computed from 120 generated employees across 15 Indian cities.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'Total Employees', value: employees.length.toLocaleString(), sub: 'across all cities', color: 'text-acid', icon: '👥' },
            { label: 'Total Budget', value: `₹${(totalSalaryBudget/1e5).toFixed(1)}L`, sub: 'combined payroll', color: 'text-sky-electric', icon: '💰' },
            { label: 'Avg Salary', value: `₹${(avgSalary/1000).toFixed(1)}K`, sub: 'per employee', color: 'text-coral', icon: '📈' },
            { label: 'Top City', value: topCity, sub: `${cityData[0]?.count ?? 0} employees`, color: 'text-acid', icon: '🏙' },
            { label: 'Audits Done', value: mergedCount.toString(), sub: 'verified records', color: 'text-sky-electric', icon: '✅' },
          ].map(card => (
            <div key={card.label} className="bg-ink-900 border border-ink-700 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-ink-500 text-[10px] font-mono uppercase tracking-wider leading-tight">{card.label}</p>
                <span className="text-base">{card.icon}</span>
              </div>
              <p className={`text-xl font-display font-bold truncate ${card.color}`}>{loading ? '…' : card.value}</p>
              <p className="text-ink-600 text-[10px] font-mono mt-1">{card.sub}</p>
            </div>
          ))}
        </div>
        {mergedCount > 0 && (
          <div className="bg-ink-900 border border-ink-700 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-ink-50 text-lg font-display font-semibold">Audit Images</h2>
              <span className="text-acid text-sm font-mono bg-acid/10 border border-acid/20 px-2.5 py-1 rounded-lg">{mergedCount} records</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
              {Object.entries(mergedImages).map(([empId, data]) => {
                const emp = employees.find(e => String(e.id) === empId);
                return (
                  <div key={empId} className="group relative cursor-pointer" onClick={() => navigate(`/details/${empId}`)}>
                    <div className="rounded-xl overflow-hidden border border-ink-700 group-hover:border-acid/50 transition-colors aspect-video bg-ink-800">
                      <img src={data.dataUrl} alt={`Audit ${empId}`} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute inset-0 bg-ink-950/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                      <span className="text-acid text-xs font-mono bg-ink-900/80 px-2 py-1 rounded">View →</span>
                    </div>
                    <p className="text-ink-500 text-[10px] font-mono mt-1.5 truncate">{emp?.name ?? `ID ${empId}`}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-8">
          <div className="xl:col-span-2 bg-ink-900 border border-ink-700 rounded-2xl p-6 flex flex-col">
            <div className="flex items-start justify-between mb-1">
              <h2 className="text-ink-50 text-lg font-display font-semibold">Salary by City</h2>
              <span className="text-ink-600 text-[10px] font-mono bg-ink-800 border border-ink-700 px-2 py-1 rounded">Raw SVG</span>
            </div>
            <p className="text-ink-500 text-xs font-mono mb-4">Top {Math.min(top15.length, 12)} cities · hover bars for detail</p>
            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-6 h-6 border-2 border-acid/30 border-t-acid rounded-full animate-spin" />
                </div>
              ) : (
                <SalaryBarChart data={top15.slice(0, 12)} />
              )}
            </div>
          </div>
          <div className="xl:col-span-3 bg-ink-900 border border-ink-700 rounded-2xl p-6 flex flex-col">
            <div className="flex items-start justify-between mb-1">
              <h2 className="text-ink-50 text-lg font-display font-semibold">City Geospatial Distribution</h2>
              <span className="text-ink-600 text-[10px] font-mono bg-ink-800 border border-ink-700 px-2 py-1 rounded">Leaflet</span>
            </div>
            <p className="text-ink-500 text-xs font-mono mb-4">
              {cityData.length} cities mapped · circle size = total salary · click for details
            </p>
            <div className="flex-1 min-h-0">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-6 h-6 border-2 border-acid/30 border-t-acid rounded-full animate-spin" />
                </div>
              ) : (
                <CityMap cityData={cityData} />
              )}
            </div>
          </div>
        </div>
        <div className="bg-ink-900 border border-ink-700 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-ink-700 flex items-center justify-between">
            <h2 className="text-ink-50 text-lg font-display font-semibold">City Breakdown</h2>
            <span className="text-ink-500 text-xs font-mono">{cityData.length} cities total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-800 bg-ink-800/40">
                  {['#','City','Employees','Total Salary','Avg Salary','Budget Share'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-ink-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cityData.map((row, i) => (
                  <tr key={row.city}
                    className={`border-b border-ink-800/40 hover:bg-ink-800/30 transition-colors ${i % 2 === 1 ? 'bg-ink-900/30' : ''}`}>
                    <td className="px-5 py-3 text-ink-700 font-mono text-xs">{i + 1}</td>
                    <td className="px-5 py-3 text-ink-100 font-body text-sm font-medium">{row.city}</td>
                    <td className="px-5 py-3 font-mono text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-acid/60" />
                        <span className="text-ink-200">{row.count}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-acid font-mono text-sm font-medium">
                      ₹{row.totalSalary.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3 text-ink-300 font-mono text-sm">
                      ₹{Math.round(row.avgSalary).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5 min-w-28">
                        <div className="h-1.5 bg-ink-700 rounded-full flex-1">
                          <div className="h-full rounded-full transition-all"
                            style={{
                              width: `${(row.totalSalary / (cityData[0]?.totalSalary || 1)) * 100}%`,
                              background: `rgba(181,255,71,${0.3 + 0.7 * (row.totalSalary / (cityData[0]?.totalSalary || 1))})`
                            }} />
                        </div>
                        <span className="text-ink-500 text-xs font-mono shrink-0">
                          {totalSalaryBudget > 0 ? ((row.totalSalary / totalSalaryBudget) * 100).toFixed(1) : '0.0'}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function SalaryBarChart({ data }: { data: CityData[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const W = 460, H = 340;
  const PAD = { top: 24, right: 16, bottom: 90, left: 72 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  if (!data.length) return (
    <div className="flex items-center justify-center h-48 text-ink-600 text-sm font-body">No data yet</div>
  );

  const maxVal = Math.max(...data.map(d => d.totalSalary));
  const barW = Math.floor(chartW / data.length) - 5;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => f * maxVal);
  const formatK = (v: number) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e5 ? `${(v/1e5).toFixed(0)}L` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : `${v}`;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b5ff47" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#b5ff47" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="barGradHov" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#b5ff47" stopOpacity="0.6" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {yTicks.map((tick, i) => {
          const y = PAD.top + chartH * (1 - tick / maxVal);
          return (
            <g key={i}>
              <line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y}
                stroke={i === 0 ? '#333352' : '#1a1a2e'} strokeWidth={i === 0 ? '1.5' : '1'} />
              <text x={PAD.left - 6} y={y + 3.5} textAnchor="end" fill="#44446e" fontSize="9">{formatK(tick)}</text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const barH = maxVal > 0 ? (d.totalSalary / maxVal) * chartH : 0;
          const x = PAD.left + i * (chartW / data.length) + 2;
          const y = PAD.top + chartH - barH;
          const isHov = hovered === i;

          return (
            <g key={d.city}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}>
              {isHov && (
                <rect x={x - 2} y={y - 2} width={barW + 4} height={barH + 4}
                  fill="rgba(181,255,71,0.15)" rx="5" filter="url(#glow)" />
              )}
              <rect x={x} y={y} width={barW} height={barH}
                fill={isHov ? 'url(#barGradHov)' : 'url(#barGrad)'} rx="3" />
              {barH > 4 && <rect x={x} y={y} width={barW} height={3} fill="#b5ff47" rx="3" opacity={isHov ? 1 : 0.8} />}
              <text x={x + barW / 2} y={PAD.top + chartH + 12}
                textAnchor="end"
                transform={`rotate(-40, ${x + barW / 2}, ${PAD.top + chartH + 12})`}
                fill={isHov ? '#e0e0eb' : '#44446e'} fontSize="8.5" fontWeight={isHov ? 'bold' : 'normal'}>
                {d.city.length > 10 ? d.city.slice(0, 9) + '…' : d.city}
              </text>
              {isHov && barH > 16 && (
                <text x={x + barW / 2} y={y - 7} textAnchor="middle" fill="#b5ff47" fontSize="9" fontWeight="bold">
                  {formatK(d.totalSalary)}
                </text>
              )}
            </g>
          );
        })}

        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + chartH} stroke="#333352" strokeWidth="1.5" />
        <line x1={PAD.left} y1={PAD.top + chartH} x2={PAD.left + chartW} y2={PAD.top + chartH} stroke="#333352" strokeWidth="1.5" />
        <text x={14} y={PAD.top + chartH / 2} textAnchor="middle" fill="#44446e" fontSize="8"
          transform={`rotate(-90, 14, ${PAD.top + chartH / 2})`}>
          Total Salary (₹)
        </text>
      </svg>
      {hovered !== null && data[hovered] && (
        <div className="absolute top-2 right-2 bg-ink-800 border border-acid/30 rounded-xl px-3 py-2.5 text-xs font-mono pointer-events-none shadow-lg shadow-ink-950/50">
          <p className="text-acid font-semibold mb-1">{data[hovered].city}</p>
          <p className="text-ink-300">Employees: <span className="text-ink-100">{data[hovered].count}</span></p>
          <p className="text-ink-300">Total: <span className="text-acid">₹{data[hovered].totalSalary.toLocaleString('en-IN')}</span></p>
          <p className="text-ink-300">Avg: <span className="text-ink-100">₹{Math.round(data[hovered].avgSalary).toLocaleString('en-IN')}</span></p>
        </div>
      )}
    </div>
  );
}

function CityMap({ cityData }: { cityData: CityData[] }) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);

  useEffect(() => {
    if (!mapRef.current || cityData.length === 0) return;
    if (mapInstanceRef.current) return;

    import('leaflet').then(L => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: [22, 80],
        zoom: 4,
        zoomControl: true,
        attributionControl: true,
        minZoom: 2,
        maxZoom: 12,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://openstreetmap.org">OSM</a> © <a href="https://carto.com">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      const maxSal = Math.max(...cityData.map(d => d.totalSalary), 1);

      cityData.forEach(d => {
        const ratio = d.totalSalary / maxSal;
        const radius = 7 + ratio * 22;
        const fillOpacity = 0.55 + ratio * 0.35;

        const circle = L.circleMarker([d.lat, d.lng], {
          radius,
          fillColor: '#b5ff47',
          color: '#0d0d14',
          weight: 1.5,
          opacity: 0.8,
          fillOpacity,
        });

        circle.bindTooltip(
          `<div style="font-family:monospace;font-size:11px;background:#16161f;color:#b5ff47;padding:6px 10px;border-radius:8px;border:1px solid #333352;white-space:nowrap">
            <strong>${d.city}</strong><br/>
            <span style="color:#9292b8">${d.count} employees · avg ₹${Math.round(d.avgSalary).toLocaleString('en-IN')}</span>
          </div>`,
          { permanent: false, direction: 'top', offset: [0, -radius] }
        );

        circle.addTo(map);
      });

      if (cityData.length > 0) {
        const bounds = L.latLngBounds(cityData.map(d => [d.lat, d.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [40, 40] });
      }

      mapInstanceRef.current = map;
      setMapReady(true);
    });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [cityData]);

  return (
    <div className="relative h-full min-h-64">
      <div ref={mapRef} className="w-full h-full min-h-64 rounded-xl overflow-hidden border border-ink-600"
        style={{ height: 360 }} />
      {!mapReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink-800/90 rounded-xl">
          <div className="w-8 h-8 border-2 border-acid/30 border-t-acid rounded-full animate-spin mb-3" />
          <p className="text-ink-400 text-sm font-body">Loading map…</p>
        </div>
      )}
      {mapReady && (
        <div className="absolute bottom-3 left-3 bg-ink-900/90 backdrop-blur-sm border border-ink-700 rounded-xl p-3 text-xs font-mono">
          <p className="text-ink-400 mb-2 uppercase tracking-wider text-[10px]">Circle size = Total salary</p>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-acid/50 border border-acid/30" style={{ width: 10, height: 10 }} />
            <span className="text-ink-500">Low payroll</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-acid/80 border border-acid/60 flex items-center justify-center" style={{ width: 18, height: 18 }} />
            <span className="text-ink-300">High payroll</span>
          </div>
        </div>
      )}

      {selectedCity && (
        <div className="absolute top-3 right-3 bg-ink-900/95 border border-acid/40 rounded-xl p-3 text-xs font-mono shadow-xl">
          <p className="text-acid font-bold mb-1">{selectedCity.city}</p>
          <p className="text-ink-300">Employees: {selectedCity.count}</p>
          <p className="text-ink-300">Avg: ₹{Math.round(selectedCity.avgSalary).toLocaleString('en-IN')}</p>
          <button onClick={() => setSelectedCity(null)} className="text-ink-600 hover:text-ink-400 mt-1 text-[10px]">✕ close</button>
        </div>
      )}
    </div>
  );
}