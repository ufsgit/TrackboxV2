const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db/pool');
const authenticate = require('../middleware/authenticate');

const uploadDir = path.join(__dirname, '../../uploads/media');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `shared_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

// GET /api/media-library — list all shared files for this business
router.get('/', authenticate, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const [rows] = await pool.query(
      `SELECT ml.*, u.name AS uploaded_by_name
       FROM shared_media_library ml
       LEFT JOIN users u ON u.id = ml.uploaded_by
       WHERE ml.business_id = ?
       ORDER BY ml.created_at DESC`,
      [businessId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Media library GET error:', err);
    res.status(500).json({ success: false, message: 'Failed to load media library' });
  }
});

// POST /api/media-library — upload a new shared file
router.post('/', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  try {
    const businessId = req.user.businessId;
    const userId = req.user.id;
    const customName = req.body.name || req.file.originalname;

    // Determine file type
    const mime = req.file.mimetype || '';
    let fileType = 'document';
    if (mime.startsWith('image/')) fileType = 'image';
    else if (mime.startsWith('video/')) fileType = 'video';
    else if (mime.startsWith('audio/')) fileType = 'audio';

    const relativeUrl = `/uploads/media/${req.file.filename}`;

    const [result] = await pool.query(
      `INSERT INTO shared_media_library (business_id, name, file_url, file_type, file_size, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [businessId, customName, relativeUrl, fileType, req.file.size, userId]
    );

    const [rows] = await pool.query(
      `SELECT ml.*, u.name AS uploaded_by_name
       FROM shared_media_library ml
       LEFT JOIN users u ON u.id = ml.uploaded_by
       WHERE ml.id = ?`,
      [result.insertId]
    );

    res.json({ success: true, data: rows[0], message: 'File added to shared library' });
  } catch (err) {
    console.error('Media library POST error:', err);
    res.status(500).json({ success: false, message: 'Failed to save file to library' });
  }
});

// DELETE /api/media-library/:id — remove a shared file
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { id } = req.params;

    // Get file info first (verify it belongs to this business)
    const [rows] = await pool.query(
      'SELECT * FROM shared_media_library WHERE id = ? AND business_id = ?',
      [id, businessId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const fileRecord = rows[0];

    // Delete physical file
    const filePath = path.join(__dirname, '../../', fileRecord.file_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete DB record
    await pool.query('DELETE FROM shared_media_library WHERE id = ?', [id]);

    res.json({ success: true, message: 'File removed from shared library' });
  } catch (err) {
    console.error('Media library DELETE error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete file' });
  }
});

module.exports = router;
