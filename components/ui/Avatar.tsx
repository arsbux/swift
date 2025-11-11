import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  name?: string | null;
}

export default function Avatar({ src, alt, size = 'md', name }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
  };
  
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
  
  if (src) {
    return (
      <div className={`${sizes[size]} relative rounded-full overflow-hidden bg-gray-200`}>
        <Image
          src={src}
          alt={alt || name || 'Avatar'}
          fill
          className="object-cover"
        />
      </div>
    );
  }
  
  return (
    <div
      className={`${sizes[size]} rounded-full bg-accent text-white flex items-center justify-center font-medium`}
    >
      {initials}
    </div>
  );
}

