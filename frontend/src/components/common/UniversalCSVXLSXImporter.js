import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import '../../App.css'; 

export const createModel = ({ modelName, fields = {}, required = [], validators = {} }) => {
  return { modelName, fields, required, validators };
};

// --- ICONS ---
const IconUpload = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>);
const IconFile = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>);
const IconArrowRight = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>);
const IconCheck = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IconAlert = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>);
const IconSpinner = () => (<svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>);

// New Status Icons
const IconSuccessCircle = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>);
const IconWarningTriangle = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const IconErrorX = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>);

const UploadBox = ({ onChange }) => {
  return (
    <div className="ui-upload-zone compact">
      <input type="file" accept=".csv, .xls, .xlsx" className="ui-file-input" onChange={onChange} />
      <div className="ui-upload-content">
        <IconUpload />
        <div className="ui-upload-text">
          <span className="link">Click to upload</span>
          <span className="sub"> (.csv, .xlsx)</span>
        </div>
      </div>
    </div>
  );
};

const Button = ({ children, variant = "secondary", onClick, disabled, isLoading }) => {
  return (
    <button onClick={onClick} disabled={disabled || isLoading} className={`ui-btn ui-btn-${variant}`}>
      {isLoading && <IconSpinner />}
      {children}
    </button>
  );
};

