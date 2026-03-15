import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/list';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600)); 
    const success = login(username.trim(), password);
    if (!success) {
      setError('Invalid credentials. Try testuser / Test123');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(#b5ff47 1px, transparent 1px), linear-gradient(90deg, #b5ff47 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-acid/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-sky-electric/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md animate-fade-up">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-acid rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
              <rect x="3" y="3" width="8" height="8" rx="1" fill="#0d0d14" />
              <rect x="13" y="3" width="8" height="8" rx="1" fill="#0d0d14" opacity="0.6" />
              <rect x="3" y="13" width="8" height="8" rx="1" fill="#0d0d14" opacity="0.6" />
              <rect x="13" y="13" width="8" height="8" rx="1" fill="#0d0d14" opacity="0.3" />
            </svg>
          </div>
          <div>
            <p className="text-acid font-mono text-xs tracking-widest uppercase">Employee Insights</p>
            <p className="text-ink-400 font-mono text-xs">Dashboard v1.0</p>
          </div>
        </div>

        <div className="bg-ink-900/80 backdrop-blur-sm border border-ink-700 rounded-2xl p-8">
          <h1 className="text-ink-50 text-3xl font-display font-semibold mb-1">Welcome back</h1>
          <p className="text-ink-400 text-sm mb-8 font-body">Sign in to access your workspace</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-ink-300 text-xs font-mono uppercase tracking-wider mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                placeholder="testuser"
                autoComplete="username"
                className="w-full bg-ink-800 border border-ink-600 text-ink-100 placeholder-ink-600 rounded-lg px-4 py-3 font-body text-sm focus:outline-none focus:border-acid focus:ring-1 focus:ring-acid/30 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-ink-300 text-xs font-mono uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-ink-800 border border-ink-600 text-ink-100 placeholder-ink-600 rounded-lg px-4 py-3 pr-12 font-body text-sm focus:outline-none focus:border-acid focus:ring-1 focus:ring-acid/30 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPwd ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-coral/10 border border-coral/30 rounded-lg px-4 py-3">
                <svg className="w-4 h-4 text-coral shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-coral text-sm font-body">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-acid hover:bg-acid-dark text-ink-950 font-display font-semibold py-3.5 rounded-lg transition-all duration-200 relative overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Authenticating…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 p-3 bg-ink-800/60 rounded-lg border border-ink-700">
            <p className="text-ink-500 text-xs font-mono text-center">
              Demo: <span className="text-acid">testuser</span> / <span className="text-acid">Test123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}