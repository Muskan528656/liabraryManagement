import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ModuleDetail from "../common/ModuleDetail";
import DataApi from "../../api/dataApi";
import { convertToUserTimezone } from "../../utils/convertTimeZone";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import { Badge } from "react-bootstrap";

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
        title: "name",
        subtitle: "floor",

        details: [
            { key: "name", label: "Name", type: "text" },
            { key: "floor", label: "Floor", type: "text" },
            { key: "rack", label: "Rack", type: "text" },
            { 
                key: "classification_type", 
                label: "Classification Type", 
                type: "text",
                render: (value) => value ? <Badge bg="info">{value}</Badge> : '-'
            },
            { 
                key: "classification_from", 
                label: "Range From", 
                type: "text",
                render: (value) => <span className="font-monospace text-info">{value || '-'}</span>
            },
            { 
                key: "classification_to", 
                label: "Range To", 
                type: "text",
                render: (value) => <span className="font-monospace text-info">{value || '-'}</span>
            },
            { 
                key: "capacity", 
                label: "Capacity", 
                type: "text",
                render: (value) => <Badge bg="secondary">{value || 100}</Badge>
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
                    moduleLabel="Rack Mapping"
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
