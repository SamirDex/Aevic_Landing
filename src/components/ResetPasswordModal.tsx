import { type FormEvent, useState } from 'react';
import '../styles/auth.css';

type Props = {
  email: string;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function ResetPasswordModal({ email, token, onClose, onSuccess }: Props) {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirm) {
      setMessage('Şifrələr uyğun gəlmir.');
      return;
    }
    if (newPassword.length < 6) {
      setMessage('Şifrə ən azı 6 simvol olmalıdır.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/teams/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
      } else {
        setMessage(data.error ?? 'Xəta baş verdi.');
      }
    } catch {
      setMessage('Server ilə əlaqə qurulmadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <>
            <div className="auth-success-icon">✓</div>
            <div className="auth-header text-center">
              <h3 className="auth-title" style={{ fontSize: '1.5rem' }}>Şifrə Dəyişdirildi!</h3>
              <p className="auth-subtitle">İndi yeni şifrənizlə daxil ola bilərsiniz.</p>
            </div>
            <button type="button" className="auth-button auth-button--primary" onClick={onSuccess} style={{ width: '100%' }}>
              Panelə Keç →
            </button>
          </>
        ) : (
          <>
            <div className="auth-header">
              <h2 className="auth-title">Yeni Şifrə Təyin Et</h2>
              <p className="auth-subtitle">
                <strong>{email}</strong> hesabı üçün
              </p>
            </div>
            
            <div className="auth-divider"></div>

            <form onSubmit={handleSubmit} className="auth-form">
              {message && (
                <div className="auth-alert auth-alert--error">
                  <div className="auth-alert-icon">⚠️</div>
                  <div className="auth-alert-text">{message}</div>
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
                  aria-label="Yeni şifrə"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Şifrəni Təkrarla</label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Şifrəni yenidən daxil edin"
                  required
                  aria-label="Şifrəni təsdiqlə"
                />
              </div>

              <button type="submit" className="auth-button auth-button--primary" disabled={loading} style={{ width: '100%' }}>
                {loading ? (
                  <>
                    <span className="auth-loading"></span> Dəyişdirilir...
                  </>
                ) : (
                  'Şifrəni Dəyiştir'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
