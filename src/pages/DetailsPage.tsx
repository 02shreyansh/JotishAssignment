import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEmployees } from '../context/EmployeeContext';
import type { Employee } from '../types';
import Navbar from '../components/Navbar';

type Stage = 'info' | 'camera' | 'signature' | 'done';
type CameraStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'error';

export default function DetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { employees, fetchEmployees, saveMergedImage, mergedImages } = useEmployees();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [stage, setStage] = useState<Stage>('info');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [mergedResult, setMergedResult] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [camError, setCamError] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const photoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const sigInitialized = useRef(false);

  const videoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
      node.onloadedmetadata = () => node.play();
    }
  }, []);

  useEffect(() => {
    if (employees.length === 0) fetchEmployees();
  }, [employees.length, fetchEmployees]);

  useEffect(() => {
    if (id && employees.length > 0) {
      const emp = employees.find(e => String(e.id) === id);
      setEmployee(emp ?? null);
      if (emp && mergedImages[String(emp.id)]) {
        setMergedResult(mergedImages[String(emp.id)].dataUrl);
        setStage('done');
      }
    }
  }, [id, employees, mergedImages]);

  const startCamera = useCallback(async (facing: 'user' | 'environment' = 'user') => {
    setCameraStatus('requesting');
    setCamError('');
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => videoRef.current?.play();
      }

      setCameraStatus('active');
      setFacingMode(facing);
      setStage('camera');
    } catch (err) {
      const e = err as DOMException;
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
        setCamError('Camera permission denied. You can upload a photo instead.');
      } else if (e.name === 'NotFoundError') {
        setCameraStatus('error');
        setCamError('No camera found on this device. Please upload a photo.');
      } else {
        setCameraStatus('error');
        setCamError(`Camera unavailable: ${e.message}`);
      }
      setStage('camera');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const flipCamera = useCallback(() => {
    const next: 'user' | 'environment' = facingMode === 'user' ? 'environment' : 'user';
    startCamera(next);
  }, [facingMode, startCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !photoCanvasRef.current) return;
    const video = videoRef.current;
    const canvas = photoCanvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d')!;
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedPhoto(dataUrl);
    stopCamera();
    sigInitialized.current = false;
    setStage('signature');
  }, [stopCamera, facingMode]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCapturedPhoto(dataUrl);
      stopCamera();
      sigInitialized.current = false;
      setStage('signature');
    };
    reader.readAsDataURL(file);
  }, [stopCamera]);

  useEffect(() => { return () => stopCamera(); }, [stopCamera]);

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    isDrawing.current = true;
    if (sigCanvasRef.current) lastPos.current = getCanvasPos(e, sigCanvasRef.current);
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing.current || !sigCanvasRef.current || !lastPos.current) return;
    const canvas = sigCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const pos = getCanvasPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#b5ff47';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#b5ff47';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
    lastPos.current = pos;
  }, []);

  const endDrawing = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
  }, []);

  const initSigCanvas = useCallback(() => {
    if (!sigCanvasRef.current || !capturedPhoto || sigInitialized.current) return;
    const canvas = sigCanvasRef.current;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height - canvas.height * 0.18;
      ctx.strokeStyle = 'rgba(181,255,71,0.5)';
      ctx.setLineDash([16, 10]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 140, cy);
      ctx.lineTo(cx + 140, cy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(181,255,71,0.55)';
      const fSize = Math.max(12, Math.floor(canvas.width / 28));
      ctx.font = `bold ${fSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('✍ SIGN ABOVE THIS LINE', cx, cy + fSize + 10);
      ctx.textAlign = 'left';
      sigInitialized.current = true;
    };
    img.src = capturedPhoto;
  }, [capturedPhoto]);

  const clearSignature = useCallback(() => {
    sigInitialized.current = false;
    initSigCanvas();
  }, [initSigCanvas]);

  useEffect(() => {
    if (stage === 'signature') initSigCanvas();
  }, [stage, initSigCanvas]);

  const mergeAndSave = useCallback(() => {
    if (!sigCanvasRef.current || !employee) return;
    const canvas = sigCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const barH = Math.max(56, canvas.height * 0.08);
    ctx.fillStyle = 'rgba(8,8,16,0.88)';
    ctx.fillRect(0, canvas.height - barH, canvas.width, barH);
    ctx.fillStyle = '#b5ff47';
    ctx.fillRect(0, canvas.height - barH, 5, barH);
    const fSize = Math.max(11, Math.floor(canvas.width / 52));
    ctx.fillStyle = '#b5ff47';
    ctx.font = `bold ${fSize + 2}px monospace`;
    ctx.fillText(`${employee.name}  ·  ID: ${employee.id}`, 16, canvas.height - barH + fSize + 8);
    ctx.fillStyle = '#636399';
    ctx.font = `${fSize}px monospace`;
    const dept = employee.department ?? '';
    const city = employee.city ? '· ' + employee.city : '';
    ctx.fillText(`${dept} ${city} · Verified: ${new Date().toLocaleString()}`, 16, canvas.height - barH + fSize * 2 + 14);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.93);
    setMergedResult(dataUrl);
    saveMergedImage(employee.id, { dataUrl, employeeId: employee.id, capturedAt: Date.now() });
    setStage('done');
  }, [employee, saveMergedImage]);

  const initials = employee ? String(employee.name ?? '?').split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase() : '??';
  const colorPalette: Record<string, string> = { A: '#b5ff47', B: '#47c8ff', C: '#ff6b6b', D: '#ffb347', E: '#c77dff', F: '#b5ff47', G: '#47c8ff', H: '#ff6b6b' };
  const avatarColor = colorPalette[initials[0]] ?? '#9292b8';
  const knownFields = ['id', 'name', 'email', 'phone', 'city', 'department', 'position', 'salary', 'age', 'joining_date'];
  const allFields = employee ? [
    { label: 'Employee ID', value: employee.id },
    { label: 'Email', value: employee.email },
    { label: 'Phone', value: employee.phone },
    { label: 'City', value: employee.city },
    { label: 'Department', value: employee.department },
    { label: 'Position', value: employee.position },
    { label: 'Salary', value: employee.salary ? `₹${Number(employee.salary).toLocaleString('en-IN')}` : undefined },
    { label: 'Age', value: employee.age },
    { label: 'Joining Date', value: employee.joining_date },
    ...Object.entries(employee)
      .filter(([k]) => !knownFields.includes(k))
      .map(([k, v]) => ({ label: k.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()), value: v })),
  ].filter(f => f.value !== undefined && f.value !== null && String(f.value).trim() !== '') : [];

  const STAGES: Stage[] = ['info', 'camera', 'signature', 'done'];
  const STAGE_LABELS: Record<Stage, string> = { info: 'Profile', camera: 'Camera', signature: 'Signature', done: 'Verified' };

  if (!employee && employees.length > 0) {
    return (
      <div className="min-h-screen bg-ink-950">
        <Navbar />
        <div className="pt-32 flex flex-col items-center justify-center">
          <p className="text-coral text-lg font-display">Employee not found</p>
          <button onClick={() => navigate('/list')} className="mt-4 text-acid text-sm font-mono hover:underline">← Back to list</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <Navbar />
      <main className="pt-14 max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-5 text-sm font-mono">
          <button onClick={() => navigate('/list')} className="text-ink-500 hover:text-acid transition-colors flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Employees
          </button>
          <span className="text-ink-700">/</span>
          <span className="text-ink-300">{employee?.name ?? `#${id}`}</span>
        </div>
        <div className="flex items-stretch gap-1 mb-8 bg-ink-900 border border-ink-700 rounded-xl p-1.5">
          {STAGES.map((s, i) => {
            const idx = STAGES.indexOf(stage);
            const done = i < idx;
            const active = i === idx;
            return (
              <div key={s}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-lg text-xs font-mono transition-all ${active ? 'bg-acid text-ink-950 font-semibold shadow-lg shadow-acid/20' : done ? 'text-ink-400 bg-ink-800/40' : 'text-ink-700'}`}>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 transition-all
                  ${active ? 'border-ink-950/30 bg-ink-950/20' : done ? 'border-acid/60 bg-acid/10 text-acid' : 'border-ink-700'}`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className="hidden sm:block">{STAGE_LABELS[s]}</span>
              </div>
            );
          })}
        </div>
        {stage === 'info' && employee && (
          <div className="animate-fade-up space-y-5">
            <div className="bg-ink-900 border border-ink-700 rounded-2xl overflow-hidden">
              <div className="h-28 relative"
                style={{ background: `linear-gradient(135deg, ${avatarColor}18 0%, #16161f 60%)` }}>
                <div className="absolute inset-0 opacity-30"
                  style={{ backgroundImage: 'linear-gradient(#ffffff08 1px, transparent 1px), linear-gradient(90deg, #ffffff08 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <div className="absolute bottom-0 left-8 translate-y-1/2">
                  <div className="w-20 h-20 rounded-2xl border-4 border-ink-900 flex items-center justify-center text-2xl font-display font-bold"
                    style={{ background: `linear-gradient(135deg, ${avatarColor}25, ${avatarColor}10)`, color: avatarColor }}>
                    {initials}
                  </div>
                </div>
              </div>
              <div className="pt-14 px-8 pb-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h1 className="text-ink-50 text-2xl font-display font-semibold">{employee.name}</h1>
                    <p className="text-ink-400 font-body mt-0.5 text-sm">{employee.position ?? employee.department ?? 'Employee'}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="inline-flex items-center gap-1 bg-acid/10 text-acid px-2.5 py-1 rounded-md text-xs font-mono border border-acid/20">
                        ID #{employee.id}
                      </span>
                      {employee.city && (
                        <span className="inline-flex items-center gap-1 bg-ink-800 text-ink-300 px-2.5 py-1 rounded-md text-xs font-mono border border-ink-600">
                          📍 {String(employee.city)}
                        </span>
                      )}
                      {employee.department && (
                        <span className="inline-flex items-center gap-1 bg-ink-800 text-ink-300 px-2.5 py-1 rounded-md text-xs font-mono border border-ink-600">
                          🏢 {String(employee.department)}
                        </span>
                      )}
                    </div>
                  </div>
                  {employee.salary && (
                    <div className="text-right bg-acid/5 border border-acid/20 rounded-xl px-4 py-3">
                      <p className="text-ink-500 text-xs font-mono uppercase tracking-wider mb-1">CTC / Salary</p>
                      <p className="text-acid text-xl font-display font-bold">₹{Number(employee.salary).toLocaleString('en-IN')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-ink-900 border border-ink-700 rounded-2xl p-6">
              <h2 className="text-ink-400 text-xs font-mono uppercase tracking-widest mb-4">Employee Details</h2>
              {allFields.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {allFields.map(field => (
                    <div key={String(field.label)} className="bg-ink-800/50 rounded-xl p-3.5 border border-ink-700/60 hover:border-ink-500/50 transition-colors">
                      <p className="text-ink-500 text-[10px] font-mono uppercase tracking-wider mb-1.5">{String(field.label)}</p>
                      <p className="text-ink-100 font-body text-sm truncate" title={String(field.value)}>{String(field.value)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-ink-600 text-sm font-body">No additional data available.</p>
              )}
            </div>
            <div className="bg-ink-900 border border-ink-700 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-ink-50 text-base font-display font-semibold">Identity Verification</h2>
                <p className="text-ink-400 text-sm font-body mt-0.5">Capture photo + signature to generate an audit record.</p>
              </div>
              <button
                onClick={() => startCamera('user')}
                className="flex items-center gap-2.5 bg-acid hover:bg-acid-dark text-ink-950 font-display font-semibold px-5 py-3 rounded-xl transition-all group shadow-lg shadow-acid/20 shrink-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Open Camera
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        )}
        {stage === 'camera' && (
          <div className="animate-fade-up">
            <div className="bg-ink-900 border border-ink-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-ink-50 text-xl font-display font-semibold">Capture Profile Photo</h2>
                  <p className="text-ink-400 text-sm font-body mt-1">
                    {cameraStatus === 'active' ? 'Centre your face in the oval guide, then press the shutter button.' : 'Camera unavailable — upload a photo to continue.'}
                  </p>
                </div>
                {cameraStatus === 'active' && (
                  <div className="flex items-center gap-2 bg-coral/10 border border-coral/30 rounded-lg px-3 py-1.5">
                    <div className="w-2 h-2 rounded-full bg-coral animate-pulse" />
                    <span className="text-coral text-xs font-mono font-bold">● REC</span>
                  </div>
                )}
              </div>
              {cameraStatus === 'active' && (
                <div className="relative rounded-xl overflow-hidden bg-ink-950 border border-ink-700 max-w-lg mx-auto mb-5"
                  style={{ aspectRatio: '4/3' }}>
                  <video
                    ref={videoCallbackRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                  />
                  {(['top-4 left-4 border-t-2 border-l-2 rounded-tl-lg', 'top-4 right-4 border-t-2 border-r-2 rounded-tr-lg', 'bottom-20 left-4 border-b-2 border-l-2 rounded-bl-lg', 'bottom-20 right-4 border-b-2 border-r-2 rounded-br-lg'] as const).map((cls) => (
                    <div key={cls} className={`absolute ${cls} w-8 h-8 border-acid/60`} />
                  ))}
                  <div className="absolute inset-0 flex items-start justify-center pt-8 pointer-events-none">
                    <div className="w-36 h-48 border-2 border-acid/40 rounded-full border-dashed opacity-80" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink-950 to-transparent pt-8 pb-4 flex items-center justify-between px-6">
                    <button onClick={flipCamera}
                      className="w-10 h-10 bg-ink-800/80 hover:bg-ink-700 rounded-full flex items-center justify-center transition-all border border-ink-600 hover:border-ink-400"
                      title="Flip camera">
                      <svg className="w-5 h-5 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button onClick={capturePhoto}
                      className="w-16 h-16 rounded-full border-4 border-ink-900 bg-white hover:bg-acid transition-all hover:scale-110 shadow-xl flex items-center justify-center group">
                      <div className="w-10 h-10 rounded-full bg-ink-900 group-hover:scale-90 transition-transform" />
                    </button>
                    <div className="w-10 flex justify-center">
                      <span className="text-ink-500 text-[10px] font-mono">{facingMode === 'user' ? '🤳' : '📷'}</span>
                    </div>
                  </div>
                </div>
              )}

              {cameraStatus === 'requesting' && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-14 h-14 border-2 border-acid/20 border-t-acid rounded-full animate-spin mb-4" />
                  <p className="text-ink-300 font-body">Requesting camera access…</p>
                  <p className="text-ink-500 text-sm font-mono mt-2">Allow the browser prompt to continue</p>
                </div>
              )}

              {(cameraStatus === 'denied' || cameraStatus === 'error') && (
                <div className="space-y-4 mb-4">
                  <div className="flex items-start gap-3 bg-coral/10 border border-coral/30 rounded-xl p-4">
                    <svg className="w-5 h-5 text-coral shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-coral text-sm font-body font-semibold">Camera Unavailable</p>
                      <p className="text-coral/70 text-xs mt-0.5">{camError}</p>
                    </div>
                  </div>
                  <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-ink-600 hover:border-acid/50 rounded-xl p-10 text-center transition-all cursor-pointer group bg-ink-800/30 hover:bg-ink-800/60">
                    <svg className="w-12 h-12 text-ink-600 group-hover:text-acid/60 mb-3 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-ink-300 font-body text-sm group-hover:text-ink-100 transition-colors font-semibold">Upload a Photo</p>
                    <p className="text-ink-600 text-xs font-mono mt-1">JPG · PNG · WebP · HEIC</p>
                    <input type="file" accept="image/*" capture="user" className="hidden" onChange={handleFileUpload} />
                  </label>
                  <button onClick={() => startCamera('user')}
                    className="w-full py-2.5 bg-ink-800 hover:bg-ink-700 text-ink-300 hover:text-ink-100 text-sm font-body rounded-xl border border-ink-600 transition-all">
                    ↻ Retry Camera
                  </button>
                </div>
              )}

              <canvas ref={photoCanvasRef} className="hidden" />
              <button onClick={() => { stopCamera(); setStage('info'); setCameraStatus('idle'); }}
                className="mt-2 text-ink-500 text-sm font-mono hover:text-ink-300 transition-colors flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Profile
              </button>
            </div>
          </div>
        )}

        {stage === 'signature' && (
          <div className="animate-fade-up">
            <div className="bg-ink-900 border border-ink-700 rounded-2xl p-6">
              <h2 className="text-ink-50 text-xl font-display font-semibold mb-1">Draw Your Signature</h2>
              <p className="text-ink-400 text-sm font-body mb-1">Sign directly over your captured photo using mouse or touch.</p>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-4 h-1 rounded-full bg-acid/70" />
                <p className="text-ink-500 text-xs font-mono">Drawn in <span className="text-acid">acid green</span> with glow effect</p>
              </div>
              <div className="relative max-w-lg mx-auto mb-5">
                <canvas
                  ref={sigCanvasRef}
                  className="w-full rounded-xl border border-ink-600 cursor-crosshair touch-none select-none block"
                  style={{ aspectRatio: '4/3' }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={endDrawing}
                  onMouseLeave={endDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={endDrawing}
                />
                <div className="absolute top-3 right-3 bg-ink-900/80 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs font-mono text-ink-400 border border-ink-700">
                  ✏ Sign here
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={mergeAndSave}
                  className="flex items-center gap-2 bg-acid hover:bg-acid-dark text-ink-950 font-display font-semibold px-5 py-3 rounded-xl transition-all shadow-md shadow-acid/20">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Merge & Verify
                </button>
                <button onClick={clearSignature}
                  className="flex items-center gap-2 px-4 py-3 bg-ink-800 text-ink-300 font-body rounded-xl hover:bg-ink-700 transition-all text-sm border border-ink-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </button>
                <button onClick={() => { setCapturedPhoto(null); sigInitialized.current = false; startCamera('user'); }}
                  className="text-ink-500 text-sm font-mono hover:text-ink-300 ml-auto transition-colors">
                  ← Retake Photo
                </button>
              </div>
            </div>
          </div>
        )}

        {stage === 'done' && mergedResult && (
          <div className="animate-fade-up">
            <div className="bg-ink-900 border border-ink-700 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6 p-4 bg-acid/10 border border-acid/30 rounded-xl">
                <div className="w-9 h-9 bg-acid rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-ink-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-acid font-display font-semibold">Identity Verified Successfully</p>
                  <p className="text-ink-400 text-sm font-body">Photo + signature merged into a tamper-evident audit image</p>
                </div>
              </div>
              <div className="max-w-lg mx-auto rounded-xl overflow-hidden border border-ink-600 mb-6 shadow-2xl">
                <img src={mergedResult} alt="Audit" className="w-full block" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <a href={mergedResult} download={`audit-${employee?.id}-${Date.now()}.jpg`}
                  className="flex items-center gap-2 bg-acid hover:bg-acid-dark text-ink-950 font-display font-semibold px-5 py-3 rounded-xl transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Audit Image
                </a>
                <button onClick={() => navigate('/analytics')}
                  className="flex items-center gap-2 px-5 py-3 bg-ink-800 text-ink-300 font-body rounded-xl hover:bg-ink-700 transition-all text-sm border border-ink-600">
                  View Analytics →
                </button>
                <button onClick={() => navigate('/list')}
                  className="flex items-center gap-2 px-5 py-3 bg-ink-800 text-ink-300 font-body rounded-xl hover:bg-ink-700 transition-all text-sm border border-ink-600">
                  ← All Employees
                </button>
                <button onClick={() => { setMergedResult(null); setCapturedPhoto(null); sigInitialized.current = false; setCameraStatus('idle'); setStage('info'); }}
                  className="text-ink-500 text-sm font-mono hover:text-ink-300 ml-auto transition-colors">
                  Re-capture
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}