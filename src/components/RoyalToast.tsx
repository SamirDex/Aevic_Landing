import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface RoyalToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
  role?: string;
  ariaLive?: 'polite' | 'assertive' | 'off';
}

const RoyalToast: React.FC<RoyalToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose,
  role = 'alert',
  ariaLive = 'polite',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles = {
    success: {
      borderColor: 'var(--color-success)',
      icon: '✓',
      iconColor: 'var(--color-success)',
    },
    error: {
      borderColor: 'var(--color-destructive)',
      icon: '✕',
      iconColor: 'var(--color-destructive)',
    },
    info: {
      borderColor: 'var(--color-gold)',
      icon: 'i',
      iconColor: 'var(--color-gold)',
    },
    warning: {
      borderColor: 'var(--color-purple)',
      icon: '!',
      iconColor: 'var(--color-purple)',
    },
  };

  const style = typeStyles[type];

  return (
    <div
      className={`royal-toast royal-toast--${type}`}
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
        borderColor: style.borderColor,
      }}
    >
      {/* Corner decorations */}
      <div className="royal-toast__corner royal-toast__corner--tl" style={{ borderColor: style.borderColor }} aria-hidden="true" />
      <div className="royal-toast__corner royal-toast__corner--tr" style={{ borderColor: style.borderColor }} aria-hidden="true" />
      <div className="royal-toast__corner royal-toast__corner--bl" style={{ borderColor: style.borderColor }} aria-hidden="true" />
      <div className="royal-toast__corner royal-toast__corner--br" style={{ borderColor: style.borderColor }} aria-hidden="true" />

      {/* Icon */}
      <div className="royal-toast__icon" style={{ color: style.iconColor }} aria-hidden="true">
        {style.icon}
      </div>

      {/* Message */}
      <div className="royal-toast__message">{message}</div>

      {/* Close button */}
      <button 
        className="royal-toast__close"
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300);
        }}
        aria-label="Close"
      >
        ✕
      </button>

      {/* Progress bar */}
      <div 
        className="royal-toast__progress"
        style={{ 
          borderColor: style.borderColor,
          animationDuration: `${duration}ms`,
        }}
        aria-hidden="true"
      />
    </div>
  );
};

export default RoyalToast;
