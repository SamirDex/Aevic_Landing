import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import '../styles/auth.css';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

    if (newPassword.length < 6) {
      setError('Şifrə ən azı 6 simvol olmalıdır.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Şifrələr uyğun gəlmir.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/teams/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Şifrə yenilənmədi. Token etibarsız ola bilər.');
        return;
      }

      setDone(true);
      setTimeout(() => navigate('/giris'), 3000);
    } catch (err) {
      setError('Server ilə əlaqə qurulmadı. Yenidən cəhd edin.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <section className="auth-container">
        <div className="auth-content">
          <div className="auth-card">
            <div className="auth-success-icon">✓</div>
            <div className="auth-header text-center">
              <h1 className="auth-title">Şifrə Dəyişdirildi!</h1>
              <p className="auth-subtitle">
                İndi yeni şifrənizlə daxil ola bilərsiniz. Giriş səhifəsinə yönləndirilirsiniz...
              </p>
            </div>

            <button
              onClick={() => navigate('/giris')}
              className="auth-button auth-button--primary"
              style={{ width: '100%' }}
            >
              Panelə Keç →
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
            <h1 className="auth-title">Yeni Şifrə Təyin Et</h1>
            <p className="auth-subtitle">
              <strong>{email}</strong> hesabı üçün yeni şifrə təyin edin
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
              <label htmlFor="new-password">Yeni Şifrə</label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ən azı 6 simvol"
                required
                disabled={!email || !token}
                aria-label="Yeni şifrə"
              />
              <p className="form-helper">Şifrə ən azı 6 simvol olmalıdır</p>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Şifrəni Təkrarla</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Şifrəni yenidən daxil edin"
                required
                disabled={!email || !token}
                aria-label="Şifrəni təsdiqlə"
              />
            </div>

            <button
              type="submit"
              className="auth-button auth-button--primary"
              disabled={loading || !email || !token}
              style={{ width: '100%' }}
            >
              {loading ? (
                <>
                  <span className="auth-loading"></span> Dəyişdirilir...
                </>
              ) : (
                'Şifrəni Dəyiştir'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p className="auth-footer-text">
              Hesabınız yoxdur? <a href="/qeydiyyat" className="auth-footer-link">Qeydiyyatdan keç</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
