// import React from "react";
// import { Card, Badge, InputGroup, Form, Button, Dropdown } from "react-bootstrap";

// const TableHeader = ({
//   title,
//   icon,
//   totalCount,
//   totalLabel,
//   filteredCount,
//   showFiltered = false,
//   searchPlaceholder = "Search...",
//   searchValue,
//   onSearchChange,
//   showColumnVisibility = false,
//   allColumns = [],
//   visibleColumns = {},
//   onToggleColumnVisibility,
//   actionButtons = [],
//   showSearch = true,
// }) => {
//   return (
//     <div className="d-flex justify-content-between align-items-center mb-4 p-2"
//       style={{
//         color: "var(--primary-color)",
//         background: "var(--primary-background-color)",
//         borderRadius: "10px",
//       }}>
//       <div className="d-flex align-items-center gap-3">
//         <h5 className="fw-bold mb-1" style={{ color: "var(--primary-color)" }}>
//           {icon && <i className={`${icon} me-2 fs-6`}></i>}
//           {title}
//         </h5>
//         {totalCount !== undefined && (
//           <Badge bg="light" text="dark" >
//             <span className="detail-h3">Total: {totalCount} {totalLabel || (totalCount === 1 ? "Item" : "Items")}</span>
//           </Badge>
//         )}
//         {showFiltered && filteredCount !== undefined && (
//           <Badge bg="info">
//             <i className="fa-solid fa-filter me-1"></i>
//             <span className="detail-h3">Filtered: {filteredCount}</span>
//           </Badge>
//         )}
//       </div>
//       <div className="d-flex gap-2 flex-wrap detail-h3">
//         {showSearch && (
//           <InputGroup size="sm" style={{ width: "250px", maxWidth: "100%" }}>
//             <InputGroup.Text >
//               <i className="fa-solid fa-search" style={{ color: "var(--primary-color)" }}></i>
//             </InputGroup.Text>
//             <Form.Control
//               placeholder={searchPlaceholder}
//               value={searchValue || ""}
//               onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
//             />
//           </InputGroup>
//         )}
//         {showColumnVisibility && allColumns.length > 0 && (
//           <Dropdown>
//             <Dropdown.Toggle
//               variant="outline-secondary"
//               size="sm"
//               className="custom-btn-table-header"
//             >
//               <i className="fs-7 fa-solid fa-gear"></i>
//             </Dropdown.Toggle>
//             <Dropdown.Menu align="end" style={{ minWidth: "200px", maxHeight: "400px", overflowY: "auto" }}>
//               <Dropdown.Header className="detail-h3 fw-bold">Show/Hide Columns</Dropdown.Header>
//               <Dropdown.Divider />
//               {allColumns.map((col) => (
//                 <Dropdown.Item
//                   key={col.field}
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     onToggleColumnVisibility && onToggleColumnVisibility(col.field);
//                   }}
//                 >
//                   <div className="d-flex align-items-center detail-h3">
//                     <input
//                       type="checkbox"
//                       checked={visibleColumns[col.field] !== false}
//                       onChange={() => onToggleColumnVisibility && onToggleColumnVisibility(col.field)}
//                       onClick={(e) => e.stopPropagation()}
//                       style={{ marginRight: "8px", cursor: "pointer", color: "var(--primary-color)" }}
//                     />
//                     <span>{col.label}</span>
//                   </div>
//                 </Dropdown.Item>
//               ))}
//             </Dropdown.Menu>
//           </Dropdown>
//         )}
//         {actionButtons.map((button, index) => (
//           <button
//             key={index}

//             onClick={button.onClick}

//             className="custom-btn-table-header"
//             disabled={button.disabled}
//           >
//             {button.icon && <i className={`${button.icon} ${button.label ? "me-1" : ""}`}></i>}
//             {button.label}
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default TableHeader;




import React from "react";
import { Badge, InputGroup, Form, Button, Dropdown } from "react-bootstrap";

