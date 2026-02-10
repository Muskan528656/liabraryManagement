// import React, { useState, useMemo } from "react";
// import { Row, Col, Form, Button, Badge, Card } from "react-bootstrap";
// import { FaSearch, FaTimes } from "react-icons/fa";

// export const applyAdvancedFilters = (data = [], filterValues = {}) => {

//   if (
//     !filterValues ||
//     Object.values(filterValues).every(
//       v => v === "" || v === null || v === undefined
//     )
//   ) {
//     return data;
//   }

//   return data.filter(item =>
//     Object.keys(filterValues).every(key => {
//       let filterValue = filterValues[key];

//       if (filterValue === "" || filterValue === null || filterValue === undefined)
//         return true;

//       const itemValue = item[key];

//       if (filterValue === "true") filterValue = true;
//       if (filterValue === "false") filterValue = false;

//       if (typeof filterValue === "boolean") {
//         return itemValue === filterValue;
//       }

//       if (key.endsWith("_from") || key.endsWith("_to")) {
//         const field = key.replace("_from", "").replace("_to", "");
//         if (!item[field]) return false;

//         const itemDate = new Date(item[field]).toLocaleDateString("en-CA");
//         const filterDate = filterValue;

//         if (key.endsWith("_from")) return itemDate >= filterDate;
//         if (key.endsWith("_to")) return itemDate <= filterDate;
//       }

//       if (typeof itemValue === "number") {
//         return itemValue === Number(filterValue);
//       }

//       return String(itemValue || "")
//         .toLowerCase()
//         .includes(String(filterValue).toLowerCase());
//     })
//   );
// };



// const AdvancedFilter = ({ fields = [], onFilterChange, onClear, className = "" }) => {

//   // console.log("onFilterChange:", onFilterChange);
//   // console.log("AdvancedFilter fields:", fields);


//   const [localFilters, setLocalFilters] = useState({});
//   const [isExpanded, setIsExpanded] = useState(true);

//   const handleChange = (name, value) => {
    
//     // console.log("name",name,"value",value);
    
//     setLocalFilters(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSearch = (e) => {
//     e.preventDefault();
//     onFilterChange && onFilterChange(localFilters);
//   };

//   const handleClear = () => {
//     setLocalFilters({});
//     onClear && onClear();
//     onFilterChange && onFilterChange({});
//   };

//   const activeCount = useMemo(() => {
//     return Object.values(localFilters).filter(v => v !== "" && v !== null).length;
//   }, [localFilters]);

//   return (
//     <div className={`advanced-filter-wrapper ${className} mb-1`}>
//       {/* Header Section */}
//       <div className="d-flex align-items-center justify-content-end">
//         <div className="d-none">
//           <Button
//             variant={isExpanded ? "secondary" : "outline-secondary"}
//             size="sm"
//             className="d-flex align-items-center gap-2 px-3 "
//           >
//             <i className={`fa-solid ${isExpanded ? 'fa-minus' : 'fa-filter'}`}></i>
//             <span className="fw-bold">Advanced Filter</span>
//             {activeCount > 0 && (
//               <Badge pill bg="primary" className="ms-1 px-2" style={{ fontSize: '0.75rem' }}>
//                 {activeCount}
//               </Badge>
//             )}
//             <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} ms-1 small`}></i>
//           </Button>
//         </div>
//       </div>

//       {/* Expandable Filter Panel */}
//       {isExpanded && (

//         <Row className="align-items-end">
//           {fields.map((field, idx) => {
//             const fName = field.name || field.field;

//             // Date Range Fields
//             if (field.type === "date") {
//               return (
//                 <React.Fragment key={idx}>
//                   <Col xs={12} md={2}>
//                     <Form.Label className="text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.6rem', letterSpacing: '0.5px' }}>
//                       {field.label} From
//                     </Form.Label>
//                     <Form.Control
//                       size="sm"
//                       type="date"
//                       className="border-1"
//                       value={localFilters[fName + "_from"] || ""}
//                       onChange={(e) => handleChange(fName + "_from", e.target.value)}
//                     />
//                   </Col>
//                   <Col xs={12} md={2}>
//                     <Form.Label className="text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.6rem', letterSpacing: '0.5px' }}>
//                       {field.label} To
//                     </Form.Label>
//                     <Form.Control
//                       size="sm"
//                       type="date"
//                       className="border-1"
//                       value={localFilters[fName + "_to"] || ""}
//                       onChange={(e) => handleChange(fName + "_to", e.target.value)}
//                     />
//                   </Col>
//                 </React.Fragment>
//               );
//             }

