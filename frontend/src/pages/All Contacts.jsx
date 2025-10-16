import Sidebar from "../components/Sidebar";
import Spinner from "../components/Spinner";
import Label from "../components/Label";
import { backend } from "../server";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Edit2, Trash2, Loader2, ArrowRight, ChevronDown, X, Tags } from "lucide-react";
import { useState, useEffect } from "react";
import { notify } from "../utils/toast";
import { fetchWebsites } from "../utils/websites";
import { fetchLabels } from "../utils/labels";
import CreateContactModal from "../components/CreateContact";
import NewLabelModal from "../components/NewLabel";
import PhoneInputWithCountrySelect from "react-phone-number-input";
import { useWebsite } from "../context/WebsiteContext";
import "react-phone-number-input/style.css";
import "../components/CustomPhoneInput.css";

function Contacts() {
    const { activeWebsite } = useWebsite();
    const navigate = useNavigate();
    const [websites, setWebsites] = useState([]);
    const [selectedWebsite, setSelectedWebsite] = useState("");
    const [websiteDropdownOpen, setWebsiteDropdownOpen] = useState(false);
    const [prefixDropdownOpen, setPrefixDropdownOpen] = useState(false);
    const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
    const [labelDropdownOpen, setLabelDropdownOpen] = useState(false); // New state for label dropdown
    const [contacts, setContacts] = useState([]);
    const [filteredContacts, setFilteredContacts] = useState([]);
    const [formData, setFormData] = useState({
        prefix: "",
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        address: "",
        country: "",
        state: "",
        labelId: "", // Added labelId
        websiteId: "",
        city: "",
        postalCode: "",
    });
    const [labels, setLabels] = useState([]); // New state for labels
    const [errors, setErrors] = useState({});
    const [editingContact, setEditingContact] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSpinner, setShowSpinner] = useState(false);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [deleting, setDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [genderFilter, setGenderFilter] = useState("");
    const [tagFilter, setTagFilter] = useState("");
    const [countryFilter, setCountryFilter] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const [isLoading, setIsLoading] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isNewLabelModalOpen, setIsNewLabelModalOpen] = useState(false); // New state for NewLabelModal
    const [exportFormat, setExportFormat] = useState("csv");
    const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

    // Sample country list (same as CreateContactModal)
    const countries = [
        { code: "KE", name: "Kenya" },
        { code: "US", name: "United States" },
        { code: "GB", name: "United Kingdom" },
        { code: "CA", name: "Canada" },
    ];

    // Fetch Contacts
    useEffect(() => {
        const fetchContacts = async () => {
            setLoading(true);
            try {
                const storedWebsite = JSON.parse(localStorage.getItem("activeWebsite"));
                const websiteId = activeWebsite?.website_id || storedWebsite?.website_id;

                if (!websiteId) {
                    notify.info("Please select a website first.");
                    return [];
                }

                const response = await axios.get(`${backend}/contacts/all-contacts/website/${websiteId}`, {
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
    }, [activeWebsite]);

    // Fetch Websites
    useEffect(() => {
        const loadWebsites = async () => {
            try {
                const data = await fetchWebsites();
                const websitesArray = data.websites || [];
                setWebsites(websitesArray);
                if (websitesArray.length > 0) {
                    setSelectedWebsite(websitesArray[0].website_id);
                    setFormData((prev) => ({ ...prev, websiteId: websitesArray[0].website_id }));
                }
            } catch (error) {
                console.error("Error fetching Websites:", error);
            }
        };
        loadWebsites();
    }, []);

    // Fetch Labels
    useEffect(() => {
        const getLabels = async () => {
            try {
                const res = await fetchLabels();
                const labelArray = Array.isArray(res) ? res : res.labels || [];
                setLabels(labelArray);
            } catch (err) {
                console.error("Failed to fetch labels:", err);
                notify.error("Failed to fetch labels.");
            }
        };
        getLabels();
    }, []);

    // Export Contacts
    const exportContacts = async (format = "csv") => {
        try {
            setIsLoading(true);
            const response = await axios.post(
                `${backend}/contacts/export-contacts/${activeWebsite.website_id}?format=${format}`,
                { contactIds: selectedContacts },
                {
                    withCredentials: true,
                    responseType: "blob",
                }
            );

            const blob = response.data;
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `contacts-${activeWebsite.website_id}.${format}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            notify.success(`Contacts exported as ${format.toUpperCase()}`);
        } catch (error) {
            notify.error("Failed to export contacts");
            console.error("Error exporting contacts:", error);
        } finally {
            setIsLoading(false);
            setExportDropdownOpen(false);
        }
    };

    // Toggle Export Dropdown
    const toggleExportDropdown = () => {
        setExportDropdownOpen((prev) => !prev);
    };

    // Filter and Sort Contacts
    useEffect(() => {
        let result = [...contacts];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (contact) =>
                    contact.first_name?.toLowerCase().includes(query) ||
                    contact.last_name?.toLowerCase().includes(query) ||
                    contact.email?.toLowerCase().includes(query)
            );
        }

        if (genderFilter) {
            result = result.filter((contact) => contact.gender === genderFilter);
        }

        if (tagFilter) {
            result = result.filter((contact) => contact.label_id === tagFilter); // Updated to label_id
        }

        if (countryFilter) {
            result = result.filter((contact) => contact.country === countryFilter);
        }

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

    // Adding New Contact
    const handleNewContactClick = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setIsContactModalOpen(true);
        }, 120);
    };

    const handleContactModalClose = () => setIsContactModalOpen(false);

    // New Label Modal Handlers
    const handleNewLabelClick = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setIsNewLabelModalOpen(true);
        }, 120);
    };

    const handleNewLabelModalClose = () => {
        setIsNewLabelModalOpen(false);
        // Refresh labels after closing NewLabelModal
        const getLabels = async () => {
            try {
                const res = await fetchLabels();
                const labelArray = Array.isArray(res) ? res : res.labels || [];
                setLabels(labelArray);
            } catch (err) {
                console.error("Failed to fetch labels:", err);
                notify.error("Failed to fetch labels.");
            }
        };
        getLabels();
    };

    const handleEdit = (contact) => {
        setEditingContact(contact);
        setFormData({
            prefix: contact.prefix || "",
            firstName: contact.first_name || "",
            lastName: contact.last_name || "",
            email: contact.email || "",
            phoneNumber: contact.phone_number || "",
            address: contact.address || "",
            country: contact.country || "",
            state: contact.state || "",
            labelId: contact.label_id || "", // Updated to label_id
            websiteId: contact.website_id || "",
            city: contact.city || "",
            postalCode: contact.postal_code || "",
        });
        setSelectedWebsite(contact.website_id || "");
        setErrors({});
    };

    // Validators
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateName = (name) => {
        if (!name) return true; // Allow empty for optional fields
        return /^[a-zA-Z\s]{1,100}$/.test(name.trim());
    };

    const validatePhoneNumber = (phoneNumber) => {
        if (!phoneNumber) return false; // Required field
        const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");
        return /^\+\d{7,15}$/.test(cleanPhone);
    };

    const validateFieldLength = (field, value, maxLength, fieldName) => {
        if (value && value.length > maxLength) {
            return `${fieldName} must be ${maxLength} characters or less.`;
        }
        return "";
    };

    const validateForm = () => {
        const newErrors = {};

        if (!validateEmail(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (!formData.firstName) {
            newErrors.firstName = "First name is required";
        } else if (!validateName(formData.firstName)) {
            newErrors.firstName = "First name must be 1-100 characters and contain only letters and spaces";
        }

        if (formData.lastName && !validateName(formData.lastName)) {
            newErrors.lastName = "Last name must be 1-100 characters and contain only letters and spaces";
        }

        if (!validatePhoneNumber(formData.phoneNumber)) {
            newErrors.phoneNumber = "Phone number is required and should contain 7-15 digits including country code";
        }

        newErrors.address = validateFieldLength("address", formData.address, 255, "Address");
        newErrors.country = validateFieldLength("country", formData.country, 100, "Country");
        newErrors.state = validateFieldLength("state", formData.state, 100, "State");
        newErrors.prefix = validateFieldLength("prefix", formData.prefix, 10, "Prefix");
        newErrors.city = validateFieldLength("city", formData.city, 100, "City");
        newErrors.postalCode = validateFieldLength("postalCode", formData.postalCode, 20, "Postal code");

        if (!selectedWebsite) {
            newErrors.websiteId = "Please select a website.";
        }

        // Remove empty errors
        Object.keys(newErrors).forEach((key) => {
            if (!newErrors[key]) delete newErrors[key];
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handlePhoneChange = (value) => {
        setFormData((prev) => ({ ...prev, phoneNumber: value || "" }));
        if (errors.phoneNumber) {
            setErrors((prev) => ({ ...prev, phoneNumber: "" }));
        }
    };

    const handleSelectWebsite = (websiteId) => {
        setSelectedWebsite(websiteId);
        setFormData((prev) => ({ ...prev, websiteId }));
        setWebsiteDropdownOpen(false);
        if (errors.websiteId) {
            setErrors((prev) => ({ ...prev, websiteId: "" }));
        }
    };

    const handleSelectPrefix = (prefix) => {
        setFormData((prev) => ({ ...prev, prefix }));
        setPrefixDropdownOpen(false);
        if (errors.prefix) {
            setErrors((prev) => ({ ...prev, prefix: "" }));
        }
    };

    const handleSelectCountry = (country) => {
        setFormData((prev) => ({ ...prev, country }));
        setCountryDropdownOpen(false);
        if (errors.country) {
            setErrors((prev) => ({ ...prev, country: "" }));
        }
    };

    const handleSelectLabel = (labelId) => {
        setFormData((prev) => ({ ...prev, labelId }));
        setLabelDropdownOpen(false);
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
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                firstName: formData.firstName,
                lastName: formData.lastName || null,
                address: formData.address || null,
                country: formData.country || null,
                state: formData.state || null,
                prefix: formData.prefix || null,
                city: formData.city || null,
                postalCode: formData.postalCode || null,
                websiteId: selectedWebsite || null,
                labelId: formData.labelId || null,
            };

            const response = await axios.patch(
                `${backend}/contacts/update-contact/${editingContact.contact_id}`,
                submitData,
                { withCredentials: true }
            );

            if (response.data.message === "No changes detected") {
                notify.info("No changes were made to the contact");
            } else {
                // Re-fetch contacts to ensure UI consistency
                const storedWebsite = JSON.parse(localStorage.getItem("activeWebsite"));
                const websiteId = activeWebsite?.website_id || storedWebsite?.website_id;
                const updatedContacts = await axios.get(`${backend}/contacts/all-contacts/website/${websiteId}`, {
                    withCredentials: true,
                });
                setContacts(updatedContacts.data);
                setFilteredContacts(updatedContacts.data);
                notify.success("Contact updated successfully");
            }

            setShowSpinner(true);
            setTimeout(() => {
                setEditingContact(null);
                setShowSpinner(false);
            }, 1500);
        } catch (error) {
            notify.error(error.response?.data?.error || "Failed to update contact");
            console.error("Error updating contact:", error.response?.data || error);
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

        if (!window.confirm(`Are you sure you want to delete ${selectedContacts.length} contact(s)?`)) return;

        try {
            setDeleting(true);
            const res = await axios.delete(`${backend}/contacts/delete/multiple`, {
                data: { ids: selectedContacts },
                withCredentials: true,
            });

            setContacts((prev) => prev.filter((c) => !selectedContacts.includes(c.contact_id)));
            setFilteredContacts((prev) => prev.filter((c) => !selectedContacts.includes(c.contact_id)));
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
                className={`w-4 h-4 inline ml-1 transform transition-transform ${sortConfig.direction === "asc" ? "rotate-0" : "rotate-180"}`}
            />
        );
    };

    const uniqueGenders = [...new Set(contacts.map((c) => c.gender).filter(Boolean))];
    const uniqueLabels = [...new Set(contacts.map((c) => c.label_id).filter(Boolean))]; // Updated to label_id
    const uniqueCountries = [...new Set(contacts.map((c) => c.country).filter(Boolean))];

    const handleClearFilters = () => {
        setSearchQuery("");
        setGenderFilter("");
        setTagFilter("");
        setCountryFilter("");
        setSortConfig({ key: null, direction: null });
    };

    const inputStyles = `w-full px-4 py-3 rounded-xs border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white text-base font-medium placeholder-gray-400 transition duration-200`;

    return (
        <>
            <CreateContactModal
                isOpen={isContactModalOpen}
                onClose={handleContactModalClose}
                onSuccess={() => {
                    const storedWebsite = JSON.parse(localStorage.getItem("activeWebsite"));
                    const websiteId = activeWebsite?.website_id || storedWebsite?.website_id;
                    const fetchContacts = async () => {
                        try {
                            const response = await axios.get(`${backend}/contacts/all-contacts/website/${websiteId}`, {
                                withCredentials: true,
                            });
                            setContacts(response.data);
                            setFilteredContacts(response.data);
                        } catch (error) {
                            notify.error("Failed to fetch contacts");
                            console.error("Error fetching contacts:", error);
                        }
                    };
                    fetchContacts();
                }}
            />
            <NewLabelModal isOpen={isNewLabelModalOpen} onClose={handleNewLabelModalClose} onSuccess={() => { }} />
            <div className="flex h-screen bg-blue-50">
                {/* Sidebar */}
                <Sidebar />
                <div className="flex-1 flex flex-col">
                    <Label />

                    <div className="flex-1 overflow-y-auto p-6 transition-all duration-300 mt-6">
                        {/* Search and Filters */}
                        <div className="max-w-8xl mx-auto px-6 mb-6">
                            <div className="flex items-center justify-end gap-4 w-full">
                                {/* Search Bar */}
                                <div className="relative w-1/3">
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full border border-gray-300 rounded-sm pl-10 pr-4 py-2 text-base text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
                                    />
                                    <svg
                                        className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                </div>

                                {/* Unified Filter Dropdown */}
                                <div className="relative">
                                    <select
                                        value={
                                            genderFilter
                                                ? `gender-${genderFilter}`
                                                : tagFilter
                                                    ? `label-${tagFilter}`
                                                    : countryFilter
                                                        ? `country-${countryFilter}`
                                                        : ""
                                        }
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value.startsWith("gender-")) {
                                                setGenderFilter(value.replace("gender-", ""));
                                                setTagFilter("");
                                                setCountryFilter("");
                                            } else if (value.startsWith("label-")) {
                                                setTagFilter(value.replace("label-", ""));
                                                setGenderFilter("");
                                                setCountryFilter("");
                                            } else if (value.startsWith("country-")) {
                                                setCountryFilter(value.replace("country-", ""));
                                                setGenderFilter("");
                                                setTagFilter("");
                                            } else {
                                                setGenderFilter("");
                                                setTagFilter("");
                                                setCountryFilter("");
                                            }
                                        }}
                                        className="appearance-none border border-gray-300 rounded-sm px-3 pr-8 py-2 text-base text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                                    >
                                        <option value="">All Filters</option>

                                        {/* Gender Options */}
                                        <optgroup label="Gender">
                                            {uniqueGenders.map((gender) => (
                                                <option key={gender} value={`gender-${gender}`}>
                                                    {gender}
                                                </option>
                                            ))}
                                        </optgroup>

                                        {/* Label Options */}
                                        <optgroup label="Label">
                                            {labels
                                                .filter((label) => uniqueLabels.includes(label.label_id))
                                                .map((label) => (
                                                    <option key={label.label_id} value={`label-${label.label_id}`}>
                                                        {label.name}
                                                    </option>
                                                ))}
                                        </optgroup>

                                        {/* Country Options */}
                                        <optgroup label="Country">
                                            {uniqueCountries.map((country) => (
                                                <option key={country} value={`country-${country}`}>
                                                    {country}
                                                </option>
                                            ))}
                                        </optgroup>
                                    </select>

                                    <svg
                                        className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </div>

                                {/* Clear All Button */}
                                {(searchQuery || genderFilter || tagFilter || countryFilter) && (
                                    <button
                                        onClick={handleClearFilters}
                                        className="px-4 py-2 rounded-sm bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 flex items-center gap-1.5 text-base font-medium transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>


                        {/* Contacts Table */}
                        <div className="max-w-8xl mx-auto px-6">
                            <div className="bg-white rounded-sm border border-blue-200">
                                <div className="bg-blue-100 px-6 py-3 rounded-t-sm flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-[#061338]">
                                        All Contacts ({filteredContacts.length})
                                    </h2>
                                    <div className="flex items-center space-x-4">
                                        {selectedContacts.length > 0 && (
                                            <>
                                                <p className="text-sm text-slate-600">{selectedContacts.length} selected</p>
                                                <button
                                                    onClick={handleBulkDelete}
                                                    disabled={deleting}
                                                    className={`px-4 py-2 rounded-sm font-semibold text-white transition ${deleting ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                                                        }`}
                                                >
                                                    {deleting ? "Deleting..." : "Delete Selected"}
                                                </button>
                                                <div className="relative">
                                                    <button
                                                        onClick={toggleExportDropdown}
                                                        disabled={isLoading}
                                                        className={`px-4 py-2 rounded-sm font-semibold text-white transition ${isLoading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                                                            }`}
                                                    >
                                                        {isLoading ? (
                                                            <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                                                        ) : null}
                                                        Export Contacts
                                                    </button>
                                                    {exportDropdownOpen && (
                                                        <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-sm shadow-lg z-10">
                                                            <button
                                                                onClick={() => exportContacts("csv")}
                                                                className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50"
                                                            >
                                                                Export as CSV
                                                            </button>
                                                            <button
                                                                onClick={() => exportContacts("pdf")}
                                                                className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50"
                                                            >
                                                                Export as PDF
                                                            </button>
                                                            <button
                                                                onClick={() => exportContacts("txt")}
                                                                className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50"
                                                            >
                                                                Export as TXT
                                                            </button>
                                                            <button
                                                                onClick={() => exportContacts("xlsx")}
                                                                className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50"
                                                            >
                                                                Export as an Excel
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                        <button
                                            onClick={handleNewContactClick}
                                            className="px-4 py-2 cursor-pointer rounded-sm bg-blue-600 text-white font-semibold hover:bg-blue-700"
                                        >
                                            + New Contact
                                        </button>

                                    </div>
                                </div>

                                <div className="p-8">
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
                                            <div className="flex justify-center gap-4">
                                                <button
                                                    onClick={handleNewContactClick}
                                                    className="px-4 py-3 rounded-sm bg-blue-600 font-bold text-white cursor-pointer hover:bg-blue-700"
                                                >
                                                    + New Contact
                                                </button>
                                                <Link
                                                    to="/import-contacts"
                                                    className="px-4 py-3 rounded-sm bg-white border border-blue-500 font-bold text-blue-600 cursor-pointer hover:bg-blue-100"
                                                >
                                                    - Import Contacts
                                                </Link>
                                            </div>


                                        </div>
                                    ) : (
                                        <div className="max-h-[500px] overflow-y-auto border border-gray-200 rounded-sm">
                                            <table className="w-full text-sm text-slate-700 min-w-[1100px]">
                                                <thead>
                                                    <tr className="bg-blue-50 sticky top-0">
                                                        <th className="px-4 py-3 border-b border-gray-200">
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
                                                            className="px-4 py-3 text-left font-semibold text-slate-700 cursor-pointer border-b border-gray-200 hover:bg-blue-100 transition-colors"
                                                            onClick={() => handleSort("first_name")}
                                                        >
                                                            <div className="flex items-center gap-1">
                                                                First Name {getSortIcon("first_name")}
                                                            </div>
                                                        </th>
                                                        <th
                                                            className="px-4 py-3 text-left font-semibold text-slate-700 cursor-pointer border-b border-gray-200 hover:bg-blue-100 transition-colors"
                                                            onClick={() => handleSort("last_name")}
                                                        >
                                                            <div className="flex items-center gap-1">
                                                                Last Name {getSortIcon("last_name")}
                                                            </div>
                                                        </th>
                                                        <th
                                                            className="px-4 py-3 text-left font-semibold text-slate-700 cursor-pointer border-b border-gray-200 hover:bg-blue-100 transition-colors"
                                                            onClick={() => handleSort("email")}
                                                        >
                                                            <div className="flex items-center gap-1">
                                                                Email {getSortIcon("email")}
                                                            </div>
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-gray-200">
                                                            Phone
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-gray-200">
                                                            Gender
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-gray-200">
                                                            Address
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-gray-200">
                                                            Country
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-gray-200">
                                                            State
                                                        </th>
                                                        <th
                                                            className="px-4 py-3 text-left font-semibold text-slate-700 cursor-pointer border-b border-gray-200 hover:bg-blue-100 transition-colors"
                                                            onClick={() => handleSort("created_at")}
                                                        >
                                                            <div className="flex items-center gap-1">
                                                                Created {getSortIcon("created_at")}
                                                            </div>
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b border-gray-200">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredContacts.slice(0, 10).map((contact) => (
                                                        <tr
                                                            key={contact.contact_id}
                                                            className={`border-b border-slate-100 hover:bg-slate-50 transition duration-200 ${selectedContacts.includes(contact.contact_id) ? "bg-blue-50" : ""
                                                                }`}
                                                        >
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedContacts.includes(contact.contact_id)}
                                                                    onChange={() => handleSelect(contact.contact_id)}
                                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3">{contact.first_name || "NA"}</td>
                                                            <td className="px-4 py-3">{contact.last_name || "NA"}</td>
                                                            <td className="px-4 py-3">
                                                                <a
                                                                    href={`mailto:${contact.email}`}
                                                                    className="text-blue-600 hover:text-blue-700 hover:underline"
                                                                >
                                                                    {contact.email}
                                                                </a>
                                                            </td>
                                                            <td className="px-4 py-3">
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
                                                            <td className="px-4 py-3">{contact.gender || "NA"}</td>
                                                            <td className="px-4 py-3">{contact.address || "NA"}</td>
                                                            <td className="px-4 py-3">{contact.country || "NA"}</td>
                                                            <td className="px-4 py-3">{contact.state || "NA"}</td>
                                                            <td className="px-4 py-3">{formatDate(contact.created_at)}</td>
                                                            <td className="px-4 py-3">
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

                        {/* Modal for Updating */}
                        {editingContact && (
                            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-white-50 bg-opacity-30 backdrop-blur-sm">
                                <div className="relative bg-white rounded-xs border border-blue-200 w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto shadow-md">
                                    <div className="bg-blue-100 px-6 py-3 rounded-t-xs flex justify-between items-center">
                                        <h2 className="text-lg font-bold text-[#061338]">Update Contact</h2>
                                        <button onClick={() => setEditingContact(null)} className="text-gray-500 hover:text-gray-700">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="p-8">
                                        <form onSubmit={handleUpdate} className="space-y-6">
                                            {/* Prefix + First + Last Name */}
                                            <div className="grid grid-cols-12 gap-4">
                                                <div className="col-span-2">
                                                    <label className="block text-xs font-semibold text-slate-700 mb-2">Prefix</label>
                                                    <div className="relative">
                                                        <button
                                                            type="button"
                                                            onClick={() => setPrefixDropdownOpen(!prefixDropdownOpen)}
                                                            className={`${inputStyles} flex justify-between items-center text-left w-full`}
                                                        >
                                                            {formData.prefix || "Select"}
                                                            <ChevronDown
                                                                className={`text-slate-500 transition-transform duration-300 ${prefixDropdownOpen ? "rotate-180" : "rotate-0"
                                                                    }`}
                                                                size={18}
                                                            />
                                                        </button>
                                                        {prefixDropdownOpen && (
                                                            <div className="absolute z-10 w-full mt-1 bg-white border border-blue-300 rounded-xs shadow-lg">
                                                                {["Mr", "Mrs", "Ms", "Dr"].map((prefix) => (
                                                                    <div
                                                                        key={prefix}
                                                                        onClick={() => handleSelectPrefix(prefix)}
                                                                        className="px-4 py-2 text-base font-medium text-slate-700 hover:bg-blue-50 cursor-pointer"
                                                                    >
                                                                        {prefix}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {errors.prefix && <p className="mt-1 text-xs text-red-500">{errors.prefix}</p>}
                                                </div>

                                                <div className="col-span-5">
                                                    <label htmlFor="firstName" className="block text-xs font-semibold text-slate-700 mb-2">
                                                        First Name <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="firstName"
                                                        name="firstName"
                                                        value={formData.firstName}
                                                        onChange={handleInputChange}
                                                        required
                                                        className={`${inputStyles} ${errors.firstName ? "border-red-300 focus:ring-red-500" : ""}`}
                                                        placeholder="Enter first name"
                                                    />
                                                    {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
                                                </div>

                                                <div className="col-span-5">
                                                    <label htmlFor="lastName" className="block text-xs font-semibold text-slate-700 mb-2">
                                                        Last Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="lastName"
                                                        name="lastName"
                                                        value={formData.lastName}
                                                        onChange={handleInputChange}
                                                        className={`${inputStyles} ${errors.lastName ? "border-red-300 focus:ring-red-500" : ""}`}
                                                        placeholder="Enter last name"
                                                    />
                                                    {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
                                                </div>
                                            </div>

                                            {/* Email and Phone Number */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                <div>
                                                    <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-2">
                                                        Email <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="email"
                                                        id="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        required
                                                        className={`${inputStyles} w-full h-10 ${errors.email ? "border-red-300 focus:ring-red-500" : ""}`}
                                                        placeholder="Enter email address"
                                                    />
                                                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                                                </div>

                                                <div>
                                                    <label htmlFor="phoneNumber" className="block text-xs font-semibold text-slate-700 mb-2">
                                                        Phone Number <span className="text-red-500">*</span>
                                                    </label>
                                                    <PhoneInputWithCountrySelect
                                                        international
                                                        countryCallingCodeEditable={false}
                                                        defaultCountry="KE"
                                                        value={formData.phoneNumber}
                                                        onChange={handlePhoneChange}
                                                        className={`${inputStyles} w-full h-10 ${errors.phoneNumber ? "border-red-300 focus-within:ring-red-500" : ""
                                                            }`}
                                                        placeholder="Enter phone number"
                                                    />
                                                    {errors.phoneNumber && <p className="mt-1 text-xs text-red-500">{errors.phoneNumber}</p>}
                                                </div>
                                            </div>

                                            {/* Address and State */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                <div>
                                                    <label htmlFor="address" className="block text-xs font-semibold text-slate-700 mb-2">
                                                        Address
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="address"
                                                        name="address"
                                                        value={formData.address}
                                                        onChange={handleInputChange}
                                                        className={`${inputStyles} ${errors.address ? "border-red-300 focus:ring-red-500" : ""}`}
                                                        placeholder="123 Main Street, Apt 4B"
                                                    />
                                                    {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                                                </div>

                                                <div>
                                                    <label htmlFor="state" className="block text-xs font-semibold text-slate-700 mb-2">
                                                        State
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="state"
                                                        name="state"
                                                        value={formData.state}
                                                        onChange={handleInputChange}
                                                        className={`${inputStyles} ${errors.state ? "border-red-300 focus:ring-red-500" : ""}`}
                                                        placeholder="Nairobi / California / Ontario"
                                                    />
                                                    {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
                                                </div>
                                            </div>

                                            {/* Country, City, and Postal Code */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 mb-2">Country</label>
                                                    <div className="relative">
                                                        <button
                                                            type="button"
                                                            onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                                                            className={`${inputStyles} flex justify-between items-center text-left`}
                                                        >
                                                            {formData.country || "Select Country"}
                                                            <ChevronDown
                                                                className={`text-slate-500 transition-transform duration-300 ${countryDropdownOpen ? "rotate-180" : "rotate-0"
                                                                    }`}
                                                                size={18}
                                                            />
                                                        </button>
                                                        {countryDropdownOpen && (
                                                            <div className="absolute z-10 w-full mt-1 bg-white border border-blue-300 rounded-xs shadow-lg max-h-60 overflow-y-auto">
                                                                {countries.map((country) => (
                                                                    <div
                                                                        key={country.code}
                                                                        onClick={() => handleSelectCountry(country.name)}
                                                                        className="px-4 py-2 text-base font-medium text-slate-700 hover:bg-blue-50 cursor-pointer"
                                                                    >
                                                                        {country.name}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {errors.country && <p className="mt-1 text-xs text-red-500">{errors.country}</p>}
                                                </div>

                                                <div>
                                                    <label htmlFor="city" className="block text-xs font-semibold text-slate-700 mb-2">
                                                        City
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="city"
                                                        name="city"
                                                        value={formData.city}
                                                        onChange={handleInputChange}
                                                        className={`${inputStyles} ${errors.city ? "border-red-300 focus:ring-red-500" : ""}`}
                                                        placeholder="Enter city"
                                                    />
                                                    {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
                                                </div>

                                                <div>
                                                    <label htmlFor="postalCode" className="block text-xs font-semibold text-slate-700 mb-2">
                                                        Postal Code
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="postalCode"
                                                        name="postalCode"
                                                        value={formData.postalCode}
                                                        onChange={handleInputChange}
                                                        className={`${inputStyles} ${errors.postalCode ? "border-red-300 focus:ring-red-500" : ""}`}
                                                        placeholder="Enter postal code"
                                                    />
                                                    {errors.postalCode && <p className="mt-1 text-xs text-red-500">{errors.postalCode}</p>}
                                                </div>
                                            </div>

                                            {/* Website and Label */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                                                        Website <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <button
                                                            type="button"
                                                            onClick={() => setWebsiteDropdownOpen(!websiteDropdownOpen)}
                                                            className={`${inputStyles} flex justify-between items-center text-left`}
                                                        >
                                                            {websites.find((w) => w.website_id === selectedWebsite)?.company_name ||
                                                                websites.find((w) => w.website_id === selectedWebsite)?.domain ||
                                                                "Select Website"}
                                                            <ChevronDown
                                                                className={`text-slate-500 transition-transform duration-300 ${websiteDropdownOpen ? "rotate-180" : "rotate-0"
                                                                    }`}
                                                                size={18}
                                                            />
                                                        </button>
                                                        {websiteDropdownOpen && (
                                                            <div className="absolute z-10 w-full mt-1 bg-white border border-blue-300 rounded-xs shadow-lg max-h-60 overflow-y-auto">
                                                                {websites.length > 0 ? (
                                                                    websites.map((website) => (
                                                                        <div
                                                                            key={website.website_id}
                                                                            onClick={() => handleSelectWebsite(website.website_id)}
                                                                            className="px-4 py-2 text-base font-medium text-slate-700 hover:bg-blue-50 cursor-pointer"
                                                                        >
                                                                            {website.company_name || website.domain}
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="px-4 py-2 text-base text-gray-500">No websites available</div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {errors.websiteId && <p className="mt-1 text-xs text-red-500">{errors.websiteId}</p>}
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 mb-2">Label</label>
                                                    <div className="relative">
                                                        <button
                                                            type="button"
                                                            onClick={() => setLabelDropdownOpen(!labelDropdownOpen)}
                                                            className={`${inputStyles} flex justify-between items-center text-left`}
                                                        >
                                                            {labels.find((label) => label.label_id === formData.labelId)?.name || "Select Label"}
                                                            <ChevronDown
                                                                className={`text-slate-500 transition-transform duration-300 ${labelDropdownOpen ? "rotate-180" : "rotate-0"
                                                                    }`}
                                                                size={18}
                                                            />
                                                        </button>
                                                        {labelDropdownOpen && (
                                                            <div className="absolute z-10 w-full mt-1 bg-white border border-blue-300 rounded-xs shadow-lg max-h-60 overflow-y-auto">
                                                                {labels.length === 0 ? (
                                                                    <div className="px-4 py-2 text-base font-medium text-slate-500">
                                                                        No labels available
                                                                    </div>
                                                                ) : (
                                                                    labels.map((label) => (
                                                                        <div
                                                                            key={label.label_id}
                                                                            onClick={() => handleSelectLabel(label.label_id)}
                                                                            className="px-4 py-2 text-base font-medium text-slate-700 hover:bg-blue-50 cursor-pointer flex items-center gap-2"
                                                                        >
                                                                            <div
                                                                                className="w-4 h-4 rounded-full"
                                                                                style={{ backgroundColor: label.color }}
                                                                            />
                                                                            {label.name}
                                                                        </div>
                                                                    ))
                                                                )}
                                                                <div
                                                                    onClick={handleNewLabelClick}
                                                                    className="px-4 py-2 text-base font-medium text-blue-600 hover:bg-blue-50 cursor-pointer flex items-center gap-2"
                                                                >
                                                                    <Tags size={16} /> New Label
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-3 mt-6">
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className={`px-4 py-3 rounded-xs cursor-pointer bg-blue-600 text-white text-base font-semibold flex items-center gap-2 hover:bg-blue-700 ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                                                        }`}
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            Updating...
                                                        </>
                                                    ) : (
                                                        "Update Contact"
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Contacts;