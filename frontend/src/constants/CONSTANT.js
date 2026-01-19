
export const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:9028"
    // : `http://192.168.6.50:9028`
    : `http://103.159.182.162:9028`


export const MODULES = {
  DASHBOARD: "Dashboard",
  BOOKS: "Books",
  BOOK_SUBMISSIONS: "Book Submissions",
  BOOK_ISSUE: "Book Issue",

  AUTHORS: "Authors",
  PUBLISHER: "Publisher",
  CATEGORIES: "Categories",

  PURCHASES: "Purchases",
  VENDORS: "Vendors",

  LIBRARY_MEMBERS: "Library Members",

  USERS: "Users",
  USER_ROLES: "User Roles",
  PERMISSION: "Permission",

  COMPANY: "Company",
  PLAN: "Plan",
  SETTINGS: "Settings",

  MY_PROFILE: "My Profile",


  CAN_VIEW: "view",
  CAN_CREATE: "create",
  CAN_EDIT: "edit",
  CAN_DELETE: "delete"
};
