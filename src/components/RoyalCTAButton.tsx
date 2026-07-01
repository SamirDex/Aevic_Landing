import React, { useState } from 'react';

interface RoyalCTAButtonProps {
  text?: string;
  subtext?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

const RoyalCTAButton: React.FC<RoyalCTAButtonProps> = ({
  text = 'Qeydiyyatdan Keç',
  subtext = 'Sistemi Başlat',
  onClick = () => {},
  className = '',
  disabled = false,
  ariaLabel,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={`royal-cta-button ${className}`}>
      {/* Corner decorations */}
      <div className="royal-cta-button__corner royal-cta-button__corner--tl" 
           style={{ opacity: isHovered ? 1 : 0.5 }} 
           aria-hidden="true" />
      <div className="royal-cta-button__corner royal-cta-button__corner--tr" 
           style={{ opacity: isHovered ? 1 : 0.5 }} 
           aria-hidden="true" />
      <div className="royal-cta-button__corner royal-cta-button__corner--bl" 
           style={{ opacity: isHovered ? 1 : 0.5 }} 
           aria-hidden="true" />
      <div className="royal-cta-button__corner royal-cta-button__corner--br" 
           style={{ opacity: isHovered ? 1 : 0.5 }} 
           aria-hidden="true" />

      {/* Main button */}
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="royal-cta-button__main focus-ring"
        disabled={disabled}
        aria-label={ariaLabel || text}
        style={{
          boxShadow: isHovered 
            ? 'var(--glow-primary)' 
            : 'var(--glow-secondary)',
        }}
      >
        {/* Animated background overlay */}
        <div 
          className="royal-cta-button__overlay"
          style={{ opacity: isHovered ? 0.7 : 0 }}
          aria-hidden="true"
        />

        {/* Scan line effect */}
        <div 
          className="royal-cta-button__scanline"
          style={{ 
            transform: isHovered ? 'translateY(100%)' : 'translateY(-100%)',
          }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="royal-cta-button__content">
          <div className="royal-cta-button__text-wrapper">
            <span className="royal-cta-button__subtext">
              {subtext}
            </span>
            <span className="royal-cta-button__text">
              {text}
            </span>
          </div>
          
          <div className="royal-cta-button__arrow">
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="royal-cta-button__arrow-icon"
              style={{ transform: isHovered ? 'translateX(4px)' : 'translateX(0)' }}
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </div>

        {/* Grid overlay */}
        <div className="royal-cta-button__grid" aria-hidden="true" />
      </button>

      {/* HUD elements */}
      <div 
        className="royal-cta-button__hud royal-cta-button__hud--top"
        style={{ opacity: isHovered ? 1 : 0.6 }}
        aria-hidden="true"
      >
        [SYS_READY]
      </div>
      <div 
        className="royal-cta-button__hud royal-cta-button__hud--bottom"
        style={{ opacity: isHovered ? 1 : 0.6 }}
        aria-hidden="true"
      >
        {'>'} STATUS: {isHovered ? 'ACTIVE' : 'STANDBY'}
      </div>

      {/* Glow effect */}
      {isHovered && (
        <div className="royal-cta-button__glow" aria-hidden="true" />
      )}
    </div>
  );
};

export default RoyalCTAButton;
