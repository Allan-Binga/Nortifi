import { useState, useEffect } from "react";
import {
    ArrowLeft,
    Send,
    ArrowRight,
    Settings,
    Eye,
    EyeOff,
    Loader2,
    CheckCircle2,
    ChevronDown,
} from "lucide-react";
import axios from "axios";
import { backend } from "../server";
import { notify } from "../utils/toast";
import { useWebsite } from "../context/WebsiteContext";

function RegisterSMTPModal({ isOpen, onClose, onSuccess }) {
    const {activeWebsite} = useWebsite()
    const [statusStep, setStatusStep] = useState("idle");
    const [showPassword, setShowPassword] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [formStep, setFormStep] = useState(1);
    const [isPortOpen, setIsPortOpen] = useState(false);
    const [smtpData, setSMTPData] = useState({
        websiteId: "",
        name: "",
        smtpUser: "",
        smtpPassword: "",
        host: "",
        port: "",
        secure: false,
        testEmail: "",
    });

    // Predefined ports
    const PORT_OPTIONS = [
        { value: "465", label: "465 (SSL/TLS)" },
        { value: "587", label: "587 (STARTTLS)" },
        { value: "25", label: "25 (SMTP relay)" },
    ];

    const handlePortSelect = (port) => {
        let secureValue = smtpData.secure;
        if (port === "465") secureValue = true;
        if (port === "587" || port === "25") secureValue = false;

        setSMTPData((prev) => ({ ...prev, port, secure: secureValue }));
        setIsPortOpen(false);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSMTPData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleRegisterSMTP = async (e) => {
        e.preventDefault();
        setStatusStep("sending");

        try {
            const payload = {
                websiteId: activeWebsite.website_id,
                name: smtpData.name || undefined,
                smtpUser: smtpData.smtpUser,
                smtpPassword: smtpData.smtpPassword,
                host: smtpData.host,
                testEmail: smtpData.testEmail,
            };

            if (smtpData.port) payload.port = Number(smtpData.port);
            if (showAdvanced) payload.secure = smtpData.secure;

            await new Promise((r) => setTimeout(r, 1000));
            setStatusStep("testing");
            await new Promise((r) => setTimeout(r, 1000));

            const response = await axios.post(
                `${backend}/smtp/server/register`,
                payload,
                { withCredentials: true }
            );

            setStatusStep("success");
            notify.success(response.data.message);

            setSMTPData({
                websiteId: "",
                name: "",
                smtpUser: "",
                smtpPassword: "",
                host: "",
                port: "",
                secure: false,
                testEmail: "",
            });
            setShowAdvanced(false);
            setFormStep(1);

            setTimeout(() => {
                setStatusStep("idle");
                onSuccess(); // Call onSuccess to close modal and refresh SMTP list
            }, 1500);
        } catch (error) {
            setStatusStep("idle");
            const errorMessage =
                error.response?.data?.error || "Failed to register SMTP server";
            notify.error(errorMessage);
        }
    };

    // Close modal on Escape key press
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
            <div className="bg-white rounded-sm border border-blue-200 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-blue-100 px-6 py-3 rounded-t-md flex justify-between items-center">
                    <h2 className="text-lg font-bold text-[#061338]">Register SMTP Server</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <div className="p-6">
                    <form onSubmit={handleRegisterSMTP} className="space-y-6">
                        {formStep === 1 && (
                            <div className="space-y-6">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Configuration Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={smtpData.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g., My Gmail SMTP"
                                        className="w-full px-4 py-3 rounded-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-xs"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        A label you choose to identify this SMTP setup (e.g., “Work Gmail”).
                                    </p>
                                </div>

                                {/* SMTP Host */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        SMTP Host
                                    </label>
                                    <input
                                        type="text"
                                        name="host"
                                        value={smtpData.host}
                                        onChange={handleInputChange}
                                        placeholder="e.g., smtp.gmail.com"
                                        className="w-full px-4 py-3 rounded-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-xs"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        The server address of your email provider (Gmail → smtp.gmail.com,
                                        Outlook → smtp.office365.com, etc.).
                                    </p>
                                </div>

                                {/* SMTP User */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        SMTP Username
                                    </label>
                                    <input
                                        type="email"
                                        name="smtpUser"
                                        value={smtpData.smtpUser}
                                        onChange={handleInputChange}
                                        placeholder="e.g., user@gmail.com"
                                        required
                                        className="w-full px-4 py-3 rounded-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-xs"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Usually your email address. Some providers require a special username.
                                    </p>
                                </div>

                                {/* SMTP Password */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        SMTP Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="smtpPassword"
                                            value={smtpData.smtpPassword}
                                            onChange={handleInputChange}
                                            placeholder="Enter your SMTP password"
                                            required
                                            className="w-full px-4 py-3 rounded-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-xs"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Your email password or app-specific password (for Gmail, you’ll need
                                        to create an <span className="font-semibold">App Password</span>).
                                    </p>
                                </div>

                                {/* From Address (read-only) */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        From Address
                                    </label>
                                    <input
                                        type="email"
                                        value={smtpData.smtpUser}
                                        readOnly
                                        className="w-full px-4 py-3 rounded-sm border border-blue-300 focus:outline-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        The email that your recipients will see as the sender.
                                    </p>
                                </div>

                                {/* Advanced Settings Toggle */}
                                <div className="text-right">
                                    <button
                                        type="button"
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        className="text-sm text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <Settings className="w-4 h-4" />
                                        {showAdvanced ? "Hide" : "Show More"}
                                    </button>
                                </div>

                                {/* Advanced Settings */}
                                {showAdvanced && (
                                    <div className="space-y-4 p-4 rounded-sm bg-gray-50">
                                        {/* Port Dropdown */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                SMTP Port
                                            </label>
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsPortOpen(!isPortOpen)}
                                                    className="w-full flex justify-between items-center px-4 py-3 rounded-sm bg-white border border-blue-300"
                                                >
                                                    {smtpData.port
                                                        ? PORT_OPTIONS.find((p) => p.value === smtpData.port)?.label
                                                        : "Select a port"}
                                                    <ChevronDown
                                                        className={`w-5 h-5 text-gray-500 transform transition-transform ${isPortOpen ? "rotate-180" : "rotate-0"}`}
                                                    />
                                                </button>

                                                {isPortOpen && (
                                                    <ul className="absolute mt-2 w-full rounded-sm bg-white border border-blue-100 z-10 animate-fadeIn">
                                                        {PORT_OPTIONS.map((option) => (
                                                            <li
                                                                key={option.value}
                                                                onClick={() => handlePortSelect(option.value)}
                                                                className={`px-4 py-3 cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors ${smtpData.port === option.value ? "bg-blue-100 text-blue-700" : ""}`}
                                                            >
                                                                {option.label}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>

                                        {/* Secure Checkbox */}
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                name="secure"
                                                checked={smtpData.secure}
                                                onChange={(e) =>
                                                    setSMTPData((prev) => ({
                                                        ...prev,
                                                        secure: e.target.checked,
                                                    }))
                                                }
                                                className="h-4 w-4 text-indigo-600 border-blue-300 rounded"
                                            />
                                            <label className="text-sm text-gray-700">
                                                Use Secure (SSL/TLS)
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {/* Next Step */}
                                <button
                                    type="button"
                                    onClick={() => setFormStep(2)}
                                    className="group w-full bg-blue-600 font-bold text-white px-6 py-3 rounded-sm hover:bg-blue-700 flex justify-center items-center cursor-pointer space-x-2"
                                >
                                    <span>Continue to Verification</span>
                                    <ArrowRight
                                        className="w-4 h-4 opacity-0 -rotate-45 transform transition-all duration-300 group-hover:opacity-100 group-hover:rotate-0"
                                    />
                                </button>


                            </div>
                        )}

                        {formStep === 2 && (
                            <div className="space-y-6">
                                {/* Test Email */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Test Email
                                    </label>
                                    <input
                                        type="email"
                                        name="testEmail"
                                        value={smtpData.testEmail}
                                        onChange={handleInputChange}
                                        placeholder="Enter a recipient to verify"
                                        required
                                        className="w-full px-4 py-3 rounded-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                {/* Back */}
                                <button
                                    type="button"
                                    onClick={() => setFormStep(formStep - 1)}
                                    className="group w-full border border-blue-500 font-semibold text-blue-600 px-6 py-3 rounded-sm flex justify-center items-center space-x-2 hover:bg-blue-50 cursor-pointer"
                                >
                                    <ArrowLeft className="w-4 h-4 opacity-0 -rotate-45 transform transition-all duration-300 group-hover:opacity-100 group-hover:rotate-0" />
                                    <span>Back to configuration details</span>
                                </button>


                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={statusStep !== "idle"}
                                    className={`group w-full bg-blue-600 font-bold text-white px-6 py-3 rounded-sm flex justify-center items-center space-x-2
                                    ${statusStep !== "idle" ? "opacity-70 cursor-wait" : "hover:bg-blue-700 cursor-pointer"}`}
                                >
                                    {statusStep === "idle" && (
                                        <>
                                            <span>Register SMTP</span>
                                            <ArrowRight className="w-4 h-4 opacity-0 -rotate-45 transform transition-all duration-300 group-hover:opacity-100 group-hover:rotate-0" />
                                        </>
                                    )}
                                    {statusStep === "sending" && (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Details Registered…</span>
                                        </>
                                    )}
                                    {statusStep === "testing" && (
                                        <>
                                            <Send className="w-4 h-4 animate-pulse" />
                                            <span>Sending Test Email…</span>
                                        </>
                                    )}
                                    {statusStep === "success" && (
                                        <>
                                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                                            <span>Successful</span>
                                        </>
                                    )}
                                </button>

                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}

export default RegisterSMTPModal;