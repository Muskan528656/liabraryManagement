import React from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getBooksConfig } from "./BookConfig";
import { useDataManager } from "../common/UserDataManager";

const Books = (props) => {
  const baseConfig = getBooksConfig();

  const { data, loading, error } = useDataManager(
    baseConfig.dataDependencies,
    props  
  );

  if (loading) {
    return <div>Loading books data...</div>;
  }

  const finalConfig = getBooksConfig(data, props);

  return <DynamicCRUD {...finalConfig} />;
};

export default Books;