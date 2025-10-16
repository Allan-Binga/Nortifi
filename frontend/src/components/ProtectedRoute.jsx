import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import Spinner from "./Spinner";

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated === null) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <Spinner size="medium" />
            </div>
        );
    }

    if (isAuthenticated === false) {
        return <Navigate to="/sign-in" replace />;
    }

    return children;
};

export default ProtectedRoute;
