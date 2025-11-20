// // config/purchaseConfig.js
// export const getPurchaseConfig = (externalData = {}, props = {}) => {
//     // Provide safe defaults for externalData
//     const safeExternalData = {
//         vendors: externalData.vendors || [],
//         books: externalData.books || [],
//         authors: externalData.authors || [],
//         categories: externalData.categories || [],
//         ...externalData
//     };

//     const vendorOptions = safeExternalData.vendors.map((vendor) => ({
//         value: vendor.id,
//         label: vendor.name,
//     }));

//     const bookOptions = safeExternalData.books.map((book) => ({
//         value: book.id,
//         label: `${book.title}${book.isbn ? ` (${book.isbn})` : ""}`,
//     }));

//     const authorOptions = safeExternalData.authors.map((author) => ({
//         value: author.id,
//         label: author.name,
//     }));

//     const categoryOptions = safeExternalData.categories.map((category) => ({
//         value: category.id,
//         label: category.name,
//     }));

//     return {
//         moduleName: "purchases",
//         moduleLabel: "Purchase",
//         apiEndpoint: "purchase",
//         initialFormData: {
//             vendor_id: "",
//             book_id: "",
//             quantity: 1,
//             unit_price: 0,
//             purchase_date: new Date().toISOString().split('T')[0],
//             notes: "",
//         },
//         columns: [
//             {
//                 field: "vendor_name",
//                 label: "Vendor",
//                 sortable: true,
//                 render: (value, record) => (
//                     <div className="d-flex align-items-center">
//                         <div
//                             className="rounded-circle d-flex align-items-center justify-content-center me-2"
//                             style={{
//                                 width: "32px",
//                                 height: "32px",
//                                 background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
//                                 color: "white",
//                                 fontSize: "14px",
//                             }}
//                         >
//                             <i className="fa-solid fa-store"></i>
//                         </div>
//                         <a
//                             href={`/vendor/${record.vendor_id}`}
//                             onClick={(e) => {
//                                 e.preventDefault();
//                                 window.location.href = `/vendor/${record.vendor_id}`;
//                             }}
//                             style={{
//                                 color: "#6f42c1",
//                                 textDecoration: "none",
//                                 fontWeight: "500"
//                             }}
//                             onMouseEnter={(e) => {
//                                 e.target.style.textDecoration = "underline";
//                             }}
//                             onMouseLeave={(e) => {
//                                 e.target.style.textDecoration = "none";
//                             }}
//                         >
//                             {value || "N/A"}
//                         </a>
//                     </div>
//                 ),
//             },
//             {
//                 field: "book_title",
//                 label: "Book",
//                 sortable: true,
//                 render: (value, record) => (
//                     <a
//                         href={`/books/${record.book_id}`}
//                         onClick={(e) => {
//                             e.preventDefault();
//                             window.location.href = `/books/${record.book_id}`;
//                         }}
//                         style={{
//                             color: "#6f42c1",
//                             textDecoration: "none",
//                             fontWeight: "500"
//                         }}
//                         onMouseEnter={(e) => {
//                             e.target.style.textDecoration = "underline";
//                         }}
//                         onMouseLeave={(e) => {
//                             e.target.style.textDecoration = "none";
//                         }}
//                     >
//                         {value || "N/A"}
//                     </a>
//                 ),
//             },
//             {
//                 field: "book_isbn",
//                 label: "ISBN",
//                 render: (value) => <span style={{ fontFamily: "monospace" }}>{value || '-'}</span>,
//             },
//             {
//                 field: "quantity",
//                 label: "Quantity",
//                 sortable: true,
//                 render: (value) => <span>{value || 0}</span>,
//             },
//             {
//                 field: "unit_price",
//                 label: "Unit Price",
//                 sortable: true,
//                 render: (value) => `₹${parseFloat(value || 0).toFixed(2)}`,
//             },
//             {
//                 field: "total_amount",
//                 label: "Total Amount",
//                 sortable: true,
//                 render: (value) => `₹${parseFloat(value || 0).toFixed(2)}`,
//             },
//             {
//                 field: "purchase_date",
//                 label: "Purchase Date",
//                 sortable: true,
//                 render: (value) => value ? new Date(value).toLocaleDateString() : "-",
//             },
//             {
//                 field: "notes",
//                 label: "Notes",
//                 render: (value) => <span style={{ color: "#6c757d" }}>{value || '-'}</span>,
//             },
//         ],
//         formFields: [
//             {
//                 name: "vendor_id",
//                 label: "Vendor",
//                 type: "custom",
//                 required: true,
//                 colSize: 6,
//                 render: (value, onChange, formData, externalData = {}) => {
//                     const safeExternalData = externalData || {};
//                     const vendors = safeExternalData.vendors || [];

