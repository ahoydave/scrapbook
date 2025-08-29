import formatDate from '../../functions/formatDate';

const OutgoingRequestCard = ({ item, isProcessing, onCancelRequest }) => {
  return (
    <div
      className='border border-scrapbook-gray-200 border-l-[3px] border-l-scrapbook-warning rounded-lg p-4 mb-4 bg-scrapbook-warning-light flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'
    >
      <div className='flex items-center gap-4 flex-1'>
        <div className='w-[50px] h-[50px] rounded-full bg-scrapbook-secondary flex items-center justify-center font-bold text-white text-xl'>
          {item.toUserEmail?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className='flex-1'>
          <div className='font-semibold text-scrapbook-gray-800'>
            Request sent
          </div>
          <div className='text-sm text-scrapbook-gray-600'>
            {item.toUserEmail}
          </div>
          <div className='text-xs text-scrapbook-gray-500'>
            Sent {formatDate(item.createdAt)}
          </div>
        </div>
      </div>
      <div className='flex justify-end sm:justify-end flex-shrink-0'>
        <button
          onClick={() => onCancelRequest(item.id)}
          className='bg-scrapbook-gray-600 hover:bg-scrapbook-gray-700 text-scrapbook-white rounded px-4 py-2 text-sm transition-colors whitespace-nowrap'
          disabled={isProcessing}
        >
          {isProcessing ? 'Cancelling...' : 'Cancel'}
        </button>
      </div>
    </div>
  );
};

export default OutgoingRequestCard;
