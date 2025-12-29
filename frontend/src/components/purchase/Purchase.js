

import React from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getPurchaseConfig } from "./PurchaseConfig";
import { useDataManager } from "../common/userdatamanager";
import { useTimeZone } from "../../contexts/TimeZoneContext";

const Purchase = (props) => {
  const { timeZone } = useTimeZone();

  const baseConfig = getPurchaseConfig();

  const { data, loading, error } = useDataManager(
    baseConfig.dataDependencies,
    props
  );

  if (loading) {
    return <div>Loading purchase data...</div>;
  }

  if (error) {
    return <div>Error loading purchase data</div>;
  }

  const company = data?.company || props?.company || {};

  const finalConfig = getPurchaseConfig(
    data,
    { ...props, company },
    timeZone
  );

  console.log("Final Purchase Config:", finalConfig);

  return (
    <DynamicCRUD
      {...finalConfig}
      icon="fa-solid fa-shopping-cart"
    />
  );
};

export default Purchase;
