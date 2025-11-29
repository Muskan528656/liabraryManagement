import React, { useEffect, useState } from "react";
import { Button, Col, Row, Card, Table, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ShimmerTable } from "react-shimmer-effects";
 
import {
  DatatableWrapper,
  Filter,
  Pagination,
  PaginationOptions,
  TableBody,
  TableHeader,
} from "react-bs-datatable";
import { Link } from "react-router-dom";
import jwt_decode from "jwt-decode";
import { FaTrash, FaEdit, FaPlus } from "react-icons/fa";
import { NameInitialsAvatar } from "react-name-initials-avatar"; // npm install react-name-initials-avatar --force

const UserList = () => {
  const navigate = useNavigate();
  const [body, setBody] = useState([]);
 
  const [userInfo, setUserInfo] = useState(
    jwt_decode(sessionStorage.getItem("token"))
  );
  const [lead, setLead] = useState();
 
  const profileImage = `/public/${userInfo.tenantcode}/users`;

  const [bgColors, setBgColors] = useState([
    "#d3761f",
    "#00ad5b",
    "#debf31",
    "#239dd1",
    "#b67eb1",
    "#d3761f",
    "#de242f",
  ]);
  const [brokenImages, setBrokenImages] = useState([]);
  let colIndex = 0;

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

  const fillBgBolor = () => {
    colIndex += 1;
    if (colIndex >= bgColors.length) colIndex = 0;
    return bgColors[colIndex];
  };

  const editUser = (row) => {
    navigate(`/users/${row.row.id}/e`, { state: row.row });
  };
  const header = [
    {
      title: "Name",
      prop: "username",
      isFilterable: true,
      cell: (row) => (
        <Link
          to={`/users/${row.id}`}
          state={row}
          className="d-flex align-items-center"
        >
          {brokenImages.includes(`img-${row.id}`) ? (
            <NameInitialsAvatar
              size="30px"
              textSize="12px"
              bgColor={fillBgBolor()}
              borderWidth="0px"
              textColor="#fff"
              name={row.username}
            />
          ) : (
            <img
              alt=""
              style={{ height: "30px", width: "30px", objectFit: "cover" }}
              src={profileImage + "/" + row.id}
              className="rounded-circle"
              onError={() =>
                setBrokenImages((prev) => [...prev, `img-${row.id}`])
              }
              id={`img-${row.id}`}
            />
          )}
          <span className="mx-2">{row.username}</span>
        </Link>
      ),
    },
    ...(userInfo.userrole === "ADMIN"
      ? [
          {
            title: "Company Name",
            prop: "companyname",
          },
        ]
      : []),
    { title: "Role", prop: "userrole", isFilterable: true },
 
    { title: "Email", prop: "email", isFilterable: true },
    {
      title: "WhatsApp Number",
      prop: "whatsapp_number",
      isFilterable: true,
      cell: (row) =>
        `${row.country_code || ""}${row.whatsapp_number || ""}`.trim(),
    },
    {
      title: "Active",
      prop: "isactive",
      isFilterable: true,
      cell: (row) =>
        row.isactive === true ? (
          <i
            className="fa-regular fa-square-check"
            style={{ fontSize: "1.3rem", marginLeft: "19px" }}
          ></i>
        ) : (
          <i
            className="fa-regular fa-square"
            style={{ fontSize: "1.3rem", marginLeft: "19px" }}
          ></i>
        ),
    },
    ...(userInfo.userrole === "ADMIN"
      ? [
          {
            title: "Actions",
            prop: "id",
            cell: (row) => (
              <Button
                variant="outline-primary"
                size="sm"
                title="Edit"
                onClick={() => editUser({ row })}
              >
                <i className="fa-regular fa-pen-to-square"></i>
              </Button>
            ),
          },
        ]
      : []),
  ];

  const labels = {
    beforeSelect: " ",
  };

  const createUser = () => {
    navigate(`/users/e`);
  };

  return (
    <>
      <Container className="mt-5">
        <Row className="mx-5 mb-4">
          <Card className="p-4 bg-white shadow-sm border-0 rounded-3">
            <h5 className="mb-2 fw-bold">💡 Quick Guide</h5>
            <small>
              👤 Manage user details and permissions to control access
              effectively. Keep user profiles updated for personalized
              experiences and secure communication.
            </small>
          </Card>
        </Row>

        {/* <Container className='mb-5'>
        <Row className='mx-5 g-0'>
          <Col lg={12} sm={12} xs={12} className="mb-3">
            <Row className="g-0">
              <Col lg={12} sm={12} xs={12}>
                {body ? (
                  <DatatableWrapper
                    body={body}
                    headers={header}
                    paginationOptionsProps={{
                      initialState: {
                        rowsPerPage: 10,
                        options: [5, 10, 15, 20],
                      },
                    }}
                  >
                    <Row className="mb-2">
                      <Col xs={12} lg={4} className="d-flex flex-col justify-content-end align-items-end"                      >
                        <Filter />
                      </Col>
                      <Col xs={12} sm={6} lg={4} className="d-flex flex-col justify-content-start align-items-start"                      >
                        <PaginationOptions labels={labels} />
                      </Col>
                      {userInfo?.userrole === 'ADMIN' &&


                        <Col xs={12} sm={6} lg={4} className="d-flex flex-col justify-content-end align-items-end" >
                          <Button className="btn-sm" variant="outline-primary" onClick={() => createUser(true)}>
                            Add New User
                          </Button>
                        </Col>

                      }
                    </Row>
                    <Table striped className="data-table" responsive="sm">
                      <TableHeader />
                      <TableBody />
                    </Table>
                    <Pagination />
                  </DatatableWrapper>

                ) : (
                  <ShimmerTable row={10} col={8} />
                )}
              </Col>
            </Row>
          </Col>
        </Row>
      </Container> */}
        <Row className="mx-5 g-0">
          <Col lg={12} className="mb-3">
            <Row className="g-0">
              <Col lg={12}>
                <div className="bg-white shadow-sm border-0 rounded-3 p-4">
                  <h5 className="fw-semibold mb-1">📦 All User</h5>

                  <DatatableWrapper
                    body={body}
                    headers={header}
                    paginationOptionsProps={{
                      initialState: {
                        rowsPerPage: 10,
                        options: [5, 10, 15, 20],
                      },
                    }}
                  >
                    <Row className="mb-3">
                      <Col
                        lg={3}
                        sm={10}
                        xs={10}
                        className="d-flex flex-col justify-content-end align-items-end"
                      >
                        <Filter className="p-2" />
                      </Col>
                      <Col
                        lg={4}
                        sm={2}
                        xs={2}
                        className="d-flex flex-col justify-content-start align-items-start"
                      >
                        <PaginationOptions labels={labels} />
                      </Col>
                      <Col
                        lg={5}
                        sm={12}
                        xs={12}
                        className="mt-2 d-flex flex-col justify-content-end align-items-end"
                      >
                        <Button
                          className="btn btn-sm"
                          variant="outline-secondary"
                          onClick={() => createUser(true)}
                        >
                          <FaPlus /> Add New User
                        </Button>
                      </Col>
                    </Row>

                    <div className="table-responsive">
                      <Table
                        striped
                        bordered
                        className="related-list-table"
                        responsive="sm"
                      >
                        <TableHeader />
                        <TableBody />
                      </Table>
                    </div>
                    <Pagination />
                  </DatatableWrapper>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </>
  );
};
export default UserList;
