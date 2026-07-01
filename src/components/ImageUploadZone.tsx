import { useId, useRef, useState, type DragEvent } from 'react';
import './ImageUploadZone.css';

type ImageUploadZoneProps = {
  title: string;
  description: string;
  actionLabel?: string;
  previewUrl?: string | null;
  previewAlt?: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'results' | 'background' | 'ocr';
  onFile: (file: File) => void;
};

export function ImageUploadZone({
  title,
  description,
  actionLabel = 'Şəkil seç',
  previewUrl,
  previewAlt = 'Önizləmə',
  loading = false,
  disabled = false,
  variant = 'results',
  onFile,
}: ImageUploadZoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const pickFile = (file: File | undefined) => {
    if (!file || disabled || loading) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      return;
    }

    onFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    pickFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className={`image-upload image-upload--${variant}`}>
      <div className="image-upload__head">
        <span className="image-upload__icon" aria-hidden="true">
          {variant === 'background' ? '🖼' : variant === 'ocr' ? '🔍' : '📊'}
        </span>
        <div>
          <h4 className="image-upload__title">{title}</h4>
          <p className="image-upload__description">{description}</p>
        </div>
      </div>

      <div
        className={`image-upload__drop${dragOver ? ' is-dragover' : ''}${disabled || loading ? ' is-disabled' : ''}`}
        role="button"
        tabIndex={disabled || loading ? -1 : 0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled && !loading) {
            setDragOver(true);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && !loading) {
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <span className="image-upload__drop-icon" aria-hidden="true">
          ↑
        </span>
        <strong>{loading ? 'Yüklənir...' : actionLabel}</strong>
        <span className="image-upload__drop-hint">və ya şəkli bura sürüşdürün (PNG, JPG)</span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          className="image-upload__input"
          disabled={disabled || loading}
          onChange={(event) => {
            pickFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
      </div>

      {previewUrl ? (
        <div className="image-upload__preview">
          <img src={previewUrl} alt={previewAlt} />
          <span className="image-upload__preview-badge">Yüklənib ✓</span>
        </div>
      ) : (
        <p className="image-upload__empty">Hələ şəkil yüklənməyib</p>
      )}
    </div>
  );
}
