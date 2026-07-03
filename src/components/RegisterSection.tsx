import { startTransition, type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { isValidPhone } from '../lib/phone';
import { registerTeam } from '../lib/teamAuth';
import { SectionReveal } from './SectionReveal';
import { CapacityProgress } from './CapacityProgress';

type FormData = {
  teamName: string;
  captainName: string;
  captainContact: string;
  email: string;
  password: string;
  confirmPassword: string;
  player1: string;
  player2: string;
  player3: string;
  player4: string;
  player5: string;
  agreed: boolean;
};

type FormErrors = Partial<Record<keyof FormData | 'logoFile', string>>;

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const initialForm: FormData = {
  teamName: '',
  captainName: '',
  captainContact: '',
  email: '',
  password: '',
  confirmPassword: '',
  player1: '',
  player2: '',
  player3: '',
  player4: '',
  player5: '',
  agreed: false,
};

const requirements = [
  '4 əsas oyunçu',
  '1 ehtiyat oyunçu',
  'Kapitan WP nömrəsi',
  'Email + şifrə',
  'Komanda logosu (PNG)',
];

const expectations = [
  'Admin təsdiqi',
  'Room ID + şifrə',
  'Nəticə kartı',
  'Panel girişi',
];

function getFieldLabel(field: keyof Pick<FormData, 'player1' | 'player2' | 'player3' | 'player4'>, t: (key: string) => string) {
  const playerNum = field.slice(-1);
  return t(`register.player${playerNum}`);
}

export function RegisterSection() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(initialForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [message, setMessage] = useState('');
  const [submittedTeamName, setSubmittedTeamName] = useState('');
  const [otpStep, setOtpStep] = useState<'form' | 'verify_email'>('form');
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [logoFile]);

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    setLogoFile(file);
    setErrors((current) => ({ ...current, logoFile: undefined }));
    setMessage('');
  };

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    startTransition(() => {
      setForm((current) => ({ ...current, [key]: value }));
      setErrors((current) => ({ ...current, [key]: undefined }));
      setMessage('');
    });
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    const normalizedEmail = form.email.trim();

    if (form.teamName.trim().length < 3) {
      nextErrors.teamName = 'Komanda adı ən azı 3 simvol olmalıdır.';
    }
    if (!form.captainName.trim()) {
      nextErrors.captainName = 'Kapitan adı tələb olunur.';
    }
    if (!form.captainContact.trim()) {
      nextErrors.captainContact = 'Kapitanın WhatsApp nömrəsi tələb olunur.';
    } else if (!isValidPhone(form.captainContact)) {
      nextErrors.captainContact = 'Düzgün telefon nömrəsi daxil edin (ən azı 9 rəqəm).';
    }
    if (!normalizedEmail) {
      nextErrors.email = 'Email tələb olunur.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = 'Düzgün email ünvanı daxil edin.';
    }
    if (form.password.trim().length < 6) {
      nextErrors.password = 'Şifrə ən azı 6 simvol olmalıdır.';
    }
    if (!form.confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Şifrəni təkrar daxil edin.';
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Şifrələr uyğun gəlmir.';
    }

    (['player1', 'player2', 'player3', 'player4'] as const).forEach((playerKey) => {
      if (!form[playerKey].trim()) {
        nextErrors[playerKey] = `${getFieldLabel(playerKey, t)} tələb olunur.`;
      }
    });

    if (!form.agreed) {
      nextErrors.agreed = 'Turnir qaydaları ilə razılaşmalısınız.';
    }

    if (!logoFile) {
      nextErrors.logoFile = 'Komanda logosu (PNG) tələb olunur.';
    } else {
      const extension = logoFile.name.split('.').pop()?.toLowerCase();

      if (logoFile.type !== 'image/png' || extension !== 'png') {
        nextErrors.logoFile = 'Logo yalnız PNG formatında olmalıdır.';
      } else if (logoFile.size > MAX_LOGO_BYTES) {
        nextErrors.logoFile = 'Logo ən çox 2 MB ola bilər.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      if (!logoFile) {
        return;
      }

      // Use registerTeam which includes logo compression via preparePngLogoDataUrl
      const data = await registerTeam({
        teamName: form.teamName,
        captainName: form.captainName,
        captainContact: form.captainContact,
        email: form.email,
        password: form.password,
        player1: form.player1,
        player2: form.player2,
        player3: form.player3,
        player4: form.player4,
        player5: form.player5 || undefined,
        logoFile,
      });

      // Handle OTP verification step
      if (data.step === 'verify_email') {
        setPendingEmail(form.email);
        setOtpStep('verify_email');
        setStatus('idle');
        return;
      }

      // Direct success without OTP - auto-login
      if (data.team) {
        login(data.team);
        navigate('/panel');
        return;
      }

      setSubmittedTeamName(form.teamName);
      setStatus('success');
    } catch (submissionError) {
      setStatus('idle');
      setMessage(
        submissionError instanceof Error
          ? submissionError.message
          : 'Qeydiyyatı tamamlamaq olmadı. Zəhmət olmasa yenidən cəhd edin.',
      );
    }
  };

  const handleOtpSubmit = async () => {
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail, otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || 'Kod yanlışdır.');
      } else {
        // Qeydiyyat tamamlandı — auto-login
        if (data.team) {
          login(data.team);
          navigate('/panel');
          return;
        }
        setSubmittedTeamName(data.team_name);
        setStatus('success');
        setOtpStep('form');
      }
    } catch {
      setOtpError('Şəbəkə xətası. Yenidən cəhd edin.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    setOtpError('');
    try {
      const res = await fetch('/api/teams/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || 'OTP yenidən göndərilmədi.');
      } else {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      }
    } catch {
      setOtpError('Şəbəkə xətası. Yenidən cəhd edin.');
    } finally {
      setResendLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <section className="register" id="register">
        <div className="section-frame">
          <div className="register__success">
            <div className="register__success-icon">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="31" stroke="rgba(74,222,128,0.4)" strokeWidth="1.5" />
                <circle cx="32" cy="32" r="24" fill="rgba(74,222,128,0.08)" />
                <path
                  d="M20 32L28 40L44 24"
                  stroke="#4ade80"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="register__success-title">Qeydiyyat Alındı!</h3>
            <p className="register__success-sub">
              <strong>{submittedTeamName}</strong> komandası uğurla qeydiyyatdan keçdi.
              Admin yoxladıqdan sonra email bildirişi alacaqsınız.
            </p>
            <div className="register__success-steps">
              <div className="register__success-step">
                <span className="register__success-step-num">1</span>
                <span>Qeydiyyat göndərildi ✓</span>
              </div>
              <div className="register__success-step register__success-step--pending">
                <span className="register__success-step-num">2</span>
                <span>Admin təsdiqi gözlənilir...</span>
              </div>
              <div className="register__success-step register__success-step--muted">
                <span className="register__success-step-num">3</span>
                <span>Room kodu alınacaq</span>
              </div>
            </div>
            <div className="register__success-actions">
              <Link to="/panel" className="button button--primary">
                Panelə Keç →
              </Link>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => {
                  setStatus('idle');
                  setForm(initialForm);
                  setLogoFile(null);
                  setLogoPreviewUrl(null);
                  setSubmittedTeamName('');
                }}
              >
                Yeni Qeydiyyat
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (otpStep === 'verify_email') {
    return (
      <section className="register" id="register">
        <div className="section-frame register__frame">
          <div className="otp-box">
            <h2 className="otp-box__title">Email Doğrulama</h2>
            <p className="otp-box__sub">
              <strong className="otp-box__email">{pendingEmail}</strong> ünvanına göndərilən
              6 rəqəmli kodu daxil edin.
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="otp-box__input"
            />
            {otpError && <p className="otp-box__error">{otpError}</p>}
            <div className="otp-box__actions">
              <button
                onClick={handleOtpSubmit}
                disabled={otpCode.length !== 6 || otpLoading}
                className="button button--primary"
              >
                {otpLoading ? 'Yoxlanılır...' : 'Təsdiqlə'}
              </button>
              <button
                onClick={() => { setOtpStep('form'); setOtpCode(''); setOtpError(''); }}
                className="button button--ghost"
              >
                Geri
              </button>
            </div>
            <p className="otp-box__hint">
              Kod gəlməyibsə, spam qovluğunu yoxlayın. Kod 10 dəqiqə etibarlıdır.
            </p>
            <button
              onClick={handleResendOtp}
              disabled={resendLoading}
              className="otp-box__resend"
            >
              {resendLoading ? 'Göndərilir...' : 'Kodu yenidən göndər'}
            </button>
            {resendSuccess && (
              <p className="otp-box__resend-ok">Kod yenidən göndərildi!</p>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="register" id="register">
      <div className="section-frame register__frame">
        {/* Stepper */}
        <div className="register-stepper">
          <div className="register-stepper__step register-stepper__step--active">
            <div className="register-stepper__step-number">1</div>
            <div className="register-stepper__step-label">Komanda məlumatları</div>
          </div>
          <div className="register-stepper__arrow">→</div>
          <div className="register-stepper__step">
            <div className="register-stepper__step-number">2</div>
            <div className="register-stepper__step-label">Oyunçular</div>
          </div>
          <div className="register-stepper__arrow">→</div>
          <div className="register-stepper__step">
            <div className="register-stepper__step-number">3</div>
            <div className="register-stepper__step-label">Təsdiq</div>
          </div>
        </div>

        <CapacityProgress />

        <SectionReveal delay={0.14}>
          <form className="register-form" onSubmit={handleSubmit}>
              <div className="register-form__two-column">
                {/* Left Column - Team Info */}
                <div className="register-form__column">
                  <div className="register-form__section-title">{t('register.step1')}</div>
                  <label className="field">
                    <span>{t('register.teamName')}</span>
                    <input
                      type="text"
                      value={form.teamName}
                      onChange={(event) => setField('teamName', event.target.value)}
                      placeholder={t('register.teamNamePlaceholder')}
                      className={errors.teamName ? 'has-error' : ''}
                    />
                    {errors.teamName ? <small className="field-error">{errors.teamName}</small> : null}
                  </label>

                  <label className="field">
                    <span>{t('register.captainName')}</span>
                    <input
                      type="text"
                      value={form.captainName}
                      onChange={(event) => setField('captainName', event.target.value)}
                      placeholder="Kapitanın tam adı"
                      className={errors.captainName ? 'has-error' : ''}
                    />
                    {errors.captainName ? <small className="field-error">{errors.captainName}</small> : null}
                  </label>

                  <label className="field">
                    <span>{t('register.captainContact')}</span>
                    <input
                      type="tel"
                      value={form.captainContact}
                      onChange={(event) => setField('captainContact', event.target.value)}
                      placeholder="+994 XX XXX XX XX"
                      className={errors.captainContact ? 'has-error' : ''}
                    />
                    {errors.captainContact ? <small className="field-error">{errors.captainContact}</small> : null}
                  </label>

                  <label className="field field--logo">
                    <span>
                      {t('register.logo')} <span className="field-hint">(yalnız PNG, max 2 MB)</span>
                    </span>
                    <input
                      type="file"
                      accept="image/png,.png"
                      onChange={handleLogoChange}
                      className={errors.logoFile ? 'has-error' : ''}
                    />
                    {logoPreviewUrl ? (
                      <div className="logo-preview">
                        <img src={logoPreviewUrl} alt="Seçilmiş komanda logosu" />
                        <span>{logoFile?.name}</span>
                      </div>
                    ) : null}
                    {errors.logoFile ? <small className="field-error">{errors.logoFile}</small> : null}
                  </label>

                  <div className="form-row">
                    <label className="field">
                      <span>
                        {t('login.password')} <span className="field-hint">(panel girişi üçün)</span>
                      </span>
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={form.password}
                        onChange={(event) => setField('password', event.target.value)}
                        placeholder="Ən azı 6 simvol"
                        className={errors.password ? 'has-error' : ''}
                      />
                      {errors.password ? <small className="field-error">{errors.password}</small> : null}
                    </label>

                    <label className="field">
                      <span>Şifrəni təsdiqlə</span>
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={form.confirmPassword}
                        onChange={(event) => setField('confirmPassword', event.target.value)}
                        placeholder="Şifrəni təkrarla"
                        className={errors.confirmPassword ? 'has-error' : ''}
                      />
                      {errors.confirmPassword ? <small className="field-error">{errors.confirmPassword}</small> : null}
                    </label>
                  </div>
                </div>

                {/* Right Column - Players */}
                <div className="register-form__column">
                  <div className="register-form__section-title">Oyunçular</div>
                  {(['player1', 'player2', 'player3', 'player4', 'player5'] as const).map((playerKey) => (
                    <label key={playerKey} className="field">
                      <span>{playerKey === 'player5' ? 'Oyunçu 5 IGN (Ehtiyat)' : getFieldLabel(playerKey as any, t)}</span>
                      <input
                        type="text"
                        value={form[playerKey]}
                        onChange={(event) => setField(playerKey, event.target.value)}
                        placeholder={t('register.playerPlaceholder')}
                        className={errors[playerKey] ? 'has-error' : ''}
                      />
                      {errors[playerKey] ? <small className="field-error">{errors[playerKey]}</small> : null}
                    </label>
                  ))}
                </div>
              </div>

              {/* Email - Full Width */}
              <label className="field field--full">
                <span>{t('register.email')}</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setField('email', event.target.value)}
                  placeholder={t('register.emailPlaceholder')}
                  className={errors.email ? 'has-error' : ''}
                />
                {errors.email ? <small className="field-error">{errors.email}</small> : null}
              </label>

              <label className="consent">
                <input
                  type="checkbox"
                  checked={form.agreed}
                  onChange={(event) => setField('agreed', event.target.checked)}
                />
                <span className="consent__box" />
                <span>
                  <a
                    href="/assets/reqlament.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="consent__link"
                  >
                    {t('nav.rules')}
                  </a>
                  {' '}ilə razıyam.
                </span>
              </label>
              {errors.agreed ? <small className="consent__error field-error">{errors.agreed}</small> : null}

              {message ? <div className="form-message">{message}</div> : null}

              <div className="register-form__actions">
                <button type="submit" className="button button--primary" disabled={status === 'loading'}>
                  {status === 'loading' ? t('register.loading') : t('register.nextStep')}
                </button>
                <button 
                  type="button" 
                  className="button button--ghost"
                  onClick={() => {
                    // Save draft logic here
                  }}
                >
                  {t('register.saveDraft')}
                </button>
              </div>

              <div className="register-form__login-link">
                <p>
                  Artıq hesabınız var?{' '}
                  <Link to="/login" className="register-form__link">
                    {t('login.login')}
                  </Link>
                </p>
              </div>
            </form>
          </SectionReveal>
      </div>
    </section>
  );
}