export default function UniversalCSVXLSXImporter({ model, onDataParsed }) {

  const activeFields = model ? Object.keys(model.fields).reduce((acc, key) => {
    acc[key] = key;
    return acc;
  }, {}) : {};
  const activeRequired = model ? model.required : [];
  const fieldLabels = model ? model.fields : {};

  const [step, setStep] = useState(0); // 0: Upload, 1: Map, 2: Preview, 3: Result
  const [rawHeaders, setRawHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [map, setMap] = useState({}); 
  const [error, setError] = useState(null);
  
  // New States for Processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleFile = (uploadedFile) => {
    setError(null);
    setImportResult(null);
    if (!uploadedFile) return;
    const ext = uploadedFile.name.split(".").pop().toLowerCase();
    
    const handleResult = (data) => {
      if (!data || data.length < 2) {
        setError("File appears empty.");
        return;
      }
      const headers = data[0].map((h) => (h ? h.toString().trim() : "Untitled"));
      const rows = data.slice(1);
      
      setRawHeaders(headers);
      setRawRows(rows);

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
        error: () => setError("Failed to parse CSV."),
      });
    } else if (["xls", "xlsx"].includes(ext)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          handleResult(json);
        } catch (err) { setError("Failed to parse Excel file."); }
      };
      reader.readAsArrayBuffer(uploadedFile);
    } else {
      setError("Unsupported format.");
    }
  };

  const handleImport = async () => {
    const missing = activeRequired.filter(req => !Object.values(map).includes(req));
    if (missing.length > 0) {
      setError(`Missing required columns: ${missing.map(k => fieldLabels[k] || k).join(", ")}`);
      return;
    }

    const finalData = rawRows.map(row => {
      const obj = {};
      rawHeaders.forEach((h, i) => {
        if(map[h]) obj[map[h]] = row[i];
      });
      return obj;
    });

    if(onDataParsed) {
      setIsProcessing(true);
      try {
        // We expect the parent to return a report object
        const result = await onDataParsed(finalData);
        setImportResult(result);
        setStep(3); // Move to Result View
      } catch (err) {
        setError("An unexpected error occurred during import.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const resetImporter = () => {
    setStep(0);
    setRawHeaders([]);
    setRawRows([]);
    setMap({});
    setError(null);
    setImportResult(null);
  };

  const steps = ["Upload", "Map", "Preview", "Result"];

  return (
    <div className="ui-importer-wrapper compact-mode">
      
      <div className="ui-header-compact">
        <div className="ui-stepper-compact">
          {steps.map((label, idx) => {
             // If we are at results, keep previous steps as 'completed'
             const active = step === idx;
             const completed = step > idx;
             return (
               <div key={idx} className={`ui-step-item ${active ? 'active' : ''} ${completed ? 'completed' : ''}`}>
                 <div className="ui-step-circle">
                   {completed ? <IconCheck /> : idx + 1}
                 </div>
                 <span className="ui-step-label">{label}</span>
                 {idx < steps.length - 1 && <div className="ui-step-line"></div>}
               </div>
             )
          })}
        </div>
      </div>

      <div className="ui-body-compact">
        {error && (
          <div className="ui-error-banner">
            <IconAlert /> <span>{error}</span>
          </div>
        )}

        {step === 0 && (
          <div className="ui-step-content center-content">
             <UploadBox onChange={(e) => handleFile(e.target.files[0])} />
          </div>
        )}

        {step === 1 && (
          <div className="ui-step-content no-scroll">
            <div className="ui-mapping-table-header">
              <div className="col-source">Source File Column</div>
              <div className="col-arrow"></div>
              <div className="col-target">Database Field</div>
            </div>
            <div className="ui-mapping-list-scroll">
              {rawHeaders.map((header, idx) => {
                const isMapped = !!map[header];
                return (
                  <div key={idx} className={`ui-map-row ${isMapped ? "mapped" : ""}`}>
                    <div className="col-source">
                      <IconFile />
                      <span className="text-val" title={header}>{header}</span>
                    </div>
                    <div className="col-arrow"><IconArrowRight /></div>
                    <div className="col-target">
                      <select
                        className={`ui-select-compact ${isMapped ? "filled" : ""}`}
                        value={map[header] || ""}
                        onChange={(e) => setMap({ ...map, [header]: e.target.value })}
                      >
                        <option value="">-- Ignore --</option>
                        {Object.keys(activeFields).map((key) => (
                          <option key={key} value={key}>
                            {fieldLabels[key] || key} {activeRequired.includes(key) ? "*" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="ui-step-content">
            <div className="ui-table-container">
              <table className="ui-preview-table">
                <thead>
                  <tr>
                    {Object.values(activeFields).map((key, i) => (
                      <th key={i}>{fieldLabels[key] || key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rawRows.slice(0, 10).map((row, rIdx) => (
                    <tr key={rIdx}>
                      {Object.keys(activeFields).map((key, cIdx) => {
                        const header = Object.keys(map).find(h => map[h] === key);
                        const index = rawHeaders.indexOf(header);
                        const val = index !== -1 ? row[index] : "";
                        return (
                          <td key={cIdx} title={val}>
                             {val || <span className="empty">-</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="ui-table-footer-note">Showing first 10 rows</div>
          </div>
        )}

        {/* --- STEP 3: RESULTS DISPLAY --- */}
        {step === 3 && importResult && (
          <div className="ui-step-content scroll-y">
            
            {/* Success Summary Header */}
            <div className="ui-result-summary">
              <div className="summary-card success">
                <span className="lbl">Success</span>
                <span className="val">{importResult.successCount}</span>
              </div>
              <div className="summary-card warning">
                 <span className="lbl">Duplicates</span>
                 <span className="val">{importResult.duplicates?.length || 0}</span>
              </div>
              <div className="summary-card error">
                 <span className="lbl">Failed</span>
                 <span className="val">{importResult.errors?.length || 0}</span>
              </div>
            </div>

            {/* Detailed Logs */}
            <div className="ui-result-logs">
              
              {/* Green Success Message */}
              {importResult.successCount > 0 && (
                <div className="log-item log-success">
                  <IconSuccessCircle />
                  <span>Successfully inserted {importResult.successCount} records.</span>
                </div>
              )}

              {/* Orange Duplicate Messages */}
              {importResult.duplicates?.map((dup, i) => (
                <div key={`dup-${i}`} className="log-item log-warning">
                  <IconWarningTriangle />
                  <div className="log-text">
                    <strong>Duplicate found:</strong> {dup.message}
                    {dup.row && <span className="log-row-badge">Row {dup.row}</span>}
                  </div>
                </div>
              ))}

              {/* Red Error Messages */}
              {importResult.errors?.map((err, i) => (
                <div key={`err-${i}`} className="log-item log-error">
                  <IconErrorX />
                  <div className="log-text">
                    <strong>Import Failed:</strong> {err.message}
                    {err.row && <span className="log-row-badge">Row {err.row}</span>}
                  </div>
                </div>
              ))}
              
              {(!importResult.duplicates?.length && !importResult.errors?.length && importResult.successCount === 0) && (
                <div className="log-item">No records were processed.</div>
              )}
            </div>

          </div>
        )}
      </div>

      {step > 0 && (
        <div className="ui-footer-compact">
          {step !== 3 && (
            <Button onClick={() => { setError(null); setStep(step - 1); }} disabled={isProcessing}>
              Back
            </Button>
          )}
          
          {step === 1 && (
            <Button variant="primary" onClick={() => setStep(2)}>
              Preview Data
            </Button>
          )}
          
          {step === 2 && (
            <Button variant="success" onClick={handleImport} isLoading={isProcessing}>
              {isProcessing ? "Importing..." : "Import Data"}
            </Button>
          )}

          {step === 3 && (
            <Button variant="primary" onClick={resetImporter}>
              Upload Another File
            </Button>
          )}
        </div>
      )}
    </div>
  );
}