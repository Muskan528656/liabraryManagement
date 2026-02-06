import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ModuleDetail from "../common/ModuleDetail";
import DataApi from "../../api/dataApi";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import { Form } from "react-bootstrap";

const ShelfDetail = ({ permissions }) => {

    const { id } = useParams();
    const [shelf, setShelf] = useState(null);
    const { timeZone } = useTimeZone();

    const fetchShelfData = async (shelfId) => {
        try {
            const api = new DataApi("shelf");
            const res = await api.fetchById(shelfId);
            setShelf(res?.data || {});
        } catch (error) {
            console.error("Error fetching shelf:", error);
        }
    };

    useEffect(() => {
        if (id) fetchShelfData(id);
    }, [id]);

    const fields = {
        title: "shelf_name",
        subtitle: "note",

        details: [
            { key: "shelf_name", label: "Shelf Name", type: "text" },
            { key: "note", label: "Note", type: "text" },

            {
                key: "sub_shelf",
                label: "Sub Shelves",
                type: "text",
                render: (val) =>
                    Array.isArray(val) ? val.join(", ") : val
            },

        
            {
                key: "status",
                label: "Status",
                type: "toggle",
                render: (value) => (
                    <Form.Check
                        type="switch"
                        checked={value}
                        disabled
                        label={value ? "Active" : "Inactive"}
                    />
                )
            },
        ],

        other: [
            { key: "createdbyid", label: "Created By", type: "text" },

            {
                key: "createddate",
                label: "Created Date",
                type: "date",
                render: (value) =>
                    convertToUserTimezone(value, timeZone),
            },

            {
                key: "lastmodifieddate",
                label: "Last Modified Date",
                type: "date",
                render: (value) =>
                    convertToUserTimezone(value, timeZone),
            },

            { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },
        ],
    };

    return (
        <>
            {shelf && (
                <ModuleDetail
                    moduleName="shelf"
                    moduleApi="shelf"
                    moduleLabel="Shelf"
                    icon="fa-solid fa-layer-group"
                    fields={fields}
                    data={shelf}
                    permissions={permissions || {}}
                />
            )}
        </>
    );
};

export default ShelfDetail;
