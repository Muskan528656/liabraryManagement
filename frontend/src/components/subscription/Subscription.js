import React, { useEffect, useState } from "react";
import Loader from "../common/Loader";
import DynamicCRUD from "../common/DynaminCrud";
import { getSubscriptionConfig } from "./subscriptionconfig";
import { useDataManager } from "../common/userdatamanager";
import DataApi from "../../api/dataApi";

const Subscription = (props) => {
  const [timeZone , setTimeZone] = useState(null);
  const baseConfig = getSubscriptionConfig();
  const { data, loading, error } = useDataManager(
    baseConfig.dataDependencies,
    props
  );

  function getCompanyIdFromToken() {
    const token = sessionStorage.getItem("token");
    if (!token) return null;

    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.companyid || payload.companyid || null;
  }
  const fetchCompanyDetails = async () => {
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
        
        console.log("Company---=:", response.data.time_zone);
      }
    } catch (error) {
      console.error("Error fetching company by ID:", error);
    }
  };

  useEffect(() => {
    fetchCompanyDetails();
  }, []);

 

  if (loading) {
    return <Loader message="Loading subscriptions..." />;
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <h4>Failed to load subscriptions</h4>
        <p>{error}</p>
      </div>
    );
  }

  const finalConfig = getSubscriptionConfig(data,timeZone);
  console.log("finalConfig---22 ", finalConfig);

  return <DynamicCRUD {...finalConfig} icon="fa-solid fa-id-card" />;
};

export default Subscription;
