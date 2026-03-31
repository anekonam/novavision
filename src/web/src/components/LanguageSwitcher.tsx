import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en-GB', label: 'English' },
  { code: 'de-DE', label: 'Deutsch' },
];

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="language-select" className="text-sm font-medium text-text-secondary">
        {t('language.label')}
      </label>
      <select
        id="language-select"
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-text focus-visible:outline-3 focus-visible:outline-focus"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
