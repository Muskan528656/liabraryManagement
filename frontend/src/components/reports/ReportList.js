import React, { useEffect, useState } from "react";
import DataApi from "../../api/dataApi";
import { useNavigate } from "react-router-dom";
import {
  FileEarmarkText,
  Search,
  PlusLg,
  ChevronRight,
  Calendar3,
  Person,
  CodeSlash,
  DeviceSsd
} from "react-bootstrap-icons";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import PubSub from "pubsub-js";
import TableHeader from "../common/TableHeader";

const ReportsList = () => {
  console.log("working");
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ report_name: "", api_name: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const navigate = useNavigate();
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    fetchReports();
  }, []);


  const toggleExpand = (index, e) => {
    e.stopPropagation();
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

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

  const handleCreateReport = async () => {
    if (!createForm.report_name.trim() || !createForm.api_name.trim()) {
      setCreateError("Both report name and API name are required");
      return;
    }

    setCreateLoading(true);
    setCreateError("");

    try {
      const api = new DataApi("reports");
      const resp = await api.create(createForm);
      console.log("Create report response:", resp);

      if (resp?.success || resp?.data) {
        const newReport = resp.data || resp;
        setReports([...reports, newReport]);
        setShowCreateModal(false);
        setCreateForm({ report_name: "", api_name: "" });
        PubSub.publish("RECORD_SAVED_TOAST", {
          title: "Report Created",
          message: "Report created successfully!"
        });
        fetchReports();
      } else {
        const errorMsg = resp?.errors || resp?.message || "Failed to create report";
        setCreateError(errorMsg);
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Error",
          message: errorMsg
        });
      }
    } catch (err) {
      console.error("Error creating report", err);
      const errorMsg = err?.response?.data?.errors || err?.message || "Failed to create report";
      setCreateError(errorMsg);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: errorMsg
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredReports = reports.filter(r =>
    r.report_name && r.report_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="container-fluid p-4 bg-light" style={{ minHeight: "100vh" }}>

        <div >
          <div>
            <TableHeader
              icon='fa fa-book'
              title={'Report Library'}
            />

          </div>

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
                  <th style={{ background: "var(--primary-background-color)" }} className="border-1 ps-4 py-3 text-uppercase small fw-bold text-muted">Sr No</th>
                  <th style={{ background: "var(--primary-background-color)" }} className="border-1 ps-4 py-3 text-uppercase small fw-bold text-muted">Report Name</th>
                  <th style={{ background: "var(--primary-background-color)" }} className="border-1 py-3 text-uppercase small fw-bold text-muted">Description</th>
                  <th style={{ background: "var(--primary-background-color)" }} className="pe-4 py-3 text-uppercase small fw-bold text-muted"></th>
                </tr>
              </thead>
              <tbody>
                {/* Dynamic Mapping */}
                {filteredReports.map((r, i) => (
                  <tr
                    key={i}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/reports/${r.api_name}`)}
                  >
                    <td className="text-muted text-center align-middle border"
                      style={{ width: "80px" }}>
                      {i + 1}
                    </td>
                    <td className="ps-4 py-0">
                      <div className=" d-flex align-items-center">

                        <div>
                          <div className="fw-semibold text-primary">{r.report_name}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className={`resizable-container ${expandedRows[i] ? 'expanded' : ''}`}>
                        <p className="description-text mb-0">
                          {r.description || "No description provided."}
                        </p>
                        {r.description?.length > 100 && (
                          <button
                            className="btn btn-link btn-sm p-0 text-decoration-none mt-1"
                            onClick={(e) => toggleExpand(i, e)}
                          >
                            {expandedRows[i] ? "Show Less" : "Read More"}
                          </button>
                        )}
                      </div>
                    </td>


                    <td className="pe-4">
                      <div className="d-flex justify-content-end">
                        <ChevronRight size={16} className="text-muted" />
                      </div>
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

        {/* Create Report Modal */}
        <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Create New Report</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {createError && <Alert variant="danger">{createError}</Alert>}
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Report Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter report name"
                  value={createForm.report_name}
                  onChange={(e) => setCreateForm({ ...createForm, report_name: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>API Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter API name (e.g., bookinventoryreport)"
                  value={createForm.api_name}
                  onChange={(e) => setCreateForm({ ...createForm, api_name: e.target.value })}
                />
                <Form.Text className="text-muted">
                  This will be used as the URL slug for the report.
                </Form.Text>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateReport}
              disabled={createLoading}
            >
              {createLoading ? "Creating..." : "Create Report"}
            </Button>
          </Modal.Footer>
        </Modal>

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

         .resizable-container {
          resize: horizontal; /* Allows user to pull the bottom-right corner horizontally */
          overflow: hidden;   /* Required for 'resize' to work */
          min-width: 200px;
          max-width: 600px;   /* Prevents it from breaking the layout */
          padding-right: 15px;
          position: relative;
        }

        /* Default state: Clamp to 2 lines */
        .description-text {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-size: 0.875rem;
          color: #64748b;
          line-height: 1.5;
        }

        /* When 'Read More' is clicked, show everything */
        .expanded .description-text {
          display: block;
          overflow: visible;
          -webkit-line-clamp: unset;
        }

        /* Style for the resize handle (bottom right corner) */
        .resizable-container::-webkit-resizer {
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><path d="M10 0 L0 10 L10 10 Z" fill="%23cbd5e1"/></svg>');
          background-repeat: no-repeat;
          background-position: bottom right;
        }
      `}</style>
      </div>
    </>
  );
};

export default ReportsList;

