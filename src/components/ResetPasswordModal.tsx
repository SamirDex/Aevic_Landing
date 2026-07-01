import { type FormEvent, useState } from 'react';

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
    <div className="reset-overlay" onClick={onClose}>
      <div className="reset-modal" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <>
            <div className="reset-modal__icon">✓</div>
            <h3>Şifrə dəyişdirildi!</h3>
            <p>İndi yeni şifrənizlə daxil ola bilərsiniz.</p>
            <button type="button" className="button button--primary" onClick={onSuccess}>
              Panelə Keç →
            </button>
          </>
        ) : (
          <>
            <h3>Yeni şifrə təyin et</h3>
            <p className="reset-modal__sub">
              <strong>{email}</strong> hesabı üçün
            </p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Yeni şifrə</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ən azı 6 simvol"
                  required
                />
              </div>
              <div className="form-group">
                <label>Şifrəni təkrarla</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Şifrəni yenidən daxil edin"
                  required
                />
              </div>
              {message && <p className="reset-modal__error">{message}</p>}
              <button type="submit" className="button button--primary" disabled={loading}>
                {loading ? 'Dəyişdirilir...' : 'Şifrəni Dəyiştir'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
