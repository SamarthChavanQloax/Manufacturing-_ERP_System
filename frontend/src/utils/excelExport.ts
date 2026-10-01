import * as XLSX from 'xlsx';

/**
 * Utility function to export array of objects to Excel file (.xlsx)
 */
export const exportToExcel = (
  data: Record<string, any>[],
  fileName: string,
  sheetName: string = 'Sheet1'
) => {
  if (!data || data.length === 0) {
    alert('No data available to export');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-fit column widths
  const objectKeys = Object.keys(data[0] || {});
  const colWidths = objectKeys.map((key) => {
    let maxLen = key.length;
    data.forEach((row) => {
      const val = row[key];
      if (val !== null && val !== undefined) {
        const len = String(val).length;
        if (len > maxLen) maxLen = len;
      }
    });
    return { wch: Math.min(Math.max(maxLen + 3, 10), 50) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const fullFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;

  try {
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fullFileName;
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    }, 150);
  } catch (err) {
    console.error('Error generating Excel download via Blob, falling back to XLSX.writeFile', err);
    XLSX.writeFile(workbook, fullFileName);
  }
};
