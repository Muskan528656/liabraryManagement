




import React from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getCategoryConfig } from "./categoryconfig";
import { useDataManager } from "../common/userdatamanager";
import Loader from "../common/Loader";
import { useTimeZone } from "../../contexts/TimeZoneContext";

const Category = (props) => {
  const baseConfig = getCategoryConfig();
   const { timeZone } = useTimeZone();

  const { data, loading, error } = useDataManager(
    baseConfig.dataDependencies,
    props
  );

  if (loading) {
    return <Loader message="Loading categories data..." />;
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <h4>Error Loading Categories</h4>
        <p>{error.message}</p>
        <button
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }


  const allData = {
    ...data,
    ...props
  };


  const finalConfig = getCategoryConfig(allData,timeZone);

  return <DynamicCRUD {...finalConfig} icon="fa-solid fa-tags" />;
};

export default Category;