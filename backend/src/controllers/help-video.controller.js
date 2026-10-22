const pool = require('../db/pool');
const path = require('path');
const fs = require('fs');
const r2Service = require('../services/r2.service');

// Format file size nicely
const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' KB';
  }
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// GET /api/help-video — Get current help/tutorial video & all videos list
const getHelpVideo = async (req, res) => {
  try {
    const businessId = req.user?.businessId || req.user?.business_id || 1;
    const [rows] = await pool.query(
      `SELECT hv.*, u.name AS uploaded_by_name
       FROM crm_help_videos hv
       LEFT JOIN users u ON hv.uploaded_by = u.id
       WHERE hv.business_id = ?
       ORDER BY hv.updated_at DESC`,
      [businessId]
    );

    if (rows.length === 0) {
      return res.json({ success: true, data: null, videos: [] });
    }

    res.json({ success: true, data: rows[0], videos: rows });
  } catch (err) {
    console.error('Error fetching help video:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch help video' });
  }
};

// POST /api/help-video — Upload or update help video with YouTube URL or file
const saveHelpVideo = async (req, res) => {
  try {
    const businessId = req.user?.businessId || req.user?.business_id || 1;
    const userId = req.user?.userId || req.user?.id || null;
    const { title, description, id, is_new, video_url } = req.body || {};

    let targetVideo = null;
    if (id) {
      const [found] = await pool.query(
        'SELECT * FROM crm_help_videos WHERE id = ? AND business_id = ?',
        [id, businessId]
      );
      if (found.length > 0) targetVideo = found[0];
    }

    let videoUrl = (video_url && video_url.trim()) ? video_url.trim() : (targetVideo ? targetVideo.video_url : null);
    let fileName = targetVideo ? targetVideo.file_name : 'YouTube Video';
    let fileSize = targetVideo ? targetVideo.file_size : 'YouTube';

    if (video_url && video_url.trim()) {
      videoUrl = video_url.trim();
      const isYt = videoUrl.includes('youtube') || videoUrl.includes('youtu.be');
      fileName = isYt ? 'YouTube Video' : (targetVideo?.file_name || 'Web Video');
      fileSize = isYt ? 'YouTube HD' : (targetVideo?.file_size || 'Online');
    }

    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      let mimeType = req.file.mimetype || 'video/mp4';
      if (ext === '.mp4') mimeType = 'video/mp4';
      else if (ext === '.webm') mimeType = 'video/webm';
      else if (ext === '.mov') mimeType = 'video/quicktime';

      const r2Key = `help-videos/${req.file.filename}`;

      // Upload new video to Cloudflare R2
      if (r2Service.isConfigured()) {
        try {
          await r2Service.uploadFile({
            key: r2Key,
            filePath: req.file.path,
            contentType: mimeType,
            metadata: {
              businessId: String(businessId),
              originalName: encodeURIComponent(req.file.originalname),
            },
          });

          if (r2Service.publicUrl) {
            videoUrl = `${r2Service.publicUrl}/${r2Key}`;
          } else {
            videoUrl = `/uploads/${r2Key}`;
          }
        } catch (r2Err) {
          console.error('Error uploading video to Cloudflare R2:', r2Err);
          videoUrl = `/uploads/${r2Key}`;
        }
      } else {
        videoUrl = `/uploads/help-videos/${req.file.filename}`;
      }

      fileName = req.file.originalname;
      fileSize = formatFileSize(req.file.size);

      // Delete old video from R2 if replacing existing video
      if (targetVideo && targetVideo.video_url && !targetVideo.video_url.includes('youtu')) {
        try {
          const oldUrl = targetVideo.video_url;
          let oldKey = null;
          if (oldUrl.startsWith('http')) {
            const u = new URL(oldUrl);
            oldKey = u.pathname.replace(/^\/+/, '');
          } else {
            oldKey = oldUrl.replace(/^\/uploads\//, '');
          }
          if (oldKey && r2Service.isConfigured()) {
            await r2Service.deleteFile(oldKey);
          }
        } catch (delErr) {
          console.warn('Could not delete old help video from R2:', delErr.message);
        }
      }
    }

    if (!videoUrl) {
      return res.status(400).json({ success: false, message: 'Please enter a valid YouTube video URL or link.' });
    }

    const videoTitle = title && title.trim() ? title.trim() : 'CRM Workflow & Tutorial Guide';
    const videoDesc = description !== undefined ? description.trim() : '';

    let recordId;
    if (targetVideo) {
      recordId = targetVideo.id;
      await pool.query(
        `UPDATE crm_help_videos 
         SET title = ?, description = ?, video_url = ?, file_name = ?, file_size = ?, uploaded_by = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [videoTitle, videoDesc, videoUrl, fileName, fileSize, userId, recordId]
      );
    } else {
      const [insertRes] = await pool.query(
        `INSERT INTO crm_help_videos (business_id, title, description, video_url, file_name, file_size, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [businessId, videoTitle, videoDesc, videoUrl, fileName, fileSize, userId]
      );
      recordId = insertRes.insertId;
    }

    const [rows] = await pool.query(
      `SELECT hv.*, u.name AS uploaded_by_name
       FROM crm_help_videos hv
       LEFT JOIN users u ON hv.uploaded_by = u.id
       WHERE hv.id = ?`,
      [recordId]
    );

    res.json({
      success: true,
      data: rows[0],
      message: 'Help tutorial video saved successfully!',
    });
  } catch (err) {
    console.error('Error saving help video:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to save help video' });
  }
};

