import React, { useEffect, useState } from "react";
import DataApi from "../../api/dataApi";
import { useNavigate } from "react-router-dom";
// Using the icons already in your dependencies
import { 
  FileEarmarkText, 
  Search, 
  PlusLg, 
  ChevronRight, 
  Calendar3, 
  Person,
  CodeSlash 
} from "react-bootstrap-icons";

const ReportsList = () => {
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const api = new DataApi("reports");
      const resp = await api.fetchAll();
      if (resp?.data?.records) {
        setReports(resp.data.records);
      }
    } catch (err) {
      console.error("Error fetching reports", err);
    }
  };

  // Filter logic for search
  const filteredReports = reports.filter(r => 
    r.report_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-fluid p-4 bg-light" style={{ minHeight: "100vh" }}>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ color:"var(--primary-color)"}}>Reports Library</h4>
          <p className="text-muted small mb-0">Manage library reports</p>
        </div>
        {/* <button className="btn btn-primary d-flex align-items-center gap-2 shadow-sm px-3">
          <PlusLg /> <span>Create Report</span>
        </button> */}
      </div>

      {/* Main Content Card */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        {/* Search Header */}
        <div className="card-header bg-white border-bottom py-3 px-4">
          <div className="input-group" style={{ maxWidth: "350px" }}>
            <span className="input-group-text bg-light border-end-0 text-muted">
              <Search size={14} />
            </span>
            <input
              type="text"
              className="form-control bg-light border-start-0 ps-0 small"
              placeholder="Search by report name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 border-1">
            <thead>
              <tr>
                <th  style={{ background: "var(--primary-background-color)" }} className="border-1 ps-4 py-3 text-uppercase small fw-bold text-muted">Report Name</th>
                <th  style={{ background: "var(--primary-background-color)" }} className="border-1 py-3 text-uppercase small fw-bold text-muted">API Name</th>
                <th  style={{ background: "var(--primary-background-color)" }} className="border-1 py-3 text-uppercase small fw-bold text-muted">Created Date</th>
                <th  style={{ background: "var(--primary-background-color)" }} className="py-3 text-uppercase small fw-bold text-muted">Created By</th>
                {/* <th className="pe-4 py-3"></th> */}
              </tr>
            </thead>
            <tbody>
              {/* Static Example Row as per your request */}
              <tr 
                style={{ cursor: "pointer" }} 
                onClick={() => navigate(`/reports/bookinventoryreport`)}
              >
                <td className="border-1 ps-4 py-1">
                  <div className=" d-flex align-items-center">
                    <div 
                      className="rounded-3 d-flex align-items-center justify-content-center me-3" 
                      style={{ width: "30px", height: "30px", background: "#eef2ff", color: "#4338ca" }}
                    >
                      <FileEarmarkText size={20} />
                    </div>
                    <div>
                      <div className="fw-semibold text-dark">Book Inventory Report</div>
                      {/* <div className="text-muted extra-small" style={{ fontSize: "0.75rem" }}>System Generated</div> */}
                    </div>
                  </div>
                </td>
                <td className="border-1">
                  <span className="badge bg-light text-secondary border px-2 py-1 fw-medium">
                    <CodeSlash size={12} className="me-1" /> bookinventoryreport
                  </span>
                </td>
                <td className="border-1">
                  <div className="d-flex flex-column gap-1">
                    <small className="text-muted d-flex align-items-center gap-1">
                      <Calendar3 size={12} /> Jan 28, 2026
                    </small>
                  </div>
                </td>
                
                <td className="border-1">
                  <div className="d-flex flex-column gap-1">
                    <small className="text-muted d-flex align-items-center gap-1">
                      <Person size={12} /> System Admin
                    </small>
                  </div>
                </td>
                
                {/* <td className="pe-4 text-end">
                  <ChevronRight className="text-muted" />
                </td> */}
              </tr>

              {/* Dynamic Mapping */}
              {filteredReports.map((r, i) => (
                <tr 
                  key={i} 
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/reports/${r.api_name}`)}
                >
                  <td className="ps-4 py-3">
                    <div className="d-flex align-items-center text-primary fw-semibold">
                       <FileEarmarkText className="me-3 text-muted" size={18} />
                       {r.report_name}
                    </div>
                  </td>
                  <td>
                    <code className="small text-secondary">{r.api_name}</code>
                  </td>
                  <td>
                    <div className="small text-muted">{r.created_at}</div>
                    <div className="small text-dark">{r.created_by}</div>
                  </td>
                  <td className="pe-4 text-end">
                    <ChevronRight className="text-muted" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filteredReports.length === 0 && reports.length > 0 && (
          <div className="p-5 text-center bg-white">
            <p className="text-muted">No reports found matching your search.</p>
          </div>
        )}
        <div className="card-footer bg-white py-3 px-4">
          <small className="text-muted">
            Total Reports: {reports.length > 0 ? reports.length : 1}
          </small>
        </div>
      </div>

      <style>{`
        .table-hover tbody tr:hover {
          background-color: #f1f5f9 !important;
          transition: 0.2s ease;
        }
        .extra-small {
          font-size: 0.75rem;
        }
        .btn-primary {
          background-color: #0d2b45;
          border-color: #0d2b45;
        }
        .btn-primary:hover {
          background-color: #163e61;
          border-color: #163e61;
        }
      `}</style>
    </div>
  );
};

export default ReportsList;