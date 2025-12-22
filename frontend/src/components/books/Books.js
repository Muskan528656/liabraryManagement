import React from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getBooksConfig } from "./bookconfig";
import { useDataManager } from "../common/userdatamanager";
import { useTimeZone } from "../../contexts/TimeZoneContext";

const Books = (props) => {
  const { timeZone } = useTimeZone();

  console.log("sdfghjgfdewertyu", timeZone);
  const baseConfig = getBooksConfig();

  console.log("books baseConfig", baseConfig);

  const { data, loading, error } = useDataManager(
    baseConfig.dataDependencies,
    props
  );
  if (loading) {
    console.log("books data", loading, data, error);
    return <div>Loading books data...</div>;
  }
  console.log("books data", loading);

  const finalConfig = getBooksConfig(data, props, timeZone);

  console.log("books finalConfig", finalConfig);

  return <DynamicCRUD {...finalConfig}  icon="fa-solid fa-book" />;
};

export default Books;