// PUT /api/help-video — Update title, description, and YouTube video_url
const updateHelpVideoDetails = async (req, res) => {
  try {
    const businessId = req.user?.businessId || req.user?.business_id || 1;
    const { id, title, description, video_url } = req.body || {};

    let target;
    if (id) {
      const [found] = await pool.query(
        'SELECT * FROM crm_help_videos WHERE id = ? AND business_id = ?',
        [id, businessId]
      );
      if (found.length > 0) target = found[0];
    } else {
      const [existing] = await pool.query(
        'SELECT * FROM crm_help_videos WHERE business_id = ? ORDER BY updated_at DESC LIMIT 1',
        [businessId]
      );
      if (existing.length > 0) target = existing[0];
    }

    if (!target) {
      return res.status(404).json({ success: false, message: 'No help video found to update.' });
    }

    const videoTitle = title && title.trim() ? title.trim() : target.title;
    const videoDesc = description !== undefined ? description.trim() : target.description;
    const newVideoUrl = (video_url && video_url.trim()) ? video_url.trim() : target.video_url;
    const isYt = newVideoUrl.includes('youtube') || newVideoUrl.includes('youtu.be');
    const newFileName = isYt ? 'YouTube Video' : (target.file_name || 'Web Video');
    const newFileSize = isYt ? 'YouTube HD' : (target.file_size || 'Online');

    await pool.query(
      'UPDATE crm_help_videos SET title = ?, description = ?, video_url = ?, file_name = ?, file_size = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [videoTitle, videoDesc, newVideoUrl, newFileName, newFileSize, target.id]
    );

    const [rows] = await pool.query(
      `SELECT hv.*, u.name AS uploaded_by_name
       FROM crm_help_videos hv
       LEFT JOIN users u ON hv.uploaded_by = u.id
       WHERE hv.id = ?`,
      [target.id]
    );

    res.json({ success: true, data: rows[0], message: 'Video details updated successfully' });
  } catch (err) {
    console.error('Error updating help video details:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to update video details' });
  }
};

// DELETE /api/help-video or /api/help-video/:id — Remove help video
const deleteHelpVideo = async (req, res) => {
  try {
    const businessId = req.user?.businessId || req.user?.business_id || 1;
    const videoId = req.params?.id || req.query?.id;

    let target;
    if (videoId) {
      const [found] = await pool.query(
        'SELECT * FROM crm_help_videos WHERE id = ? AND business_id = ?',
        [videoId, businessId]
      );
      if (found.length > 0) target = found[0];
    } else {
      const [existing] = await pool.query(
        'SELECT * FROM crm_help_videos WHERE business_id = ? ORDER BY updated_at DESC LIMIT 1',
        [businessId]
      );
      if (existing.length > 0) target = existing[0];
    }

    if (!target) {
      return res.status(404).json({ success: false, message: 'No help video found' });
    }

    const videoRecord = target;

    // Remove from Cloudflare R2
    if (r2Service.isConfigured() && videoRecord.video_url) {
      try {
        let r2Key;
        if (videoRecord.video_url.startsWith('http')) {
          const u = new URL(videoRecord.video_url);
          r2Key = u.pathname.replace(/^\/+/, '');
        } else {
          r2Key = videoRecord.video_url.replace(/^\/uploads\//, '');
        }
        await r2Service.deleteFile(r2Key);
      } catch (e) {
        console.warn('Error deleting video from R2:', e.message);
      }
    }

    // Delete local physical file if it exists
    if (videoRecord.video_url && videoRecord.video_url.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, '../../', videoRecord.video_url);
      if (fs.existsSync(localPath)) {
        try { fs.unlinkSync(localPath); } catch (e) {}
      }
    }

    await pool.query('DELETE FROM crm_help_videos WHERE id = ?', [videoRecord.id]);

    res.json({ success: true, message: 'Help video removed successfully' });
  } catch (err) {
    console.error('Error deleting help video:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to delete help video' });
  }
};

module.exports = {
  getHelpVideo,
  saveHelpVideo,
  updateHelpVideoDetails,
  deleteHelpVideo,
};
