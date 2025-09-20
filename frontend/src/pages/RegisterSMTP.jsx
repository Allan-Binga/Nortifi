import { Wrench, ArrowRight, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios";
import { useEffect, useState } from "react";
import { backend } from "../server";
import { notify } from "../utils/toast";

// Mock logo component for consistency with landing page
const LogoComponent = () => (
  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center">
    <Mail className="w-6 h-6 text-white" />
  </div>
);

function RegisterSMTP() {
  const [loading, setLoading] = useState(false);
  const [smtpData, setSMTPData] = useState({
    name: "",
    smtpUser: "",
    smtpPassword: "",
    fromAddress: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSMTPData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterSMTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: smtpData.name,
        smtpUser: smtpData.smtpUser,
        smtpPassword: smtpData.smtpPassword,
        fromAddress: smtpData.fromAddress,
      };
      const response = await axios.post(
        `${backend}/smtp/server/register`,
        payload,
        { withCredentials: true }
      );
      notify("success", response.data.message);
      // Reset form on success
      setSMTPData({
        name: "",
        smtpUser: "",
        smtpPassword: "",
        fromAddress: "",
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Failed to register SMTP server";
      notify("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navigation */}
      <Navbar />

      {/* Main Section */}
      <section className=" pb-20 px-6 pt-30">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Configuration Name (Optional)
              </label>
              <input
                type="text"
                name="name"
                value={smtpData.name}
                onChange={handleInputChange}
                placeholder="e.g., My Gmail SMTP"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
              />
            </div>
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
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Password
              </label>
              <input
                type="password"
                name="smtpPassword"
                value={smtpData.smtpPassword}
                onChange={handleInputChange}
                placeholder="Enter your SMTP password"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
              />
            </div>
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
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gray-900 text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-all flex items-center justify-center space-x-2 hover:scale-105 cursor-pointer ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <span>{loading ? "Registering..." : "Register SMTP"}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default RegisterSMTP;
