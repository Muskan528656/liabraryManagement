
import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  CloudArrowUp, Download, ChevronRight, ChevronLeft,
  FileEarmarkSpreadsheet, Check2Circle, ExclamationCircle,
  ArrowRightCircle, CheckCircleFill, DashCircle,
  ArrowClockwise, ListCheck, Table as TableIcon
} from "react-bootstrap-icons";

// --- HELPERS ---
export const createModel = ({ modelName, fields = {}, required = [], validators = {} }) => {
  return { modelName, fields, required, validators };
};

export default function UniversalCSVXLSXImporter({ model, onDataParsed }) {
  const activeFields = model ? Object.keys(model.fields).reduce((acc, key) => {
    acc[key] = key;
    return acc;
  }, {}) : {};
  const activeRequired = model ? model.required : [];
  const fieldLabels = model ? model.fields : {};

  const [step, setStep] = useState(0);
  const [rawHeaders, setRawHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [map, setMap] = useState({});
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const STEPS_CONFIG = [
    { id: 0, label: "Upload", icon: <CloudArrowUp /> },
    { id: 1, label: "Map Columns", icon: <ListCheck /> },
    { id: 2, label: "Preview", icon: <TableIcon /> },
    { id: 3, label: "Results", icon: <Check2Circle /> }
  ];

  // --- DOWNLOAD TEMPLATE ---
  const handleDownloadSample = () => {
    if (!model || !model.fields) return;
    const headers = Object.values(model.fields);
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${model.modelName || "data"}_template.csv`, { bookType: "csv" });
  };

  // --- FILE HANDLING ---
  const handleFile = (uploadedFile) => {
    setError(null);
    if (!uploadedFile) return;
    const ext = uploadedFile.name.split(".").pop().toLowerCase();

    const handleResult = (data) => {
      if (!data || data.length < 2) {
        setError("The uploaded file appears to be empty.");
        return;
      }
      const headers = data[0].map((h) => (h ? h.toString().trim() : "Untitled"));
      setRawHeaders(headers);
      setRawRows(data.slice(1));

      const initialMap = {};
      headers.forEach((h) => {
        const normH = h.toLowerCase().replace(/[^a-z0-9]/g, "");
        const match = Object.keys(activeFields).find((key) => {
          const label = (fieldLabels[key] || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          return key.toLowerCase() === normH || label === normH;
        });
        if (match) initialMap[h] = match;
      });
      setMap(initialMap);
      setStep(1);
    };

    if (ext === "csv") {
      Papa.parse(uploadedFile, {
        skipEmptyLines: true,
        complete: (res) => handleResult(res.data),
        error: () => setError("Failed to parse CSV file."),
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: "array" });
          const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
          handleResult(json);
        } catch (err) { setError("Failed to parse Excel file."); }
      };
      reader.readAsArrayBuffer(uploadedFile);
    }
  };

  const handleImport = async () => {
    const missing = activeRequired.filter(req => !Object.values(map).includes(req));
    if (missing.length > 0) {
      setError(`Required fields missing: ${missing.map(k => fieldLabels[k] || k).join(", ")}`);
      return;
    }

    const finalData = rawRows.map(row => {
      const obj = {};
      rawHeaders.forEach((h, i) => {
        if (map[h]) obj[map[h]] = row[i];
      });
      return obj;
    });

    if (onDataParsed) {
      setIsProcessing(true);
      try {
        const result = await onDataParsed(finalData);
        setImportResult(result);
        setStep(3);
      } catch (err) {
        setError("Server Error: Import failed to process.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="cahaya-importer-container">
      <div className="cahaya-card-wrapper row g-0">

        {/* SIDEBAR NAVIGATION */}
        <div className="col-md-3 border-end d-none d-md-block" style={{
          color: "var(--primary-color)",
          background: "var(--primary-background-color)",
          fontSize: "20px"

        }}>
          {/* <div className="sidebar-brand mb-3" style={{ fontSize: '0.9rem', padding: '12px 0 0 16px' }}>
            Importer Wizard
          </div> */}
          <div className="vertical-stepper">
            {STEPS_CONFIG.map((s) => (
              <div key={s.id} className={`v-step ${step >= s.id ? 'active' : ''} ${step > s.id ? 'completed' : ''}`}>
                <div className="v-circle">{step > s.id ? <CheckCircleFill size={14} /> : s.id + 1}</div>
                <div className="v-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="col-md-9 p-3 bg-white position-relative">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold m-0 text-dark" style={{ fontSize: '1rem' }}>
              {STEPS_CONFIG[step].label}
            </h5>
            <div className="badge bg-soft-primary text-primary px-2 py-1"
              style={{
                color: "var(--primary-color)",
                background: "var(--primary-background-color)",
                borderRadius: "5px",
              }}>
              {model?.modelName || "Standard Import"}
            </div>
          </div>

          {error && (
            <div className="alert alert-danger border-0 rounded-3 shadow-sm fade-in d-flex align-items-center mb-3 py-2" style={{ fontSize: '0.875rem' }}>
              <ExclamationCircle className="me-2" size={16} /> {error}
            </div>
          )}

          {/* STEP 0: UPLOAD */}
          {step === 0 && (
            <div className="fade-in py-3 text-center">
              <div className="upload-dropzone" onClick={() => document.querySelector('.hidden-input').click()}>
                <input type="file" className="hidden-input" hidden onChange={(e) => handleFile(e.target.files[0])} accept=".csv, .xlsx, .xls" />
                <div className="upload-icon-circle">
                  <CloudArrowUp size={24} />
                </div>
                <h6 className="mt-2 fw-bold" style={{ fontSize: '0.95rem' }}>Select source file</h6>
                <p className="text-muted small" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Drop your CSV or Excel file here to start mapping</p>
                <div className="text-primary fw-medium" style={{ fontSize: '0.75rem' }}>Supported: .csv, .xlsx, .xls</div>
              </div>
              <button onClick={handleDownloadSample} className="btn btn-link text-decoration-none text-secondary mt-3 small d-flex align-items-center justify-content-center mx-auto"
                style={{
                  color: "var(--primary-color)",
                  background: "var(--primary-background-color)",
                  borderRadius: "5px",
                  border: "1px solid var(--primary-color)",
                }}
              >
                <Download className="me-1" size={14} /> Download Template CSV
              </button>
            </div>
          )}

          {/* STEP 1: MAPPING */}
          {step === 1 && (
            <div className="fade-in">
              <div className="mapping-container">
                {rawHeaders.map((header, idx) => (
                  <div key={idx} className={`mapping-item-card ${map[header] ? 'mapped' : ''}`}>
                    <div className="source-info">
                      <FileEarmarkSpreadsheet className="text-muted me-2" size={14} />
                      <span className="text-truncate fw-medium" title={header}>{header}</span>
                    </div>
                    <div className="mapping-arrow">
                      <ArrowRightCircle size={16} />
                    </div>
                    <div className="target-select">
                      <select
                        className="form-select form-select-sm modern-select"
                        value={map[header] || ""}
                        onChange={(e) => setMap({ ...map, [header]: e.target.value })}
                        style={{ fontSize: '0.85rem', padding: '4px 8px' }}
                      >
                        <option value="">-- Ignore Column --</option>
                        {Object.keys(activeFields).map((key) => (
                          <option key={key} value={key}>
                            {fieldLabels[key] || key} {activeRequired.includes(key) ? "*" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW */}
          {step === 2 && (
            <div className="fade-in">
              <div className="preview-table-wrapper shadow-sm border rounded-3">
                <table className="table table-hover mb-0 custom-preview-table">
                  <thead>
                    <tr>
                      {Object.values(activeFields).map((key, i) => (
                        <th key={i} style={{ fontSize: '0.8rem', padding: '8px' }}>{fieldLabels[key] || key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rawRows.slice(0, 8).map((row, rIdx) => (
                      <tr key={rIdx}>
                        {Object.keys(activeFields).map((key, cIdx) => {
                          const header = Object.keys(map).find(h => map[h] === key);
                          const index = rawHeaders.indexOf(header);
                          const val = index !== -1 ? row[index] : "";
                          return <td key={cIdx} className="text-truncate" style={{ fontSize: '0.85rem', padding: '8px' }}>{val || <span className="text-light">-</span>}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-muted small mt-1 px-1" style={{ fontSize: '0.75rem' }}>Showing a preview of the first 8 rows.</p>
            </div>
          )}

          {/* STEP 3: RESULTS */}
          {step === 3 && importResult && (
            <div className="fade-in py-2">
              <div className="row g-2 mb-3">
                <div className="col-4">
                  <div className="stat-card success">
                    <div className="stat-val">{importResult.successCount}</div>
                    <div className="stat-label">Imported</div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="stat-card warning">
                    <div className="stat-val">{importResult.duplicates?.length || 0}</div>
                    <div className="stat-label">Duplicates</div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="stat-card danger">
                    <div className="stat-val">{importResult.errors?.length || 0}</div>
                    <div className="stat-label">Failed</div>
                  </div>
                </div>
              </div>

              <div className="result-log-area border rounded-3 p-2 bg-light" style={{ fontSize: '0.85rem' }}>
                <h6 className="fw-bold mb-2" style={{ fontSize: '0.9rem' }}>Event Logs</h6>
                <div className="log-scroll">
                  {importResult.successCount > 0 && (
                    <div className="log-line text-success small mb-1 d-flex align-items-center">
                      <CheckCircleFill className="me-1" size={14} /> Successfully added {importResult.successCount} records.
                    </div>
                  )}
                  {importResult.duplicates?.map((d, i) => (
                    <div key={i} className="log-line text-warning small mb-1 d-flex align-items-start">
                      <DashCircle className="me-1 mt-1" size={14} /> <div>Duplicate skipped at Row {d.row}: {d.message}</div>
                    </div>
                  ))}
                  {importResult.errors?.map((e, i) => (
                    <div key={i} className="log-line text-danger small mb-1 d-flex align-items-start">
                      <ExclamationCircle className="me-1 mt-1" size={14} /> <div>Error at Row {e.row}: {e.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="mt-4 d-flex justify-content-between align-items-center">
            {step > 0 && step < 3 ? (
              <button
                variant="outline-secondary"
                size="sm"
                style={{
                  color: "var(--primary-color)",
                  background: "var(--primary-background-color)",
                  borderRadius: "5px",
                  border: 'var(--primary-color) solid 1px'
                }}
                onClick={() => setStep(step - 1)}
              >
                <ChevronLeft /> Back
              </button>
            ) : <div></div>}

            <div className="d-flex gap-2">
              {step === 1 && (
                <button className="btn px-3 shadow-sm" style={{
                  color: "var(--primary-color)",
                  background: "var(--primary-background-color)",
                  borderRadius: "5px",
                }}
                  onClick={() => setStep(2)}>
                  Preview Data <ChevronRight size={12} className="ms-1" />
                </button>
              )}
              {step === 2 && (
                <button className="btn px-3 shadow-sm d-flex align-items-center" style={{
                  color: "var(--primary-color)",
                  background: "var(--primary-background-color)",
                  borderRadius: "5px"
                }} onClick={handleImport} disabled={isProcessing}>
                  {isProcessing ? (
                    <><span className="spinner-border spinner-border-sm me-1"></span> Processing...</>
                  ) : (
                    <><Check2Circle className="me-1" size={14} /> Confirm Import</>
                  )}
                </button>
              )}
              {step === 3 && (
                <button className="btn btn-primary rounded-pill px-3 shadow-sm" style={{ fontSize: '0.85rem' }} onClick={() => { setStep(0); setImportResult(null); setMap({}); }}>
                  <ArrowClockwise className="me-1" size={14} /> Import Another File
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .cahaya-importer-container { background: transparent; padding: 8px; }
        .cahaya-card-wrapper { border-radius: 20px; overflow: hidden; background: #fff; border: 1px solid #f0f0f0; box-shadow: 0 5px 20px rgba(0,0,0,0.04); }
        
        /* Stepper */
        .vertical-stepper { display: flex; flex-direction: column; gap: 16px; padding: 12px 16px; }
        .v-step { display: flex; align-items: center; gap: 10px; }
        .v-circle { 
          width: 24px; height: 24px; border-radius: 50%; background: #fff; border: 2px solid #ddd;
          display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; color: #999;
        }
        .v-step.active .v-circle { border-color: var(--primary-color, #0d6efd); color: var(--primary-color, #0d6efd); }
        .v-step.completed .v-circle { background: var(--primary-color, #0d6efd); border-color: var(--primary-color, #0d6efd); color: #fff; }
        .v-label { font-size: 12px; color: #888; font-weight: 500; }
        .v-step.active .v-label { color: #000; }

        /* Step 0: Upload */
        .upload-dropzone {
          border: 2px dashed #e2e8f0; border-radius: 16px; padding: 24px;
          background: #f8fafc; transition: 0.3s; cursor: pointer;
        }
        .upload-dropzone:hover { border-color: var(--primary-color, #0d6efd); background: #eff6ff; }
        .upload-icon-circle { width: 48px; height: 48px; background: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; color: var(--primary-color, #0d6efd); box-shadow: 0 3px 8px rgba(0,0,0,0.05); }

        /* Step 1: Mapping */
        .mapping-container { max-height: 320px; overflow-y: auto; padding-right: 6px; }
        .mapping-item-card {
          display: flex; align-items: center; padding: 8px 12px; border: 1px solid #f0f0f0;
          border-radius: 12px; margin-bottom: 6px; transition: 0.2s;
        }
        .mapping-item-card:hover { border-color: var(--primary-color, #0d6efd); background: #fcfdfe; }
        .mapping-item-card.mapped { border-left: 3px solid var(--primary-color, #0d6efd); background: #f8fbff; }
        .source-info { flex: 1; display: flex; align-items: center; font-size: 13px; }
        .mapping-arrow { padding: 0 10px; color: #ccc; }
        .target-select { flex: 1; }
        .modern-select { border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; }

        /* Step 2: Preview */
        .preview-table-wrapper { overflow-x: auto; border-radius: 12px; }
        .custom-preview-table th { background: #f8fafc; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #f1f5f9; }
        .custom-preview-table td { font-size: 12px; }

        /* Step 3: Result Stats */
        .stat-card { padding: 10px; border-radius: 14px; text-align: center; }
        .stat-card.success { background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; }
        .stat-card.warning { background: #fffbeb; color: #b45309; border: 1px solid #fef3c7; }
        .stat-card.danger { background: #fef2f2; color: #b91c1c; border: 1px solid #fee2e2; }
        .stat-val { font-size: 18px; font-weight: 800; }
        .stat-label { font-size: 10px; font-weight: 600; text-transform: uppercase; opacity: 0.8; }
        .log-scroll { max-height: 180px; overflow-y: auto; }

        /* Global Helpers */
        .fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .bg-soft-primary { background: #e0e7ff; }
      `}</style>
    </div>
  );
}