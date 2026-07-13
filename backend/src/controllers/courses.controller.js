const db = require('../db/pool');

exports.getAllCourses = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM courses ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch courses' });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { name, amount, duration, description } = req.body;
    
    if (!name || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Name and amount are required' });
    }

    const [result] = await db.query(
      'INSERT INTO courses (name, amount, duration, description) VALUES (?, ?, ?, ?)',
      [name, amount, duration || null, description || null]
    );

    const [newCourse] = await db.query('SELECT * FROM courses WHERE id = ?', [result.insertId]);

    res.status(201).json({ success: true, message: 'Course created successfully', data: newCourse[0] });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ success: false, message: 'Failed to create course' });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM courses WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ success: false, message: 'Failed to delete course' });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, duration, description } = req.body;
    
    if (!name || !amount) {
      return res.status(400).json({ success: false, message: 'Name and amount are required' });
    }

    const [result] = await db.query(
      'UPDATE courses SET name = ?, amount = ?, duration = ?, description = ? WHERE id = ?',
      [name, amount, duration, description, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({ success: true, message: 'Course updated successfully' });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ success: false, message: 'Failed to update course' });
  }
};
