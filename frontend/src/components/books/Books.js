

// import React, { useEffect, useState } from "react";
// import DynamicCRUD from "../common/DynaminCrud";
// import { getBooksConfig } from "./bookconfig";
// import { useTimeZone } from "../../contexts/TimeZoneContext";
// import { AuthHelper } from "../../utils/authHelper";
// import PermissionDenied from "../../utils/permission_denied";
// import { MODULES } from "../../constants/CONSTANT";

// const Books = ({permissions ,props}) => {
//   const { timeZone } = useTimeZone();

//   const [permissions, setPermissions] = useState({
//     canView: false,
//     canCreate: false,
//     canEdit: false,
//     canDelete: false,
//     loading: true
//   });

//   useEffect(() => {
//     const fetchPermissions = async () => {
//       if (AuthHelper.isSuperAdmin()) {
//         setPermissions({
//           canView: true,
//           canCreate: true,
//           canEdit: true,
//           canDelete: true,
//           loading: false
//         });
//         return;
//       }

//       const perms = {
//         canView: await AuthHelper.hasModulePermission(MODULES.BOOKS, "view"),
//         canCreate: await AuthHelper.hasModulePermission(MODULES.BOOKS, "create"),
//         canEdit: await AuthHelper.hasModulePermission(MODULES.BOOKS, "edit"),
//         canDelete: await AuthHelper.hasModulePermission(MODULES.BOOKS, "delete"),
//         loading: false
//       };

//       setPermissions(perms);
//     };
//     fetchPermissions();
//     window.addEventListener("permissionsUpdated", fetchPermissions);
//     return () => {
//       window.removeEventListener("permissionsUpdated", fetchPermissions);
//     };
//   }, []);

//   const baseConfig = getBooksConfig({
//     canCreate: permissions.allowCreate,
//     canEdit: permissions.allowEdit,
//     canDelete: permissions.allowDelete
//   });

//   if (permissions.loading) {
//     return <div>Loading...</div>;
//   }
//   const isSuperAdmin = AuthHelper.isSuperAdmin?.();

//   if (!permissions.loading && !isSuperAdmin && !permissions.canView) {

//     return <PermissionDenied />;
//   }
//   // if (!permissions.loading && !permissions.canView) {
//   //   return <PermissionDenied />;
//   // }
//   // if (!permissions.canView) {
//   //   return <PermissionDenied />;
//   // }

//   const finalConfig = getBooksConfig(
//     props,
//     props,
//     timeZone,
//     {
//       canCreate: permissions.canCreate,
//       canEdit: permissions.canEdit,
//       canDelete: permissions.canDelete
//     }
//   );

//   return (
//     <DynamicCRUD
//       {...finalConfig}
//       icon="fa-solid fa-book"
//       permissions={permissions}
//     />
//   );
// };

// export default Books;


// import React from "react";
// import DynamicCRUD from "../common/DynaminCrud";
// import { getBooksConfig } from "./bookconfig";
// import { useTimeZone } from "../../contexts/TimeZoneContext";
// import PermissionDenied from "../../utils/permission_denied";
// import { AuthHelper } from "../../utils/authHelper";
// import { useDataManager } from "../common/userdatamanager";

// const Books = ({ permissions, ...props }) => {
//   const { timeZone } = useTimeZone();

//   const isSuperAdmin = AuthHelper.isSuperAdmin?.();

//   console.log("sdfghjgfdewertyu", timeZone);
//   const baseConfig = getBooksConfig();

//   console.log("books baseConfig", baseConfig);
//   const { data, loading, error } = useDataManager(
//     baseConfig.dataDependencies,
//     props
//   );
//   console.log("Books data fetched:", data, loading, error);
//   console.log("book data", data);
//     console.log("book error", error);
//     console.log("book loading", loading);
//   if (loading) {
//     console.log("books data", loading, data, error);
    

//     return <div>Loading books data...</div>;
//   }
//   console.log("books data", loading);

//   // const finalConfig = getBooksConfig(data, props, timeZone);

//   console.log("Books Component Permissions:", permissions);
//   //  If not allowed to view
//   if (!isSuperAdmin && !permissions?.allowView) {
//     return <PermissionDenied />;
//   }
//   console.log("Books Component Rendering with permissions:", props);
//   const finalConfig = getBooksConfig(
//     data,
//     props,
//     timeZone,
//     {
//       canCreate: permissions?.allowCreate,
//       canEdit: permissions?.allowEdit,
//       canDelete: permissions?.allowDelete
//     }
//   );

//   return (
//     <DynamicCRUD
//       {...finalConfig}
//       icon="fa-solid fa-book"
//       permissions={permissions}
//     />
//   );
// };

// export default Books;
import React, { useState, useEffect } from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getBooksConfig } from "./bookconfig";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import PermissionDenied from "../../utils/permission_denied";
import { AuthHelper } from "../../utils/authHelper";
import DataApi from "../../api/dataApi";

const Books = ({ permissions, ...props }) => {
  const { timeZone } = useTimeZone();
  const [externalData, setExternalData] = useState({ authors: [], categories: [], publishers: [] });
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = AuthHelper.isSuperAdmin?.();

  console.log("Books Component Permissions:", permissions);

  const fetchExternalData = async () => {
    try {
      setLoading(true);
      const [authorsRes, categoriesRes, publishersRes] = await Promise.all([
        new DataApi("author").fetchAll(),
        new DataApi("category").fetchAll(),
        new DataApi("publisher").fetchAll()
      ]);

      const authors = authorsRes?.data?.data || authorsRes?.data || [];
      const categories = categoriesRes?.data?.data || categoriesRes?.data || [];
      const publishers = publishersRes?.data?.data || publishersRes?.data || [];

      setExternalData({
        authors: Array.isArray(authors) ? authors : [],
        categories: Array.isArray(categories) ? categories : [],
        publishers: Array.isArray(publishers) ? publishers : []
      });
    } catch (error) {
      console.error("Error fetching external data:", error);
      setExternalData({ authors: [], categories: [], publishers: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExternalData();
  }, []);

  // ⛔ If not allowed to view
  if (!isSuperAdmin && !permissions?.allowView) {
    return <PermissionDenied />;
  }

  const finalConfig = getBooksConfig(
    externalData,
    timeZone,
    {
      canCreate: permissions?.allowCreate,
      canEdit: permissions?.allowEdit,
      canDelete: permissions?.allowDelete
    }
  );

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <DynamicCRUD
      {...finalConfig}
      icon="fa-solid fa-book"
      permissions={permissions}
      authors={externalData.authors}
      categories={externalData.categories}
      publishers={externalData.publishers}
    />
  );
};

export default Books;
