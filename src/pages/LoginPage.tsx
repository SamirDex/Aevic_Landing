import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, type TeamRecord } from '../context/AuthContext';
import { Toast } from '../components/Toast';
import '../styles/auth.css';

export function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
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
    setForgotLoading(true);
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
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <section className="auth-container">
      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">{t('login.title')}</h1>
            <p className="auth-subtitle">{t('login.subtitle')}</p>
          </div>

          <div className="auth-divider"></div>
          
          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="auth-alert auth-alert--error">
                <div className="auth-alert-icon">⚠️</div>
                <div className="auth-alert-text">{error}</div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="login-email">{t('login.email')}</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t('login.emailPlaceholder')}
                aria-label={t('login.email')}
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
                aria-label={t('login.password')}
              />
            </div>

            <button 
              type="submit" 
              className="auth-button auth-button--primary" 
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <span className="auth-loading"></span> {t('common.loading')}
                </>
              ) : (
                t('login.login')
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p className="auth-footer-text">
              {t('login.noAccount')} <Link to="/qeydiyyat" className="auth-footer-link">{t('login.register')}</Link>
            </p>
            <div className="auth-links-group">
              <button
                type="button"
                className="auth-footer-link"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setForgotEmail('');
                }}
                style={{ background: 'none', border: 'none', padding: 0 }}
              >
                {t('login.forgotPassword')} →
              </button>
            </div>
          </div>
        </div>
      </div>

      {forgotEmail !== '' && (
        <div className="auth-overlay" onClick={() => setForgotEmail('')}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-header">
              <h2 className="auth-title">{t('login.forgotPassword')}</h2>
              <p className="auth-subtitle">{t('login.resetSent')}</p>
            </div>
            
            <form onSubmit={handleForgotPassword} className="auth-form" style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label htmlFor="forgot-email">{t('login.email')}</label>
                <input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder={t('login.emailPlaceholder')}
                  required
                  aria-label={t('login.email')}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button 
                  type="submit" 
                  className="auth-button auth-button--primary"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <>
                      <span className="auth-loading"></span>
                    </>
                  ) : (
                    t('login.resetPassword')
                  )}
                </button>
                <button 
                  type="button" 
                  className="auth-button auth-button--ghost"
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
