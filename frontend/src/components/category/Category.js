




import React from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getCategoryConfig } from "./categoryconfig";
import { useDataManager } from "../common/userdatamanager";
import Loader from "../common/Loader";

const Category = (props) => {
  // Get config structure first
  const baseConfig = getCategoryConfig();

  // Fetch data if needed (though categories don't have dependencies)
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

  // Merge props data and fetched data
  const allData = {
    ...data,
    ...props
  };

  // Get final config with all data
  const finalConfig = getCategoryConfig(allData);

  return <DynamicCRUD {...finalConfig} icon="fa-solid fa-tags"/>;
};

export default Category;