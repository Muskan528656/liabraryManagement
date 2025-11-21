import React from "react";

import Loader from "../common/Loader";


import DynamicCRUD from "../common/DynaminCrud";
import { getAuthorConfig } from "./AuthorConfig";
import { useDataManager } from "../common/UserDataManager";


const Author = (props) => {
  const baseConfig = getAuthorConfig();

  const { data, loading, error } = useDataManager(
    baseConfig.dataDependencies,
    props
  );

  if (loading) {
    return <Loader message="Loading authors data..." />;
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <h4>Error Loading Authors</h4>
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

  const finalConfig = getAuthorConfig(allData);

  return <DynamicCRUD {...finalConfig} />;
};

export default Author;