/**
 * Brevo Transactional Email Service
 * Uses native fetch (Node.js 18+) to avoid OpenSSL SSL3 record MAC decryption
 * issues on Windows environments when communicating with Brevo Cloudflare endpoints.
 */
class BrevoService {
  constructor() {
    this.apiUrl = 'https://api.brevo.com/v3/smtp/email';
    this.smtpEmailsUrl = 'https://api.brevo.com/v3/smtp/emails';
  }

  getApiKey() {
    return (process.env.BREVO_API_KEY || '').trim();
  }

  getSender() {
    return {
      email: (process.env.BREVO_SENDER_EMAIL || 'worksufs@gmail.com').trim(),
      name: (process.env.BREVO_SENDER_NAME || 'Trackbox CRM').trim()
    };
  }

  /**
   * Send a single transactional email via Brevo v3 API
   * @param {Object} options
   * @param {string} options.toEmail
   * @param {string} [options.toName]
   * @param {string} options.subject
   * @param {string} options.htmlContent
   * @param {string} [options.textContent]
   * @param {Object} [options.params]
   * @returns {Promise<{ messageId: string }>}
   */
  async sendEmail({ toEmail, toName, subject, htmlContent, textContent, params }) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('BREVO_API_KEY is not configured in environment variables');
    }

    const sender = this.getSender();
    const payload = {
      sender: {
        name: sender.name,
        email: sender.email
      },
      to: [
        {
          email: toEmail.trim(),
          name: toName ? toName.trim() : undefined
        }
      ],
      subject: subject,
      htmlContent: htmlContent || (textContent ? textContent.replace(/\n/g, '<br/>') : '<p></p>')
    };

    if (params && typeof params === 'object' && Object.keys(params).length > 0) {
      payload.params = params;
    }

    if (textContent) {
      payload.textContent = textContent;
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseBody = await response.json();

      if (!response.ok) {
        console.error('[BrevoService.sendEmail] API Error Response:', response.status, responseBody);
        const errMessage = responseBody.message || JSON.stringify(responseBody) || `Brevo returned HTTP ${response.status}`;
        const err = new Error(errMessage);
        err.status = response.status;
        err.brevoData = responseBody;
        throw err;
      }

      console.log('[BrevoService.sendEmail] Brevo Response:', response.status, responseBody);

      return {
        messageId: responseBody.messageId || null
      };
    } catch (error) {
      console.error('[BrevoService.sendEmail] Request failure:', error.message);
      throw error;
    }
  }

  /**
   * Query Brevo for transactional email status events by messageId
   * GET https://api.brevo.com/v3/smtp/emails?messageId=<id>
   * @param {string} messageId
   */
  async getEmailEventsByMessageId(messageId) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('BREVO_API_KEY is not configured in environment variables');
    }

    // Clean angle brackets if present
    const cleanId = (messageId || '').replace(/[<>]/g, '').trim();
    if (!cleanId) return null;

    try {
      const url = `${this.smtpEmailsUrl}?messageId=${encodeURIComponent(cleanId)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'api-key': apiKey,
          'Accept': 'application/json'
        }
      });

      const responseBody = await response.json();
      if (!response.ok) {
        console.warn(`[BrevoService.getEmailEvents] HTTP ${response.status}:`, responseBody);
        return null;
      }

      return responseBody;
    } catch (err) {
      console.error(`[BrevoService.getEmailEvents] Failed for ${cleanId}:`, err.message);
      return null;
    }
  }
}

module.exports = new BrevoService();
