const getNavigationItems = (location, incomingCount) => {
  const navigation = [
    { name: 'Home', href: '/', current: location.pathname === '/' },
    {
      name: 'Friends',
      href: '/friends',
      current: location.pathname === '/friends',
      badge: incomingCount > 0 ? incomingCount : null,
    },
  ];

  return navigation;
};

export default getNavigationItems;
