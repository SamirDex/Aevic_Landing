
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminPanel } from './AdminPanel';
import { SectionReveal } from './SectionReveal';

interface OrganizerSectionProps {
  adminToken: string;
  onLogout?: () => void;
}

export function OrganizerSection({ adminToken, onLogout }: OrganizerSectionProps) {
  const { t } = useTranslation();
  const [accessValue, setAccessValue] = useState('');
  const [authorized, setAuthorized] = useState(() => Boolean(adminToken));
  const [message, setMessage] = useState('');

  const handleUnlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key: accessValue.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setAuthorized(true);
        setAccessValue('');
      } else {
        setMessage(data.error || t('admin.wrongKey'));
      }
    } catch (error) {
      console.error('[Admin Login Error]', error);
      setMessage(t('admin.serverError'));
    }
  };

  const handleLogout = () => {
    setAuthorized(false);
    setMessage('');
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <section className="organizer" id="organizer">
      <div className="section-frame">
        <SectionReveal className="organizer__heading">
          <span className="section-kicker">Aevic Esports Admin</span>
          <h2>{t('admin.title')}</h2>
          <p>Aevic Esports turnir təşkilatçısı üçün tam idarəetmə: komanda silmə, global room, OCR nəticə import.</p>
        </SectionReveal>

        {!authorized ? (
          <SectionReveal className="organizer__gate" delay={0.08}>
            <div className="organizer__gate-copy">
              <span className="story-card__eyebrow">{t('admin.loginTitle')}</span>
              <p>{t('admin.loginSubtitle')}</p>
            </div>

            <form className="organizer__gate-form" onSubmit={handleUnlock}>
              <label className="field">
                <span>{t('admin.accessKey')}</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={accessValue}
                  onChange={(event) => setAccessValue(event.target.value)}
                  placeholder={t('admin.accessKeyPlaceholder')}
                />
              </label>

              {message ? <div className="form-message">{message}</div> : null}

              <button type="submit" className="button button--primary">
                {t('admin.openPanel')}
              </button>
            </form>
          </SectionReveal>
        ) : (
          <AdminPanel onLogout={handleLogout} />
        )}
      </div>
    </section>
  );
}
