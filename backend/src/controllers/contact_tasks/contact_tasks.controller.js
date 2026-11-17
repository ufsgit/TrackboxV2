const pool = require('../../db/pool');

/**
 * GET /api/contact-tasks/team
 * Fetches the team members under the logged-in user using stored procedure `get_contact_task_team_assignees`
 */
const getTaskTeamAssignees = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated', data: [] });
    }

    const [results] = await pool.query('CALL get_contact_task_team_assignees(?)', [userId]);
    const teamMembers = results[0] || [];

    res.json({
      success: true,
      message: 'OK',
      data: teamMembers
    });
  } catch (err) {
    console.error('Error fetching team assignees:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
      data: []
    });
  }
};

/**
 * GET /api/contact-tasks/contact/:contactId
 * Query params: search, start_date, end_date, page, limit
 * Fetches paginated tasks for a contact using stored procedure `get_contact_tasks_by_contact`
 */
const getTasksByContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const { search, start_date, end_date } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));

    const [results] = await pool.query(
      'CALL get_contact_tasks_by_contact(?, ?, ?, ?, ?, ?)',
      [
        contactId,
        search ? search.trim() : null,
        start_date || null,
        end_date || null,
        page,
        limit
      ]
    );

    // Stored procedure returns 2 result sets:
    // results[0] -> [{ total: 25 }]
    // results[1] -> rows of tasks
    const total = results[0] && results[0][0] ? Number(results[0][0].total) : 0;
    const rows = results[1] || [];
    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      success: true,
      message: 'OK',
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error('Error fetching contact tasks:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
      data: null
    });
  }
};

/**
 * POST /api/contact-tasks
 * Creates a new task for a contact using stored procedure `create_contact_task`
 */
const createTask = async (req, res) => {
  try {
    const {
      contact_id,
      contact_name,
      contact_phone,
      branch_id,
      branch_name,
      dept_id,
      dept_name,
      title,
      description,
      assigned_to,
      assigned_to_name,
      is_task_date,
      task_date
    } = req.body;

    if (!contact_id || !contact_name || !title || !assigned_to || !assigned_to_name) {
      return res.status(400).json({
        success: false,
        message: 'contact_id, contact_name, title, assigned_to, and assigned_to_name are required'
      });
    }

    // Extracted securely from the JWT token
    const created_by = req.user?.userId || req.user?.id || req.body.created_by || null;
    const created_by_name = req.user?.name || req.body.created_by_name || 'System';

    const [results] = await pool.query(
      'CALL create_contact_task(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        contact_id,
        contact_name,
        contact_phone || null,
        branch_id || null,
        branch_name || null,
        dept_id || null,
        dept_name || null,
        title,
        description || null,
        assigned_to,
        assigned_to_name,
        created_by,
        created_by_name,
        is_task_date ? 1 : 0,
        is_task_date && task_date ? task_date : null
      ]
    );

    const createdTask = results[0] && results[0][0] ? results[0][0] : null;

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: createdTask
    });
  } catch (err) {
    console.error('Error creating contact task:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
      data: null
    });
  }
};

/**
 * PATCH /api/contact-tasks/:id/status
 * Updates a task status (0 = Pending, 1 = Completed) using stored procedure `update_contact_task_status`
 */
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status === undefined || status === null) {
      return res.status(400).json({
        success: false,
        message: 'Status (0 or 1) is required',
        data: null
      });
    }

    const newStatus = Number(status) === 1 ? 1 : 0;

    const [results] = await pool.query('CALL update_contact_task_status(?, ?)', [
      id,
      newStatus
    ]);

    const updatedTask = results[0] && results[0][0] ? results[0][0] : null;

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
        data: null
      });
    }

    res.json({
      success: true,
      message: 'Task status updated successfully',
      data: updatedTask
    });
  } catch (err) {
    console.error('Error updating task status:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
      data: null
    });
  }
};

/**
 * GET /api/contact-tasks
 * Query params: assigned_to, search, start_date, end_date, status, page, limit
 * Fetches paginated global tasks list using stored procedure `get_tasks_list`
 */
const getTasksList = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated', data: [] });
    }

    const {
      assigned_to,
      search,
      start_date,
      end_date,
      status
    } = req.query;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));

    const assignedToId = assigned_to && !isNaN(parseInt(assigned_to, 10)) ? parseInt(assigned_to, 10) : null;
    const taskStatus = status !== undefined && status !== null && status !== '' ? parseInt(status, 10) : null;

    const [results] = await pool.query(
      'CALL get_tasks_list(?, ?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        assignedToId,
        search ? search.trim() : null,
        start_date || null,
        end_date || null,
        taskStatus,
        page,
        limit
      ]
    );

    // Stored procedure returns 2 result sets:
    // results[0] -> [{ total: ... }]
    // results[1] -> rows of tasks
    const total = results[0] && results[0][0] ? Number(results[0][0].total) : 0;
    const rows = results[1] || [];
    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      success: true,
      message: 'OK',
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error('Error fetching tasks list:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
      data: null
    });
  }
};

/**
 * GET /api/contact-tasks/kpi
 * Fetches KPI summary (total, pending, completed, due_today, overdue) using stored procedure `get_contact_tasks_kpi`
 */
const getTasksKpi = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated', data: null });
    }

    const [results] = await pool.query('CALL get_contact_tasks_kpi(?)', [userId]);
    const kpi = results[0] && results[0][0] ? results[0][0] : {
      total: 0,
      pending: 0,
      completed: 0,
      due_today: 0,
      overdue: 0
    };

    res.json({
      success: true,
      message: 'OK',
      data: {
        total: Number(kpi.total || 0),
        pending: Number(kpi.pending || 0),
        completed: Number(kpi.completed || 0),
        due_today: Number(kpi.due_today || 0),
        overdue: Number(kpi.overdue || 0)
      }
    });
  } catch (err) {
    console.error('Error fetching tasks KPI:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
      data: null
    });
  }
};

module.exports = {
  getTaskTeamAssignees,
  getTasksByContact,
  createTask,
  updateTaskStatus,
  getTasksList,
  getTasksKpi
};
