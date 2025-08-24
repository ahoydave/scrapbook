import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const UserMenu = ({ userDisplayInfo, handleLogout }) => {
  return (
    <div className="hidden sm:ml-6 sm:flex sm:items-center">
      <Menu as="div" className="relative ml-3">
        <MenuButton className="relative flex max-w-xs items-center rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
          <span className="absolute -inset-1.5" />
          <span className="sr-only">Open user menu</span>
          {userDisplayInfo.photoURL ? (
            <img 
              src={userDisplayInfo.photoURL} 
              alt="Profile" 
              className="h-8 w-8 rounded-full outline -outline-offset-1 outline-black/5"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-medium">
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
  );
};

export default UserMenu;