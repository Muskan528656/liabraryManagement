import React, { useState, useEffect } from "react";
import ModuleDetail from "../common/ModuleDetail";
import DataApi from "../../api/dataApi";

const PurchaseDetail = () => {
  const [externalData, setExternalData] = useState({ vendors: [], books: [] });

  useEffect(() => {
    const fetchExternalData = async () => {
      try {
 
        const vendorApi = new DataApi("vendor");
        const vendorsResponse = await vendorApi.fetchAll();
        const vendors = vendorsResponse?.data?.data || vendorsResponse?.data || [];

 
        const bookApi = new DataApi("book");
        const booksResponse = await bookApi.fetchAll();
        const books = booksResponse?.data?.data || booksResponse?.data || [];

        setExternalData({
          vendors: Array.isArray(vendors) ? vendors : [],
          books: Array.isArray(books) ? books : [],
        });
      } catch (error) {
        console.error("Error fetching external data:", error);
      }
    };

    fetchExternalData();
  }, []);

  const fields = {
    title: "purchase_serial_no",
    subtitle: "book_title",

    details: [
      { key: "purchase_serial_no", label: "Purchase Serial No", type: "text" },
      {
        key: "vendor_id",
        label: "Vendor",
        type: "select",
        options: "vendors",
        displayKey: "vendor_name"
      },
      {
        key: "book_id",
        label: "Book",
        type: "select",
        options: "books",
        displayKey: "book_title"
      },
      { key: "quantity", label: "Quantity", type: "number" },
      { key: "unit_price", label: "Unit Price", type: "number" },
      { key: "total_amount", label: "Total Amount", type: "number" },
      { key: "purchase_date", label: "Purchase Date", type: "date" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    other: [
      { key: "createdbyid", label: "Created By", type: "text" },
      { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },
      { key: "createddate", label: "Created Date", type: "date" },
      { key: "lastmodifieddate", label: "Last Modified Date", type: "date" },
    ],
  };

  const lookupNavigation = {
    vendor_name: {
      path: "vendor",
      idField: "vendor_id",
      labelField: "vendor_name"
    },
    book_title: {
      path: "book",
      idField: "book_id",
      labelField: "book_title"
    }
  };

  return (
    <ModuleDetail
      moduleName="purchase"
      moduleApi="purchase"
      moduleLabel="Purchase Management"
      icon="fa-solid fa-shopping-cart"
      fields={fields}
      lookupNavigation={lookupNavigation}
      externalData={externalData}
    />
  );
};

export default PurchaseDetail;