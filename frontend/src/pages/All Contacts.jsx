import Sidebar from "../components/Sidebar";
import Label from "../components/Label";
import { backend } from "../server";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Edit2, Trash2, Loader2, ArrowRight, ChevronDown, X } from "lucide-react";
import { useState, useEffect } from "react";
import { notify } from "../utils/toast";

function Contacts() {
    const navigate = useNavigate();
    const [contacts, setContacts] = useState([]);
    const [filteredContacts, setFilteredContacts] = useState([]);
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
        gender: "",
    });
    const [errors, setErrors] = useState({});
    const [editingContact, setEditingContact] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGenderOpen, setIsGenderOpen] = useState(false);
    const [isCodeOpen, setIsCodeOpen] = useState(false);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [deleting, setDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [genderFilter, setGenderFilter] = useState("");
    const [tagFilter, setTagFilter] = useState("");
    const [countryFilter, setCountryFilter] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

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
                setFilteredContacts(response.data);
            } catch (error) {
                notify.error("Failed to fetch contacts");
                console.error("Error fetching contacts:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchContacts();
    }, []);

    // Filter and sort contacts
    useEffect(() => {
        let result = [...contacts];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (contact) =>
                    contact.first_name?.toLowerCase().includes(query) ||
                    contact.last_name?.toLowerCase().includes(query) ||
                    contact.email?.toLowerCase().includes(query)
            );
        }

        // Gender filter
        if (genderFilter) {
            result = result.filter((contact) => contact.gender === genderFilter);
        }

        // Tag filter
        if (tagFilter) {
            result = result.filter((contact) => contact.tag === tagFilter);
        }

        // Country filter
        if (countryFilter) {
            result = result.filter((contact) => contact.country === countryFilter);
        }

        // Sorting
        if (sortConfig.key) {
            result.sort((a, b) => {
                const aValue = a[sortConfig.key] || "";
                const bValue = b[sortConfig.key] || "";
                if (sortConfig.key === "created_at") {
                    return sortConfig.direction === "asc"
                        ? new Date(aValue) - new Date(bValue)
                        : new Date(bValue) - new Date(aValue);
                }
                return sortConfig.direction === "asc"
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            });
        }

        setFilteredContacts(result);
    }, [searchQuery, genderFilter, tagFilter, countryFilter, sortConfig, contacts]);

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
        if (selectedContacts.length === filteredContacts.length) {
            setSelectedContacts([]);
        } else {
            setSelectedContacts(filteredContacts.map((c) => c.contact_id));
        }
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
            firstName: contact.first_name || "",
            lastName: contact.last_name || "",
            email: contact.email || "",
            phoneNumber: phoneNumber,
            countryCode: countryCode,
            website: contact.website || "",
            address: contact.address || "",
            country: contact.country || "",
            state: contact.state || "",
            gender: contact.gender || "",
        });
        setErrors({});
    };

    const validateForm = () => {
        const newErrors = {};

        const nameRegex = /^[a-zA-Z\s]{2,50}$/;
        if (!nameRegex.test(formData.firstName.trim())) {
            newErrors.firstName = "First name must be 2-50 characters and contain only letters and spaces";
        }
        if (!nameRegex.test(formData.lastName.trim())) {
            newErrors.lastName = "Last name must be 2-50 characters and contain only letters and spaces";
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (formData.phoneNumber) {
            const cleanPhone = formData.phoneNumber.replace(/[\s\-\(\)]/g, "");
            const phoneRegex = /^\d{7,15}$/;
            if (!phoneRegex.test(cleanPhone)) {
                newErrors.phoneNumber = "Phone number should contain only digits (7-15 characters)";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editingContact) return;

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            const submitData = {
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                phone_number: formData.phoneNumber ? `${formData.countryCode}${formData.phoneNumber}` : "",
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
                    c.contact_id === editingContact.contact_id ? { ...c, ...response.data } : c
                )
            );
            setFilteredContacts((prev) =>
                prev.map((c) =>
                    c.contact_id === editingContact.contact_id ? { ...c, ...response.data } : c
                )
            );
            notify.success("Contact updated successfully");
            setEditingContact(null);
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phoneNumber: "",
                countryCode: "+254",
                website: "",
                address: "",
                country: "",
                state: "",
                gender: "",
            });
        } catch (error) {
            notify.error(error.response?.data?.error || "Failed to update contact");
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
            setFilteredContacts((prev) => prev.filter((c) => c.contact_id !== contact_id));
            setSelectedContacts((prev) => prev.filter((id) => id !== contact_id));
            notify.success("Contact deleted successfully");
        } catch (error) {
            notify.error("Failed to delete contact");
            console.error("Error deleting contact:", error);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedContacts.length === 0) {
            notify.warning("No contacts selected for deletion.");
            return;
        }

        if (
            !window.confirm(`Are you sure you want to delete ${selectedContacts.length} contact(s)?`)
        )
            return;

        try {
            setDeleting(true);
            const res = await axios.delete(`${backend}/contacts/delete/multiple`, {
                data: { ids: selectedContacts },
                withCredentials: true,
            });

            setContacts((prev) => prev.filter((c) => !selectedContacts.includes(c.contact_id)));
            setFilteredContacts((prev) =>
                prev.filter((c) => !selectedContacts.includes(c.contact_id))
            );
            setSelectedContacts([]);
            notify.success(res.data.message || "Contacts deleted successfully");
        } catch (error) {
            notify.error("Failed to delete selected contacts");
            console.error("Bulk delete error:", error);
        } finally {
            setDeleting(false);
        }
    };

    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
        }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return null;
        return (
            <ChevronDown
                className={`w-4 h-4 inline ml-1 transform transition-transform ${sortConfig.direction === "asc" ? "rotate-0" : "rotate-180"
                    }`}
            />
        );
    };

    // Get unique values for filters
    const uniqueGenders = [...new Set(contacts.map((c) => c.gender).filter(Boolean))];
    const uniqueTags = [...new Set(contacts.map((c) => c.tag).filter(Boolean))];
    const uniqueCountries = [...new Set(contacts.map((c) => c.country).filter(Boolean))];

    // Clear all filters
    const handleClearFilters = () => {
        setSearchQuery("");
        setGenderFilter("");
        setTagFilter("");
        setCountryFilter("");
        setSortConfig({ key: null, direction: null });
    };

    const inputStyles = `w-full px-4 py-2 rounded-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 text-base font-medium placeholder-gray-400 placeholder:text-xs transition duration-200`;

    return (
        <div className="flex h-screen bg-blue-50">
            {/* Sidebar */}
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Label />
                <div
                    className={`flex-1 overflow-y-auto p-6 transition-all duration-300 mt-20 ${editingContact ? "blur-sm" : ""
                        }`}
                >
                    {/* Contacts Table */}
                    <div className="max-w-8xl mx-auto px-6">
                        <div className="bg-white rounded-sm border border-blue-200">
                            <div className="bg-blue-100 px-6 py-3 rounded-t-sm flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-[#061338]">
                                    All Contacts ({filteredContacts.length})
                                </h2>
                                {selectedContacts.length > 0 && (
                                    <div className="flex items-center space-x-4">
                                        <p className="text-sm text-slate-600">{selectedContacts.length} selected</p>
                                        <button
                                            onClick={handleBulkDelete}
                                            disabled={deleting}
                                            className={`px-4 py-2 rounded-sm font-semibold text-white transition ${deleting ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                                                }`}
                                        >
                                            {deleting ? "Deleting..." : "Delete Selected"}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="p-8">
                                {/* Search and Filters */}
                                <div className="mb-6 space-y-4">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        {/* Search Bar */}
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                placeholder="Search by name or email..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className={inputStyles}
                                            />
                                        </div>

                                        {/* Filters */}
                                        <div className="flex gap-4 flex-wrap">
                                            {/* Gender Filter */}
                                            <select
                                                value={genderFilter}
                                                onChange={(e) => setGenderFilter(e.target.value)}
                                                className={`${inputStyles} text-gray-700 bg-white`}
                                            >
                                                <option value="">All Genders</option>
                                                {uniqueGenders.map((gender) => (
                                                    <option key={gender} value={gender}>
                                                        {gender}
                                                    </option>
                                                ))}
                                            </select>

                                            {/* Tag Filter */}
                                            <select
                                                value={tagFilter}
                                                onChange={(e) => setTagFilter(e.target.value)}
                                                className={`${inputStyles} text-gray-700 bg-white`}
                                            >
                                                <option value="">All Tags</option>
                                                {uniqueTags.map((tag) => (
                                                    <option key={tag} value={tag}>
                                                        {tag}
                                                    </option>
                                                ))}
                                            </select>

                                            {/* Country Filter */}
                                            <select
                                                value={countryFilter}
                                                onChange={(e) => setCountryFilter(e.target.value)}
                                                className={`${inputStyles} text-gray-700 bg-white`}
                                            >
                                                <option value="">All Countries</option>
                                                {uniqueCountries.map((country) => (
                                                    <option key={country} value={country}>
                                                        {country}
                                                    </option>
                                                ))}
                                            </select>

                                            {/* Clear Filters */}
                                            {(searchQuery || genderFilter || tagFilter || countryFilter || sortConfig.key) && (
                                                <button
                                                    onClick={handleClearFilters}
                                                    className="px-4 py-2 rounded-sm bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 flex items-center gap-2"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Clear Filters
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-teal-600 mr-2" />
                                        <p className="text-slate-500 text-sm">Loading contacts...</p>
                                    </div>
                                ) : filteredContacts.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-slate-500 text-xs mb-4">
                                            {searchQuery || genderFilter || tagFilter || countryFilter
                                                ? "No contacts match your filters."
                                                : "Try creating a new contact."}
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
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                onChange={handleSelectAll}
                                                                checked={
                                                                    selectedContacts.length === filteredContacts.length &&
                                                                    filteredContacts.length > 0
                                                                }
                                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                            />
                                                            <span className="text-xs font-semibold text-slate-700">Select All</span>
                                                        </div>
                                                    </th>
                                                    <th
                                                        className="px-4 py-2 text-left font-semibold text-slate-700 cursor-pointer"
                                                        onClick={() => handleSort("first_name")}
                                                    >
                                                        First Name {getSortIcon("first_name")}
                                                    </th>
                                                    <th
                                                        className="px-4 py-2 text-left font-semibold text-slate-700 cursor-pointer"
                                                        onClick={() => handleSort("last_name")}
                                                    >
                                                        Last Name {getSortIcon("last_name")}
                                                    </th>
                                                    <th
                                                        className="px-4 py-2 text-left font-semibold text-slate-700 cursor-pointer"
                                                        onClick={() => handleSort("email")}
                                                    >
                                                        Email {getSortIcon("email")}
                                                    </th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Phone</th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Website</th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Gender</th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Address</th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Country</th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">State</th>
                                                    <th
                                                        className="px-4 py-2 text-left font-semibold text-slate-700 cursor-pointer"
                                                        onClick={() => handleSort("created_at")}
                                                    >
                                                        Created {getSortIcon("created_at")}
                                                    </th>
                                                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredContacts.map((contact) => (
                                                    <tr
                                                        key={contact.contact_id}
                                                        className={`border-t border-slate-200 hover:bg-slate-50 transition duration-200 ${selectedContacts.includes(contact.contact_id) ? "bg-blue-50" : ""
                                                            }`}
                                                    >
                                                        <td className="px-4 py-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedContacts.includes(contact.contact_id)}
                                                                onChange={() => handleSelect(contact.contact_id)}
                                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2">{contact.first_name || "-"}</td>
                                                        <td className="px-4 py-2">{contact.last_name || "-"}</td>
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
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-white-50 bg-opacity-50">
                        <div className="bg-white rounded-sm border border-blue-200 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="bg-blue-100 px-6 py-3 rounded-t-sm flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-[#061338]">Update Contact</h2>
                                <button
                                    onClick={() => setEditingContact(null)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-6">
                                <form onSubmit={handleUpdate} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                First Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                className={`${inputStyles} ${errors.firstName ? "border-red-300 focus:ring-red-500" : ""}`}
                                                placeholder="e.g., John"
                                                required
                                            />
                                            {errors.firstName && (
                                                <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Last Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                className={`${inputStyles} ${errors.lastName ? "border-red-300 focus:ring-red-500" : ""}`}
                                                placeholder="e.g., Doe"
                                                required
                                            />
                                            {errors.lastName && (
                                                <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className={`${inputStyles} ${errors.email ? "border-red-300 focus:ring-red-500" : ""}`}
                                            placeholder="e.g., john.doe@example.com"
                                            required
                                        />
                                        {errors.email && (
                                            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Phone Number
                                        </label>
                                        <div className="flex">
                                            <div className="relative w-1/3">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCodeOpen(!isCodeOpen)}
                                                    className={`${inputStyles} rounded-l-sm flex justify-between items-center`}
                                                >
                                                    {formData.countryCode
                                                        ? countryCodes.find((c) => c.code === formData.countryCode)
                                                            ?.flag +
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
                                            <input
                                                type="text"
                                                value={formData.phoneNumber}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, phoneNumber: e.target.value })
                                                }
                                                className={`${inputStyles} w-2/3 rounded-r-sm ${errors.phoneNumber ? "border-red-300 focus:ring-red-500" : ""
                                                    }`}
                                                placeholder="e.g., 1234567890"
                                            />
                                        </div>
                                        {errors.phoneNumber && (
                                            <p className="mt-1 text-xs text-red-500">{errors.phoneNumber}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Website
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            className={inputStyles}
                                            placeholder="e.g., https://example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Address
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className={inputStyles}
                                            placeholder="e.g., 123 Main St"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Country
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.country}
                                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                                className={inputStyles}
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
                                                className={inputStyles}
                                                placeholder="e.g., California"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Gender
                                        </label>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setIsGenderOpen(!isGenderOpen)}
                                                className={`${inputStyles} flex justify-between items-center`}
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
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`group w-full bg-blue-600 font-semibold text-white px-6 py-2 rounded-sm flex justify-center items-center space-x-2 transition-all ${isSubmitting ? "opacity-70 cursor-wait" : "hover:bg-blue-700 cursor-pointer"
                                            }`}
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