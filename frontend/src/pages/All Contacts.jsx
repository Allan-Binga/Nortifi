import Sidebar from "../components/Sidebar";
import Label from "../components/Label";
import { backend } from "../server";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Edit2, Trash2, Loader2, ArrowRight, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { notify } from "../utils/toast";

function Contacts() {
    const navigate = useNavigate()
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
    const [isGenderOpen, setIsGenderOpen] = useState(false);
    const [isCodeOpen, setIsCodeOpen] = useState(false);


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

            // Log the response to debug its structure
            console.log("API Response:", response.data);

            // Merge the existing contact with the updated data from the response
            setContacts((prev) =>
                prev.map((c) =>
                    c.contact_id === editingContact.contact_id
                        ? { ...c, ...response.data }
                        : c
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
        <div className="flex h-screen bg-blue-50">
            {/* Sidebar */}
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Label />
                <div className={`flex-1 overflow-y-auto p-6 transition-all duration-300 mt-20 ${editingContact ? 'blur-sm' : ''}`}>
                    {/* Contacts Table */}
                    <div className="max-w-8xl mx-auto px-6">
                        <div className="bg-white rounded-sm border border-blue-200">
                            <div className="bg-blue-100 px-6 py-3 rounded-t-sm">
                                <h2 className="text-lg font-semibold text-[#061338]">
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

                {/* Modal for Updating */}
                {editingContact && (
                    <div className="fixed inset-0 flex items-center justify-center z-[10000] bg-white-50 backdrop-blur-sm">
                        <div className="bg-white rounded-sm border border-blue-200 max-w-md w-full mx-4">
                            {/* Header */}
                            <div className="bg-blue-100 px-6 py-3 rounded-t-md flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-[#061338]">Update Contact</h2>
                                <button
                                    onClick={() => setEditingContact(null)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Form */}
                            <div className="p-6">
                                <form onSubmit={handleUpdate} className="space-y-4">
                                    {/* Name Row */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                First Name
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                className="w-full px-4 py-2 rounded-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-xs"
                                                placeholder="e.g., John"
                                            />

                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Last Name
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                className="w-full px-4 py-2 rounded-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-xs"
                                                placeholder="e.g., Doe"
                                            />

                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-2 rounded-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-xs"
                                            placeholder="e.g., john.doe@example.com"
                                        />

                                    </div>

                                    {/* Phone Number */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Phone Number
                                        </label>
                                        <div className="flex">
                                            {/* Country Code Dropdown */}
                                            <div className="relative w-1/3">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCodeOpen(!isCodeOpen)}
                                                    className="w-full flex justify-between items-center px-4 py-2 rounded-l-sm bg-white border border-blue-300"
                                                >
                                                    {formData.countryCode
                                                        ? countryCodes.find((c) => c.code === formData.countryCode)?.flag +
                                                        " " +
                                                        formData.countryCode
                                                        : "Code"}
                                                    <ChevronDown
                                                        className={`w-5 h-5 text-gray-500 transform transition-transform ${isCodeOpen ? "rotate-180" : "rotate-0"
                                                            }`}
                                                    />
                                                </button>

                                                {isCodeOpen && (
                                                    <ul className="absolute mt-2 w-full rounded-sm bg-white border border-blue-100 z-10 max-h-40 overflow-y-auto animate-fadeIn">
                                                        {countryCodes.map((cc) => (
                                                            <li
                                                                key={cc.code}
                                                                onClick={() => {
                                                                    setFormData({ ...formData, countryCode: cc.code });
                                                                    setIsCodeOpen(false);
                                                                }}
                                                                className={`px-4 py-2 cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors ${formData.countryCode === cc.code
                                                                    ? "bg-blue-100 text-blue-700"
                                                                    : ""
                                                                    }`}
                                                            >
                                                                {cc.flag} {cc.code}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>

                                            {/* Phone Input */}
                                            <input
                                                type="text"
                                                value={formData.phoneNumber}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, phoneNumber: e.target.value })
                                                }
                                                className="w-2/3 px-4 py-2 rounded-r-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-xs"
                                                placeholder="e.g., 1234567890"
                                            />
                                        </div>
                                    </div>


                                    {/* Website */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Website
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            className="w-full px-4 py-2 rounded-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-xs"
                                            placeholder="e.g., https://example.com"
                                        />

                                    </div>

                                    {/* Address */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Address
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full px-4 py-2 rounded-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-xs"
                                            placeholder="e.g., 123 Main St"
                                        />

                                    </div>

                                    {/* Country + State */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Country
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.country}
                                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                                className="w-full px-4 py-2 rounded-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-xs"
                                                placeholder="e.g., United States"
                                            />

                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                State
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.state}
                                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                                className="w-full px-4 py-2 rounded-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-xs"
                                                placeholder="e.g., California"
                                            />

                                        </div>
                                    </div>

                                    {/* Gender */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Gender
                                        </label>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setIsGenderOpen(!isGenderOpen)}
                                                className="w-full flex justify-between items-center px-4 py-2 rounded-sm bg-white border border-blue-300"
                                            >
                                                {formData.gender || "Select gender"}
                                                <ChevronDown
                                                    className={`w-5 h-5 text-gray-500 transform transition-transform ${isGenderOpen ? "rotate-180" : "rotate-0"
                                                        }`}
                                                />
                                            </button>

                                            {isGenderOpen && (
                                                <ul className="absolute mt-2 w-full rounded-sm bg-white border border-blue-100 z-10 animate-fadeIn">
                                                    {["Male", "Female", "Other"].map((option) => (
                                                        <li
                                                            key={option}
                                                            onClick={() => {
                                                                setFormData({ ...formData, gender: option });
                                                                setIsGenderOpen(false);
                                                            }}
                                                            className={`px-4 py-2 cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors ${formData.gender === option ? "bg-blue-100 text-blue-700" : ""
                                                                }`}
                                                        >
                                                            {option}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>


                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`group w-full bg-blue-600 font-semibold text-white px-6 py-2 rounded-sm flex justify-center items-center space-x-2 transition-all ${isSubmitting ? "opacity-70 cursor-wait" : "hover:bg-blue-700 cursor-pointer"}`}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Updating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Update Contact</span>
                                                <ArrowRight className="w-4 h-4 opacity-0 -rotate-45 transform transition-all duration-300 group-hover:opacity-100 group-hover:rotate-0" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>


        </div>
    );
}

export default Contacts;
