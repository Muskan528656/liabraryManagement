import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export const createModel = ({ modelName, fields = {}, required = [], validators = {} }) => {
  return { modelName, fields, required, validators };
};

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    color: "#333",
  },
  errorBox: {
    padding: "10px",
    backgroundColor: "#ffebee",
    color: "#c62828",
    border: "1px solid #ffcdd2",
    borderRadius: "4px",
    marginBottom: "15px",
  },
  uploadBox: {
    height: "200px",
    border: "2px dashed #ccc",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
    cursor: "pointer",
    position: "relative",
  },
  fileInput: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0,
    cursor: "pointer",
  },
  row: {
    display: "flex",
    alignItems: "center",
    padding: "8px",
    borderBottom: "1px solid #eee",
  },
  headerRow: {
    display: "flex",
    fontWeight: "bold",
    padding: "8px",
    backgroundColor: "#f8f9fa",
    borderBottom: "2px solid #ddd",
    fontSize: "12px",
    textTransform: "uppercase",
    color: "#666",
  },
  select: {
    width: "100%",
    padding: "6px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  tableWrapper: {
    overflowX: "auto",
    border: "1px solid #eee",
    borderRadius: "4px",
    maxHeight: "300px",
  },
  actions: {
    marginTop: "20px",
    paddingTop: "15px",
    borderTop: "1px solid #eee",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
  btn: {
    padding: "8px 16px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
  btnPrimary: { backgroundColor: "#0d6efd", color: "white" },
  btnSuccess: { backgroundColor: "#198754", color: "white" },
  btnSecondary: { backgroundColor: "#6c757d", color: "white" },
};
const IconUpload = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0d6efd" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
);
const IconArrow = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
);

export default function UniversalCSVXLSXImporter({ model, onDataParsed }) {
  const activeFields = model ? Object.keys(model.fields).reduce((acc, key) => {
    acc[key] = key;
    return acc;
  }, {}) : {};

  const activeRequired = model ? model.required : [];

  const [step, setStep] = useState(0);
  const [rawHeaders, setRawHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [map, setMap] = useState({});
  const [error, setError] = useState(null);

  const handleFile = (uploadedFile) => {
    setError(null);
    if (!uploadedFile) return;

    const ext = uploadedFile.name.split(".").pop().toLowerCase();

    if (ext === "csv") {
      Papa.parse(uploadedFile, {
        skipEmptyLines: true,
        complete: (res) => processData(res.data),
        error: () => setError("Failed to parse CSV."),
      });
    } else if (["xls", "xlsx"].includes(ext)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          processData(json);
        } catch (err) {
          setError("Failed to parse Excel file.");
        }
      };
      reader.readAsArrayBuffer(uploadedFile);
    } else {
      setError("Unsupported file format. Please use CSV or Excel.");
    }
  };

  const processData = (data) => {
    if (!data || data.length < 2) {
      setError("File appears empty.");
      return;
    }
    const headers = data[0].map((h) => (h ? h.toString().trim() : "Untitled"));
    const rows = data.slice(1);
    setRawHeaders(headers);
    setRawRows(rows);

    // Auto-match
    const initialMap = {};
    headers.forEach((h) => {
      const normH = h.toLowerCase().replace(/[^a-z0-9]/g, "");
      const match = Object.keys(activeFields).find(
        (k) =>
          k.toLowerCase() === normH ||
          activeFields[k].toLowerCase().replace(/[^a-z0-9]/g, "") === normH
      );
      if (match) initialMap[h] = match;
    });
    setMap(initialMap);
    setStep(1);
  };

  const handleImport = () => {
    const finalData = rawRows.map((row) => {
      const obj = {};
      rawHeaders.forEach((header, index) => {
        const systemKey = map[header];
        if (systemKey) obj[systemKey] = row[index];
      });
      return obj;
    });

    const missingFields = activeRequired.filter((reqKey) => !Object.values(map).includes(reqKey));
    if (missingFields.length > 0) {
      setError(`Missing required column mapping: ${missingFields.join(", ")}`);
      return;
    }

    if (onDataParsed) onDataParsed(finalData);
  };

  const reset = () => {
    setStep(0);
    setRawHeaders([]);
    setRawRows([]);
    setMap({});
    setError(null);
  };

  return (
    <div style={styles.container}>
      {error && <div style={styles.errorBox}><strong>Error:</strong> {error}</div>}

      {step === 0 && (
        <div style={styles.uploadBox}>
          <input
            type="file"
            accept=".csv, .xls, .xlsx"
            style={styles.fileInput}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <IconUpload />
          <p style={{ marginTop: "15px", fontSize: "16px", color: "#555" }}>Click or Drag file to upload</p>
          <p style={{ color: "#999", fontSize: "13px" }}>Supports CSV and Excel</p>
        </div>
      )}

      {step === 1 && (
        <div>
          <h5 style={{ marginBottom: "10px" }}>Map Columns</h5>
          <div style={styles.headerRow}>
            <span style={{ flex: 2 }}>File Header</span>
            <span style={{ flex: 1, textAlign: "center" }}>Map To</span>
            <span style={{ flex: 2 }}>System Field</span>
          </div>
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {rawHeaders.map((header, idx) => (
              <div key={idx} style={styles.row}>
                <div style={{ flex: 2, fontWeight: "500" }}>{header}</div>
                <div style={{ flex: 1, display: "flex", justifyContent: "center" }}><IconArrow /></div>
                <div style={{ flex: 2 }}>
                  <select
                    style={{ ...styles.select, backgroundColor: map[header] ? "#e3f2fd" : "white" }}
                    value={map[header] || ""}
                    onChange={(e) => setMap({ ...map, [header]: e.target.value })}
                  >
                    <option value="">-- Ignore --</option>
                    {Object.keys(activeFields).map((key) => (
                      <option key={key} value={key}>
                        {activeFields[key]} {activeRequired.includes(key) ? "*" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.actions}>
            <button onClick={reset} style={{ ...styles.btn, ...styles.btnSecondary }}>Cancel</button>
            <button onClick={() => setStep(2)} style={{ ...styles.btn, ...styles.btnPrimary }}>Review Data &rarr;</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h5 style={{ marginBottom: "10px" }}>Preview Data (First 5 Rows)</h5>
          <div style={styles.tableWrapper}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #ddd" }}>
                  {Object.values(activeFields).map((label, i) => (
                    <th key={i} style={{ padding: "10px", textAlign: "left", whiteSpace: "nowrap" }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rawRows.slice(0, 5).map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: "1px solid #eee" }}>
                    {Object.keys(activeFields).map((key, cIdx) => {
                      const header = Object.keys(map).find(h => map[h] === key);
                      const index = rawHeaders.indexOf(header);
                      return <td key={cIdx} style={{ padding: "8px" }}>{index !== -1 ? row[index] : "-"}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.actions}>
            <button onClick={() => setStep(1)} style={{ ...styles.btn, ...styles.btnSecondary }}>&larr; Back</button>
            <button onClick={handleImport} style={{ ...styles.btn, ...styles.btnSuccess }}>Import Data</button>
          </div>
        </div>
      )}
    </div>
  );
}