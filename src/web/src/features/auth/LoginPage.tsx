import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useAuth } from '../../hooks/useAuth';

export function LoginPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { login, verifyMfa, mfaRequired, mfaSetupRequired } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      if (!useAuth.getState().mfaRequired && !useAuth.getState().mfaSetupRequired) {
        navigate('/');
      }
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyMfa(mfaCode);
      navigate('/');
    } catch {
      setError('Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  // MFA Setup Required screen
  if (mfaSetupRequired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-4">
        <div className="w-full max-w-md rounded-xl border-2 border-border bg-surface p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-text">{t('mfa.setup.title')}</h2>
          <p className="mt-2 text-base text-text-secondary">
            Your role requires two-factor authentication. Please set it up after logging in.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-lg font-semibold text-text-on-primary hover:bg-primary-hover"
          >
            Continue to Setup
          </button>
        </div>
      </div>
    );
  }

  // MFA Challenge screen
  if (mfaRequired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-primary">NovaVision</h1>
          </div>
          <div className="rounded-xl border-2 border-border bg-surface p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-text">{t('mfa.title')}</h2>
            <p className="mt-2 text-base text-text-secondary">{t('mfa.subtitle')}</p>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-base font-medium text-danger">{error}</div>
            )}

            <form className="mt-6 space-y-5" onSubmit={handleMfa}>
              <div>
                <label htmlFor="mfa-code" className="block text-base font-semibold text-text">
                  {t('mfa.codeLabel')}
                </label>
                <input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  className="mt-1 block w-full rounded-lg border-2 border-border px-4 py-3 text-center text-2xl font-bold tracking-widest text-text focus:border-primary focus-visible:outline-3 focus-visible:outline-focus"
                  placeholder="000000"
                />
              </div>
              <button
                type="submit"
                disabled={loading || mfaCode.length !== 6}
                className="w-full rounded-lg bg-primary px-4 py-3 text-lg font-semibold text-text-on-primary hover:bg-primary-hover disabled:opacity-50"
              >
                {loading ? '...' : t('mfa.submit')}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Login screen
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">NovaVision</h1>
        </div>

        <div className="rounded-xl border-2 border-border bg-surface p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-text">{t('login.title')}</h2>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-base font-medium text-danger">{error}</div>
          )}

          <form className="mt-6 space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-base font-semibold text-text">
                {t('login.email')}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border-2 border-border px-4 py-3 text-lg text-text placeholder:text-text-muted focus:border-primary focus-visible:outline-3 focus-visible:outline-focus"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-base font-semibold text-text">
                {t('login.password')}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border-2 border-border px-4 py-3 text-lg text-text placeholder:text-text-muted focus:border-primary focus-visible:outline-3 focus-visible:outline-focus"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-3 text-lg font-semibold text-text-on-primary hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? '...' : t('login.submit')}
            </button>
          </form>

          <div className="mt-4 text-center">
            <a href="/register" className="text-base font-medium text-primary hover:underline">
              {t('login.noAccount')} {t('login.register')}
            </a>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
