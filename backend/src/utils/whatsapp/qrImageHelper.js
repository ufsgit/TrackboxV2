const QRCode = require('qrcode');

/**
 * Converts a raw WhatsApp QR cryptographic string into a Base64 PNG data URL.
 */
async function generateQrDataUrl(qrString) {
  try {
    const dataUrl = await QRCode.toDataURL(qrString, {
      margin: 2,
      scale: 8,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      }
    });
    return dataUrl;
  } catch (error) {
    console.error('[WhatsApp QR] Error generating QR image data URL:', error);
    throw error;
  }
}

module.exports = {
  generateQrDataUrl
};

