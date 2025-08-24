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
        </Link>
      ))}
    </div>
  );
};

export default NavBar;