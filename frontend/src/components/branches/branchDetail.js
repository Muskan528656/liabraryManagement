import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import ModuleDetail from "../common/ModuleDetail";
import DataApi from "../../api/dataApi";
import { Card, Col, Row } from "react-bootstrap";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import { useTimeZone } from "../../contexts/TimeZoneContext";

const BranchDetail = ({ permissions }) => {

  console.log("BranchDetail permission prop:", permissions);
  const { id } = useParams();

  const [branch, setBranch] = useState(null);
  const [totalBranches, setTotalBranches] = useState(0);
  const [activeBranches, setActiveBranches] = useState(0);
  const [inactiveBranches, setInactiveBranches] = useState(0);
  const [booksInBranch, setBooksInBranch] = useState(0);

  const { timeZone } = useTimeZone();

  const fetchBranchData = async (branchId) => {
    try {
      const branchApi = new DataApi("branches");
      const booksApi = new DataApi("book");

      const branchResponse = await branchApi.fetchById(branchId);
      const branchData = branchResponse?.data || {};
      setBranch(branchData);

      const allBranchesResponse = await branchApi.fetchAll();
      const allBranches = allBranchesResponse?.data?.data || allBranchesResponse?.data || [];

      setTotalBranches(allBranches.length);
      setActiveBranches(allBranches.filter(b => b.is_active).length);
      setInactiveBranches(allBranches.filter(b => !b.is_active).length);

      const booksResponse = await booksApi.fetchAll({ branch_id: branchId });
      const books = booksResponse?.data?.data || booksResponse?.data || [];
      setBooksInBranch(books.length);

    } catch (error) {
      console.error("Error fetching branch data:", error);
    }
  };

  useEffect(() => {
    console.log("BranchDetail useEffect triggered");
    if (id) {
      fetchBranchData(id);
    }
  }, [id]);

  const fields = useMemo(() => ({
    title: "branch_name",
    subtitle: "branch_code",
    details: [
      {
        key: "branch_code",
        label: "Branch Code",
        type: "text",
        disabled: true
      },
      {
        key: "branch_name",
        label: "Branch Name",
        type: "text"
      },
      {
        key: "address_line1",
        label: "Address Line 1",
        type: "textarea"
      },
      {
        key: "city",
        label: "City",
        type: "text"
      },
      {
        key: "state",
        label: "State",
        type: "text"
      },
      {
        key: "country",
        label: "Country",
        type: "select",
        options: [
          { value: "India", label: "India" },
          { value: "USA", label: "USA" },
          { value: "UK", label: "UK" },
          { value: "UAE", label: "UAE" },
          { value: "Canada", label: "Canada" },
          { value: "Australia", label: "Australia" }
        ]
      },
      {
        key: "pincode",
        label: "Pincode",
        type: "text"
      },
      {
        key: "is_active",
        label: "Status",
        type: "switch",
        render: (value) => value ? "Active" : "Inactive"
      },
    ],
    other: [
      {
        key: "createdbyid",
        label: "Created By",
        type: "text"
      },
      {
        key: "createddate",
        label: "Created Date",
        type: "date",
        render: (value) => {
          return convertToUserTimezone(value, timeZone);
        },
      },
      {
        key: "lastmodifieddate",
        label: "Last Modified Date",
        type: "date",
        render: (value) => {
          return convertToUserTimezone(value, timeZone);
        },
      },
      {
        key: "lastmodifiedbyid",
        label: "Last Modified By",
        type: "text"
      },
    ],
  }), [timeZone]);


  return (
    <>
      <Row>
        <Col lg={12} className="mb-3">
          {branch && (
            <ModuleDetail
              moduleName="branches"
              moduleApi="branches"
              moduleLabel="Branch"
              icon="fa-solid fa-building"
              fields={fields}
              lookupNavigation={{}}
              externalData={{}}
              data={branch}
              fetchBranchData={fetchBranchData}
              permissions={permissions || {}}
            />
          )}
        </Col>


      </Row>

      {branch && (
        <Row className="mt-4">
          <Col lg={12}>
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white border-0">
                <h6 className="fw-bold mb-0">Branch Information</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3} sm={6} className="mb-3">
                    <div className="d-flex flex-column">
                      <small className="text-muted">Full Address</small>
                      <span className="fw-medium">
                        {[
                          branch.address_line1,
                          branch.city,
                          branch.state,
                          branch.pincode,
                          branch.country
                        ].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  </Col>
                  <Col md={3} sm={6} className="mb-3">
                    <div className="d-flex flex-column">
                      <small className="text-muted">Contact Information</small>
                      <span className="fw-medium">No contact details added</span>
                    </div>
                  </Col>
                  <Col md={3} sm={6} className="mb-3">
                    <div className="d-flex flex-column">
                      <small className="text-muted">Operating Hours</small>
                      <span className="fw-medium">9:00 AM - 6:00 PM</span>
                    </div>
                  </Col>
                  <Col md={3} sm={6} className="mb-3">
                    <div className="d-flex flex-column">
                      <small className="text-muted">Branch Manager</small>
                      <span className="fw-medium">Not assigned</span>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </>
  );
};

export default BranchDetail;