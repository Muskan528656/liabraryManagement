
import React, { useEffect, useState } from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getPurchaseConfig } from "./PurchaseConfig";
import { useDataManager } from "../common/userdatamanager";
import DataApi from "../../api/dataApi";

const Purchase = (props) => {
  const [timeZone, setTimeZone] = useState(null);
  const baseConfig = getPurchaseConfig();
   function getCompanyIdFromToken() {
          const token = sessionStorage.getItem("token");
          if (!token) return null;
      
          const payload = JSON.parse(atob(token.split(".")[1]));
          return payload.companyid || payload.companyid || null;
        }
      
        const fetchCompany = async () => {
          try {
            const companyid = getCompanyIdFromToken();
      
            if (!companyid) {
              console.error("Company ID not found in token");
              return;
            }
      
            const companyApi = new DataApi("company");
            const response = await companyApi.fetchById(companyid);
      
            if (response.data) {
              setTimeZone(response.data.time_zone);
              
              // console.log("Company:", response.data);
            }
          } catch (error) {
            console.error("Error fetching company by ID:", error);
          }
        };

    useEffect(()=>{
      fetchCompany();
    },[])

  const { data, loading, error } = useDataManager(
    baseConfig.dataDependencies,
    props
  );

  if (loading) {
    return <div>Loading purchase data...</div>;
  }

  const finalConfig = getPurchaseConfig(data, props,timeZone);
  console.log("Final Purchase Config:", finalConfig);

  return <DynamicCRUD {...finalConfig} icon="fa-solid fa-shopping-cart" />;
};

export default Purchase;