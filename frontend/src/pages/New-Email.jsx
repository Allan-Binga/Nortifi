import Sidebar from "../components/Sidebar";
import Label from "../components/Label";
import Spinner from "../components/Spinner";
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  Calendar,
  Send,
  ChevronDown,
  Maximize2,
  Minimize2,
  Loader2,
  X,
  Upload,
} from "lucide-react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { backend } from "../server";
import { notify } from "../utils/toast";
import { useFetchSMTPs } from "../utils/smtp";
import { useWebsite } from "../context/WebsiteContext";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

// CSS for smooth tab transitions
const tabTransitionStyles = `
  .tab-content {
    transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
  }
  .tab-content-enter {
    opacity: 0;
    transform: translateY(10px);
  }
  .tab-content-enter-active {
    opacity: 1;
    transform: translateY(0);
  }
  .tab-content-exit {
    opacity: 1;
    transform: translateY(0);
  }
  .tab-content-exit-active {
    opacity: 0;
    transform: translateY(10px);
  }
`;

function NewEmail() {
  const { activeWebsite } = useWebsite();
  const { fetchSMTPs } = useFetchSMTPs();
  const [currentTab, setCurrentTab] = useState(0);
  const [contacts, setContacts] = useState([]);
  const [emailServers, setEmailServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState("");
  const [showSpinner, setShowSpinner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]); // Store File objects
  const fileInputRef = useRef(null);
  const quillRef = useRef(null);
  const [emailData, setEmailData] = useState({
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
    socialMedia: {
      facebook: "",
      twitter: "",
      linkedin: "",
      instagram: "",
    },
    companyInfo: {
      name: "",
      location: "",
      customerCare: "",
      privacyPolicy: "",
      termsConditions: "",
    },
    attachments: [], // Store { filename: string } for display
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

  // Handle file selection
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    if (!files || files.length === 0) return;

    if (files.length + emailData.attachments.length > 5) {
      notify.error("Maximum 5 attachments allowed");
      return;
    }

    setFileLoading(true);
    const newAttachments = files.map((file) => ({
      filename: file.name,
    }));

    setEmailData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments],
    }));
    setSelectedFiles((prev) => [...prev, ...files]);
    notify.success("Files selected successfully!");
    setFileLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
  };

  // Remove attachment
  const removeAttachment = (index) => {
    setEmailData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Auto-save draft
  const autoSaveDraft = async () => {
    try {
      const formData = new FormData();
      formData.append("campaignId", emailData.campaignId || "");
      formData.append("subject", emailData.subject);
      formData.append("body", emailData.body);
      formData.append("fromName", emailData.fromName);
      formData.append("replyToEmail", emailData.replyToEmail);
      formData.append(
        "toEmails",
        JSON.stringify(
          emailData.recipients
            .split(",")
            .map((e) => e.trim())
            .filter((e) => e.length > 0)
        )
      );
      formData.append(
        "cc",
        JSON.stringify(
          emailData.ccEmails
            ? emailData.ccEmails.split(",").map((e) => e.trim()).filter((e) => e)
            : []
        )
      );
      formData.append(
        "bcc",
        JSON.stringify(
          emailData.bccEmails
            ? emailData.bccEmails.split(",").map((e) => e.trim()).filter((e) => e)
            : []
        )
      );
      formData.append("send_type", emailData.send_type);
      formData.append("scheduled_at", emailData.scheduled_at || "");
      formData.append("timezone", emailData.timezone);
      formData.append("recurring_rule", emailData.recurring_rule || "");
      formData.append("forceSend", emailData.forceSend);
      formData.append(
        "footerLocations",
        JSON.stringify(emailData.footerLocations)
      );
      formData.append("smtpConfigId", selectedServer);
      formData.append("saveAsDraft", true);
      formData.append("socialMedia", JSON.stringify(emailData.socialMedia));
      formData.append("companyInfo", JSON.stringify(emailData.companyInfo));
      formData.append("tags", JSON.stringify(emailData.tags || []));
      formData.append("exclude_unsubscribed", emailData.exclude_unsubscribed);

      // Append selected files
      selectedFiles.forEach((file) => {
        formData.append("attachments", file);
      });

      const response = await axios.post(
        `${backend}/emails/smtp/send-email`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );
      setEmailData((prev) => ({
        ...prev,
        campaignId: response.data.campaignId,
      }));
      notify.success("Draft saved!");
    } catch (error) {
      console.error("Auto-save Draft Error:", error);
      notify.error("Failed to auto-save draft");
    }
  };

  // Fetch draft
  useEffect(() => {
    const fetchDraft = async () => {
      if (!draftId) return;
      try {
        const { data } = await axios.get(
          `${backend}/emails/campaign/${draftId}`,
          { withCredentials: true }
        );
        setEmailData({
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
          exclude_unsubscribed: data.exclude_unsubscribed ?? true,
          smtpConfigId: data.smtp_config_id || "",
          campaignId: data.campaign_id,
          status: data.status || "draft",
          isDraft: data.is_draft ?? true,
          socialMedia: data.social_media || {
            facebook: "",
            twitter: "",
            linkedin: "",
            instagram: "",
          },
          companyInfo: data.company_info || {
            name: "",
            location: "",
            customerCare: "",
            privacyPolicy: "",
            termsConditions: "",
          },
          attachments: data.attachments || [], // Load attachment metadata
        });
        // Note: Files must be re-uploaded by the user
        setSelectedFiles([]); // Reset selectedFiles as File objects aren't persisted
      } catch (error) {
        console.error("Error fetching draft:", error);
        notify.error("Failed to fetch draft");
      }
    };
    fetchDraft();
  }, [draftId]);

  // Fetch SMTPs
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
        notify.error("Failed to fetch SMTP servers");
      }
    };
    loadSMTPs();
  }, [activeWebsite, fetchSMTPs]);

  // Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${backend}/contacts/all-contacts/website/${activeWebsite.website_id}`,
          { withCredentials: true }
        );
        setContacts(response.data);
      } catch (error) {
        notify.error("Failed to fetch contacts");
        console.error("Error fetching contacts:", error);
      } finally {
        setLoading(false);
      }
    };
    if (activeWebsite) {
      fetchContacts();
    }
  }, [activeWebsite]);

  // Handle recipient mode changes
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
      setEmailData((prev) => ({ ...prev, recipients: "" }));
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

  const handleSocialMediaChange = (platform, value) => {
    setEmailData((prev) => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value,
      },
    }));
  };

  const handleCompanyInfoChange = (field, value) => {
    setEmailData((prev) => ({
      ...prev,
      companyInfo: {
        ...prev.companyInfo,
        [field]: value,
      },
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

  const handleNext = async () => {
    if (currentTab < tabs.length - 1) {
      await autoSaveDraft();
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
    if (!selectedServer) {
      notify.error("Please select an SMTP server");
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
      const formData = new FormData();
      formData.append("campaignId", emailData.campaignId || "");
      formData.append("subject", emailData.subject);
      formData.append("body", emailData.body);
      formData.append("fromName", emailData.fromName);
      formData.append("replyToEmail", emailData.replyToEmail);
      formData.append(
        "toEmails",
        JSON.stringify(
          emailData.recipients
            .split(",")
            .map((e) => e.trim())
            .filter((e) => e)
        )
      );
      formData.append(
        "cc",
        JSON.stringify(
          emailData.ccEmails
            ? emailData.ccEmails.split(",").map((e) => e.trim()).filter((e) => e)
            : []
        )
      );
      formData.append(
        "bcc",
        JSON.stringify(
          emailData.bccEmails
            ? emailData.bccEmails.split(",").map((e) => e.trim()).filter((e) => e)
            : []
        )
      );
      formData.append("send_type", emailData.send_type);
      formData.append("scheduled_at", emailData.scheduled_at || "");
      formData.append("timezone", emailData.timezone);
      formData.append("recurring_rule", emailData.recurring_rule || "");
      formData.append("forceSend", emailData.forceSend);
      formData.append(
        "footerLocations",
        JSON.stringify(emailData.footerLocations)
      );
      formData.append("smtpConfigId", selectedServer);
      formData.append("socialMedia", JSON.stringify(emailData.socialMedia));
      formData.append("companyInfo", JSON.stringify(emailData.companyInfo));
      formData.append(
        "filter",
        JSON.stringify({
          tags: emailData.tags,
          exclude_unsubscribed: emailData.exclude_unsubscribed,
        })
      );

      // Append selected files
      selectedFiles.forEach((file) => {
        formData.append("attachments", file);
      });

      const response = await axios.post(
        `${backend}/emails/smtp/send-email`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );
      notify.success(
        emailData.send_type === "scheduled"
          ? "Email scheduled successfully!"
          : "Email sent successfully!"
      );
      setEmailData({
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
        socialMedia: {
          facebook: "",
          twitter: "",
          linkedin: "",
          instagram: "",
        },
        companyInfo: {
          name: "",
          location: "",
          customerCare: "",
          privacyPolicy: "",
          termsConditions: "",
        },
        attachments: [],
      });
      setSelectedFiles([]);
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

  const handleDiscardChanges = () => {
    setEmailData({
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
      socialMedia: {
        facebook: "",
        twitter: "",
        linkedin: "",
        instagram: "",
      },
      companyInfo: {
        name: "",
        location: "",
        customerCare: "",
        privacyPolicy: "",
        termsConditions: "",
      },
      attachments: [],
    });
    setSelectedFiles([]);
    notify.info("Changes discarded");
    setShowSpinner(true);
    setTimeout(() => {
      navigate("/home");
    }, 2000);
  };

  const toggleEditorModal = () => {
    setIsEditorModalOpen((prev) => !prev);
  };

  // Email Tab
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
        <label className="block text-xs font-semibold text-slate-700">
          Body <span className="text-red-500">*</span>
        </label>
        <div className="flex justify-end mb-2">
          <button
            onClick={toggleEditorModal}
            className="p-2 text-blue-600 hover:text-blue-800"
            title={isEditorModalOpen ? "Close Editor" : "Expand Editor"}
          >
            {isEditorModalOpen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
        {!isEditorModalOpen && (
          <div className="rounded-sm mb-6">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={emailData.body}
              onChange={(content) => handleInputChange("body", content)}
              placeholder="Hello John Doe, Welcome to Nortifi!"
              className="bg-white rounded-xs"
              style={{ height: "200px" }}
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  [{ font: [] }],
                  [{ size: ["small", false, "large", "huge"] }],
                  ["bold", "italic", "underline", "strike"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["link"],
                  ["clean"],
                ],
              }}
            />
          </div>
        )}
      </div>

      {/* Attachments */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Attachments <span className="text-slate-500">(Optional, max 5 files, 10MB each)</span>
        </label>
        <div className="flex items-center gap-4 mb-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className={`px-4 py-2 rounded-xs cursor-pointer bg-blue-600 text-white text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition duration-200 ${fileLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            <Upload className="w-4 h-4" />
            {fileLoading ? "Processing..." : "Upload Files"}
          </label>
        </div>
        {emailData.attachments.length > 0 && (
          <div className="border border-blue-300 rounded-xs p-4 bg-blue-50">
            <h4 className="text-xs font-semibold text-slate-700 mb-2">Selected Files</h4>
            <ul className="space-y-2">
              {emailData.attachments.map((file, index) => (
                <li key={index} className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">{file.filename}</span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="text-red-500 hover:text-red-700 text-xs font-medium"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-end mt-20">
        <button
          onClick={handleNext}
          className="px-4 py-3 rounded-xs cursor-pointer bg-blue-600 text-white text-base font-semibold flex items-center gap-2 hover:bg-blue-700"
        >
          Next
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Editor Modal */}
      {isEditorModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[1000] bg-transparent">
          <div className="bg-white border border-blue-300 rounded-xs shadow-sm w-full max-w-6xl h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-blue-200">
              <h3 className="text-lg font-semibold text-slate-700">Compose Email</h3>
              <button
                onClick={toggleEditorModal}
                className="text-slate-500 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={emailData.body}
                onChange={(content) => handleInputChange("body", content)}
                placeholder="Hello John Doe, Welcome to Nortifi!"
                className="bg-white"
                style={{ height: "calc(100% - 40px)" }}
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    [{ font: [] }],
                    [{ size: ["small", false, "large", "huge"] }],
                    ["bold", "italic", "underline", "strike"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["link"],
                    ["clean"],
                  ],
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Recipients Tab
  const renderRecipientsTab = () => (
    <div className="space-y-6">
      <p className="text-sm text-slate-600 mb-4">
        The default behavior is to send the email to the same recipients. If you
        want to send this email to different recipients conditionally, you can
        send individually.
      </p>
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
                  className={`text-slate-500 transition-transform duration-300 ${genderDropdownOpen ? "rotate-180" : "rotate-0"
                    }`}
                  size={18}
                />
              </button>
              {genderDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-blue-300 rounded-xs shadow-lg">
                  {["All", "Male", "Female"].map((option) => (
                    <div
                      key={option}
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          gender: option === "All" ? "" : option,
                        }));
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
                  className={`text-slate-500 transition-transform duration-300 ${websiteDropdownOpen ? "rotate-180" : "rotate-0"
                    }`}
                  size={18}
                />
              </button>
              {websiteDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-blue-300 rounded-xs shadow-lg max-h-60 overflow-y-auto">
                  {["All", ...new Set(contacts.map((c) => c.website))].map(
                    (site) => (
                      <div
                        key={site}
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            website: site === "All" ? "" : site,
                          }));
                          setWebsiteDropdownOpen(false);
                        }}
                        className="px-4 py-2 text-base font-medium text-slate-700 hover:bg-blue-50 cursor-pointer"
                      >
                        {site}
                      </div>
                    )
                  )}
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
                    <th className="px-4 py-3 text-left font-semibold">
                      First Name
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Last Name
                    </th>
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
                    .filter((c) =>
                      filters.gender ? c.gender === filters.gender : true
                    )
                    .filter((c) =>
                      filters.website ? c.website === filters.website : true
                    )
                    .map((contact) => (
                      <tr
                        key={contact.contact_id}
                        className="border-t border-blue-300 hover:bg-blue-50"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedContacts.includes(
                              contact.contact_id
                            )}
                            onChange={() =>
                              handleContactToggle(contact.contact_id)
                            }
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
      <div className="flex items-center">
        <input
          type="checkbox"
          id="exclude_unsubscribed"
          checked={emailData.exclude_unsubscribed}
          onChange={(e) =>
            handleInputChange("exclude_unsubscribed", e.target.checked)
          }
          className="w-4 h-4 text-blue-600 border-blue-300 rounded focus:ring-2 focus:ring-blue-100"
        />
        <label
          htmlFor="exclude_unsubscribed"
          className="ml-2 block text-xs font-semibold text-slate-700"
        >
          Exclude unsubscribed contacts
        </label>
      </div>
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          className="px-4 py-3 rounded-xs cursor-pointer bg-white text-blue-500 border border-blue-300 text-base font-semibold flex items-center gap-2 hover:bg-blue-50 transition"
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

  // Advanced Tab
  const renderAdvancedTab = () => (
    <div className="space-y-6">
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
            {emailServers.find((server) => server.config_id === selectedServer)
              ?.name || "Select SMTP Server"}
            <ChevronDown
              className={`text-slate-500 transition-transform duration-300 ${serverDropdownOpen ? "rotate-180" : "rotate-0"
                }`}
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
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          className="px-4 py-3 rounded-xs cursor-pointer bg-white text-blue-500 border border-blue-300 text-base font-semibold flex items-center gap-2 hover:bg-blue-50 transition"
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

  // Footer Settings Tab
  const renderFooterTab = () => (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-xs font-semibold text-slate-700">
            Footer Locations
          </label>
          <button
            type="button"
            onClick={addFooterLocation}
            className="px-4 py-2 rounded-xs bg-amber-600 text-white text-sm font-medium flex items-center gap-2 hover:bg-amber-700 transition duration-200"
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
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Company Information <span className="text-slate-500">(Optional)</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <label className="text-xs text-slate-600">Company Name</label>
            <input
              type="text"
              value={emailData.companyInfo.name}
              onChange={(e) => handleCompanyInfoChange("name", e.target.value)}
              className={inputStyles}
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">Company Location</label>
            <input
              type="text"
              value={emailData.companyInfo.location}
              onChange={(e) =>
                handleCompanyInfoChange("location", e.target.value)
              }
              className={inputStyles}
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">Customer Care Contact</label>
            <input
              type="text"
              value={emailData.companyInfo.customerCare}
              onChange={(e) =>
                handleCompanyInfoChange("customerCare", e.target.value)
              }
              className={inputStyles}
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">Privacy Policy URL</label>
            <input
              type="url"
              value={emailData.companyInfo.privacyPolicy}
              onChange={(e) =>
                handleCompanyInfoChange("privacyPolicy", e.target.value)
              }
              className={inputStyles}
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">
              Terms and Conditions URL
            </label>
            <input
              type="url"
              value={emailData.companyInfo.termsConditions}
              onChange={(e) =>
                handleCompanyInfoChange("termsConditions", e.target.value)
              }
              className={inputStyles}
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Social Media Links <span className="text-slate-500">(Optional)</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-2">
            <div
              dangerouslySetInnerHTML={{
                __html: `<svg role="img" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><title>Facebook</title><path fill="#1877F2" d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg>`,
              }}
            />
            <input
              type="url"
              placeholder="Facebook URL"
              value={emailData.socialMedia.facebook}
              onChange={(e) =>
                handleSocialMediaChange("facebook", e.target.value)
              }
              className={inputStyles}
            />
          </div>
          <div className="flex items-center gap-2">
            <div
              dangerouslySetInnerHTML={{
                __html: `<svg role="img" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><title>X</title><path fill="#000" d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/></svg>`,
              }}
            />
            <input
              type="url"
              placeholder="Twitter/X URL"
              value={emailData.socialMedia.twitter}
              onChange={(e) => handleSocialMediaChange("twitter", e.target.value)}
              className={inputStyles}
            />
          </div>
          <div className="flex items-center gap-2">
            <div
              dangerouslySetInnerHTML={{
                __html: `<svg role="img" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><title>Instagram</title><path fill="#E1306C" d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/></svg>`,
              }}
            />
            <input
              type="url"
              placeholder="Instagram URL"
              value={emailData.socialMedia.instagram}
              onChange={(e) =>
                handleSocialMediaChange("instagram", e.target.value)
              }
              className={inputStyles}
            />
          </div>
          <div className="flex items-center gap-2">
            <div
              dangerouslySetInnerHTML={{
                __html: `<svg role="img" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><title>LinkedIn</title><path fill="#0077B5" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.065 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
              }}
            />
            <input
              type="url"
              placeholder="LinkedIn URL"
              value={emailData.socialMedia.linkedin}
              onChange={(e) =>
                handleSocialMediaChange("linkedin", e.target.value)
              }
              className={inputStyles}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          className="px-4 py-3 rounded-xs cursor-pointer bg-white text-blue-500 border border-blue-300 text-base font-semibold flex items-center gap-2 hover:bg-blue-50 transition"
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

  // Sending and Scheduling Tab
  const renderSchedulingTab = () => (
    <div className="space-y-6">
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
                {recurringOptions.find(
                  (opt) => opt.value === emailData.recurring_rule
                )?.label || "Select Recurring Rule"}
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
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          className="px-4 py-3 rounded-xs cursor-pointer bg-white text-blue-600 border border-blue-600 text-base font-semibold flex items-center gap-2 hover:bg-blue-50 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Previous
        </button>
        <button
          onClick={handleSendEmail}
          disabled={loading}
          className={`px-4 py-3 rounded-xs cursor-pointer bg-amber-600 text-white text-base font-semibold flex items-center gap-2 hover:bg-amber-700 ${loading ? "opacity-50 cursor-not-allowed" : ""
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
    const tabComponents = [
      renderEmailTab(),
      renderRecipientsTab(),
      renderAdvancedTab(),
      renderFooterTab(),
      renderSchedulingTab(),
    ];

    return (
      <div className="tab-content" key={currentTab}>
        {tabComponents[currentTab]}
      </div>
    );
  };

  const tabs = [
    "Email",
    "Recipients",
    "Advanced",
    "Footer Settings",
    "Sending and Scheduling",
  ];

  return (
    <div className="flex h-screen bg-blue-50 relative">
      <style>{tabTransitionStyles}</style>
      {showSpinner && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-[10001]">
          <Spinner />
        </div>
      )}
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Label />
        <div className="flex-1 overflow-y-auto">
          <div className="relative z-10 container mx-auto px-4 py-8 pt-20 pb-20 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="bg-white rounded-xs border border-blue-200 shadow-md">
                <div className="bg-blue-100 px-6 py-3 rounded-t-xs flex justify-between items-center">
                  <h2 className="text-lg font-bold text-[#061338]">
                    Add Email Notification
                  </h2>
                  <div className="relative group">
                    <button
                      onClick={handleDiscardChanges}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                    <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -mt-8 -ml-10">
                      Discard Changes
                    </span>
                  </div>
                </div>
                <div className="bg-white border-b border-blue-200">
                  <nav className="flex space-x-8 px-6">
                    {tabs.map((tab, index) => (
                      <button
                        key={tab}
                        onClick={() => setCurrentTab(index)}
                        className={`py-4 px-1 border-b-2 text-base font-medium transition-colors ${currentTab === index
                            ? "border-amber-600 text-amber-500"
                            : "border-transparent text-slate-700 hover:text-amber-500 cursor-pointer"
                          }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </nav>
                </div>
                <div className="p-8">{renderTabContent()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewEmail;