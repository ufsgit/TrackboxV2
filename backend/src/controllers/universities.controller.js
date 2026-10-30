const db = require('../db/pool');

exports.getAllUniversities = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM universities ORDER BY name ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch universities' });
  }
};

exports.createUniversity = async (req, res) => {
  try {
    const { name, country, location, website, description } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'University name is required' });
    }

    const finalCountry = country && country.trim() ? country.trim() : 'New Zealand';

    const [result] = await db.query(
      'INSERT INTO universities (name, country, location, website, description) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), finalCountry, location || null, website || null, description || null]
    );

    const [newUni] = await db.query('SELECT * FROM universities WHERE id = ?', [result.insertId]);

    res.status(201).json({ success: true, message: 'University created successfully', data: newUni[0] });
  } catch (error) {
    console.error('Error creating university:', error);
    res.status(500).json({ success: false, message: 'Failed to create university' });
  }
};

exports.updateUniversity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, country, location, website, description } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'University name is required' });
    }

    const finalCountry = country && country.trim() ? country.trim() : 'New Zealand';

    const [result] = await db.query(
      'UPDATE universities SET name = ?, country = ?, location = ?, website = ?, description = ? WHERE id = ?',
      [name.trim(), finalCountry, location || null, website || null, description || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'University not found' });
    }

    res.json({ success: true, message: 'University updated successfully' });
  } catch (error) {
    console.error('Error updating university:', error);
    res.status(500).json({ success: false, message: 'Failed to update university' });
  }
};

exports.deleteUniversity = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM universities WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'University not found' });
    }
    
    res.json({ success: true, message: 'University deleted successfully' });
  } catch (error) {
    console.error('Error deleting university:', error);
    res.status(500).json({ success: false, message: 'Failed to delete university' });
  }
};

exports.createBulkUniversities = async (req, res) => {
  try {
    const { universities } = req.body;
    
    if (!universities || !Array.isArray(universities) || universities.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or empty universities array' });
    }

    const values = universities
      .filter(u => u.name && u.name.trim())
      .map(u => [
        u.name.trim(),
        u.country && u.country.trim() ? u.country.trim() : 'New Zealand',
        u.location || null,
        u.website || null,
        u.description || null
      ]);

    if (values.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid universities found' });
    }
    
    await db.query(
      'INSERT INTO universities (name, country, location, website, description) VALUES ?',
      [values]
    );

    res.status(201).json({ success: true, message: `${values.length} universities imported successfully` });
  } catch (error) {
    console.error('Error bulk importing universities:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk import universities' });
  }
};

