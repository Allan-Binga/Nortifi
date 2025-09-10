import Navbar from "../components/Navbar";
import BackgroundWaves from "../components/BackgroundWaves";
import { useState, useEffect } from "react";
import axios from "axios";
import { backend } from "../server";
import { notify } from "../utils/toast";
import { Plus, Edit2, Trash2, Save, X, Loader2 } from "lucide-react";

function Contact() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    countryCode: "+254", // Default to Kenya
    tag: "",
    website: "",
  });
  const [editingContact, setEditingContact] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Country codes for phone numbers
  const countryCodes = [
    { code: "+1", country: "US/Canada", flag: "🇺🇸" },
    { code: "+44", country: "UK", flag: "🇬🇧" },
    { code: "+254", country: "Kenya", flag: "🇰🇪" },
    { code: "+234", country: "Nigeria", flag: "🇳🇬" },
    { code: "+27", country: "South Africa", flag: "🇿🇦" },
    { code: "+91", country: "India", flag: "🇮🇳" },
    { code: "+86", country: "China", flag: "🇨🇳" },
    { code: "+81", country: "Japan", flag: "🇯🇵" },
    { code: "+49", country: "Germany", flag: "🇩🇪" },
    { code: "+33", country: "France", flag: "🇫🇷" },
  ];

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateName = (name) => {
    // Name should be at least 2 characters, only letters and spaces, no numbers or special chars
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name.trim());
  };

  const validatePhoneNumber = (phoneNumber) => {
    // Remove any spaces, dashes, or parentheses and check if it's numeric
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");
    return /^\d{7,15}$/.test(cleanPhone);
  };

  // Format date nicely
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();

    const getDaySuffix = (day) => {
      if (day >= 11 && day <= 13) return "th";
      switch (day % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };

    return `${day}${getDaySuffix(day)} ${month} ${year}`;
  };

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

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!validateName(formData.name)) {
      newErrors.name =
        "Name must be 2-50 characters and contain only letters and spaces";
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber =
        "Phone number should contain only digits (7-15 characters)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create or update a contact
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Add artificial delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Prepare data with formatted phone number
      const submitData = {
        ...formData,
        phoneNumber: formData.phoneNumber
          ? `${formData.countryCode}${formData.phoneNumber}`
          : "",
      };

      if (editingContact) {
        // Update contact
        const response = await axios.patch(
          `${backend}/contacts/update-contact/${editingContact.contact_id}`,
          submitData,
          { withCredentials: true }
        );
        setContacts((prev) =>
          prev.map((contact) =>
            contact.contact_id === editingContact.contact_id
              ? response.data.contact
              : contact
          )
        );
        notify.success("Contact updated successfully");
      } else {
        // Create contact
        const response = await axios.post(
          `${backend}/contacts/create-contact`,
          submitData,
          {
            withCredentials: true,
          }
        );
        setContacts((prev) => [...prev, response.data.contact]);
        notify.success("Contact created successfully");
      }

      // Reset form
      setFormData({
        name: "",
        email: "",
        phoneNumber: "",
        countryCode: "+254",
        tag: "",
        website: "",
      });
      setEditingContact(null);
      setErrors({});
    } catch (error) {
      notify.error(
        editingContact ? "Failed to update contact" : "Failed to create contact"
      );
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start editing a contact
  const handleEdit = (contact) => {
    setEditingContact(contact);

    // Parse phone number to separate country code and number
    let countryCode = "+254";
    let phoneNumber = "";

    if (contact.phone_number) {
      const foundCode = countryCodes.find((cc) =>
        contact.phone_number.startsWith(cc.code)
      );
      if (foundCode) {
        countryCode = foundCode.code;
        phoneNumber = contact.phone_number.substring(foundCode.code.length);
      } else {
        phoneNumber = contact.phone_number;
      }
    }

    setFormData({
      name: contact.name,
      email: contact.email,
      phoneNumber: phoneNumber,
      countryCode: countryCode,
      tag: contact.tag,
      website: contact.website,
    });
    setErrors({});
  };

  // Delete a contact
  const handleDelete = async (contact_id) => {
    if (!window.confirm("Are you sure you want to delete this contact?"))
      return;
    try {
      await axios.delete(`${backend}/contacts/delete-contact/${contact_id}`, {
        withCredentials: true,
      });
      setContacts((prev) =>
        prev.filter((contact) => contact.contact_id !== contact_id)
      );
      notify.success("Contact deleted successfully");
    } catch (error) {
      notify.error("Failed to delete contact");
      console.error("Error deleting contact:", error);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingContact(null);
    setFormData({
      name: "",
      email: "",
      phoneNumber: "",
      countryCode: "+254",
      tag: "",
      website: "",
    });
    setErrors({});
  };

  return (
    <div className="relative min-h-screen bg-white">
      <Navbar />
      <BackgroundWaves />
      <div className="container mx-auto px-4 pt-30 sm:px-6 lg:px-8 py-8 relative z-10 mt-6">
        {/* Create/Update Contact Form */}
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 ">
          Create a contact
        </h1>
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {editingContact ? "Update Contact" : "Create New Contact"}
          </h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className={`mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                  errors.name
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="Enter full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className={`mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                  errors.email
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-gray-700"
              >
                Phone Number
              </label>
              <div className="mt-1 flex">
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleInputChange}
                  className="rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {countryCodes.map((cc) => (
                    <option key={cc.code} value={cc.code}>
                      {cc.flag} {cc.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className={`flex-1 rounded-r-md border p-2 focus:outline-none focus:ring-2 transition-colors ${
                    errors.phoneNumber
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="Enter phone number"
                />
              </div>
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.phoneNumber}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Format: {formData.countryCode}
                {formData.phoneNumber || "XXXXXXXXX"}
              </p>
            </div>

            <div>
              <label
                htmlFor="tag"
                className="block text-sm font-medium text-gray-700"
              >
                Tag
              </label>
              <input
                type="text"
                id="tag"
                name="tag"
                value={formData.tag}
                onChange={handleInputChange}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter tag (e.g., VIP, Client, Friend)"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="website"
                className="block text-sm font-medium text-gray-700"
              >
                Website Name
              </label>
              <input
                type="name"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ABC Apartments"
              />
            </div>

            <div className="md:col-span-2 flex justify-end space-x-4">
              {editingContact && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="cursor-pointer bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors duration-200 flex items-center"
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingContact ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingContact ? "Update Contact" : "Create Contact"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Contacts Table */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Contacts ({contacts.length})
          </h2>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
              <p className="text-gray-600">Loading contacts...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-2">No contacts found.</p>
              <p className="text-sm text-gray-500">
                Create your first contact using the form above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tag
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Website
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contacts.map((contact) => (
                    <tr
                      key={contact.contact_id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {contact.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {contact.email}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {contact.phone_number ? (
                          <a
                            href={`tel:${contact.phone_number}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {contact.phone_number}
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {contact.tag ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {contact.tag}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {contact.website ? (
                          <a
                            href={
                              contact.website.startsWith("http")
                                ? contact.website
                                : `https://${contact.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {contact.website}
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(contact.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(contact)}
                            className="cursor-pointer text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="Edit contact"
                            disabled={isSubmitting}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(contact.contact_id)}
                            className="cursor-pointer text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Delete contact"
                            disabled={isSubmitting}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
  );
}

export default Contact;