//             // Select Fields
//             if (field.type === "select") {
//               return (
//                 <Col xs={12} md={2} key={idx}>
//                   <Form.Label className="text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.6rem', letterSpacing: '0.5px' }}>
//                     {field.label}
//                   </Form.Label>
//                   <Form.Select
//                     size="sm"
//                     className="border-1"
//                     value={localFilters[fName] || ""}
//                     onChange={(e) => handleChange(fName, e.target.value)}
//                   >
//                     <option value="">Select {field.label}</option>
//                     {field.options?.map((opt, i) => (
//                       <option key={i} value={opt.value}>{opt.label}</option>
//                     ))}
//                   </Form.Select>
//                 </Col>
//               );
//             }

//             // Text Fields
//             return (
//               <Col xs={12} md={2} key={idx}>
//                 <Form.Label className="text-uppercase text-muted fw-bold mb-1" style={{ fontSize: '0.6rem', letterSpacing: '0.5px' }}>
//                   {field.label}
//                 </Form.Label>
//                 <Form.Control
//                   size="sm"
//                   type="text"
//                   className="border-1"
//                   placeholder={`Enter ${field.label}...`}
//                   value={localFilters[fName] || ""}
//                   onChange={(e) => handleChange(fName, e.target.value)}
//                 />
//               </Col>
//             );
//           })}
// {/* 
//          <Col xs={12} md={2} className="d-flex align-items-end gap-2">
//           <div className="d-flex gap-2 ">
//             <Button
//               size="sm"
//               variant=""
//               onClick={handleClear}
//               className="btn-paper btn-paper-clear d-flex align-items-center gap-1 h-75 px-2"
//               style={{
//                 color:'var(--primary-color)',
//                 border:'1px solid var(--primary-color)',
//               }}
//               >
//               <i className="fa-solid fa-xmark"></i>
//               Clear
//             </Button>

//             <Button
//               size="sm"
//               variant=""
//               onClick={handleSearch}
//               className="btn-paper btn-paper-apply d-flex align-items-center gap-1 h-75 px-2"
//               style={{
//                 background:'var(--primary-color)',
//                 color:'#fff',
//               }}
//               >
//               <i className="fa-solid fa-paper-plane"></i> 
//               Apply
//             </Button>
//           </div>
//         </Col> */}
//         <FaTimes className="cursor-pointer" onClick={handleChange} /> 
//         </Row>
//       )}
//     </div>
//   );
// };

// export default AdvancedFilter;

import React, { useState, useMemo } from "react";
import { Form, Button, Container, Row, Col } from "react-bootstrap";

export const applyAdvancedFilters = (data = [], filterValues = {}) => {

  if (
    !filterValues ||
    Object.values(filterValues).every(
      v => v === "" || v === null || v === undefined
    )
  ) {
    return data;
  }

  return data.filter(item =>
    Object.keys(filterValues).every(key => {
      let filterValue = filterValues[key];

      if (filterValue === "" || filterValue === null || filterValue === undefined)
        return true;

      const itemValue = item[key];

      if (filterValue === "true") filterValue = true;
      if (filterValue === "false") filterValue = false;

      if (typeof filterValue === "boolean") {
        return itemValue === filterValue;
      }

      if (key.endsWith("_from") || key.endsWith("_to")) {
        const field = key.replace("_from", "").replace("_to", "");
        if (!item[field]) return false;

        const itemDate = new Date(item[field]).toLocaleDateString("en-CA");
        const filterDate = filterValue;

        if (key.endsWith("_from")) return itemDate >= filterDate;
        if (key.endsWith("_to")) return itemDate <= filterDate;
      }

      if (typeof itemValue === "number") {
        return itemValue === Number(filterValue);
      }

      return String(itemValue || "")
        .toLowerCase()
        .includes(String(filterValue).toLowerCase());
    })
  );
};

