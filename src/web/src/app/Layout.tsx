import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export function Layout() {
  const { t } = useTranslation();
  const location = useLocation();

  const navItems = [
    { to: '/', label: t('nav.dashboard') },
    { to: '/therapies', label: t('nav.therapies') },
    { to: '/results', label: t('nav.results') },
  ];

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-border bg-surface-secondary">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold text-primary no-underline">
              {t('appName')}
            </Link>
            <nav className="flex gap-1" aria-label="Main navigation">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-md px-4 py-2 text-lg font-medium no-underline transition-colors ${
                    location.pathname === item.to
                      ? 'bg-primary text-text-on-primary'
                      : 'text-text-secondary hover:bg-primary-light hover:text-primary'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <button className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary">
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
