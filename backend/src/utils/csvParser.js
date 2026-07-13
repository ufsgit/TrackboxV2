const { parse } = require('fast-csv');
const fs = require('fs');

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(parse({ headers: true, trim: true }))
      .on('data', row => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', err => reject(err));
  });
}

function buildCSV(data, headers) {
  const lines = [headers.join(',')];
  for (const row of data) {
    lines.push(headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','));
  }
  return lines.join('\n');
}

module.exports = { parseCSV, buildCSV };
