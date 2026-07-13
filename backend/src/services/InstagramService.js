const axios = require('axios');
const pool = require('../db/pool');
require('dotenv').config();

class InstagramService {
  constructor() {
    this.baseUrl = 'https://graph.facebook.com/v18.0';
  }

  // Helper to parse business ID and social account ID
  _resolveParams(businessIdOrObj) {
    if (businessIdOrObj && typeof businessIdOrObj === 'object') {
      return {
        businessId: businessIdOrObj.businessId,
        socialAccountId: businessIdOrObj.socialAccountId
      };
    }
    return {
      businessId: businessIdOrObj,
      socialAccountId: null
    };
  }

  async getCredentials(businessIdOrObj) {
    const { businessId, socialAccountId } = this._resolveParams(businessIdOrObj);

    if (socialAccountId) {
      const [rows] = await pool.query('SELECT token, account_id, app_id AS pageId FROM social_accounts WHERE id=?', [socialAccountId]);
      if (rows.length && rows[0].token) {
        return { token: rows[0].token, accountId: rows[0].account_id, pageId: rows[0].pageId };
      }
    }

    if (businessId) {
      // Look for active instagram account in the new social_accounts table first
      const [newRows] = await pool.query('SELECT token, account_id, app_id AS pageId FROM social_accounts WHERE business_id=? AND platform="instagram" AND is_active=1 LIMIT 1', [businessId]);
      if (newRows.length && newRows[0].token) {
        return { token: newRows[0].token, accountId: newRows[0].account_id, pageId: newRows[0].pageId };
      }

      // Backward compatibility fallback to business table columns
      const [rows] = await pool.query('SELECT ig_token, ig_account_id, fb_page_id FROM businesses WHERE id=?', [businessId]);
      if (rows.length && rows[0].ig_token) {
        return { token: rows[0].ig_token, accountId: rows[0].ig_account_id, pageId: rows[0].fb_page_id };
      }
    }
    return { token: null, accountId: null, pageId: null };
  }

  getHeaders(token) {
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async sendTextMessage(recipientId, text, businessId) {
    const { token, accountId, pageId } = await this.getCredentials(businessId);
    if (!token) return { success: false, message: 'Instagram not configured (Token missing)' };
    
    // Using 'me' is the most universal way to send messages via a Page Access Token
    const idToUse = 'me';
    
    console.log(`🚀 Instagram Sending via 'me' (Linked to IG:${accountId}, Page:${pageId}), Recipient=${recipientId}`);
    
    try {
      const payload = {
        recipient: { id: recipientId },
        message: { text: text },
        messaging_type: 'RESPONSE'
      };

      const res = await axios.post(`${this.baseUrl}/${idToUse}/messages`, payload, { 
        headers: this.getHeaders(token) 
      });
      return { success: true, data: res.data };
    } catch (err) {
      const errorData = err.response?.data?.error;
      console.error('❌ Instagram Send Error:', JSON.stringify(err.response?.data || err.message, null, 2));
      
      let errorMessage = errorData?.message || errorData?.error_user_msg || err.message || 'Unknown Error';
      
      if (idToUse === 'me' && (errorMessage.includes('me') || errorMessage.includes('Object with ID') || errorMessage.includes('Unsupported post request'))) {
        errorMessage = 'Facebook Page ID is missing or incorrect in settings. Instagram Messaging requires a valid linked Facebook Page ID (not "me").';
      }
      
      return { success: false, message: errorMessage };
    }
  }

  async sendMediaMessage(recipientId, type, mediaUrl, businessId) {
    const { token, accountId, pageId } = await this.getCredentials(businessId);
    if (!token) return { success: false, message: 'Instagram not configured' };
    
    const idToUse = 'me';
    console.log(`🚀 Instagram Sending Media (${type}) via 'me' (Linked to IG:${accountId}, Page:${pageId}), Recipient=${recipientId}`);

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
      const errorData = err.response?.data?.error;
      console.error('❌ Instagram Media Send Error:', JSON.stringify(err.response?.data || err.message, null, 2));
      
      let errorMessage = errorData?.message || errorData?.error_user_msg || err.message || 'Unknown Error';
      
      if (idToUse === 'me' && (errorMessage.includes('me') || errorMessage.includes('Object with ID') || errorMessage.includes('Unsupported post request'))) {
        errorMessage = 'Facebook Page ID is missing or incorrect in settings. Instagram Messaging requires a valid linked Facebook Page ID (not "me").';
      }

      return { success: false, message: errorMessage };
    }
  }

  async getUserProfile(igSid, businessId) {
    const { token } = await this.getCredentials(businessId);
    if (!token) return { success: false, message: 'Instagram not configured' };
    try {
      const res = await axios.get(`${this.baseUrl}/${igSid}`, {
        headers: this.getHeaders(token),
        params: { fields: 'name,profile_pic' }
      });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.error?.message || err.message };
    }
  }

  async testConnection(businessId, socialAccountId = null) {
    try {
      const { token, accountId } = await this.getCredentials({ businessId, socialAccountId });
      if (!token || !accountId) return { success: false, message: 'Instagram credentials not configured' };

      const res = await axios.get(`${this.baseUrl}/${accountId}`, {
        headers: this.getHeaders(token),
        params: { fields: 'username,name,profile_picture_url' }
      });

      return {
        success: true,
        data: res.data,
        message: 'Connection successful'
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.error?.message || err.message
      };
    }
  }
}

module.exports = new InstagramService();
