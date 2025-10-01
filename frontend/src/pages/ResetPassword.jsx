import { notify } from "../utils/toast";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { backend } from "../server";
import axios from "axios";
import { useEffect, useState } from "react";

function ResetPassword() {
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [email, setEmail] = useState("");
    const [showResend, setShowResend] = useState(false);

    // Token verification state
    const [status, setStatus] = useState("idle"); // idle | loading | success | error
    const [message, setMessage] = useState("");

    // Password reset submit state
    const [loading, setLoading] = useState(false);

    // Resend password email state
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState("");
    const [resendStatus, setResendStatus] = useState("idle"); // idle | loading | success | error

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    // Token verification
    useEffect(() => {
        if (!token) return;

        const verifyToken = async () => {
            setStatus("loading");
            try {
                const response = await axios.get(
                    `${backend}/password/verify/password-reset-token?token=${token}`
                );
                setMessage(response.data.message);
                setStatus("success");
            } catch (error) {
                setMessage(error.response?.data?.message || "Token verification failed.");
                setStatus("error");
                setShowResend(true);
            }
        };
        verifyToken();
    }, [token]);

    // Resend Password Reset Email
    const resendPasswordResetEmail = async () => {
        if (!email) {
            setResendMessage("Please enter your email.");
            setResendStatus("error");
            return;
        }

        setResendLoading(true);
        setResendStatus("loading");
        setResendMessage("");

        try {
            const response = await axios.post(
                `${backend}/password/resend/password-reset-email`,
                { email }
            );
            setResendMessage(response.data.message || "Password reset email sent.");
            setResendStatus("success");
            setTimeout(() => navigate("/sign-in"), 2000);
            notify.success(response.data.message || "Password reset email sent.");
        } catch (error) {
            setResendMessage(error.response?.data?.message || "Failed to resend email.");
            setResendStatus("error");
            notify.error(error.response?.data?.message || "Failed to resend email.");
        } finally {
            setResendLoading(false);
        }
    };

    // Password Reset Handler
    const resetPasswordHandler = async () => {
        setLoading(true);
        try {
            const response = await axios.put(`${backend}/password/user/reset`, {
                token,
                newPassword,
                confirmPassword,
            });
            notify.success(response.data.message);
            setTimeout(() => navigate("/sign-in"), 2000);
        } catch (error) {
            notify.error(error.response?.data?.message || "Failed to reset password.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            notify.error("Passwords do not match.");
            return;
        }

        resetPasswordHandler();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-100 transform transition-all duration-300 hover:shadow-xl">
                <h2 className="text-3xl font-semibold text-gray-900 mb-6 text-center tracking-tight">
                    Reset Your Password
                </h2>

                {status === "loading" && (
                    <div className="flex flex-col items-center gap-3 mb-6">
                        <Loader2 className="animate-spin text-indigo-600 h-10 w-10" />
                        <p className="text-gray-600 text-sm font-medium">{message || "Verifying token..."}</p>
                    </div>
                )}

                {(status === "error" || status === "success") && (
                    <div className="flex flex-col gap-6">
                        {status === "error" && message && (
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
                                <AlertCircle className="h-5 w-5" />
                                <span className="text-sm font-medium">{message}</span>
                            </div>
                        )}

                        {status === "error" && showResend && (
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-3">
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-700 placeholder-gray-400 transition-all duration-200"
                                    />
                                    <button
                                        onClick={resendPasswordResetEmail}
                                        disabled={resendLoading}
                                        className="px-5 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center"
                                    >
                                        {resendLoading ? <Loader2 className="animate-spin h-5 w-5 text-white" /> : "Resend"}
                                    </button>
                                </div>

                                {resendMessage && (
                                    <div className={`flex items-center gap-2 p-3 rounded-lg ${resendStatus === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
                                        {resendStatus === "error" ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                                        <span className="text-sm">{resendMessage}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {status === "success" && !showResend && (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                <div className="relative">
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">New Password</label>
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-700 placeholder-gray-400 transition-all duration-200"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-10 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                                        onClick={() => setShowNewPassword((prev) => !prev)}
                                    >
                                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>

                                <div className="relative">
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Confirm Password</label>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-700 placeholder-gray-400 transition-all duration-200"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-10 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    {loading ? <Loader2 className="animate-spin h-5 w-5 mx-auto text-white" /> : "Change Password"}
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ResetPassword;
