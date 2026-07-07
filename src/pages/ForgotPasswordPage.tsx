import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Toast } from '../components/Toast';
import '../styles/auth.css';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.trim()) {
      setError(t('common.invalidEmail'));
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/teams/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('login.resetError'));
        return;
      }

      setSuccess(true);
      setToast({ message: t('login.resetSent'), type: 'success' });
      setTimeout(() => navigate('/giris'), 3000);
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <section className="auth-container">
        <div className="auth-content">
          <div className="auth-card">
            <div className="auth-success-icon">✉️</div>
            <div className="auth-header text-center">
              <h1 className="auth-title">Email Göndərildi</h1>
              <p className="auth-subtitle">
                <strong>{email}</strong> ünvanına şifrə yeniləmə linki göndərildi.
              </p>
            </div>

            <div className="auth-divider"></div>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--auth-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Email 10 dəqiqə ərzində gəlməlidir. Spam qovluğunu yoxlayın.
              </p>
              <p style={{ color: 'var(--auth-text-muted)', fontSize: '0.85rem' }}>
                3 saniyə ərzində giriş səhifəsinə yönləndirilirsiniz...
              </p>
            </div>

            <button
              onClick={() => navigate('/giris')}
              className="auth-button auth-button--primary"
              style={{ width: '100%' }}
            >
              Giriş Səhifəsinə Dön →
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-container">
      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">{t('login.forgotPassword')}</h1>
            <p className="auth-subtitle">Şifrəni yeniləmə üçün email ünvanınızı daxil edin</p>
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
              <label htmlFor="forgot-email">{t('login.email')}</label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t('login.emailPlaceholder')}
                aria-label={t('login.email')}
              />
            </div>

            <button
              type="submit"
              className="auth-button auth-button--primary"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? (
                <>
                  <span className="auth-loading"></span> {t('common.loading')}
                </>
              ) : (
                t('login.resetPassword')
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p className="auth-footer-text">
              Hesabınız var mı? <a href="/giris" className="auth-footer-link">{t('login.login')}</a>
            </p>
          </div>
        </div>
      </div>

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
