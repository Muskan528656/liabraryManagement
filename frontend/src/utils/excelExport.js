import ExcelJS from 'exceljs';

 
const PURPLE_PRIMARY = '11439b'; // Main purple
const PURPLE_LIGHT = 'E9D5FF'; // Light purple matching sidebar (#e9d5ff)
const PURPLE_DARK = '8b5cf6'; // Lighter purple for borders
const WHITE = 'FFFFFF';
const LIGHT_GRAY = 'F3E8FF'; // Very light purple background matching sidebar (#f3e8ff)

/**
 * Export data to Excel with purple theme styling
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the Excel file
 * @param {string} sheetName - Name of the worksheet
 * @param {Array} columns - Array of column definitions [{key, header, width}]
 */
export const exportToExcel = async (data, filename, sheetName = 'Sheet1', columns = null) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

 
    let headers = [];
    if (columns && columns.length > 0) {
      headers = columns.map(col => ({
        key: col.key || col.field,
        header: col.header || col.label || col.key,
        width: col.width || 15
      }));
    } else if (data.length > 0) {
 
      headers = Object.keys(data[0]).map(key => ({
        key: key,
        header: key.split(/(?=[A-Z])/).join(' ').replace(/\b\w/g, l => l.toUpperCase()),
        width: 15
      }));
    }

 
    worksheet.columns = headers;

 
    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    headerRow.font = {
      bold: true,
      size: 12,
      color: { argb: '000000' } // Black text for better contrast on light purple
    };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: PURPLE_LIGHT }
    };
    headerRow.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    };
    headerRow.border = {
      top: { style: 'thin', color: { argb: PURPLE_DARK } },
      left: { style: 'thin', color: { argb: PURPLE_DARK } },
      bottom: { style: 'thin', color: { argb: PURPLE_DARK } },
      right: { style: 'thin', color: { argb: PURPLE_DARK } }
    };

 
    data.forEach((row, index) => {
      const dataRow = worksheet.addRow(row);
      dataRow.height = 20;

 
      if (index % 2 === 0) {
        dataRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: WHITE }
        };
      } else {
        dataRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: LIGHT_GRAY }
        };
      }

 
      dataRow.eachCell((cell, colNumber) => {
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'left',
          wrapText: true
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'E0E0E0' } },
          left: { style: 'thin', color: { argb: 'E0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
          right: { style: 'thin', color: { argb: 'E0E0E0' } }
        };
        cell.font = {
          size: 11,
          color: { argb: '212529' }
        };
      });
    });

 
    worksheet.views = [
      {
        state: 'frozen',
        ySplit: 1
      }
    ];

 
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: false }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(Math.max(maxLength + 2, 10), column.width || 15);
    });

 
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};

