import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { notify } from "../utils/toast";
import Spinner from "./Spinner";
import { backend } from "../server";

function NewLabelModal({ isOpen, onClose, onSuccess }) {
    const [errors, setErrors] = useState({});
    const [showSpinner, setShowSpinner] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        color: "",
    });

    // Predefined set of 20 colors
    const colors = [
        "#FF6B6B", "#FF8E53", "#FFCE54", "#48BB78", "#38B2AC",
        "#4299E1", "#667EEA", "#9F7AEA", "#ED64A6", "#4A5568",
        "#E53E3E", "#DD6B20", "#D69E2E", "#38A169", "#319795",
        "#3182CE", "#5A67D8", "#805AD5", "#D53F8C", "#2D3748",
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleColorSelect = (color) => {
        setFormData((prev) => ({ ...prev, color }));
        if (errors.color) {
            setErrors((prev) => ({ ...prev, color: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name || formData.name.length < 2 || formData.name.length > 50) {
            newErrors.name = "Name must be between 2-50 characters.";
        }

        if (!formData.color) {
            newErrors.color = "Please select a color.";
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
            const payload = { ...formData };
            await axios.post(`${backend}/labels/new-label`, payload, {
                withCredentials: true,
            });

            notify.success("Label added.");

            setFormData({
                name: "",
                color: "",
            });
            setErrors({});
            setShowSpinner(true);

            if (onSuccess) onSuccess();
            setTimeout(() => {
                setShowSpinner(false);
                onClose();
            }, 1500);
        } catch (error) {
            const backendMessage = error.response?.data?.error;
            notify.error(backendMessage || "Failed to add label.");
            console.error("Error adding label:", error);
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
        <div className="fixed inset-0 flex items-center justify-center z-[10010] bg-white-50 bg-opacity-30 backdrop-blur-sm">
            <div className="relative bg-white rounded-xs border border-blue-200 w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto shadow-md">
                {showSpinner && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-[10001]">
                        <Spinner />
                    </div>
                )}
                <div className="bg-blue-100 px-6 py-3 rounded-t-xs flex justify-between items-center">
                    <h2 className="text-lg font-bold text-[#061338]">New Label</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-xs font-semibold text-slate-700 mb-2">
                                Label Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className={`${inputStyles} ${errors.name ? "border-red-300 focus:ring-red-500" : ""}`}
                                placeholder="e.g., New Client"
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-2">
                                Color <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                                {colors.map((color) => (
                                    <div
                                        key={color}
                                        onClick={() => handleColorSelect(color)}
                                        className={`w-8 h-8 rounded-full cursor-pointer border-2 ${formData.color === color ? "border-blue-600" : "border-transparent"
                                            } hover:border-blue-400 transition-all`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                            {errors.color && <p className="mt-1 text-xs text-red-500">{errors.color}</p>}
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
                                    "Create Label"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default NewLabelModal;