const AdvancedFilter = ({ fields = [], onFilterChange, onClear, className = "" }) => {

  const [localFilters, setLocalFilters] = useState({});
  // console.log("AdvancedFilter fields:", fields);
  // console.log("AdvancedFilter onFilterChange:", onFilterChange);
  // console.log("AdvancedFilter onClear:", onClear);
  const handleChange = (name, value) => {
    const newFilters = { ...localFilters, [name]: value };
    setLocalFilters(newFilters);
    // Apply filters immediately on change
    onFilterChange && onFilterChange(newFilters);
  };

  const handleClear = () => {
    setLocalFilters({});
    onClear && onClear();
    onFilterChange && onFilterChange({});
  };

  const activeCount = useMemo(() => {
    return Object.values(localFilters).filter(v => v !== "" && v !== null).length;
  }, [localFilters]);

  const labelStyle = {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#495057',
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const inputBaseStyle = {
    height: '44px',
    borderRadius: '8px',
    border: '1.5px solid #dee2e6',
    padding: '0.625rem 1rem',
    fontSize: '0.9375rem',
    transition: 'all 0.2s ease',
    backgroundColor: '#fff',
    width: '100%'
  };

  return (

    <div className={`advanced-filter-wrapper px-3 mb-0 ${className}`}>
      <Row className="align-items-end border p-2 rounded-4" style={{background:"var(--primary-background-color)"}} >
        {fields.map((field, idx) => {
          const fName = field.name || field.field;

          // Date Range Fields
          if (field.type === "date") {
            return (
             <React.Fragment key={idx}>
                <Col xs={12} md={2}>
                  <div style={labelStyle}>
                    <i className="fa-regular fa-calendar"></i>
                    <span>{field.label} From</span>
                  </div>
                  <Form.Control
                    type="date"
                    className="filter-input"
                    style={inputBaseStyle}
                    value={localFilters[fName + "_from"] || ""}
                    onChange={(e) => handleChange(fName + "_from", e.target.value)}
                  />
                </Col>

                <Col xs={12} md={2}>
                  <div style={labelStyle}>
                    <i className="fa-regular fa-calendar"></i>
                    <span>{field.label} To</span>
                  </div>
                  <Form.Control
                    type="date"
                    className="filter-input"
                    style={inputBaseStyle}
                    value={localFilters[fName + "_to"] || ""}
                    min={localFilters[fName + "_from"] || ""}
                    onChange={(e) => handleChange(fName + "_to", e.target.value)}
                  />
                </Col>
              </React.Fragment>

            );
          }

          // Select Fields
          if (field.type === "select") {
            return (
              <Col xs={12} md={2} key={idx}>
                <div style={labelStyle}>
                  <i className={field.icon || "fa-solid fa-filter"}></i>
                  <span>{field.label}</span>
                </div>
                <Form.Select
                  className="filter-select"
                  style={{
                    ...inputBaseStyle,
                    color: localFilters[fName] ? '#212529' : '#6c757d',
                    cursor: 'pointer',
                    paddingRight: '2.5rem',
                    appearance: 'none',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '16px 12px'
                  }}
                  value={localFilters[fName] || ""}
                  onChange={(e) => handleChange(fName, e.target.value)}
                >
                  <option value="">{field.placeholder || `All ${field.label}`}</option>
                  {field.options?.map((opt, i) => (
                    <option key={i} value={opt.value}>{opt.label}</option>
                  ))}
                </Form.Select>
              </Col>
            );
          }

          // Text/Search Fields
          return (
            <Col xs={12} md={2} key={idx}>
              <div style={labelStyle}>
                <i className={field.icon || "fa-solid fa-magnifying-glass"}></i>
                <span>{field.label}</span>
              </div>
              <Form.Control
                type="text"
                className="filter-input"
                style={inputBaseStyle}
                placeholder={field.placeholder || `Search by ${field.label.toLowerCase()}...`}
                value={localFilters[fName] || ""}
                onChange={(e) => handleChange(fName, e.target.value)}
              />
            </Col>
          );
        })}

        {/* Clear button - only show if there are active filters */}
        {/* {activeCount > 0 && ( */}
          {/* <Col xs={12} md={2} className="d-flex justify-content-end"> */}
            <Button
              variant="light"
              onClick={handleClear}
              tooltip="Clear all filters"
              className="filter-clear-btn d-flex align-items-center justify-content-center"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                border: '1.5px solid #dee2e6',
                padding: 0,
                backgroundColor: '#fff',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
            >
              {/* <i className="fa-solid fa-xmark" style={{ fontSize: '1.25rem', color: '#6c757d' }}></i> */}
              <i className="fa-solid fa-undo" style={{ fontSize: '1.25rem', color: '#6c757d' }}> </i>
            </Button>
          {/* </Col> */}
        {/* )} */}
      </Row>


      <style>{`
        .filter-input:focus,
        .filter-select:focus {
          outline: none;
          border-color: #0d6efd !important;
          box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
        }
        
        .filter-input::placeholder {
          color: #adb5bd;
        }

        .filter-input:hover,
        .filter-select:hover {
          border-color: #adb5bd;
        }

        .filter-clear-btn:hover {
          background-color: #f8f9fa !important;
          border-color: #adb5bd !important;
        }

        .filter-clear-btn:active {
          background-color: #e9ecef !important;
        }
      `}</style>
    </div>
  );
};

export default AdvancedFilter;

// import React, { useState, useMemo } from "react";
// import { Form, Button, Badge } from "react-bootstrap";

// export const applyAdvancedFilters = (data = [], filterValues = {}) => {
//   if (
//     !filterValues ||
//     Object.values(filterValues).every(
//       v => v === "" || v === null || v === undefined
//     )
//   ) {
//     return data;
//   }

//   return data.filter(item =>
//     Object.keys(filterValues).every(key => {
//       let filterValue = filterValues[key];

//       if (filterValue === "" || filterValue === null || filterValue === undefined)
//         return true;

//       const itemValue = item[key];

//       if (filterValue === "true") filterValue = true;
//       if (filterValue === "false") filterValue = false;

//       if (typeof filterValue === "boolean") {
//         return itemValue === filterValue;
//       }

//       if (key.endsWith("_from") || key.endsWith("_to")) {
//         const field = key.replace("_from", "").replace("_to", "");
//         if (!item[field]) return false;

//         const itemDate = new Date(item[field]).toLocaleDateString("en-CA");
//         const filterDate = filterValue;

//         if (key.endsWith("_from")) return itemDate >= filterDate;
//         if (key.endsWith("_to")) return itemDate <= filterDate;
//       }

//       if (typeof itemValue === "number") {
//         return itemValue === Number(filterValue);
//       }

//       return String(itemValue || "")
//         .toLowerCase()
//         .includes(String(filterValue).toLowerCase());
//     })
//   );
// };

// const AdvancedFilter = ({ 
//   fields = [], 
//   onFilterChange, 
//   onClear, 
//   className = "",
//   showFilterCount = true,
//   collapsible = false 
// }) => {
//   const [localFilters, setLocalFilters] = useState({});
//   const [isExpanded, setIsExpanded] = useState(true);

//   const handleChange = (name, value) => {
//     const newFilters = { ...localFilters, [name]: value };
//     setLocalFilters(newFilters);
//     onFilterChange && onFilterChange(newFilters);
//   };

//   const handleClear = () => {
//     setLocalFilters({});
//     onClear && onClear();
//     onFilterChange && onFilterChange({});
//   };

//   const activeCount = useMemo(() => {
//     return Object.values(localFilters).filter(v => v !== "" && v !== null).length;
//   }, [localFilters]);

//   const filterItemStyle = {
//     position: 'relative',
//     flex: '1 1 auto',
//     minWidth: '240px',
//     maxWidth: '100%'
//   };

//   const labelStyle = {
//     fontSize: '0.8125rem',
//     fontWeight: '600',
//     color: '#344054',
//     marginBottom: '0.5rem',
//     display: 'flex',
//     alignItems: 'center',
//     gap: '0.375rem',
//     letterSpacing: '0.01em'
//   };

//   const inputBaseStyle = {
//     height: '42px',
//     borderRadius: '10px',
//     border: '1px solid #D0D5DD',
//     padding: '0 0.875rem',
//     fontSize: '0.9375rem',
//     transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
//     backgroundColor: '#FFFFFF',
//     width: '100%',
//     color: '#101828',
//     boxShadow: '0 1px 2px 0 rgba(16, 24, 40, 0.05)'
//   };

//   return (
//     <div className={`advanced-filter-wrapper ${className}`}>
//       {/* Header with toggle and clear */}
//       <div 
//         style={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           padding: collapsible ? '0.1rem 0' : '0.1rem 0',
//           marginBottom: isExpanded ? '1rem' : '0'
//         }}
//       >
//         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
//           {collapsible && (
//             <Button
//               variant="link"
//               onClick={() => setIsExpanded(!isExpanded)}
//               className="p-0 text-decoration-none"
//               style={{
//                 color: '#344054',
//                 fontSize: '0.9375rem',
//                 fontWeight: '600',
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: '0.5rem'
//               }}
//             >
//               <i 
//                 className={`fa-solid fa-chevron-${isExpanded ? 'down' : 'right'}`}
//                 style={{ fontSize: '0.75rem', transition: 'transform 0.2s' }}
//               ></i>
//               <i className="fa-solid fa-filter" style={{ fontSize: '0.875rem' }}></i>
//               <span>Filters</span>
//             </Button>
//           )}
          
//           {!collapsible && showFilterCount && (
//             <div style={{ 
//               display: 'flex', 
//               alignItems: 'center', 
//               gap: '0.5rem',
//               color: '#667085',
//               fontSize: '0.875rem',
//               fontWeight: '500'
//             }}>
//               <i className="fa-solid fa-filter" style={{ fontSize: '0.875rem' }}></i>
//               <span>Filters</span>
//             </div>
//           )}
          
//           {activeCount > 0 && showFilterCount && (
//             <Badge 
//               bg="primary" 
//               pill
//               style={{
//                 fontSize: '0.75rem',
//                 fontWeight: '600',
//                 padding: '0.25rem 0.625rem',
//                 backgroundColor: '#0d6efd'
//               }}
//             >
//               {activeCount} active
//             </Badge>
//           )}
//         </div>

//         {activeCount > 0 && (
//           <Button
//             variant="link"
//             onClick={handleClear}
//             className="text-decoration-none"
//             style={{
//               color: '#475467',
//               fontSize: '0.875rem',
//               fontWeight: '500',
//               padding: '0.375rem 0.75rem',
//               display: 'flex',
//               alignItems: 'center',
//               gap: '0.375rem',
//               transition: 'all 0.15s'
//             }}
//           >
//             <i className="fa-solid fa-xmark"></i>
//             <span>Clear all</span>
//           </Button>
//         )}
//       </div>

//       {/* Filter Fields */}
//       {isExpanded && (
//         <div 
//           className="filter-grid"
//           style={{
//             display: 'grid',
//             gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
//             gap: '1.25rem',
//             padding: '1.5rem',
//             backgroundColor: '#F9FAFB',
//             borderRadius: '12px',
//             border: '1px solid #EAECF0'
//           }}
//         >
//           {fields.map((field, idx) => {
//             const fName = field.name || field.field;

//             // Date Range Fields
//             if (field.type === "date") {
//               return (
//                 <React.Fragment key={idx}>
//                   <div style={filterItemStyle}>
//                     <label style={labelStyle}>
//                       <i className="fa-regular fa-calendar" style={{ color: '#667085' }}></i>
//                       <span>{field.label} From</span>
//                     </label>
//                     <div style={{ position: 'relative' }}>
//                       <Form.Control
//                         type="date"
//                         className="filter-input"
//                         style={inputBaseStyle}
//                         value={localFilters[fName + "_from"] || ""}
//                         onChange={(e) => handleChange(fName + "_from", e.target.value)}
//                       />
//                     </div>
//                   </div>
//                   <div style={filterItemStyle}>
//                     <label style={labelStyle}>
//                       <i className="fa-regular fa-calendar" style={{ color: '#667085' }}></i>
//                       <span>{field.label} To</span>
//                     </label>
//                     <div style={{ position: 'relative' }}>
//                       <Form.Control
//                         type="date"
//                         className="filter-input"
//                         style={inputBaseStyle}
//                         value={localFilters[fName + "_to"] || ""}
//                         onChange={(e) => handleChange(fName + "_to", e.target.value)}
//                       />
//                     </div>
//                   </div>
//                 </React.Fragment>
//               );
//             }

//             // Select Fields
//             if (field.type === "select") {
//               return (
//                 <div key={idx} style={filterItemStyle}>
//                   <label style={labelStyle}>
//                     <i className={field.icon || "fa-solid fa-list"} style={{ color: '#667085' }}></i>
//                     <span>{field.label}</span>
//                   </label>
//                   <div style={{ position: 'relative' }}>
//                     <Form.Select
//                       className="filter-select"
//                       style={{
//                         ...inputBaseStyle,
//                         color: localFilters[fName] ? '#101828' : '#667085',
//                         cursor: 'pointer',
//                         paddingRight: '2.75rem',
//                         appearance: 'none',
//                         backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23667085' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e")`,
//                         backgroundRepeat: 'no-repeat',
//                         backgroundPosition: 'right 0.875rem center',
//                         backgroundSize: '14px 14px'
//                       }}
//                       value={localFilters[fName] || ""}
//                       onChange={(e) => handleChange(fName, e.target.value)}
//                     >
//                       <option value="">{field.placeholder || `All ${field.label}`}</option>
//                       {field.options?.map((opt, i) => (
//                         <option key={i} value={opt.value}>{opt.label}</option>
//                       ))}
//                     </Form.Select>
//                   </div>
//                 </div>
//               );
//             }

//             // Text/Search Fields
//             return (
//               <div key={idx} style={filterItemStyle}>
//                 <label style={labelStyle}>
//                   <i className={field.icon || "fa-solid fa-magnifying-glass"} style={{ color: '#667085' }}></i>
//                   <span>{field.label}</span>
//                 </label>
//                 <div style={{ position: 'relative' }}>
//                   <Form.Control
//                     type="text"
//                     className="filter-input"
//                     style={inputBaseStyle}
//                     placeholder={field.placeholder || `Search ${field.label.toLowerCase()}...`}
//                     value={localFilters[fName] || ""}
//                     onChange={(e) => handleChange(fName, e.target.value)}
//                   />
//                   {localFilters[fName] && (
//                     <button
//                       onClick={() => handleChange(fName, "")}
//                       style={{
//                         position: 'absolute',
//                         right: '0.875rem',
//                         top: '50%',
//                         transform: 'translateY(-50%)',
//                         background: 'none',
//                         border: 'none',
//                         color: '#98A2B3',
//                         cursor: 'pointer',
//                         padding: '0.25rem',
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'center',
//                         transition: 'color 0.15s'
//                       }}
//                       className="input-clear-btn"
//                     >
//                       <i className="fa-solid fa-xmark" style={{ fontSize: '0.875rem' }}></i>
//                     </button>
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}