//                     return (
//                         <div className="mb-3">
//                             <label className="form-label">
//                                 Vendor <span className="text-danger">*</span>
//                             </label>
//                             <select
//                                 className="form-control"
//                                 name="vendor_id"
//                                 value={value}
//                                 onChange={onChange}
//                                 required
//                                 style={{
//                                     border: "2px solid #c084fc",
//                                     borderRadius: "8px",
//                                 }}
//                             >
//                                 <option value="">Select Vendor</option>
//                                 {vendors.map(vendor => (
//                                     <option key={vendor.id} value={vendor.id}>
//                                         {vendor.name}
//                                     </option>
//                                 ))}
//                             </select>
//                         </div>
//                     );
//                 },
//             },
//             {
//                 name: "book_id",
//                 label: "Book",
//                 type: "custom",
//                 required: true,
//                 colSize: 6,
//                 render: (value, onChange, formData, externalData = {}) => {
//                     const safeExternalData = externalData || {};
//                     const books = safeExternalData.books || [];

//                     return (
//                         <div className="mb-3">
//                             <label className="form-label">
//                                 Book <span className="text-danger">*</span>
//                             </label>
//                             <select
//                                 className="form-control"
//                                 name="book_id"
//                                 value={value}
//                                 onChange={onChange}
//                                 required
//                                 style={{
//                                     border: "2px solid #c084fc",
//                                     borderRadius: "8px",
//                                 }}
//                             >
//                                 <option value="">Select Book</option>
//                                 {books.map(book => (
//                                     <option key={book.id} value={book.id}>
//                                         {book.title}{book.isbn ? ` (${book.isbn})` : ''}
//                                     </option>
//                                 ))}
//                             </select>
//                         </div>
//                     );
//                 },
//             },
//             {
//                 name: "quantity",
//                 label: "Quantity",
//                 type: "number",
//                 required: true,
//                 placeholder: "Enter quantity",
//                 colSize: 4,
//                 min: 1,
//                 customValidation: (value) => {
//                     if (!value || value < 1) {
//                         return "Quantity must be at least 1";
//                     }
//                     return null;
//                 }
//             },
//             {
//                 name: "unit_price",
//                 label: "Unit Price",
//                 type: "number",
//                 required: true,
//                 placeholder: "Enter unit price",
//                 colSize: 4,
//                 min: 0,
//                 step: 0.01,
//                 customValidation: (value) => {
//                     if (!value || value < 0) {
//                         return "Unit price must be a positive number";
//                     }
//                     return null;
//                 }
//             },
//             {
//                 name: "total_amount",
//                 label: "Total Amount",
//                 type: "custom",
//                 colSize: 4,
//                 render: (value, onChange, formData) => (
//                     <div className="mb-3">
//                         <label className="form-label">Total Amount</label>
//                         <input
//                             type="text"
//                             className="form-control bg-light"
//                             value={`₹${((parseFloat(formData.quantity) || 0) * (parseFloat(formData.unit_price) || 0)).toFixed(2)}`}
//                             readOnly
//                             style={{
//                                 border: "1px solid #ced4da",
//                                 borderRadius: "8px",
//                             }}
//                         />
//                     </div>
//                 ),
//             },
//             {
//                 name: "purchase_date",
//                 label: "Purchase Date",
//                 type: "date",
//                 required: true,
//                 colSize: 6,
//             },
//             {
//                 name: "notes",
//                 label: "Notes",
//                 type: "textarea",
//                 rows: 3,
//                 placeholder: "Additional notes...",
//                 colSize: 12,
//             },
//         ],
//         validationRules: (formData, allPurchases, editingPurchase) => {
//             const errors = [];

//             // Required field validation
//             if (!formData.vendor_id) {
//                 errors.push("Vendor is required");
//             }

//             if (!formData.book_id) {
//                 errors.push("Book is required");
//             }

//             if (!formData.quantity || formData.quantity < 1) {
//                 errors.push("Quantity must be at least 1");
//             }

//             if (!formData.unit_price || formData.unit_price < 0) {
//                 errors.push("Unit price must be a positive number");
//             }

//             if (!formData.purchase_date) {
//                 errors.push("Purchase date is required");
//             }

