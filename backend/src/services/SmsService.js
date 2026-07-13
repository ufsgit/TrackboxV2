const axios = require('axios');
require('dotenv').config();

class SmsService {
  async send(to, message, senderId) {
    const url = process.env.SMS_GATEWAY_URL;
    const apiKey = process.env.SMS_GATEWAY_API_KEY;
    if (!url || !apiKey) return { success: false, message: 'SMS gateway not configured' };
    try {
      const res = await axios.post(url, { to, message, sender_id: senderId, api_key: apiKey });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  }
}

module.exports = new SmsService();
