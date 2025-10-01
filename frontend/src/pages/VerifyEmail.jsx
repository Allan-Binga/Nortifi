import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { backend } from "../server"
import axios from "axios"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

function VerifyEmail() {
    const [message, setMessage] = useState("Verifying your account...");
    const [status, setStatus] = useState("loading");
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    useEffect(() => {
        if (!token) {
            setMessage("Invalid or missing verification token.");
            setStatus("error");
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await axios.get(`${backend}/verification/verify/email?token=${token}`);
                setMessage(res.data.message || "Your account has been verified!");
                setStatus("success");
            } catch (err) {
                const msg =
                    err.response?.data?.message || "Verification failed. Please try again.";
                setMessage(msg);
                setStatus("error");
            }
        };

        verifyToken();


    }, [token]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
            {status === "loading" && (
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
                    <p className="text-gray-600">{message}</p>
                </div>
            )}

            {status === "success" && (
                <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                    <p className="text-lg font-semibold">{message}</p>
                    <a
                        href="/sign-in"
                        className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                        Proceed to Sign-in
                    </a>
                </div>
            )}

            {status === "error" && (
                <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="h-10 w-10 text-red-500" />
                    <p className="text-lg font-semibold text-red-600">{message}</p>
                    <a
                        href="/resend-verification"
                        className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                        Resend Verification Email
                    </a>
                </div>
            )}
        </div>


    )
}

export default VerifyEmail