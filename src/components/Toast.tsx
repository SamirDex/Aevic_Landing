import { useEffect } from 'react';

type ToastProps = {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
};

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const borderColor = type === 'success' ? '#f0c040' : '#e05555';

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .toast {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
      <div
        className="toast"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 9999,
          backgroundColor: '#1a1a2e',
          borderLeft: `4px solid ${borderColor}`,
          borderRadius: '8px',
          padding: '1rem',
          minWidth: '300px',
          maxWidth: '400px',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <span style={{
            fontSize: '0.875rem',
            lineHeight: '1.4',
            flex: 1
          }}>
            {message}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#999',
              cursor: 'pointer',
              fontSize: '1.25rem',
              lineHeight: 1,
              padding: '0',
              marginLeft: '0.5rem',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#999'}
          >
            ✕
          </button>
        </div>
        <div style={{
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#f3c450',
          letterSpacing: '0.1em',
          textAlign: 'right',
          marginTop: '0.25rem'
        }}>
          AEVIC
        </div>
      </div>
    </>
  );
}
