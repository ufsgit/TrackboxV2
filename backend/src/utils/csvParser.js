const { parse } = require('fast-csv');
const fs = require('fs');

const xlsx = require('xlsx');

function parseFile(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet, { raw: false, defval: '' });
      
      // Clean up headers (trim, lowercase, etc. can be done here or in controller)
      resolve(data);
    } catch (err) {
      reject(err);
    }
  });
}

function buildCSV(data, headers) {
  const lines = [headers.join(',')];
  for (const row of data) {
    lines.push(headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','));
  }
  return lines.join('\n');
}

module.exports = { parseFile, buildCSV };
