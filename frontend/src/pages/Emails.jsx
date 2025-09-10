import Navbar from "../components/Navbar";
import BackgroundWaves from "../components/BackgroundWaves";
import { useState, useEffect } from "react";
import { Mail, Calendar, User, Eye, X } from "lucide-react";
import axios from "axios";
import { backend } from "../server";

function Emails() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const { data } = await axios.get(`${backend}/emails/all-campaigns`, {
          withCredentials: true,
        });
        setCampaigns(data);
      } catch (err) {
        console.error("Error fetching campaigns:", err);
      }
    };
    fetchCampaigns();
  }, []);

  return (
    <div className="relative min-h-screen bg-white">
      <Navbar />
      <BackgroundWaves />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 mt-16">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 ">
          <Mail className="w-6 h-6 text-indigo-500" />
          All Email Campaigns
        </h1>

        <div className="space-y-4">
          {campaigns.map((c) => (
            <div
              key={c.campaign_id}
              onClick={() => setSelectedCampaign(c)}
              className="p-4 rounded-xl shadow-md bg-gray-50 hover:bg-gray-100 cursor-pointer flex justify-between items-center transition-colors duration-200"
            >
              <div>
                <p className="font-semibold">{c.label}</p>
                <p className="text-sm text-gray-600">{c.subject}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(c.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    c.status === "sent"
                      ? "bg-green-100 text-green-700"
                      : c.status === "scheduled"
                      ? "bg-blue-100 text-blue-700"
                      : c.status === "draft"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {c.status}
                </span>
                <Eye className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors" />
              </div>
            </div>
          ))}
        </div>

        {campaigns.length === 0 && (
          <div className="text-center py-12">
            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No email campaigns found</p>
            <p className="text-gray-400 text-sm">
              Create your first campaign to see it here
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-20">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-2xl w-full mx-4 relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
              onClick={() => setSelectedCampaign(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4 pr-8">
              {selectedCampaign.label}
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <strong className="text-gray-700">Subject:</strong>
                <p className="text-gray-600 mt-1">{selectedCampaign.subject}</p>
              </div>

              <div>
                <strong className="text-gray-700">Body:</strong>
                <div
                  className="text-gray-600 mt-1 p-3 bg-gray-50 rounded border max-h-40 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: selectedCampaign.body }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong className="text-gray-700">From:</strong>
                  <p className="text-gray-600 flex items-center gap-1 mt-1">
                    <User className="w-4 h-4" />
                    {selectedCampaign.from_name || "Default"} (
                    {selectedCampaign.from_email || "N/A"})
                  </p>
                </div>

                <div>
                  <strong className="text-gray-700">Reply To:</strong>
                  <p className="text-gray-600 mt-1">
                    {selectedCampaign.reply_to_email || "N/A"}
                  </p>
                </div>

                <div>
                  <strong className="text-gray-700">CC:</strong>
                  <p className="text-gray-600 mt-1">
                    {selectedCampaign.cc?.join(", ") || "None"}
                  </p>
                </div>

                <div>
                  <strong className="text-gray-700">BCC:</strong>
                  <p className="text-gray-600 mt-1">
                    {selectedCampaign.bcc?.join(", ") || "None"}
                  </p>
                </div>

                <div>
                  <strong className="text-gray-700">Status:</strong>
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                      selectedCampaign.status === "sent"
                        ? "bg-green-100 text-green-700"
                        : selectedCampaign.status === "scheduled"
                        ? "bg-blue-100 text-blue-700"
                        : selectedCampaign.status === "draft"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {selectedCampaign.status}
                  </span>
                </div>

                <div>
                  <strong className="text-gray-700">Created:</strong>
                  <p className="text-gray-600 mt-1">
                    {new Date(selectedCampaign.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedCampaign.scheduled_at && (
                <div>
                  <strong className="text-gray-700">Scheduled For:</strong>
                  <p className="text-gray-600 mt-1">
                    {new Date(selectedCampaign.scheduled_at).toLocaleString()}
                    {selectedCampaign.timezone &&
                      ` (${selectedCampaign.timezone})`}
                  </p>
                </div>
              )}

              {selectedCampaign.recurring_rule && (
                <div>
                  <strong className="text-gray-700">Recurring:</strong>
                  <p className="text-gray-600 mt-1 capitalize">
                    {selectedCampaign.recurring_rule}
                  </p>
                </div>
              )}

              {selectedCampaign.footer_locations?.length > 0 && (
                <div>
                  <strong className="text-gray-700">Footer Locations:</strong>
                  <div className="mt-2 space-y-2">
                    {selectedCampaign.footer_locations.map((loc, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-gray-50 rounded border-l-4 border-indigo-500"
                      >
                        <p className="font-medium text-gray-800">
                          {loc.location}
                        </p>
                        <p className="text-sm text-gray-600">{loc.address}</p>
                        <p className="text-sm text-gray-600">{loc.phone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Emails;
