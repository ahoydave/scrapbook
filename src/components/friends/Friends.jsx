import useFriendsManagement from '../../hooks/useFriendsManagement';
import AddFriend from './AddFriend';
import FriendCard from './FriendCard';
import IncomingRequestCard from './IncomingRequestCard';
import OutgoingRequestCard from './OutgoingRequestCard';

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
          <div className='text-center py-8 text-scrapbook-primary-dark dark:text-scrapbook-primary-light'>
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

  const { allItems } = data;

  // Sort items: incoming first, then outgoing, then friends
  const sortedItems = allItems.sort((a, b) => {
    const priority = { incoming: 1, outgoing: 2, friend: 3 };
    return priority[a.type] - priority[b.type];
  });

  // Calculate counts from sorted items
  const actualFriendCount = sortedItems.filter(item => item.type === 'friend').length;
  const totalPendingCount = sortedItems.filter(item => item.type === 'incoming' || item.type === 'outgoing').length;

  return (
    <div className='bg-scrapbook-bg-main dark:bg-scrapbook-bg-dark min-h-screen'>
      <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        <div className='mx-auto'>
          <h2 className='text-2xl font-bold text-scrapbook-primary-dark dark:text-scrapbook-primary-light mb-8'>
            Friends ({actualFriendCount}){' '}
            {totalPendingCount > 0 && `• ${totalPendingCount} pending`}
          </h2>

          <AddFriend userId={user.uid} />

          {sortedItems.length === 0 ? (
            <div className='text-center py-12 text-scrapbook-gray-600 italic'>
              <p>
                No friends or pending requests yet. Send a friend request above
                to get started!
              </p>
            </div>
          ) : (
            <div className='bg-white p-8 rounded-lg shadow-sm'>
              {sortedItems.map((item) => {
                if (item.type === 'friend') {
                  const isProcessing = processingActions[item.friendshipId];
                  return (
                    <FriendCard
                      key={`friend-${item.friendshipId}`}
                      item={item}
                      isProcessing={isProcessing}
                      onRemoveFriend={handleRemoveFriend}
                    />
                  );
                } else if (item.type === 'incoming') {
                  const isProcessing = processingActions[item.id];
                  return (
                    <IncomingRequestCard
                      key={`incoming-${item.id}`}
                      item={item}
                      isProcessing={isProcessing}
                      onAcceptRequest={handleAcceptRequest}
                      onDeclineRequest={handleDeclineRequest}
                    />
                  );
                } else if (item.type === 'outgoing') {
                  const isProcessing = processingActions[item.id];
                  return (
                    <OutgoingRequestCard
                      key={`outgoing-${item.id}`}
                      item={item}
                      isProcessing={isProcessing}
                      onCancelRequest={handleCancelRequest}
                    />
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
