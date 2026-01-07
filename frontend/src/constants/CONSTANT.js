export const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3003"
    : `${window.location.protocol}//${window.location.hostname}/ibs`;

export const FRONTEND_URL = `${window.location.protocol}//${window.location.hostname}`;
export const VIEW_LEAD = "VIEW_LEAD";
export const VIEW_PROPERTY = "VIEW_PROPERTY";
export const EDIT_LEAD = "EDIT_LEAD";
export const DELETE_LEAD = "DELETE_LEAD";
export const VIEW_PRODUCT = "VIEW_PRODUCT";
export const EDIT_PRODUCT = "EDIT_PRODUCT";
export const DELETE_PRODUCT = "DELETE_PRODUCT";
export const MODIFY_ALL = "MODIFY_ALL";
export const VIEW_ALL = "VIEW_ALL";
export const VIEW_ORDER = "VIEW_ORDER";
export const VIEW_USER = "VIEW_USER";
export const VIEW_CONTACT = "VIEW_CONTACT";
export const EDIT_CONTACT = "EDIT_CONTACT";
export const DELETE_CONTACT = "DELETE_CONTACT";
export const VIEW_ACCOUNT = "VIEW_ACCOUNT";
export const EDIT_ACCOUNT = "EDIT_ACCOUNT";
export const DELETE_ACCOUNT = "DELETE_ACCOUNT";
export const VIEW_BUSINESS = "VIEW_BUSINESS";
export const EDIT_BUSINESS = "EDIT_BUSINESS";
export const DELETE_BUSINESS = "DELETE_BUSINESS";

export const PDF = "pdf";
export const DOC = "doc";
export const DOCX = "docx";
export const XLS = "xls";
export const XLSX = "xlsx";
export const CSV = "csv";
export const PNG = "png";
export const JPG = "jpg";
export const JPEG = "jpeg";
