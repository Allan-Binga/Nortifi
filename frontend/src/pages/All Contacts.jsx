import Sidebar from "../components/Sidebar";
import Label from "../components/Label";
import { backend } from "../server";
import axios from "axios";
import { Edit2, Trash2, Loader2, X, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { notify } from "../utils/toast";

function Contacts() {
    const [contacts, setContacts] = useState([]);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        countryCode: "+254",
        website: "",
        address: "",
        country: "",
        state: "",
        gender: ""
    });
    const [editingContact, setEditingContact] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const countryCodes = [
        { code: "+1", country: "US/Canada", flag: "🇺🇸" },
        { code: "+44", country: "UK", flag: "🇬🇧" },
        { code: "+254", country: "Kenya", flag: "🇰🇪" },
        { code: "+234", country: "Nigeria", flag: "🇳🇬" },
        { code: "+27", country: "South Africa", flag: "🇿🇦" },
        { code: "+91", country: "India", flag: "🇮🇳" },
        { code: "+86", country: "China", flag: "🇨🇳" },
        { code: "+81", country: "Japan", flag: "🇯🇵" },
        { code: "+49", country: "Germany", flag: "🇩🇪" },
        { code: "+33", country: "France", flag: "🇫🇷" },
    ];

    useEffect(() => {
        const fetchContacts = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${backend}/contacts/all-contacts`, {
                    withCredentials: true,
                });
                setContacts(response.data);
            } catch (error) {
                notify.error("Failed to fetch contacts");
                console.error("Error fetching contacts:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchContacts();
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const handleEdit = (contact) => {
        setEditingContact(contact);

        let countryCode = "+254";
        let phoneNumber = "";

        if (contact.phone_number) {
            const foundCode = countryCodes.find((cc) =>
                contact.phone_number.startsWith(cc.code)
            );
            if (foundCode) {
                countryCode = foundCode.code;
                phoneNumber = contact.phone_number.substring(foundCode.code.length);
            } else {
                phoneNumber = contact.phone_number;
            }
        }

        setFormData({
            firstName: contact.first_name,
            lastName: contact.last_name,
            email: contact.email,
            phoneNumber: phoneNumber,
            countryCode: countryCode,
            website: contact.website || "",
            address: contact.address || "",
            country: contact.country || "",
            state: contact.state || "",
            gender: contact.gender || "",
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editingContact) return;

        setIsSubmitting(true);
        try {
            const submitData = {
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                phone_number: `${formData.countryCode}${formData.phoneNumber}`,
                website: formData.website,
                address: formData.address,
                country: formData.country,
                state: formData.state,
                gender: formData.gender,
            };

            const response = await axios.patch(
                `${backend}/contacts/update-contact/${editingContact.contact_id}`,
                submitData,
                { withCredentials: true }
            );

            setContacts((prev) =>
                prev.map((c) =>
                    c.contact_id === editingContact.contact_id ? response.data : c
                )
            );
            notify.success("Contact updated successfully");
            setEditingContact(null);
        } catch (error) {
            notify.error("Failed to update contact");
            console.error("Error updating contact:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (contact_id) => {
        if (!window.confirm("Are you sure you want to delete this contact?")) return;
        try {
            await axios.delete(`${backend}/contacts/delete-contact/${contact_id}`, {
                withCredentials: true,
            });
            setContacts((prev) => prev.filter((c) => c.contact_id !== contact_id));
            notify.success("Contact deleted successfully");
        } catch (error) {
            notify.error("Failed to delete contact");
            console.error("Error deleting contact:", error);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Label />
                <div className={`flex-1 overflow-y-auto p-6 transition-all duration-300 ${editingContact ? 'blur-sm' : ''}`}>
                    {/* Header */}
                    <div className="text-center mb-10 mt-6">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center">
                                <Users className="w-8 h-8 text-teal-600" />
                            </div>
                        </div>
                        <h1 className="text-4xl font-light mb-2">Contacts</h1>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Manage and organize your contact list
                        </p>
                    </div>

                    {/* Contacts Table */}
                    <div className="max-w-8xl mx-auto px-8">
                        <div className="bg-white rounded-lg shadow-lg">
                            <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-8 py-6 rounded-t-lg">
                                <h2 className="text-xl font-bold text-white">
                                    All Contacts ({contacts.length})
                                </h2>
                            </div>

                            <div className="p-8">
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-teal-600 mr-2" />
                                        <p className="text-slate-500 text-sm">Loading contacts...</p>
                                    </div>
                                ) : contacts.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-slate-600 text-sm mb-2">
                                            No contacts found.
                                        </p>
                                        <p className="text-slate-500 text-xs">
                                            Create your first contact using the form above.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="max-h-[500px] overflow-y-auto">
                                        <table className="w-full text-sm text-slate-700 min-w-[1100px]">
                                            <thead>
                                                <tr className="bg-slate-50 sticky top-0">
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">First Name</th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Last Name</th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Email</th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Phone</th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Website</th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Gender</th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Address</th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Country</th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">State</th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Created</th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {contacts.map((contact) => (
                                                    <tr
                                                        key={contact.contact_id}
                                                        className="border-t border-slate-200 hover:bg-slate-50 transition duration-200"
                                                    >
                                                        <td className="px-4 py-2">{contact.first_name}</td>
                                                        <td className="px-4 py-2">{contact.last_name}</td>
                                                        <td className="px-4 py-2">
                                                            <a href={`mailto:${contact.email}`} className="text-teal-600 hover:text-teal-800 hover:underline">
                                                                {contact.email}
                                                            </a>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {contact.phone_number ? (
                                                                <a href={`tel:${contact.phone_number}`} className="text-teal-600 hover:text-teal-800 hover:underline">
                                                                    {contact.phone_number}
                                                                </a>
                                                            ) : (
                                                                <span className="text-slate-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {contact.website ? (
                                                                <a
                                                                    href={contact.website.startsWith("http") ? contact.website : `https://${contact.website}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-teal-600 hover:text-teal-800 hover:underline"
                                                                >
                                                                    {contact.website}
                                                                </a>
                                                            ) : (
                                                                <span className="text-slate-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2">{contact.gender || "-"}</td>
                                                        <td className="px-4 py-2">{contact.address || "-"}</td>
                                                        <td className="px-4 py-2">{contact.country || "-"}</td>
                                                        <td className="px-4 py-2">{contact.state || "-"}</td>
                                                        <td className="px-4 py-2">{formatDate(contact.created_at)}</td>
                                                        <td className="px-4 py-2">
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={() => handleEdit(contact)}
                                                                    className="cursor-pointer text-teal-600 hover:text-teal-800 p-1 rounded hover:bg-teal-50 transition duration-200"
                                                                    title="Edit contact"
                                                                    disabled={isSubmitting}
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(contact.contact_id)}
                                                                    className="cursor-pointer text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition duration-200"
                                                                    title="Delete contact"
                                                                    disabled={isSubmitting}
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

                {/* Modal for Editing */}
                {editingContact && (
                    <div className="fixed inset-0 flex items-center justify-center bg-transparent backdrop-blur-sm z-50">
                        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 relative animate-fade-in">
                            {/* Close Button */}
                            <button
                                onClick={() => setEditingContact(null)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Title */}
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                Edit Contact
                            </h2>

                            {/* Form */}
                            <form onSubmit={handleUpdate} className="space-y-4">
                                {/* Name Row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                    <div className="flex">
                                        <select
                                            value={formData.countryCode}
                                            onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                                            className="border p-2 rounded-l w-1/3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        >
                                            {countryCodes.map((cc) => (
                                                <option key={cc.code} value={cc.code}>
                                                    {cc.flag} {cc.code}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            value={formData.phoneNumber}
                                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                            className="border p-2 rounded-r w-2/3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                </div>

                                {/* Website */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                                    <input
                                        type="text"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>

                                {/* Country + State */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                                        <input
                                            type="text"
                                            value={formData.country}
                                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                                        <input
                                            type="text"
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                </div>

                                {/* Gender */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    >
                                        <option value="">Select gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-teal-600 text-white py-2 px-4 rounded hover:bg-teal-700 flex justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        "Update Contact"
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>


        </div>
    );
}

export default Contacts;
