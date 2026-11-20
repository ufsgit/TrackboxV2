const pool = require('../db/pool');

// BRANCHES
const getBranches = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM branches ORDER BY name ASC');
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    console.log('get branches error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const createBranch = async (req, res) => {
  try {
    const { name, code, location, phone } = req.body;
    const [result] = await pool.query(
      'INSERT INTO branches (name, code, location, phone) VALUES (?, ?, ?, ?)',
      [name, code || null, location || null, phone || null]
    );
    const [rows] = await pool.query('SELECT * FROM branches WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Branch created' });
  } catch (err) {
    console.log('create branches error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const updateBranch = async (req, res) => {
  try {
    const { name, code, location, phone } = req.body;
    await pool.query(
      'UPDATE branches SET name=?, code=?, location=?, phone=? WHERE id=?',
      [name, code || null, location || null, phone || null, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM branches WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Branch updated' });
  } catch (err) {
    console.log('update branches error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const deleteBranch = async (req, res) => {
  try {
    await pool.query('DELETE FROM branches WHERE id=?', [req.params.id]);
    res.json({ success: true, data: null, message: 'Branch deleted' });
  } catch (err) {
    console.log('delete branches error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};


// DEPARTMENTS
const getDepartments = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM departments ORDER BY name ASC');
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    console.log('get departments error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const createDepartment = async (req, res) => {
  try {
    const { branch_id, name, description } = req.body;
    const [result] = await pool.query(
      'INSERT INTO departments (branch_id, name, description) VALUES (?, ?, ?)',
      [branch_id, name, description || null]
    );
    const [rows] = await pool.query('SELECT * FROM departments WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Department created' });
  } catch (err) {
    console.log('create departments error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { branch_id, name, description } = req.body;
    await pool.query(
      'UPDATE departments SET branch_id=?, name=?, description=? WHERE id=?',
      [branch_id, name, description || null, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM departments WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Department updated' });
  } catch (err) {
    console.log('update departments error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    await pool.query('DELETE FROM departments WHERE id=?', [req.params.id]);
    res.json({ success: true, data: null, message: 'Department deleted' });
  } catch (err) {
    console.log('delete departments error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};


// STATUSES
const getStatuses = async (req, res) => {
  try {
    const { transfer } = req.query;
    if (transfer !== undefined) {
      const [results] = await pool.query('CALL sp_get_statuses_by_transfer(?)', [Number(transfer)]);
      return res.json({ success: true, data: results[0] || [], message: 'OK' });
    }
    const [rows] = await pool.query('SELECT * FROM statuses ORDER BY sequence ASC, name ASC');
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    console.log('get statuses error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const createStatus = async (req, res) => {
  try {
    const { name, color, follow_needed, sequence, transfer, department_id, type } = req.body;
    const [result] = await pool.query(
      'INSERT INTO statuses (name, color, follow_needed, sequence, transfer, department_id, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, color || '#000000', follow_needed || 'Yes', sequence || 0, transfer ? 1 : 0, department_id || null, type || null]
    );
    const [rows] = await pool.query('SELECT * FROM statuses WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Status created' });
  } catch (err) {
    console.log('create statuses error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { name, color, follow_needed, sequence, transfer, department_id, type } = req.body;

    // Fetch the old status to see if the name is changing
    const [oldStatus] = await pool.query('SELECT name FROM statuses WHERE id=?', [req.params.id]);
    
    if (oldStatus.length === 0) {
      return res.status(404).json({ success: false, message: 'Status not found' });
    }
    
    const oldName = oldStatus[0].name;

    await pool.query(
      'UPDATE statuses SET name=?, color=?, follow_needed=?, sequence=?, transfer=?, department_id=?, type=? WHERE id=?',
      [name, color || '#000000', follow_needed || 'Yes', sequence || 0, transfer ? 1 : 0, department_id || null, type || null, req.params.id]
    );

    // If the status name was changed, update all leads, contacts, and follow_ups that had the old status
    if (oldName && oldName !== name) {
      await pool.query('UPDATE leads SET status=? WHERE status=?', [name, oldName]);
      await pool.query('UPDATE contacts SET status_name=? WHERE status_name=?', [name, oldName]);
      // follow_ups table also uses status_name
      try {
         await pool.query('UPDATE follow_ups SET status_name=? WHERE status_name=?', [name, oldName]);
      } catch (e) {
         console.log('follow_ups update failed/skipped', e.message);
      }
    }

    const [rows] = await pool.query('SELECT * FROM statuses WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Status updated' });
  } catch (err) {
    console.log('update statuses error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const deleteStatus = async (req, res) => {
  try {
    await pool.query('DELETE FROM statuses WHERE id=?', [req.params.id]);
    res.json({ success: true, data: null, message: 'Status deleted' });
  } catch (err) {
    console.log('delete statuses error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// DESIGNATIONS
const getDesignations = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM designations ORDER BY name ASC');
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    console.log('get designations error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const createDesignation = async (req, res) => {
  try {
    const { name } = req.body;
    const [result] = await pool.query('INSERT INTO designations (name) VALUES (?)', [name]);
    const [rows] = await pool.query('SELECT * FROM designations WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Designation created' });
  } catch (err) {
    console.log('create designations error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const updateDesignation = async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query('UPDATE designations SET name=? WHERE id=?', [name, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM designations WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Designation updated' });
  } catch (err) {
    console.log('update designations error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const deleteDesignation = async (req, res) => {
  try {
    await pool.query('DELETE FROM designations WHERE id=?', [req.params.id]);
    res.json({ success: true, data: null, message: 'Designation deleted' });
  } catch (err) {
    console.log('delete designations error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// INTAKES
const getIntakes = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM intakes WHERE business_id=? ORDER BY name ASC', [req.user.businessId]);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const createIntake = async (req, res) => {
  try {
    const { name } = req.body;
    const [result] = await pool.query('INSERT INTO intakes (name, business_id) VALUES (?, ?)', [name, req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM intakes WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Intake created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const updateIntake = async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query('UPDATE intakes SET name=? WHERE id=? AND business_id=?', [name, req.params.id, req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM intakes WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Intake updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const deleteIntake = async (req, res) => {
  try {
    await pool.query('DELETE FROM intakes WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Intake deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// YEARS
const getYears = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM years WHERE business_id=? ORDER BY name ASC', [req.user.businessId]);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const createYear = async (req, res) => {
  try {
    const { name } = req.body;
    const [result] = await pool.query('INSERT INTO years (name, business_id) VALUES (?, ?)', [name, req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM years WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Year created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const updateYear = async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query('UPDATE years SET name=? WHERE id=? AND business_id=?', [name, req.params.id, req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM years WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Year updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const deleteYear = async (req, res) => {
  try {
    await pool.query('DELETE FROM years WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Year deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// APPLICATION STATUSES
const getAppStatuses = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM application_statuses WHERE business_id=? ORDER BY name ASC', [req.user.businessId]);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const createAppStatus = async (req, res) => {
  try {
    const { name, color } = req.body;
    const [result] = await pool.query('INSERT INTO application_statuses (name, color, business_id) VALUES (?, ?, ?)', [name, color || '#000000', req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM application_statuses WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Status created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const updateAppStatus = async (req, res) => {
  try {
    const { name, color } = req.body;
    await pool.query('UPDATE application_statuses SET name=?, color=? WHERE id=? AND business_id=?', [name, color || '#000000', req.params.id, req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM application_statuses WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const deleteAppStatus = async (req, res) => {
  try {
    await pool.query('DELETE FROM application_statuses WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Status deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// ENQUIRY FORS
const getEnquiryFors = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM enquiry_fors WHERE business_id=? ORDER BY name ASC', [req.user.businessId]);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const createEnquiryFor = async (req, res) => {
  try {
    const { name } = req.body;
    const [result] = await pool.query('INSERT INTO enquiry_fors (name, business_id) VALUES (?, ?)', [name, req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM enquiry_fors WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Enquiry for created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const updateEnquiryFor = async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query('UPDATE enquiry_fors SET name=? WHERE id=? AND business_id=?', [name, req.params.id, req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM enquiry_fors WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Enquiry for updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const deleteEnquiryFor = async (req, res) => {
  try {
    await pool.query('DELETE FROM enquiry_fors WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Enquiry for deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// DOCUMENT TYPES
const getDocumentTypes = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM document_types WHERE business_id=? ORDER BY name ASC', [req.user.businessId]);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const createDocumentType = async (req, res) => {
  try {
    const { name, description } = req.body;
    const [result] = await pool.query('INSERT INTO document_types (name, description, business_id) VALUES (?, ?, ?)', [name, description || null, req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM document_types WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Document type created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const updateDocumentType = async (req, res) => {
  try {
    const { name, description } = req.body;
    await pool.query('UPDATE document_types SET name=?, description=? WHERE id=? AND business_id=?', [name, description || null, req.params.id, req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM document_types WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Document type updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const deleteDocumentType = async (req, res) => {
  try {
    await pool.query('DELETE FROM document_types WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Document type deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// TEAMS
const getTeams = async (req, res) => {
  try {
    const [teams] = await pool.query(
      `SELECT t.*, u.name as user_name, u.email as user_email 
       FROM teams t 
       LEFT JOIN users u ON t.user_id = u.id 
       WHERE t.business_id=? 
       ORDER BY t.id ASC`, 
      [req.user.businessId]
    );
    const [members] = await pool.query(
      `SELECT tm.team_id, u.id, u.name, u.email 
       FROM team_members tm 
       JOIN users u ON tm.user_id = u.id 
       WHERE u.business_id=? AND (u.is_dev = 0 OR u.is_dev IS NULL)`, 
      [req.user.businessId]
    );
    
    const formattedTeams = teams.map(t => {
      t.name = t.user_name || `Agent ${t.user_id}`;
      t.members = members.filter(m => m.team_id === t.id);
      return t;
    });

    res.json({ success: true, data: formattedTeams, message: 'OK' });
  } catch (err) {
    console.log('get teams error: ', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const createTeam = async (req, res) => {
  try {
    const { user_id, description, member_ids } = req.body;
    const [result] = await pool.query('INSERT INTO teams (user_id, description, business_id) VALUES (?, ?, ?)', [user_id, description || null, req.user.businessId]);
    const teamId = result.insertId;

    if (member_ids && member_ids.length > 0) {
      const values = member_ids.map(id => [teamId, id]);
      await pool.query('INSERT INTO team_members (team_id, user_id) VALUES ?', [values]);
    }

    res.status(201).json({ success: true, data: { id: teamId }, message: 'Team created' });
  } catch (err) {
    console.log('create team error: ', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const updateTeam = async (req, res) => {
  try {
    const { user_id, description, member_ids } = req.body;
    await pool.query('UPDATE teams SET user_id=?, description=? WHERE id=? AND business_id=?', [user_id, description || null, req.params.id, req.user.businessId]);
    
    await pool.query('DELETE FROM team_members WHERE team_id=?', [req.params.id]);
    if (member_ids && member_ids.length > 0) {
      const values = member_ids.map(id => [req.params.id, id]);
      await pool.query('INSERT INTO team_members (team_id, user_id) VALUES ?', [values]);
    }

    res.json({ success: true, data: null, message: 'Team updated' });
  } catch (err) {
    console.log('update team error: ', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const deleteTeam = async (req, res) => {
  try {
    await pool.query('DELETE FROM teams WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Team deleted' });
  } catch (err) {
    console.log('delete team error: ', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// CHANNELS
const getChannels = async (req, res) => {
  try {
    const bizId = req.user?.businessId || 1;
    const [rows] = await pool.query('SELECT * FROM channels WHERE business_id = ? OR business_id IS NULL ORDER BY name ASC', [bizId]);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const createChannel = async (req, res) => {
  try {
    const { name } = req.body;
    const [result] = await pool.query('INSERT INTO channels (name, business_id) VALUES (?, ?)', [name, req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM channels WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Channel created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const updateChannel = async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query('UPDATE channels SET name=? WHERE id=? AND business_id=?', [name, req.params.id, req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM channels WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Channel updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const deleteChannel = async (req, res) => {
  try {
    await pool.query('DELETE FROM channels WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Channel deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// COUNTRY CODES
const getCountryCodes = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM country_codes ORDER BY sort_order ASC, country_name ASC');
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    console.error('getCountryCodes error: ', err);
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
};

// VISA TYPES
const getVisaTypes = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM visa_types WHERE business_id=? ORDER BY name ASC', [req.user.businessId]);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
};

const createVisaType = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Visa type name is required' });
    }
    const [result] = await pool.query(
      'INSERT INTO visa_types (name, description, business_id) VALUES (?, ?, ?)',
      [name.trim(), description || null, req.user.businessId]
    );
    const [rows] = await pool.query('SELECT * FROM visa_types WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Visa type created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const updateVisaType = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Visa type name is required' });
    }
    await pool.query(
      'UPDATE visa_types SET name=?, description=? WHERE id=? AND business_id=?',
      [name.trim(), description || null, req.params.id, req.user.businessId]
    );
    const [rows] = await pool.query('SELECT * FROM visa_types WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Visa type updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const deleteVisaType = async (req, res) => {
  try {
    await pool.query('DELETE FROM visa_types WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Visa type deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// VISA STATUSES
const getVisaStatuses = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM visa_statuses WHERE business_id=? ORDER BY stage_order ASC, name ASC', [req.user.businessId]);
    const parsed = rows.map(r => {
      let catIds = r.reason_category_ids;
      if (typeof catIds === 'string') {
        try { catIds = JSON.parse(catIds); } catch (e) {}
      }
      return { ...r, reason_category_ids: Array.isArray(catIds) ? catIds : [] };
    });
    res.json({ success: true, data: parsed, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
};

const createVisaStatus = async (req, res) => {
  try {
    const { name, color, stage_order, description, has_reason, reason_category_ids } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Visa status name is required' });
    }
    const catJson = Array.isArray(reason_category_ids) 
      ? JSON.stringify(reason_category_ids) 
      : (reason_category_ids ? JSON.stringify([reason_category_ids]) : null);

    const [result] = await pool.query(
      'INSERT INTO visa_statuses (name, color, stage_order, description, has_reason, reason_category_ids, business_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name.trim(), color || '#4f46e5', stage_order || 0, description || null, has_reason ? 1 : 0, catJson, req.user.businessId]
    );
    const [rows] = await pool.query('SELECT * FROM visa_statuses WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Visa status created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const updateVisaStatus = async (req, res) => {
  try {
    const { name, color, stage_order, description, has_reason, reason_category_ids } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Visa status name is required' });
    }
    const catJson = Array.isArray(reason_category_ids) 
      ? JSON.stringify(reason_category_ids) 
      : (reason_category_ids ? JSON.stringify([reason_category_ids]) : null);

    await pool.query(
      'UPDATE visa_statuses SET name=?, color=?, stage_order=?, description=?, has_reason=?, reason_category_ids=? WHERE id=? AND business_id=?',
      [name.trim(), color || '#4f46e5', stage_order || 0, description || null, has_reason ? 1 : 0, catJson, req.params.id, req.user.businessId]
    );
    const [rows] = await pool.query('SELECT * FROM visa_statuses WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Visa status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const deleteVisaStatus = async (req, res) => {
  try {
    await pool.query('DELETE FROM visa_statuses WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Visa status deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// VISA REASON CATEGORIES
const getVisaReasonCategories = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM visa_reason_categories WHERE business_id=? ORDER BY name ASC',
      [req.user.businessId]
    );
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
};

const createVisaReasonCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Reason category name is required' });
    }
    const [result] = await pool.query(
      'INSERT INTO visa_reason_categories (name, description, business_id) VALUES (?, ?, ?)',
      [name.trim(), description || null, req.user.businessId]
    );
    const [rows] = await pool.query('SELECT * FROM visa_reason_categories WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Visa reason category created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const updateVisaReasonCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Reason category name is required' });
    }
    await pool.query(
      'UPDATE visa_reason_categories SET name=?, description=? WHERE id=? AND business_id=?',
      [name.trim(), description || null, req.params.id, req.user.businessId]
    );
    const [rows] = await pool.query('SELECT * FROM visa_reason_categories WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Visa reason category updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const deleteVisaReasonCategory = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM visa_reason_categories WHERE id=? AND business_id=?',
      [req.params.id, req.user.businessId]
    );
    res.json({ success: true, data: null, message: 'Visa reason category deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// VISA CHECKLIST TEMPLATES (VISA-003)
const getVisaChecklists = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    // Check if table exists or seed defaults if empty
    await pool.query(`CREATE TABLE IF NOT EXISTS visa_checklist_templates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) DEFAULT 'Pre-Departure',
      description VARCHAR(255) NULL,
      stage_order INT DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      business_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_vct_business (business_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

    const [countRows] = await pool.query('SELECT COUNT(*) as c FROM visa_checklist_templates WHERE business_id = ?', [businessId]);
    if (countRows[0].c === 0) {
      await pool.query(`
        INSERT INTO visa_checklist_templates (title, category, description, stage_order, business_id) VALUES
        ('Pre-Departure Briefing Session', 'Orientation', 'Mandatory pre-departure briefing and destination orientation', 1, ?),
        ('Flight Ticket & Travel Booking Verification', 'Travel', 'Confirm itinerary, airline baggage limits, and transit arrangements', 2, ?),
        ('Health Insurance (OSHC) & Travel Coverage', 'Insurance', 'Ensure policy active and valid for student & dependents', 3, ?),
        ('Accommodation Arrangements & Address Confirmation', 'Housing', 'Confirm initial housing, landlord contact, and check-in dates', 4, ?),
        ('Forex, Multi-currency Card & Bank Setup', 'Finance', 'Arrange international debit cards and initial living funds', 5, ?),
        ('Airport Pickup & Transit Arrangements', 'Transit', 'Coordinate airport transfer and local transport passes', 6, ?),
        ('Final Enrolment Pack & Document Compliance', 'Compliance', 'Verify offer letter, COE, passport, and entry visa grant notice', 7, ?)
      `, [businessId, businessId, businessId, businessId, businessId, businessId, businessId]);
    }

    const [rows] = await pool.query(
      'SELECT * FROM visa_checklist_templates WHERE business_id = ? ORDER BY stage_order ASC, id ASC',
      [businessId]
    );
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    console.error('getVisaChecklists error:', err);
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
};

const createVisaChecklist = async (req, res) => {
  try {
    const { title, category, description, stage_order, is_active } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Checklist requirement title is required' });
    }
    const [result] = await pool.query(
      'INSERT INTO visa_checklist_templates (title, category, description, stage_order, is_active, business_id) VALUES (?, ?, ?, ?, ?, ?)',
      [
        title.trim(),
        category || 'Compliance',
        description || null,
        parseInt(stage_order, 10) || 0,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        req.user.businessId
      ]
    );
    const [rows] = await pool.query('SELECT * FROM visa_checklist_templates WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Checklist requirement created' });
  } catch (err) {
    console.error('createVisaChecklist error:', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const updateVisaChecklist = async (req, res) => {
  try {
    const { title, category, description, stage_order, is_active } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Checklist requirement title is required' });
    }
    await pool.query(
      'UPDATE visa_checklist_templates SET title = ?, category = ?, description = ?, stage_order = ?, is_active = ? WHERE id = ? AND business_id = ?',
      [
        title.trim(),
        category || 'Compliance',
        description || null,
        parseInt(stage_order, 10) || 0,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        req.params.id,
        req.user.businessId
      ]
    );
    const [rows] = await pool.query('SELECT * FROM visa_checklist_templates WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Checklist requirement updated' });
  } catch (err) {
    console.error('updateVisaChecklist error:', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const deleteVisaChecklist = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM visa_checklist_templates WHERE id = ? AND business_id = ?',
      [req.params.id, req.user.businessId]
    );
    res.json({ success: true, data: null, message: 'Checklist requirement deleted' });
  } catch (err) {
    console.error('deleteVisaChecklist error:', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// VISA CHECKLIST CATEGORIES (VISA-003)
const getVisaChecklistCategories = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    await pool.query(`CREATE TABLE IF NOT EXISTS visa_checklist_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description VARCHAR(255) NULL,
      business_id INT NOT NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_vcc_business (business_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

    const [countRows] = await pool.query('SELECT COUNT(*) as c FROM visa_checklist_categories WHERE business_id = ?', [businessId]);
    if (countRows[0].c === 0) {
      await pool.query(`
        INSERT INTO visa_checklist_categories (name, description, business_id) VALUES
        ('Orientation', 'Pre-departure briefings, destination guides, and university orientations', ?),
        ('Travel', 'Flight bookings, itinerary verification, airline baggage and transit compliance', ?),
        ('Insurance', 'Health insurance (OSHC) and comprehensive travel medical coverage', ?),
        ('Housing', 'Accommodation arrangements, tenancy contracts, and address verification', ?),
        ('Finance', 'Forex cards, currency exchange, international banking, and living expense funds', ?),
        ('Transit', 'Airport pickup, transit transfers, and local transport connectivity', ?),
        ('Compliance', 'Offer letter, COE, passport validation, and visa grant conditions compliance', ?),
        ('Custom', 'Custom or institution-specific pre-departure requirements', ?)
      `, [businessId, businessId, businessId, businessId, businessId, businessId, businessId, businessId]);
    }

    const [rows] = await pool.query(
      'SELECT * FROM visa_checklist_categories WHERE business_id = ? ORDER BY name ASC',
      [businessId]
    );
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    console.error('getVisaChecklistCategories error:', err);
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
};

const createVisaChecklistCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    const [result] = await pool.query(
      'INSERT INTO visa_checklist_categories (name, description, business_id) VALUES (?, ?, ?)',
      [name.trim(), description?.trim() || null, req.user.businessId]
    );
    const [rows] = await pool.query('SELECT * FROM visa_checklist_categories WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Checklist category created' });
  } catch (err) {
    console.error('createVisaChecklistCategory error:', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const updateVisaChecklistCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    await pool.query(
      'UPDATE visa_checklist_categories SET name = ?, description = ? WHERE id = ? AND business_id = ?',
      [name.trim(), description?.trim() || null, req.params.id, req.user.businessId]
    );
    const [rows] = await pool.query('SELECT * FROM visa_checklist_categories WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Checklist category updated' });
  } catch (err) {
    console.error('updateVisaChecklistCategory error:', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const deleteVisaChecklistCategory = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM visa_checklist_categories WHERE id = ? AND business_id = ?',
      [req.params.id, req.user.businessId]
    );
    res.json({ success: true, data: null, message: 'Checklist category deleted' });
  } catch (err) {
    console.error('deleteVisaChecklistCategory error:', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

module.exports = {
  getBranches, createBranch, updateBranch, deleteBranch,
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getStatuses, createStatus, updateStatus, deleteStatus,
  getDesignations, createDesignation, updateDesignation, deleteDesignation,
  getIntakes, createIntake, updateIntake, deleteIntake,
  getYears, createYear, updateYear, deleteYear,
  getAppStatuses, createAppStatus, updateAppStatus, deleteAppStatus,
  getEnquiryFors, createEnquiryFor, updateEnquiryFor, deleteEnquiryFor,
  getDocumentTypes, createDocumentType, updateDocumentType, deleteDocumentType,
  getTeams, createTeam, updateTeam, deleteTeam,
  getChannels, createChannel, updateChannel, deleteChannel,
  getCountryCodes,
  getVisaTypes, createVisaType, updateVisaType, deleteVisaType,
  getVisaStatuses, createVisaStatus, updateVisaStatus, deleteVisaStatus,
  getVisaReasonCategories, createVisaReasonCategory, updateVisaReasonCategory, deleteVisaReasonCategory,
  getVisaChecklists, createVisaChecklist, updateVisaChecklist, deleteVisaChecklist,
  getVisaChecklistCategories, createVisaChecklistCategory, updateVisaChecklistCategory, deleteVisaChecklistCategory
};
