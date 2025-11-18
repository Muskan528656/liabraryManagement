import { exportToExcel } from './excelExport';

/**
 * Generate and download sample Excel file for Authors
 */
export const downloadAuthorSample = async () => {
  const sampleData = [
    {
      Name: "John Doe",
      Email: "john.doe@example.com",
      Bio: "Renowned author of fiction novels"
    },
    {
      Name: "Jane Smith",
      Email: "jane.smith@example.com",
      Bio: "Award-winning children's book author"
    }
  ];

  const columns = [
    { key: 'Name', header: 'Name', width: 30 },
    { key: 'Email', header: 'Email', width: 30 },
    { key: 'Bio', header: 'Bio', width: 50 }
  ];

  await exportToExcel(sampleData, 'sample_authors', 'Sample Authors', columns);
};

/**
 * Generate and download sample Excel file for Categories
 */
export const downloadCategorySample = async () => {
  const sampleData = [
    {
      Name: "Fiction",
      Description: "Fictional stories and novels"
    },
    {
      Name: "Non-Fiction",
      Description: "Real-world facts and information"
    },
    {
      Name: "Science",
      Description: "Scientific books and research"
    }
  ];

  const columns = [
    { key: 'Name', header: 'Name', width: 30 },
    { key: 'Description', header: 'Description', width: 50 }
  ];

  await exportToExcel(sampleData, 'sample_categories', 'Sample Categories', columns);
};

/**
 * Generate and download sample Excel file for Books
 */
export const downloadBookSample = async () => {
  const sampleData = [
    {
      Title: "The Great Novel",
      Author: "John Doe",
      Category: "Fiction",
      ISBN: "978-1234567890",
      "Total Copies": 5,
      "Available Copies": 3
    },
    {
      Title: "Science Fundamentals",
      Author: "Jane Smith",
      Category: "Science",
      ISBN: "978-0987654321",
      "Total Copies": 10,
      "Available Copies": 8
    }
  ];

  const columns = [
    { key: 'Title', header: 'Title', width: 40 },
    { key: 'Author', header: 'Author', width: 25 },
    { key: 'Category', header: 'Category', width: 25 },
    { key: 'ISBN', header: 'ISBN', width: 20 },
    { key: 'Total Copies', header: 'Total Copies', width: 15 },
    { key: 'Available Copies', header: 'Available Copies', width: 18 }
  ];

  await exportToExcel(sampleData, 'sample_books', 'Sample Books', columns);
};

/**
 * Generate and download sample Excel file for Suppliers
 */
export const downloadSupplierSample = async () => {
  const sampleData = [
    {
      "Sr. No": 1,
      Name: "ABC Book Suppliers",
      Email: "contact@abcbooks.com",
      Phone: "+1234567890",
      Address: "123 Book Street, City, Country"
    },
    {
      "Sr. No": 2,
      Name: "XYZ Publishers",
      Email: "info@xyzpub.com",
      Phone: "+0987654321",
      Address: "456 Publisher Avenue, City, Country"
    }
  ];

  const columns = [
    { key: 'Sr. No', header: 'Sr. No', width: 10 },
    { key: 'Name', header: 'Name', width: 30 },
    { key: 'Email', header: 'Email', width: 30 },
    { key: 'Phone', header: 'Phone', width: 20 },
    { key: 'Address', header: 'Address', width: 40 }
  ];

  await exportToExcel(sampleData, 'sample_suppliers', 'Sample Suppliers', columns);
};

/**
 * Generate and download sample Excel file for Penalty Settings
 */
export const downloadPenaltySample = async () => {
  const sampleData = [
    {
      "Sr. No": 1,
      "Penalty Type": "late",
      "Per Day Amount": 5.00,
      "Fixed Amount": "",
      "Active": "Yes"
    },
    {
      "Sr. No": 2,
      "Penalty Type": "damage",
      "Per Day Amount": "",
      "Fixed Amount": 50.00,
      "Active": "Yes"
    }
  ];

  const columns = [
    { key: 'Sr. No', header: 'Sr. No', width: 10 },
    { key: 'Penalty Type', header: 'Penalty Type', width: 20 },
    { key: 'Per Day Amount', header: 'Per Day Amount', width: 18 },
    { key: 'Fixed Amount', header: 'Fixed Amount', width: 18 },
    { key: 'Active', header: 'Active', width: 12 }
  ];

  await exportToExcel(sampleData, 'sample_penalty_settings', 'Sample Penalty Settings', columns);
};

