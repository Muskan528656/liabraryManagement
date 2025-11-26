import React from "react";
import ModuleDetail from "../common/ModuleDetail";

const PurchaseDetail = () => {
  const fields = {
    title: "id",
    subtitle: null,
    status: null,
    // overview: [
    //   { key: "vendor_name", label: "Vendor", type: "text" },
    //   { key: "book_title", label: "Book", type: "text" },
    //   { key: "quantity", label: "Quantity", type: "number" },
    //   { key: "unit_price", label: "Unit Price", type: "currency" },
    //   { key: "total_amount", label: "Total Amount", type: "currency" },
    // ],
    details: [
      { key: "vendor_name", label: "Vendor", type: "text" },
      { key: "book_title", label: "Book", type: "text" },
      { key: "book_isbn", label: "ISBN", type: "text" },
      { key: "quantity", label: "Quantity", type: "number" },
      { key: "unit_price", label: "Unit Price", type: "currency" },
      { key: "total_amount", label: "Total Amount", type: "currency" },
      { key: "purchase_date", label: "Purchase Date", type: "date" },
      { key: "notes", label: "Notes", type: "text" },
      { key: "created_at", label: "Created At", type: "datetime" },
      { key: "updated_at", label: "Updated At", type: "datetime" },
    ],
    other: [
      { key: "createdbyid", label: "Created By", type: "text" },
      { key: "lastmodifiedbyid", label: "Last Modified By", type: "text" },
      { key: "createddate", label: "Created Date", type: "date" },
      { key: "lastmodifieddate", label: "Last Modified Date", type: "date" },
      
     ],
    detailsLayout: "grid",
  };

  return (
    <ModuleDetail
      moduleName="purchase"
      moduleApi="purchase"
      moduleLabel="Purchase"
      fields={fields}
      relatedModules={[]}
      customHeader={(data) => (
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h2 className="mb-2 fw-bold" style={{ color: "#6f42c1" }}>
              Purchase #{data.id}
            </h2>
            <div className="text-muted">
              {data.vendor_name && <div>Vendor: {data.vendor_name}</div>}
              {data.book_title && <div>Book: {data.book_title}</div>}
            </div>
          </div>
        </div>
      )}
    />
  );
};

export default PurchaseDetail;
