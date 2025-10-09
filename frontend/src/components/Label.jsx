import { useLocation } from "react-router-dom";
import { useWebsite } from "../context/WebsiteContext";
import { useState } from "react";
import UserImage from "../assets/user.png";
import { ChevronDown, Globe } from "lucide-react";
import AddWebsiteModal from "./AddWebsite";

function Label() {
    const location = useLocation();
    const { websites, activeWebsite, setActiveWebsite } = useWebsite();
    const [openUserDropdown, setOpenUserDropdown] = useState(false);
    const [isWebsiteModalOpen, setIsWebsiteModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);

    const routeNames = {
        "/home": "Home",
        "/new-email": "New Email",
        "/add-contact": "Create Contact",
        "/contacts": "All Contacts",
        "/sites": "Manage Websites",
        "/register-smtp": "Register SMTP Server",
        "/emails": "All Emails",
        "/emails/sent": "Sent Emails",
    };

    const getPageName = () => {
        const path = location.pathname;
        return (
            routeNames[path] ||
            path
                .split("/")
                .filter(Boolean)
                .pop()
                ?.replace("-", " ")
                .toUpperCase() || "Dashboard"
        );
    };

    const pageName = getPageName();

    const userMenuItems = [
        { name: "Profile", path: "/profile" },
        { name: "Settings", path: "/settings" },
        { name: "Logout", path: "/logout" },
    ];

    const handleDropdownLeave = () => {
        setOpenUserDropdown(false);
    };

    const handleNewWebsiteClick = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setIsWebsiteModalOpen(true);
        }, 120);
    };

    const handleWebsiteModalClose = () => setIsWebsiteModalOpen(false);

    return (
        <>
            <AddWebsiteModal
                isOpen={isWebsiteModalOpen}
                onClose={handleWebsiteModalClose}
            />
            <div className="h-20 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-10">
                {/* Left Section */}
                <div className="flex items-center space-x-2">
                    <span className="font-bold bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent text-xl">
                        Nortifi
                    </span>
                    <h1 className="text-lg font-semibold text-gray-700">{pageName}</h1>
                </div>

                {/* Right Section */}
                <div className="relative flex items-center space-x-4 min-w-[280px] justify-end mr-2">
                    <h1 className="text-lg font-semibold text-gray-700 truncate flex-shrink-0 max-w-[200px]">
                        {activeWebsite ? activeWebsite.company_name : "No Website Selected"}
                    </h1>
                    <button
                        onClick={() => setOpenUserDropdown(!openUserDropdown)}
                        className="flex items-center gap-1.5 flex-shrink-0"
                    >
                        <img
                            src={UserImage}
                            alt="User"
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 cursor-pointer"
                        />
                        <ChevronDown
                            size={16}
                            className={`text-gray-500 transition-transform duration-300 ease-out flex-shrink-0 ${openUserDropdown ? "rotate-180" : "rotate-0"
                                }`}
                        />
                    </button>

                    {openUserDropdown && (
                        <div
                            className="absolute right-0 top-14 bg-[#061338] text-white rounded-xl shadow-xl w-56 py-2 z-[9999] transition-all duration-200 ease-out origin-top-right animate-in fade-in slide-in-from-top-2"
                            onMouseEnter={() => setOpenUserDropdown(true)}
                            onMouseLeave={handleDropdownLeave}
                        >
                            {/* New Website Button */}
                            <button
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-indigo-500/80 rounded transition-colors duration-150 text-left"
                                onClick={() => {
                                    handleNewWebsiteClick()
                                    setActiveDropdown(null);
                                }}
                            >
                                <span className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                                    <Globe />
                                </span>
                                <span>New Website</span>
                            </button>

                            {/* Website List */}
                            {websites.length > 0 && (
                                <div className="border-t border-slate-600 my-1" />
                            )}
                            {websites.map((site, index) => (
                                <button
                                    key={site.website_id}
                                    onClick={() => {
                                        setActiveWebsite(site);
                                        setOpenUserDropdown(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded transition-colors duration-150 text-left ${activeWebsite?.website_id === site.website_id
                                        ? "bg-amber-500/80 font-medium"
                                        : "hover:bg-amber-500/80"
                                        }`}
                                >
                                    <div className="w-6 h-6 flex items-center justify-center bg-amber-100 text-amber-800 rounded-full text-xs font-semibold flex-shrink-0">
                                        {index + 1}
                                    </div>
                                    <span className="truncate">{site.company_name}</span>
                                </button>
                            ))}

                            {/* Separator */}
                            {websites.length > 0 && (
                                <div className="border-t border-slate-600 my-1" />
                            )}

                            {/* User Menu Items */}
                            {userMenuItems.map((item) => (
                                <a
                                    key={item.name}
                                    href={item.path}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-indigo-500/80 rounded transition-colors duration-150 w-full text-left"
                                    onClick={() => setOpenUserDropdown(false)}
                                >
                                    <span className="w-6 h-6 flex-shrink-0"></span>
                                    {item.name}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>

    );
}

export default Label;
