const UserAvatar = ({ 
  src, 
  alt, 
  fallbackText, 
  size = 50, 
  className = '',
  bgColor = 'bg-scrapbook-primary-dark'
}) => {
  const sizeClasses = `w-[${size}px] h-[${size}px]`;
  
  return (
    <>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`${sizeClasses} rounded-full object-cover ${className}`}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div
        className={`${sizeClasses} rounded-full ${bgColor} flex items-center justify-center font-bold text-white text-xl ${className}`}
        style={{
          display: src ? 'none' : 'flex',
        }}
      >
        {fallbackText?.charAt(0)?.toUpperCase() || 'U'}
      </div>
    </>
  );
};

export default UserAvatar;