//             return errors;
//         },
//         dataDependencies: {
//             vendors: { source: 'api', endpoint: 'purchasevendor' },
//             books: { source: 'api', endpoint: 'book' },
//             authors: { source: 'api', endpoint: 'author' },
//             categories: { source: 'api', endpoint: 'category' }
//         },
//         features: {
//             showBulkInsert: true,
//             showImportExport: true,
//             showDetailView: true,
//             showSearch: true,
//             showColumnVisibility: true,
//             showCheckbox: true,
//             showActions: true,
//             showAddButton: true,
//             allowEdit: true,
//             allowDelete: true,
//             searchFields: [
//                 "vendor_name",
//                 "book_title",
//                 "book_isbn"
//             ],
//             bulkInsertConfig: {
//                 allowManualEntry: true,
//                 allowFileImport: true,
//                 maxRows: 10,
//                 rowTemplate: {
//                     vendor_id: "",
//                     book_id: "",
//                     quantity: 1,
//                     unit_price: 0,
//                     purchase_date: new Date().toISOString().split('T')[0],
//                     notes: ""
//                 }
//             }
//         },
//         details: [
//             { key: "vendor_name", label: "Vendor", type: "text" },
//             { key: "book_title", label: "Book", type: "text" },
//             { key: "book_isbn", label: "ISBN", type: "text" },
//             { key: "quantity", label: "Quantity", type: "number" },
//             { key: "unit_price", label: "Unit Price", type: "currency" },
//             { key: "total_amount", label: "Total Amount", type: "currency" },
//             { key: "purchase_date", label: "Purchase Date", type: "date" },
//             { key: "notes", label: "Notes", type: "text" },
//             { key: "created_at", label: "Created At", type: "datetime" },
//             { key: "updated_at", label: "Updated At", type: "datetime" },
//         ],
//         customHandlers: {
//             beforeSave: (formData, editingItem) => {
//                 // Calculate total amount before saving
//                 const quantity = parseFloat(formData.quantity) || 0;
//                 const unitPrice = parseFloat(formData.unit_price) || 0;

//                 return {
//                     ...formData,
//                     total_amount: quantity * unitPrice
//                 };
//             },
//             afterSave: (response, editingItem) => {
//                 console.log("Purchase saved:", response);
//                 // Additional custom logic after save
//             },
//             onFormChange: (name, value, formData, setFormData) => {
//                 // Auto-calculate total amount when quantity or unit price changes
//                 if (name === "quantity" || name === "unit_price") {
//                     const quantity = parseFloat(name === "quantity" ? value : formData.quantity) || 0;
//                     const unitPrice = parseFloat(name === "unit_price" ? value : formData.unit_price) || 0;

//                     setFormData(prev => ({
//                         ...prev,
//                         [name]: value,
//                         total_amount: quantity * unitPrice
//                     }));
//                 } else {
//                     setFormData(prev => ({
//                         ...prev,
//                         [name]: value
//                     }));
//                 }
//             }
//         },
//         exportConfig: {
//             fileName: "purchases",
//             sheetName: "Purchases",
//             columns: [
//                 { key: "Vendor", header: "Vendor", width: 30 },
//                 { key: "Book", header: "Book", width: 30 },
//                 { key: "ISBN", header: "ISBN", width: 20 },
//                 { key: "Quantity", header: "Quantity", width: 15 },
//                 { key: "Unit Price", header: "Unit Price", width: 15 },
//                 { key: "Total Amount", header: "Total Amount", width: 15 },
//                 { key: "Purchase Date", header: "Purchase Date", width: 15 },
//                 { key: "Notes", header: "Notes", width: 30 },
//             ],
//             dataMapper: (purchase) => ({
//                 "Vendor": purchase.vendor_name || "N/A",
//                 "Book": purchase.book_title || "N/A",
//                 "ISBN": purchase.book_isbn || "N/A",
//                 "Quantity": purchase.quantity,
//                 "Unit Price": purchase.unit_price,
//                 "Total Amount": purchase.total_amount,
//                 "Purchase Date": purchase.purchase_date,
//                 "Notes": purchase.notes || "",
//             })
//         },
//         bulkInsertHandlers: {
//             onAddVendor: (vendorData, currentRowIndex, multiInsertRows, setMultiInsertRows) => {
//                 console.log("Add vendor:", vendorData, currentRowIndex);
//             },
//             onAddBook: (bookData, currentRowIndex, multiInsertRows, setMultiInsertRows) => {
//                 console.log("Add book:", bookData, currentRowIndex);
//             },
//             validateBulkRows: (rows) => {
//                 const errors = [];
//                 const partiallyFilledRows = [];

//                 rows.forEach((row, index) => {
//                     const hasSomeFields = row.vendor_id || row.book_id || row.quantity || row.unit_price;
//                     const hasAllRequiredFields = row.vendor_id && row.book_id && row.quantity && row.unit_price;

//                     if (hasSomeFields && !hasAllRequiredFields) {
//                         partiallyFilledRows.push(index + 1);
//                     }
//                 });

//                 if (partiallyFilledRows.length > 0) {
//                     errors.push(`Row(s) ${partiallyFilledRows.join(", ")} are partially filled. Please fill all required fields (Vendor, Book, Quantity, Unit Price) or delete the row(s).`);
//                 }

//                 const completeRows = rows.filter(row => row.vendor_id && row.book_id && row.quantity && row.unit_price);
//                 if (completeRows.length === 0) {
//                     errors.push("Please fill at least one complete purchase entry (Vendor, Book, Quantity, and Unit Price are required)");
//                 }

//                 return errors;
//             }
//         }
//     };
// };