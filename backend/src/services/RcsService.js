const axios = require('axios');
require('dotenv').config();

class RcsService {
  async send(to, content, senderId) {
    const url = process.env.RCS_GATEWAY_URL;
    const apiKey = process.env.RCS_GATEWAY_API_KEY;
    if (!url || !apiKey) return { success: false, message: 'RCS gateway not configured' };
    try {
      const res = await axios.post(url, { to, content, sender_id: senderId, api_key: apiKey });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  }
}

module.exports = new RcsService();
