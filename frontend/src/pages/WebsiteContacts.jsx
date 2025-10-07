import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Edit2, Trash2, Loader2, X } from "lucide-react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Label from "../components/Label";
import { backend } from "../server";
import { notify } from "../utils/toast";

function WebsiteContacts() {
    const { websiteId } = useParams();
    const navigate = useNavigate();
    const [editingContact, setEditingContact] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [filteredContacts, setFilteredContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [deleting, setDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [genderFilter, setGenderFilter] = useState("");
    const [tagFilter, setTagFilter] = useState("");
    const [countryFilter, setCountryFilter] = useState("");

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const res = await axios.get(`${backend}/contacts/website/${websiteId}`, {
                    withCredentials: true,
                });
                setContacts(res.data.contacts || []);
                setFilteredContacts(res.data.contacts || []);
            } catch (err) {
                console.error("Failed to fetch contacts:", err);
                notify.error("Could not load contacts for this website.");
            } finally {
                setLoading(false);
            }
        };

        fetchContacts();
    }, [websiteId]);

    // Filter contacts based on search and filters
    useEffect(() => {
        let result = contacts;

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

        setFilteredContacts(result);
    }, [searchQuery, genderFilter, tagFilter, countryFilter, contacts]);

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

    const handleDelete = async (contactId) => {
        try {
            await axios.delete(`${backend}/contacts/delete-contact/${contactId}`, {
                withCredentials: true,
            });
            setContacts((prev) => prev.filter((c) => c.contact_id !== contactId));
            setFilteredContacts((prev) => prev.filter((c) => c.contact_id !== contactId));
            notify.success("Contact deleted successfully.");
        } catch (err) {
            console.error("Delete error:", err);
            notify.error("Failed to delete contact.");
        }
    };

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
            setContacts((prev) => prev.filter((c) => !selectedContacts.includes(c.contact_id)));
            setFilteredContacts((prev) =>
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
                                    All Contacts ({filteredContacts.length})
                                </h2>

                                {selectedContacts.length > 0 && (
                                    <div className="flex items-center space-x-4">
                                        <p className="text-sm text-slate-600">
                                            {selectedContacts.length} selected
                                        </p>
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
                                                className="w-full px-4 py-2 rounded-xs border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 text-base font-medium placeholder-gray-400"
                                            />
                                        </div>

                                        {/* Filters */}
                                        <div className="flex gap-4 flex-wrap">
                                            {/* Gender Filter */}
                                            <select
                                                value={genderFilter}
                                                onChange={(e) => setGenderFilter(e.target.value)}
                                                className="px-4 py-2 rounded-xs border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 text-base font-medium text-gray-700 bg-white"
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
                                                className="px-4 py-2 rounded-xs border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 text-base font-medium text-gray-700 bg-white"
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
                                                className="px-4 py-2 rounded-xs border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 text-base font-medium text-gray-700 bg-white"
                                            >
                                                <option value="">All Countries</option>
                                                {uniqueCountries.map((country) => (
                                                    <option key={country} value={country}>
                                                        {country}
                                                    </option>
                                                ))}
                                            </select>

                                            {/* Clear Filters */}
                                            {(searchQuery || genderFilter || tagFilter || countryFilter) && (
                                                <button
                                                    onClick={handleClearFilters}
                                                    className="px-4 py-2 rounded-xs bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 flex items-center gap-2"
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
                                                        <td className="px-4 py-2">{formatDate(contact.created_at)}</td>
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
                                                                    onClick={() => handleDelete(contact.contact_id)}
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

export default WebsiteContacts;