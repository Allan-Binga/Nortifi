import Sidebar from "../components/Sidebar";
import Label from "../components/Label";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { backend } from "../server";
import { useEffect, useState } from "react";
import { Loader2, Mail } from "lucide-react";

function EmailStatus() {
    const { status } = useParams();
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEmails = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${backend}/emails/all-campaigns/${status}`, {
                    withCredentials: true,
                });
                setEmails(res.data);
            } catch (error) {
                console.error("Error fetching emails:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEmails();
    }, [status]);

    return (
        <div className="flex h-screen bg-blue-50">
            {/* Sidebar */}
            <Sidebar />

            <div className="flex-1 flex flex-col">
                <Label />

                <div className="flex-1 overflow-y-auto p-6 transition-all duration-300 mt-20">

                    {/* Emails Table */}
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="bg-white rounded-md border border-blue-200">
                            <div className="bg-blue-100 px-6 py-3 rounded-t-md">
                                <h2 className="text-lg font-bold text-[#061338]">
                                    {status.charAt(0).toUpperCase() + status.slice(1)} Emails (
                                    {emails.length})
                                </h2>
                            </div>

                            <div className="p-4">
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-teal-600 mr-2" />
                                        <p className="text-slate-500 text-sm">Loading emails...</p>
                                    </div>
                                ) : emails.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-slate-600 text-sm mb-2">
                                            No {status} emails found.
                                        </p>
                                        <p className="text-slate-500 text-xs mb-4">
                                            Try creating a new campaign.
                                        </p>

                                        <button
                                            onClick={() => navigate("/new-email")}
                                            className="px-5 py-2 rounded-md bg-[#061338] text-white text-sm font-medium cursor-pointer hover:bg-[#0a1f57] transition"
                                        >
                                            + Create New Campaign
                                        </button>
                                    </div>

                                ) : (
                                    <div className="max-h-[500px] overflow-y-auto">
                                        <table className="w-full text-sm text-slate-700 min-w-[500px]">
                                            <thead>
                                                <tr className="bg-slate-50 sticky top-0">
                                                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Label</th>
                                                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Subject</th>
                                                    <th className="px-3 py-2 text-left font-semibold text-slate-700">From</th>
                                                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
                                                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Created</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {emails.map((email) => (
                                                    <tr
                                                        key={email.campaign_id}
                                                        onClick={() =>
                                                            navigate(`/emails/campaign/${email.campaign_id}`)
                                                        }
                                                        className="border-t border-slate-200 hover:bg-slate-50 transition duration-150 cursor-pointer"
                                                    >
                                                        <td className="px-3 py-2">{email.label}</td>
                                                        <td className="px-3 py-2">{email.subject}</td>
                                                        <td className="px-3 py-2">
                                                            <a
                                                                href={`mailto:${email.from_email}`}
                                                                className="text-teal-600 hover:text-teal-800 hover:underline"
                                                                onClick={(e) => e.stopPropagation()} // prevent row click
                                                            >
                                                                {email.from_email}
                                                            </a>
                                                        </td>
                                                        <td className="px-3 py-2 capitalize">{email.status}</td>
                                                        <td className="px-3 py-2">
                                                            {new Date(email.created_at).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default EmailStatus;
