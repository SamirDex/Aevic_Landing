import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function AdminLoginPage() {
  const [adminInput, setAdminInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key: adminInput.trim() }),
      });

      if (res.ok) {
        window.dispatchEvent(new CustomEvent('aevic:admin-unlock'));
        navigate('/admin/panel');
      } else {
        setError('Yanlış admin açarı.');
        setAdminInput('');
      }
    } catch {
      setError('Şəbəkə xətası. Yenidən cəhd edin.');
      setAdminInput('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      padding: '1rem'
    }}>
      <div className="section-frame" style={{
        maxWidth: '400px',
        width: '100%',
        padding: '2rem',
        background: 'var(--color-bg-card)',
        borderRadius: '12px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{
            color: '#f3c450',
            fontSize: '12px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            margin: '0 0 0.5rem'
          }}>Aevic Esports</p>
          <h1 style={{
            fontSize: '24px',
            margin: '0',
            color: 'var(--color-copy)'
          }}>Admin Panel</h1>
        </div>

        <div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="admin-key" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--copy-soft)' }}>
              Admin açarı
            </label>
            <input
              id="admin-key"
              type="password"
              value={adminInput}
              onChange={(e) => setAdminInput(e.target.value)}
              placeholder="Admin açarı"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                color: 'var(--color-copy)',
                fontSize: '1rem'
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              background: 'rgba(224, 85, 85, 0.1)',
              border: '1px solid #e05555',
              borderRadius: '6px',
              color: '#e05555',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            className="button button--primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem'
            }}
          >
            {loading ? 'Yüklənir...' : 'Daxil ol'}
          </button>
        </div>
      </div>
    </div>
  );
}
