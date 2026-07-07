import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OTPInput } from '../components/OTPInput';
import './VerifyPage.css';

export function VerifyPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const emailParam = new URLSearchParams(location.search).get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      navigate('/login');
    }
  }, [location, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Lütfən 6 rəqəmli kodu daxil edin.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Kod yanlışdır. Yenidən cəhd edin.');
        return;
      }

      navigate('/panel');
    } catch (err) {
      setError('Şəbəkə xətası. Zəhmət olmasa yenidən cəhd edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    setError('');

    try {
      const res = await fetch('/api/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Kod göndərilmədi.');
        return;
      }

      setResendSuccess(true);
      setCountdown(30);
      setOtp('');
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err) {
      setError('Şəbəkə xətası. Zəhmət olmasa yenidən cəhd edin.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="verify-page">
      <div className="verify-page__card">
        <h2 className="verify-page__title">Email Doğrulaması</h2>
        <p className="verify-page__description">
          <strong>{email}</strong> ünvanına göndərilən 6 rəqəmli kodu daxil edin.
        </p>

        <div className="verify-page__form">
          {error && <div className="verify-page__error">{error}</div>}

          <OTPInput
            value={otp}
            onChange={setOtp}
            onComplete={handleVerify}
            disabled={loading}
          />

          <button
            onClick={handleVerify}
            disabled={otp.length !== 6 || loading}
            className="button button--primary"
          >
            {loading ? 'Yoxlanılır...' : 'Təsdiqlə'}
          </button>
        </div>

        <div className="verify-page__resend">
          <p className="verify-page__hint">
            Kod gəlməyibsə spam qovluğunu yoxlayın. Kod 10 dəqiqə etibarlıdır.
          </p>

          {resendSuccess && (
            <p className="verify-page__success">Kod yenidən göndərildi!</p>
          )}

          <button
            onClick={handleResendOtp}
            disabled={resendLoading || countdown > 0}
            className="verify-page__resend-btn"
          >
            {countdown > 0
              ? `${countdown} saniyə gözləyin`
              : resendLoading
              ? 'Göndərilir...'
              : 'Kodu yenidən göndər'}
          </button>
        </div>

        <p className="verify-page__footer">
          <Link to="/login">Girişə Qayıt</Link>
        </p>
      </div>
    </div>
  );
}
