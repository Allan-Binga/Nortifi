import Sidebar from "../components/Sidebar";
import Label from "../components/Label";
import { useState } from "react";
import axios from "axios";
import { backend } from "../server";
import { notify } from "../utils/toast";
import { Plus, X, Loader2, Upload } from "lucide-react";
import Spinner from "../components/Spinner";
import { useNavigate } from "react-router-dom";

function Contact() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    countryCode: "+254",
    website: "",
    address: "",
    country: "",
    state: "",
    gender: ""
  });
  const [editingContact, setEditingContact] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [errors, setErrors] = useState({});
  const [csvFile, setCSVFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    setCSVFile(e.target.files[0]);
  };

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!validateName(formData.firstName)) {
      newErrors.firstName =
        "Name must be 2-50 characters and contain only letters and spaces";
    }

    if (!validateName(formData.lastName)) {
      newErrors.lastName =
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

      const response = await axios.post(
        `${backend}/contacts/create-contact`,
        submitData,
        { withCredentials: true }
      );

      notify.success("Contact created successfully");

      // reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        countryCode: "+254",
        website: "",
        address: "",
        country: "",
        state: "",
        gender: ""
      });
      setErrors({});

      setShowSpinner(true);
      setTimeout(() => {
        navigate("/contacts")
      }, 2000)
    } catch (error) {
      const backendMessage = error.response?.data?.error;
      if (backendMessage) {
        notify.error(backendMessage);
      } else {
        notify.error("Failed to create contact");
      }
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleUploadCSV = async (e) => {
    if (!csvFile) {
      alert("Please select a CSV file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      setIsUploading(true);
      const response = await axios.post(
        `${backend}/contacts/add-via-csv`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );
      notify.success(response.data.message || "CSV uploaded successfully");
      // Refresh contacts list after successful upload
      const contactsResponse = await axios.get(
        `${backend}/contacts/all-contacts`,
        {
          withCredentials: true,
        }
      );
      setContacts(contactsResponse.data);
      setCSVFile(null); // Clear the file input
    } catch (error) {
      console.error("Error uploading CSV:", error);
      notify.error("Failed to upload CSV");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingContact(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      countryCode: "+254",
      website: "",
      state: "",
      gender: "",
      address: "",
      country: ""
    });
    setErrors({});
  };

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* Spinner Overlay */}
      {showSpinner && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
          <Spinner />
        </div>
      )}
      {/*Sidebar*/}
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Label/>
        <div className="flex-1 overflow-y-auto">
          <div className="relative z-10 container mx-auto px-4 py-8 pt-30 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
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
                <div className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* First Name */}
                      <div>
                        <label
                          htmlFor="firstName"
                          className="block text-xs font-semibold text-slate-700 mb-2"
                        >
                          Firstname <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-4 py-3 rounded-lg shadow-sm border transition duration-200 ${errors.name
                            ? "border-red-300 focus:ring-2 focus:ring-red-500"
                            : "border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            }`}
                          placeholder="Enter first name"
                        />
                        {errors.firstName && (
                          <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>
                        )}
                      </div>

                      {/* Last Name */}
                      <div>
                        <label
                          htmlFor="lastName"
                          className="block text-xs font-semibold text-slate-700 mb-2"
                        >
                          Lastname <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-4 py-3 rounded-lg shadow-sm border transition duration-200 ${errors.name
                            ? "border-red-300 focus:ring-2 focus:ring-red-500"
                            : "border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            }`}
                          placeholder="Enter first name"
                        />
                        {errors.lastName && (
                          <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>
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
                          className={`w-full px-4 py-3 rounded-lg shadow-sm border transition duration-200 ${errors.email
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
                            className={`rounded-l-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-200 ${errors.phoneNumber
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
                            className={`flex-1 rounded-r-lg border border-l-0 shadow-sm px-4 py-3 focus:outline-none focus:ring-2 transition duration-200 ${errors.phoneNumber
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

                      {/* Website */}
                      <div >
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

                      {/* Address */}
                      <div>
                        <label
                          htmlFor="address"
                          className="block text-xs font-semibold text-slate-700 mb-2"
                        >
                          Address
                        </label>
                        <input
                          type="text"
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-lg shadow-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
                          placeholder="123 Main Street, Apt 4B"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      {/* Country */}
                      <div>
                        <label
                          htmlFor="country"
                          className="block text-xs font-semibold text-slate-700 mb-2"
                        >
                          Country
                        </label>
                        <select
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-lg shadow-sm border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
                        >
                          <option value="">Select Country</option>
                          <option value="Kenya">Kenya</option>
                          <option value="United States">United States</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="India">India</option>
                          <option value="Canada">Canada</option>
                          <option value="Australia">Australia</option>
                        </select>
                      </div>

                      {/* State */}
                      <div>
                        <label
                          htmlFor="state"
                          className="block text-xs font-semibold text-slate-700 mb-2"
                        >
                          State / Province
                        </label>
                        <input
                          type="text"
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-lg shadow-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
                          placeholder="Nairobi / California / Ontario"
                        />
                      </div>

                      {/* Gender */}
                      <div>
                        <label
                          htmlFor="gender"
                          className="block text-xs font-semibold text-slate-700 mb-2"
                        >
                          Gender
                        </label>
                        <select
                          id="gender"
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-lg shadow-sm border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>


                    {/* CSV Preview and Buttons */}
                    <div className="space-y-4">
                      {csvFile && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          <Upload className="w-4 h-4 text-indigo-600" />
                          <span>Selected file: {csvFile.name}</span>
                          <button
                            onClick={() => setCSVFile(null)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <div className="flex justify-end space-x-4 items-center">
                        <label className="cursor-pointer px-6 py-3 rounded-lg shadow-md bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-base flex items-center gap-2 hover:from-indigo-600 hover:to-indigo-700 transition duration-200">
                          <Upload className="w-5 h-5" />
                          Import from CSV
                          <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                        {csvFile && (
                          <button
                            onClick={handleUploadCSV}
                            disabled={isUploading}
                            className="px-6 py-3 rounded-lg shadow-md bg-gradient-to-r from-green-500 to-green-600 text-white text-base flex items-center gap-2 hover:from-green-600 hover:to-green-700 cursor-pointer transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUploading ? "Uploading..." : "Upload"}
                          </button>
                        )}
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
                          className="px-10 py-4 cursor-pointer rounded-lg shadow-lg bg-gradient-to-r from-teal-600 to-teal-700 text-white text-base font-semibold flex items-center gap-2 hover:from-teal-700 hover:to-teal-800 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
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
                    </div>
                  </form>
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>


    </div>
  );
}

export default Contact;
