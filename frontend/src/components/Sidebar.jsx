import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, LogOut, Mails, Users, Server, Home, Globe } from "lucide-react";
import { fetchSMTPs } from "../utils/smtp";
import { backend } from "../server";
import axios from "axios";
import { notify } from "../utils/toast";

function Sidebar() {
    const [smtps, setSmtps] = useState([]);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const navigate = useNavigate();

    const navItems = [
        { name: "Home", path: "/home", icon: <Home className="w-5 h-5 mr-2" /> },
        { name: "New Email", path: "/new-email", icon: <Mail className="w-5 h-5 mr-2" /> },
        {
            name: "Contacts",
            icon: <Users className="w-5 h-5 mr-2" />,
            subItems: [
                { name: "Create contact", path: "/add-contact" },
                { name: "View Contacts", path: "/contacts" },
            ],
        },
        { name: "Manage Websites", path: "/sites", icon: <Globe className="w-5 h-5 mr-2" /> },
        {
            name: "SMTP Servers",
            icon: <Server className="w-5 h-5 mr-2" />,
            subItems: [{ name: "New Server", path: "/register-smtp" }],
        },
        { name: "All Emails", path: "/emails", icon: <Mails className="w-5 h-5 mr-2" /> },
    ];

    useEffect(() => {
        const getSMTPs = async () => {
            try {
                const servers = await fetchSMTPs();
                setSmtps(servers); // Save fetched SMTP servers
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
        <aside className="w-34 bg-slate-700 border-r border-white h-screen p-0 flex flex-col sticky top-0">
            <h2 className="font-bold text-2xl bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent mb-8 mt-20 text-center">
                Nortifi
            </h2>

            <nav className="flex-1 flex flex-col justify-start mt-10">
                {navItems.map((item) => (
                    <div
                        key={item.name}
                        className="relative"
                        onMouseEnter={() => item.subItems && setActiveDropdown(item.name)}
                        onMouseLeave={() => item.subItems && setActiveDropdown(null)}
                    >
                        {item.subItems ? (
                            <>
                                <div className="flex flex-col items-center justify-center w-full h-20 text-white hover:bg-white hover:text-gray-900 border-b border-white transition-colors duration-200 cursor-pointer relative">
                                    <span className="mb-1">{item.icon}</span>
                                    <span className="text-base text-center">{item.name}</span>
                                </div>

                                {activeDropdown === item.name && (
                                    <div className="absolute left-full top-0 ml-2 bg-white border border-slate-200 rounded shadow-lg flex flex-col space-y-2 w-48 z-50 py-2">
                                        {/* Arrow */}
                                        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-[-1px]">
                                            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[8px] border-r-slate-200"></div>
                                            <div className="absolute top-0 left-[1px] w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[8px] border-r-white"></div>
                                        </div>

                                        {item.name === "SMTP Servers" ? (
                                            <>
                                                <Link
                                                    to="/register-smtp"
                                                    className="text-gray-600 text-sm hover:text-gray-900 hover:bg-gray-100 px-4 py-3 rounded transition-colors duration-200 text-left"
                                                >
                                                    New Server
                                                </Link>

                                                {smtps.map((smtp, index) => (
                                                    <Link
                                                        key={smtp.config_id}
                                                        to={`/smtp/servers/${smtp.config_id}`}
                                                        className="flex items-center text-gray-600 text-sm hover:text-white hover:bg-green-400 px-4 py-3 rounded transition-colors duration-200"
                                                    >
                                                        <div className="w-6 h-6 flex items-center justify-center bg-green-100 text-green-800 rounded-full mr-3 flex-shrink-0">
                                                            {index + 1}
                                                        </div>
                                                        {smtp.name}
                                                    </Link>
                                                ))}
                                            </>
                                        ) : (
                                            item.subItems.map((sub) => (
                                                <Link
                                                    key={sub.name}
                                                    to={sub.path}
                                                    className="text-gray-600 text-sm hover:text-gray-900 hover:bg-gray-100 px-4 py-3 rounded transition-colors duration-200 text-left"
                                                >
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
                                className="flex flex-col items-center justify-center w-full h-20 text-white hover:bg-white hover:text-gray-900 border-b border-white transition-colors duration-200"
                            >
                                {item.icon}
                                {item.name}
                            </Link>
                        )}
                    </div>
                ))}
            </nav>

            <button
                onClick={handleLogout}
                className="mt-auto flex items-center px-3 py-2 text-white hover:text-red-500 hover:bg-gray-100 rounded transition-colors duration-200 cursor-pointer"
            >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
            </button>
        </aside>
    );
}

export default Sidebar;
