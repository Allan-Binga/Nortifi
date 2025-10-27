import Sidebar from "../components/Sidebar";
import Label from "../components/Label";
import { useParams } from "react-router-dom";
import axios from "axios";
import { backend } from "../server";
import { useState, useEffect } from "react";
import { Loader2, Mail, Tag, Building, Phone, Globe } from "lucide-react";

function EmailDetails() {
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await axios.get(`${backend}/emails/campaign/${campaignId}`, {
          withCredentials: true,
        });
        setCampaign(res.data);
      } catch (err) {
        console.error("Error fetching campaign:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaign();
  }, [campaignId]);

  // 🗓️ Format date as "26th July 2025"
  const formatDate = (isoString) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-blue-50">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-blue-50">
        <p className="text-gray-600">Campaign not found</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-blue-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Label />
        <div className="flex-1 overflow-y-auto p-6 transition-all duration-300 mt-20">
          <div className="max-w-5xl mx-auto">
            {/* Campaign Information Card */}
            <div className="bg-white border border-blue-200 rounded-md shadow-sm mb-6 p-6">
              {/* Header with Icon */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-[#061338]">{campaign.subject}</h2>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${campaign.status === "sent"
                    ? "bg-green-100 text-green-700"
                    : campaign.status === "scheduled"
                      ? "bg-blue-100 text-blue-700"
                      : campaign.status === "draft"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                >
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </span>
              </div>

              {/* Email Content */}
              <div className="border-t border-slate-200 pt-4 mb-4">
                <h3 className="text-sm font-medium text-[#061338] mb-2">Content</h3>
                <div
                  className="prose prose-sm max-w-none text-gray-700 bg-slate-50 p-4 rounded-md"
                  dangerouslySetInnerHTML={{ __html: campaign.body || "<p>No content available</p>" }}
                />
              </div>

              {/* Campaign Metadata */}
              <div className="border-t border-slate-200 pt-4 mb-4">
                <h3 className="text-sm font-medium text-[#061338] mb-2">Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold text-[#061338]">From:</span>{" "}
                    {campaign.from_name} &lt;{campaign.from_email}&gt;
                  </p>
                  <p>
                    <span className="font-semibold text-[#061338]">Reply To:</span>{" "}
                    {campaign.reply_to_email || "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#061338]">CC:</span>{" "}
                    {campaign.cc.length > 0 ? campaign.cc.join(", ") : "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#061338]">BCC:</span>{" "}
                    {campaign.bcc.length > 0 ? campaign.bcc.join(", ") : "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#061338]">Created:</span>{" "}
                    {formatDate(campaign.created_at)}
                  </p>
                  <p>
                    <span className="font-semibold text-[#061338]">Send Type:</span>{" "}
                    {campaign.send_type.charAt(0).toUpperCase() + campaign.send_type.slice(1)}
                  </p>
                  {campaign.scheduled_at && (
                    <p>
                      <span className="font-semibold text-[#061338]">Scheduled:</span>{" "}
                      {formatDate(campaign.scheduled_at)}
                    </p>
                  )}
                  <p>
                    <span className="font-semibold text-[#061338]">Timezone:</span>{" "}
                    {campaign.timezone || "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#061338]">Tags:</span>{" "}
                    {campaign.tags.length > 0 ? (
                      campaign.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full mr-1"
                        >
                          <Tag size={12} />
                          {tag}
                        </span>
                      ))
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
              </div>

              {/* Company and Social Media Info */}
              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-medium text-[#061338] mb-2">Footer Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold text-[#061338]">Company:</span>{" "}
                    {campaign.company_info.name || "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#061338]">Location:</span>{" "}
                    {campaign.company_info.location || "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#061338]">Customer Care:</span>{" "}
                    {campaign.company_info.customerCare || "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#061338]">Privacy Policy:</span>{" "}
                    {campaign.company_info.privacyPolicy ? (
                      <a
                        href={campaign.company_info.privacyPolicy}
                        className="text-blue-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Policy
                      </a>
                    ) : (
                      "—"
                    )}
                  </p>
                  <p>
                    <span className="font-semibold text-[#061338]">Terms:</span>{" "}
                    {campaign.company_info.termsConditions ? (
                      <a
                        href={campaign.company_info.termsConditions}
                        className="text-blue-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Terms
                      </a>
                    ) : (
                      "—"
                    )}
                  </p>
                  <div>
                    <span className="font-semibold text-[#061338]">Social Media:</span>{" "}
                    {Object.keys(campaign.social_media).length > 0 ? (
                      <div className="flex gap-3 flex-wrap mt-2">
                        {/* Facebook */}
                        {campaign.social_media.facebook && (
                          <a
                            href={campaign.social_media.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:scale-105 transition-transform"
                            dangerouslySetInnerHTML={{
                              __html: `<svg role="img" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><title>Facebook</title><path fill="#1877F2" d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg>`,
                            }}
                          />
                        )}

                        {/* Twitter/X */}
                        {campaign.social_media.twitter && (
                          <a
                            href={campaign.social_media.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:scale-105 transition-transform"
                            dangerouslySetInnerHTML={{
                              __html: `<svg role="img" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><title>X</title><path fill="#000" d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/></svg>`,
                            }}
                          />
                        )}

                        {/* Instagram */}
                        {campaign.social_media.instagram && (
                          <a
                            href={campaign.social_media.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:scale-105 transition-transform"
                            dangerouslySetInnerHTML={{
                              __html: `<svg role="img" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><title>Instagram</title><path fill="#E1306C" d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/></svg>`,
                            }}
                          />
                        )}

                        {/* LinkedIn */}
                        {campaign.social_media.linkedin && (
                          <a
                            href={campaign.social_media.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:scale-105 transition-transform"
                            dangerouslySetInnerHTML={{
                              __html: `<svg role="img" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><title>LinkedIn</title><path fill="#0077B5" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.065 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </div>

                  {campaign.footer_locations.length > 0 && (
                    <p>
                      <span className="font-semibold text-[#061338]">Locations:</span>{" "}
                      {campaign.footer_locations.map((loc, index) => (
                        <span key={index} className="block">
                          {loc.location}: {loc.address}, {loc.phone}
                        </span>
                      ))}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Recipients Section */}
            <div className="bg-white border border-blue-200 rounded-md shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#061338] mb-4">Recipients</h3>
              {campaign.recipients.length === 0 ? (
                <p className="text-gray-500 text-sm">No recipients for this campaign.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-slate-700 min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">Name</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">Email</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">Sent At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaign.recipients.map((r) => (
                        <tr
                          key={r.recipient_id}
                          className="border-t border-slate-200 hover:bg-slate-50 transition duration-150"
                        >
                          <td className="px-3 py-2">
                            {r.first_name} {r.last_name}
                          </td>
                          <td className="px-3 py-2 text-slate-600">{r.email}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${r.recipient_status === "sent"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                                }`}
                            >
                              {r.recipient_status.charAt(0).toUpperCase() + r.recipient_status.slice(1)}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-500">
                            {r.sent_at ? formatDate(r.sent_at) : "—"}
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
  );
}

export default EmailDetails;