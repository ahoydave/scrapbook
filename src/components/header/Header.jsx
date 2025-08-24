import { signOut } from 'firebase/auth';
import { useLocation } from 'react-router-dom';
import { Disclosure, DisclosureButton } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { auth } from '../../firebase';
import { Heading } from '../common/heading';
import { useHeaderState } from '../../hooks/useHeaderState';
import NavBar from './NavBar';
import UserMenu from './UserMenu';
import MobileMenu from './MobileMenu';
import { Link } from 'react-router-dom';
import getNavigationItems from '../../functions/getNavigationItems';

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

  const navigation = getNavigationItems(user, location, incomingCount);

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
                  <Link to="/">
                    <Heading level={1} className="text-2xl font-bold text-indigo-600">Scrapbook</Heading>
                  </Link>
                </div>
                {user && <NavBar navigation={navigation} />}
              </div>
              
              {user && (
                <>
                  <UserMenu userDisplayInfo={userDisplayInfo} handleLogout={handleLogout} />
                  <div className="-mr-2 flex items-center sm:hidden">
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
                </>
              )}
            </div>
          </div>
          {user && <MobileMenu 
            user={user} 
            navigation={navigation} 
            userDisplayInfo={userDisplayInfo} 
            handleLogout={handleLogout} 
          />}
        </>
      )}
    </Disclosure>
  );
};

export default Header;