import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { backend } from "../server";
import Spinner from "./Spinner";

const ProtectedRoute = ({ children }) => {
    const [isValid, setIsValid] = useState(null);

    useEffect(() => {
        axios.get(`${backend}/auth/user/validate`, { withCredentials: true })
            .then(() => setIsValid(true))
            .catch(() => setIsValid(false));
    }, []);

    if (isValid === null)
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <Spinner size="medium" />
            </div>
        );

    if (isValid === false) return <Navigate to="/sign-in" replace />;

    return children;
};

export default ProtectedRoute;
