import { Link } from '../common/link';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const NavBar = ({ navigation }) => {
  return (
    <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
      {navigation.map((item) => (
        <Link
          key={item.name}
          to={item.href}
          className={classNames(
            item.current
              ? 'border-scrapbook-indigo text-scrapbook-gray-900'
              : 'border-transparent text-scrapbook-gray-500 dark:text-scrapbook-text-light hover:border-scrapbook-gray-300 hover:text-scrapbook-gray-700 dark:hover:text-scrapbook-text-lightest',
            'relative inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium'
          )}
        >
          {item.name}
          {item.badge && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-scrapbook-white transform translate-x-1/2 -translate-y-1/2 bg-scrapbook-error rounded-full">
              {item.badge}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
};

export default NavBar;