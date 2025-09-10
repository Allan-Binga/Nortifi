import Navbar from "../components/Navbar";
import BackgroundWaves from "../components/BackgroundWaves";
import { useState, useEffect } from "react";
import axios from "axios";
import { backend } from "../server";
import { notify } from "../utils/toast";

function NewEmail() {
  const [currentTab, setCurrentTab] = useState(0);
  const [contacts, setContacts] = useState({});
  const [loading, setLoading] = useState(false);
  const [emailData, setEmailData] = useState({
    // Email tab
    label: "",
    subject: "",
    body: "",

    // Recipients tab
    recipientMode: "individual", // "individual" or "bulk"
    recipients: "",

    // Advanced tab
    fromName: "",
    fromEmail: "",
    replyToEmail: "",
    ccEmails: "",
    bccEmails: "",

    // Scheduling & Settings tab
    send_type: "immediate", // "immediate" or "scheduled"
    scheduled_at: "",
    timezone: "Africa/Nairobi",
    recurring_rule: "",
    forceSend: false,
    footerLocations: [],
    tags: [],
    exclude_unsubscribed: true,
  });

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

  const tabs = ["EMAIL", "RECIPIENTS", "ADVANCED", "SCHEDULING & SETTINGS"];

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

  const handleTagsChange = (value) => {
    const tagsArray = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    setEmailData((prev) => ({
      ...prev,
      tags: tagsArray,
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
        fromEmail: emailData.fromEmail,
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
      };

      const response = await axios.post(
        `${backend}/emails/aws/send-email`,
        payload,
        { withCredentials: true }
      );

      notify.success(
        emailData.send_type === "scheduled"
          ? "Email scheduled successfully!"
          : "Email sent successfully!"
      );
      console.log("Campaign Response:", response.data);

      // Reset form after successful send
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
      <div>
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Label
        </label>
        <input
          type="text"
          value={emailData.label}
          onChange={(e) => handleInputChange("label", e.target.value)}
          placeholder="Payment Receipt"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Subject *
        </label>
        <input
          type="text"
          value={emailData.subject}
          onChange={(e) => handleInputChange("subject", e.target.value)}
          placeholder="Payment Received"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Body *
        </label>
        <div className="border border-gray-300 rounded-lg">
          <div className="flex space-x-1 p-2 border-b border-gray-200">
            <button className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded">
              <span className="font-bold">B</span>
            </button>
            <button className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded">
              <span className="italic">I</span>
            </button>
            <button className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded">
              ≡
            </button>
            <button className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded">
              ≣
            </button>
            <button className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded">
              🔗
            </button>
            <button className="ml-auto px-3 py-1 text-blue-500 hover:bg-blue-50 rounded text-sm">
              + Insert form fields
            </button>
          </div>
          <textarea
            value={emailData.body}
            onChange={(e) => handleInputChange("body", e.target.value)}
            placeholder="Hello John,

Payment received for the TEAS 7 Study Package"
            rows="8"
            className="w-full p-4 resize-none focus:outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          className="px-6 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderRecipientsTab = () => (
    <div className="space-y-6">
      <div>
        <p className="text-gray-600 mb-4">
          The default behavior is to send the email to the same recipients. If
          you want to send this email to different recipients conditionally, you
          can send individually.
        </p>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => handleInputChange("recipientMode", "individual")}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              emailData.recipientMode === "individual"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Individually
          </button>
          <button
            onClick={() => handleInputChange("recipientMode", "bulk")}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              emailData.recipientMode === "bulk"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Mass Sending
          </button>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Recipients *{" "}
            <span className="text-gray-500">
              (Separate multiple emails with a comma)
            </span>
          </label>
          <textarea
            value={emailData.recipients}
            onChange={(e) => handleInputChange("recipients", e.target.value)}
            placeholder="team@pioneerwriter.com"
            rows="4"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Tags{" "}
            <span className="text-gray-500">
              (Separate multiple tags with a comma)
            </span>
          </label>
          <input
            type="text"
            value={emailData.tags.join(", ")}
            onChange={(e) => handleTagsChange(e.target.value)}
            placeholder="New Client, VIP, Premium"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-gray-500 text-sm mt-1">
            Tags help categorize and filter your email campaigns.
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="exclude_unsubscribed"
            checked={emailData.exclude_unsubscribed}
            onChange={(e) =>
              handleInputChange("exclude_unsubscribed", e.target.checked)
            }
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label
            htmlFor="exclude_unsubscribed"
            className="ml-2 block text-sm text-gray-700"
          >
            Exclude unsubscribed contacts
          </label>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderAdvancedTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-gray-700 text-sm font-medium mb-2">
          From Name
        </label>
        <input
          type="text"
          value={emailData.fromName}
          onChange={(e) => handleInputChange("fromName", e.target.value)}
          placeholder="Pioneer Writers TEAS Dept."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-medium mb-2">
          From Email
        </label>
        <input
          type="email"
          value={emailData.fromEmail}
          onChange={(e) => handleInputChange("fromEmail", e.target.value)}
          placeholder="team@pioneerwriters.com"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Reply-to Email
        </label>
        <input
          type="email"
          value={emailData.replyToEmail}
          onChange={(e) => handleInputChange("replyToEmail", e.target.value)}
          placeholder="orders@pioneerwriters.com"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-medium mb-2">
          CC Emails
        </label>
        <input
          type="text"
          value={emailData.ccEmails}
          onChange={(e) => handleInputChange("ccEmails", e.target.value)}
          placeholder="pioneerwritersorders@gmail.com"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-medium mb-2">
          BCC Emails
        </label>
        <input
          type="text"
          value={emailData.bccEmails}
          onChange={(e) => handleInputChange("bccEmails", e.target.value)}
          placeholder="Enter BCC email here"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderSchedulingTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Send Type
        </label>
        <div className="flex space-x-4">
          <button
            onClick={() => handleInputChange("send_type", "immediate")}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              emailData.send_type === "immediate"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Send Immediately
          </button>
          <button
            onClick={() => handleInputChange("send_type", "scheduled")}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              emailData.send_type === "scheduled"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Schedule
          </button>
        </div>
      </div>

      {emailData.send_type === "scheduled" && (
        <>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Scheduled Date & Time *
            </label>
            <input
              type="datetime-local"
              value={emailData.scheduled_at}
              onChange={(e) =>
                handleInputChange("scheduled_at", e.target.value)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Timezone
            </label>
            <select
              value={emailData.timezone}
              onChange={(e) => handleInputChange("timezone", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Recurring Rule
            </label>
            <select
              value={emailData.recurring_rule}
              onChange={(e) =>
                handleInputChange("recurring_rule", e.target.value)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">No Recurring</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </>
      )}

      <div className="flex items-center">
        <input
          type="checkbox"
          id="forceSend"
          checked={emailData.forceSend}
          onChange={(e) => handleInputChange("forceSend", e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="forceSend" className="ml-2 block text-sm text-gray-700">
          Force send (bypass normal validation)
        </label>
      </div>

      {/* Footer Locations Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-gray-700 text-sm font-medium">
            Footer Locations
          </label>
          <button
            type="button"
            onClick={addFooterLocation}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            + Add Location
          </button>
        </div>

        {emailData.footerLocations.map((location, index) => (
          <div
            key={index}
            className="p-4 border border-gray-200 rounded-lg mb-4 bg-gray-50"
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium text-gray-700">
                Location {index + 1}
              </h4>
              <button
                type="button"
                onClick={() => removeFooterLocation(index)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Location Name"
                value={location.location}
                onChange={(e) =>
                  handleFooterLocationChange(index, "location", e.target.value)
                }
                className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Address"
                value={location.address}
                onChange={(e) =>
                  handleFooterLocationChange(index, "address", e.target.value)
                }
                className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Phone"
                value={location.phone}
                onChange={(e) =>
                  handleFooterLocationChange(index, "phone", e.target.value)
                }
                className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        ))}

        {emailData.footerLocations.length === 0 && (
          <p className="text-gray-500 text-sm">
            No footer locations added. Click "Add Location" to include office
            locations in your email footer.
          </p>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={handleSendEmail}
          disabled={loading}
          className={`px-6 py-2 rounded-lg transition-colors cursor-pointer ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : emailData.send_type === "scheduled"
              ? "bg-orange-600 hover:bg-orange-700"
              : "bg-green-600 hover:bg-green-700"
          } text-white`}
        >
          {loading
            ? "Processing..."
            : emailData.send_type === "scheduled"
            ? "Schedule Email"
            : "Send Email"}
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

  return (
    <div className="relative min-h-screen bg-white">
      <Navbar />
      <BackgroundWaves />

      <div className="relative z-10 container mx-auto px-4 py-8 pt-30">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  Add Email Notification
                </h2>
                <button className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab, index) => (
                  <button
                    key={tab}
                    onClick={() => setCurrentTab(index)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      currentTab === index
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
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
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <button
                onClick={handleDiscardChanges}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
              >
                🗑️ DISCARD CHANGES
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewEmail;
