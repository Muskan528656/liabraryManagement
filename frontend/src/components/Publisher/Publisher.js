// import DynamicCRUD from "../common/DynaminCrud";
// import { getPublisherConfig } from "./PublisherConfig.js";
// import { useDataManager } from "../common/userdatamanager";
// import { useTimeZone } from "../../contexts/TimeZoneContext";
// import { AuthHelper } from "../../utils/authHelper.js";
// import { useEffect, useState } from "react";
// import PermissionDenied from "../../utils/permission_denied.js";
// import Loader from "../common/Loader.js";
// import { MODULES } from "../../constants/CONSTANT.js";
// import "../../App.css";

// const Publisher = ({permissions,...props}) => {
//     const { timeZone } = useTimeZone();

//     const baseConfig = getPublisherConfig();

//     const { data, loading, error } = useDataManager(
//         baseConfig.dataDependencies,
//         props
//     );

//     const [permissions, setPermissions] = useState({
//         canView: false,
//         canCreate: false,
//         canEdit: false,
//         canDelete: false,
//         loading: true
//     });

//     useEffect(() => {
//         const fetchPermissions = async () => {
//             const canView = await AuthHelper.hasModulePermission(MODULES.PUBLISHER, MODULES.CAN_VIEW);
//             const canCreate = await AuthHelper.hasModulePermission(MODULES.PUBLISHER, MODULES.CAN_CREATE);
//             const canEdit = await AuthHelper.hasModulePermission(MODULES.PUBLISHER, MODULES.CAN_EDIT);
//             const canDelete = await AuthHelper.hasModulePermission(MODULES.PUBLISHER, MODULES.CAN_DELETE);

//             setPermissions({
//                 canView,
//                 canCreate,
//                 canEdit,
//                 canDelete,
//                 loading: false
//             });
//         };

//         fetchPermissions();
//         window.addEventListener("permissionsUpdated", fetchPermissions);

//         return () => {
//             window.removeEventListener("permissionsUpdated", fetchPermissions);
//         };
//     }, []);
   
//     if (permissions.loading || loading) {
//         // return <Loader message="Loading publisher data..." />;
//         return <span className="loader"></span>
//     }
//     if (!permissions.canView) {
//         return <PermissionDenied />;
//     }


//     if (error) {
//         return <div className="text-danger">Something went wrong!</div>;
//     }

//     const finalConfig = getPublisherConfig(data, props, timeZone, permissions);

//     return (
//         <DynamicCRUD
//             {...finalConfig}
//             icon="fa fa-address-card"
//             permissions={permissions}
//         />
//     );
// };

// export default Publisher;



import React from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getPublisherConfig } from "./PublisherConfig.js";
import { useDataManager } from "../common/userdatamanager";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import PermissionDenied from "../../utils/permission_denied.js";
import Loader from "../common/Loader.js";
import "../../App.css";

const Publisher = ({ permissions, ...props }) => {
  const { timeZone } = useTimeZone();

  const baseConfig = getPublisherConfig(
    {},
    {},
    timeZone,
    {
      canCreate: permissions?.allowCreate,
      canEdit: permissions?.allowEdit
    }
  );

  const { data, loading, error } = useDataManager(
    baseConfig.dataDependencies,
    props
  );

  if (!permissions?.allowView) {
    return <PermissionDenied />;
  }

  if (permissions?.loading || loading) {
    // return <Loader message="Loading publisher data..." />;
    return <span className="loader"></span>;
  }

  if (error) {
    return <div className="text-danger">Something went wrong!</div>;
  }

  const finalConfig = getPublisherConfig(
    data,
    props,
    timeZone,
    {
      canCreate: permissions?.allowCreate,
      canEdit: permissions?.allowEdit,
    }
  );

  return (
    <DynamicCRUD
      {...finalConfig}
      icon="fa fa-address-card"
      permissions={permissions}
    />
  );
};

export default Publisher;
