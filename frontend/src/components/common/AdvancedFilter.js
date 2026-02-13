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
    fontSize: '0.825rem',
    fontWeight: '600',
    color: '#495057',
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const inputBaseStyle = {
    height: '34px',
    borderRadius: '8px',
    border: '1.5px solid #dee2e6',
    // padding: '0.625rem 1rem',
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    backgroundColor: '#fff',
    width: '100%'
  };
  //today date for search
  const today = new Date().toISOString().split("T")[0];

  return (

    <div className={`advanced-filter-wrapper px-3  ${className}`} style={{ marginTop: "-18px" }}>
      <Row className="align-items-end border p-1 rounded-4" style={{ background: "var(--primary-background-color)" }} >
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
                    max={today}  
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
                    max={today}  
                    onChange={(e) => handleChange(fName + "_to", e.target.value)}
                  />
                </Col>
              </React.Fragment>

            );
          }


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

        <Button
          variant="light"
          onClick={handleClear}
          tooltip="Clear all filters"
          className="filter-clear-btn d-flex align-items-center justify-content-center"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            border: '1.5px solid #dee2e6',
            padding: 0,
            backgroundColor: '#fff',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
        >       <i className="fa-solid fa-undo" style={{ fontSize: '13px', color: '#6c757d' }}> </i>
        </Button>

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
