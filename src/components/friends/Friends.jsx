import formatDate from '../../functions/formatDate';
import useFriendsManagement from '../../hooks/useFriendsManagement';
import AddFriend from './AddFriend';

const Friends = () => {
  const {
    user,
    isLoading,
    error,
    errorMessage,
    data,
    processingActions,
    handlers: {
      handleRemoveFriend,
      handleAcceptRequest,
      handleDeclineRequest,
      handleCancelRequest,
    },
  } = useFriendsManagement();

  if (!user) {
    return <div>Loading...</div>;
  }

  if (isLoading) {
    return (
      <div className='bg-scrapbook-bg-main dark:bg-scrapbook-bg-dark min-h-screen'>
        <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='text-center py-8 text-scrapbook-gray-600'>
            Loading friends...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-scrapbook-bg-main dark:bg-scrapbook-bg-dark min-h-screen'>
        <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='text-center py-8 text-scrapbook-error'>
            {errorMessage.includes('index') ||
            errorMessage.includes('Index') ? (
              <p>
                Friend system is being set up... Please wait a few minutes and
                refresh the page.
              </p>
            ) : (
              <p>Error loading friends.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { allItems, friendCount, pendingCount } = data;

  return (
    <div className='bg-scrapbook-bg-main dark:bg-scrapbook-bg-dark min-h-screen'>
      <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        <div className='mx-auto'>
          <h2 className='text-2xl font-bold text-scrapbook-primary mb-8'>
            Friends ({friendCount}){' '}
            {pendingCount > 0 && `• ${pendingCount} pending`}
          </h2>

          <AddFriend userId={user.uid} />

          {allItems.length === 0 ? (
            <div className='text-center py-12 text-scrapbook-gray-600 italic'>
              <p>
                No friends or pending requests yet. Send a friend request above
                to get started!
              </p>
            </div>
          ) : (
            <div className='bg-white p-8 rounded-lg shadow-sm'>
              {allItems.map((item) => {
                if (item.type === 'friend') {
                  const isProcessing = processingActions[item.friendshipId];
                  return (
                    <div
                      key={`friend-${item.friendshipId}`}
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
                            handleRemoveFriend(
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
                } else if (item.type === 'incoming') {
                  const isProcessing = processingActions[item.id];
                  return (
                    <div
                      key={`incoming-${item.id}`}
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
                          onClick={() =>
                            handleAcceptRequest(item.id, item.fromUserId)
                          }
                          className='bg-scrapbook-success hover:bg-scrapbook-success-dark text-scrapbook-white rounded px-4 py-2 text-sm transition-colors whitespace-nowrap'
                          disabled={isProcessing}
                        >
                          {isProcessing ? 'Processing...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(item.id)}
                          className='bg-scrapbook-error hover:bg-scrapbook-error-dark text-scrapbook-white rounded px-4 py-2 text-sm transition-colors whitespace-nowrap'
                          disabled={isProcessing}
                        >
                          {isProcessing ? 'Processing...' : 'Decline'}
                        </button>
                      </div>
                    </div>
                  );
                } else if (item.type === 'outgoing') {
                  const isProcessing = processingActions[item.id];
                  return (
                    <div
                      key={`outgoing-${item.id}`}
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
                          onClick={() => handleCancelRequest(item.id)}
                          className='bg-scrapbook-gray-600 hover:bg-scrapbook-gray-700 text-scrapbook-white rounded px-4 py-2 text-sm transition-colors whitespace-nowrap'
                          disabled={isProcessing}
                        >
                          {isProcessing ? 'Cancelling...' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Friends;
