import Navbar from "../components/Navbar";
import BackgroundWaves from "../components/BackgroundWaves";
import { useState, useEffect } from "react";
import axios from "axios";
import { backend } from "../server";
import { notify } from "../utils/toast";
import { Plus, Edit2, Trash2, X, Loader2 } from "lucide-react";

function Contact() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    countryCode: "+254",
    tag: "",
    website: "",
  });
  const [editingContact, setEditingContact] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

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

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name.trim());
  };

  const validatePhoneNumber = (phoneNumber) => {
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");
    return /^\d{7,15}$/.test(cleanPhone);
  };

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const submitData = {
        ...formData,
        phoneNumber: formData.phoneNumber
          ? `${formData.countryCode}${formData.phoneNumber}`
          : "",
      };

      if (editingContact) {
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
        const response = await axios.post(
          `${backend}/contacts/create-contact`,
          submitData,
          { withCredentials: true }
        );
        setContacts((prev) => [...prev, response.data.contact]);
        notify.success("Contact created successfully");
      }

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

  const handleEdit = (contact) => {
    setEditingContact(contact);
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
      tag: contact.tag || "",
      website: contact.website || "",
    });
    setErrors({});
  };

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
    <div className="relative min-h-screen bg-gray-100">
      <Navbar />

      <div className="relative z-10 container mx-auto px-4 py-8 pt-30 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingContact ? "Update Contact" : "Create New Contact"}
                </h2>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-xs font-semibold text-slate-700 mb-2"
                    >
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 rounded-lg shadow-sm border transition duration-200 ${
                        errors.name
                          ? "border-red-300 focus:ring-2 focus:ring-red-500"
                          : "border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      }`}
                      placeholder="Enter full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold text-slate-700 mb-2"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 rounded-lg shadow-sm border transition duration-200 ${
                        errors.email
                          ? "border-red-300 focus:ring-2 focus:ring-red-500"
                          : "border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      }`}
                      placeholder="Enter email address"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label
                      htmlFor="phoneNumber"
                      className="block text-xs font-semibold text-slate-700 mb-2"
                    >
                      Phone Number
                    </label>
                    <div className="flex">
                      <select
                        name="countryCode"
                        value={formData.countryCode}
                        onChange={handleInputChange}
                        className={`rounded-l-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-200 ${
                          errors.phoneNumber
                            ? "border-red-300 focus:ring-red-500"
                            : "border-slate-200"
                        }`}
                      >
                        {countryCodes.map((cc) => (
                          <option key={cc.code} value={cc.code}>
                            {cc.flag} {cc.code} ({cc.country})
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className={`flex-1 rounded-r-lg border border-l-0 shadow-sm px-4 py-3 focus:outline-none focus:ring-2 transition duration-200 ${
                          errors.phoneNumber
                            ? "border-red-300 focus:ring-red-500"
                            : "border-slate-200 focus:ring-teal-500 focus:border-transparent"
                        }`}
                        placeholder="Enter phone number"
                      />
                    </div>
                    {errors.phoneNumber && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.phoneNumber}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      Format: {formData.countryCode}
                      {formData.phoneNumber || "XXXXXXXXX"}
                    </p>
                  </div>

                  {/* Tag */}
                  <div>
                    <label
                      htmlFor="tag"
                      className="block text-xs font-semibold text-slate-700 mb-2"
                    >
                      Tag
                    </label>
                    <input
                      type="text"
                      id="tag"
                      name="tag"
                      value={formData.tag}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg shadow-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
                      placeholder="Enter tag (e.g., VIP, Client, Friend)"
                    />
                  </div>

                  {/* Website */}
                  <div className="md:col-span-2">
                    <label
                      htmlFor="website"
                      className="block text-xs font-semibold text-slate-700 mb-2"
                    >
                      Website Name
                    </label>
                    <input
                      type="text"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg shadow-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
                      placeholder="ABC Apartments"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-4">
                  {editingContact && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-8 py-3 cursor-pointer rounded-lg shadow-md bg-gradient-to-r from-slate-500 to-slate-600 text-white text-base flex items-center gap-2 hover:from-slate-600 hover:to-slate-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSubmitting}
                    >
                      <X className="w-5 h-5" />
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-8 py-3 cursor-pointer rounded-lg shadow-md bg-gradient-to-r from-teal-500 to-teal-600 text-white text-base flex items-center gap-2 hover:from-teal-600 hover:to-teal-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {editingContact ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        {editingContact ? "Update Contact" : "Create Contact"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Contacts Table */}
          <div className="bg-white rounded-lg shadow-lg mt-8">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                Contacts ({contacts.length})
              </h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-600 mr-2" />
                  <p className="text-slate-500 text-sm">Loading contacts...</p>
                </div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600 text-sm mb-2">
                    No contacts found.
                  </p>
                  <p className="text-slate-500 text-xs">
                    Create your first contact using the form above.
                  </p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm text-slate-700">
                    <thead>
                      <tr className="bg-slate-50 sticky top-0">
                        <th className="px-6 py-3 text-left font-semibold text-slate-700">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-700">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-700">
                          Phone Number
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-700">
                          Tag
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-700">
                          Website
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-700">
                          Created At
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map((contact) => (
                        <tr
                          key={contact.contact_id}
                          className="border-t border-slate-200 hover:bg-slate-50 transition duration-200"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {contact.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            <a
                              href={`mailto:${contact.email}`}
                              className="text-teal-600 hover:text-teal-800 hover:underline"
                            >
                              {contact.email}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {contact.phone_number ? (
                              <a
                                href={`tel:${contact.phone_number}`}
                                className="text-teal-600 hover:text-teal-800 hover:underline"
                              >
                                {contact.phone_number}
                              </a>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {contact.tag ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                {contact.tag}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {contact.website ? (
                              <a
                                href={
                                  contact.website.startsWith("http")
                                    ? contact.website
                                    : `https://${contact.website}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-teal-600 hover:text-teal-800 hover:underline"
                              >
                                {contact.website}
                              </a>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {formatDate(contact.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(contact)}
                                className="cursor-pointer text-teal-600 hover:text-teal-800 p-1 rounded hover:bg-teal-50 transition duration-200"
                                title="Edit contact"
                                disabled={isSubmitting}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(contact.contact_id)}
                                className="cursor-pointer text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition duration-200"
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
      </div>
    </div>
  );
}

export default Contact;
