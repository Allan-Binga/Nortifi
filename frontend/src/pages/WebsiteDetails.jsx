import {
    Globe,
    Users,
    Tag,
    Calendar,
    SquarePen,
    Mail,
    Phone,
    Building,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import Label from "../components/Label";
import Spinner from "../components/Spinner";
import { backend } from "../server";
import axios from "axios";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function WebsiteDetails() {
    const { websiteId } = useParams();
    const navigate = useNavigate();
    const [website, setWebsite] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await axios.get(`${backend}/websites/website/details/${websiteId}`, {
                    withCredentials: true,
                });
                if (res.data.success) {
                    setWebsite(res.data.website);
                } else {
                    setError(res.data.message || "Failed to fetch website details.");
                }
            } catch (err) {
                console.error("Failed to fetch website details:", err);
                setError("Failed to fetch website details.");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [websiteId]);

    if (loading) {
        return (
            <div className="flex min-h-screen bg-blue-50">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <Spinner />
                </div>
            </div>
        );
    }

    if (error || !website) {
        return (
            <div className="flex min-h-screen bg-blue-50">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center bg-white p-8 rounded-2xl shadow-md">
                        <p className="text-red-600 font-semibold mb-4">{error || "Website not found."}</p>
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
                    <div className="max-w-3xl mx-auto px-6 mt-20 mb-20">
                        <div className="bg-white rounded-md border border-blue-200 overflow-hidden">
                            {/* Header */}
                            <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    {website.company_name || website.domain}
                                </h2>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-6 space-y-6 text-gray-700">
                                <div className="flex items-start gap-3">
                                    <Building className="w-5 h-5 text-[#061338] mt-1" />
                                    <div>
                                        <span className="font-bold">Company Name:</span> {website.company_name || "-"}
                                        <p className="text-sm text-gray-500 mt-1">
                                            The name of the company associated with the website.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Globe className="w-5 h-5 text-[#061338] mt-1" />
                                    <div>
                                        <span className="font-bold">Domain:</span>{" "}
                                        <a
                                            href={
                                                website.domain.startsWith("http")
                                                    ? website.domain
                                                    : `https://${website.domain}`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            {website.domain}
                                        </a>
                                        <p className="text-sm text-gray-500 mt-1">
                                            The domain name of the website.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Tag className="w-5 h-5 text-[#061338] mt-1" />
                                    <div>
                                        <span className="font-bold">Field:</span> {website.field || "-"}
                                        <p className="text-sm text-gray-500 mt-1">
                                            The industry or category the website belongs to.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-[#061338] mt-1" />
                                    <div>
                                        <span className="font-bold">Created At:</span>{" "}
                                        {new Date(website.created_at).toLocaleString()}
                                        <p className="text-sm text-gray-500 mt-1">
                                            The date and time when this website was added.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <SquarePen className="w-5 h-5 text-[#061338] mt-1" />
                                    <div>
                                        <span className="font-bold">Updated At:</span>{" "}
                                        {new Date(website.updated_at).toLocaleString()}
                                        <p className="text-sm text-gray-500 mt-1">
                                            The date and time when this website was last updated.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Users className="w-5 h-5 text-[#061338] mt-1" />
                                    <div className="w-full">
                                        <span className="font-bold">Contacts:</span>{" "}
                                        {website.contacts.length} contact{website.contacts.length !== 1 ? "s" : ""}
                                        <p className="text-sm text-gray-500 mt-1">
                                            List of contacts associated with this website.
                                        </p>
                                        {website.contacts.length > 0 ? (
                                            <div className="mt-4 overflow-x-auto">
                                                <table className="w-full text-sm text-slate-700 min-w-[600px]">
                                                    <thead>
                                                        <tr className="bg-blue-50">
                                                            <th className="px-4 py-2 text-left font-semibold text-slate-700">First Name</th>
                                                            <th className="px-4 py-2 text-left font-semibold text-slate-700">Last Name</th>
                                                            <th className="px-4 py-2 text-left font-semibold text-slate-700">Email</th>
                                                            <th className="px-4 py-2 text-left font-semibold text-slate-700">Tag</th>
                                                            <th className="px-4 py-2 text-left font-semibold text-slate-700">Phone</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {website.contacts.map((contact) => (
                                                            <tr
                                                                key={contact.contact_id}
                                                                className="border-t border-slate-200 hover:bg-slate-50 transition duration-200"
                                                            >
                                                                <td className="px-4 py-2">{contact.first_name || "-"}</td>
                                                                <td className="px-4 py-2">{contact.last_name || "-"}</td>
                                                                <td className="px-4 py-2">
                                                                    <a
                                                                        href={`mailto:${contact.email}`}
                                                                        className="text-blue-600 hover:underline"
                                                                    >
                                                                        {contact.email}
                                                                    </a>
                                                                </td>
                                                                <td className="px-4 py-2">{contact.tag || "-"}</td>
                                                                <td className="px-4 py-2">
                                                                    {contact.phone_number ? (
                                                                        <a
                                                                            href={`tel:${contact.phone_number}`}
                                                                            className="text-blue-600 hover:underline"
                                                                        >
                                                                            {contact.phone_number}
                                                                        </a>
                                                                    ) : (
                                                                        "-"
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 mt-2">No contacts associated with this website.</p>
                                        )}
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

export default WebsiteDetails;