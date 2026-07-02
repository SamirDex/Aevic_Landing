import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const socials = [
  { label: 'X', href: 'https://x.com/aevicesports' },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/aevicesports' },
  { label: 'Instagram', href: 'https://instagram.com/aevicesports' },
  { label: 'TikTok', href: 'https://tiktok.com/@aevic.esports' },
] as const;

export function Footer() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <footer className="site-footer">
      <div className="section-frame site-footer__inner">
        <div>
          <p className="site-footer__brand">{t('footer.brand')}</p>
          <p className="site-footer__motto">{t('footer.motto')}</p>
        </div>

        <div className="site-footer__meta">
          <span>{t('footer.meta')}</span>
          <a
            href="/assets/reqlament.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: 'transparent', border: 0, color: 'var(--copy-soft)', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'none' }}
          >
            {t('footer.rules')}
          </a>
          <div className="site-footer__socials" aria-label="AEVIC sosial linkləri">
            {socials.map((social) => (
              <a key={social.label} href={social.href} target="_blank" rel="noreferrer" className="site-footer__social-link">
                {social.label}
              </a>
            ))}
          </div>
          <div className="footer__admin-gate">
            <button
              type="button"
              className="footer__admin-trigger"
              onClick={() => navigate('/admin')}
              aria-label="Admin"
            >
              ⚙
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
