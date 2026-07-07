import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import '../styles/auth.css';

export function EmailVerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [done, setDone] = useState(false);

  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  useEffect(() => {
    if (!email || !token) {
      setError('Email və ya token parametri eksikdir.');
    }
  }, [email, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (otpCode.length !== 6) {
      setError('Kod 6 rəqəmdən ibarət olmalıdır.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/teams/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, otpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Kod yanlışdır.');
        return;
      }

      setDone(true);
      setTimeout(() => navigate('/giris'), 3000);
    } catch (err) {
      setError('Verifikasiya uğursuz oldu. Yenidən cəhd edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    try {
      const res = await fetch('/api/teams/resend-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Kod yenidən göndərilmədi.');
        return;
      }

      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch {
      setError('Şəbəkə xətası. Yenidən cəhd edin.');
    } finally {
      setResendLoading(false);
    }
  };

  if (done) {
    return (
      <section className="auth-container">
        <div className="auth-content">
          <div className="auth-card">
            <div className="auth-success-icon">✓</div>
            <div className="auth-header text-center">
              <h1 className="auth-title">Email Təsdiqləndi!</h1>
              <p className="auth-subtitle">
                Hesabınız uğurla təsdiqləndi. Giriş səhifəsinə yönləndirilirsiniz...
              </p>
            </div>

            <button
              onClick={() => navigate('/giris')}
              className="auth-button auth-button--primary"
              style={{ width: '100%' }}
            >
              Giriş Səhifəsinə Keç →
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
            <h1 className="auth-title">Email Doğrulama</h1>
            <p className="auth-subtitle">
              <strong>{email}</strong> ünvanına göndərilən 6 rəqəmli kodu daxil edin
            </p>
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
              <label htmlFor="otp-code">Doğrulama Kodu</label>
              <input
                id="otp-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.25rem' }}
                disabled={!email || !token}
              />
            </div>

            <button
              type="submit"
              className="auth-button auth-button--primary"
              disabled={loading || otpCode.length !== 6 || !email || !token}
              style={{ width: '100%' }}
            >
              {loading ? (
                <>
                  <span className="auth-loading"></span> Yoxlanılır...
                </>
              ) : (
                'Təsdiqlə'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p className="auth-footer-text" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
              Kod 10 dəqiqə etibarlıdır. Spam qovluğunu yoxlayın.
            </p>

            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="auth-footer-link"
              style={{ background: 'none', border: 'none', padding: 0 }}
            >
              {resendLoading ? 'Göndərilir...' : 'Kodu yenidən göndər'} →
            </button>

            {resendSuccess && (
              <p style={{ color: '#4ADE80', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                ✓ Kod yenidən göndərildi!
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
