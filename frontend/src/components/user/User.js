import React from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getUserConfig } from "./userconfig";
import { useDataManager } from "../common/userdatamanager";
import { useTimeZone } from "../../contexts/TimeZoneContext";

const Users = (props) => {
  const { timeZone, companyInfo } = useTimeZone();

  console.log("woeweoiruweoiwe", timeZone);
  const baseConfig = getUserConfig();

  const { data, loading, error } = useDataManager(
    baseConfig.dataDependencies,
    props
  );

  if (loading) return <div>Loading users data...</div>;
  if (error) return <div>Error loading users data: {error.message}</div>;


  const finalConfig = getUserConfig(data, props, timeZone, companyInfo);

  return <DynamicCRUD {...finalConfig} icon="fa-solid fa-user" />;
};

export default Users;