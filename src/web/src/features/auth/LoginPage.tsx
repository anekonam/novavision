import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';

export function LoginPage() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">NovaVision</h1>
        </div>

        {/* Login card */}
        <div className="rounded-xl border-2 border-border bg-surface p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-text">{t('login.title')}</h2>

          <form className="mt-6 space-y-5" onSubmit={(e) => e.preventDefault()}>
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
              className="w-full rounded-lg bg-primary px-4 py-3 text-lg font-semibold text-text-on-primary hover:bg-primary-hover focus-visible:outline-3 focus-visible:outline-focus"
            >
              {t('login.submit')}
            </button>
          </form>

          <div className="mt-4 text-center">
            <a href="/register" className="text-base font-medium text-primary hover:underline">
              {t('login.noAccount')} {t('login.register')}
            </a>
          </div>
        </div>

        {/* Language switcher */}
        <div className="mt-6 flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
