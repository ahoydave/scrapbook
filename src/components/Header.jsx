import { signOut } from 'firebase/auth';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { auth } from '../firebase';
import { Heading } from './common/heading';
import { useHeaderState } from '../hooks/useHeaderState';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const Header = () => {
  const { user, loading, incomingCount, userDisplayInfo } = useHeaderState();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigation = [
    { name: 'Home', href: '/', current: location.pathname === '/' },
    { 
      name: 'Friends', 
      href: '/friends', 
      current: location.pathname === '/friends',
      badge: incomingCount > 0 ? incomingCount : null
    },
  ];

  if (loading) {
    return (
      <div className="min-h-16 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Heading level={1} className="text-2xl font-bold text-indigo-600">Scrapbook</Heading>
            </div>
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Disclosure as="nav" className="border-b border-gray-200 bg-white">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex shrink-0 items-center">
                  <RouterLink to="/">
                    <Heading level={1} className="text-2xl font-bold text-indigo-600">Scrapbook</Heading>
                  </RouterLink>
                </div>
                {user && (
                  <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                    {navigation.map((item) => (
                      <RouterLink
                        key={item.name}
                        to={item.href}
                        className={classNames(
                          item.current
                            ? 'border-indigo-600 text-gray-900'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                          'relative inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium'
                        )}
                      >
                        {item.name}
                        {item.badge && (
                          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </RouterLink>
                    ))}
                  </div>
                )}
              </div>
              {user && (
                <div className="hidden sm:ml-6 sm:flex sm:items-center">
                  <Menu as="div" className="relative ml-3">
                    <MenuButton className="relative flex max-w-xs items-center rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                      <span className="absolute -inset-1.5" />
                      <span className="sr-only">Open user menu</span>
                      {userDisplayInfo.photoURL ? (
                        <img 
                          src={userDisplayInfo.photoURL} 
                          alt="Profile" 
                          className="size-8 rounded-full outline -outline-offset-1 outline-black/5"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className="size-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-medium">
                          {userDisplayInfo.initial}
                        </div>
                      )}
                    </MenuButton>
                    <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="px-4 py-2 text-sm text-gray-700">
                        <div className="font-medium">{userDisplayInfo.displayName}</div>
                      </div>
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={classNames(
                              active ? 'bg-gray-100' : '',
                              'block w-full text-left px-4 py-2 text-sm text-gray-700'
                            )}
                          >
                            Logout
                          </button>
                        )}
                      </MenuItem>
                    </MenuItems>
                  </Menu>
                </div>
              )}
              
              {user && (
                <div className="-mr-2 flex items-center sm:hidden">
                  {/* Mobile menu button */}
                  <DisclosureButton className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    <span className="absolute -inset-0.5" />
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </DisclosureButton>
                </div>
              )}
            </div>
          </div>

          {user && (
            <DisclosurePanel className="sm:hidden">
              <div className="space-y-1 pb-3 pt-2">
                {navigation.map((item) => (
                  <DisclosureButton
                    key={item.name}
                    as="div"
                    className="block"
                  >
                    <RouterLink
                      to={item.href}
                      className={classNames(
                        item.current
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800',
                        'relative block border-l-4 py-2 pl-3 pr-4 text-base font-medium'
                      )}
                    >
                      {item.name}
                      {item.badge && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </RouterLink>
                  </DisclosureButton>
                ))}
              </div>
              <div className="border-t border-gray-200 pb-3 pt-4">
                <div className="flex items-center px-4">
                  <div className="shrink-0">
                    {userDisplayInfo.photoURL ? (
                      <img 
                        src={userDisplayInfo.photoURL} 
                        alt="Profile" 
                        className="size-10 rounded-full outline -outline-offset-1 outline-black/5"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : (
                      <div className="size-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-medium">
                        {userDisplayInfo.initial}
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {userDisplayInfo.displayName}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <DisclosureButton
                    as="button"
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  >
                    Logout
                  </DisclosureButton>
                </div>
              </div>
            </DisclosurePanel>
          )}
        </>
      )}
    </Disclosure>
  );
};

export default Header;