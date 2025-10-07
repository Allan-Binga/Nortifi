import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Edit2, Trash2, Loader2 } from "lucide-react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Label from "../components/Label";
import { backend } from "../server";
import { notify } from "../utils/toast";

function WebsiteContacts() {
    const { websiteId } = useParams();
    const navigate = useNavigate();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const res = await axios.get(`${backend}/contacts/website/${websiteId}`, {
                    withCredentials: true,
                });
                setContacts(res.data.contacts || []);
            } catch (err) {
                console.error("Failed to fetch contacts:", err);
                notify.error("Could not load contacts for this website.");
            } finally {
                setLoading(false);
            }
        };

        fetchContacts();
    }, [websiteId]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const handleSelect = (contactId) => {
        setSelectedContacts((prev) =>
            prev.includes(contactId)
                ? prev.filter((id) => id !== contactId)
                : [...prev, contactId]
        );
    };

    const handleSelectAll = () => {
        if (selectedContacts.length === contacts.length) {
            setSelectedContacts([]);
        } else {
            setSelectedContacts(contacts.map((c) => c.contact_id));
        }
    };

    const handleEdit = (contact) => {
        navigate(`/edit-contact/${contact.contact_id}`);
    };

    // Single delete
    const handleDelete = async (contactId) => {
        try {
            await axios.delete(`${backend}/contacts/${contactId}`, {
                withCredentials: true,
            });
            setContacts((prev) => prev.filter((c) => c.contact_id !== contactId));
            notify.success("Contact deleted successfully.");
        } catch (err) {
            console.error("Delete error:", err);
            notify.error("Failed to delete contact.");
        }
    };

    // Bulk delete
    const handleBulkDelete = async () => {
        if (selectedContacts.length === 0) {
            notify.warning("No contacts selected for deletion.");
            return;
        }

        const confirmDelete = window.confirm(
            `Are you sure you want to delete ${selectedContacts.length} contact(s)?`
        );
        if (!confirmDelete) return;

        try {
            setDeleting(true);
            const res = await axios.delete(`${backend}/contacts/delete/multiple`, {
                data: { ids: selectedContacts },
                withCredentials: true,
            });

            notify.success(res.data.message);
            setContacts((prev) =>
                prev.filter((c) => !selectedContacts.includes(c.contact_id))
            );
            setSelectedContacts([]);
        } catch (err) {
            console.error("Bulk delete error:", err);
            notify.error("Failed to delete selected contacts.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="flex h-screen bg-blue-50">
            <Sidebar />

            <div className="flex-1 flex flex-col">
                <Label />

                <div className="flex-1 overflow-y-auto p-6 mt-20 transition-all duration-300">
                    <div className="max-w-8xl mx-auto px-6">
                        <div className="bg-white rounded-sm border border-blue-200">
                            <div className="bg-blue-100 px-6 py-3 rounded-t-sm flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-[#061338]">
                                    All Contacts ({contacts.length})
                                </h2>

                                {selectedContacts.length > 0 && (
                                    <div className="flex items-center space-x-4">
                                        <p className="text-sm text-slate-600">
                                            {selectedContacts.length} selected
                                        </p>
                                        <button
                                            onClick={handleBulkDelete}
                                            disabled={deleting}
                                            className={`px-4 py-2 rounded-sm font-semibold text-white transition ${deleting
                                                ? "bg-red-300 cursor-not-allowed"
                                                : "bg-red-600 hover:bg-red-700"
                                                }`}
                                        >
                                            {deleting ? "Deleting..." : "Delete Selected"}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="p-8">
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-teal-600 mr-2" />
                                        <p className="text-slate-500 text-sm">Loading contacts...</p>
                                    </div>
                                ) : contacts.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-slate-500 text-xs mb-4">
                                            Try creating a new contact.
                                        </p>
                                        <button
                                            onClick={() => navigate("/add-contact")}
                                            className="px-4 py-3 rounded-sm bg-blue-600 font-bold text-white cursor-pointer hover:bg-blue-700"
                                        >
                                            + Add Contact
                                        </button>
                                    </div>
                                ) : (
                                    <div className="max-h-[500px] overflow-y-auto">
                                        <table className="w-full text-sm text-slate-700 min-w-[1100px]">
                                            <thead>
                                                <tr className="bg-blue-50 sticky top-0">
                                                    <th className="px-4 py-2">
                                                        <input
                                                            type="checkbox"
                                                            onChange={handleSelectAll}
                                                            checked={
                                                                selectedContacts.length === contacts.length &&
                                                                contacts.length > 0
                                                            }
                                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                        />
                                                    </th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">
                                                        First Name
                                                    </th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">
                                                        Last Name
                                                    </th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">
                                                        Email
                                                    </th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">
                                                        Phone
                                                    </th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">
                                                        Gender
                                                    </th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">
                                                        Address
                                                    </th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">
                                                        Country
                                                    </th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">
                                                        State
                                                    </th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">
                                                        Created
                                                    </th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {contacts.map((contact) => (
                                                    <tr
                                                        key={contact.contact_id}
                                                        className={`border-t border-slate-200 hover:bg-slate-50 transition duration-200 ${selectedContacts.includes(contact.contact_id)
                                                            ? "bg-blue-50"
                                                            : ""
                                                            }`}
                                                    >
                                                        <td className="px-4 py-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedContacts.includes(
                                                                    contact.contact_id
                                                                )}
                                                                onChange={() => handleSelect(contact.contact_id)}
                                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                            />
                                                        </td>

                                                        <td className="px-4 py-2">{contact.first_name}</td>
                                                        <td className="px-4 py-2">{contact.last_name}</td>
                                                        <td className="px-4 py-2">
                                                            <a
                                                                href={`mailto:${contact.email}`}
                                                                className="text-blue-600 hover:text-blue-700 hover:underline"
                                                            >
                                                                {contact.email}
                                                            </a>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {contact.phone_number ? (
                                                                <a
                                                                    href={`tel:${contact.phone_number}`}
                                                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                                                >
                                                                    {contact.phone_number}
                                                                </a>
                                                            ) : (
                                                                <span className="text-slate-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2">{contact.gender || "-"}</td>
                                                        <td className="px-4 py-2">{contact.address || "-"}</td>
                                                        <td className="px-4 py-2">{contact.country || "-"}</td>
                                                        <td className="px-4 py-2">{contact.state || "-"}</td>
                                                        <td className="px-4 py-2">
                                                            {formatDate(contact.created_at)}
                                                        </td>

                                                        <td className="px-4 py-2">
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={() => handleEdit(contact)}
                                                                    className="cursor-pointer text-teal-600 hover:text-teal-800 p-1 rounded hover:bg-teal-50 transition duration-200"
                                                                    title="Edit contact"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleDelete(contact.contact_id)
                                                                    }
                                                                    className="cursor-pointer text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition duration-200"
                                                                    title="Delete contact"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
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

export default WebsiteContacts;
