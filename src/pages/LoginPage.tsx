import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, type TeamRecord } from '../context/AuthContext';
import { Toast } from '../components/Toast';
import './LoginPage.css';

export function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/teams/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('login.error'));
        return;
      }

      login(data as TeamRecord);
      navigate('/panel');
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setToast({ message: t('common.invalidEmail'), type: 'error' });
      return;
    }
    try {
      const res = await fetch('/api/teams/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: t('login.resetSent'), type: 'success' });
        setForgotEmail('');
      } else {
        setToast({ message: data.error || t('login.resetError'), type: 'error' });
      }
    } catch {
      setToast({ message: t('common.error'), type: 'error' });
    }
  };

  return (
    <section className="login-page login-page--centered">
      <div className="login-page__card">
        <h1 className="login-page__title">{t('login.title')}</h1>
        <p className="login-page__subtitle">{t('login.subtitle')}</p>
        
        <form onSubmit={handleSubmit} className="login-page__form">
          {error && <div className="login-page__error">{error}</div>}

          <div className="form-group">
            <label htmlFor="login-email">{t('login.email')}</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t('login.emailPlaceholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">{t('login.password')}</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={t('login.passwordPlaceholder')}
            />
          </div>

          <button type="submit" className="button button--primary" disabled={loading}>
            {loading ? t('common.loading') : t('login.login')}
          </button>
        </form>

        <div className="login-page__links">
          <Link to="/qeydiyyat" className="login-page__link">
            {t('login.register')}
          </Link>
          <button
            type="button"
            className="login-page__link login-page__link--button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setForgotEmail('');
            }}
          >
            {t('login.forgotPassword')}
          </button>
        </div>
      </div>

      {forgotEmail !== '' && (
        <div className="login-page__forgot-modal">
          <div className="login-page__forgot-card">
            <h3 className="login-page__forgot-title">{t('login.forgotPassword')}</h3>
            <p className="login-page__forgot-sub">{t('login.resetSent')}</p>
            
            <form onSubmit={handleForgotPassword} className="login-page__forgot-form">
              <div className="form-group">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder={t('login.emailPlaceholder')}
                  required
                />
              </div>
              <div className="login-page__forgot-actions">
                <button type="submit" className="button button--primary">
                  {t('login.resetPassword')}
                </button>
                <button 
                  type="button" 
                  className="button button--ghost"
                  onClick={() => setForgotEmail('')}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </section>
  );
}
