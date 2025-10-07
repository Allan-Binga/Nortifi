import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Upload, X, Loader2, ChevronDown } from "lucide-react";
import { backend } from "../server";
import { notify } from "../utils/toast";
import Spinner from "./Spinner";
import Papa from "papaparse";

function ImportContactsModal({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [csvFile, setCsvFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [csvPreview, setCsvPreview] = useState([]);
    const [mapping, setMapping] = useState({});
    const [openDropdown, setOpenDropdown] = useState(null);
    const [showSpinner, setShowSpinner] = useState(false);
    const mappingRef = useRef(null);

    // Updated fields per backend
    const FIELDS = [
        { key: "prefix", label: "Prefix" },
        { key: "first_name", label: "First Name" },
        { key: "last_name", label: "Last Name" },
        { key: "email", label: "Email" },
        { key: "phone_number", label: "Phone Number" },
        { key: "city", label: "City" },
        { key: "postal_code", label: "Postal Code" },
        { key: "country", label: "Country" },
        { key: "address", label: "Address" },
        { key: "state", label: "State / Province" },
        { key: "tag", label: "Tag" },
        { key: "website", label: "Website" }, // updated field
    ];

    // Handle CSV upload
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "text/csv") {
            setCsvFile(file);
            Papa.parse(file, {
                complete: (result) => {
                    const data = result.data.filter((row) =>
                        row.some((cell) => cell.trim() !== "")
                    );
                    setCsvPreview(data.slice(0, 6)); // header + preview
                },
                header: false,
                skipEmptyLines: true,
            });
        } else {
            notify.error("Please select a valid CSV file");
        }
    };

    const handleDeselectFile = () => {
        setCsvFile(null);
        setCsvPreview([]);
        setMapping({});
        setOpenDropdown(null);
    };

    const handleUploadCSV = async () => {
        if (!csvFile) return notify.error("Please select a CSV file first!");

        const formData = new FormData();
        formData.append("file", csvFile);
        formData.append("mapping", JSON.stringify(mapping));

        try {
            setIsUploading(true);
            const response = await axios.post(`${backend}/contacts/add-via-csv`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: true,
            });

            notify.success(response.data.message || "CSV uploaded successfully");
            setShowSpinner(true);
            setTimeout(() => {
                navigate("/contacts");
                onClose();
            }, 2000);
            handleDeselectFile();
        } catch (error) {
            console.error("Error uploading CSV:", error);
            notify.error(error.response?.data?.error || "Failed to upload CSV");
        } finally {
            setIsUploading(false);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (mappingRef.current && !mappingRef.current.contains(e.target)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ESC key closes modal
    useEffect(() => {
        const handleEsc = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    const buttonStyles = `px-4 py-3 rounded-md font-semibold flex items-center gap-2 transition duration-200`;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[10000] bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-md border border-blue-200 w-full max-w-4xl mx-auto shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-blue-100 px-6 py-3 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-[#061338]">Import Contacts</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-hidden">
                    <div className="space-y-6">
                        {/* File Upload */}
                        <div className="space-y-4">
                            {!csvFile ? (
                                <label
                                    className={`${buttonStyles} cursor-pointer bg-amber-600 text-white hover:bg-amber-700`}
                                >
                                    <Upload className="w-5 h-5" />
                                    Import from CSV
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            ) : (
                                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md border border-blue-300">
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

                            <a
                                href="https://nortifi.s3.eu-north-1.amazonaws.com/nortifi/sample_contacts.csv"
                                download="sample-contacts.csv"
                                className={`${buttonStyles} bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200`}
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
                        </div>

                        {/* CSV Preview */}
                        {csvPreview.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-base font-semibold text-slate-700">
                                    Preview & Map Fields
                                </h3>

                                <div className="overflow-x-auto border border-blue-200 rounded-md">
                                    <table className="min-w-full border-collapse text-sm">
                                        <thead>
                                            <tr>
                                                {csvPreview[0].map((_, index) => (
                                                    <th
                                                        key={index}
                                                        className="px-3 py-2 bg-blue-100 text-left text-xs font-semibold text-gray-600"
                                                    >
                                                        Column {index + 1}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {csvPreview.slice(1).map((row, rIndex) => (
                                                <tr key={rIndex} className="even:bg-blue-50">
                                                    {row.map((cell, cIndex) => (
                                                        <td key={cIndex} className="px-3 py-2 text-gray-700">
                                                            {cell}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Reverse Mapping: Field → Column */}
                                <div ref={mappingRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                                    {FIELDS.map((field) => (
                                        <div key={field.key} className="flex flex-col relative">
                                            <span className="text-sm text-gray-600 mb-1">{field.label}</span>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenDropdown(openDropdown === field.key ? null : field.key);
                                                }}
                                                className="w-full flex justify-between items-center px-4 py-3 rounded-md bg-white border border-blue-300 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                            >
                                                {mapping[field.key] !== undefined
                                                    ? `Column ${parseInt(mapping[field.key]) + 1}`
                                                    : "Select column"}
                                                <ChevronDown
                                                    className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${openDropdown === field.key ? "rotate-180" : "rotate-0"
                                                        }`}
                                                />
                                            </button>
                                            {openDropdown === field.key && (
                                                <ul className="absolute left-0 mt-2 w-full rounded-md bg-white border border-blue-100 z-50 max-h-40 overflow-y-auto shadow-sm animate-fadeIn">
                                                    {csvPreview[0].map((_, idx) => (
                                                        <li
                                                            key={idx}
                                                            onClick={() => {
                                                                setMapping((prev) => ({ ...prev, [field.key]: idx }));
                                                                setOpenDropdown(null);
                                                            }}
                                                            className={`px-4 py-3 cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors ${mapping[field.key] === idx
                                                                    ? "bg-amber-100 text-amber-700"
                                                                    : ""
                                                                }`}
                                                        >
                                                            Column {idx + 1}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Upload Button */}
                        {csvFile && (
                            <div className="flex justify-end mt-6">
                                <button
                                    onClick={handleUploadCSV}
                                    disabled={isUploading}
                                    className={`${buttonStyles} bg-blue-600 cursor-pointer text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5" />
                                            Upload CSV
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showSpinner && <Spinner />}
        </div>
    );
}

export default ImportContactsModal;
