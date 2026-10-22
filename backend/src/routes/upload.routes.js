const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authenticate = require('../middleware/authenticate');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const r2Service = require('../services/r2.service');

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

router.post('/', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const processResponse = async (filename, finalPath) => {
    try {
      let finalUrl;
      if (r2Service.isConfigured()) {
        const ext = path.extname(filename).toLowerCase();
        let mimeType = req.file.mimetype || 'application/octet-stream';
        if (ext === '.mp3') mimeType = 'audio/mp3';
        else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
        else if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.mp4') mimeType = 'video/mp4';
        else if (ext === '.pdf') mimeType = 'application/pdf';

        const r2Result = await r2Service.uploadFile({
          key: filename,
          filePath: finalPath,
          contentType: mimeType
        });

        if (r2Service.publicUrl) {
          finalUrl = r2Result.url;
        } else {
          const host = req.get('host');
          const protocol = req.protocol;
          finalUrl = `${protocol}://${host}/uploads/${filename}`;
        }
      } else {
        const host = req.get('host');
        const protocol = req.protocol;
        finalUrl = `${protocol}://${host}/uploads/${filename}`;
      }

      res.json({ success: true, url: finalUrl, message: 'File uploaded' });
    } catch (err) {
      console.error('Error uploading to Cloudflare R2:', err);
      const host = req.get('host');
      const protocol = req.protocol;
      res.json({ success: true, url: `${protocol}://${host}/uploads/${filename}`, message: 'File uploaded (local fallback)' });
    }
  };

  const ext = path.extname(req.file.filename).toLowerCase();
  
  // Transcode .webm (which Chrome/Safari use for voice notes) to .mp3 for WhatsApp
  if (ext === '.webm' || ext === '.ogg' || ext === '.m4a') {
    const inputPath = req.file.path;
    const outputFilename = req.file.filename.replace(ext, '.mp3');
    const outputPath = path.join(uploadDir, outputFilename);

    ffmpeg(inputPath)
      .toFormat('mp3')
      .audioCodec('libmp3lame')
      .on('end', async () => {
        fs.unlink(inputPath, () => {});
        await processResponse(outputFilename, outputPath);
      })
      .on('error', async (err) => {
        console.error('FFmpeg transcoding error:', err);
        await processResponse(req.file.filename, req.file.path);
      })
      .save(outputPath);
  } else {
    await processResponse(req.file.filename, req.file.path);
  }
});

module.exports = router;
