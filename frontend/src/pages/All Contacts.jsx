import Sidebar from "../components/Sidebar"
import { backend } from "../server"
import axios from "axios"
import { Edit2, Trash2, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { notify } from "../utils/toast"


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
    const [errors, setErrors] = useState({});
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
        const day = date.getDate();
        const month = date.toLocaleString("default", { month: "long" });
        const year = date.getFullYear();

        const getDaySuffix = (day) => {
            if (day >= 11 && day <= 13) return "th";
            switch (day % 10) {
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

        return `${day}${getDaySuffix(day)} ${month} ${year}`;
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
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            phoneNumber: phoneNumber,
            countryCode: countryCode,
            website: contact.website || "",
            address: "",
            country: "",
            state: "",
            gender: ""
        });
        setErrors({});
    };


    const handleDelete = async (contact_id) => {
        if (!window.confirm("Are you sure you want to delete this contact?"))
            return;
        try {
            await axios.delete(`${backend}/contacts/delete-contact/${contact_id}`, {
                withCredentials: true,
            });
            setContacts((prev) =>
                prev.filter((contact) => contact.contact_id !== contact_id)
            );
            notify.success("Contact deleted successfully");
        } catch (error) {
            notify.error("Failed to delete contact");
            console.error("Error deleting contact:", error);
        }
    };




    return (
        <div className="flex h-screen bg-gray-100">
            {/*Sidebar*/}
            <Sidebar />
            <div className="flex-1 overflow-y-auto">
                {/* Contacts Table */}
                <div className="bg-white rounded-lg shadow-lg mt-10">
                    <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Contacts ({contacts.length})
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
                            <div className="max-h-96 overflow-y-auto">
                                <table className="w-full text-sm text-slate-700 min-w-[900px]">
                                    <thead>
                                        <tr className="bg-slate-50 sticky top-0">
                                            <th className="px-6 py-4 text-left font-semibold text-slate-700">
                                                First Name
                                            </th>
                                            <th className="px-6 py-4 text-left font-semibold text-slate-700">
                                                Last Name
                                            </th>
                                            <th className="px-6 py-4 text-left font-semibold text-slate-700">
                                                Email
                                            </th>
                                            <th className="px-6 py-4 text-left font-semibold text-slate-700">
                                                Phone Number
                                            </th>
                                            <th className="px-6 py-4 text-left font-semibold text-slate-700">
                                                Website
                                            </th>
                                            <th className="px-6 py-4 text-left font-semibold text-slate-700">
                                                Created At
                                            </th>
                                            <th className="px-6 py-4 text-left font-semibold text-slate-700">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contacts.map((contact) => (
                                            <tr
                                                key={contact.contact_id}
                                                className="border-t border-slate-200 hover:bg-slate-50 transition duration-200"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                    {contact.first_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                    {contact.last_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                    <a
                                                        href={`mailto:${contact.email}`}
                                                        className="text-teal-600 hover:text-teal-800 hover:underline"
                                                    >
                                                        {contact.email}
                                                    </a>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                    {contact.phone_number ? (
                                                        <a
                                                            href={`tel:${contact.phone_number}`}
                                                            className="text-teal-600 hover:text-teal-800 hover:underline"
                                                        >
                                                            {contact.phone_number}
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                    {contact.website ? (
                                                        <a
                                                            href={
                                                                contact.website.startsWith("http")
                                                                    ? contact.website
                                                                    : `https://${contact.website}`
                                                            }
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
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                    {formatDate(contact.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-3">
                                                        <button
                                                            onClick={() => handleEdit(contact)}
                                                            className="cursor-pointer text-teal-600 hover:text-teal-800 p-2 rounded hover:bg-teal-50 transition duration-200"
                                                            title="Edit contact"
                                                            disabled={isSubmitting}
                                                        >
                                                            <Edit2 className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(contact.contact_id)}
                                                            className="cursor-pointer text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition duration-200"
                                                            title="Delete contact"
                                                            disabled={isSubmitting}
                                                        >
                                                            <Trash2 className="w-5 h-5" />
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
    )
}

export default Contacts