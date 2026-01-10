/**
 * @fileoverview Admin Dashboard - CSV Export Utility
 */

/**
 * Export data to CSV and trigger download
 * @param {string} filename - Base filename (without extension)
 * @param {string[]} headers - Column headers
 * @param {any[][]} rows - Data rows
 */
export function exportToCSV(filename, headers, rows) {
  // Escape CSV values
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV content
  const csvRows = [
    headers.map(escape).join(','),
    ...rows.map(row => row.map(escape).join(',')),
  ];
  const csvContent = csvRows.join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${formatDateForFilename(new Date())}.csv`;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Format date for filename (YYYY-MM-DD)
 */
function formatDateForFilename(date) {
  return date.toISOString().split('T')[0];
}
