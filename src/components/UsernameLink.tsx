import Link from 'next/link';
import Image from 'next/image';

type Props = {
  username: string;
  displayName?: string;
  showIcon?: boolean;
  className?: string;
};

export function UsernameLink({
  username,
  displayName,
  showIcon = true,
  className = '',
}: Props) {
  return (
    <Link href={`/journal/${username}`} className={`username-link ${className}`.trim()}>
      {showIcon && (
        <Image
          src="/icons/userinfo.svg"
          alt=""
          width={16}
          height={16}
          className="userinfo-icon"
        />
      )}
      {displayName || username}
    </Link>
  );
}
