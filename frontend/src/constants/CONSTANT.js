// src/config/constants.js

// Get window location info
const { protocol, hostname, port, pathname } = window.location;

// Environment checks
const isLocal = hostname === "localhost";

// Sandbox check: starts with /library-sandbox (handles subpaths too)
const isSandbox = pathname.startsWith("/library-sandbox");

// API Base URLs
export const API_BASE_URL = isLocal
  ? "http://localhost:3003"                  // Local backend
  : isSandbox
    ? `${protocol}//${hostname}:4000/sandbox/ibs` // Sandbox backend
    : `${protocol}//${hostname}:3003/ibs`;        // Production backend

// Frontend URLs
export const FRONTEND_URL = isLocal
  ? `${protocol}//${hostname}:3000`                       // Local frontend
  : isSandbox
    ? `${protocol}//${hostname}/library-sandbox`         // Sandbox frontend
    : `${protocol}//${hostname}`;                        // Production frontend

// Permission constants
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

// Supported file types
export const PDF = "pdf";
export const DOC = "doc";
export const DOCX = "docx";
export const XLS = "xls";
export const XLSX = "xlsx";
export const CSV = "csv";
export const PNG = "png";
export const JPG = "jpg";
export const JPEG = "jpeg";
