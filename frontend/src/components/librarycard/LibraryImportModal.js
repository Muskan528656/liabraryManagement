import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Modal, Spinner, Alert, Table, Button, Form, Badge
} from "react-bootstrap";
import {
  Download, FileEarmarkSpreadsheet, Check2Circle,
  ExclamationCircle, ChevronRight, ChevronLeft,
  CloudArrowUp, LayoutTextWindow,
  ArrowRightCircle, CheckCircleFill, DatabaseFillCheck
} from "react-bootstrap-icons";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import DataApi from "../../api/dataApi";

import "../../App.css";

const LibraryImportModal = ({ show, onClose, onSuccess }) => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [objectTypes, setObjectTypes] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [rawHeaders, setRawHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [map, setMap] = useState({});
  const [importResult, setImportResult] = useState(null);

  const DB_FIELDS = {
    card_number: "Card Number",
    first_name: "First Name",
    last_name: "Last Name",
    email: "Email Address",
    phone_number: "Phone Number",
    country_code: "Country Code",
    image: "Profile Image Path",
    status: "Status",
  };

  const REQUIRED_FIELDS = ["card_number", "first_name", "email"];

  const STEPS_CONFIG = [
    { id: 1, label: "Category" },
    { id: 2, label: "Upload" },
    { id: 3, label: "Mapping" },
    { id: 4, label: "Review" },
    { id: 5, label: "Finish" }
  ];

  useEffect(() => {
    if (show) {
      resetForm();
      fetchObjectTypes();
    }
  }, [show]);

  const resetForm = () => {
    setStep(1);
    setSelectedCategory(null);
    setFile(null);
    setRawHeaders([]);
    setRawRows([]);
    setMap({});
    setError(null);
    setImportResult(null);
  };

  const fetchObjectTypes = async () => {
    try {
      const api = new DataApi("librarycard");
      const res = await api.get("/object-types");

 

      if (res.data?.success) {
        setObjectTypes(res.data.data || []);
 
      } else {
        console.warn("Failed to fetch object types:", res.data?.message || "Unknown error");
        setObjectTypes([]);
      }
    } catch (err) {
      console.error("Error fetching object types:", err);
      setObjectTypes([]);
    }
  };

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    const ext = uploadedFile.name.split(".").pop().toLowerCase();

    const processData = (data) => {
      if (!data || data.length < 2) {
        setError("File appears empty.");
        return;
      }
      const headers = data[0].map(h => h?.toString().trim() || "Untitled");
      setRawHeaders(headers);
      setRawRows(data.slice(1));

      const initialMap = {};
      headers.forEach(h => {
        const norm = h.toLowerCase().replace(/[^a-z]/g, "");
        const match = Object.keys(DB_FIELDS).find(k =>
          k.replace(/[^a-z]/g, "") === norm
        );
        if (match) initialMap[h] = match;
      });

      setMap(initialMap);
      setFile(uploadedFile);
      setStep(3);
    };

    if (ext === "csv") {
      Papa.parse(uploadedFile, {
        skipEmptyLines: true,
        complete: (res) => processData(res.data),
      });
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        processData(XLSX.utils.sheet_to_json(ws, { header: 1 }));
      };
      reader.readAsBinaryString(uploadedFile);
    }
  };

  const handleImport = async () => {
    const mapped = Object.values(map);
    const missing = REQUIRED_FIELDS.filter(f => !mapped.includes(f));
    if (missing.length) {
      setError(`Missing required fields: ${missing.map(f => DB_FIELDS[f]).join(", ")}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const payload = rawRows.map(row => {
        const record = { type_id: selectedCategory.id };
        rawHeaders.forEach((h, i) => {
          if (map[h]) record[map[h]] = row[i];
        });
        return record;
      });

      const api = new DataApi("librarycard/import");
      const res = await api.create({ members: payload });

      setImportResult({
        count: payload.length,
        message: res.data?.message || "Import completed successfully.",
      });
      setStep(5);
    } catch (err) {
      setError(err.response?.data?.message || "Import failed. Please check your data.");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = Object.keys(DB_FIELDS).join(",");
    const blob = new Blob([headers], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "library_member_template.csv";
    link.click();
  };

  const handleFinish = () => {
    if (onSuccess && typeof onSuccess === "function") onSuccess();
    onClose();
    navigate("/librarycard");
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" centered dialogClassName="rounded-modal">
      <Modal.Header  
      className="py-3 fw-bold"
      style={{
          color: "var(--primary-color)",
          background: "var(--primary-background-color)",
          borderRadius: "5px",
          fontSize:"20px"

      }}>
        Import Library Members

        <button type="button" className="btn-close" onClick={onClose}></button>
      </Modal.Header>
      <Modal.Body className="p-0 overflow-hidden">
        <div className="row g-0">

          <div className="col-md-3 border-end p-4 d-none d-md-block" style={{ background: 'var(--primary-background-color)' }}>
            {/* <h5 className="mb-4" style={{ color: 'var(--primary-color)' }}>Member Import</h5> */}
            <div className="vertical-stepper">
              {STEPS_CONFIG.map((s) => (
                <div key={s.id} className={`v-step ${step >= s.id ? 'active' : ''} ${step > s.id ? 'completed' : ''}`}>
                  <div className="v-circle">{step > s.id ? <Check2Circle size={16} /> : s.id}</div>
                  <div className="v-label" style={{ color: 'var(--primary-color)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-md-9 p-4 bg-white min-vh-50 position-relative">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold m-0" style={{ color: 'var(--primary-color)' }}>
                {step === 1 && "Import Settings"}
                {step === 2 && "Source File"}
                {step === 3 && "Match Columns"}
                {step === 4 && "Review Data"}
                {step === 5 && "All Set!"}
              </h4>
            </div>

            {error && (
              <Alert variant="danger" className="border-0 shadow-sm d-flex align-items-center rounded-4 fade-in">
                <ExclamationCircle className="me-2" /> {error}
              </Alert>
            )}

            {step === 1 && (
              <div className="fade-in text-center">
                <div className="category-icon-header">
                  <LayoutTextWindow size={32} style={{ color: 'var(--primary-color)' }} />
                </div>
                <p className="text-muted mt-3">Select the library category for this import.</p>
                <Form.Group className="mb-2 mx-auto" style={{ maxWidth: '400px'}}>
                  <Form.Select
                    size="md"
                    className="modern-dropdown py-1"
                    onChange={(e) => {
                      const cat = objectTypes.find(o => String(o.id) === e.target.value);
                      setSelectedCategory(cat);
                    }}
                  >
                    <option value="">Select Category</option>
                    {objectTypes.map(o => (
                      <option key={o.id} value={o.id}>{o.type}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <div className="d-grid float-end mt-5" style={{ maxWidth: '400px' }}>
                  <Button
                    size="sm"
                    variant=""
                    className="fw-bold shadow-sm py-2"
                     style={{
                        color: "var(--primary-color)",
                        background: "var(--primary-background-color)",
                        borderRadius: "5px",
                        border:'var(--primary-color) solid 1px'
                      }}
                    disabled={!selectedCategory}
                    onClick={() => setStep(2)}
                  >
                    Proceed to Upload <ChevronRight className="ms-1" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="fade-in text-center py-1">
                <div className="upload-dropzone" onClick={() => document.getElementById('fileInput').click()}>
                  <input type="file" id="fileInput" hidden onChange={handleFileChange} accept=".csv,.xlsx" />
                  <div className="upload-icon-circle"><CloudArrowUp size={35} style={{ color: 'var(--primary-color)' }} /></div>
                  <h5 className="mt-3 fw-bold">Choose a file to import</h5>
                  <p className="text-muted small">Excel (.xlsx) or CSV files (Max 5MB)</p>
                  <Badge bg="soft-primary" className="text-primary p-2 mt-2" style={{ color: 'var(--primary-color)' }}>
                    Group: {selectedCategory?.type || ''}
                  </Badge>
                </div>
                <Button variant="link" className="mt-4 text-decoration-none " 
                 style={{
                    color: "var(--primary-color)",
                    background: "var(--primary-background-color)",
                    borderRadius: "5px",
                    border:'var(--primary-color) solid 1px'
                    }}  
                  onClick={downloadTemplate}><Download className="me-2" /> Download Template</Button>
              </div>
            )}

            {step === 3 && (
              <div className="fade-in">
                <div className="mapping-scroll-area">
                  {rawHeaders.map((h, idx) => (
                    <div key={idx} className="mapping-card shadow-sm border-0 mb-2">
                      <div className="file-col">
                        <FileEarmarkSpreadsheet className="me-2" style={{ color: 'var(--primary-color)' }} />
                        <span className="text-truncate">{h}</span>
                      </div>
                      <ArrowRightCircle className="text-muted mx-3" />
                      <div className="db-col">
                        <Form.Select size="sm" value={map[h] || ""} onChange={(e) => setMap({ ...map, [h]: e.target.value })}>
                          <option value="">Ignore</option>
                          {Object.entries(DB_FIELDS).map(([k, v]) => (
                            <option key={k} value={k}>{v} {REQUIRED_FIELDS.includes(k) ? '*' : ''}</option>
                          ))}
                        </Form.Select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: PREVIEW */}
            {step === 4 && (
              <div className="fade-in">
                <div className="preview-container shadow-sm overflow-auto">
                  <Table responsive hover className="mb-0 custom-table"  style={{
                    background: "var(--primary-background-color)",
                  
                  }} >
                    <thead>
                      <tr>{Object.keys(DB_FIELDS).map(k => <th key={k}>{DB_FIELDS[k]}</th>)}</tr>
                    </thead>
                    <tbody>
                      {rawRows.slice(0, 5).map((row, i) => (
                        <tr key={i}>{Object.keys(DB_FIELDS).map(k => {
                          const sourceHeader = Object.keys(map).find(h => map[h] === k);
                          const val = sourceHeader ? row[rawHeaders.indexOf(sourceHeader)] : "-";
                          return <td key={k} title={val}>{val || "-"}</td>;
                        })}</tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="text-center py-5 fade-in">
                <div className="success-bounce mb-4"><CheckCircleFill size={70} className="text-success" /></div>
                <h3 className="fw-bold">Import Completed!</h3>
                <p className="text-muted fs-6 mb-4">{importResult?.message}</p>
                <div className="stat-box mx-auto mb-4">
                  <div className="h2 fw-bold text-primary mb-0">{importResult?.count}</div>
                  <div className="small text-uppercase tracking-wider text-muted">Records Added</div>
                </div>
                <Button
                  size="sm"
                  className="px-4 rounded-pill shadow-sm fw-bold py-2"
                  style={{
                    backgroundColor: 'var(--primary-color)',
                    borderColor: 'var(--primary-color)',
                    color: '#fff'
                  }}
                  onClick={handleFinish}
                >
                  Return to Members List
                </Button>
              </div>
            )}

            {step > 1 && step < 5 && (
              <div className="mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  style={{
                    color: "var(--primary-color)",
                    background: "var(--primary-background-color)",
                    borderRadius: "5px",
                    border:'var(--primary-color) solid 1px'
                  }}
                  onClick={() => setStep(step - 1)}
                >
                  <ChevronLeft /> Back
                </Button>
                <div className="d-flex gap-2">
                  {step === 3 && (
                    <Button
                      size="sm"
 
                      variant=""
                      style={{
                        color: "var(--primary-color)",
                        background: "var(--primary-background-color)",
                        borderRadius: "5px",
                        border:'var(--primary-color) solid 1px'
                      }}
                      onClick={() => setStep(4)}
                    >
                      Preview Data
                    </Button>
                  )}
                  {step === 4 && (
                    <Button
                      size="sm"
                      variant="var(--primary-color)"
 
                      style={{
                        color: "var(--primary-color)",
                        background: "var(--primary-background-color)",
                        borderRadius: "5px",
                        border:'var(--primary-color) solid 1px'
                      }}
                      onClick={handleImport}
                      disabled={loading}
                    >
                      {loading ? <Spinner size="sm" /> : <><DatabaseFillCheck className="me-1" /> Start Import</>}
                    </Button>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default LibraryImportModal;