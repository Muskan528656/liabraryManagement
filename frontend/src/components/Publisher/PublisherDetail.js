import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ModuleDetail from "../common/ModuleDetail";
import DataApi from "../../api/dataApi";
import { Card, Col, Row } from "react-bootstrap";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import { useTimeZone } from "../../contexts/TimeZoneContext";

const PublisherDetail = () => {

    const { id } = useParams();

    const [book, setBook] = useState(null);

    const [totalBooks, setTotalBooks] = useState(0);

    console.log("Book ID from URL:", id); 
    const { timeZone } = useTimeZone();
    const fetchBookData = async (bookId) => {
        try {

            const bookApi = new DataApi("publisher");

            const bookResponse = await bookApi.fetchById(bookId);
            const bookData = bookResponse?.data || {};
            setBook(bookData);

            console.log("book api", bookApi)
            console.log("bookData", bookData)

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
            { key: "salutation", label: "Salutation", type: "text" },
            { key: "name", label: "name", type: "text" },
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
            { key: "city", label: "City", type: "text" },
            { key: "state", label: "State", type: "text" },
            { key: "country", label: "Country", type: "text" },
            { key: "is_active", label: "Active", type: "toggle" },
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

    // const lookupNavigation = {
    //   author_name: {
    //     path: "author",
    //     idField: "author_id",
    //     labelField: "author_name"
    //   },

    // }

    return (
        <>
            <Row>
                <Col lg={12} className="mb-3">
                    {book && (
                        <ModuleDetail
                            moduleName="publisher"
                            moduleApi="publisher"
                            moduleLabel="publisher"
                            icon="fa-solid fa-book"
                            fields={fields}
                        // lookupNavigation={lookupNavigation}
                        // externalData={externalData}
                        // data={book}
                        // fetchBookData={fetchBookData}
                        />
                    )}
                </Col>
            </Row >
        </>
    );
};

export default PublisherDetail;