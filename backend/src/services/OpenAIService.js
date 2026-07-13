const { OpenAI } = require('openai');
const pool = require('../db/pool');

class OpenAIService {
  async getClient(businessId) {
    const [rows] = await pool.query(
      `SELECT config FROM integrations WHERE business_id = ? AND type = 'openai' AND is_active = 1 LIMIT 1`,
      [businessId]
    );
    const apiKey = rows.length > 0 ? rows[0].config?.api_key : process.env.OPENAI_API_KEY;
    if (!apiKey) return null;
    return new OpenAI({ apiKey });
  }

  async chat(businessId, messages, systemPrompt = '', model = 'gpt-4o-mini') {
    const client = await this.getClient(businessId);
    if (!client) return { success: false, message: 'OpenAI not configured' };
    try {
      const msgs = [];
      if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt });
      msgs.push(...messages);
      const response = await client.chat.completions.create({ model, messages: msgs });
      return { success: true, data: response.choices[0].message.content };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  async testConnection(apiKey) {
    try {
      const client = new OpenAI({ apiKey });
      await client.models.list();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }
}

module.exports = new OpenAIService();
