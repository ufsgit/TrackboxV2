const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class R2Service {
  constructor() {
    this.accountId = process.env.R2_ACCOUNT_ID;
    this.accessKeyId = process.env.R2_ACCESS_KEY_ID;
    this.secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucketName = process.env.R2_BUCKET_NAME || 'crm-ufstech';
    this.publicUrl = process.env.R2_PUBLIC_URL ? process.env.R2_PUBLIC_URL.replace(/\/$/, '') : null;

    if (this.isConfigured()) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });
      console.log(`☁️ Cloudflare R2 storage initialized for bucket: ${this.bucketName}`);
    } else {
      console.warn('⚠️ Cloudflare R2 credentials not fully configured in .env. Falling back to local storage.');
    }
  }

  isConfigured() {
    return Boolean(this.accountId && this.accessKeyId && this.secretAccessKey && this.bucketName);
  }

  /**
   * Upload a file buffer or stream or disk file to Cloudflare R2
   * @param {Object} options
   * @param {string} options.key - R2 object key (e.g. 'media/image.png' or 'documents/doc.pdf')
   * @param {Buffer|ReadableStream} [options.body] - File content buffer or stream
   * @param {string} [options.filePath] - Local file path if uploading from disk
   * @param {string} [options.contentType] - MIME type of the file
   * @param {Object} [options.metadata] - Optional key-value metadata
   * @returns {Promise<{ key: string, url: string, bucket: string }>}
   */
  async uploadFile({ key, body, filePath, contentType, metadata = {} }) {
    if (!this.isConfigured()) {
      throw new Error('Cloudflare R2 is not configured');
    }

    let uploadBody = body;
    if (!uploadBody && filePath) {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Local file not found: ${filePath}`);
      }
      uploadBody = fs.readFileSync(filePath);
    }

    // Clean leading slash from key
    const cleanKey = key.replace(/^\/+/, '');

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: cleanKey,
      Body: uploadBody,
      ContentType: contentType || 'application/octet-stream',
      Metadata: metadata,
    });

    await this.client.send(command);

    return {
      key: cleanKey,
      bucket: this.bucketName,
      url: this.getFileUrl(cleanKey),
    };
  }

  /**
   * Get public or proxy URL for an object key
   */
  getFileUrl(key) {
    const cleanKey = key.replace(/^\/+/, '');
    if (this.publicUrl) {
      return `${this.publicUrl}/${cleanKey}`;
    }
    // Return relative URL handled by backend proxy /uploads/
    return `/uploads/${cleanKey}`;
  }

  /**
   * Download / Stream object from Cloudflare R2
   * @param {string} key
   * @returns {Promise<{ body: ReadableStream, contentType: string, contentLength: number }>}
   */
  async getObjectStream(key) {
    if (!this.isConfigured()) {
      throw new Error('Cloudflare R2 is not configured');
    }

    const cleanKey = key.replace(/^\/+/, '');
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: cleanKey,
    });

    const response = await this.client.send(command);
    return {
      body: response.Body,
      contentType: response.ContentType || 'application/octet-stream',
      contentLength: response.ContentLength,
      lastModified: response.LastModified,
      metadata: response.Metadata,
    };
  }

  /**
   * Check if object exists in R2
   */
  async exists(key) {
    if (!this.isConfigured()) return false;
    try {
      const cleanKey = key.replace(/^\/+/, '');
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: cleanKey,
        })
      );
      return true;
    } catch (err) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw err;
    }
  }

  /**
   * Delete object from Cloudflare R2
   */
  async deleteFile(key) {
    if (!this.isConfigured()) return;
    try {
      const cleanKey = key.replace(/^\/+/, '');
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: cleanKey,
      });
      await this.client.send(command);
    } catch (err) {
      console.error(`Failed to delete ${key} from R2:`, err.message);
    }
  }
}

module.exports = new R2Service();
