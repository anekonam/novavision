import { useTranslation } from 'react-i18next';

export function DashboardPage() {
  const { t } = useTranslation();

  const therapies = [
    { key: 'vrt', name: t('therapies.vrt'), status: 'inProgress', progress: 45, color: 'bg-primary' },
    { key: 'nec', name: t('therapies.nec'), status: 'notStarted', progress: 0, color: 'bg-secondary' },
    { key: 'net', name: t('therapies.net'), status: 'notStarted', progress: 0, color: 'bg-warning' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-text">{t('nav.dashboard')}</h1>
      <p className="mt-2 text-lg text-text-secondary">
        Welcome to the NovaVision therapy portal.
      </p>

      {/* Therapy cards */}
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {therapies.map((therapy) => (
          <div
            key={therapy.key}
            className="rounded-xl border-2 border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <h2 className="text-xl font-bold text-text">{therapy.name}</h2>
            <p className="mt-1 text-base font-medium text-text-secondary">
              {t(`status.${therapy.status}`)}
            </p>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm font-medium text-text-secondary">
                <span>Progress</span>
                <span>{therapy.progress}%</span>
              </div>
              <div className="mt-1 h-3 w-full rounded-full bg-surface-secondary">
                <div
                  className={`h-3 rounded-full ${therapy.color}`}
                  style={{ width: `${therapy.progress}%` }}
                />
              </div>
            </div>

            <button className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-lg font-semibold text-text-on-primary hover:bg-primary-hover focus-visible:outline-3 focus-visible:outline-focus">
              {t('actions.startSession')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
