import formatDate from '../../functions/formatDate';

const IncomingRequestCard = ({ item, isProcessing, onAcceptRequest, onDeclineRequest }) => {
  return (
    <div
      className='border border-scrapbook-gray-200 border-l-[3px] border-l-scrapbook-success rounded-lg p-4 mb-4 bg-scrapbook-success-light flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'
    >
      <div className='flex items-center gap-4 flex-1'>
        {item.fromUserPhotoURL ? (
          <img
            src={item.fromUserPhotoURL}
            alt={`${item.fromUserName}'s profile`}
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
            display: item.fromUserPhotoURL ? 'none' : 'flex',
          }}
        >
          {item.fromUserName?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className='flex-1'>
          <div className='font-semibold text-scrapbook-gray-800'>
            Incoming request
          </div>
          <div className='text-sm text-scrapbook-gray-600'>
            {item.fromUserEmail}
          </div>
          <div className='text-xs text-scrapbook-gray-500'>
            Sent {formatDate(item.createdAt)}
          </div>
        </div>
      </div>
      <div className='flex flex-col sm:flex-row gap-2 justify-end flex-shrink-0'>
        <button
          onClick={() => onAcceptRequest(item.id, item.fromUserId)}
          className='bg-scrapbook-success hover:bg-scrapbook-success-dark text-scrapbook-white rounded px-4 py-2 text-sm transition-colors whitespace-nowrap'
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Accept'}
        </button>
        <button
          onClick={() => onDeclineRequest(item.id)}
          className='bg-scrapbook-error hover:bg-scrapbook-error-dark text-scrapbook-white rounded px-4 py-2 text-sm transition-colors whitespace-nowrap'
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Decline'}
        </button>
      </div>
    </div>
  );
};

export default IncomingRequestCard;
