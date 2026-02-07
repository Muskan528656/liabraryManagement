import React, { useState, useEffect } from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getGradeSectionConfig } from "./gradesectionConfig";
import PermissionDenied from "../../utils/permission_denied";
import { AuthHelper } from "../../utils/authHelper";
import DataApi from "../../api/dataApi";

const GradeSection = ({ permissions, ...props }) => {
    const [externalData, setExternalData] = useState({});
    const [loading, setLoading] = useState(false);
    const isSuperAdmin = AuthHelper.isSuperAdmin?.();

    console.log("GradeSection Component Permissions:", permissions);
    console.log("isSuperAdmin:", isSuperAdmin);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const response = await new DataApi("grade-sections").fetchAll();
                console.log("Response =>>>>>>", response);
                setExternalData(response.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);


    if (isSuperAdmin) {
        const finalPermissions = {
            allowView: true,
            allowCreate: true,
            allowEdit: true,
            allowDelete: true,
            ...permissions
        };

        const finalConfig = getGradeSectionConfig({
            canCreate: finalPermissions.allowCreate,
            canEdit: finalPermissions.allowEdit,
            canDelete: finalPermissions.allowDelete
        });

        return (
            <DynamicCRUD
                {...finalConfig}
                icon="fa-solid fa-graduation-cap"
                permissions={finalPermissions}
            />
        );
    }

    console.log("permissions?.allowViepermissions?.allowVie", permissions?.allowVie)
    if (!permissions?.allowView) {
        return <PermissionDenied />;
    }

    if (loading) {
        return <div className="text-center p-4">Loading...</div>;
    }

    const finalConfig = getGradeSectionConfig({
        canCreate: permissions?.allowCreate,
        canEdit: permissions?.allowEdit,
        canDelete: permissions?.allowDelete
    });

    return (
        <DynamicCRUD
            {...finalConfig}
            icon="fa-solid fa-graduation-cap"
            permissions={permissions}
        />
    );
};

export default GradeSection;