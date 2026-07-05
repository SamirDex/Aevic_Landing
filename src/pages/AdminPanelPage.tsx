import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrganizerSection } from '../components/OrganizerSection';

export function AdminPanelPage() {
  const navigate = useNavigate();
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/admin/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (res.ok) {
          setAdminToken('authenticated');
        } else {
          navigate('/admin', { replace: true });
        }
      } catch {
        navigate('/admin', { replace: true });
      }
      setChecked(true);
    };
    checkSession();
  }, [navigate]);

  if (!checked || !adminToken) return null;

  const handleLogout = async () => {
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'include',
    });
    navigate('/admin', { replace: true });
  };

  return <OrganizerSection adminToken={adminToken} onLogout={handleLogout} />;
}
