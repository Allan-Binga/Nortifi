import { useLocation } from "react-router-dom";
import UserImage from "../assets/user.png"

function Label() {
    const location = useLocation();

    // Map routes to display names
    const routeNames = {
        "/home": "Home",
        "/new-email": "New Email",
        "/add-contact": "Create Contact",
        "/contacts": "Contacts",
        "/sites": "Manage Websites",
        "/register-smtp": "Register SMTP Server",
        "/emails": "All Emails",
    };

    // Get the current page name, or extract from dynamic routes
    const getPageName = () => {
        const path = location.pathname;

        // Check for exact matches first
        if (routeNames[path]) {
            return routeNames[path];
        }

        // Handle dynamic routes like /smtp/servers/:id
        if (path.startsWith("/smtp/servers/")) {
            return "SMTP Server Details";
        }

        // Default fallback - capitalize the path
        const segments = path.split("/").filter(Boolean);
        if (segments.length > 0) {
            return segments[segments.length - 1]
                .split("-")
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
        }

        return "Dashboard";
    };

    const pageName = getPageName();

    return (
        <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
            <h1 className="text-xl font-semibold text-gray-800">
                {pageName}
            </h1>
            <img
                src={UserImage}
                alt="User"
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
            />
        </div>
    );
}

export default Label;