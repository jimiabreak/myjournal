/* eslint-disable @next/next/no-img-element */
import Image from 'next/image';

type UserpicProps = {
  src?: string | null;
  alt: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
};

export function Userpic({ src, alt, size = 'large', className = '' }: UserpicProps) {
  const iconSizes = {
    large: { width: 60, height: 60 },
    medium: { width: 32, height: 32 },
    small: { width: 20, height: 20 },
  };

  if (!src) {
    const iconSize = iconSizes[size];
    if (size === 'large') {
      return (
        <div className={`lj-userpic lj-userpic-placeholder ${className}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Image
            src="/icons/userinfo.svg"
            alt="Default user icon"
            width={iconSize.width}
            height={iconSize.height}
          />
        </div>
      );
    } else if (size === 'medium') {
      return (
        <div className={`lj-userpic-medium lj-userpic-placeholder ${className}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Image
            src="/icons/userinfo.svg"
            alt="Default user icon"
            width={iconSize.width}
            height={iconSize.height}
          />
        </div>
      );
    } else {
      return (
        <div className={`lj-userpic-small lj-userpic-placeholder ${className}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Image
            src="/icons/userinfo.svg"
            alt="Default user icon"
            width={iconSize.width}
            height={iconSize.height}
          />
        </div>
      );
    }
  }

  if (size === 'large') {
    return (
      <div className="lj-userpic">
        <img src={src} alt={alt} />
      </div>
    );
  } else if (size === 'medium') {
    return (
      <div className="lj-userpic-medium">
        <img src={src} alt={alt} />
      </div>
    );
  } else {
    return (
      <div className="lj-userpic-small">
        <img src={src} alt={alt} />
      </div>
    );
  }
}
