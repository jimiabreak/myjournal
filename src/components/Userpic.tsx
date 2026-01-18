type UserpicProps = {
  src?: string | null;
  alt: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
};

export function Userpic({ src, alt, size = 'large', className = '' }: UserpicProps) {
  if (!src) {
    if (size === 'large') {
      return (
        <div className={`lj-userpic lj-userpic-placeholder ${className}`}>
          <span className="text-tiny">No userpic</span>
        </div>
      );
    } else if (size === 'medium') {
      return (
        <div className={`lj-userpic-medium lj-userpic-placeholder ${className}`}>
          <span className="text-tiny">No pic</span>
        </div>
      );
    } else {
      return (
        <div className={`lj-userpic-small lj-userpic-placeholder ${className}`}>
          <span className="text-tiny">•</span>
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