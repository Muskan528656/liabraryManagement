
// import React from "react";
// import DynamicCRUD from "../common/DynaminCrud";
// import { getCategoryConfig } from "./categoryconfig";
// import { useDataManager } from "../common/userdatamanager";
// import { useTimeZone } from "../../contexts/TimeZoneContext";
// import PermissionDenied from "../../utils/permission_denied";
// import "../../App.css";
// import Loader from "../common/Loader";

// const Category = ({ permissions, ...props }) => {
//   const { timeZone } = useTimeZone();

//   const baseConfig = getCategoryConfig(
//     {},
//     timeZone,
//     {
//       canCreate: permissions?.canCreate,
//       canEdit: permissions?.canEdit,
//       canDelete: permissions?.canDelete,
//     }
//   );


//   const { data, loading: dataLoading, error } = useDataManager(
//     baseConfig.dataDependencies,
//     props
//   );

//   if (!permissions?.allowView) {
//     return <PermissionDenied />;
//   }

//   if (dataLoading) {

//     return <span className="loader"></span>;
//   }

//   if (error) {
//     return (
//       <div className="alert alert-danger">
//         <h4>Error Loading Categories</h4>
//         <p>{error.message}</p>
//         <button
//           className="btn btn-primary"
//           onClick={() => window.location.reload()}
//         >
//           Retry
//         </button>
//       </div>
//     );
//   }

//   const finalConfig = getCategoryConfig(
//     { ...data, ...props },
//     timeZone,
//     {
//       canCreate: permissions?.allowCreate,
//       canEdit: permissions?.allowEdit,
//     }
//   );

//   return (
//     <DynamicCRUD
//       {...finalConfig}
//       icon="fa-solid fa-tags"
//       permissions={permissions}
//     />
//   );
// };

// export default Category;


import React, { useEffect, useState } from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getClassificationConfig } from "./categoryconfig";
import { useDataManager } from "../common/userdatamanager";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import PermissionDenied from "../../utils/permission_denied";
import "../../App.css";
import Loader from "../common/Loader";
import DataApi from "../../api/dataApi";

const Classification = ({ permissions, ...props }) => {
  const { timeZone } = useTimeZone();

  const [classfication, setClassfication] = useState(null);
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const api = new DataApi("librarysettings");
        const res = await api.fetchAll();
        const data = Array.isArray(res?.data) ? res.data[0] : res.data;
        console.log("Library settings data:", data);
        if (data?.max_books) {
          setClassfication(parseInt(data.config_classification));
        }
      } catch (err) {
        console.error("Error loading library settings:", err);
      }
    };

    loadSettings();
  }, []);


  const baseConfig = getClassificationConfig(
    { classification: classfication },
    timeZone,
    {
      canCreate: permissions?.canCreate,
      canEdit: permissions?.canEdit,
      canDelete: permissions?.canDelete,
    }
  );

  const { data, loading: dataLoading, error } = useDataManager(
    baseConfig.dataDependencies,
    props
  );

  if (!permissions?.allowView) {
    return <PermissionDenied />;
  }

  if (dataLoading) {
    return <span className="loader"></span>;
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <h4>Error Loading Classifications</h4>
        <p>{error.message}</p>
        <button
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  const finalConfig = getClassificationConfig(
    { ...data, ...props },
    timeZone,
    {
      canCreate: permissions?.allowCreate,
      canEdit: permissions?.allowEdit,
      canDelete: permissions?.allowDelete,
    }
  );

  return (
    <DynamicCRUD
      {...finalConfig}
      icon="fa-solid fa-book"
      permissions={permissions}
    />
  );
};

export default Classification;