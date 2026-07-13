const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

async function generateQRCode(text, filename) {
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  const qrDir = path.join(uploadDir, 'qrcodes');
  if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });
  const filePath = path.join(qrDir, filename);
  await QRCode.toFile(filePath, text, { type: 'png', width: 300 });
  return `/uploads/qrcodes/${filename}`;
}

module.exports = { generateQRCode };
