import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { List, Contact, Mail, LogOut, Mails, Users } from "lucide-react";
import Logo from "../assets/logo.png";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Flattened navigation items
  const navItems = [
    {
      name: "Send Email",
      path: "/new-email",
      icon: <Mail className="w-4 h-4 mr-2" />,
    },
    {
      name: "All Emails",
      path: "/emails",
      icon: <Mails className="w-4 h-4 mr-2" />,
    },
    {
      name: "All Contacts",
      path: "/contacts",
      icon: <Users className="w-4 h-4 mr-2" />,
    },
    {
      name: "Create Contact",
      path: "/contacts",
      icon: <Contact className="w-4 h-4 mr-2" />,
    },
  ];

  const handleLogout = () => {
    // clear any stored session or token
    localStorage.removeItem("token");
    // navigate back to login
    navigate("/sign-in");
  };

  return (
    <nav className="bg-white border-b border-slate-100 fixed top-0 left-0 w-full z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          {/* Logo Section */}
          <Link to="/" className="flex items-center ml-0 cursor-pointer">
            <img
              src={Logo}
              alt="Pioneer-Writers"
              className="h-10 w-auto sm:h-12 lg:h-14 object-contain"
            />
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className="flex space-x-4 lg:space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="text-gray-600 hover:text-gray-900 transition-colors duration-200 text-sm font-medium flex items-center"
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Logout (desktop) */}
          <div className="hidden md:flex items-center">
            <button
              onClick={handleLogout}
              className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={
                    isMenuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100">
            <div className="px-4 py-2 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-900 py-2 transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
              {/* Logout (mobile) */}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center w-full text-sm text-gray-600 hover:text-gray-900 py-2 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
