import Sidebar from "../components/Sidebar";
import Label from "../components/Label";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Upload, X, Loader2, ChevronDown, Trash2 } from "lucide-react";
import { backend } from "../server";
import { notify } from "../utils/toast";
import Spinner from "../components/Spinner";
import Papa from "papaparse";
import { useWebsite } from "../context/WebsiteContext";
import { fetchLabels } from "../utils/labels";
import NewLabelModal from "../components/NewLabel";

function ImportContacts() {
    const navigate = useNavigate();
    const { activeWebsite } = useWebsite();
    const [csvFile, setCsvFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [csvPreview, setCsvPreview] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [droppedColumns, setDroppedColumns] = useState([]);
    const [mapping, setMapping] = useState({});
    const [openDropdown, setOpenDropdown] = useState(null);
    const [showSpinner, setShowSpinner] = useState(false);
    const [labelDropdownOpen, setLabelDropdownOpen] = useState(false);
    const [selectedLabelId, setSelectedLabelId] = useState(null);
    const [labels, setLabels] = useState([]);
    const [isNewLabelModalOpen, setIsNewLabelModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const mappingRef = useRef(null);
    const labelDropdownRef = useRef(null);

    // Fields available for mapping (removed "tag")
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
        { key: "state", label: "State" },
        { key: "website", label: "Website" },
    ];

    // Fetch Labels
    const getLabels = async () => {
        try {
            const res = await fetchLabels();
            const labelArray = Array.isArray(res) ? res : res?.labels || [];
            setLabels(labelArray);
        } catch (err) {
            console.error("Failed to fetch labels:", err);
            notify.error("Failed to fetch labels.");
        }
    };

    useEffect(() => {
        getLabels();
    }, []);

    // Open New Label modal
    const handleNewLabelClick = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setIsNewLabelModalOpen(true);
        }, 120);
    };

    const handleNewLabelModalClose = () => {
        setIsNewLabelModalOpen(false);
        getLabels(); // refresh labels after creating new one
    };

    // Handle label selection
    const handleSelectLabel = (labelId) => {
        setSelectedLabelId(labelId);
        setLabelDropdownOpen(false);
    };

    // Handle CSV file selection and parse preview
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // Allow common CSV mime types and .csv extension fallback
        const isCsv =
            file.type === "text/csv" ||
            file.name?.toLowerCase().endsWith(".csv") ||
            file.type === "application/vnd.ms-excel";

        if (!isCsv) {
            notify.error("Please select a valid CSV file");
            return;
        }

        setCsvFile(file);

        Papa.parse(file, {
            header: false,
            skipEmptyLines: true,
            complete: (result) => {
                // Normalize rows and filter out rows that are entirely empty
                const normalized = result.data.map((row) =>
                    Array.isArray(row) ? row : Object.values(row)
                );

                const nonEmpty = normalized.filter((row) =>
                    row.some((cell) => {
                        if (cell === undefined || cell === null) return false;
                        return String(cell).trim() !== "";
                    })
                );

                if (nonEmpty.length === 0) {
                    notify.error("CSV file is empty or invalid");
                    setCsvPreview([]);
                    setHeaders([]);
                    return;
                }

                const numCols = Math.max(...nonEmpty.map((r) => r.length));
                const generatedHeaders = Array.from({ length: numCols }, (_, i) => `Column ${i + 1}`);

                setHeaders(generatedHeaders);
                setCsvPreview(nonEmpty);
                setDroppedColumns([]);
                setMapping({});
            },
            error: (err) => {
                console.error("Papa parse error:", err);
                notify.error("Failed to parse CSV file");
            },
        });
    };

    const handleDeselectFile = () => {
        setCsvFile(null);
        setCsvPreview([]);
        setHeaders([]);
        setDroppedColumns([]);
        setMapping({});
        setOpenDropdown(null);
        setSelectedLabelId(null);
    };

    const handleDropColumn = (index) => {
        setDroppedColumns((prev) => (prev.includes(index) ? prev : [...prev, index]));
        setMapping((prev) => {
            const newMapping = { ...prev };
            delete newMapping[index];
            return newMapping;
        });
    };

    const handleUploadCSV = async () => {
        if (!csvFile) return notify.error("Please select a CSV file first!");

        const formData = new FormData();
        formData.append("file", csvFile);
        formData.append("mapping", JSON.stringify(mapping || {}));
        if (selectedLabelId) formData.append("labelId", selectedLabelId);

        try {
            setIsUploading(true);
            const response = await axios.post(
                `${backend}/contacts/add-via-csv/${activeWebsite?.website_id || ""}`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                    withCredentials: true,
                }
            );

            notify.success(response.data?.message || "CSV uploaded successfully");
            setShowSpinner(true);
            setTimeout(() => navigate("/contacts"), 1500);
            handleDeselectFile();
        } catch (error) {
            console.error("Error uploading CSV:", error);
            notify.error(error.response?.data?.error || "Failed to upload CSV");
        } finally {
            setIsUploading(false);
        }
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (mappingRef.current && !mappingRef.current.contains(e.target)) {
                setOpenDropdown(null);
            }
            if (labelDropdownRef.current && !labelDropdownRef.current.contains(e.target)) {
                setLabelDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const buttonStyles = "px-4 py-3 rounded-sm font-semibold flex items-center gap-2 transition duration-200";

    return (
        <>
            <NewLabelModal isOpen={isNewLabelModalOpen} onClose={handleNewLabelModalClose} onSuccess={getLabels} />
            <div className="flex min-h-screen bg-blue-50">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                    <Label />
                    <div className="flex-1 flex justify-center items-center p-8 bg-blue-50">
                        <div className="relative bg-white rounded-sm border border-blue-200 w-full max-w-4xl shadow-lg p-8">
                            {showSpinner && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-[10001]">
                                    <Spinner />
                                </div>
                            )}
                            <h2 className="text-lg font-bold text-[#061338] mb-6">Import Contacts</h2>

                            <div className="space-y-6">
                                {/* File Upload */}
                                <div className="space-y-4">
                                    {!csvFile ? (
                                        <label className={`${buttonStyles} cursor-pointer bg-amber-600 text-white hover:bg-amber-700`}>
                                            <Upload className="w-5 h-5" />
                                            Import from CSV
                                            <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                                        </label>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-sm border border-blue-300">
                                            <Upload className="w-4 h-4 text-indigo-600" />
                                            <span>Selected file: {csvFile.name}</span>
                                            <button onClick={handleDeselectFile} className="text-red-500 hover:text-red-700">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* CSV Preview & Mapping */}
                                {csvPreview.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-base font-semibold text-slate-700">Preview & Map Fields</h3>

                                        <div>
                                            <div className="border border-blue-200 rounded-sm overflow-hidden">
                                                <div className="overflow-y-auto" style={{ maxHeight: "500px" }}>
                                                    <table className="w-full border-collapse text-sm" style={{ borderSpacing: 0 }}>
                                                        <thead className="sticky top-0 z-10 bg-blue-100">
                                                            <tr>
                                                                {headers.map(
                                                                    (header, index) =>
                                                                        !droppedColumns.includes(index) && (
                                                                            <th
                                                                                key={`hdr-${index}`}
                                                                                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap border-b border-blue-200"
                                                                            >
                                                                                <div className="flex items-center justify-between gap-2">
                                                                                    <span>{header}</span>
                                                                                    <button
                                                                                        onClick={() => handleDropColumn(index)}
                                                                                        className="text-red-500 hover:text-red-700"
                                                                                        title="Drop column"
                                                                                    >
                                                                                        <Trash2 className="w-4 h-4" />
                                                                                    </button>
                                                                                </div>
                                                                            </th>
                                                                        )
                                                                )}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {csvPreview.map((row, rIndex) => (
                                                                <tr key={`row-${rIndex}`} className="even:bg-blue-50">
                                                                    {Array.from({ length: headers.length }).map((_, cIndex) =>
                                                                        !droppedColumns.includes(cIndex) ? (
                                                                            <td
                                                                                key={`cell-${rIndex}-${cIndex}`}
                                                                                className="px-4 py-3 text-gray-700 border-t border-blue-200 whitespace-nowrap"
                                                                            >
                                                                                {String(row[cIndex] ?? "").trim() !== "" ? row[cIndex] : "-"}
                                                                            </td>
                                                                        ) : null
                                                                    )}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Column-to-Field Mapping */}
                                            <div ref={mappingRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                                                {headers.map(
                                                    (header, index) =>
                                                        !droppedColumns.includes(index) && (
                                                            <div key={`map-${index}`} className="flex flex-col relative">
                                                                <span className="text-sm text-gray-600 mb-1">{header}</span>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => setOpenDropdown(openDropdown === index ? null : index)}
                                                                    className="w-full flex justify-between items-center px-4 py-3 rounded-sm bg-white border border-blue-300 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                                >
                                                                    {mapping[index] ? FIELDS.find((f) => f.key === mapping[index])?.label : "None"}
                                                                    <ChevronDown
                                                                        className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${openDropdown === index ? "rotate-180" : ""
                                                                            }`}
                                                                    />
                                                                </button>

                                                                {openDropdown === index && (
                                                                    <ul className="absolute left-0 mt-2 w-full rounded-sm bg-white border border-blue-100 z-50 max-h-40 overflow-y-auto shadow-sm">
                                                                        <li
                                                                            key={`none-${index}`}
                                                                            onClick={() => {
                                                                                setMapping((prev) => {
                                                                                    const newMapping = { ...prev };
                                                                                    delete newMapping[index];
                                                                                    return newMapping;
                                                                                });
                                                                                setOpenDropdown(null);
                                                                            }}
                                                                            className={`px-4 py-3 cursor-pointer hover:bg-blue-50 hover:text-blue-700 ${!mapping[index] ? "bg-amber-100 text-amber-700" : ""
                                                                                }`}
                                                                        >
                                                                            None
                                                                        </li>

                                                                        {FIELDS.map((field) => (
                                                                            <li
                                                                                key={`field-${index}-${field.key}`}
                                                                                onClick={() => {
                                                                                    setMapping((prev) => ({ ...prev, [index]: field.key }));
                                                                                    setOpenDropdown(null);
                                                                                }}
                                                                                className={`px-4 py-3 cursor-pointer hover:bg-blue-50 hover:text-blue-700 ${mapping[index] === field.key ? "bg-amber-100 text-amber-700" : ""
                                                                                    }`}
                                                                            >
                                                                                {field.label}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                )}
                                                            </div>
                                                        )
                                                )}
                                            </div>
                                        </div>

                                        {/* Labels Dropdown */}
                                        <div className="relative" ref={labelDropdownRef}>
                                            <span className="text-sm text-gray-600 mb-1 block">Select Label</span>

                                            <button
                                                type="button"
                                                onClick={() => setLabelDropdownOpen((s) => !s)}
                                                className="w-full flex justify-between items-center px-4 py-3 rounded-sm bg-white border border-blue-300 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                            >
                                                {selectedLabelId
                                                    ? labels.find((lbl) => lbl.label_id === selectedLabelId)?.name || "Select a label"
                                                    : "Select a label"}
                                                <ChevronDown
                                                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${labelDropdownOpen ? "rotate-180" : ""
                                                        }`}
                                                />
                                            </button>

                                            {labelDropdownOpen && (
                                                <ul className="absolute left-0 mt-2 w-full rounded-sm bg-white border border-blue-100 z-50 max-h-40 overflow-y-auto shadow-sm">
                                                    <li
                                                        key="none-option"
                                                        onClick={() => {
                                                            setSelectedLabelId(null);
                                                            setLabelDropdownOpen(false);
                                                        }}
                                                        className={`px-4 py-3 cursor-pointer hover:bg-blue-50 hover:text-blue-700 ${!selectedLabelId ? "bg-amber-100 text-amber-700" : ""
                                                            }`}
                                                    >
                                                        None
                                                    </li>

                                                    {labels.map((label) => (
                                                        <li
                                                            key={`label-${label.label_id || label.name}`}
                                                            onClick={() => handleSelectLabel(label.label_id)}
                                                            className={`px-4 py-3 cursor-pointer hover:bg-blue-50 hover:text-blue-700 ${selectedLabelId === label.label_id ? "bg-amber-100 text-amber-700" : ""
                                                                }`}
                                                        >
                                                            <span className="inline-flex items-center gap-2">
                                                                {/* optional color bullet if your label has a 'color' prop */}
                                                                {label.color && (
                                                                    <span
                                                                        style={{ backgroundColor: label.color }}
                                                                        className="w-3 h-3 rounded-full inline-block border"
                                                                        aria-hidden
                                                                    />
                                                                )}
                                                                <span>{label.name}</span>
                                                            </span>
                                                        </li>
                                                    ))}

                                                    <li
                                                        key="add-new-label"
                                                        onClick={handleNewLabelClick}
                                                        className="px-4 py-3 cursor-pointer hover:bg-blue-50 hover:text-blue-700 text-blue-600 font-semibold"
                                                    >
                                                        {isLoading ? "Loading..." : "+ Add New Label"}
                                                    </li>
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Download Sample CSV */}
                                <a
                                    href="https://nortifi.s3.eu-north-1.amazonaws.com/nortifi/sample_contacts.csv"
                                    download="sample-contacts.csv"
                                    className={`${buttonStyles} bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                                    </svg>
                                    Download Sample CSV
                                </a>

                                {/* Upload Button */}
                                {csvFile && (
                                    <div className="flex justify-end mt-6">
                                        <button
                                            onClick={handleUploadCSV}
                                            disabled={isUploading}
                                            className={`${buttonStyles} bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
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
                </div>
            </div>
        </>

    );
}

export default ImportContacts;
