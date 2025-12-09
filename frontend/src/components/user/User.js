import React from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getUserConfig } from "./userconfig";
import { useDataManager } from "../common/userdatamanager";
import { useTimeZone } from "../../contexts/TimeZoneContext";

const Users = (props) => {
  const { timeZone, companyInfo } = useTimeZone();
  const baseConfig = getUserConfig();

  const { data, loading, error } = useDataManager(
    baseConfig.dataDependencies,
    props
  );

  if (loading) return <div>Loading users data...</div>;
  if (error) return <div>Error loading users data: {error.message}</div>;

  if (error) {
    console.log("users data error", error);
    return <div>Error loading users data: {error.message}</div>;
  }

  console.log("users data loaded", data);

  const finalConfig = getUserConfig(data, props, timeZone, companyInfo);

  console.log("users finalConfig", finalConfig);

  return <DynamicCRUD {...finalConfig} icon="fa-solid fa-user" />;
};

export default Users;