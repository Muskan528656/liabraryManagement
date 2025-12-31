import ExcelJS from 'exceljs';

const PRIMARY_COLOR = '11439b';
const SECONDARY_COLOR = 'c9e9fc';
const PRIMARY_BG_COLOR = 'ecf2ff';
const WHITE = 'FFFFFF';
const TEXT_PRIMARY = '1a1a1a';
const TEXT_MUTED = '555555';
const BORDER_LIGHT = 'f0f0f0';

/**
 * Export data to Excel with blue theme styling matching your CSS
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the Excel file
 * @param {string} sheetName - Name of the worksheet
 * @param {Array} columns - Array of column definitions [{key, header, width}]
 */
export const exportToExcel = async (data, filename, sheetName = 'Sheet1', columns = null) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);


    worksheet.properties.defaultRowHeight = 20;

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

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    headerRow.font = {
      bold: true,
      size: 12,
      color: { argb: WHITE } // White text on dark blue
    };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: PRIMARY_COLOR } // Dark blue background
    };
    headerRow.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    };
    headerRow.border = {
      top: { style: 'thin', color: { argb: PRIMARY_COLOR } },
      left: { style: 'thin', color: { argb: PRIMARY_COLOR } },
      bottom: { style: 'thin', color: { argb: PRIMARY_COLOR } },
      right: { style: 'thin', color: { argb: PRIMARY_COLOR } }
    };

    // Add data rows with alternating colors
    data.forEach((row, index) => {
      const dataRow = worksheet.addRow(row);
      dataRow.height = 22;

      // Alternate row colors
      if (index % 2 === 0) {
        // Even rows - White background
        dataRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: WHITE }
        };
      } else {
        // Odd rows - Light blue background (matching primary-background-color)
        dataRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: PRIMARY_BG_COLOR }
        };
      }

      // Style each cell in the row
      dataRow.eachCell((cell, colNumber) => {
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'left',
          wrapText: true
        };

        // Use light blue borders (secondary color)
        cell.border = {
          top: { style: 'thin', color: { argb: SECONDARY_COLOR } },
          left: { style: 'thin', color: { argb: SECONDARY_COLOR } },
          bottom: { style: 'thin', color: { argb: SECONDARY_COLOR } },
          right: { style: 'thin', color: { argb: SECONDARY_COLOR } }
        };

        // Dark text for better readability
        cell.font = {
          size: 11,
          color: { argb: TEXT_PRIMARY }
        };
      });
    });

    // Freeze header row
    worksheet.views = [
      {
        state: 'frozen',
        ySplit: 1
      }
    ];

    // Auto-fit columns
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

    // Download the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log('Excel file exported successfully with blue theme');
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};