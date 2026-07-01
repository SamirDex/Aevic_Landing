import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LANGUAGES = [
  { code: 'az', label: 'AZ', flag: '🇦🇿' },
  { code: 'ru', label: 'RU', flag: '🇷🇺' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <div className="language-switcher">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          className={`language-switcher__button${i18n.language === lang.code ? ' is-active' : ''}`}
          onClick={() => handleLanguageChange(lang.code)}
          aria-label={`Switch to ${lang.label}`}
        >
          <span className="language-switcher__flag">{lang.flag}</span>
          <span className="language-switcher__label">{lang.label}</span>
        </button>
      ))}
    </div>
  );
}
