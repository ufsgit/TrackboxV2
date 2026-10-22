const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authenticate = require('../middleware/authenticate');
const c = require('../controllers/help-video.controller');

const uploadDir = path.join(__dirname, '../../uploads/help-videos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `crm_help_${Date.now()}${ext}`;
    cb(null, unique);
  },
});

// Allow up to 500MB video files
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.mp4', '.webm', '.mov', '.mkv', '.avi', '.m4v'];
    if (allowed.includes(ext) || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files (.mp4, .webm, .mov, etc.) are allowed.'));
    }
  },
});

// All routes require authentication
router.use(authenticate);

// Publicly accessible to all logged in users
router.get('/', c.getHelpVideo);

// Only 'ufs' user can add, edit, or delete tutorial videos
const requireUfs = (req, res, next) => {
  const username = String(req.user?.username || '').toLowerCase().trim();
  const email = String(req.user?.email || '').toLowerCase().trim();
  if (username === 'ufs' || email === 'ufs' || email === 'ufs@trackbox.in') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied: Only the ufs video management user can manage tutorial videos.'
  });
};

router.post('/', requireUfs, (req, res, next) => {
  if (req.is('multipart/form-data')) {
    upload.single('video')(req, res, next);
  } else {
    next();
  }
}, c.saveHelpVideo);
router.put('/', requireUfs, c.updateHelpVideoDetails);
router.delete('/:id', requireUfs, c.deleteHelpVideo);
router.delete('/', requireUfs, c.deleteHelpVideo);

module.exports = router;

