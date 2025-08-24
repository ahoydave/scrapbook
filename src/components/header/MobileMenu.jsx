import { DisclosurePanel, DisclosureButton } from '@headlessui/react';
import { Link } from '../common/link';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const MobileMenu = ({ navigation, userDisplayInfo, handleLogout }) => {
  return (
    <DisclosurePanel className="sm:hidden">
      <div className="space-y-1 pb-3 pt-2">
        {navigation.map((item) => (
          <DisclosureButton
            key={item.name}
            as="div"
            className="block"
          >
            <Link
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
            </Link>
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
                className="h-10 w-10 rounded-full outline -outline-offset-1 outline-black/5"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-medium">
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
  );
};

export default MobileMenu;