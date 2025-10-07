import { Plus, X, Loader2, Upload, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { backend } from "../server";
import { notify } from "../utils/toast";
import Spinner from "./Spinner";
import { useNavigate } from "react-router-dom";
import PhoneInputWithCountrySelect from "react-phone-number-input";
import { fetchWebsites } from "../utils/websites";
import "react-phone-number-input/style.css";
import "./CustomPhoneInput.css";

function CreateContactModal({ isOpen, onClose, onSuccess }) {
    const [websites, setWebsites] = useState([]);
    const [selectedWebsite, setSelectedWebsite] = useState("");
    const [websiteDropdownOpen, setWebsiteDropdownOpen] = useState(false);
    const [prefixDropdownOpen, setPrefixDropdownOpen] = useState(false);
    const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
    const [errors, setErrors] = useState({});
    const [showSpinner, setShowSpinner] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        prefix: "",
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        address: "",
        country: "",
        state: "",
        tag: "",
        websiteId: "",
        city: "",
        postalCode: "",
    });

    // Sample country list (replace with a comprehensive list or library)
    const countries = [
        { code: "KE", name: "Kenya" },
        { code: "US", name: "United States" },
        { code: "GB", name: "United Kingdom" },
        { code: "CA", name: "Canada" },
    ];

    // Fetch websites
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

    const navigate = useNavigate();

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateName = (name) => {
        const nameRegex = /^[a-zA-Z\s]{2,50}$/;
        return nameRegex.test(name.trim());
    };

    const validatePhoneNumber = (phoneNumber) => {
        if (!phoneNumber) return true; // Allow empty phone number
        const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");
        return /^\+\d{7,15}$/.test(cleanPhone);
    };

    const handlePhoneChange = (value) => {
        setFormData((prev) => ({ ...prev, phoneNumber: value || "" }));
        if (errors.phoneNumber) {
            setErrors((prev) => ({ ...prev, phoneNumber: "" }));
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleSelectWebsite = (websiteId) => {
        setSelectedWebsite(websiteId);
        setFormData((prev) => ({ ...prev, websiteId }));
        setWebsiteDropdownOpen(false);
    };

    const handleSelectPrefix = (prefix) => {
        setFormData((prev) => ({ ...prev, prefix }));
        setPrefixDropdownOpen(false);
    };

    const handleSelectCountry = (country) => {
        setFormData((prev) => ({ ...prev, country }));
        setCountryDropdownOpen(false);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!validateName(formData.firstName)) {
            newErrors.firstName = "Name must be 2-50 characters and contain only letters and spaces";
        }

        if (!validateName(formData.lastName)) {
            newErrors.lastName = "Name must be 2-50 characters and contain only letters and spaces";
        }

        if (!validateEmail(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
            newErrors.phoneNumber = "Phone number should contain only digits (7-15 characters including country code)";
        }

        if (!formData.tag) {
            newErrors.tag = "Tag is required";
        }

        if (!formData.websiteId) {
            newErrors.websiteId = "Please select a website";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const response = await axios.post(
                `${backend}/contacts/create-contact`,
                formData,
                { withCredentials: true }
            );

            notify.success("Contact created successfully");
            setFormData({
                prefix: "",
                firstName: "",
                lastName: "",
                email: "",
                phoneNumber: "",
                websiteId: "",
                address: "",
                country: "",
                city: "",
                postalCode: "",
                state: "",
                tag: "",
            });
            setErrors({});
            setShowSpinner(true);
            setTimeout(() => {
                navigate("/contacts");
            }, 2000);
        } catch (error) {
            const backendMessage = error.response?.data?.error;
            if (backendMessage) {
                notify.error(backendMessage);
            } else {
                notify.error("Failed to create contact");
            }
            console.error("Error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    // Consistent input styles
    const inputStyles = `w-full px-4 py-3 rounded-xs border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white text-base font-medium placeholder-gray-400 transition duration-200`;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[10000] bg-white-50 bg-opacity-30 backdrop-blur-sm">
            {showSpinner && <Spinner />}
            <div className="bg-white rounded-xs border border-blue-200 w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto shadow-md">
                {/* Header */}
                <div className="bg-blue-100 px-6 py-3 rounded-t-xs flex justify-between items-center">
                    <h2 className="text-lg font-bold text-[#061338]">New Contact</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Create Contact Form */}
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Website Selector */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-2">
                                    Select Website <span className="text-red-500">*</span>
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
                                            className={`text-slate-500 transition-transform duration-300 ${websiteDropdownOpen ? "rotate-180" : "rotate-0"}`}
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

                            {/* Prefix Dropdown */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-2">Prefix  <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setPrefixDropdownOpen(!prefixDropdownOpen)}
                                        className={`${inputStyles} flex justify-between items-center text-left`}
                                    >
                                        {formData.prefix || "Select Prefix"}
                                        <ChevronDown
                                            className={`text-slate-500 transition-transform duration-300 ${prefixDropdownOpen ? "rotate-180" : "rotate-0"}`}
                                            size={18}
                                        />
                                    </button>
                                    {prefixDropdownOpen && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-blue-300 rounded-xs shadow-lg">
                                            {["Mr", "Mrs"].map((prefix) => (
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
                            </div>

                            {/* First Name */}
                            <div>
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

                            {/* Last Name */}
                            <div>
                                <label htmlFor="lastName" className="block text-xs font-semibold text-slate-700 mb-2">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    required
                                    className={`${inputStyles} ${errors.lastName ? "border-red-300 focus:ring-red-500" : ""}`}
                                    placeholder="Enter last name"
                                />
                                {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
                            </div>

                            {/* Email */}
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
                                    className={`${inputStyles} ${errors.email ? "border-red-300 focus:ring-red-500" : ""}`}
                                    placeholder="Enter email address"
                                />
                                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label htmlFor="phoneNumber" className="block text-xs font-semibold text-slate-700 mb-2">
                                    Phone Number  <span className="text-red-500">*</span>
                                </label>
                                <PhoneInputWithCountrySelect
                                    international
                                    countryCallingCodeEditable={false}
                                    defaultCountry="KE"
                                    value={formData.phoneNumber}
                                    onChange={handlePhoneChange}
                                    className={`${inputStyles} ${errors.phoneNumber ? "border-red-300 focus-within:ring-red-500" : ""}`}
                                    placeholder="Enter phone number"
                                />
                                {errors.phoneNumber && <p className="mt-1 text-xs text-red-500">{errors.phoneNumber}</p>}
                            </div>

                            {/* Address */}
                            <div>
                                <label htmlFor="address" className="block text-xs font-semibold text-slate-700 mb-2">
                                    Address  <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className={inputStyles}
                                    placeholder="123 Main Street, Apt 4B"
                                />
                            </div>

                            {/* State */}
                            <div>
                                <label htmlFor="state" className="block text-xs font-semibold text-slate-700 mb-2">
                                    State / Province  <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="state"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    className={inputStyles}
                                    placeholder="Nairobi / California / Ontario"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            {/* Country Dropdown */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-2">Country  <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                                        className={`${inputStyles} flex justify-between items-center text-left`}
                                    >
                                        {formData.country || "Select Country"}
                                        <ChevronDown
                                            className={`text-slate-500 transition-transform duration-300 ${countryDropdownOpen ? "rotate-180" : "rotate-0"}`}
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
                            </div>

                            {/* City */}
                            <div>
                                <label htmlFor="city" className="block text-xs font-semibold text-slate-700 mb-2">
                                    City  <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="city"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    className={inputStyles}
                                    placeholder="Enter city"
                                />
                            </div>

                            {/* Tag */}
                            <div>
                                <label htmlFor="tag" className="block text-xs font-semibold text-slate-700 mb-2">
                                    Tag
                                </label>
                                <input
                                    type="text"
                                    id="tag"
                                    name="tag"
                                    value={formData.tag}
                                    onChange={handleInputChange}
                                    required
                                    className={`${inputStyles} ${errors.tag ? "border-red-300 focus:ring-red-500" : ""}`}
                                    placeholder="e.g New client, Returning Client"
                                />
                                {errors.tag && <p className="mt-1 text-xs text-red-500">{errors.tag}</p>}
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
                                        Creating...
                                    </>
                                ) : (
                                    "Create contact"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CreateContactModal;