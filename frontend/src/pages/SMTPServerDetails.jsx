import { Mail, Server, User, Key, Shield, Calendar, Star, SquarePen } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Label from "../components/Label";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { backend } from "../server";
import Spinner from "../components/Spinner";

function SMTPDetails() {
    const { smtpId } = useParams();
    const navigate = useNavigate();

    const [server, setServer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await axios.get(`${backend}/smtp/all/servers/server/${smtpId}`, {
                    withCredentials: true,
                });
                setServer(res.data);
            } catch (err) {
                console.error("Failed to fetch SMTP details:", err);
                setError("Failed to fetch SMTP details.");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [smtpId]);

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-100">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <Spinner />
                </div>
            </div>
        );
    }

    if (error || !server) {
        return (
            <div className="flex min-h-screen bg-gray-100">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center bg-white p-8 rounded-2xl shadow-md">
                        <p className="text-red-600 font-semibold mb-4">{error || "Server not found."}</p>
                        <button
                            onClick={() => navigate("/sites")}
                            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-blue-50">
            {/* Sidebar */}
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Label />
                <div className="flex-1 overflow-y-auto">
                    {/* Card */}
                    <div className="max-w-3xl mx-auto px-6 mt-20">
                        <div className="bg-white rounded-md border border-blue-200 overflow-hidden">

                            {/* Header */}
                            <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    {server.name}
                                    {server.is_default && (
                                        <Star className="w-5 h-5 text-yellow-500" />
                                    )}
                                </h2>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-6 space-y-6 text-gray-700">
                                <div className="flex items-start gap-3">
                                    <Server className="w-5 h-5 text-[#061338] mt-1" />
                                    <div>
                                        <span className="font-bold">Host:</span> {" "}{server.smtp_host}
                                        <p className="text-sm text-gray-500 mt-1">
                                            The address of the server used.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Key className="w-5 h-5 text-[#061338] mt-1" />
                                    <div>
                                        <span className="font-bold">Port:</span> {server.smtp_port}
                                        <p className="text-sm text-gray-500 mt-1">
                                            The port number used to connect to the SMTP server (commonly
                                            587 for TLS or 465 for SSL).
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <User className="w-5 h-5 text-[#061338] mt-1" />
                                    <div>
                                        <span className="font-bold">User:</span> {server.smtp_user}
                                        <p className="text-sm text-gray-500 mt-1">
                                            The username or email address used to authenticate with the
                                            SMTP server.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-[#061338] mt-1" />
                                    <div>
                                        <span className="font-bold">TLS:</span>{" "}
                                        {server.use_tls ? "Enabled" : "Disabled"}
                                        <p className="text-sm text-gray-500 mt-1">
                                            Indicates if Transport Layer Security is used to encrypt the
                                            connection for secure email sending.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-[#061338] mt-1" />
                                    <div>
                                        <span className="font-bold">Created At:</span>{" "}
                                        {new Date(server.created_at).toLocaleString()}
                                        <p className="text-sm text-gray-500 mt-1">
                                            The date and time when this server configuration was created.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <SquarePen className="w-5 h-5 text-[#061338] mt-1" />
                                    <div>
                                        <span className="font-bold">Updated At:</span>{" "}
                                        {new Date(server.updated_at).toLocaleString()}
                                        <p className="text-sm text-gray-500 mt-1">
                                            The date and time when this server configuration was last updated.
                                        </p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

}

export default SMTPDetails;