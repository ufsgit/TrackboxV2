const axios = require('axios');
const pool = require('../db/pool');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
require('dotenv').config();

class WhatsappService {
  constructor() {
    this.baseUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
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

  // Get credentials for a specific business from DB, fallback to env
  async getCredentials(businessIdOrObj) {
    const { businessId, socialAccountId } = this._resolveParams(businessIdOrObj);

    if (socialAccountId) {
      const [rows] = await pool.query('SELECT token, phone_id FROM social_accounts WHERE id=?', [socialAccountId]);
      if (rows.length && rows[0].token && rows[0].phone_id) {
        return { token: rows[0].token, phoneId: rows[0].phone_id };
      }
    }

    if (businessId) {
      // Look for active whatsapp account in the new social_accounts table first
      const [newRows] = await pool.query('SELECT token, phone_id FROM social_accounts WHERE business_id=? AND platform="whatsapp" AND is_active=1 LIMIT 1', [businessId]);
      if (newRows.length && newRows[0].token && newRows[0].phone_id) {
        return { token: newRows[0].token, phoneId: newRows[0].phone_id };
      }

      // Backward compatibility fallback to business table columns
      const [rows] = await pool.query('SELECT whatsapp_token, whatsapp_phone_id FROM businesses WHERE id=?', [businessId]);
      if (rows.length && rows[0].whatsapp_token && rows[0].whatsapp_phone_id) {
        return { token: rows[0].whatsapp_token, phoneId: rows[0].whatsapp_phone_id };
      }
    }
    // Fallback to env vars
    return {
      token: process.env.WHATSAPP_TOKEN || '',
      phoneId: process.env.WHATSAPP_PHONE_ID || ''
    };
  }

  // Get WABA credentials specifically for Meta Business APIs (like fetching templates)
  async getWabaCredentials(businessIdOrObj) {
    const { businessId, socialAccountId } = this._resolveParams(businessIdOrObj);

    if (socialAccountId) {
      const [rows] = await pool.query('SELECT token, waba_id FROM social_accounts WHERE id=?', [socialAccountId]);
      if (rows.length && rows[0].token && rows[0].waba_id) {
        return { token: rows[0].token, wabaId: rows[0].waba_id };
      }
    }

    if (businessId) {
      const [newRows] = await pool.query('SELECT token, waba_id FROM social_accounts WHERE business_id=? AND platform="whatsapp" AND is_active=1 LIMIT 1', [businessId]);
      if (newRows.length && newRows[0].token && newRows[0].waba_id) {
        return { token: newRows[0].token, wabaId: newRows[0].waba_id };
      }
    }
    
    return {
      token: process.env.WHATSAPP_TOKEN || '',
      wabaId: process.env.WABA_ID || ''
    };
  }

  getHeaders(token) {
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  // Test connection by calling the Meta Graph API
  async testConnection(businessId, socialAccountId = null) {
    try {
      const { token, phoneId } = await this.getCredentials({ businessId, socialAccountId });
      if (!token || !phoneId) return { success: false, message: 'WhatsApp API credentials not configured' };

      const res = await axios.get(`${this.baseUrl}/${phoneId}`, {
        headers: this.getHeaders(token),
        params: { fields: 'verified_name,display_phone_number,quality_rating' }
      });

      return {
        success: true,
        data: {
          verified_name: res.data.verified_name,
          display_phone_number: res.data.display_phone_number,
          quality_rating: res.data.quality_rating,
          phone_number_id: phoneId
        },
        message: 'Connection successful'
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.error?.message || err.message
      };
    }
  }

  async sendTextMessage(to, text, businessId) {
    const { token, phoneId } = await this.getCredentials(businessId);
    if (!token || !phoneId) return { success: false, message: 'WhatsApp not configured' };
    try {
      const res = await axios.post(`${this.baseUrl}/${phoneId}/messages`, {
        messaging_product: 'whatsapp', to, type: 'text', text: { body: text }
      }, { headers: this.getHeaders(token) });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.error?.message || err.message };
    }
  }

  async sendTemplateMessage(to, templateName, languageCode = 'en', components = [], businessId) {
    const { token, phoneId } = await this.getCredentials(businessId);
    if (!token || !phoneId) return { success: false, message: 'WhatsApp not configured' };
    try {
      const res = await axios.post(`${this.baseUrl}/${phoneId}/messages`, {
        messaging_product: 'whatsapp', to, type: 'template',
        template: { name: templateName, language: { code: languageCode }, components }
      }, { headers: this.getHeaders(token) });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.error?.message || err.message };
    }
  }

