import React, { useState, useEffect } from "react";
import ModuleDetail from "../common/ModuleDetail";
import DataApi from "../../api/dataApi";

const BookDetail = () => {
  const [externalData, setExternalData] = useState({ authors: [], categories: [] });

  useEffect(() => {
    const fetchExternalData = async () => {
      try {
        // Fetch authors
        const authorApi = new DataApi("author");
        const authorsResponse = await authorApi.fetchAll();
        const authors = authorsResponse?.data?.data || authorsResponse?.data || [];
        
        // Fetch categories
        const categoryApi = new DataApi("category");
        const categoriesResponse = await categoryApi.fetchAll();
        const categories = categoriesResponse?.data?.data || categoriesResponse?.data || [];
        
        setExternalData({
          authors: Array.isArray(authors) ? authors : [],
          categories: Array.isArray(categories) ? categories : [],
        });
      } catch (error) {
        console.error("Error fetching external data:", error);
      }
    };

    fetchExternalData();
  }, []);

  const fields = {
    title: "title",
    subtitle: "isbn",
    // overview: [
    //   { key: "title", label: "Title", type: "text" },
    //   { 
    //     key: "author_id", 
    //     label: "Author", 
    //     type: "select",
    //     options: "authors",
    //     displayKey: "author_name" // For display in non-edit mode
    //   },
    //   { 
    //     key: "category_id", 
    //     label: "Category", 
    //     type: "select",
    //     options: "categories",
    //     displayKey: "category_name" // For display in non-edit mode
    //   },
    //   { key: "language", label: "Language", type: "text" },
    // ],
    details: [
      { key: "title", label: "Title", type: "text" },
      { key: "isbn", label: "ISBN", type: "text" },
      { 
        key: "author_id", 
        label: "Author", 
        type: "select",
        options: "authors",
        displayKey: "author_name"
      },
      { 
        key: "category_id", 
        label: "Category", 
        type: "select",
        options: "categories",
        displayKey: "category_name"
      },
      { key: "description", label: "Description", type: "text" },
      { key: "total_copies", label: "Total Copies", type: "number" },
      { key: "available_copies", label: "Available Copies", type: "number" },
      { key: "createddate", label: "Created At", type: "datetime" },
      { key: "lastmodifieddate", label: "Updated At", type: "datetime" },
    ],
    other: [
      { key: "createdbyid", label: "Created By", type: "text" },
      { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },
      { key: "createddate", label: "Created Date", type: "date" },
      { key: "lastmodifieddate", label: "Last Modified Date", type: "date" },
      
     ],
  };

  const lookupNavigation = {
    author_name: {
      path: "author",
      idField: "author_id",
      labelField: "author_name"
    },
    category_name: {
      path: "category",
      idField: "category_id",
      labelField: "category_name"
    }
  };

  return (
    <ModuleDetail
      moduleName="book"
      moduleApi="book"
      moduleLabel="Book"
      fields={fields}
      lookupNavigation={lookupNavigation}
      externalData={externalData}
    />
  );
};

export default BookDetail;