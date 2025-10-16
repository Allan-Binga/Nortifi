import Sidebar from "../components/Sidebar";
import Label from "../components/Label";
import Spinner from "../components/Spinner";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  Trash2,
  Loader2,
  ArrowLeft,
  Plus,
  Calendar,
  Send,
  Save,
  ChevronDown,
} from "lucide-react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { backend } from "../server";
import { notify } from "../utils/toast";
import { useFetchSMTPs } from "../utils/smtp";
import { useWebsite } from "../context/WebsiteContext";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

function NewEmail() {
  const { activeWebsite } = useWebsite();
  const { fetchSMTPs } = useFetchSMTPs()
  const [currentTab, setCurrentTab] = useState(0);
  const [contacts, setContacts] = useState([]);
  const [emailServers, setEmailServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState("");
  const [showSpinner, setShowSpinner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailData, setEmailData] = useState({
    label: "",
    subject: "",
    body: "",
    recipientMode: "individual",
    recipients: "",
    fromName: "",
    replyToEmail: "",
    ccEmails: "",
    bccEmails: "",
    send_type: "immediate",
    scheduled_at: "",
    timezone: "Africa/Nairobi",
    recurring_rule: "",
    forceSend: false,
    footerLocations: [],
    tags: [],
    exclude_unsubscribed: true,
    smtpConfigId: "",
    campaignId: null,
  });
  const [filters, setFilters] = useState({
    gender: "",
    website: "",
  });
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [serverDropdownOpen, setServerDropdownOpen] = useState(false);
  const [genderDropdownOpen, setGenderDropdownOpen] = useState(false);
  const [websiteDropdownOpen, setWebsiteDropdownOpen] = useState(false);
  const [timezoneDropdownOpen, setTimezoneDropdownOpen] = useState(false);
  const [recurringDropdownOpen, setRecurringDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get("draftId");

  const inputStyles = `w-full px-4 py-3 rounded-xs border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white text-base font-medium placeholder-gray-400 transition duration-200`;

  const timezones = [
    { value: "Africa/Nairobi", label: "Africa/Nairobi (EAT)" },
    { value: "America/New_York", label: "America/New_York (EST)" },
    { value: "America/Los_Angeles", label: "America/Los_Angeles (PST)" },
    { value: "Europe/London", label: "Europe/London (GMT)" },
    { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
    { value: "UTC", label: "UTC" },
  ];

  const recurringOptions = [
    { value: "", label: "No Recurring" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
  ];

  useEffect(() => {
    const fetchDraft = async () => {
      if (!draftId) return;
      try {
        const { data } = await axios.get(`${backend}/emails/campaign/${draftId}`, {
          withCredentials: true,
        });
        setEmailData({
          label: data.label || "",
          subject: data.subject || "",
          body: data.body || "",
          fromName: data.from_name || "",
          fromEmail: data.from_email || "",
          replyToEmail: data.reply_to_email || "",
          ccEmails: data.cc?.join(", ") || "",
          bccEmails: data.bcc?.join(", ") || "",
          send_type: data.send_type || "immediate",
          scheduled_at: data.scheduled_at
            ? new Date(data.scheduled_at).toISOString().slice(0, 16)
            : "",
          timezone: data.timezone || "Africa/Nairobi",
          recurring_rule: data.recurring_rule || "",
          forceSend: false,
          footerLocations: data.footer_locations || [],
          tags: data.tags || [],
          exclude_unsubscribed: true,
          smtpConfigId: data.smtp_config_id || "",
          campaignId: data.campaign_id,
          status: data.status || "draft",
          isDraft: data.is_draft ?? true,
        });
      } catch (error) {
        console.error("Error fetching draft:", error);
      }
    };
    fetchDraft();
  }, [draftId]);

  useEffect(() => {
    if (!activeWebsite) return;
    const loadSMTPs = async () => {
      try {
        const servers = await fetchSMTPs();
        setEmailServers(servers);
        if (servers.length > 0) {
          setSelectedServer(servers[0].config_id);
        }
      } catch (error) {
        console.error("Error fetching SMTP servers:", error);
      }
    };
    loadSMTPs();
  }, [activeWebsite]);

  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${backend}/contacts/all-contacts/website/${activeWebsite.website_id}`, {
          withCredentials: true,
        });
        setContacts(response.data);
      } catch (error) {
        notify.error("Failed to fetch contacts");
        console.error("Error fetching contacts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  useEffect(() => {
    if (emailData.recipientMode === "bulk") {
      const filteredContacts = emailData.exclude_unsubscribed
        ? contacts.filter((contact) => !contact.unsubscribed)
        : contacts;
      const newSelectedContacts = filteredContacts.map(
        (contact) => contact.contact_id
      );
      setSelectedContacts(newSelectedContacts);
      const newRecipients = filteredContacts
        .map((contact) => contact.email)
        .join(", ");
      setEmailData((prev) => ({ ...prev, recipients: newRecipients }));
    } else {
      setSelectedContacts([]);
    }
  }, [emailData.recipientMode, emailData.exclude_unsubscribed, contacts]);

  const handleContactToggle = (contactId) => {
    setSelectedContacts((prev) => {
      const isSelected = prev.includes(contactId);
      let newSelected;
      if (isSelected) {
        newSelected = prev.filter((id) => id !== contactId);
      } else {
        newSelected = [...prev, contactId];
      }
      const selectedEmails = contacts
        .filter((contact) => newSelected.includes(contact.contact_id))
        .map((contact) => contact.email)
        .join(", ");
      setEmailData((prevData) => ({
        ...prevData,
        recipients: selectedEmails,
      }));
      return newSelected;
    });
  };

  const handleInputChange = (field, value) => {
    setEmailData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFooterLocationChange = (index, field, value) => {
    const updatedLocations = [...emailData.footerLocations];
    updatedLocations[index] = {
      ...updatedLocations[index],
      [field]: value,
    };
    setEmailData((prev) => ({
      ...prev,
      footerLocations: updatedLocations,
    }));
  };

  const addFooterLocation = () => {
    setEmailData((prev) => ({
      ...prev,
      footerLocations: [
        ...prev.footerLocations,
        { location: "", address: "", phone: "" },
      ],
    }));
  };

  const removeFooterLocation = (index) => {
    const updatedLocations = emailData.footerLocations.filter(
      (_, i) => i !== index
    );
    setEmailData((prev) => ({
      ...prev,
      footerLocations: updatedLocations,
    }));
  };

  const handleNext = () => {
    if (currentTab < tabs.length - 1) {
      setCurrentTab(currentTab + 1);
    }
  };

  const handlePrevious = () => {
    if (currentTab > 0) {
      setCurrentTab(currentTab - 1);
    }
  };

  const validateEmailData = () => {
    if (!emailData.subject.trim()) {
      notify.error("Subject is required");
      return false;
    }
    if (!emailData.body.trim()) {
      notify.error("Body is required");
      return false;
    }
    if (!emailData.recipients.trim()) {
      notify.error("Recipients are required");
      return false;
    }
    if (emailData.send_type === "scheduled" && !emailData.scheduled_at) {
      notify.error("Scheduled date/time is required for scheduled emails");
      return false;
    }
    return true;
  };

  const handleSendEmail = async () => {
    if (!validateEmailData()) {
      return;
    }
    setLoading(true);
    try {
      const payload = {
        campaignId: emailData.campaignId,
        label: emailData.label,
        subject: emailData.subject,
        body: emailData.body,
        fromName: emailData.fromName,
        replyToEmail: emailData.replyToEmail,
        toEmails: emailData.recipients
          .split(",")
          .map((e) => e.trim())
          .filter((e) => e.length > 0),
        cc: emailData.ccEmails
          ? emailData.ccEmails
            .split(",")
            .map((e) => e.trim())
            .filter((e) => e.length > 0)
          : [],
        bcc: emailData.bccEmails
          ? emailData.bccEmails
            .split(",")
            .map((e) => e.trim())
            .filter((e) => e.length > 0)
          : [],
        send_type: emailData.send_type,
        scheduled_at: emailData.scheduled_at || null,
        timezone: emailData.timezone,
        recurring_rule: emailData.recurring_rule || null,
        filter: {
          tags: emailData.tags,
          exclude_unsubscribed: emailData.exclude_unsubscribed,
        },
        forceSend: emailData.forceSend,
        footerLocations: emailData.footerLocations,
        smtpConfigId: selectedServer,
      };
      const response = await axios.post(
        `${backend}/emails/smtp/send-email`,
        payload,
        { withCredentials: true }
      );
      notify.success(
        emailData.send_type === "scheduled"
          ? "Email scheduled successfully!"
          : "Email sent successfully!"
      );
      setEmailData({
        label: "",
        subject: "",
        body: "",
        recipientMode: "individual",
        recipients: "",
        fromName: "",
        replyToEmail: "",
        ccEmails: "",
        bccEmails: "",
        send_type: "immediate",
        scheduled_at: "",
        timezone: "Africa/Nairobi",
        recurring_rule: "",
        forceSend: false,
        footerLocations: [],
        tags: [],
        exclude_unsubscribed: true,
        smtpConfigId: "",
      });
      setShowSpinner(true);
      setTimeout(() => {
        navigate("/emails");
      }, 2000);
    } catch (error) {
      console.error("Send Email Error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to send email";
      notify.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      const payload = {
        ...emailData,
        toEmails: emailData.recipients
          .split(",")
          .map((e) => e.trim())
          .filter((e) => e.length > 0),
        cc: emailData.ccEmails
          ? emailData.ccEmails
            .split(",")
            .map((e) => e.trim())
            .filter((e) => e.length > 0)
          : [],
        bcc: emailData.bccEmails
          ? emailData.bccEmails
            .split(",")
            .map((e) => e.trim())
            .filter((e) => e.length > 0)
          : [],
        saveAsDraft: true,
        send_type: emailData.send_type,
        scheduled_at: emailData.scheduled_at || null,
        timezone: emailData.timezone,
        recurring_rule: emailData.recurring_rule || null,
        filter: {
          tags: emailData.tags,
          exclude_unsubscribed: emailData.exclude_unsubscribed,
        },
        forceSend: emailData.forceSend,
        footerLocations: emailData.footerLocations,
        smtpConfigId: selectedServer,
      };
      const response = await axios.post(
        `${backend}/emails/smtp/send-email`,
        payload,
        { withCredentials: true }
      );
      notify.success("Draft saved successfully!");
      setShowSpinner(true);
      setTimeout(() => {
        navigate("/home");
      }, 2000);
      setCurrentTab(0);
    } catch (error) {
      console.error("Save Draft Error:", error);
      notify.error("Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  const handleDiscardChanges = () => {
    setEmailData({
      label: "",
      subject: "",
      body: "",
      recipientMode: "individual",
      recipients: "",
      fromName: "",
      fromEmail: "",
      replyToEmail: "",
      ccEmails: "",
      bccEmails: "",
      send_type: "immediate",
      scheduled_at: "",
      timezone: "Africa/Nairobi",
      recurring_rule: "",
      forceSend: false,
      footerLocations: [],
      tags: [],
      exclude_unsubscribed: true,
    });
    notify.info("Changes discarded");
    setShowSpinner(true);
    setTimeout(() => {
      navigate("/home");
    }, 2000);
  };

  const renderAdvancedTab = () => (
    <div className="space-y-6">
      {/* SMTP Server Selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Select SMTP Server
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setServerDropdownOpen(!serverDropdownOpen)}
            className={`${inputStyles} flex justify-between items-center text-left w-full`}
          >
            {emailServers.find((server) => server.config_id === selectedServer)?.name ||
              "Select SMTP Server"}
            <ChevronDown
              className={`text-slate-500 transition-transform duration-300 ${serverDropdownOpen ? "rotate-180" : "rotate-0"}`}
              size={18}
            />
          </button>
          {serverDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-blue-300 rounded-xs shadow-lg max-h-60 overflow-y-auto">
              {emailServers.length > 0 ? (
                emailServers.map((server) => (
                  <div
                    key={server.config_id}
                    onClick={() => {
                      setSelectedServer(server.config_id);
                      setServerDropdownOpen(false);
                    }}
                    className="px-4 py-2 text-base font-medium text-slate-700 hover:bg-blue-50 cursor-pointer"
                  >
                    {server.name || server.smtp_user}
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-base font-medium text-slate-500">
                  No servers available
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* From Name */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          From Name
        </label>
        <input
          type="text"
          value={emailData.fromName}
          onChange={(e) => handleInputChange("fromName", e.target.value)}
          placeholder="Pioneer Writers TEAS Dept."
          className={inputStyles}
        />
      </div>

      {/* Reply-to Email */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Reply-to Email
        </label>
        <input
          type="email"
          value={emailData.replyToEmail}
          onChange={(e) => handleInputChange("replyToEmail", e.target.value)}
          placeholder="orders@nortifi.com"
          className={inputStyles}
        />
      </div>

      {/* CC Emails */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          CC Emails{" "}
          <span className="text-slate-500 text-xs font-normal">
            (Separate multiple emails with a comma)
          </span>
        </label>
        <input
          type="text"
          value={emailData.ccEmails}
          onChange={(e) => handleInputChange("ccEmails", e.target.value)}
          placeholder="support@nortifi.com, info@nortifi.com"
          className={inputStyles}
        />
      </div>

      {/* BCC Emails */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          BCC Emails{" "}
          <span className="text-slate-500 text-xs font-normal">
            (Separate multiple emails with a comma)
          </span>
        </label>
        <input
          type="text"
          value={emailData.bccEmails}
          onChange={(e) => handleInputChange("bccEmails", e.target.value)}
          placeholder="admin@nortifi.com, backup@nortifi.com"
          className={inputStyles}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-end">

        <button
          onClick={handleNext}
          className="px-4 py-3 rounded-xs cursor-pointer bg-blue-600 text-white text-base font-semibold flex items-center gap-2 hover:bg-blue-700"
        >
          Next
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
  

  const renderEmailTab = () => (
    <div className="space-y-6">
      {/* Subject */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Subject <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={emailData.subject}
          onChange={(e) => handleInputChange("subject", e.target.value)}
          placeholder="e.g Onboarding"
          className={inputStyles}
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Body <span className="text-red-500">*</span>
        </label>

        <div className="rounded-sm mb-6"> 
          <ReactQuill
            theme="snow"
            value={emailData.body}
            onChange={(content) => handleInputChange("body", content)}
            placeholder="Hello John Doe, Welcome to Nortifi!"
            className="bg-white rounded-xs min-h-[150px]"
            style={{ height: "200px" }}
            modules={{
              toolbar: [
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline", "strike"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link", "image"],
                ["clean"],
              ],
            }}
          />
        </div>
      </div>


      {/* Navigation Buttons */}
      <div className="flex justify-between mt-20">
        <button
          onClick={handlePrevious}
          disabled={currentTab === 0}
          className={`px-4 py-3 rounded-xs cursor-pointer bg-white border border-blue-500 text-blue-600 text-base font-semibold flex items-center gap-2 hover:bg-blue-100 ${currentTab === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <ArrowLeft className="w-5 h-5" />
          Previous
        </button>
        <button
          onClick={handleNext}
          className="px-4 py-3 rounded-xs cursor-pointer bg-blue-600 text-white text-base font-semibold flex items-center gap-2 hover:bg-blue-700"
        >
          Next
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderRecipientsTab = () => (
    <div className="space-y-6">
      {/* Description */}
      <p className="text-sm text-slate-600 mb-4">
        The default behavior is to send the email to the same recipients. If you
        want to send this email to different recipients conditionally, you can
        send individually.
      </p>

      {/* Recipient Mode Buttons */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => handleInputChange("recipientMode", "individual")}
          className={`px-6 py-3 rounded-xs font-medium text-base transition duration-200 ${emailData.recipientMode === "individual"
            ? "bg-blue-600 text-white"
            : "bg-blue-100 text-slate-700 hover:bg-blue-200"
            }`}
        >
          Individually
        </button>
        <button
          onClick={() => handleInputChange("recipientMode", "bulk")}
          className={`px-6 py-3 rounded-xs font-medium text-base transition duration-200 ${emailData.recipientMode === "bulk"
            ? "bg-blue-600 text-white"
            : "bg-blue-100 text-slate-700 hover:bg-blue-200"
            }`}
        >
          Mass Sending
        </button>
      </div>

      {/* Recipients */}
      <div>
        <p className="text-xs text-slate-500 mb-2">
          Make sure the contacts with the emails you want to use are added
          first.{" "}
          <a href="/add-contact" className="text-blue-600 hover:underline">
            Go to Contacts
          </a>
        </p>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Recipients <span className="text-red-500">*</span>
        </label>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Gender
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setGenderDropdownOpen(!genderDropdownOpen)}
                className={`${inputStyles} flex justify-between items-center text-left w-full`}
              >
                {filters.gender || "All"}
                <ChevronDown
                  className={`text-slate-500 transition-transform duration-300 ${genderDropdownOpen ? "rotate-180" : "rotate-0"}`}
                  size={18}
                />
              </button>
              {genderDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-blue-300 rounded-xs shadow-lg">
                  {["All", "Male", "Female"].map((option) => (
                    <div
                      key={option}
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, gender: option === "All" ? "" : option }));
                        setGenderDropdownOpen(false);
                      }}
                      className="px-4 py-2 text-base font-medium text-slate-700 hover:bg-blue-50 cursor-pointer"
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Website
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setWebsiteDropdownOpen(!websiteDropdownOpen)}
                className={`${inputStyles} flex justify-between items-center text-left w-full`}
              >
                {filters.website || "All"}
                <ChevronDown
                  className={`text-slate-500 transition-transform duration-300 ${websiteDropdownOpen ? "rotate-180" : "rotate-0"}`}
                  size={18}
                />
              </button>
              {websiteDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-blue-300 rounded-xs shadow-lg max-h-60 overflow-y-auto">
                  {["All", ...new Set(contacts.map((c) => c.website))].map((site) => (
                    <div
                      key={site}
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, website: site === "All" ? "" : site }));
                        setWebsiteDropdownOpen(false);
                      }}
                      className="px-4 py-2 text-base font-medium text-slate-700 hover:bg-blue-50 cursor-pointer"
                    >
                      {site}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border border-blue-300 rounded-xs shadow-sm">
          {loading ? (
            <p className="p-4 text-slate-500 text-sm">Loading contacts...</p>
          ) : contacts.length === 0 ? (
            <p className="p-4 text-slate-500 text-sm">
              No contacts available. Please add contacts to proceed.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm text-slate-700">
                <thead>
                  <tr className="bg-blue-50 sticky top-0">
                    <th className="px-4 py-3 text-left font-semibold">
                      <input
                        type="checkbox"
                        checked={
                          selectedContacts.length ===
                          contacts.filter(
                            (contact) =>
                              !emailData.exclude_unsubscribed ||
                              !contact.unsubscribed
                          ).length
                        }
                        onChange={() => {
                          if (
                            selectedContacts.length ===
                            contacts.filter(
                              (contact) =>
                                !emailData.exclude_unsubscribed ||
                                !contact.unsubscribed
                            ).length
                          ) {
                            setSelectedContacts([]);
                            setEmailData((prev) => ({
                              ...prev,
                              recipients: "",
                            }));
                          } else {
                            const filteredContacts = emailData.exclude_unsubscribed
                              ? contacts.filter((c) => !c.unsubscribed)
                              : contacts;
                            const newSelected = filteredContacts.map(
                              (c) => c.contact_id
                            );
                            setSelectedContacts(newSelected);
                            setEmailData((prev) => ({
                              ...prev,
                              recipients: filteredContacts
                                .map((c) => c.email)
                                .join(", "),
                            }));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-blue-300 rounded focus:ring-2 focus:ring-blue-100"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">First Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Last Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                    <th className="px-4 py-3 text-left font-semibold">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts
                    .filter(
                      (c) =>
                        !emailData.exclude_unsubscribed || !c.unsubscribed
                    )
                    .filter((c) => (filters.gender ? c.gender === filters.gender : true))
                    .filter((c) => (filters.website ? c.website === filters.website : true))
                    .map((contact) => (
                      <tr
                        key={contact.contact_id}
                        className="border-t border-blue-300 hover:bg-blue-50"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedContacts.includes(contact.contact_id)}
                            onChange={() => handleContactToggle(contact.contact_id)}
                            className="w-4 h-4 text-blue-600 border-blue-300 rounded focus:ring-2 focus:ring-blue-100"
                          />
                        </td>
                        <td className="px-4 py-3">{contact.first_name}</td>
                        <td className="px-4 py-3">{contact.last_name}</td>
                        <td className="px-4 py-3">{contact.email}</td>
                        <td className="px-4 py-3">{contact.phone_number}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Exclude Unsubscribed Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="exclude_unsubscribed"
          checked={emailData.exclude_unsubscribed}
          onChange={(e) => handleInputChange("exclude_unsubscribed", e.target.checked)}
          className="w-4 h-4 text-blue-600 border-blue-300 rounded focus:ring-2 focus:ring-blue-100"
        />
        <label
          htmlFor="exclude_unsubscribed"
          className="ml-2 block text-xs font-semibold text-slate-700"
        >
          Exclude unsubscribed contacts
        </label>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          className="px-4 py-3 rounded-xs cursor-pointer bg-blue-600 text-white text-base font-semibold flex items-center gap-2 hover:bg-blue-700"
        >
          <ArrowLeft className="w-5 h-5" />
          Previous
        </button>
        <button
          onClick={handleNext}
          className="px-4 py-3 rounded-xs cursor-pointer bg-blue-600 text-white text-base font-semibold flex items-center gap-2 hover:bg-blue-700"
        >
          Next
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderSchedulingTab = () => (
    <div className="space-y-6">
      {/* Send Type */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Send Type
        </label>
        <div className="flex space-x-4">
          <button
            onClick={() => handleInputChange("send_type", "immediate")}
            className={`px-6 py-3 rounded-xs font-medium text-base transition duration-200 ${emailData.send_type === "immediate"
              ? "bg-blue-600 text-white"
              : "bg-blue-100 text-slate-700 hover:bg-blue-200"
              }`}
          >
            Send Immediately
          </button>
          <button
            onClick={() => handleInputChange("send_type", "scheduled")}
            className={`px-6 py-3 rounded-xs font-medium text-base transition duration-200 ${emailData.send_type === "scheduled"
              ? "bg-blue-600 text-white"
              : "bg-blue-100 text-slate-700 hover:bg-blue-200"
              }`}
          >
            Schedule
          </button>
        </div>
      </div>

      {emailData.send_type === "scheduled" && (
        <>
          {/* Scheduled Date & Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Scheduled Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={emailData.scheduled_at}
              onChange={(e) => handleInputChange("scheduled_at", e.target.value)}
              className={inputStyles}
            />
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Timezone
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setTimezoneDropdownOpen(!timezoneDropdownOpen)}
                className={`${inputStyles} flex justify-between items-center text-left w-full`}
              >
                {timezones.find((tz) => tz.value === emailData.timezone)?.label ||
                  "Select Timezone"}
                <ChevronDown
                  className={`text-slate-500 transition-transform duration-300 ${timezoneDropdownOpen ? "rotate-180" : "rotate-0"
                    }`}
                  size={18}
                />
              </button>
              {timezoneDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-blue-300 rounded-xs shadow-lg max-h-60 overflow-y-auto">
                  {timezones.map((tz) => (
                    <div
                      key={tz.value}
                      onClick={() => {
                        handleInputChange("timezone", tz.value);
                        setTimezoneDropdownOpen(false);
                      }}
                      className="px-4 py-2 text-base font-medium text-slate-700 hover:bg-blue-50 cursor-pointer"
                    >
                      {tz.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recurring Rule */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Recurring Rule
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setRecurringDropdownOpen(!recurringDropdownOpen)}
                className={`${inputStyles} flex justify-between items-center text-left w-full`}
              >
                {recurringOptions.find((opt) => opt.value === emailData.recurring_rule)
                  ?.label || "Select Recurring Rule"}
                <ChevronDown
                  className={`text-slate-500 transition-transform duration-300 ${recurringDropdownOpen ? "rotate-180" : "rotate-0"
                    }`}
                  size={18}
                />
              </button>
              {recurringDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-blue-300 rounded-xs shadow-lg max-h-60 overflow-y-auto">
                  {recurringOptions.map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => {
                        handleInputChange("recurring_rule", opt.value);
                        setRecurringDropdownOpen(false);
                      }}
                      className="px-4 py-2 text-base font-medium text-slate-700 hover:bg-blue-50 cursor-pointer"
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Footer Locations Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-xs font-semibold text-slate-700">
            Footer Locations
          </label>
          <button
            type="button"
            onClick={addFooterLocation}
            className="px-4 py-2 rounded-xs bg-blue-600 text-white text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition duration-200"
          >
            <Plus className="w-4 h-4" />
            Add Location
          </button>
        </div>

        {emailData.footerLocations.map((location, index) => (
          <div
            key={index}
            className="p-4 border border-blue-300 rounded-xs mb-4 bg-blue-50"
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-semibold text-slate-700">
                Location {index + 1}
              </h4>
              <button
                type="button"
                onClick={() => removeFooterLocation(index)}
                className="text-red-500 hover:text-red-700 text-xs font-medium"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <input
                type="text"
                placeholder="Location Name (e.g., Nairobi Office)"
                value={location.location}
                onChange={(e) =>
                  handleFooterLocationChange(index, "location", e.target.value)
                }
                className={inputStyles}
              />
              <input
                type="text"
                placeholder="Address (e.g., 123 Main St, Nairobi)"
                value={location.address}
                onChange={(e) =>
                  handleFooterLocationChange(index, "address", e.target.value)
                }
                className={inputStyles}
              />
              <input
                type="text"
                placeholder="Phone (e.g., +254 123 456 789)"
                value={location.phone}
                onChange={(e) =>
                  handleFooterLocationChange(index, "phone", e.target.value)
                }
                className={inputStyles}
              />
            </div>
          </div>
        ))}

        {emailData.footerLocations.length === 0 && (
          <p className="text-slate-500 text-xs">
            No footer locations added. Click "Add Location" to include office
            locations in your email footer.
          </p>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          className="px-4 py-3 rounded-xs cursor-pointer bg-blue-600 text-white text-base font-semibold flex items-center gap-2 hover:bg-blue-700"
        >
          <ArrowLeft className="w-5 h-5" />
          Previous
        </button>
        <button
          onClick={handleSendEmail}
          disabled={loading}
          className={`px-4 py-3 rounded-xs cursor-pointer bg-blue-600 text-white text-base font-semibold flex items-center gap-2 hover:bg-blue-700 ${loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : emailData.send_type === "scheduled" ? (
            <>
              Schedule Email
              <Calendar className="w-5 h-5" />
            </>
          ) : (
            <>
              Send Email
              <Send className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (currentTab) {
      case 0:
        return renderAdvancedTab();
      case 1:
        return renderEmailTab();
      case 2:
        return renderRecipientsTab();
      case 3:
        return renderSchedulingTab();
      default:
        return renderEmailTab();
    }
  };

  const tabs = ["ADVANCED", "EMAIL", "RECIPIENTS", "SCHEDULING & SETTINGS"];

  return (
    <div className="flex h-screen bg-blue-50 relative">
      {/* Spinner Overlay */}
      {showSpinner && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-[10001]">
          <Spinner />
        </div>
      )}
      {/* Sidebar */}
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Label />
        <div className="flex-1 overflow-y-auto">
          <div className="relative z-10 container mx-auto px-4 py-8 pt-20 pb-20 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xs border border-blue-200 shadow-md">
                {/* Header */}
                <div className="bg-blue-100 px-6 py-3 rounded-t-xs flex justify-between items-center">
                  <h2 className="text-lg font-bold text-[#061338]">
                    Add Email Notification
                  </h2>
                  <button
                    onClick={handleDiscardChanges}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white border-b border-blue-200">
                  <nav className="flex space-x-8 px-6">
                    {tabs.map((tab, index) => (
                      <button
                        key={tab}
                        onClick={() => setCurrentTab(index)}
                        className={`py-4 px-1 border-b-2 text-base font-medium transition-colors ${currentTab === index
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-slate-700 hover:text-blue-600 cursor-pointer"
                          }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-8">
                  <div className="space-y-6">{renderTabContent()}</div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={handleSaveDraft}
                      className={`px-4 py-3 rounded-xs cursor-pointer bg-amber-600 text-white text-base font-semibold flex items-center gap-2 hover:bg-amber-700 ${loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    >
                      <Save className="w-5 h-5" />
                      Save to Draft
                    </button>
                    <button
                      onClick={handleDiscardChanges}
                      className="px-4 py-3 rounded-xs cursor-pointer bg-red-600 text-white text-base font-semibold flex items-center gap-2 hover:bg-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                      Discard Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewEmail;