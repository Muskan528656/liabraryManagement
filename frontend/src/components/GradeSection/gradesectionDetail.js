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

            const gradeResponse = await gradeApi.fetchById(gradeSectionId);
            const gradeData = gradeResponse?.data || {};
            setGradeSection(gradeData);

            const allSectionsResponse = await gradeApi.fetchAll();
            const allSections = allSectionsResponse?.data?.data || allSectionsResponse?.data || [];

            const activeSections = allSections.filter(section => section.status === true);
            setActiveSectionsCount(activeSections.length);
            setTotalSectionsCount(allSections.length);


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
                type: "toggle",
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



    console.log("GradeSectionDetail permissions:", permissions);

    return (
        <>
            <Row>
                <Col lg={12} className="mb-3">
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


            </Row>
        </>
    );
};

export default GradeSectionDetail;