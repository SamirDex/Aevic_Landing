import type { ImgHTMLAttributes } from 'react';
import type { ResponsiveJourneyAsset } from './journeyAssets';

type ResponsiveJourneyImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  asset: ResponsiveJourneyAsset;
};

export function ResponsiveJourneyImage({
  asset,
  alt,
  sizes,
  src,
  ...imgProps
}: ResponsiveJourneyImageProps) {
  const responsiveSizes = sizes ?? asset.sizes;

  return (
    <picture>
      <source
        type="image/avif"
        srcSet={`${asset.avif.mobile} 960w, ${asset.avif.desktop} 1536w`}
        sizes={responsiveSizes}
      />
      <source
        type="image/webp"
        srcSet={`${asset.webp.mobile} 960w, ${asset.webp.desktop} 1536w`}
        sizes={responsiveSizes}
      />
      <img
        src={src ?? asset.fallback}
        alt={alt ?? asset.alt}
        sizes={responsiveSizes}
        decoding="async"
        {...imgProps}
      />
    </picture>
  );
}