  async sendMediaMessage(to, type, mediaUrl, caption = '', businessId) {
    const { token, phoneId } = await this.getCredentials(businessId);
    if (!token || !phoneId) return { success: false, message: 'WhatsApp not configured' };
    try {
      let mediaPayload;
      
      // If the media is local, upload it directly to Meta to avoid Ngrok access issues
      if (mediaUrl && mediaUrl.includes('/uploads/')) {
        const filename = mediaUrl.substring(mediaUrl.lastIndexOf('/uploads/') + 9);
        const localPath = path.join(__dirname, '../../uploads', filename);
        
        if (fs.existsSync(localPath)) {
          console.log('[DEBUG] Uploading local media directly to Meta:', filename);
          const form = new FormData();
          form.append('messaging_product', 'whatsapp');
          
          let mimeType = 'audio/mp4'; // default for our converted voice notes
          if (filename.endsWith('.mp4')) mimeType = 'video/mp4';
          else if (filename.endsWith('.pdf')) mimeType = 'application/pdf';
          else if (filename.endsWith('.png')) mimeType = 'image/png';
          else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) mimeType = 'image/jpeg';
          else if (filename.endsWith('.mp3')) mimeType = 'audio/mpeg';
          
          form.append('type', mimeType);
          form.append('file', fs.createReadStream(localPath), { contentType: mimeType });

          const uploadRes = await axios.post(`${this.baseUrl}/${phoneId}/media`, form, {
            headers: { ...this.getHeaders(token), ...form.getHeaders() }
          });
          
          if (uploadRes.data && uploadRes.data.id) {
            console.log('[DEBUG] Media uploaded, ID:', uploadRes.data.id);
            mediaPayload = type === 'audio' ? { id: uploadRes.data.id } : { id: uploadRes.data.id, caption };
          }
        }
      }

      // Fallback to link if upload failed or wasn't a local file
      if (!mediaPayload) {
        mediaPayload = type === 'audio' ? { link: mediaUrl } : { link: mediaUrl, caption };
      }

      const res = await axios.post(`${this.baseUrl}/${phoneId}/messages`, {
        messaging_product: 'whatsapp', to, type,
        [type]: mediaPayload
      }, { headers: this.getHeaders(token) });
      return { success: true, data: res.data };
    } catch (err) {
      console.error('[DEBUG] sendMediaMessage Error:', err.response?.data || err.message);
      return { success: false, message: err.response?.data?.error?.message || err.message };
    }
  }

  async sendInteractiveMessage(to, interactive, businessId) {
    const { token, phoneId } = await this.getCredentials(businessId);
    if (!token || !phoneId) return { success: false, message: 'WhatsApp not configured' };
    try {
      const res = await axios.post(`${this.baseUrl}/${phoneId}/messages`, {
        messaging_product: 'whatsapp', to, type: 'interactive', interactive
      }, { headers: this.getHeaders(token) });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.error?.message || err.message };
    }
  }

  async sendButtons(to, bodyText, buttons, businessId) {
    const interactive = {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.slice(0, 3).map((b, i) => ({
          type: 'reply',
          reply: { id: b.id || `btn_${i}`, title: b.title }
        }))
      }
    };
    return this.sendInteractiveMessage(to, interactive, businessId);
  }

  async sendList(to, headerText, bodyText, footerText, buttonText, sections, businessId) {
    const interactive = {
      type: 'list',
      header: headerText ? { type: 'text', text: headerText } : undefined,
      body: { text: bodyText },
      footer: footerText ? { text: footerText } : undefined,
      action: {
        button: buttonText,
        sections: sections
      }
    };
    return this.sendInteractiveMessage(to, interactive, businessId);
  }

  async submitTemplate(template, businessId) {
    const { token, phoneId } = await this.getCredentials(businessId);
    if (!token) return { success: false, message: 'WhatsApp not configured' };
    try {
      const payload = {
        name: template.name, category: template.category,
        language: template.language, components: []
      };
      if (template.header_type !== 'none') {
        payload.components.push({ type: 'HEADER', format: template.header_type.toUpperCase(), text: template.header_content });
      }
      if (template.body) payload.components.push({ type: 'BODY', text: template.body });
      if (template.footer) payload.components.push({ type: 'FOOTER', text: template.footer });
      if (template.buttons) payload.components.push({ type: 'BUTTONS', buttons: template.buttons });

      const res = await axios.post(`${this.baseUrl}/${phoneId}/message_templates`, payload, { headers: this.getHeaders(token) });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.error?.message || err.message };
    }
  }

  async syncTemplates(businessId) {
    const { token, wabaId } = await this.getWabaCredentials(businessId);
    if (!token || !wabaId) return { success: false, message: 'WhatsApp API credentials or WABA ID not configured' };
    try {
      const res = await axios.get(`${this.baseUrl}/${wabaId}/message_templates`, {
        headers: this.getHeaders(token)
      });
      return { success: true, data: res.data.data || [] };
    } catch (err) {
      return { success: false, message: err.response?.data?.error?.message || err.message };
    }
  }

  async getBusinessProfile(businessId) {
    const { token, phoneId } = await this.getCredentials(businessId);
    if (!token || !phoneId) return { success: false, message: 'WhatsApp not configured' };
    try {
      const res = await axios.get(`${this.baseUrl}/${phoneId}/whatsapp_business_profile`, {
        headers: this.getHeaders(token),
        params: { fields: 'about,address,description,email,profile_picture_url,websites,vertical' }
      });
      return { success: true, data: res.data.data?.[0] || res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.error?.message || err.message };
    }
  }

  async markAsRead(messageId, businessId) {
    const { token, phoneId } = await this.getCredentials(businessId);
    if (!token || !phoneId) return { success: false, message: 'WhatsApp not configured' };
    try {
      await axios.post(`${this.baseUrl}/${phoneId}/messages`, {
        messaging_product: 'whatsapp', status: 'read', message_id: messageId
      }, { headers: this.getHeaders(token) });
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error?.message || err.message };
    }
  }
  async downloadMedia(mediaId, businessIdOrObj) {
    const { token } = await this.getCredentials(businessIdOrObj);
    if (!token) throw new Error('WhatsApp not configured');

    const fs = require('fs');
    const path = require('path');

    try {
      // 1. Get media URL
      const res = await axios.get(`${this.baseUrl}/${mediaId}`, {
        headers: this.getHeaders(token)
      });
      
      const mediaUrl = res.data.url;
      const mimeType = res.data.mime_type || '';
      
      let ext = mimeType.split('/')[1]?.split(';')[0] || 'bin';
      if (mimeType.includes('audio/ogg')) ext = 'ogg';
      if (mimeType.includes('audio/mp4')) ext = 'm4a';

      // 2. Download binary data
      const filename = `${mediaId}.${ext}`;
      const uploadDir = path.join(__dirname, '../../uploads');
      const filepath = path.join(uploadDir, filename);
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const response = await axios({
        method: 'GET',
        url: mediaUrl,
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'stream'
      });
      
      const writer = fs.createWriteStream(filepath);
      response.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(`/uploads/${filename}`));
        writer.on('error', reject);
      });
    } catch (err) {
      console.error(`[WhatsappService] downloadMedia FAILED for mediaId=${mediaId}:`, err.response?.status, err.response?.data || err.message);
      return null;
    }
  }
}

module.exports = new WhatsappService();
