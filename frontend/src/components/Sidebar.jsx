import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import {
    Mail,
    CalendarClock,
    TableOfContents,
    LogOut,
    Mails,
    Users,
    Server,
    Home,
    Eye,
    Plus,
    Send,
    PencilLine,
    Loader2,
    Import,
} from "lucide-react";
import axios from "axios";
import { useFetchSMTPs } from "../utils/smtp";
import { notify } from "../utils/toast";
import ImportContactsModal from "./ImportContacts";
import RegisterSMTPModal from "./RegisterSMTPModal";
import CreateContactModal from "./CreateContact";
import { useWebsite } from "../context/WebsiteContext";

function Sidebar({ isOpen, toggleSidebar }) {
    const { activeWebsite } = useWebsite()
    const { fetchSMTPs } = useFetchSMTPs()
    const [smtps, setSmtps] = useState([]);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [activeSubDropdown, setActiveSubDropdown] = useState(null);
    const [isSMTPModalOpen, setIsSMTPModalOpen] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const location = useLocation();
    const mainTimeoutRef = useRef(null);
    const subTimeoutRef = useRef(null);
    const { logoutUser } = useAuth()

    const navItems = [
        { name: "Home", path: "/home", icon: <Home className="w-6 h-6" /> },
        { name: "Compose", path: "/new-email", icon: <Mail className="w-6 h-6" /> },
        {
            name: "Emails",
            icon: <Mails className="w-6 h-6" />,
            subItems: [
                { name: "All Emails", path: "/emails/all", icon: <TableOfContents className="w-6 h-6" /> },
                { name: "Sent", path: "/emails/sent", icon: <Send className="w-6 h-6" /> },
                { name: "Scheduled", path: "/emails/scheduled", icon: <CalendarClock className="w-6 h-6" /> },
                { name: "Drafts", path: "/emails/drafts", icon: <PencilLine className="w-6 h-6" /> },
            ],
        },
        { name: "Contacts", icon: <Users className="w-6 h-6" />, subItems: [] },
        {
            name: "Servers",
            icon: <Server className="w-6 h-6" />,
            subItems: [{ name: "New Server", icon: <Server className="w-6 h-6" /> }],
        },
    ];

    const isActive = (item) => {
        if (item.subItems && item.subItems.length > 0) {
            return item.subItems.some((sub) => location.pathname === sub.path);
        }
        return location.pathname === item.path;
    };

    //Fetch SMTP
    useEffect(() => {
        if (!activeWebsite) return;
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
    }, [activeWebsite]);

    //Logout
    const handleLogout = () => {
        logoutUser()
    }

    // Hover handlers
    const handleMainEnter = (name) => {
        if (mainTimeoutRef.current) clearTimeout(mainTimeoutRef.current);
        if (subTimeoutRef.current) clearTimeout(subTimeoutRef.current);
        setActiveDropdown(name);
    };

    const handleMainLeave = () => {
        mainTimeoutRef.current = setTimeout(() => {
            if (!activeSubDropdown) setActiveDropdown(null);
        }, 200);
    };

    // Contact modals
    const handleNewContactClick = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setIsContactModalOpen(true);
        }, 120);
    };

    const handleImportContactsClick = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setIsImportModalOpen(true);
        }, 120);
    };

    const handleContactModalClose = () => setIsContactModalOpen(false);
    const handleImportModalClose = () => setIsImportModalOpen(false);

    // SMTP modal
    const handleNewServerClick = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setIsSMTPModalOpen(true);
        }, 120);
    };

    const handleSMTPModalSuccess = async () => {
        setIsSMTPModalOpen(false);
        try {
            const servers = await fetchSMTPs();
            setSmtps(servers);
        } catch (err) {
            notify.error("Failed to refresh SMTP servers.");
        }
    };

    return (
        <>
            {isLoading && (
                <div className="fixed inset-0 flex items-center justify-center z-[10000] bg-gray-100 bg-opacity-30 backdrop-blur-sm">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                </div>
            )}

            <RegisterSMTPModal
                isOpen={isSMTPModalOpen}
                onClose={() => setIsSMTPModalOpen(false)}
                onSuccess={handleSMTPModalSuccess}
            />
            <CreateContactModal isOpen={isContactModalOpen} onClose={handleContactModalClose} />
            <ImportContactsModal isOpen={isImportModalOpen} onClose={handleImportModalClose} />

            <aside
                className={`bg-[#061338] h-screen flex flex-col sticky top-0 shadow-lg z-50 transition-all duration-300 ${isOpen ? "w-64" : "w-16"
                    } md:w-16 overflow-x-hidden md:overflow-visible`}
            >
                <div className="h-20 flex items-center justify-center border-b border-slate-700">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xl">N</span>
                    </div>
                </div>

                <nav className="flex-1 flex flex-col py-4 relative mt-6">
                    {navItems.map((item) => {
                        const active = isActive(item);

                        if (item.name === "Contacts") {
                            return (
                                <div
                                    key={item.name}
                                    className="relative group"
                                    onMouseEnter={() => handleMainEnter("Contacts")}
                                    onMouseLeave={handleMainLeave}
                                >
                                    <div
                                        className={`flex flex-col items-center justify-center py-4 px-2 text-slate-400 cursor-pointer group transition-all duration-200 ${active ? "text-white bg-slate-700" : "hover:text-white hover:bg-slate-700"
                                            }`}
                                    >
                                        <div className="mb-1 group-hover:scale-110 transition-transform duration-200">{item.icon}</div>
                                        <span className="text-xs text-center leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            {item.name}
                                        </span>
                                    </div>

                                    {activeDropdown === "Contacts" && (
                                        <div
                                            className={`bg-[#061338] text-white rounded-xl shadow-xl flex flex-col w-52 py-2 z-[9999] md:absolute md:left-full md:top-0 md:ml-2 ${isOpen ? "absolute left-0 top-14 w-full ml-0 rounded-t-none" : "hidden md:block"
                                                } transition-opacity duration-200 ease-in-out`}
                                            onMouseEnter={() => {
                                                if (mainTimeoutRef.current) clearTimeout(mainTimeoutRef.current);
                                            }}
                                            onMouseLeave={handleMainLeave}
                                        >
                                            <button
                                                onClick={() => {
                                                    handleNewContactClick();
                                                    setActiveDropdown(null);
                                                }}
                                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-500/80 rounded transition text-left w-full"
                                            >
                                                <Plus className="w-6 h-6" />
                                                New Contact
                                            </button>
                                            <Link
                                                to="/contacts"
                                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-500/80 rounded transition text-left w-full"
                                                onClick={() => {
                                                    setActiveDropdown(null);
                                                    if (isOpen) toggleSidebar();
                                                }}
                                            >
                                                <Users className="w-6 h-6" />
                                                All Contacts
                                            </Link>

                                            <Link
                                                to="/import-contacts"
                                                onClick={() => {
                                                    setActiveDropdown(null);
                                                    if (isOpen) toggleSidebar();
                                                }}
                                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-500/80 rounded transition text-left w-full"
                                            >
                                                <Import className="w-6 h-6" />
                                                Import Contacts
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        if (item.subItems && item.subItems.length > 0) {
                            return (
                                <div
                                    key={item.name}
                                    className="relative group"
                                    onMouseEnter={() => handleMainEnter(item.name)}
                                    onMouseLeave={handleMainLeave}
                                >
                                    <div
                                        className={`flex flex-col items-center justify-center py-4 px-2 text-slate-400 cursor-pointer group transition-all duration-200 ${active ? "text-white bg-slate-700" : "hover:text-white hover:bg-slate-700"
                                            }`}
                                    >
                                        <div className="mb-1 group-hover:scale-110 transition-transform duration-200">{item.icon}</div>
                                        <span className="text-xs text-center leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            {item.name}
                                        </span>
                                    </div>

                                    {activeDropdown === item.name && (
                                        <div
                                            className={`bg-[#061338] text-white rounded-xl shadow-xl flex flex-col w-52 py-2 z-[9999] md:absolute md:left-full md:top-0 md:ml-2 ${isOpen ? "absolute left-0 top-14 w-full ml-0 rounded-t-none" : "hidden md:block"
                                                } transition-opacity duration-200 ease-in-out`}
                                            onMouseEnter={() => mainTimeoutRef.current && clearTimeout(mainTimeoutRef.current)}
                                            onMouseLeave={handleMainLeave}
                                        >
                                            {item.name === "Servers" ? (
                                                <>
                                                    <button
                                                        onClick={handleNewServerClick}
                                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-500/80 rounded transition text-left w-full"
                                                    >
                                                        <Server className="w-6 h-6" />
                                                        New Server
                                                    </button>
                                                    {smtps.length > 0 && <div className="border-t border-slate-600 my-1" />}
                                                    {smtps.map((smtp, index) => (
                                                        <Link
                                                            key={smtp.config_id}
                                                            to={`/smtp/servers/${smtp.config_id}`}
                                                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-amber-500/80 rounded transition"
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
                                                        onClick={() => {
                                                            setActiveDropdown(null);
                                                            if (isOpen) toggleSidebar();
                                                        }}
                                                    >
                                                        {sub.icon}
                                                        {sub.name}
                                                    </Link>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex flex-col items-center justify-center py-4 px-2 text-slate-400 cursor-pointer group transition-all duration-200 ${isActive(item) ? "text-white bg-slate-700" : "hover:text-white hover:bg-slate-700"
                                    }`}
                                onClick={() => isOpen && toggleSidebar()}
                            >
                                <div className="mb-1 group-hover:scale-110 transition-transform duration-200">{item.icon}</div>
                                <span className="text-xs text-center leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    {item.name}
                                </span>
                            </Link>
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
                    <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Logout
                    </span>
                </button>
            </aside>
        </>
    );
}

export default Sidebar;