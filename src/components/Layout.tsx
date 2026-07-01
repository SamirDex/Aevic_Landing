import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function Layout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="app-shell">
      <Navbar />
      <main>
        <Outlet />
      </main>
      {!isHome ? <Footer /> : null}
    </div>
  );
}
