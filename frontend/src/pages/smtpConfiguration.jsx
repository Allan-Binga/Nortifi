import Navbar from "../components/Navbar";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Server,
  X,
  Mail,
  Globe,
  Lock,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { backend } from "../server";
import { notify } from "../utils/toast";
import { useEffect, useState } from "react";

function Configurations() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConfig, setSelectedConfig] = useState(null);

  useEffect(() => {
    const fetchSMTP = async () => {
      try {
        const response = await axios.get(`${backend}/smtp/all/servers`, {
          withCredentials: true,
        });
        setConfigs(response.data);
      } catch (error) {
        console.error("Error fetching SMTP configurations:", error);
        notify(
          "error",
          error.response?.data?.error || "Failed to fetch SMTP configurations"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchSMTP();
  }, []);

  const openModal = (config) => {
    setSelectedConfig(config);
  };

  const closeModal = () => {
    setSelectedConfig(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navigation */}
      <Navbar />

      {/* Main Section */}
      <section className="pt-30 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                <Server className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
            <h1 className="text-4xl font-light mb-4">
              Your SMTP Configurations
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Manage your SMTP servers for seamless email delivery.
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center text-gray-600">
              Loading configurations...
            </div>
          )}

          {/* Empty State */}
          {!loading && configs.length === 0 && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                No SMTP configurations found.
              </p>
              <Link to="/register/smtp">
                <button className="bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center space-x-2 hover:scale-105 cursor-pointer mx-auto">
                  <span>Add New SMTP Server</span>
                  <Server className="w-4 h-4" />
                </button>
              </Link>
            </div>
          )}

          {/* Configurations List */}
          {!loading && configs.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {configs.map((config) => (
                <div
                  key={config.config_id}
                  onClick={() => openModal(config)}
                  className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-200 hover:border-amber-500"
                >
                  <div className="flex items-center mb-4">
                    <Server className="w-6 h-6 text-indigo-600 mr-3" />
                    <h3 className="text-lg font-semibold">
                      {config.name || "Unnamed Configuration"}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-2 flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    {config.smtp_user}
                  </p>
                  <p className="text-gray-600 flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    {config.from_address}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      {selectedConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {selectedConfig.name || "SMTP Configuration Details"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="flex items-center text-gray-600">
                <Server className="w-5 h-5 mr-2 text-indigo-600" />
                <span>
                  <strong>Host:</strong> {selectedConfig.smtp_host}
                </span>
              </p>
              <p className="flex items-center text-gray-600">
                <Server className="w-5 h-5 mr-2 text-indigo-600" />
                <span>
                  <strong>Port:</strong> {selectedConfig.smtp_port}
                </span>
              </p>
              <p className="flex items-center text-gray-600">
                <Mail className="w-5 h-5 mr-2 text-indigo-600" />
                <span>
                  <strong>User:</strong> {selectedConfig.smtp_user}
                </span>
              </p>
              <p className="flex items-center text-gray-600">
                <Lock className="w-5 h-5 mr-2 text-indigo-600" />
                <span>
                  <strong>Password:</strong> [Encrypted]
                </span>
              </p>
              <p className="flex items-center text-gray-600">
                <Globe className="w-5 h-5 mr-2 text-indigo-600" />
                <span>
                  <strong>From Address:</strong> {selectedConfig.from_address}
                </span>
              </p>
              <p className="flex items-center text-gray-600">
                <CheckCircle className="w-5 h-5 mr-2 text-indigo-600" />
                <span>
                  <strong>TLS:</strong>{" "}
                  {selectedConfig.use_tls ? "Enabled" : "Disabled"}
                </span>
              </p>
              <p className="flex items-center text-gray-600">
                <CheckCircle className="w-5 h-5 mr-2 text-indigo-600" />
                <span>
                  <strong>Default:</strong>{" "}
                  {selectedConfig.is_default ? "Yes" : "No"}
                </span>
              </p>
              <p className="flex items-center text-gray-600">
                <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                <span>
                  <strong>Created:</strong>{" "}
                  {new Date(selectedConfig.created_at).toLocaleString()}
                </span>
              </p>
            </div>
            <button
              onClick={closeModal}
              className="mt-6 w-full bg-gray-900 text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-all flex items-center justify-center space-x-2 hover:scale-105 cursor-pointer"
            >
              <span>Close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Configurations;
