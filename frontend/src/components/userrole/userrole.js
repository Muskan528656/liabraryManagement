// import React from "react";
// import DynamicCRUD from "../common/DynaminCrud";
// import { getUserRoleConfig } from "./userroleConfig";
// import { useDataManager } from "../common/userdatamanager";
// import Loader from "../common/Loader";
// import "../../App.css";
// const UserRole = ({permissions, ...props}) => {
//   const baseConfig = getUserRoleConfig();

//   const { data, loading, error } = useDataManager(
//     baseConfig.dataDependencies,
//     props
//   );

//   if (loading) {
//     // return <Loader message="Loading user roles..." />;
//     return <span className="loader"></span>
//   }

//   if (error) {
//     return (
//       <div className="alert alert-danger">
//         <h4>Error Loading User Roles</h4>
//         <p>{error.message}</p>
//         <button className="btn btn-primary" onClick={() => window.location.reload()}>
//           Retry
//         </button>
//       </div>
//     );
//   }

//   const allData = { ...data, ...props };
//   const finalConfig = getUserRoleConfig(allData);

//   return <DynamicCRUD {...finalConfig} icon="fas fa-chalkboard-teacher"/>;
// };

// export default UserRole;



import React from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getUserRoleConfig } from "./userroleConfig";
import { useDataManager } from "../common/userdatamanager";
import PermissionDenied from "../../utils/permission_denied";
import "../../App.css";

const UserRole = ({ permissions, ...props }) => {
  const baseConfig = getUserRoleConfig(
    {},
    {},
    {
      canCreate: permissions?.allowCreate,
      canEdit: permissions?.allowEdit,
    }
  );

  // Hook must always run
  const { data, loading, error } = useDataManager(
    baseConfig.dataDependencies,
    props
  );

  // Permission block AFTER hooks
  if (!permissions?.allowView) {
    return <PermissionDenied />;
  }

  if (permissions?.loading || loading) {
    return <span className="loader"></span>;
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <h4>Error Loading User Roles</h4>
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

  const finalConfig = getUserRoleConfig(
    { ...data, ...props },
    {
      canCreate: permissions?.allowCreate,
      canEdit: permissions?.allowEdit,
    }
  );

  return (
    <DynamicCRUD
      {...finalConfig}
      icon="fas fa-chalkboard-teacher"
      permissions={permissions}
    />
  );
};

export default UserRole;
