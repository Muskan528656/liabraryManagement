// import React, { useEffect, useState } from "react";
// import Loader from "../common/Loader";
// import DynamicCRUD from "../common/DynaminCrud";
// import { getPlanConfig } from "./PlanConfig";
// import { useDataManager } from "../common/userdatamanager";
// import { useTimeZone } from "../../contexts/TimeZoneContext";
// import DataApi from "../../api/dataApi";
// import { AuthHelper } from "../../utils/authHelper";
// import PermissionDenied from "../../utils/permission_denied";
// import { MODULES } from "../../constants/CONSTANT";
// import "../../App.css";

// const Plan = (props) => {
//     const [allowedBooks, setAllowedBooks] = useState(null);
//     const [planConfig, setPlanConfig] = useState(null);
//     const { timeZone } = useTimeZone();

//     const [permissions, setPermissions] = useState({
//         canView: false,
//         canCreate: false,
//         canEdit: false,
//         canDelete: false,
//         loading: true
//     });

//     // Permission fetching logic
//     useEffect(() => {
//         const fetchPermissions = async () => {
//             if (AuthHelper.isSuperAdmin()) {
//                 setPermissions({
//                     canView: true,
//                     canCreate: true,
//                     canEdit: true,
//                     canDelete: true,
//                     loading: false
//                 });
//                 return;
//             }

//             const perms = {
//                 canView: await AuthHelper.hasModulePermission(MODULES.PLAN, "view"),
//                 canCreate: await AuthHelper.hasModulePermission(MODULES.PLAN, "create"),
//                 canEdit: await AuthHelper.hasModulePermission(MODULES.PLAN, "edit"),
//                 canDelete: await AuthHelper.hasModulePermission(MODULES.PLAN, "delete"),
//                 loading: false
//             };

//             setPermissions(perms);
//         };
//         fetchPermissions();
//         window.addEventListener("permissionsUpdated", fetchPermissions);
//         return () => {
//             window.removeEventListener("permissionsUpdated", fetchPermissions);
//         };
//     }, []);

//     useEffect(() => {
//         const loadSettings = async () => {
//             try {
//                 const api = new DataApi("librarysettings");
//                 const res = await api.fetchAll();

//                 const data = Array.isArray(res?.data) ? res.data[0] : res.data;

//                 if (data?.max_books) {
//                     setAllowedBooks(parseInt(data.max_books));
//                 }
//             } catch (err) {
//                 console.error("Error loading library settings:", err);
//             }
//         };

//         loadSettings();
//     }, []);

//     useEffect(() => {
//         const loadConfig = async () => {
//             try {
//                 const config = await getPlanConfig(
//                     {},
//                     allowedBooks,
//                     timeZone,
//                     {
//                         canCreate: permissions.canCreate,
//                         canEdit: permissions.canEdit,
//                         canDelete: permissions.canDelete
//                     }
//                 );
//                 setPlanConfig(config);
//             } catch (err) {
//                 console.error("Error loading plan config:", err);
//             }
//         };

//         if (allowedBooks && timeZone && !permissions.loading) {
//             loadConfig();
//         }
//     }, [allowedBooks, timeZone, permissions.loading, permissions.canCreate, permissions.canEdit, permissions.canDelete]);

//     const { data, loading, error } = useDataManager(
//         planConfig?.dataDependencies,
//         props
//     );

//     if (permissions.loading || !planConfig || loading) {
//         return <span className="loader"></span>;
//     }

//     if (error) {
//         return <div className="alert alert-danger">{error}</div>;
//     }


//     const isSuperAdmin = AuthHelper.isSuperAdmin?.();
//     if (!permissions.loading && !isSuperAdmin && !permissions.canView) {
//         return <PermissionDenied />;
//     }

//     return (
//         <DynamicCRUD
//             {...planConfig}
//             icon="fa-solid fa-tags"
//             permissions={permissions}
//         />
//     );
// };

// export default Plan;


import React, { useEffect, useState } from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getPlanConfig } from "./PlanConfig";
import { useDataManager } from "../common/userdatamanager";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import DataApi from "../../api/dataApi";
import PermissionDenied from "../../utils/permission_denied";
import "../../App.css";

const Plan = ({ permissions, ...props }) => {
  const { timeZone } = useTimeZone();
  const [allowedBooks, setAllowedBooks] = useState(null);
  const [planConfig, setPlanConfig] = useState(null);


  console.log("Plan permissions:", permissions);



  useEffect(() => {
    const loadSettings = async () => {
      try {
        const api = new DataApi("librarysettings");
        const res = await api.fetchAll();
        const data = Array.isArray(res?.data) ? res.data[0] : res.data;

        if (data?.max_books) {
          setAllowedBooks(parseInt(data.max_books));
        }
      } catch (err) {
        console.error("Error loading library settings:", err);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    if (!allowedBooks || !timeZone) return;

    const loadConfig = async () => {
      try {
        const config = await getPlanConfig(
          {},
          allowedBooks,
          timeZone,
          {
            canCreate: permissions?.allowCreate,
            canEdit: permissions?.allowEdit,
          }
        );
        setPlanConfig(config);
      } catch (err) {
        console.error("Error loading plan config:", err);
      }
    };

    loadConfig();
  }, [
    allowedBooks,
    timeZone,
    permissions?.allowCreate,
    permissions?.allowEdit,
  ]);

  const { data, loading, error } = useDataManager(
    planConfig?.dataDependencies,
    props
  );

  if (!permissions?.allowView) {
    return <PermissionDenied />;
  }

  if (permissions?.loading || !planConfig || loading) {
    return <span className="loader"></span>;
  }

  if (error) {
    return <div className="alert alert-danger">{error.message || "Error"}</div>;
  }

  return (
    <DynamicCRUD
      {...planConfig}
      icon="fa-solid fa-tags"
      permissions={permissions}
    />
  );
};

export default Plan;
