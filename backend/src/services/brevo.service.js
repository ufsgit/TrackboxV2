/**
 * Brevo Transactional Email Service
 * Uses native fetch (Node.js 18+) to avoid OpenSSL SSL3 record MAC decryption
 * issues on Windows environments when communicating with Brevo Cloudflare endpoints.
 */
class BrevoService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY || '';
    this.senderEmail = process.env.BREVO_SENDER_EMAIL || 'worksufs@gmail.com';
    this.senderName = process.env.BREVO_SENDER_NAME || 'Brifni';
    this.apiUrl = 'https://api.brevo.com/v3/smtp/email';
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
    if (!this.apiKey) {
      this.apiKey = process.env.BREVO_API_KEY || '';
    }
    if (!this.apiKey) {
      throw new Error('BREVO_API_KEY is not configured in environment variables');
    }

    const payload = {
      sender: {
        name: this.senderName,
        email: this.senderEmail
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
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseBody = await response.json();

      if (!response.ok) {
        console.error('[BrevoService.sendEmail] API Error Response:', response.status, responseBody);
        const err = new Error(responseBody.message || `Brevo returned HTTP ${response.status}`);
        err.status = response.status;
        err.brevoData = responseBody;
        throw err;
      }

      console.log('[BrevoService.sendEmail] Email dispatched successfully:', responseBody.messageId);

      return {
        messageId: responseBody.messageId || null
      };
    } catch (error) {
      console.error('[BrevoService.sendEmail] Request failure:', error.message);
      throw error;
    }
  }
}

module.exports = new BrevoService();
