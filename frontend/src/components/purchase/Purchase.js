
import React from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getPurchaseConfig } from "./PurchaseConfig";
import { useDataManager } from "../common/userdatamanager";

const Purchase = (props) => {
  const baseConfig = getPurchaseConfig();

  const { data, loading, error } = useDataManager(
    baseConfig.dataDependencies,
    props
  );

  if (loading) {
    return <div>Loading purchase data...</div>;
  }

  const finalConfig = getPurchaseConfig(data, props);
  console.log("Final Purchase Config:", finalConfig);

  return <DynamicCRUD {...finalConfig} icon="fa-solid fa-shopping-cart" />;
};

export default Purchase;