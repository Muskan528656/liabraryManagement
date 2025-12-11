import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import '../../App.css'

export const createModel = ({ modelName, fields = {}, required = [], validators = {} }) => {
  return { modelName, fields, required, validators };
};

const IconUpload = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
);
const IconFile = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
);
const IconArrowRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
);
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
);


const UploadBox = ({ onChange }) => {
  return (
    <div className="ui-upload-zone">
      <input type="file" accept=".csv, .xls, .xlsx" className="ui-file-input" onChange={onChange} />
      <div className="ui-upload-icon-wrapper">
        <IconUpload />
      </div>
      <p className="ui-upload-text-main">
        Click or drop file here
      </p>
      <p className="ui-upload-text-sub">
        Supports CSV, Excel (.xls, .xlsx)
      </p>
    </div>
  );
};

const Button = ({ children, variant = "secondary", onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`ui-btn ui-btn-${variant}`}
    >
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

  const [step, setStep] = useState(0);
  const [rawHeaders, setRawHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [map, setMap] = useState({});
  const [error, setError] = useState(null);

  const handleFile = (uploadedFile) => {
    setError(null);
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

  const handleImport = () => {
    const missing = activeRequired.filter(req => !Object.values(map).includes(req));
    if (missing.length > 0) {
      setError(`Required fields missing: ${missing.map(k => fieldLabels[k] || k).join(", ")}`);
      return;
    }
    const finalData = rawRows.map(row => {
      const obj = {};
      rawHeaders.forEach((h, i) => {
        if(map[h]) obj[map[h]] = row[i];
      });
      return obj;
    });
    if(onDataParsed) onDataParsed(finalData);
  };

  const steps = ["Upload File", "Map Columns", "Preview"];

  return (
    <div className="ui-importer-container">

      <div className="ui-header">
        <div className="ui-stepper-container">
          <div className="ui-step-line"></div>
          {steps.map((label, idx) => {
             const active = step === idx;
             const completed = step > idx;
             let circleClass = "ui-step-circle";
             if(active) circleClass += " active";
             if(completed) circleClass += " completed";

             let labelClass = "ui-step-label";
             if(active || completed) labelClass += " active";

             return (
               <div key={idx} className="ui-step-item">
                 <div className={circleClass}>
                   {completed ? <IconCheck /> : idx + 1}
                 </div>
                 <div className={labelClass}>{label}</div>
               </div>
             )
          })}
        </div>
        <h2 className="ui-title">{steps[step]}</h2>
        <p className="ui-subtitle">
          {step === 0 && "Upload your data to get started. We support CSV and Excel files."}
          {step === 1 && "Match your file columns to the database fields below."}
          {step === 2 && "Review the data snapshot before finalizing the import."}
        </p>
      </div>

      <div className="ui-body">
        {error && (
          <div className="ui-error-box">
            <IconAlert /> <strong>Error:</strong> {error}
          </div>
        )}

        {step === 0 && (
          <UploadBox onChange={(e) => handleFile(e.target.files[0])} />
        )}

        {step === 1 && (
          <div>
            <div className="ui-mapping-header">
              <span style={{ flex: 2 }}>File Column</span>
              <span style={{ flex: 0.5 }}></span>
              <span style={{ flex: 2 }}>Target Field</span>
            </div>
            <div className="ui-mapping-list">
              {rawHeaders.map((header, idx) => {
                const isMapped = !!map[header];
                return (
                  <div key={idx} className={`ui-map-card ${isMapped ? "mapped" : ""}`}>
                    <div className="ui-map-source">
                      <div className="ui-map-icon">
                        <IconFile />
                      </div>
                      {header}
                    </div>
                    <div className="ui-map-arrow"><IconArrowRight /></div>
                    <div className="ui-map-target">
                      <select
                        className={`ui-select ${isMapped ? "active" : ""}`}
                        value={map[header] || ""}
                        onChange={(e) => setMap({ ...map, [header]: e.target.value })}
                      >
                        <option value="">Do not import</option>
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
          <div className="ui-table-wrapper">
            <table className="ui-table">
              <thead>
                <tr>
                  {Object.values(activeFields).map((key, i) => (
                    <th key={i}>{fieldLabels[key] || key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rawRows.slice(0, 5).map((row, rIdx) => (
                  <tr key={rIdx}>
                    {Object.keys(activeFields).map((key, cIdx) => {
                      const header = Object.keys(map).find(h => map[h] === key);
                      const index = rawHeaders.indexOf(header);
                      return (
                        <td key={cIdx}>
                          {index !== -1 ? row[index] : <span className="ui-empty-cell">-</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {step > 0 && (
          <div className="ui-footer">
            <Button onClick={() => { setError(null); setStep(step - 1); }}>
              Back
            </Button>
            {step === 1 && (
              <Button variant="primary" onClick={() => setStep(2)}>
                Review Data <IconArrowRight />
              </Button>
            )}
            {step === 2 && (
              <Button variant="success" onClick={handleImport}>
                Complete Import <IconCheck />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}