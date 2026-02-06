import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ModuleDetail from "../common/ModuleDetail";
import DataApi from "../../api/dataApi";
import { Card, Col, Row } from "react-bootstrap";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import { useTimeZone } from "../../contexts/TimeZoneContext";

const GradeSectionDetail = ({ permissions }) => {
    console.log("GradeSectionDetail permission prop:", permissions);
    const { id } = useParams();
    const [gradeSection, setGradeSection] = useState(null);
    const [activeSectionsCount, setActiveSectionsCount] = useState(0);
    const [totalSectionsCount, setTotalSectionsCount] = useState(0);
    const [sameGradeSections, setSameGradeSections] = useState(0);

    const { timeZone } = useTimeZone();

    const fetchGradeSectionData = async (gradeSectionId) => {
        try {
            const gradeApi = new DataApi("grade-sections");

            // Fetch grade section details
            const gradeResponse = await gradeApi.fetchById(gradeSectionId);
            const gradeData = gradeResponse?.data || {};
            setGradeSection(gradeData);

            // Fetch counts
            const allSectionsResponse = await gradeApi.fetchAll();
            const allSections = allSectionsResponse?.data?.data || allSectionsResponse?.data || [];

            // Count active sections
            const activeSections = allSections.filter(section => section.status === true);
            setActiveSectionsCount(activeSections.length);
            setTotalSectionsCount(allSections.length);

            // Count sections with same grade
            if (gradeData.grade_name) {
                const sameGrade = allSections.filter(section =>
                    section.grade_name === gradeData.grade_name
                );
                setSameGradeSections(sameGrade.length);
            }

        } catch (error) {
            console.error("Error fetching grade section data:", error);
        }
    };

    useEffect(() => {
        console.log("GradeSectionDetail useEffect triggered");
        if (id) {
            fetchGradeSectionData(id);
        }
    }, [id]);

    const fields = {
        title: "grade_name",
        subtitle: "section_name",
        details: [
            { key: "grade_name", label: "Grade Name", type: "text" },
            { key: "section_name", label: "Section Name", type: "text" },
            {
                key: "status",
                label: "Status",
                type: "badge",
                options: [
                    { value: true, label: "Active", variant: "success" },
                    { value: false, label: "Inactive", variant: "danger" }
                ]
            }
        ],
        other: [
            { key: "createdbyid", label: "Created By", type: "text" },
            {
                key: "createddate",
                label: "Created Date",
                type: "date",
                render: (value) => {
                    return convertToUserTimezone(value, timeZone);
                }
            },
            {
                key: "lastmodifieddate",
                label: "Last Modified Date",
                type: "date",
                render: (value) => {
                    return convertToUserTimezone(value, timeZone);
                }
            },
            { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },
        ],
    };

    const cardData = [
        {
            title: "Total Grade Sections",
            value: totalSectionsCount,
            icon: "fa-solid fa-layer-group",
            border: "border-start",
            color: "primary"
        },
        {
            title: "Active Sections",
            value: activeSectionsCount,
            icon: "fa-solid fa-circle-check",
            border: "border-start",
            color: "success"
        },
        {
            title: "Same Grade Sections",
            value: sameGradeSections,
            icon: "fa-solid fa-graduation-cap",
            border: "border-start",
            color: "info"
        },
        {
            title: "Current Status",
            value: gradeSection?.status ? "Active" : "Inactive",
            icon: "fa-solid fa-flag",
            border: "border-start",
            color: gradeSection?.status ? "success" : "danger",
            isText: true
        }
    ];

    console.log("GradeSectionDetail permissions:", permissions);

    return (
        <>
            <Row>
                <Col lg={9} className="mb-3">
                    {gradeSection && (
                        <ModuleDetail
                            moduleName="grade-sections"
                            moduleApi="grade-sections"
                            moduleLabel="Grade Section"
                            icon="fa-solid fa-graduation-cap"
                            fields={fields}
                            data={gradeSection}
                            fetchData={fetchGradeSectionData}
                            permissions={permissions || {}}
                        />
                    )}
                </Col>

                <Col lg={3} className="mb-3 mt-4">
                    <Row>
                        <Card className="p-4">
                            {cardData.map((item, index) => (
                                <Col lg={12} xs={12} key={index}>
                                    <Card
                                        className={`shadow-sm border-0 ${item.border} border-5 border-${item.color} mt-3`}
                                    >
                                        <Card.Body className="p-3">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center">
                                                    <div
                                                        className="p-2 rounded-circle me-2"
                                                        style={{ background: 'var(--primary-background-color)' }}
                                                    >
                                                        <i
                                                            className={`${item.icon} fa-sm`}
                                                            style={{ color: `var(--${item.color}-color)` }}
                                                        ></i>
                                                    </div>
                                                    <p className="mb-0 small text-muted fs-6">{item.title}</p>
                                                </div>
                                                {item.isText ? (
                                                    <span className={`badge bg-${item.color}`}>{item.value}</span>
                                                ) : (
                                                    <h5 className="mb-0 fw-bold">{item.value}</h5>
                                                )}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Card>
                    </Row>
                </Col>
            </Row>
        </>
    );
};

export default GradeSectionDetail;