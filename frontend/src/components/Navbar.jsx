import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  LogOut,
  Mails,
  Users,
  Server,
  ChevronDown,
  Home,
} from "lucide-react";
import Logo from "../assets/logo.png";
import axios from "axios";
import { notify } from "../utils/toast";
import { backend } from "../server";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navigate = useNavigate();

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const navItems = [
    {
      name: "Home",
      path: "/home",
      icon: <Home className="w-4 h-4 mr-2" />,
    },
    {
      name: "Contacts",
      icon: <Users className="w-4 h-4 mr-2" />,
      subItems: [{ name: "All contacts", path: "/contacts" }],
    },
    {
      name: "SMTP Servers",
      icon: <Server className="w-4 h-4 mr-2" />,
      subItems: [
        { name: "New Server", path: "/register-smtp" },
        { name: "SMTP Servers", path: "/smtp-configuration" },
      ],
    },
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
  ];

  const handleLogout = async () => {
    try {
      const response = await axios.post(
        `${backend}/auth/user/sign-out`,
        {},
        { withCredentials: true }
      );
      if (response.status === 200) {
        document.cookie = "userMailMktSession=; Max-Age=0; path=/;";
        localStorage.clear();
        notify.success("Successfully logged out.");
        setTimeout(() => navigate("/sign-in"), 2000);
      } else {
        notify.error("You are not logged in.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      notify.error("Failed to log out.");
    }
  };

  return (
    <nav className="bg-white border-b border-slate-100 fixed top-0 left-0 w-full z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          {/* Logo Section */}
          <Link to="/home" className="flex items-center cursor-pointer">
            <img
              src={Logo}
              alt="MailMkt"
              className="h-10 w-auto sm:h-12 lg:h-14 object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className="flex space-x-4 lg:space-x-6">
              {navItems.map((item) => (
                <div key={item.name} className="relative">
                  {item.subItems ? (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleDropdown(item.name)}
                        className="text-gray-600 hover:text-gray-900 transition-colors duration-200 text-sm font-medium flex items-center cursor-pointer"
                      >
                        {item.icon}
                        {item.name}
                        <ChevronDown
                          className={`ml-1 w-4 h-4 transition-transform duration-200 ${
                            activeDropdown === item.name ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {activeDropdown === item.name && (
                        <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 py-2">
                          {item.subItems.map((sub) => (
                            <Link
                              key={sub.name}
                              to={sub.path}
                              className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-amber-100 hover:text-gray-900 cursor-pointer"
                              onClick={() => setActiveDropdown(null)}
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.path}
                      className="text-gray-600 hover:text-gray-900 transition-colors duration-200 text-sm font-medium flex items-center"
                    >
                      {item.icon}
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Logout (desktop) */}
          <div className="hidden md:flex items-center">
            <button
              onClick={handleLogout}
              className="flex items-center cursor-pointer text-sm font-medium text-gray-600 hover:text-red-500 transition-colors duration-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="text-gray-600 hover:text-gray-900"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
          <div className="md:hidden bg-white border-t border-slate-100 py-2 px-4">
            {navItems.map((item) => (
              <div key={item.name}>
                {item.subItems ? (
                  <>
                    <div
                      className="flex items-center text-sm text-gray-600 py-2 cursor-pointer"
                      onClick={() =>
                        toggleDropdown(
                          activeDropdown === item.name ? null : item.name
                        )
                      }
                    >
                      {item.icon}
                      {item.name}
                      <ChevronDown
                        className={`ml-1 w-4 h-4 transition-transform duration-200 ${
                          activeDropdown === item.name ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                    {activeDropdown === item.name && (
                      <div className="ml-4 mt-2 space-y-2">
                        {item.subItems.map((sub) => (
                          <Link
                            key={sub.name}
                            to={sub.path}
                            className="block text-sm text-gray-600 hover:text-gray-900"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                )}
              </div>
            ))}

            {/* Logout (mobile) */}
            <button
              onClick={() => {
                setIsMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center w-full text-sm text-gray-600 hover:text-red-500 py-2"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
