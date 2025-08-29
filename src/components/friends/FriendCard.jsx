import formatDate from '../../functions/formatDate';

const FriendCard = ({ item, isProcessing, onRemoveFriend }) => {
  return (
    <div
      className='border border-scrapbook-gray-200 rounded-lg p-4 mb-4 bg-scrapbook-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'
    >
      <div className='flex items-center gap-4 flex-1'>
        {item.friendData.photoURL ? (
          <img
            src={item.friendData.photoURL}
            alt={`${item.friendData.displayName}'s profile`}
            className='w-[50px] h-[50px] rounded-full object-cover'
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className='w-[50px] h-[50px] rounded-full bg-scrapbook-secondary flex items-center justify-center font-bold text-white text-xl'
          style={{
            display: item.friendData.photoURL ? 'none' : 'flex',
          }}
        >
          {item.friendData.displayName
            ?.charAt(0)
            ?.toUpperCase() || 'U'}
        </div>
        <div className='flex-1'>
          <div className='font-semibold text-scrapbook-gray-800'>
            {item.friendData.displayName || 'Unknown User'}
          </div>
          <div className='text-sm text-scrapbook-gray-600'>
            {item.friendData.email}
          </div>
          <div className='text-xs text-scrapbook-gray-500'>
            Friends since {formatDate(item.createdAt)}
          </div>
        </div>
      </div>
      <div className='flex justify-end sm:justify-end flex-shrink-0'>
        <button
          onClick={() =>
            onRemoveFriend(
              item.friendshipId,
              item.friendData.displayName
            )
          }
          className='bg-scrapbook-error hover:bg-scrapbook-error-dark text-scrapbook-white rounded px-4 py-2 text-sm transition-colors whitespace-nowrap'
          disabled={isProcessing}
        >
          {isProcessing ? 'Removing...' : 'Remove Friend'}
        </button>
      </div>
    </div>
  );
};

export default FriendCard;
