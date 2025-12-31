import React from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getBooksConfig } from "./bookconfig";
import { useDataManager } from "../common/userdatamanager";
import { useTimeZone } from "../../contexts/TimeZoneContext";

const Books = (props) => {
  const { timeZone } = useTimeZone();

 
  const baseConfig = getBooksConfig();

 

  const { data, loading, error } = useDataManager(
    baseConfig.dataDependencies,
    props
  );
  if (loading) {
 
    return <div>Loading books data...</div>;
  }
 

  const finalConfig = getBooksConfig(data, props, timeZone);

 

  return <DynamicCRUD {...finalConfig}  icon="fa-solid fa-book" />;
};

export default Books;