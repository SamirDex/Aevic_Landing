import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Navbar() {
  const location = useLocation();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);
  const { user, logout, isAuthenticated } = useAuth();

  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) return null;

  const links = [
    { label: t('nav.home'), path: '/' },
    { label: t('nav.register'), path: '/qeydiyyat' },
    { label: t('nav.leaderboard'), path: '/liderlik' },
    { label: t('nav.schedule'), path: '/cedvel' },
    { label: t('nav.rules'), path: '/reqlament' },
  ];

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!accountOpen) return undefined;

    const onPointerDown = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAccountOpen(false);
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [accountOpen]);

  const handleNavigate = () => {
    setMenuOpen(false);
    setAccountOpen(false);
  };

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
    handleNavigate();
  };

  const avatarInitial = user?.team_name?.trim().charAt(0).toUpperCase();

  return (
    <>
      {menuOpen ? (
        <button
          type="button"
          className="site-nav__backdrop"
          aria-label={t('nav.closeMenu')}
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <header className={`site-nav${menuOpen ? ' is-menu-open' : ''}`}>
        <Link to="/" className="site-nav__brand" onClick={handleNavigate}>
          <img
            src="/logo.webp"
            alt="Aevic Esports"
            className="site-nav__logo"
            width={48}
            height={48}
          />
          <div className="site-nav__brand-text">
            <span className="site-nav__brand-title">AEVIC</span>
            <span className="site-nav__brand-subtitle">ESPORTS</span>
          </div>
        </Link>

        <button
          type="button"
          className="site-nav__menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="site-nav-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="site-nav__menu-icon" aria-hidden="true" />
          <span className="sr-only">{menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}</span>
        </button>

        <nav id="site-nav-menu" className="site-nav__links" aria-label="Section navigation">
          {links.map((link) => {
            const isActive = link.path === '/' ? location.pathname === '/' : location.pathname.startsWith(link.path);

            return (
              <Link
                key={link.path}
                to={link.path}
                className={isActive ? 'is-active' : undefined}
                aria-current={isActive ? 'page' : undefined}
                onClick={handleNavigate}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="site-nav__controls">
          <LanguageSwitcher />

          {isAuthenticated ? (
            <div className="site-nav__account" ref={accountRef}>
              <button
                type="button"
                className="site-nav__avatar"
                aria-label={t('nav.panel')}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                onClick={() => setAccountOpen((open) => !open)}
              >
                {avatarInitial ? <span className="site-nav__avatar-initial">{avatarInitial}</span> : null}
                <span className="site-nav__avatar-icon" aria-hidden="true" />
              </button>

              {accountOpen ? (
                <div className="site-nav__account-menu" role="menu">
                  <Link to="/panel" role="menuitem" onClick={handleNavigate}>
                    {t('nav.panel')}
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountOpen(false);
                      setShowLogoutModal(true);
                    }}
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link to="/login" className="site-nav__avatar" aria-label={t('nav.login')} onClick={handleNavigate}>
              <span className="site-nav__avatar-icon" aria-hidden="true" />
            </Link>
          )}
        </div>
      </header>

      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLogoutModal(false)} aria-label={t('nav.close')}>
              ×
            </button>

            <div className="modal-header">
              <h2 className="modal-title">{t('nav.logoutTitle')}</h2>
            </div>

            <p className="modal-text">{t('nav.logoutConfirm')}</p>

            <div className="modal-actions">
              <button className="button button--ghost" onClick={() => setShowLogoutModal(false)}>
                {t('common.cancel')}
              </button>
              <button className="button button--primary" onClick={handleLogout}>
                {t('nav.logoutYes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
