import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Mail, CalendarClock, TableOfContents, LogOut, Mails, Users, Server, Home, Eye, Plus, Globe, Send, PencilLine, Loader2 } from "lucide-react";
import { fetchSMTPs } from "../utils/smtp";
import { backend } from "../server";
import axios from "axios";
import { notify } from "../utils/toast";
import RegisterSMTPModal from "./RegisterSMTPModal";

function Sidebar({ isOpen, toggleSidebar }) {
    const [smtps, setSmtps] = useState([]);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const location = useLocation();
    const timeoutRef = useRef(null);

    const navItems = [
        { name: "Home", path: "/home", icon: <Home className="w-5 h-5 mr-2" /> },
        { name: "New Email", path: "/new-email", icon: <Mail className="w-5 h-5 mr-2" /> },
        {
            name: "Emails",
            icon: <Mails className="w-5 h-5 mr-2" />,
            subItems: [
                { name: "All Emails", path: "/emails/all", icon: <TableOfContents className="w-4 h-4" /> },
                { name: "Sent", path: "/emails/sent", icon: <Send className="w-4 h-4" /> },
                { name: "Scheduled", path: "/emails/scheduled", icon: <CalendarClock className="w-4 h-4" /> },
                { name: "Drafts", path: "/emails/drafts", icon: <PencilLine className="w-4 h-4" /> },
            ],
        },
        {
            name: "Contacts",
            icon: <Users className="w-5 h-5 mr-2" />,
            subItems: [
                { name: "Create Contact", path: "/add-contact", icon: <Plus className="w-4 h-4" /> },
                { name: "View Contacts", path: "/contacts", icon: <Eye className="w-4 h-4" /> },
            ],
        },
        { name: "Manage Websites", path: "/sites", icon: <Globe className="w-5 h-5 mr-2" /> },
        {
            name: "SMTP Servers",
            icon: <Server className="w-5 h-5 mr-2" />,
            subItems: [{ name: "New Server", icon: <Server className="w-4 h-4" /> }],
        },
    ];

    const isActive = (item) => {
        if (item.subItems) {
            return item.subItems.some((sub) => location.pathname === sub.path);
        }
        return location.pathname === item.path;
    };

    useEffect(() => {
        const getSMTPs = async () => {
            try {
                const servers = await fetchSMTPs();
                setSmtps(servers);
            } catch (err) {
                console.error("Failed to fetch SMTP servers:", err);
                notify.error("Failed to load SMTP servers.");
            }
        };

        getSMTPs();
    }, []);

    const handleLogout = async () => {
        try {
            const response = await axios.post(`${backend}/auth/user/sign-out`, {}, { withCredentials: true });
            if (response.status === 200) {
                document.cookie = "userMailMktSession=; Max-Age=0; path=/;";
                localStorage.clear();
                notify.success("Successfully logged out.");
                setTimeout(() => window.location.href = "/sign-in", 1000);
            } else {
                notify.error("You are not logged in.");
            }
        } catch (error) {
            console.error(error);
            notify.error("Failed to log out.");
        }
    };

    const handleMouseEnter = (itemName) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setActiveDropdown(itemName);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setActiveDropdown(null);
        }, 300);
    };

    const handleDropdownEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };

    const handleDropdownLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setActiveDropdown(null);
        }, 300);
    };

    const handleSubItemClick = () => {
        setActiveDropdown(null);
        if (isOpen) toggleSidebar();
    };

    const handleNewServerClick = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setIsModalOpen(true);
        }, 100);
    };

    const handleModalSuccess = async () => {
        setIsModalOpen(false);
        try {
            const servers = await fetchSMTPs();
            setSmtps(servers);
        } catch (err) {
            console.error("Failed to refresh SMTP servers:", err);
            notify.error("Failed to refresh SMTP servers.");
        }
    };

    return (
        <>
            {/* Spinner */}
            {isLoading && (
                <div className="fixed inset-0 flex items-center justify-center z-[10000] bg-gray-100 bg-opacity-30 backdrop-blur-sm">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                </div>
            )}

            {/* Modal */}
            <RegisterSMTPModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleModalSuccess}
            />

            <aside
                className={`bg-[#061338] h-screen flex flex-col sticky top-0 shadow-lg z-50 transition-all duration-300 
          ${isOpen ? "w-64" : "w-0"} md:w-22 overflow-x-hidden md:overflow-visible`}
            >
                <div className="h-20 flex items-center justify-center border-b border-slate-700">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xl">N</span>
                    </div>
                </div>

                <nav className="flex-1 flex flex-col py-4 relative mt-6">
                    {navItems.map((item) => {
                        const active = isActive(item);
                        return (
                            <div
                                key={item.name}
                                className="relative group"
                                onMouseEnter={() => item.subItems && handleMouseEnter(item.name)}
                                onMouseLeave={() => item.subItems && handleMouseLeave()}
                            >
                                {item.subItems ? (
                                    <>
                                        <div
                                            className={`flex flex-col items-center justify-center py-4 px-2 text-slate-400 cursor-pointer group transition-all duration-200
                        ${active ? "text-white bg-slate-700" : "hover:text-white hover:bg-slate-700"}`}
                                        >
                                            <div className="mb-1 group-hover:scale-110 transition-transform duration-200">
                                                {item.icon}
                                            </div>
                                            <span className="text-xs text-center leading-tight">{item.name}</span>
                                        </div>

                                        {activeDropdown === item.name && (
                                            <div
                                                className={`bg-[#061338] text-white rounded-xl shadow-xl flex flex-col w-52 py-2 z-[9999]
                          md:absolute md:left-full md:top-0 md:ml-2
                          ${isOpen ? "absolute left-0 top-14 w-full ml-0 rounded-t-none" : "hidden md:block"}
                          transition-opacity duration-200 ease-in-out`}
                                                onMouseEnter={handleDropdownEnter}
                                                onMouseLeave={handleDropdownLeave}
                                            >
                                                <div className="absolute right-full top-8 mr-[-1px] hidden md:block">
                                                    <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-[#061338]"></div>
                                                </div>

                                                {item.name === "SMTP Servers" ? (
                                                    <>
                                                        <button
                                                            onClick={handleNewServerClick}
                                                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-500/80 rounded transition text-left w-full"
                                                        >
                                                            <Server className="w-4 h-4" />
                                                            New Server
                                                        </button>

                                                        {smtps.length > 0 && <div className="border-t border-slate-600 my-1"></div>}

                                                        {smtps.map((smtp, index) => (
                                                            <Link
                                                                key={smtp.config_id}
                                                                to={`/smtp/servers/${smtp.config_id}`}
                                                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-amber-500/80 rounded transition"
                                                                onClick={handleSubItemClick}
                                                            >
                                                                <div className="w-6 h-6 flex items-center justify-center bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                                                                    {index + 1}
                                                                </div>
                                                                <span className="truncate">{smtp.name}</span>
                                                            </Link>
                                                        ))}
                                                    </>
                                                ) : (
                                                    item.subItems.map((sub) => (
                                                        <Link
                                                            key={sub.name}
                                                            to={sub.path}
                                                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-500/80 rounded transition"
                                                            onClick={handleSubItemClick}
                                                        >
                                                            {sub.icon}
                                                            {sub.name}
                                                        </Link>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        to={item.path}
                                        className={`flex flex-col items-center justify-center py-4 px-2 text-slate-400 cursor-pointer group transition-all duration-200
                      ${active ? "text-white bg-slate-700" : "hover:text-white hover:bg-slate-700"}`}
                                        onClick={() => isOpen && toggleSidebar()}
                                    >
                                        <div className="mb-1 group-hover:scale-110 transition-transform duration-200">
                                            {item.icon}
                                        </div>
                                        <span className="text-xs text-center leading-tight">{item.name}</span>
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <button
                    onClick={() => {
                        handleLogout();
                        if (isOpen) toggleSidebar();
                    }}
                    className="flex flex-col items-center justify-center py-4 px-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-all duration-200 border-t border-slate-700 group"
                >
                    <div className="mb-1 group-hover:scale-110 transition-transform duration-200">
                        <LogOut className="w-6 h-6" />
                    </div>
                    <span className="text-xs">Logout</span>
                </button>
            </aside>
        </>
    );
}

export default Sidebar;