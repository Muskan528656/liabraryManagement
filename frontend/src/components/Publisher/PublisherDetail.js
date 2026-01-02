import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ModuleDetail from "../common/ModuleDetail";
import DataApi from "../../api/dataApi";
import { Card, Col, Row } from "react-bootstrap";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import { useTimeZone } from "../../contexts/TimeZoneContext";

import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";
import City_State from "../../constants/CityState.json";



const PublisherDetail = () => {

    const { id } = useParams();

    const [book, setBook] = useState(null);

    const [totalBooks, setTotalBooks] = useState(0);


    const { timeZone } = useTimeZone();
    const fetchBookData = async (bookId) => {
        try {

            const bookApi = new DataApi("publisher");

            const bookResponse = await bookApi.fetchById(bookId);
            const bookData = bookResponse?.data || {};
            setBook(bookData);




        } catch (error) {
            console.error("Error fetching book or book issues:", error);
        }
    };



    useEffect(() => {
        if (id) {
            fetchBookData(id);

        }
    }, [id]);

    const fields = {
        details: [
            {
                key: "salutation",
                label: "Salutation",
                type: "text"
            },
            {
                key: "name",
                label: "Name",
                type: "text"
            },
            {
                key: "email",
                label: "Email",
                type: "email"
            },
            {
                key: "phone",
                label: "Phone",
                type: "tel"
            },
            {
                key: "city",
                label: "City",
                type: "select",
                options: City_State.map(item => ({
                    value: item.name,
                    label: `${item.name} `
                })),
            },
            {
                key: "state",
                label: "State",
                type: "select",
                options: City_State.map(item => ({
                    value: item.state,
                    label: `${item.state}`
                })),
            },
            {
                key: "country",
                label: "Country",
                type: "select",
                options: COUNTRY_CODES.map(item => ({
                    value: item.country,
                    label: `${item.country}(${item.country_code})`
                })),
            },
            {
                key: "is_active",
                label: "Active",
                type: "toggle"
            },
        ],
        other: [
            { key: "createdbyid", label: "Created By", type: "text" },

            {
                key: "createddate", label: "Created Date", type: "date", render: (value) => {
                    return convertToUserTimezone(value, timeZone)
                },
            },
            {
                key: "lastmodifieddate", label: "Last Modified Date", type: "date", render: (value) => {
                    return convertToUserTimezone(value, timeZone)
                },
            },
            { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },
        ],
    };










    return (
        <>
            <Row>
                <Col lg={12} className="mb-3">
                    {book && (
                        <ModuleDetail
                            moduleName="publisher"
                            moduleApi="publisher"
                            moduleLabel="Publisher"
                            icon="fa fa-address-card"
                            fields={fields}
                        />
                    )}
                </Col>
            </Row >
        </>
    );
};

export default PublisherDetail;