import Sidebar from "../components/Sidebar";
import Label from "../components/Label";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { backend } from "../server";
import { useEffect, useState } from "react";
import { Loader2, Eye, Pen } from "lucide-react";

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

    const formatDate = (isoString) => {
        if (!isoString) return "—";
        const date = new Date(isoString);
        const day = date.getDate();
        const month = date.toLocaleString("en-US", { month: "long" });
        const year = date.getFullYear();

        const getSuffix = (n) => {
            if (n > 3 && n < 21) return "th";
            switch (n % 10) {
                case 1:
                    return "st";
                case 2:
                    return "nd";
                case 3:
                    return "rd";
                default:
                    return "th";
            }
        };

        return `${day}${getSuffix(day)} ${month} ${year}`;
    };

    return (
        <div className="flex h-screen bg-blue-50">
            {/* Sidebar */}
            <Sidebar />

            <div className="flex-1 flex flex-col">
                <Label />

                <div className="flex-1 overflow-y-auto p-6 transition-all duration-300 mt-20">
                    {/* Emails Table */}
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="bg-white rounded-md border border-blue-200 shadow-sm">
                            {/* Header */}
                            <div className="bg-blue-100 px-6 py-3 rounded-t-md flex items-center justify-between">
                                <h2 className="text-lg font-bold text-[#061338]">
                                    {status.charAt(0).toUpperCase() + status.slice(1)} Emails ({emails.length})
                                </h2>
                                <button
                                    onClick={() => navigate("/new-email")}
                                    className="px-4 py-2 rounded-xs bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                                >
                                    + New Campaign
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-4">
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                                        <p className="text-slate-500 text-sm">Loading emails...</p>
                                    </div>
                                ) : emails.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-slate-600 text-sm mb-2">
                                            No {status} emails found.
                                        </p>
                                        <p className="text-slate-500 text-xs mb-4">
                                            Try creating a new campaign to get started.
                                        </p>
                                        <button
                                            onClick={() => navigate("/new-email")}
                                            className="px-4 py-3 rounded-sm bg-blue-600 font-bold text-white cursor-pointer hover:bg-blue-700"
                                        >
                                            + Create New Campaign
                                        </button>
                                    </div>
                                ) : (
                                    <div className="max-h-[500px] overflow-y-auto">
                                        <table className="w-full text-sm text-slate-700 min-w-[700px]">
                                            <thead>
                                                <tr className="bg-slate-50 sticky top-0 border-b border-slate-200">
                                                    <th className="px-3 py-2 text-left font-semibold text-slate-700">
                                                        Label
                                                    </th>
                                                    <th className="px-3 py-2 text-left font-semibold text-slate-700">
                                                        Subject
                                                    </th>
                                                    <th className="px-3 py-2 text-left font-semibold text-slate-700">
                                                        From
                                                    </th>
                                                    <th className="px-3 py-2 text-left font-semibold text-slate-700">
                                                        Created
                                                    </th>
                                                    <th className="px-3 py-2 text-left font-semibold text-slate-700">
                                                        Status
                                                    </th>
                                                    <th className="px-3 py-2 text-right font-semibold text-slate-700">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {emails.map((email) => (
                                                    <tr
                                                        key={email.campaign_id}
                                                        className="border-t border-slate-200 hover:bg-slate-50 transition duration-150 cursor-pointer"
                                                        onClick={() =>
                                                            navigate(`/emails/campaign/${email.campaign_id}`)
                                                        }
                                                    >
                                                        <td className="px-3 py-2">{email.label || "—"}</td>
                                                        <td className="px-3 py-2 font-medium text-slate-800">
                                                            {email.subject}
                                                        </td>
                                                        <td className="px-3 py-2 text-sm text-slate-600">
                                                            {email.from_name} <br />
                                                            <span className="text-xs text-slate-500">
                                                                {email.from_email}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-sm text-gray-500">
                                                            {formatDate(email.created_at)}
                                                        </td>
                                                        <td className="px-3 py-2 capitalize">
                                                            <span
                                                                className={`px-2 py-1 text-xs rounded-full ${email.status === "sent"
                                                                        ? "bg-green-100 text-green-700"
                                                                        : email.status === "scheduled"
                                                                            ? "bg-blue-100 text-blue-700"
                                                                            : email.status === "draft"
                                                                                ? "bg-gray-200 text-gray-700"
                                                                                : "bg-yellow-100 text-yellow-700"
                                                                    }`}
                                                            >
                                                                {email.status}
                                                            </span>
                                                        </td>
                                                        <td
                                                            className="px-3 py-2 flex justify-end gap-3"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Eye
                                                                className="w-5 h-5 text-gray-500 cursor-pointer hover:text-blue-600 mt-2"
                                                                onClick={() =>
                                                                    navigate(`/emails/campaign/${email.campaign_id}`)
                                                                }
                                                            />
                                                            {(email.status === "draft" ||
                                                                email.status === "pending") && (
                                                                    <Pen
                                                                        className="w-5 h-5 text-blue-500 cursor-pointer hover:text-indigo-600"
                                                                        onClick={() =>
                                                                            navigate(
                                                                                `/new-email?draftId=${email.campaign_id}`
                                                                            )
                                                                        }
                                                                    />
                                                                )}
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
