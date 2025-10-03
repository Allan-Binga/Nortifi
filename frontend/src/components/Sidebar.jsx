import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, LogOut, Mails, Users, Server, Home, Eye, Plus, Globe, Send, PencilLine } from "lucide-react";
import { fetchSMTPs } from "../utils/smtp";
import { backend } from "../server";
import axios from "axios";
import { notify } from "../utils/toast";

function Sidebar() {
    const [openSMTPConfiguration, setOpenSMTPConfiguration] = (false)
    const [smtps, setSmtps] = useState([]);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const navigate = useNavigate();
    const location = useLocation(); 

    const navItems = [
        { name: "Home", path: "/home", icon: <Home className="w-5 h-5 mr-2" /> },
        { name: "New Email", path: "/new-email", icon: <Mail className="w-5 h-5 mr-2" /> },
        {
            name: "Emails", icon: <Mails className="w-5 h-5 mr-2" />,
            subItems: [
                { name: "Sent", path: "/emails/sent", icon: <Send className="w-4 h-4" /> },
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
            subItems: [{ name: "New Server", path: "/register-smtp", icon: <Server className="w-4 h-4" /> }],
        },

    ];

    // Highlight logic
    const isActive = (item) => {
        if (item.subItems) {
            return item.subItems.some(sub => location.pathname === sub.path);
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
                setTimeout(() => navigate("/sign-in"), 1000);
            } else {
                notify.error("You are not logged in.");
            }
        } catch (error) {
            console.error(error);
            notify.error("Failed to log out.");
        }
    };

    return (
        <aside className="w-22 bg-[#061338] h-screen flex flex-col sticky top-0 shadow-lg relative z-50">
            {/* Logo/Brand Section */}
            <div className="h-20 flex items-center justify-center border-b border-slate-700">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">N</span>
                </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 flex flex-col py-4 relative mt-6">
                {navItems.map((item) => {
                    const active = isActive(item);
                    return (
                        <div
                            key={item.name}
                            className="relative"
                            onMouseEnter={() => item.subItems && setActiveDropdown(item.name)}
                            onMouseLeave={() => item.subItems && setActiveDropdown(null)}
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

                                    {/* Dropdown */}
                                    {activeDropdown === item.name && (
                                        <div className="absolute left-full top-0 ml-2 bg-[#061338] text-white rounded-xl shadow-xl flex flex-col w-52 py-2 z-[9999]">
                                            {/* Arrow */}
                                            <div className="absolute right-full top-8 mr-[-1px]">
                                                <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-[#061338]"></div>
                                            </div>

                                            {item.name === "SMTP Servers" ? (
                                                <>
                                                    <Link
                                                        to="/register-smtp"
                                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-500/80 rounded transition"
                                                    >
                                                        <Server className="w-4 h-4" />
                                                        New Server
                                                    </Link>

                                                    {smtps.length > 0 && <div className="border-t border-slate-600 my-1"></div>}

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

            {/* Logout */}
            <button
                onClick={handleLogout}
                className="flex flex-col items-center justify-center py-4 px-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-all duration-200 border-t border-slate-700 group"
            >
                <div className="mb-1 group-hover:scale-110 transition-transform duration-200">
                    <LogOut className="w-6 h-6" />
                </div>
                <span className="text-xs">Logout</span>
            </button>
        </aside>
    );
}

export default Sidebar;