//       <style>{`
//         .filter-input:focus,
//         .filter-select:focus {
//           outline: none;
//           border-color: #0d6efd !important;
//           box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1), 0 1px 2px 0 rgba(16, 24, 40, 0.05) !important;
//         }
        
//         .filter-input::placeholder {
//           color: #98A2B3;
//         }

//         .filter-input:hover:not(:focus),
//         .filter-select:hover:not(:focus) {
//           border-color: #98A2B3;
//         }

//         .input-clear-btn:hover {
//           color: #475467 !important;
//         }

//         .filter-select option {
//           padding: 0.5rem;
//         }

//         @media (max-width: 768px) {
//           .filter-grid {
//             grid-template-columns: 1fr !important;
//             gap: 1rem !important;
//             padding: 1rem !important;
//           }
//         }

//         /* Smooth transitions */
//         .filter-input,
//         .filter-select {
//           transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
//         }

//         /* Custom scrollbar for select dropdowns */
//         .filter-select {
//           scrollbar-width: thin;
//           scrollbar-color: #D0D5DD #F9FAFB;
//         }

//         .filter-select::-webkit-scrollbar {
//           width: 8px;
//         }

//         .filter-select::-webkit-scrollbar-track {
//           background: #F9FAFB;
//           border-radius: 4px;
//         }

//         .filter-select::-webkit-scrollbar-thumb {
//           background: #D0D5DD;
//           border-radius: 4px;
//         }

//         .filter-select::-webkit-scrollbar-thumb:hover {
//           background: #98A2B3;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default AdvancedFilter;