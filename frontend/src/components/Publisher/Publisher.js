import DynamicCRUD from "../common/DynaminCrud";
import { getPublisherConfig } from "./PublisherConfig.js";
import { useDataManager } from "../common/userdatamanager";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import { AuthHelper } from "../../utils/authHelper.js";
import { useEffect, useState } from "react";
import PermissionDenied from "../../utils/permission_denied.js";
import Loader from "../common/Loader.js";

const Publisher = (props) => {
    const { timeZone } = useTimeZone();

    const baseConfig = getPublisherConfig();

    const { data, loading, error } = useDataManager(
        baseConfig.dataDependencies,
        props
    );

    const [permissions, setPermissions] = useState({
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        loading: true
    });

    useEffect(() => {
        const fetchPermissions = async () => {
            const canView = await AuthHelper.hasModulePermission("Publisher", "view");
            const canCreate = await AuthHelper.hasModulePermission("Publisher", "create");
            const canEdit = await AuthHelper.hasModulePermission("Publisher", "edit");
            const canDelete = await AuthHelper.hasModulePermission("Publisher", "delete");

            setPermissions({
                canView,
                canCreate,
                canEdit,
                canDelete,
                loading: false
            });
        };

        fetchPermissions();
        window.addEventListener("permissionsUpdated", fetchPermissions);

        return () => {
            window.removeEventListener("permissionsUpdated", fetchPermissions);
        };
    }, []);
    // 🔹 Loader
    if (permissions.loading || loading) {
        return <Loader message="Loading publisher data..." />;
    }
    if (!permissions.canView) {
        return <PermissionDenied />;
    }


    if (error) {
        return <div className="text-danger">Something went wrong!</div>;
    }

    const finalConfig = getPublisherConfig(data, props, timeZone);

    return (
        <DynamicCRUD
            {...finalConfig}
            icon="fa fa-address-card"
            permissions={permissions}
        />
    );
};

export default Publisher;
