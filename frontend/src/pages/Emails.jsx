import Sidebar from "../components/Sidebar";
import Label from "../components/Label";
import { useState, useEffect } from "react";
import { Mail, Calendar, Pen, Eye, Send } from "lucide-react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { backend } from "../server";

function Emails() {
  const [campaigns, setCampaigns] = useState([]);
  const navigate = useNavigate();

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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Label />
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 mt-14 w-full">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <Mail className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
            <h1 className="text-4xl font-light mb-4">Your Email Campaigns</h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Easily manage your campaigns at a go.
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto bg-white shadow-md rounded-xl">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Label</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Subject</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {campaigns.map((c) => (
                  <tr key={c.campaign_id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{c.label}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{c.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(c.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${c.status === "sent"
                          ? "bg-green-100 text-green-700"
                          : c.status === "scheduled"
                            ? "bg-blue-100 text-blue-700"
                            : c.status === "draft"
                              ? "bg-gray-200 text-gray-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex justify-end gap-3">
                      {/* Always show view */}
                      <Eye
                        className="w-5 h-5 text-gray-500 cursor-pointer hover:text-indigo-600"
                        onClick={() => navigate(`/campaigns/${c.campaign_id}`)}
                      />
                      {/* Show pen if draft or pending */}
                      {(c.status === "draft" || c.status === "pending") && (
                        <Pen
                          className="w-5 h-5 text-blue-500 cursor-pointer hover:text-indigo-600"
                          onClick={() => navigate(`/new-email?draftId=${c.campaign_id}`)}
                        />
                      )}

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {campaigns.length === 0 && (
            <div className="text-center mt-8">
              <p className="text-gray-600 mb-4">No campaigns available at the moment.</p>
              <Link to="/new-email">
                <button className="bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center space-x-2 hover:scale-105 cursor-pointer mx-auto">
                  <span>Start by sending campaigns</span>
                  <Send className="w-4 h-4" />
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default Emails;
