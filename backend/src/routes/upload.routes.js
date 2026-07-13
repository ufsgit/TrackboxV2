const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authenticate = require('../middleware/authenticate');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `upload_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

router.post('/', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const processResponse = (filename) => {
    const host = req.get('host');
    const protocol = req.protocol;
    const url = `${protocol}://${host}/uploads/${filename}`;
    res.json({ success: true, url, message: 'File uploaded' });
  };

  const ext = path.extname(req.file.filename).toLowerCase();
  
  // Transcode .webm (which Chrome/Safari use for voice notes) to .mp3 for WhatsApp
  // WhatsApp Cloud API is much more reliable with MP3 files than browser-generated Ogg or M4A files
  if (ext === '.webm' || ext === '.ogg' || ext === '.m4a') {
    const inputPath = req.file.path;
    const outputFilename = req.file.filename.replace(ext, '.mp3');
    const outputPath = path.join(uploadDir, outputFilename);

    ffmpeg(inputPath)
      .toFormat('mp3')
      .audioCodec('libmp3lame')
      .on('end', () => {
        // Delete original file to save space
        fs.unlink(inputPath, () => {});
        processResponse(outputFilename);
      })
      .on('error', (err) => {
        console.error('FFmpeg transcoding error:', err);
        // Fallback to original file on error
        processResponse(req.file.filename);
      })
      .save(outputPath);
  } else {
    processResponse(req.file.filename);
  }
});

module.exports = router;
