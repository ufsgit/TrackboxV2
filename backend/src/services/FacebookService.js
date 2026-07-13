const axios = require('axios');
const pool = require('../db/pool');
require('dotenv').config();

class FacebookService {
  constructor() {
    this.baseUrl = 'https://graph.facebook.com/v18.0';
  }

  async getCredentials(param) {
    let businessId = typeof param === 'object' ? param.businessId : param;
    let socialAccountId = typeof param === 'object' ? param.socialAccountId : null;

    if (socialAccountId) {
      const [rows] = await pool.query(
        "SELECT token, app_id FROM social_accounts WHERE id=? AND business_id=? AND platform='facebook' AND is_active=1",
        [socialAccountId, businessId]
      );
      if (rows.length && rows[0].token) {
        return { token: rows[0].token, pageId: rows[0].app_id };
      }
    } else {
      // First active facebook channel
      const [rows] = await pool.query(
        "SELECT token, app_id FROM social_accounts WHERE business_id=? AND platform='facebook' AND is_active=1 ORDER BY created_at ASC LIMIT 1",
        [businessId]
      );
      if (rows.length && rows[0].token) {
        return { token: rows[0].token, pageId: rows[0].app_id };
      }
    }

    // Legacy fallback to businesses table
    const [rows] = await pool.query('SELECT fb_token, fb_page_id FROM businesses WHERE id=?', [businessId]);
    if (rows.length && rows[0].fb_token) {
      return { token: rows[0].fb_token, pageId: rows[0].fb_page_id };
    }

    // Environment variables fallback
    return {
      token: process.env.FB_ACCESS_TOKEN || null,
      pageId: process.env.FB_PAGE_ID || null
    };
  }

  getHeaders(token) {
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async testConnection(businessId, socialAccountId = null) {
    try {
      const { token, pageId } = await this.getCredentials({ businessId, socialAccountId });
      if (!token) return { success: false, message: 'Facebook Messenger token is missing' };
      
      const idToUse = pageId || 'me';
      const res = await axios.get(`${this.baseUrl}/${idToUse}?fields=id,name`, {
        headers: this.getHeaders(token)
      });
      
      if (res.data && res.data.id) {
        return { 
          success: true, 
          message: 'Connection successful', 
          data: { name: res.data.name, id: res.data.id } 
        };
      }
      return { success: false, message: 'No page data returned from Meta' };
    } catch (err) {
      return { success: false, message: err.response?.data?.error?.message || err.message };
    }
  }

  async sendTextMessage(recipientId, text, businessId) {
    const { token, pageId } = await this.getCredentials(businessId);
    if (!token) return { success: false, message: 'Facebook Messenger not configured' };
    const idToUse = pageId || 'me';
    try {
      const res = await axios.post(`${this.baseUrl}/${idToUse}/messages`, {
        recipient: { id: recipientId },
        message: { text: text },
        messaging_type: 'RESPONSE'
      }, { headers: this.getHeaders(token) });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.error?.message || err.message };
    }
  }

  async sendMediaMessage(recipientId, type, mediaUrl, businessId) {
    const { token, pageId } = await this.getCredentials(businessId);
    if (!token) return { success: false, message: 'Facebook Messenger not configured' };
    const idToUse = pageId || 'me';
    try {
      const res = await axios.post(`${this.baseUrl}/${idToUse}/messages`, {
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: type === 'image' ? 'image' : (type === 'video' ? 'video' : 'file'),
            payload: { url: mediaUrl }
          }
        },
        messaging_type: 'RESPONSE'
      }, { headers: this.getHeaders(token) });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.error?.message || err.message };
    }
  }
}

module.exports = new FacebookService();
