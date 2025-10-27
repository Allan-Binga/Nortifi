import { createContext, useContext, useEffect, useState, useRef } from "react";
import axios from "axios"
import { backend } from "../server"
import { notify } from "../utils/toast"
import { useNavigate } from "react-router-dom"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null)
    const navigate = useNavigate()
    const manualLogout = useRef(false)

    //Validate Session
    const validateSession = async () => {
        try {
            const response = await axios.get(`${backend}/auth/user/validate`, {
                withCredentials: true
            })
            if (response.data.valid) {
                setIsAuthenticated(true);
            } else {
                throw new Error();
            }
        } catch {
            if (!manualLogout.current) {
                setIsAuthenticated(false);
                // navigate("/sign-in", { replace: false });
            } else {
                // Reset flag after logout
                manualLogout.current = false;
            }
        }
    }

    const markLoggedIn = () => setIsAuthenticated(true);

    const logoutUser = async () => {
        try {
            manualLogout.current = true;
            const response = await axios.post(`${backend}/auth/user/sign-out`, {}, { withCredentials: true });
            if (response.status === 200) {
                document.cookie = "userMailMktSession=; Max-Age=0; path=/;";
                localStorage.clear();
                notify.success("Successfully logged out.");
                setTimeout(() => (window.location.href = "/sign-in"), 800);
            } else {
                notify.error("You are not logged in.");
            }
        } catch (error) {
            console.error(error);
            notify.error("Failed to log out.");
        }
    };

    useEffect(() => {
        validateSession();
        // Revalidate session every 5 mins
        const interval = setInterval(validateSession, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, validateSession, markLoggedIn, logoutUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)