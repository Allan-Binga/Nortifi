import { Plus, X, Loader2, Upload, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { backend } from "../server";
import { notify } from "../utils/toast";
import Spinner from "./Spinner";
import { useNavigate } from "react-router-dom";
import PhoneInputWithCountrySelect from "react-phone-number-input";
import "react-phone-number-input/style.css"; 
import "./CustomPhoneInput.css";

function CreateContactModal({ isOpen, onClose, onSuccess }) {
    const [errors, setErrors] = useState({});
    const [showSpinner, setShowSpinner] = useState(false);
    const [isGenderOpen, setIsGenderOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        website: "",
        address: "",
        country: "",
        state: "",
        gender: "",
        tag: "",
    });

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
        return /^\+\d{7,15}$/.test(cleanPhone); // Include country code
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

    const validateForm = () => {
        const newErrors = {};

        if (!validateName(formData.firstName)) {
            newErrors.firstName =
                "Name must be 2-50 characters and contain only letters and spaces";
        }

        if (!validateName(formData.lastName)) {
            newErrors.lastName =
                "Name must be 2-50 characters and contain only letters and spaces";
        }

        if (!validateEmail(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
            newErrors.phoneNumber =
                "Phone number should contain only digits (7-15 characters including country code)";
        }

        if (!formData.tag) {
            newErrors.tag = "Tag is required";
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

            // Reset form
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phoneNumber: "",
                website: "",
                address: "",
                country: "",
                state: "",
                gender: "",
                tag: "",
            });
            setErrors({});

            setShowSpinner(true);
            setTimeout(() => {
                onSuccess();
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

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[10000] bg-white-50 bg-opacity-30 backdrop-blur-sm">
            <div className="bg-white rounded-sm border border-blue-200 w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto shadow-md">
                {/* Header */}
                <div className="bg-blue-100 px-6 py-3 rounded-t-md flex justify-between items-center">
                    <h2 className="text-lg font-bold text-[#061338]">Create Your Contact</h2>
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
                                    className={`w-full px-4 py-3 rounded-sm border ${errors.firstName
                                            ? "border-red-300 focus:ring-2 focus:ring-red-500"
                                            : "border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        }`}
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
                                    className={`w-full px-4 py-3 rounded-sm border ${errors.lastName
                                            ? "border-red-300 focus:ring-2 focus:ring-red-500"
                                            : "border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        }`}
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
                                    className={`w-full px-4 py-3 rounded-sm border ${errors.email
                                            ? "border-red-300 focus:ring-2 focus:ring-red-500"
                                            : "border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        }`}
                                    placeholder="Enter email address"
                                />
                                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label htmlFor="phoneNumber" className="block text-xs font-semibold text-slate-700 mb-2">
                                    Phone Number
                                </label>
                                <PhoneInputWithCountrySelect
                                    international
                                    countryCallingCodeEditable={false}
                                    defaultCountry="KE" // Default to Kenya, change as needed
                                    value={formData.phoneNumber}
                                    onChange={handlePhoneChange}
                                    className={`w-full rounded-sm border ${errors.phoneNumber
                                            ? "border-red-300 focus-within:ring-2 focus-within:ring-red-500"
                                            : "border-blue-300 focus-within:ring-2 focus-within:ring-blue-100"
                                        }`}
                                    placeholder="Enter phone number"
                                />
                                {errors.phoneNumber && <p className="mt-1 text-xs text-red-500">{errors.phoneNumber}</p>}
                            </div>

                            {/* Website */}
                            <div>
                                <label htmlFor="website" className="block text-xs font-semibold text-slate-700 mb-2">
                                    Website Name
                                </label>
                                <input
                                    type="text"
                                    id="website"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    placeholder="ABC Apartments"
                                />
                            </div>

                            {/* Address */}
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
                                    className="w-full px-4 py-3 rounded-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    placeholder="123 Main Street, Apt 4B"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            {/* Country Dropdown */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-2">Country</label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        className="w-full flex justify-between items-center px-4 py-3 rounded-sm bg-white border border-blue-300 text-left"
                                    >
                                        {formData.country || "Select Country"}
                                        <ChevronDown className="w-5 h-5 text-gray-500" />
                                    </button>
                                    {/* Add country dropdown logic here if needed */}
                                </div>
                            </div>

                            {/* State */}
                            <div>
                                <label htmlFor="state" className="block text-xs font-semibold text-slate-700 mb-2">
                                    State / Province
                                </label>
                                <input
                                    type="text"
                                    id="state"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    placeholder="Nairobi / California / Ontario"
                                />
                            </div>

                            {/* Gender Dropdown */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-2">Gender</label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsGenderOpen(!isGenderOpen)}
                                        className="w-full flex justify-between items-center px-4 py-3 rounded-sm bg-white border border-blue-300 text-left"
                                    >
                                        {formData.gender || "Select Gender"}
                                        <ChevronDown
                                            className={`w-5 h-5 text-gray-500 transform transition-transform ${isGenderOpen ? "rotate-180" : "rotate-0"
                                                }`}
                                        />
                                    </button>
                                    {isGenderOpen && (
                                        <ul className="absolute mt-2 w-full rounded-sm bg-white border border-blue-100 z-10 animate-fadeIn">
                                            {["Male", "Female", "Other", "Prefer not to say"].map((gender) => (
                                                <li
                                                    key={gender}
                                                    onClick={() => {
                                                        setFormData((prev) => ({ ...prev, gender }));
                                                        setIsGenderOpen(false);
                                                    }}
                                                    className={`px-4 py-3 cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors ${formData.gender === gender ? "bg-amber-100 text-amber-700" : ""
                                                        }`}
                                                >
                                                    {gender}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* Tag */}
                            <div>
                                <label htmlFor="tag" className="block text-xs font-semibold text-slate-700 mb-2">
                                    Tag <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="tag"
                                    name="tag"
                                    value={formData.tag}
                                    onChange={handleInputChange}
                                    required
                                    className={`w-full px-4 py-3 rounded-sm border ${errors.tag
                                            ? "border-red-300 focus:ring-2 focus:ring-red-500"
                                            : "border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        }`}
                                    placeholder="e.g New client, Returning Client"
                                />
                                {errors.tag && <p className="mt-1 text-xs text-red-500">{errors.tag}</p>}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`px-4 py-3 rounded-sm bg-blue-600 text-white text-base font-semibold flex items-center gap-2 hover:bg-blue-700 ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""
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
            {showSpinner && <Spinner />}
        </div>
    );
}

export default CreateContactModal;