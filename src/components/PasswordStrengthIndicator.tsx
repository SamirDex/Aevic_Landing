import './PasswordStrengthIndicator.css';

interface PasswordStrengthIndicatorProps {
  password: string;
  showLabel?: boolean;
}

export function PasswordStrengthIndicator({ password, showLabel = true }: PasswordStrengthIndicatorProps) {
  const calculateStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0;

    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z\d]/.test(pwd)) score++;

    if (score <= 2) return { score: 1, label: 'Zəif', color: 'weak' };
    if (score <= 4) return { score: 2, label: 'Orta', color: 'medium' };
    return { score: 3, label: 'Güclü', color: 'strong' };
  };

  const strength = calculateStrength(password);

  return (
    <div className="password-strength">
      <div className="password-strength__bars">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`password-strength__bar password-strength__bar--${strength.color} ${
              i <= strength.score ? 'password-strength__bar--filled' : ''
            }`}
          />
        ))}
      </div>
      {showLabel && (
        <span className={`password-strength__label password-strength__label--${strength.color}`}>
          {strength.label}
        </span>
      )}
    </div>
  );
}
