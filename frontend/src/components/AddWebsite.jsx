import { Loader2, X, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { backend } from "../server";
import { notify } from "../utils/toast";
import Spinner from "./Spinner";
import { useNavigate } from "react-router-dom";

function AddWebsiteModal({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        companyName: "",
        domain: "",
        field: "",
    });
    const [errors, setErrors] = useState({});
    const [showSpinner, setShowSpinner] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldDropdownOpen, setFieldDropdownOpen] = useState(false);

    // Predefined options for the field dropdown
    const fields = [
        "Creative Design",
        "Technology",
        "E-commerce",
        "Marketing",
        "Finance",
        "Education",
        "Healthcare",
        "Other",
    ];

    const navigate = useNavigate();

    // Validation functions
    const validateCompanyName = (name) => {
        const nameRegex = /^[a-zA-Z0-9\s&.,'-]{2,100}$/;
        return nameRegex.test(name.trim());
    };

    const validateDomain = (domain) => {
        const domainRegex = /^(?!-)[A-Za-z0-9-]{1,63}(?:\.[A-Za-z]{2,})+$/;
        return domainRegex.test(domain.trim());
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleSelectField = (field) => {
        setFormData((prev) => ({ ...prev, field }));
        setFieldDropdownOpen(false);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!validateCompanyName(formData.companyName)) {
            newErrors.companyName = "Company name must be 2-100 characters and contain only letters, numbers, spaces, or basic symbols (&.,'-)";
        }

        if (!validateDomain(formData.domain)) {
            newErrors.domain = "Please enter a valid domain (e.g., example.com)";
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
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
            const response = await axios.post(
                `${backend}/websites/add-site`,
                {
                    companyName: formData.companyName,
                    domain: formData.domain,
                    field: formData.field || null,
                },
                { withCredentials: true }
            );

            notify.success(response.data.message || "Website created successfully");
            setFormData({
                companyName: "",
                domain: "",
                field: "",
            });
            setErrors({});
            setShowSpinner(true);
            if (onSuccess) {
                onSuccess(response.data.website);
            }
            setTimeout(() => {
                navigate("/sites");
                onClose();
            }, 2000);
        } catch (error) {
            const backendMessage = error.response?.data?.error;
            if (backendMessage) {
                notify.error(backendMessage);
            } else {
                notify.error("Failed to create website");
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
            <div className="bg-white rounded-xs border border-blue-200 w-full max-w-md mx-auto shadow-md">
                {/* Header */}
                <div className="bg-blue-100 px-6 py-3 rounded-t-xs flex justify-between items-center">
                    <h2 className="text-lg font-bold text-[#061338]">Add Website</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Create Website Form */}
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Company Name */}
                        <div>
                            <label htmlFor="companyName" className="block text-xs font-semibold text-slate-700 mb-2">
                                Company Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="companyName"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleInputChange}
                                required
                                className={`${inputStyles} ${errors.companyName ? "border-red-300 focus:ring-red-500" : ""}`}
                                placeholder="e.g., PixelCraft Studios"
                            />
                            {errors.companyName && <p className="mt-1 text-xs text-red-500">{errors.companyName}</p>}
                        </div>

                        {/* Domain */}
                        <div>
                            <label htmlFor="domain" className="block text-xs font-semibold text-slate-700 mb-2">
                                Domain <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="domain"
                                name="domain"
                                value={formData.domain}
                                onChange={handleInputChange}
                                required
                                className={`${inputStyles} ${errors.domain ? "border-red-300 focus:ring-red-500" : ""}`}
                                placeholder="e.g., pixelcraft.design"
                            />
                            {errors.domain && <p className="mt-1 text-xs text-red-500">{errors.domain}</p>}
                        </div>

                        {/* Field Dropdown */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-2">Field</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setFieldDropdownOpen(!fieldDropdownOpen)}
                                    className={`${inputStyles} flex justify-between items-center text-left`}
                                >
                                    {formData.field || "Select Field"}
                                    <ChevronDown
                                        className={`text-slate-500 transition-transform duration-300 ${fieldDropdownOpen ? "rotate-180" : "rotate-0"}`}
                                        size={18}
                                    />
                                </button>
                                {fieldDropdownOpen && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-blue-300 rounded-xs shadow-lg max-h-60 overflow-y-auto">
                                        {fields.map((field) => (
                                            <div
                                                key={field}
                                                onClick={() => handleSelectField(field)}
                                                className="px-4 py-2 text-base font-medium text-slate-700 hover:bg-blue-50 cursor-pointer"
                                            >
                                                {field}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end mt-6">
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
                                    "Create Website"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AddWebsiteModal;