const TableHeader = ({
  title,
  icon,
  totalCount,
  totalLabel,
  filteredCount,
  showFiltered = false,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  showColumnVisibility = false,
  allColumns = [],
  visibleColumns = {},
  onToggleColumnVisibility,
  actionButtons = [],
  headerActions = [],   // 👈 NEW
  showSearch = true,
}) => {
  return (
    <div
      className="d-flex justify-content-between align-items-center mb-4 p-2"
      style={{
        color: "var(--primary-color)",
        background: "var(--primary-background-color)",
        borderRadius: "10px",
      }}
    >
      {/* 🔹 LEFT SIDE (Title + Count) */}
      <div className="d-flex align-items-center gap-3">
        <h5 className="fw-bold mb-1" style={{ color: "var(--primary-color)" }}>
          {icon && <i className={`${icon} me-2 fs-6`}></i>}
          {title}
        </h5>

        {totalCount !== undefined && (
          <Badge bg="light" text="dark">
            <span className="detail-h3">
              Total: {totalCount}{" "}
              {totalLabel || (totalCount === 1 ? "Item" : "Items")}
            </span>
          </Badge>
        )}

        {showFiltered && filteredCount !== undefined && (
          <Badge bg="info">
            <i className="fa-solid fa-filter me-1"></i>
            <span className="detail-h3">Filtered: {filteredCount}</span>
          </Badge>
        )}
      </div>

      {/* 🔹 RIGHT SIDE (Search + Buttons) */}
      <div className="d-flex gap-2 flex-wrap align-items-center detail-h3">

        {/* 🔍 SEARCH */}
        {showSearch && (
          <InputGroup size="sm" style={{ width: "250px", maxWidth: "100%" }}>
            <InputGroup.Text>
              <i
                className="fa-solid fa-search"
                style={{ color: "var(--primary-color)" }}
              ></i>
            </InputGroup.Text>
            <Form.Control
              placeholder={searchPlaceholder}
              value={searchValue || ""}
              onChange={(e) =>
                onSearchChange && onSearchChange(e.target.value)
              }
            />
          </InputGroup>
        )}

        {/* ⚙️ COLUMN VISIBILITY */}
        {showColumnVisibility && allColumns.length > 0 && (
          <Dropdown>
            <Dropdown.Toggle
              variant="outline-secondary"
              size="sm"
              className="custom-btn-table-header"
            >
              <i className="fs-7 fa-solid fa-gear"></i>
            </Dropdown.Toggle>

            <Dropdown.Menu
              align="end"
              style={{ minWidth: "200px", maxHeight: "400px", overflowY: "auto" }}
            >
              <Dropdown.Header className="detail-h3 fw-bold">
                Show / Hide Columns
              </Dropdown.Header>
              <Dropdown.Divider />

              {allColumns.map((col) => (
                <Dropdown.Item
                  key={col.field}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleColumnVisibility &&
                      onToggleColumnVisibility(col.field);
                  }}
                >
                  <div className="d-flex align-items-center detail-h3">
                    <input
                      type="checkbox"
                      checked={visibleColumns[col.field] !== false}
                      onChange={() =>
                        onToggleColumnVisibility &&
                        onToggleColumnVisibility(col.field)
                      }
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        marginRight: "8px",
                        cursor: "pointer",
                      }}
                    />
                    <span>{col.label}</span>
                  </div>
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        )}

        {/* 🔹 HEADER ACTIONS (SEPARATE – Import Member etc.) */} 
        {headerActions.length > 0 &&
          headerActions
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((action) => (
              <Button
                style={{
              color: "var(--primary-color)",
              background: "var(--primary-background-color)",
              borderRadius: "10px",
              border:'var(--primary-color) solid 1px'
              }}
              className="fw-bold py-2"
              key={action.key}
                size="sm"
                variant={""}
                onClick={action.onClick}
              >
                {action.icon && (
                  <i className={`${action.icon} me-1`}></i>
                )}
                {action.label}
              </Button>
            ))}

        {/* 🔹 DEFAULT ACTION BUTTONS (Export / Add / Bulk) */}
        {actionButtons.map((button, index) => (
          <button
            key={index}
            onClick={button.onClick}
            className="custom-btn-table-header"
            disabled={button.disabled}
          >
            {button.icon && (
              <i
                className={`${button.icon} ${
                  button.label ? "me-1" : ""
                }`}
              ></i>
            )}
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TableHeader;
