import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';
import './ResetPasswordPage.css';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get('token');
    const emailParam = params.get('email');

    if (!tokenParam || !emailParam) {
      navigate('/login');
      return;
    }

    setToken(tokenParam);
    setEmail(emailParam);
  }, [location, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Şifrə ən azı 6 simvol olmalıdır.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Şifrələr uyğun gəlmir.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Şifrə sıfırlanamadı. Zəhmət olmasa yenidən cəhd edin.');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError('Şəbəkə xətası. Zəhmət olmasa yenidən cəhd edin.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-page__card">
          <div className="reset-password-page__success-icon">✓</div>
          <h2 className="reset-password-page__title">Şifrə Yeniləndi!</h2>
          <p className="reset-password-page__description">
            Şifrəniz uğurla yeniləndi. Girişə keçərə bilərsiniz.
          </p>
          <Link to="/login" className="button button--primary">
            Girişə Keç
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-page__card">
        <h2 className="reset-password-page__title">Yeni Şifrə Təyin Et</h2>
        <p className="reset-password-page__description">
          Güclü bir şifrə seçin. Ən azı 6 simvol, böyük/kiçik hərflər və rəqəmlərdən istifadə etməlisiniz.
        </p>

        <form onSubmit={handleSubmit} className="reset-password-page__form">
          {error && <div className="reset-password-page__error">{error}</div>}

          <div className="form-group">
            <label htmlFor="new-password">Yeni Şifrə</label>
            <div className="password-input-wrapper">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Güclü şifrə daxil edin"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
            <PasswordStrengthIndicator password={password} showLabel={true} />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Şifrəni Təkrar Daxil Et</label>
            <div className="password-input-wrapper">
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Şifrəni təkrar daxil edin"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
            {confirmPassword && (
              <span
                className={`password-match ${
                  password === confirmPassword
                    ? 'password-match--success'
                    : 'password-match--error'
                }`}
              >
                {password === confirmPassword ? '✓ Şifrələr uyğun' : '✗ Şifrələr uyğun gəlmir'}
              </span>
            )}
          </div>

          <button type="submit" className="button button--primary" disabled={loading}>
            {loading ? 'Yenilənir...' : 'Şifrəni Yenilə'}
          </button>
        </form>

        <p className="reset-password-page__footer">
          <Link to="/login">Girişə Qayıt</Link>
        </p>
      </div>
    </div>
  );
}
