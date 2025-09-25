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
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { backend } from "../server";
import { notify } from "../utils/toast";

function RegisterSMTP() {
  const [statusStep, setStatusStep] = useState("idle");
  const [showPassword, setShowPassword] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formStep, setFormStep] = useState(1); // step state
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const [smtpData, setSMTPData] = useState({
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

      //Route Users to /new-email page
      setTimeout(() => {
        setStatusStep("idle");
        navigate("/new-email");
      }, 1500);
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
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <Wrench className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
            <h1 className="text-4xl font-light mb-2">Register SMTP Server</h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              {formStep === 1
                ? "Step 1: Configure your SMTP settings"
                : "Step 2: Verify by sending a test email"}
            </p>
          </div>

          {/* Wizard Form */}
          <form onSubmit={handleRegisterSMTP} className="space-y-6">
            {formStep === 1 && (
              <div className="space-y-6">
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
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
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
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </div>

                {/* SMTP User */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Username
                  </label>
                  <input
                    type="email"
                    name="smtpUser"
                    value={smtpData.smtpUser}
                    onChange={handleInputChange}
                    placeholder="e.g., user@gmail.com"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
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
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
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
                </div>

                {/* From Address (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Address
                  </label>
                  <input
                    type="email"
                    value={smtpData.smtpUser}
                    readOnly
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your from address is your SMTP user.
                  </p>
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
                  <div className="space-y-4 p-4 rounded-lg bg-gray-50">
                    {/* Port Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SMTP Port
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsOpen(!isOpen)}
                          className="w-full flex justify-between items-center px-4 py-3 rounded-xl bg-white border border-gray-300 shadow-sm text-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 hover:slate-amber-300"
                        >
                          {smtpData.port
                            ? PORT_OPTIONS.find(
                                (p) => p.value === smtpData.port
                              )?.label
                            : "Select a port"}
                          <ChevronDown
                            className={`w-5 h-5 text-gray-500 transform transition-transform ${
                              isOpen ? "rotate-180" : "rotate-0"
                            }`}
                          />
                        </button>

                        {isOpen && (
                          <ul className="absolute mt-2 w-full rounded-xl bg-white shadow-lg border border-gray-200 z-10 animate-fadeIn">
                            {PORT_OPTIONS.map((option) => (
                              <li
                                key={option.value}
                                onClick={() => handlePortSelect(option.value)}
                                className={`px-4 py-3 cursor-pointer hover:bg-amber-50 hover:text-amber-700 transition-colors ${
                                  smtpData.port === option.value
                                    ? "bg-amber-100 text-amber-700"
                                    : ""
                                }`}
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

                {/* Next Step */}
                <button
                  type="button"
                  onClick={() => setFormStep(2)}
                  className="w-full bg-slate-800 text-white px-6 py-3 roundeContinue to d-md hover:bg-slate-900 flex justify-center items-center cursor-pointer space-x-2"
                >
                  <span>Continue to Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {formStep === 2 && (
              <div className="space-y-6">
                {/* Test Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Email
                  </label>
                  <input
                    type="email"
                    name="testEmail"
                    value={smtpData.testEmail}
                    onChange={handleInputChange}
                    placeholder="Enter a recipient to verify"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </div>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => setFormStep(1)}
                  className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 flex justify-center items-center space-x-2 cursor-pointer"
                >
                  <span>Back to Configuration</span>
                </button>

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
              </div>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}

export default RegisterSMTP;
