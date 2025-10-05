import Sidebar from "../components/Sidebar";
import Label from "../components/Label";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { backend } from "../server";
import { notify } from "../utils/toast";
import { Plus, X, Loader2, Upload, ChevronDown } from "lucide-react";
import Spinner from "../components/Spinner";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse"
import PhoneInput from "react-phone-number-input"
import { isValidPhoneNumber } from "react-phone-number-input"

function Contact() {
  const navigate = useNavigate()
  const [openMappingDropdowns, setOpenMappingDropdowns] = useState({});
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [phoneInputValue, setPhoneInputValue] = useState('');
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    countryCode: "",
    website: "",
    address: "",
    country: "",
    state: "",
    gender: "",
    tag: ""
  });
  const [editingContact, setEditingContact] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [errors, setErrors] = useState({});
  const [csvFile, setCSVFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [csvPreview, setCsvPreview] = useState([]);
  const [mapping, setMapping] = useState({});
  const mappingRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mappingRef.current && !mappingRef.current.contains(e.target)) {
        setOpenMappingDropdowns({});
      }
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") setOpenMappingDropdowns({});
    };

    window.addEventListener("click", handleClickOutside);
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("click", handleClickOutside);
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setCSVFile(file);

    Papa.parse(file, {
      complete: (results) => {
        // preview first 5 rows
        setCsvPreview(results.data.slice(0, 5));
      },
    });
  };

  const handleDeselectFile = () => {
    setCSVFile(null);
    setCsvPreview([]);
    setMapping({});
    setOpenMappingDropdowns({});
  };

  const MAPPING_OPTIONS = [
    { value: "first_name", label: "First Name" },
    { value: "last_name", label: "Last Name" },
    { value: "email", label: "Email" },
    { value: "phone_number", label: "Phone Number" },
    { value: "tag", label: "Tag" },
    { value: "website", label: "Website" },
  ];



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

  const handlePhoneChange = (value) => {
    setPhoneInputValue(value);
    if (value) {
      setFormData(prev => ({
        ...prev,
        phoneNumber: value, // Full number
        countryCode: value.slice(0, value.indexOf(' ', 1) + 1).trim() || '', // e.g., '+254 '
      }));
    } else {
      setFormData(prev => ({ ...prev, phoneNumber: '', countryCode: '' }));
    }
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
        gender: "",
        tag: ""
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
    formData.append("mapping", JSON.stringify(mapping));

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

      setShowSpinner(true)
      setTimeout(() => {
        navigate("/contacts")
      }, 2000)

      handleDeselectFile()
    } catch (error) {
      console.error("Error uploading CSV:", error);
      notify.error("Failed to upload CSV");
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <div className="flex h-screen bg-blue-50 relative">
      {/* Spinner Overlay */}
      {showSpinner && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
          <Spinner />
        </div>
      )}
      {/*Sidebar*/}
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Label />
        <div className="flex-1 overflow-y-auto">
          <div className="relative z-10 container mx-auto px-4 py-8 pt-20 pb-20 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-sm  border border-blue-200 overflow-hidden">
                {/* Header */}
                <div className="bg-blue-100 px-8 py-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                      {editingContact ? "Update Contact" : "Create New Contact"}
                    </h2>
                    <button
                      className="cursor-pointer text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/*Create Contact Form */}
                <div className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* First Name */}
                      <div>
                        <label
                          htmlFor="firstName"
                          className="block text-xs font-semibold text-slate-700 mb-2"
                        >
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-4 py-3 rounded-sm border ${errors.name
                            ? "border-red-300 focus:ring-2 focus:ring-red-500"
                            : "border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
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
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-4 py-3 rounded-sm border ${errors.name
                            ? "border-red-300 focus:ring-2 focus:ring-red-500"
                            : "border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            }`}
                          placeholder="Enter last name"
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
                          className={`w-full px-4 py-3 rounded-sm border ${errors.email
                            ? "border-red-300 focus:ring-2 focus:ring-red-500"
                            : "border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
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
                            className={`rounded-l-sm border border-blue-200 bg-slate-50 px-4 py-3 text-xs ${errors.phoneNumber
                              ? "border-red-300 focus:ring-red-500"
                              : "border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
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
                            className={`flex-1 rounded-sm border border-l-0 px-4 py-3 focus:outline-none focus:ring-2 transition duration-200 ${errors.phoneNumber
                              ? "border-red-300 focus:ring-red-500"
                              : "border-blue-300 focus:ring-blue-100"
                              }`}
                            placeholder="Enter phone number"
                          />
                        </div>
                        {errors.phoneNumber && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors.phoneNumber}
                          </p>
                        )}
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
                          className="w-full px-4 py-3 rounded-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
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
                          className="w-full px-4 py-3 rounded-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          placeholder="123 Main Street, Apt 4B"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      {/* Country Dropdown */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">
                          Country
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsCountryOpen(!isCountryOpen)}
                            className="w-full flex justify-between items-center px-4 py-3 rounded-sm bg-white border border-blue-300"
                          >
                            {formData.country || "Select Country"}
                            <ChevronDown
                              className={`w-5 h-5 text-gray-500 transform transition-transform ${isCountryOpen ? "rotate-180" : "rotate-0"
                                }`}
                            />
                          </button>

                          {isCountryOpen && (
                            <ul className="absolute mt-2 w-full rounded-sm bg-white border border-blue-100 z-10 animate-fadeIn">
                              {["Kenya", "United States", "United Kingdom", "India", "Canada", "Australia"].map(
                                (country) => (
                                  <li
                                    key={country}
                                    onClick={() => {
                                      setFormData((prev) => ({ ...prev, country }));
                                      setIsCountryOpen(false);
                                    }}
                                    className={`px-4 py-3 cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors ${formData.country === country ? "bg-amber-100 text-amber-700" : ""
                                      }`}
                                  >
                                    {country}
                                  </li>
                                )
                              )}
                            </ul>
                          )}
                        </div>
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
                          className="w-full px-4 py-3 rounded-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          placeholder="Nairobi / California / Ontario"
                        />
                      </div>

                      {/* Gender Dropdown */}
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Gender
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsGenderOpen(!isGenderOpen)}
                            className="w-full flex justify-between items-center px-4 py-3 rounded-sm bg-white border border-blue-300"
                          >
                            {formData.gender || "Select Gender"}
                            <ChevronDown
                              className={`w-5 h-5 text-gray-500 transform transition-transform ${isGenderOpen ? "rotate-180" : "rotate-0"
                                }`}
                            />
                          </button>

                          {isGenderOpen && (
                            <ul className="absolute mt-2 w-full rounded-sm bg-white border border-blue-100 z-10 animate-fadeIn">
                              {["Male", "Female", "Other", "Prefer not to say"].map((gender) => (
                                <li
                                  key={gender}
                                  onClick={() => {
                                    setFormData((prev) => ({ ...prev, gender }));
                                    setIsGenderOpen(false);
                                  }}
                                  className={`px-4 py-3 cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors ${formData.gender === gender ? "bg-amber-100 text-amber-700" : ""
                                    }`}
                                >
                                  {gender}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      {/* Tag */}
                      <div>
                        <label
                          htmlFor="tag"
                          className="block text-xs font-semibold text-slate-700 mb-2"
                        >
                          Tag <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="tag"
                          name="tag"
                          value={formData.tag}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-4 py-3 rounded-sm border ${errors.name
                            ? "border-red-300 focus:ring-2 focus:ring-red-500"
                            : "border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            }`}
                          placeholder="e.g New client, Returning Client"
                        />
                      </div>
                    </div>


                    {/* CSV Preview and Mapping */}
                    {csvPreview.length > 0 && (
                      <div className="space-y-4 mt-4">
                        <h3 className="font-semibold">Preview & Map your columns</h3>
                        <div className="overflow-x-auto border border-blue-200 rounded-sm">
                          <table className="min-w-full border-collapse text-sm">
                            <thead>
                              <tr>
                                {csvPreview[0].map((header, index) => (
                                  <th key={index} className="px-3 py-2 bg-blue-100 text-left text-xs font-semibold text-gray-600">
                                    Column {index + 1}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {csvPreview.slice(0, 5).map((row, rowIndex) => (
                                <tr key={rowIndex} className="even:bg-blue-50">
                                  {row.map((cell, cellIndex) => (
                                    <td key={cellIndex} className="px-3 py-2">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mapping controls */}
                        <div ref={mappingRef} className="flex flex-wrap gap-6 mt-6">
                          {csvPreview[0].map((_, colIndex) => (
                            <div key={colIndex} className="flex flex-col w-48 relative">
                              <span className="text-sm text-gray-600 mb-1">Column {colIndex + 1}</span>

                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation(); // prevent outer click handler from closing immediately
                                    setOpenMappingDropdowns((prev) => ({
                                      ...prev,
                                      [colIndex]: !prev[colIndex],
                                    }));
                                  }}
                                  className="w-full flex justify-between items-center px-4 py-3 rounded-sm bg-white border border-blue-300"
                                >
                                  {mapping[colIndex]
                                    ? MAPPING_OPTIONS.find((o) => o.value === mapping[colIndex])?.label
                                    : "Select field"}
                                  <ChevronDown
                                    className={`w-5 h-5 text-gray-500 transform transition-transform ${openMappingDropdowns[colIndex] ? "rotate-180" : "rotate-0"
                                      }`}
                                  />
                                </button>

                                {openMappingDropdowns[colIndex] && (
                                  <ul className="absolute left-0 mt-2 w-full rounded-sm bg-white border border-blue-100 z-50 max-h-40 overflow-y-auto shadow-sm animate-fadeIn">
                                    {MAPPING_OPTIONS.map((opt) => (
                                      <li
                                        key={opt.value}
                                        onClick={() => {
                                          setMapping((prev) => ({ ...prev, [colIndex]: opt.value }));
                                          setOpenMappingDropdowns({});
                                        }}
                                        className={`px-4 py-3 cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors ${mapping[colIndex] === opt.value ? "bg-amber-100 text-amber-700" : ""
                                          }`}
                                      >
                                        {opt.label}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                      </div>
                    )}


                    <div className="space-y-4">
                      {csvFile && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          <Upload className="w-4 h-4 text-indigo-600" />
                          <span>Selected file: {csvFile.name}</span>
                          <button
                            onClick={handleDeselectFile}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap justify-end gap-3 items-center">

                        {/* Download Sample CSV */}
                        <a
                          href="https://nortifi.s3.eu-north-1.amazonaws.com/nortifi/1758773514679-sample_contacts.csv"
                          download="sample-contacts.csv"
                          className="px-4 py-3 rounded-sm bg-gray-100 text-gray-700 text-sm font-medium border border-gray-300 flex items-center gap-2 hover:bg-gray-200 transition"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                            />
                          </svg>
                          Download Sample CSV
                        </a>

                        {/* Import CSV */}
                        {!csvFile && (
                          <label className="cursor-pointer px-4 py-3 rounded-sm bg-amber-600 text-white flex items-center gap-2 hover:bg-amber-700">
                            <Upload className="w-5 h-5" />
                            Import from CSV
                            <input
                              type="file"
                              accept=".csv"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        )}

                        {/* Upload */}
                        {csvFile && (
                          <button
                            onClick={handleUploadCSV}
                            disabled={isUploading}
                            className="px-4 py-3 rounded-sm bg-white text-amber-500 font-semibold border border-amber-400 flex items-center gap-2 hover:bg-amber-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUploading ? "Uploading..." : "Upload CSV"}
                          </button>
                        )}

                        {/* Cancel Edit */}
                        {editingContact && (
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-8 py-3 cursor-pointer rounded-sm bg-gradient-to-r from-slate-500 to-slate-600 text-white text-base flex items-center gap-2 hover:from-slate-600 hover:to-slate-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                          >
                            <X className="w-5 h-5" />
                            Cancel
                          </button>
                        )}

                        {/* Submit */}
                        <button
                          type="submit"
                          className="px-4 py-3 cursor-pointer rounded-sm bg-blue-600 text-white text-base font-semibold flex items-center gap-2 hover:bg-blue-700"
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
