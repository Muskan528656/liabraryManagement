

import React, { useState, useEffect } from "react";
import DynamicCRUD from "../common/DynaminCrud";
import { getBooksConfig } from "./bookconfig";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import PermissionDenied from "../../utils/permission_denied";
import { AuthHelper } from "../../utils/authHelper";
import DataApi from "../../api/dataApi";

const Books = ({ permissions, ...props }) => {
  const { timeZone } = useTimeZone();
  const [externalData, setExternalData] = useState({ authors: [], categories: [], publishers: [], shelf: [] });
  const [loading, setLoading] = useState(true);
  const isSuperAdmin = AuthHelper.isSuperAdmin?.();
  console.log("Books Component Permissions:", permissions);
  const fetchExternalData = async () => {
    try {
      setLoading(true);
      const [authorsRes, categoriesRes, publishersRes, ShelfResp] = await Promise.all([
        new DataApi("author").fetchAll(),
        new DataApi("category").fetchAll(),
        new DataApi("publisher").fetchAll(),
        new DataApi("shelf").fetchAll()
      ]);

      const authors = authorsRes?.data?.data || authorsRes?.data || [];
      const categories = categoriesRes?.data?.data || categoriesRes?.data || [];
      const publishers = publishersRes?.data?.data || publishersRes?.data || [];
      const shelf = ShelfResp?.data?.data || ShelfResp?.data || [];
      console.log("shelfshelfshelf", shelf)
      setExternalData({
        authors: Array.isArray(authors) ? authors : [],
        categories: Array.isArray(categories) ? categories : [],
        publishers: Array.isArray(publishers) ? publishers : [],
        shelf: Array.isArray(shelf) ? shelf : [],
      });
      console.log("shelfshelfshelf", shelf)
    } catch (error) {
      console.error("Error fetching external data:", error);
      setExternalData({ authors: [], categories: [], publishers: [], shelf: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExternalData();
  }, []);

  if (!isSuperAdmin && !permissions?.allowView) {
    return <PermissionDenied />;
  }

  const finalConfig = getBooksConfig(
    externalData,
    timeZone,
    {
      canCreate: permissions?.allowCreate,
      canEdit: permissions?.allowEdit,
      canDelete: permissions?.allowDelete
    }
  );

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <DynamicCRUD
      {...finalConfig}
      icon="fa-solid fa-book"
      permissions={permissions}
      authors={externalData.authors}
      categories={externalData.categories}
      publishers={externalData.publishers}
      shelf={externalData.shelf}

    />
  );
};

export default Books;
