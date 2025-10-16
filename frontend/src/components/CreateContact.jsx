import { Tags, Loader2, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { backend } from "../server";
import { notify } from "../utils/toast";
import Spinner from "./Spinner";
import { useNavigate } from "react-router-dom";
import { fetchLabels } from "../utils/labels";
import PhoneInputWithCountrySelect from "react-phone-number-input";
import { useWebsite } from "../context/WebsiteContext";
import NewLabelModal from "./NewLabel";
import "react-phone-number-input/style.css";
import "./CustomPhoneInput.css";

function CreateContactModal({ isOpen, onClose, onSuccess }) {
    const navigate = useNavigate();
    const { activeWebsite } = useWebsite();
    const [prefixDropdownOpen, setPrefixDropdownOpen] = useState(false);
    const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
    const [labelDropdownOpen, setLabelDropdownOpen] = useState(false);
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
        labelId: "",
        websiteId: "",
        city: "",
        postalCode: "",
    });
    const [labels, setLabels] = useState([]);
    const [isNewLabelModalOpen, setIsNewLabelModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Adding New Label
    const handleNewLabelClick = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setIsNewLabelModalOpen(true);
        }, 120);
    };

    const handleNewLabelModalClose = () => {
        setIsNewLabelModalOpen(false);
        getLabels();
    };

    // Fetch Labels
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

    useEffect(() => {
        getLabels();
    }, []);

    // Sample country list
    const countries = [
        { code: "KE", name: "Kenya" },
        { code: "US", name: "United States" },
        { code: "GB", name: "United Kingdom" },
        { code: "CA", name: "Canada" },
    ];

    // Validators
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateFieldLength = (field, value, maxLength, fieldName) => {
        if (value && value.length > maxLength) {
            return `${fieldName} must be ${maxLength} characters or less.`;
        }
        return "";
    };

    // Handlers
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

    const handleSelectPrefix = (prefix) => {
        setFormData((prev) => ({ ...prev, prefix }));
        setPrefixDropdownOpen(false);
    };

    const handleSelectCountry = (country) => {
        setFormData((prev) => ({ ...prev, country }));
        setCountryDropdownOpen(false);
    };

    const handleSelectLabel = (labelId) => {
        setFormData((prev) => ({ ...prev, labelId }));
        setLabelDropdownOpen(false);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!validateEmail(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }


        newErrors.address = validateFieldLength("address", formData.address, 255, "Address");
        newErrors.country = validateFieldLength("country", formData.country, 100, "Country");
        newErrors.state = validateFieldLength("state", formData.state, 100, "State");
        newErrors.prefix = validateFieldLength("prefix", formData.prefix, 10, "Prefix");
        newErrors.city = validateFieldLength("city", formData.city, 100, "City");
        newErrors.postalCode = validateFieldLength("postalCode", formData.postalCode, 20, "Postal code");

        if (!activeWebsite) {
            newErrors.websiteId = "No active website selected — please refresh or relogin.";
        }

        // Remove empty errors
        Object.keys(newErrors).forEach((key) => {
            if (!newErrors[key]) delete newErrors[key];
        });

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
            const payload = {
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
                websiteId: activeWebsite?.website_id || null,
                labelId: formData.labelId || null,
            };

            await axios.post(`${backend}/contacts/create-contact`, payload, {
                withCredentials: true,
            });

            notify.success("Contact created successfully");

            setFormData({
                prefix: "",
                firstName: "",
                lastName: "",
                email: "",
                phoneNumber: "",
                address: "",
                country: "",
                state: "",
                labelId: "",
                websiteId: "",
                city: "",
                postalCode: "",
            });
            setErrors({});
            setShowSpinner(true);

            if (onSuccess) onSuccess();
            setTimeout(() => {
                setShowSpinner(false);
                onClose();
                navigate("/contacts");
            }, 1500);
        } catch (error) {
            const backendMessage = error.response?.data?.error;
            notify.error(backendMessage || "Failed to create contact");
            console.error("Error creating contact:", error);
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

    const inputStyles = `w-full px-4 py-3 rounded-xs border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white text-base font-medium placeholder-gray-400 transition duration-200`;

    return (
        <>
            <NewLabelModal isOpen={isNewLabelModalOpen} onClose={handleNewLabelModalClose} onSuccess={getLabels} />
            <div className="fixed inset-0 flex items-center justify-center z-[10000] bg-white-50 bg-opacity-30 backdrop-blur-sm">
                <div className="relative bg-white rounded-xs border border-blue-200 w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto shadow-md">
                    {showSpinner && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-[10001]">
                            <Spinner />
                        </div>
                    )}
                    <div className="bg-blue-100 px-6 py-3 rounded-t-xs flex justify-between items-center">
                        <h2 className="text-lg font-bold text-[#061338]">New Contact</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Prefix + First + Last Name */}
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                                        Prefix
                                    </label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setPrefixDropdownOpen(!prefixDropdownOpen)}
                                            className={`${inputStyles} flex justify-between items-center text-left w-full`}
                                        >
                                            {formData.prefix || "Select"}
                                            <ChevronDown
                                                className={`text-slate-500 transition-transform duration-300 ${prefixDropdownOpen ? "rotate-180" : "rotate-0"}`}
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
                                        className={`${inputStyles} w-full h-10 ${errors.phoneNumber ? "border-red-300 focus-within:ring-red-500" : ""}`}
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
                                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                                        Country
                                    </label>
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

                            {/* Label */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                                        Label
                                    </label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setLabelDropdownOpen(!labelDropdownOpen)}
                                            className={`${inputStyles} flex justify-between items-center text-left`}
                                        >
                                            {labels.find((label) => label.label_id === formData.labelId)?.name || "Select Label"}
                                            <ChevronDown
                                                className={`text-slate-500 transition-transform duration-300 ${labelDropdownOpen ? "rotate-180" : "rotate-0"}`}
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
                                    className={`px-4 py-3 rounded-xs cursor-pointer bg-blue-600 text-white text-base font-semibold flex items-center gap-2 hover:bg-blue-700 ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Contact"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

export default CreateContactModal;