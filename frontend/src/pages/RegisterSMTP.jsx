import {
  Wrench,
  Send,
  ArrowRight,
  Settings,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import Navbar from "../components/Navbar";
import axios from "axios";
import { useState } from "react";
import { backend } from "../server";
import { notify } from "../utils/toast";

function RegisterSMTP() {
  const [statusStep, setStatusStep] = useState("idle");
  const [showPassword, setShowPassword] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [smtpData, setSMTPData] = useState({
    name: "",
    smtpUser: "",
    smtpPassword: "",
    fromAddress: "",
    host: "",
    port: "",
    secure: false,
  });
  const [isOpen, setIsOpen] = useState(false);

  // Predefined ports
  const PORT_OPTIONS = [
    { value: "465", label: "465 (SSL/TLS)" },
    { value: "587", label: "587 (STARTTLS)" },
    { value: "25", label: "25 (SMTP relay)" },
  ];

  const handlePortSelect = (port) => {
    let secureValue = smtpData.secure;
    if (port === "465") secureValue = true; // SSL
    if (port === "587" || port === "25") secureValue = false; // Not secure

    setSMTPData((prev) => ({ ...prev, port, secure: secureValue }));
    setIsOpen(false);
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
        name: smtpData.name || undefined,
        smtpUser: smtpData.smtpUser,
        smtpPassword: smtpData.smtpPassword,
        fromAddress: smtpData.fromAddress,
        host: smtpData.host,
      };

      if (smtpData.port) payload.port = Number(smtpData.port);
      if (showAdvanced) payload.secure = smtpData.secure;

      // Step 1: sending details
      await new Promise((r) => setTimeout(r, 1200));

      // Step 2: pretend testing email
      setStatusStep("testing");
      await new Promise((r) => setTimeout(r, 1200));

      // API call
      const response = await axios.post(
        `${backend}/smtp/server/register`,
        payload,
        { withCredentials: true }
      );

      // Step 3: success
      setStatusStep("success");
      notify.success(response.data.message);

      // Reset form
      setSMTPData({
        name: "",
        smtpUser: "",
        smtpPassword: "",
        fromAddress: "",
        host: "",
        port: "",
        secure: false,
      });
      setShowAdvanced(false);

      // Reset back to idle after showing success
      setTimeout(() => setStatusStep("idle"), 2000);
    } catch (error) {
      setStatusStep("idle");
      const errorMessage =
        error.response?.data?.error || "Failed to register SMTP server";
      notify.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      <section className="pb-20 px-6 pt-30">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center transition-colors">
                <Wrench className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
            <h1 className="text-4xl font-light mb-4">Register SMTP Server</h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Configure your SMTP settings to start sending emails seamlessly.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegisterSMTP} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Configuration Name
              </label>
              <input
                type="text"
                name="name"
                value={smtpData.name}
                onChange={handleInputChange}
                placeholder="e.g., My Gmail SMTP"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/*SMTP Host*/}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Host
              </label>
              <input
                type="text"
                name="host"
                value={smtpData.host}
                onChange={handleInputChange}
                placeholder="e.g., smtp.gmail.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* SMTP User */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP User (Email)
              </label>
              <input
                type="email"
                name="smtpUser"
                value={smtpData.smtpUser}
                onChange={handleInputChange}
                placeholder="e.g., user@gmail.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* SMTP Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300  focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* From Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Address
              </label>
              <input
                type="email"
                name="fromAddress"
                value={smtpData.fromAddress}
                onChange={handleInputChange}
                placeholder="e.g., no-reply@yourdomain.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300  focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Advanced Settings Toggle */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                {showAdvanced ? "Hide" : "Show More"}
              </button>
            </div>

            {/* Advanced Settings */}
            {showAdvanced && (
              <div className="space-y-4 p-4 border-gray-100 rounded-lg bg-gray-50">
                {/* Fancy Dropdown for Port */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Port
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsOpen(!isOpen)}
                      className="w-full flex justify-between items-center px-4 py-3 rounded-xl bg-white shadow-md text-gray-800 border-2 border-amber-200 focus:ring-2 focus:ring-amber-200 hover:bg-amber-50 transition"
                    >
                      {smtpData.port
                        ? PORT_OPTIONS.find((p) => p.value === smtpData.port)
                            ?.label
                        : "Select a port"}
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    </button>

                    {isOpen && (
                      <ul className="absolute mt-2 w-full bg-white border rounded-xl shadow-lg z-10">
                        {PORT_OPTIONS.map((option) => (
                          <li
                            key={option.value}
                            onClick={() => handlePortSelect(option.value)}
                            className="px-4 py-2 hover:bg-indigo-50 cursor-pointer transition"
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
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <label className="text-sm text-gray-700">
                    Use Secure (SSL/TLS)
                  </label>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={statusStep !== "idle"}
              className={`w-full bg-gray-900 text-white px-6 py-3 rounded-md flex items-center justify-center space-x-2 transition-all ${
                statusStep !== "idle"
                  ? "opacity-70 cursor-wait"
                  : "hover:bg-gray-800 cursor-pointer"
              }`}
            >
              {statusStep === "idle" && (
                <>
                  <span>Register SMTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
              {statusStep === "sending" && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Details Sent…</span>
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
          </form>
        </div>
      </section>
    </div>
  );
}

export default RegisterSMTP;
