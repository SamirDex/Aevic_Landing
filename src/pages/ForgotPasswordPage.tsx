import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Toast } from '../components/Toast';
import './ForgotPasswordPage.css';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/teams/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
        return;
      }

      setSent(true);
    } catch (err) {
      setError('Şəbəkə xətası. Zəhmət olmasa yenidən cəhd edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSent(false);
    setEmail('');
    setError('');
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-page__card">
        {sent ? (
          <>
            <div className="forgot-password-page__success-icon">✓</div>
            <h2 className="forgot-password-page__title">Email Göndərildi!</h2>
            <p className="forgot-password-page__description">
              <strong>{email}</strong> ünvanına şifrə sıfırlamaq üçün link göndərdik.
            </p>
            <p className="forgot-password-page__hint">
              Emailinizi yoxlayın (spam qovluğunu da yoxlamağı unutmayın). Link 1 saat etibarlıdır.
            </p>
            <div className="forgot-password-page__actions">
              <Link to="/login" className="button button--primary">
                Girişə Qayıt
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="button button--ghost"
              >
                Fərqli Email Daxil Et
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="forgot-password-page__title">Şifrəni Unutdum</h2>
            <p className="forgot-password-page__description">
              Qeydiyyatda istifadə etdiyiniz emaili daxil edin. Şifrəni sıfırlamaq üçün link göndərəcəyik.
            </p>

            <form onSubmit={handleSubmit} className="forgot-password-page__form">
              {error && <div className="forgot-password-page__error">{error}</div>}

              <div className="form-group">
                <label htmlFor="forgot-email">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@domain.com"
                  required
                />
              </div>

              <button type="submit" className="button button--primary" disabled={loading}>
                {loading ? 'Göndərilir...' : 'Kod Göndər'}
              </button>
            </form>

            <p className="forgot-password-page__footer">
              Xatırladınız? <Link to="/login">Girişə Keç</Link>
            </p>
          </>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
