import React from "react";
import ModuleDetail from "../common/ModuleDetail";

const BookDetail = () => {
  const fields = {
    title: "title",
    subtitle: "isbn",
    overview: [
      { key: "title", label: "Title", type: "text" },
      { key: "author_name", label: "Author", type: "text" },
      { key: "category_name", label: "Category", type: "text" },
      { key: "language", label: "Language", type: "text" },
    ],
    details: [
      { key: "isbn", label: "ISBN", type: "text" },
      { key: "publisher", label: "Publisher", type: "text" },
      { key: "description", label: "Description", type: "text" },
      { key: "published_year", label: "Published Year", type: "number" },
      { key: "total_copies", label: "Total Copies", type: "number" },
      { key: "available_copies", label: "Available Copies", type: "number" },
      { key: "created_at", label: "Created At", type: "datetime" },
      { key: "updated_at", label: "Updated At", type: "datetime" },
    ],
  };

  return (
    <ModuleDetail
      moduleName="books"
      moduleApi="book"
      moduleLabel="Book"
      fields={fields}
    />
  );
};

export default BookDetail;

