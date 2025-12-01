import React from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getUserConfig } from "./userconfig";
import { useDataManager } from "../common/userdatamanager";

const Users = (props) => {

  const baseConfig = getUserConfig();

  console.log("users baseConfig", baseConfig);

  const { data, loading, error } = useDataManager(
    baseConfig.dataDependencies,
    props
  );

  if (loading) {
    console.log("users data loading", loading, data, error);
    return <div>Loading users data...</div>;
  }

  if (error) {
    console.log("users data error", error);
    return <div>Error loading users data: {error.message}</div>;
  }

  console.log("users data loaded", data);

  const finalConfig = getUserConfig(data, props);

  console.log("users finalConfig", finalConfig);

  return <DynamicCRUD {...finalConfig} icon="fa-solid fa-user" />;
};

export default Users;