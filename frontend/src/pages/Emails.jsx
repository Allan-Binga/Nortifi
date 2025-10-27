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

  //  Helper function to format date as "26th July 2025"
  const formatDate = (isoString) => {
    if (!isoString) return "—";
    const date = new Date(isoString);

    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();

    // Determine suffix (st, nd, rd, th)
    const getSuffix = (n) => {
      if (n > 3 && n < 21) return "th";
      switch (n % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
      }
    };

    return `${day}${getSuffix(day)} ${month} ${year}`;
  };

  const handleRowClick = (campaignId) => {
    navigate(`/emails/campaign/${campaignId}`);
  };

  return (
    <div className="flex h-screen bg-blue-50">
      {/* Sidebar */}
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Label />

        <div className="flex-1 overflow-y-auto p-6 transition-all duration-300 mt-20">
          {/* Campaigns Table */}
          <div className="max-w-6xl mx-auto px-6">
            <div className="bg-white rounded-md border border-blue-200 shadow-sm">

              {/* Header */}
              <div className="bg-blue-100 px-6 py-3 rounded-t-md flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#061338]">
                  All Campaigns ({campaigns.length})
                </h2>
                <Link to="/new-email">
                  <button className="px-4 py-2 rounded-xs bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">
                    + New Campaign
                  </button>
                </Link>
              </div>

              {/* Body */}
              <div className="p-4">
                {campaigns.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-600 text-sm mb-2">
                      No campaigns available at the moment.
                    </p>
                    <p className="text-slate-500 text-xs mb-4">
                      Try creating your first campaign to get started.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm text-slate-700 min-w-[700px]">
                      <thead>
                        <tr className="bg-slate-50 sticky top-0 border-b border-slate-200">
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Label</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Subject</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">From</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Created</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.map((c) => (
                          <tr
                            key={c.campaign_id}
                            className="border-t border-slate-200 hover:bg-slate-50 transition duration-150 cursor-pointer"
                            onClick={() => handleRowClick(c.campaign_id)}
                          >
                            <td className="px-3 py-2">{c.label || "—"}</td>
                            <td className="px-3 py-2 font-medium text-slate-800">{c.subject}</td>
                            <td className="px-3 py-2 text-sm text-slate-600">
                              {c.from_name} <br />
                              <span className="text-xs text-slate-500">{c.from_email}</span>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-500">
                              {formatDate(c.created_at)}
                            </td>
                            <td className="px-3 py-2 capitalize">
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
                            <td
                              className="px-3 py-2 flex justify-end gap-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Eye
                                className="w-5 h-5 text-gray-500 cursor-pointer hover:text-blue-600 mt-2"
                                onClick={() =>
                                  navigate(`/emails/campaign/${c.campaign_id}`)
                                }
                              />
                              {(c.status === "draft" || c.status === "pending") && (
                                <Pen
                                  className="w-5 h-5 text-blue-500 cursor-pointer hover:text-indigo-600"
                                  onClick={() =>
                                    navigate(`/new-email?draftId=${c.campaign_id}`)
                                  }
                                />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Emails;
