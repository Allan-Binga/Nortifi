import Navbar from "../components/Navbar";
import BackgroundWaves from "../components/BackgroundWaves";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  Trash2,
  ArrowLeft,
  Plus,
  Calendar,
  Send,
  Save,
} from "lucide-react";
import axios from "axios";
import { backend } from "../server";
import { notify } from "../utils/toast";
import { fetchSMTPs } from "../utils/smtp";

function NewEmail() {
  const [currentTab, setCurrentTab] = useState(0);
  const [contacts, setContacts] = useState([]);
  const [emailServers, setEmailServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState("");
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
  });
  const [selectedContacts, setSelectedContacts] = useState([]); // New state for selected contact IDs

  // Fetch SMTP servers for clients to select
  useEffect(() => {
    const loadSMTPs = async () => {
      try {
        const servers = await fetchSMTPs();
        setEmailServers(servers);

        // Auto-select the first server if available
        if (servers.length > 0) {
          setSelectedServer(servers[0].config_id);
        }
      } catch (error) {
        console.error("Error fetching SMTP servers:", error);
      }
    };

    loadSMTPs();
  }, []);

  // Fetch contacts on mount
  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${backend}/contacts/all-contacts`, {
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

  // Sync selectedContacts and recipients when recipientMode or exclude_unsubscribed changes
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

  // Handle individual checkbox toggle
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
      console.log("Campaign Response:", response.data);

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
      setCurrentTab(0);
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
        smtpConfigId: selectedServer,
        saveAsDraft: true, // 👈 key flag
      };

      const response = await axios.post(
        `${backend}/emails/smtp/send-email`,
        payload,
        { withCredentials: true }
      );

      notify.success("Draft saved successfully!");
      console.log("Draft Response:", response.data);

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
    setCurrentTab(0);
    notify.info("Changes discarded");
  };

  const renderEmailTab = () => (
    <div className="space-y-6">
      {/* Label */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2">
          Label <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={emailData.label}
          onChange={(e) => handleInputChange("label", e.target.value)}
          placeholder="e.g Welcome onboard"
          className="w-full px-4 py-3 rounded-lg shadow-sm border border-slate-200 
                 focus:outline-none focus:ring-2 focus:ring-teal-500 
                 focus:border-transparent transition duration-200"
        />
      </div>

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
          className="w-full px-4 py-3 rounded-lg shadow-sm border border-slate-200   
                 focus:outline-none focus:ring-2 focus:ring-teal-500 
                 focus:border-transparent transition duration-200"
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Body <span className="text-red-500">*</span>
        </label>
        <div
          className="rounded-lg shadow-sm border border-slate-200
               focus-within:outline-none focus-within:ring-2 focus-within:ring-teal-500 
               focus-within:border-transparent transition duration-200"
        >
          <textarea
            value={emailData.body}
            onChange={(e) => handleInputChange("body", e.target.value)}
            placeholder={`Hello John Doe,\n\nWelcome to Nortifi!`}
            rows="8"
            className="w-full p-4 resize-none bg-transparent 
                 focus:outline-none focus:ring-0"
          />
        </div>
      </div>

      {/* Next button */}
      <div className="flex justify-end">
        <button
          onClick={handleNext}
          className="px-8 py-3 cursor-pointer rounded-lg shadow-md 
               bg-gradient-to-r from-teal-500 to-teal-600 
               text-white text-base flex items-center gap-2
               hover:from-teal-600 hover:to-teal-700 
               transition duration-200"
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
          className={`px-6 py-3 rounded-lg shadow-sm font-medium text-base transition duration-200 ${
            emailData.recipientMode === "individual"
              ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Individually
        </button>
        <button
          onClick={() => handleInputChange("recipientMode", "bulk")}
          className={`px-6 py-3 rounded-lg shadow-sm font-medium text-base transition duration-200 ${
            emailData.recipientMode === "bulk"
              ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Mass Sending
        </button>
      </div>

      {/* Recipients */}
      <div>
        {/* Info Label */}
        <p className="text-xs text-slate-500 mb-2">
          Make sure the contacts with the emails you want to use are added
          first.{" "}
          <a href="/contacts" className="text-teal-500 hover:underline">
            Go to Contacts
          </a>
        </p>

        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Recipients <span className="text-red-500">*</span>
          {emailData.recipientMode === "individual" && (
            <span className="text-slate-500 text-xs font-normal">
              {" "}
              (Separate multiple emails with a comma)
            </span>
          )}
        </label>
        {emailData.recipientMode === "individual" ? (
          <div
            className="rounded-lg shadow-sm border border-slate-200
                       focus-within:outline-none focus-within:ring-2 focus-within:ring-teal-500 
                       focus-within:border-transparent transition duration-200"
          >
            <textarea
              value={emailData.recipients}
              onChange={(e) => handleInputChange("recipients", e.target.value)}
              placeholder="team@nortifi.com, john.doe@nortifi.com"
              rows="4"
              className="w-full p-4 resize-none bg-transparent 
                         focus:outline-none focus:ring-0"
            />
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg shadow-sm">
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
                    <tr className="bg-slate-50 sticky top-0">
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
                              const filteredContacts =
                                emailData.exclude_unsubscribed
                                  ? contacts.filter(
                                      (contact) => !contact.unsubscribed
                                    )
                                  : contacts;
                              const newSelected = filteredContacts.map(
                                (contact) => contact.contact_id
                              );
                              setSelectedContacts(newSelected);
                              setEmailData((prev) => ({
                                ...prev,
                                recipients: filteredContacts
                                  .map((contact) => contact.email)
                                  .join(", "),
                              }));
                            }
                          }}
                          className="w-4 h-4 text-teal-500 border-slate-200 rounded 
                                     focus:ring-2 focus:ring-teal-500 focus:ring-offset-1"
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Phone
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts
                      .filter(
                        (contact) =>
                          !emailData.exclude_unsubscribed ||
                          !contact.unsubscribed
                      )
                      .map((contact) => (
                        <tr
                          key={contact.contact_id}
                          className="border-t border-slate-200 hover:bg-slate-50"
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
                              className="w-4 h-4 text-teal-500 border-slate-200 rounded 
                                         focus:ring-2 focus:ring-teal-500 focus:ring-offset-1"
                            />
                          </td>
                          <td className="px-4 py-3">{contact.name}</td>
                          <td className="px-4 py-3">{contact.email}</td>
                          <td className="px-4 py-3">{contact.phone_number}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Exclude Unsubscribed Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="exclude_unsubscribed"
          checked={emailData.exclude_unsubscribed}
          onChange={(e) =>
            handleInputChange("exclude_unsubscribed", e.target.checked)
          }
          className="w-4 h-4 text-teal-500 border-slate-200 rounded 
                     focus:ring-2 focus:ring-teal-500 focus:ring-offset-1"
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
          className="px-8 py-3 cursor-pointer rounded-md shadow-md 
                     bg-gradient-to-r from-slate-500 to-slate-600 
                     text-white text-base flex items-center gap-2
                     hover:from-slate-600 hover:to-slate-700 
                     transition duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          Previous
        </button>
        <button
          onClick={handleNext}
          className="px-8 py-3 cursor-pointer rounded-md shadow-md 
                     bg-gradient-to-r from-teal-500 to-teal-600 
                     text-white text-base flex items-center gap-2
                     hover:from-teal-600 hover:to-teal-700 
                     transition duration-200"
        >
          Next
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderAdvancedTab = () => (
    <div className="space-y-6">
      {/* SMTP Server Selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Select SMTP Server
        </label>
        <select
          value={selectedServer}
          onChange={(e) => setSelectedServer(e.target.value)}
          className="w-full px-4 py-3 rounded-lg shadow-sm border border-slate-200 
             focus:outline-none focus:ring-2 focus:ring-teal-500 
             focus:border-transparent transition duration-200 bg-white"
        >
          {emailServers.length > 0 ? (
            emailServers.map((server) => (
              <option key={server.config_id} value={server.config_id}>
                {server.name || server.smtp_user}
              </option>
            ))
          ) : (
            <option disabled>No servers available</option>
          )}
        </select>
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
          className="w-full px-4 py-3 rounded-lg shadow-sm border border-slate-200 
                   focus:outline-none focus:ring-2 focus:ring-teal-500 
                   focus:border-transparent transition duration-200"
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
          className="w-full px-4 py-3 rounded-lg shadow-sm border border-slate-200 
                   focus:outline-none focus:ring-2 focus:ring-teal-500 
                   focus:border-transparent transition duration-200"
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
          className="w-full px-4 py-3 rounded-lg shadow-sm border border-slate-200 
                   focus:outline-none focus:ring-2 focus:ring-teal-500 
                   focus:border-transparent transition duration-200"
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
          className="w-full px-4 py-3 rounded-lg shadow-sm border border-slate-200 
                   focus:outline-none focus:ring-2 focus:ring-teal-500 
                   focus:border-transparent transition duration-200"
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          className="px-8 py-3 cursor-pointer rounded-lg shadow-md 
                   bg-gradient-to-r from-slate-500 to-slate-600 
                   text-white text-base flex items-center gap-2
                   hover:from-slate-600 hover:to-slate-700 
                   transition duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          Previous
        </button>
        <button
          onClick={handleNext}
          className="px-8 py-3 cursor-pointer rounded-lg shadow-md 
                   bg-gradient-to-r from-teal-500 to-teal-600 
                   text-white text-base flex items-center gap-2
                   hover:from-teal-600 hover:to-teal-700 
                   transition duration-200"
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
            className={`px-6 py-3 rounded-lg shadow-sm font-medium text-base transition duration-200 ${
              emailData.send_type === "immediate"
                ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Send Immediately
          </button>
          <button
            onClick={() => handleInputChange("send_type", "scheduled")}
            className={`px-6 py-3 rounded-lg shadow-sm font-medium text-base transition duration-200 ${
              emailData.send_type === "scheduled"
                ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
              onChange={(e) =>
                handleInputChange("scheduled_at", e.target.value)
              }
              className="w-full px-4 py-3 rounded-lg shadow-sm border border-slate-200 
                       focus:outline-none focus:ring-2 focus:ring-teal-500 
                       focus:border-transparent transition duration-200"
            />
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Timezone
            </label>
            <select
              value={emailData.timezone}
              onChange={(e) => handleInputChange("timezone", e.target.value)}
              className="w-full px-4 py-3 rounded-lg shadow-sm border border-slate-200 
                       focus:outline-none focus:ring-2 focus:ring-teal-500 
                       focus:border-transparent transition duration-200"
            >
              <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Los_Angeles">
                America/Los_Angeles (PST)
              </option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          {/* Recurring Rule */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Recurring Rule
            </label>
            <select
              value={emailData.recurring_rule}
              onChange={(e) =>
                handleInputChange("recurring_rule", e.target.value)
              }
              className="w-full px-4 py-3 rounded-lg shadow-sm border border-slate-200 
                       focus:outline-none focus:ring-2 focus:ring-teal-500 
                       focus:border-transparent transition duration-200"
            >
              <option value="">No Recurring</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </>
      )}

      {/* Force Send Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="forceSend"
          checked={emailData.forceSend}
          onChange={(e) => handleInputChange("forceSend", e.target.checked)}
          className="w-4 h-4 text-teal-500 border-slate-200 rounded 
                   focus:ring-2 focus:ring-teal-500 focus:ring-offset-1"
        />
        <label
          htmlFor="forceSend"
          className="ml-2 block text-xs font-semibold text-slate-700"
        >
          Force send (bypass normal validation)
        </label>
      </div>

      {/* Footer Locations Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-xs font-semibold text-slate-700">
            Footer Locations
          </label>
          <button
            type="button"
            onClick={addFooterLocation}
            className="px-4 py-2 rounded-lg shadow-sm 
                     bg-gradient-to-r from-teal-500 to-teal-600 
                     text-white text-sm font-medium 
                     hover:from-teal-600 hover:to-teal-700 
                     transition duration-200 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Location
          </button>
        </div>

        {emailData.footerLocations.map((location, index) => (
          <div
            key={index}
            className="p-4 border border-slate-200 rounded-lg mb-4 bg-slate-50"
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Location Name (e.g., Nairobi Office)"
                value={location.location}
                onChange={(e) =>
                  handleFooterLocationChange(index, "location", e.target.value)
                }
                className="w-full px-4 py-3 rounded-lg shadow-sm border border-slate-200 
                         focus:outline-none focus:ring-2 focus:ring-teal-500 
                         focus:border-transparent transition duration-200"
              />
              <input
                type="text"
                placeholder="Address (e.g., 123 Main St, Nairobi)"
                value={location.address}
                onChange={(e) =>
                  handleFooterLocationChange(index, "address", e.target.value)
                }
                className="w-full px-4 py-3 rounded-lg shadow-sm border border-slate-200 
                         focus:outline-none focus:ring-2 focus:ring-teal-500 
                         focus:border-transparent transition duration-200"
              />
              <input
                type="text"
                placeholder="Phone (e.g., +254 123 456 789)"
                value={location.phone}
                onChange={(e) =>
                  handleFooterLocationChange(index, "phone", e.target.value)
                }
                className="w-full px-4 py-3 rounded-lg shadow-sm border border-slate-200 
                         focus:outline-none focus:ring-2 focus:ring-teal-500 
                         focus:border-transparent transition duration-200"
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
          className="px-8 py-3 cursor-pointer rounded-lg shadow-md 
                   bg-gradient-to-r from-slate-500 to-slate-600 
                   text-white text-base flex items-center gap-2
                   hover:from-slate-600 hover:to-slate-700 
                   transition duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          Previous
        </button>
        <button
          onClick={handleSendEmail}
          disabled={loading}
          className={`px-8 py-3 cursor-pointer rounded-lg shadow-md 
                   text-white text-base flex items-center gap-2
                   transition duration-200 ${
                     loading
                       ? "bg-slate-400 cursor-not-allowed"
                       : emailData.send_type === "scheduled"
                       ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                       : "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
                   }`}
        >
          {loading ? (
            "Processing..."
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
        return renderEmailTab();
      case 1:
        return renderRecipientsTab();
      case 2:
        return renderAdvancedTab();
      case 3:
        return renderSchedulingTab();
      default:
        return renderEmailTab();
    }
  };

  const tabs = ["EMAIL", "RECIPIENTS", "ADVANCED", "SCHEDULING & SETTINGS"];

  return (
    <div className="relative min-h-screen bg-gray-100">
      <Navbar />

      <div className="relative z-10 container mx-auto px-4 py-8 pt-30">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  Add Email Notification
                </h2>
                <button
                  onClick={handleDiscardChanges}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab, index) => (
                  <button
                    key={tab}
                    onClick={() => setCurrentTab(index)}
                    className={`py-4 px-1 border-b-2 text-sm transition-colors ${
                      currentTab === index
                        ? "border-teal-500 text-teal-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 cursor-pointer"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">{renderTabContent()}</div>

            {/* Discard Changes Button */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              {/* Save to Draft */}
              <button
                onClick={handleSaveDraft}
                className="px-5 py-2.5 flex items-center gap-2 rounded-lg shadow-sm cursor-pointer
      bg-gradient-to-r from-teal-500 to-teal-600 
      text-white font-medium 
      hover:from-teal-600 hover:to-teal-700 
      transition duration-200"
              >
                <Save className="w-5 h-5" />
                Save to Draft
              </button>

              {/* Discard Changes */}
              <button
                onClick={handleDiscardChanges}
                className="px-5 py-2.5 flex items-center gap-2 rounded-lg shadow-sm cursor-pointer
      bg-gradient-to-r from-red-500 to-red-600 
      text-white font-md
      hover:from-red-600 hover:to-red-700 
      transition duration-200"
              >
                <Trash2 className="w-5 h-5" />
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewEmail;
