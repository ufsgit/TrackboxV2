const pool = require('../db/pool');
const { getAccessibleUserIds } = require('../services/teamHierarchy.service');

// Standard Pre-Departure Checklist Items (VISA-003)
const DEFAULT_PRE_DEPARTURE_ITEMS = [
  { id: 'pda_1', title: 'Pre-Departure Briefing Session', done: false, completed_at: null, notes: '' },
  { id: 'pda_2', title: 'Flight Ticket & Travel Booking Verification', done: false, completed_at: null, notes: '' },
  { id: 'pda_3', title: 'Health Insurance (OSHC) & Travel Coverage', done: false, completed_at: null, notes: '' },
  { id: 'pda_4', title: 'Accommodation Arrangements & Address Confirmation', done: false, completed_at: null, notes: '' },
  { id: 'pda_5', title: 'Forex, Multi-currency Card & Bank Setup', done: false, completed_at: null, notes: '' },
  { id: 'pda_6', title: 'Airport Pickup & Transit Arrangements', done: false, completed_at: null, notes: '' },
  { id: 'pda_7', title: 'Final Enrolment Pack & Document Compliance', done: false, completed_at: null, notes: '' }
];

// Helper: Ensure pre-departure data is properly parsed
const parseJsonField = (val, fallback = null) => {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
};

/**
 * Helper to build SQL WHERE clause and parameters for scoping visas to accessible team members.
 * Supports team hierarchy resolution, assigned staff, visa creator/updater, and student contact assignment.
 */
const buildVisaTeamScope = ({ accessibleUserIds, requestedStaffId = null, vAlias = 'v', cAlias = 'c' }) => {
  let clause = '';
  const params = [];

  const hasSpecific = requestedStaffId !== undefined &&
                      requestedStaffId !== null &&
                      String(requestedStaffId).trim() !== '' &&
                      String(requestedStaffId).toLowerCase() !== 'all';

  if (accessibleUserIds !== null) {
    if (accessibleUserIds.length === 0) {
      return { clause: ' AND 1 = 0 ', params: [] };
    }

    const placeholders = accessibleUserIds.map(() => '?').join(',');

    if (hasSpecific) {
      const targetId = Number(requestedStaffId);
      if (!isNaN(targetId)) {
        if (accessibleUserIds.includes(targetId)) {
          // Permitted specific staff member
          clause = ` AND (${vAlias}.assigned_staff_id = ? OR (${vAlias}.assigned_staff_id IS NULL AND (${vAlias}.updated_by = ? OR ${cAlias}.assigned_to = ? OR ${cAlias}.created_by_user = ?))) `;
          params.push(targetId, targetId, targetId, targetId);
        } else {
          // Security block: requested staff is outside team hierarchy
          return { clause: ' AND 1 = 0 ', params: [] };
        }
      } else {
        // Fallback to all accessible
        clause = ` AND (${vAlias}.assigned_staff_id IN (${placeholders}) OR ${vAlias}.updated_by IN (${placeholders}) OR ${cAlias}.assigned_to IN (${placeholders}) OR ${cAlias}.created_by_user IN (${placeholders})) `;
        params.push(...accessibleUserIds, ...accessibleUserIds, ...accessibleUserIds, ...accessibleUserIds);
      }
    } else {
      // All accessible team members
      clause = ` AND (${vAlias}.assigned_staff_id IN (${placeholders}) OR ${vAlias}.updated_by IN (${placeholders}) OR ${cAlias}.assigned_to IN (${placeholders}) OR ${cAlias}.created_by_user IN (${placeholders})) `;
      params.push(...accessibleUserIds, ...accessibleUserIds, ...accessibleUserIds, ...accessibleUserIds);
    }
  } else {
    // Unrestricted (superadmin / admin / developer)
    if (hasSpecific) {
      const targetId = Number(requestedStaffId);
      if (!isNaN(targetId)) {
        clause = ` AND (${vAlias}.assigned_staff_id = ? OR (${vAlias}.assigned_staff_id IS NULL AND (${vAlias}.updated_by = ? OR ${cAlias}.assigned_to = ? OR ${cAlias}.created_by_user = ?))) `;
        params.push(targetId, targetId, targetId, targetId);
      }
    }
  }

  return { clause, params };
};

// Helper: Resolve pre-departure checklist against master visa_checklist_templates
const resolvePreDepartureChecklist = async (businessId, savedData) => {
  try {
    const [templates] = await pool.query(
      'SELECT * FROM visa_checklist_templates WHERE business_id = ? AND is_active = 1 ORDER BY stage_order ASC, id ASC',
      [businessId]
    );

    if (templates && templates.length > 0) {
      const parsedSaved = Array.isArray(savedData) ? savedData : (parseJsonField(savedData, []) || []);
      const savedMap = {};
      parsedSaved.forEach(item => {
        if (item.id) savedMap[item.id] = item;
        if (item.template_id) savedMap['template_' + item.template_id] = item;
        if (item.title) savedMap[item.title.toLowerCase().trim()] = item;
      });

      return templates.map(t => {
        const keyId = 'template_' + t.id;
        const keyTitle = (t.title || '').toLowerCase().trim();
        const saved = savedMap[keyId] || savedMap[t.id] || savedMap[keyTitle];
        return {
          id: keyId,
          template_id: t.id,
          title: t.title,
          category: t.category || 'Pre-Departure',
          description: t.description || '',
          done: saved ? !!saved.done : false,
          completed_at: saved ? saved.completed_at : null,
          notes: saved ? (saved.notes || '') : ''
        };
      });
    }
  } catch (err) {
    console.error('resolvePreDepartureChecklist error:', err);
  }

  return parseJsonField(savedData, DEFAULT_PRE_DEPARTURE_ITEMS);
};

// GET /api/visas
// List visas with search, filters, pagination and deadline metrics
const getVisaList = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const {
      search,
      status,
      visa_type,
      assigned_staff_id,
      deadline_filter,
      start_date,
      end_date,
      page = 1,
      limit = 10
    } = req.query;

    const accessibleUserIds = await getAccessibleUserIds(req.user, businessId);

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    let whereSql = ` WHERE v.business_id = ? AND (v.is_deleted = 0 OR v.is_deleted IS NULL) `;
    const params = [businessId];

    // Team scope filter
    const staffIdParam = assigned_staff_id === 'me' ? req.user.id : assigned_staff_id;
    const scope = buildVisaTeamScope({
      accessibleUserIds,
      requestedStaffId: staffIdParam,
      vAlias: 'v',
      cAlias: 'c'
    });
    whereSql += scope.clause;
    params.push(...scope.params);

    // Status filter
    if (status && status !== 'all') {
      whereSql += ` AND v.status = ? `;
      params.push(status);
    }

    // Visa Type filter
    if (visa_type && visa_type !== 'all') {
      whereSql += ` AND v.visa_type = ? `;
      params.push(visa_type);
    }

    // Date range (submission or outcome)
    if (start_date) {
      whereSql += ` AND (v.submission_date >= ? OR v.outcome_date >= ?) `;
      params.push(start_date, start_date);
    }
    if (end_date) {
      whereSql += ` AND (v.submission_date <= ? OR v.outcome_date <= ?) `;
      params.push(end_date, end_date);
    }

    // Search query
    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      whereSql += ` AND (
        c.name LIKE ? OR 
        v.contact_name LIKE ? OR 
        c.phone LIKE ? OR 
        v.contact_phone LIKE ? OR 
        c.email LIKE ? OR 
        v.application_no LIKE ? OR 
        v.officer_name LIKE ?
      ) `;
      params.push(s, s, s, s, s, s, s);
    }

    // Deadline & Alert filter (VISA-002)
    if (deadline_filter === 'overdue') {
      whereSql += ` AND EXISTS (
        SELECT 1 FROM visa_requests vr 
        WHERE vr.visa_id = v.id 
          AND vr.due_date < CURDATE() 
          AND vr.status != 'Closed'
      ) `;
    } else if (deadline_filter === 'due_today') {
      whereSql += ` AND EXISTS (
        SELECT 1 FROM visa_requests vr 
        WHERE vr.visa_id = v.id 
          AND vr.due_date = CURDATE() 
          AND vr.status != 'Closed'
      ) `;
    } else if (deadline_filter === 'due_7_days') {
      whereSql += ` AND EXISTS (
        SELECT 1 FROM visa_requests vr 
        WHERE vr.visa_id = v.id 
          AND vr.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) 
          AND vr.status != 'Closed'
      ) `;
    } else if (deadline_filter === 'urgent_rfi') {
      whereSql += ` AND (v.status = 'RFI-PPI' OR EXISTS (
        SELECT 1 FROM visa_requests vr 
        WHERE vr.visa_id = v.id 
          AND vr.status != 'Closed'
      )) `;
    } else if (deadline_filter === 'travel_soon') {
      whereSql += ` AND v.travel_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) `;
    }

    // Count total query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM visas v
      LEFT JOIN contacts c ON v.contact_id = c.id
      ${whereSql}
    `;
    const [countResult] = await pool.query(countQuery, params);
    const totalRecords = countResult[0]?.total || 0;

    // Data query with joined contact and user info
    const dataQuery = `
      SELECT 
        v.*,
        COALESCE(v.contact_name, c.name) as contact_name,
        COALESCE(v.contact_phone, c.phone) as contact_phone,
        c.email as contact_email,
        c.address as contact_address,
        c.branch_name,
        c.department_name,
        c.status_name as contact_status_name,
        u.name as staff_name,
        up.name as updated_by_name,
        (
          SELECT COUNT(*) 
          FROM visa_requests vr 
          WHERE vr.visa_id = v.id AND vr.status != 'Closed'
        ) as open_requests_count,
        (
          SELECT COUNT(*) 
          FROM visa_requests vr 
          WHERE vr.visa_id = v.id AND vr.due_date < CURDATE() AND vr.status != 'Closed'
        ) as overdue_requests_count,
        (
          SELECT MIN(vr.due_date) 
          FROM visa_requests vr 
          WHERE vr.visa_id = v.id AND vr.status != 'Closed'
        ) as next_due_date
      FROM visas v
      LEFT JOIN contacts c ON v.contact_id = c.id
      LEFT JOIN users u ON v.assigned_staff_id = u.id
      LEFT JOIN users up ON v.updated_by = up.id
      ${whereSql}
      ORDER BY 
        CASE 
          WHEN overdue_requests_count > 0 THEN 1 
          WHEN v.status = 'RFI-PPI' THEN 2
          WHEN v.status = 'Under Assessment' THEN 3
          WHEN v.status = 'Submitted' THEN 4
          WHEN v.status = 'Ready' THEN 5
          WHEN v.status = 'Preparation' THEN 6
          ELSE 7 
        END,
        v.updated_at DESC, v.id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(dataQuery, [...params, limitNum, offset]);

    res.json({
      success: true,
      data: rows.map(r => ({
        ...r,
        pre_departure_data: parseJsonField(r.pre_departure_data, DEFAULT_PRE_DEPARTURE_ITEMS)
      })),
      pagination: {
        total: totalRecords,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalRecords / limitNum) || 1
      },
      message: 'OK'
    });
  } catch (err) {
    console.error('getVisaList error:', err);
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
};

// GET /api/visas/metrics
// Summary counts, status breakdowns, deadline alerts, and decline analytics
const getVisaMetrics = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const accessibleUserIds = await getAccessibleUserIds(req.user, businessId);
    const { assigned_staff_id, agent } = req.query;
    const requestedStaff = assigned_staff_id || agent;
    const staffIdParam = requestedStaff === 'me' ? req.user.id : requestedStaff;

    const scope = buildVisaTeamScope({
      accessibleUserIds,
      requestedStaffId: staffIdParam,
      vAlias: 'v',
      cAlias: 'c'
    });

    // Overall & Status counts
    const [statusRows] = await pool.query(`
      SELECT 
        COUNT(*) as total_cases,
        SUM(CASE WHEN v.status = 'Preparation' THEN 1 ELSE 0 END) as preparation_count,
        SUM(CASE WHEN v.status = 'Ready' THEN 1 ELSE 0 END) as ready_count,
        SUM(CASE WHEN v.status = 'Submitted' THEN 1 ELSE 0 END) as submitted_count,
        SUM(CASE WHEN v.status = 'Under Assessment' THEN 1 ELSE 0 END) as under_assessment_count,
        SUM(CASE WHEN v.status = 'RFI-PPI' THEN 1 ELSE 0 END) as rfi_ppi_count,
        SUM(CASE WHEN v.status = 'AIP' THEN 1 ELSE 0 END) as aip_count,
        SUM(CASE WHEN v.status = 'Approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN v.status = 'Declined' THEN 1 ELSE 0 END) as declined_count,
        SUM(CASE WHEN v.status = 'Withdrawn' THEN 1 ELSE 0 END) as withdrawn_count
      FROM visas v
      LEFT JOIN contacts c ON v.contact_id = c.id
      WHERE v.business_id = ? AND (v.is_deleted = 0 OR v.is_deleted IS NULL)
      ${scope.clause}
    `, [businessId, ...scope.params]);

    // Deadlines summary (VISA-002)
    const [deadlineRows] = await pool.query(`
      SELECT 
        SUM(CASE WHEN vr.due_date < CURDATE() AND vr.status != 'Closed' THEN 1 ELSE 0 END) as overdue_deadlines,
        SUM(CASE WHEN vr.due_date = CURDATE() AND vr.status != 'Closed' THEN 1 ELSE 0 END) as due_today_deadlines,
        SUM(CASE WHEN vr.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND vr.status != 'Closed' THEN 1 ELSE 0 END) as due_7_days_deadlines
      FROM visa_requests vr
      JOIN visas v ON vr.visa_id = v.id
      LEFT JOIN contacts c ON v.contact_id = c.id
      WHERE vr.business_id = ? AND (v.is_deleted = 0 OR v.is_deleted IS NULL)
      ${scope.clause}
    `, [businessId, ...scope.params]);

    // Imminent travel (within 30 days)
    const [travelRows] = await pool.query(`
      SELECT COUNT(*) as travel_soon_count
      FROM visas v
      LEFT JOIN contacts c ON v.contact_id = c.id
      WHERE v.business_id = ? 
        AND (v.is_deleted = 0 OR v.is_deleted IS NULL)
        AND v.travel_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      ${scope.clause}
    `, [businessId, ...scope.params]);

    // Categorized Decline Reasons (VISA-004)
    const [declineRows] = await pool.query(`
      SELECT 
        COALESCE(NULLIF(TRIM(v.decline_category), ''), 'Uncategorized') as category,
        COUNT(*) as count
      FROM visas v
      LEFT JOIN contacts c ON v.contact_id = c.id
      WHERE v.business_id = ? AND v.status = 'Declined' AND (v.is_deleted = 0 OR v.is_deleted IS NULL)
      ${scope.clause}
      GROUP BY category
      ORDER BY count DESC
    `, [businessId, ...scope.params]);

    const s = statusRows[0] || {};
    const d = deadlineRows[0] || {};
    const totalCases = Number(s.total_cases || 0);

    const activeProcessing = 
      Number(s.preparation_count || 0) +
      Number(s.ready_count || 0) +
      Number(s.submitted_count || 0) +
      Number(s.under_assessment_count || 0) +
      Number(s.rfi_ppi_count || 0) +
      Number(s.aip_count || 0);

    res.json({
      success: true,
      data: {
        total: totalCases,
        active_processing: activeProcessing,
        preparation: Number(s.preparation_count || 0),
        ready: Number(s.ready_count || 0),
        submitted: Number(s.submitted_count || 0),
        under_assessment: Number(s.under_assessment_count || 0),
        rfi_ppi: Number(s.rfi_ppi_count || 0),
        aip: Number(s.aip_count || 0),
        approved: Number(s.approved_count || 0),
        declined: Number(s.declined_count || 0),
        withdrawn: Number(s.withdrawn_count || 0),
        deadlines: {
          overdue: Number(d.overdue_deadlines || 0),
          due_today: Number(d.due_today_deadlines || 0),
          due_7_days: Number(d.due_7_days_deadlines || 0),
          travel_soon: Number(travelRows[0]?.travel_soon_count || 0)
        },
        decline_categories: declineRows
      },
      message: 'OK'
    });
  } catch (err) {
    console.error('getVisaMetrics error:', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// GET /api/visas/:id
// Get structured case record with full details, requests, tasks & history
const getVisaById = async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.user.businessId;
    const accessibleUserIds = await getAccessibleUserIds(req.user, businessId);

    const scope = buildVisaTeamScope({
      accessibleUserIds,
      vAlias: 'v',
      cAlias: 'c'
    });

    const [rows] = await pool.query(`
      SELECT 
        v.*,
        COALESCE(v.contact_name, c.name) as contact_name,
        COALESCE(v.contact_phone, c.phone) as contact_phone,
        c.email as contact_email,
        c.address as contact_address,
        c.branch_name,
        c.department_name,
        c.status_name as contact_status_name,
        u.name as staff_name,
        up.name as updated_by_name
      FROM visas v
      LEFT JOIN contacts c ON v.contact_id = c.id
      LEFT JOIN users u ON v.assigned_staff_id = u.id
      LEFT JOIN users up ON v.updated_by = up.id
      WHERE v.id = ? AND v.business_id = ? AND (v.is_deleted = 0 OR v.is_deleted IS NULL)
      ${scope.clause}
      LIMIT 1
    `, [id, businessId, ...scope.params]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Visa case record not found or access denied' });
    }

    const visa = rows[0];
    visa.pre_departure_data = await resolvePreDepartureChecklist(businessId, visa.pre_departure_data);

    // Fetch immigration requests (VISA-001)
    const [requests] = await pool.query(`
      SELECT vr.*, u.name as creator_name, ct.status as task_status, ct.task_date as task_due_date
      FROM visa_requests vr
      LEFT JOIN users u ON vr.created_by = u.id
      LEFT JOIN contact_tasks ct ON vr.assigned_task_id = ct.id
      WHERE vr.visa_id = ?
      ORDER BY vr.due_date ASC, vr.id DESC
    `, [id]);

    // Fetch history audit trail
    const [history] = await pool.query(`
      SELECT vh.*, u.name as user_name
      FROM visa_history vh
      LEFT JOIN users u ON vh.changed_by = u.id
      WHERE vh.visa_id = ?
      ORDER BY vh.created_at DESC, vh.id DESC
    `, [id]);

    res.json({
      success: true,
      data: {
        ...visa,
        requests,
        history
      },
      message: 'OK'
    });
  } catch (err) {
    console.error('getVisaById error:', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// GET /api/visas/contact/:contactId
// Backward-compatible endpoint for contact profile
const getContactVisa = async (req, res) => {
  try {
    const { contactId } = req.params;
    const businessId = req.user.businessId;
    const requestedVisaId = req.query.visa_id ? Number(req.query.visa_id) : null;
    const accessibleUserIds = await getAccessibleUserIds(req.user, businessId);

    const scope = buildVisaTeamScope({
      accessibleUserIds,
      vAlias: 'v',
      cAlias: 'c'
    });

    const [rows] = await pool.query(`
      SELECT 
        v.*, 
        COALESCE(v.contact_name, c.name) as contact_name,
        COALESCE(v.contact_phone, c.phone) as contact_phone,
        u.name as updated_by_name, 
        s.name as staff_name
      FROM visas v
      LEFT JOIN contacts c ON v.contact_id = c.id
      LEFT JOIN users u ON v.updated_by = u.id
      LEFT JOIN users s ON v.assigned_staff_id = s.id
      WHERE v.contact_id = ? AND v.business_id = ? AND (v.is_deleted = 0 OR v.is_deleted IS NULL)
      ${scope.clause}
      ORDER BY v.id DESC
    `, [contactId, businessId, ...scope.params]);

    const [countRows] = await pool.query(`
      SELECT 
        SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) as submitted_count,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved_count,
        COUNT(*) as total_history_count
      FROM visa_history
      WHERE contact_id = ?
    `, [contactId]);

    const counts = {
      submitted_count: Number(countRows[0]?.submitted_count || 0),
      approved_count: Number(countRows[0]?.approved_count || 0),
      total_history_count: Number(countRows[0]?.total_history_count || 0)
    };

    if (counts.total_history_count === 0 && rows.length > 0) {
      if (rows[0].status === 'Submitted') counts.submitted_count = 1;
      if (rows[0].status === 'Approved') counts.approved_count = 1;
      counts.total_history_count = 1;
    }

    let visa = null;
    if (requestedVisaId) {
      visa = rows.find(r => r.id === requestedVisaId) || rows[0] || null;
    } else {
      visa = rows[0] || null;
    }

    if (visa) {
      visa.pre_departure_data = await resolvePreDepartureChecklist(businessId, visa.pre_departure_data);

      // Fetch immigration requests (VISA-001)
      const [reqRows] = await pool.query(`
        SELECT vr.*, u.name as creator_name, ct.status as task_status, ct.task_date as task_due_date,
               DATEDIFF(vr.due_date, CURDATE()) as days_remaining
        FROM visa_requests vr
        LEFT JOIN users u ON vr.created_by = u.id
        LEFT JOIN contact_tasks ct ON vr.assigned_task_id = ct.id
        WHERE vr.visa_id = ?
        ORDER BY vr.due_date ASC, vr.id DESC
      `, [visa.id]);
      visa.requests = reqRows;

      // Fetch history
      const [histRows] = await pool.query(`
        SELECT vh.*, u.name as user_name
        FROM visa_history vh
        LEFT JOIN users u ON vh.changed_by = u.id
        WHERE vh.contact_id = ?
        ORDER BY vh.created_at DESC, vh.id DESC
      `, [contactId]);
      visa.history = histRows;
    }

    res.json({
      success: true,
      data: visa,
      cases: rows,
      counts,
      message: 'OK'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// POST /api/visas
// Create or update visa structured case record
const saveVisa = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.id;
    const accessibleUserIds = await getAccessibleUserIds(req.user, businessId);
    const {
      id,
      contact_id,
      visa_type = 'Student Visa',
      application_no = null,
      assigned_staff_id = null,
      assigned_staff_name = null,
      status = 'Preparation',
      submission_date = null,
      officer_name = null,
      officer_contact = null,
      extension_requested_date = null,
      extension_approved_date = null,
      extension_notes = null,
      outcome_date = null,
      outcome_notes = null,
      decline_category = null,
      decline_detailed_notes = null,
      visa_expiry_date = null,
      travel_date = null,
      intake_date = null,
      description = null,
      notes = null
    } = req.body;

    if (!contact_id) {
      return res.status(400).json({ success: false, message: 'Student/Contact ID is required' });
    }

    // Team Scoping Permission Check:
    // User must have access to either the student contact OR the existing visa case
    if (accessibleUserIds !== null) {
      if (accessibleUserIds.length === 0) {
        return res.status(403).json({ success: false, message: 'You do not have permission to manage visa cases.' });
      }

      // Check student contact access
      const [contactCheck] = await pool.query(`
        SELECT id FROM contacts 
        WHERE id = ? AND business_id = ? 
          AND (assigned_to IN (${accessibleUserIds.map(() => '?').join(',')}) OR created_by_user IN (${accessibleUserIds.map(() => '?').join(',')}))
        LIMIT 1
      `, [contact_id, businessId, ...accessibleUserIds, ...accessibleUserIds]);

      let hasPermission = contactCheck.length > 0;

      // If existing visa case, also allow if assigned to or updated by accessible team member
      if (!hasPermission && id) {
        const [visaCheck] = await pool.query(`
          SELECT id FROM visas 
          WHERE id = ? AND business_id = ? 
            AND (assigned_staff_id IN (${accessibleUserIds.map(() => '?').join(',')}) OR updated_by IN (${accessibleUserIds.map(() => '?').join(',')}))
          LIMIT 1
        `, [id, businessId, ...accessibleUserIds, ...accessibleUserIds]);
        hasPermission = visaCheck.length > 0;
      }

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not have permission to create or modify visa cases for this student.'
        });
      }
    }

    // Resolve assigned staff name if ID provided but name not
    let resolvedStaffName = assigned_staff_name;
    if (assigned_staff_id && !resolvedStaffName) {
      const [uRows] = await pool.query('SELECT name FROM users WHERE id = ?', [assigned_staff_id]);
      if (uRows.length > 0) resolvedStaffName = uRows[0].name;
    }

    // Resolve contact name and phone number
    let resolvedContactName = req.body.contact_name;
    let resolvedContactPhone = req.body.contact_phone;
    if (!resolvedContactName || !resolvedContactPhone) {
      const [cRows] = await pool.query('SELECT name, phone FROM contacts WHERE id = ?', [contact_id]);
      if (cRows.length > 0) {
        if (!resolvedContactName) resolvedContactName = cRows[0].name;
        if (!resolvedContactPhone) resolvedContactPhone = cRows[0].phone;
      }
    }

    // Check if visa record already exists by ID
    let existing = [];
    if (id) {
      [existing] = await pool.query(
        'SELECT * FROM visas WHERE id = ? AND business_id = ? LIMIT 1',
        [id, businessId]
      );
    }

    let visaId;
    let action = '';
    let isNew = existing.length === 0;
    let prevStatus = isNew ? null : existing[0].status;
    let triggerPreDeparture = false;

    // VISA-003 Check: If transitioning to 'Approved'
    if (status === 'Approved' && (isNew || prevStatus !== 'Approved')) {
      triggerPreDeparture = true;
    }

    // Pre-departure payload setup
    let preDepartureJson = null;
    if (isNew) {
      preDepartureJson = JSON.stringify(DEFAULT_PRE_DEPARTURE_ITEMS);
    } else if (existing[0].pre_departure_data) {
      preDepartureJson = typeof existing[0].pre_departure_data === 'string'
        ? existing[0].pre_departure_data
        : JSON.stringify(existing[0].pre_departure_data);
    } else {
      preDepartureJson = JSON.stringify(DEFAULT_PRE_DEPARTURE_ITEMS);
    }

    if (!isNew) {
      visaId = existing[0].id;
      const prev = existing[0];
      action = prev.status !== status ? `Status changed from ${prev.status} to ${status}` : 'Visa case details updated';

      await pool.query(`
        UPDATE visas SET
          contact_name = COALESCE(?, contact_name),
          contact_phone = COALESCE(?, contact_phone),
          is_deleted = 0,
          visa_type = ?,
          application_no = ?,
          assigned_staff_id = ?,
          assigned_staff_name = ?,
          status = ?,
          submission_date = ?,
          officer_name = ?,
          officer_contact = ?,
          extension_requested_date = ?,
          extension_approved_date = ?,
          extension_notes = ?,
          outcome_date = ?,
          outcome_notes = ?,
          decline_category = ?,
          decline_detailed_notes = ?,
          visa_expiry_date = ?,
          travel_date = ?,
          intake_date = ?,
          visa_date = COALESCE(?, visa_date),
          description = ?,
          pre_departure_triggered = CASE WHEN ? = 1 THEN 1 ELSE pre_departure_triggered END,
          pre_departure_data = COALESCE(pre_departure_data, ?),
          updated_by = ?
        WHERE id = ? AND business_id = ?
      `, [
        resolvedContactName || null,
        resolvedContactPhone || null,
        visa_type,
        application_no,
        assigned_staff_id,
        resolvedStaffName,
        status,
        submission_date || null,
        officer_name || null,
        officer_contact || null,
        extension_requested_date || null,
        extension_approved_date || null,
        extension_notes || null,
        outcome_date || null,
        outcome_notes || null,
        status === 'Declined' ? (decline_category || null) : null,
        status === 'Declined' ? (decline_detailed_notes || null) : null,
        visa_expiry_date || null,
        travel_date || null,
        intake_date || null,
        submission_date || outcome_date || null,
        description || null,
        triggerPreDeparture ? 1 : 0,
        preDepartureJson,
        userId,
        visaId,
        businessId
      ]);
    } else {
      action = `Visa case registered with status: ${status}`;
      const [insertResult] = await pool.query(`
        INSERT INTO visas (
          contact_id,
          business_id,
          contact_name,
          contact_phone,
          is_deleted,
          visa_type,
          application_no,
          assigned_staff_id,
          assigned_staff_name,
          status,
          submission_date,
          officer_name,
          officer_contact,
          extension_requested_date,
          extension_approved_date,
          extension_notes,
          outcome_date,
          outcome_notes,
          decline_category,
          decline_detailed_notes,
          visa_expiry_date,
          travel_date,
          intake_date,
          visa_date,
          description,
          pre_departure_triggered,
          pre_departure_data,
          created_by,
          updated_by
        ) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        contact_id,
        businessId,
        resolvedContactName || null,
        resolvedContactPhone || null,
        visa_type,
        application_no,
        assigned_staff_id,
        resolvedStaffName,
        status,
        submission_date || null,
        officer_name || null,
        officer_contact || null,
        extension_requested_date || null,
        extension_approved_date || null,
        extension_notes || null,
        outcome_date || null,
        outcome_notes || null,
        status === 'Declined' ? (decline_category || null) : null,
        status === 'Declined' ? (decline_detailed_notes || null) : null,
        visa_expiry_date || null,
        travel_date || null,
        intake_date || null,
        submission_date || outcome_date || null,
        description || null,
        triggerPreDeparture ? 1 : 0,
        preDepartureJson,
        userId,
        userId
      ]);
      visaId = insertResult.insertId;
    }

    // VISA-003: If visa is approved, trigger pre-departure actions & update student journey
    if (triggerPreDeparture) {
      try {
        // Fetch student contact details
        const [contactRows] = await pool.query('SELECT name, phone, branch_id, branch_name, department_id, department_name FROM contacts WHERE id = ?', [contact_id]);
        const student = contactRows[0] || {};

        // 1. Create a high-priority pre-departure task in contact_tasks
        await pool.query(`
          INSERT INTO contact_tasks (
            contact_id, contact_name, contact_phone, branch_id, branch_name,
            dept_id, dept_name, title, description, assigned_to, assigned_to_name,
            created_by, created_by_name, status, is_task_date, task_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, DATE_ADD(CURDATE(), INTERVAL 3 DAY))
        `, [
          contact_id,
          student.name || 'Student',
          student.phone || '',
          student.branch_id || null,
          student.branch_name || null,
          student.department_id || null,
          student.department_name || null,
          'Visa Approved: Initiate Pre-Departure Briefing & Checklist',
          `Official Visa approval received on ${outcome_date || new Date().toISOString().slice(0, 10)}. Complete pre-departure checklist: briefing, flight booking, health insurance, accommodation & airport transit.`,
          assigned_staff_id || userId,
          resolvedStaffName || req.user.name || 'Visa Staff',
          userId,
          req.user.name || 'System'
        ]);

        // 2. Update contact history for student journey tracking
        await pool.query(`
          INSERT INTO contact_history (contact_id, business_id, user_id, field_name, old_value, new_value)
          VALUES (?, ?, ?, 'Student Journey: Visa Approved', ?, 'Approved - Pre-Departure Phase')
        `, [contact_id, businessId, userId, prevStatus || 'In Process']);
      } catch (triggerErr) {
        console.error('Error triggering pre-departure actions:', triggerErr);
      }
    }

    // Record in visa_history
    await pool.query(`
      INSERT INTO visa_history (visa_id, contact_id, changed_by, action, status, details, notes, visa_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      visaId,
      contact_id,
      userId,
      action,
      (status === 'Approved' || status === 'Submitted') ? status : 'Submitted',
      notes || description || outcome_notes || action,
      decline_detailed_notes || outcome_notes || null,
      submission_date || outcome_date || null
    ]);

    // Return the updated record
    const [updatedRows] = await pool.query(`
      SELECT 
        v.*,
        c.name as contact_name,
        c.phone as contact_phone,
        c.email as contact_email,
        u.name as staff_name,
        up.name as updated_by_name
      FROM visas v
      LEFT JOIN contacts c ON v.contact_id = c.id
      LEFT JOIN users u ON v.assigned_staff_id = u.id
      LEFT JOIN users up ON v.updated_by = up.id
      WHERE v.id = ?
    `, [visaId]);

    const updated = updatedRows[0] || {};
    updated.pre_departure_data = await resolvePreDepartureChecklist(businessId, updated.pre_departure_data);

    res.json({
      success: true,
      data: updated,
      message: 'Visa case record saved successfully'
    });
  } catch (err) {
    console.error('saveVisa error:', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// POST /api/visas/:id/requests
// VISA-001: Record official requests from immigration (RFI/PPI/Additional Docs)
// with received date, due date, assigned task and document linkage
const addVisaRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.user.businessId;
    const userId = req.user.id;
    const {
      request_type = 'RFI',
      received_date,
      due_date,
      title,
      details = null,
      document_name = null,
      document_url = null,
      create_task = true,
      task_assignee_id = null
    } = req.body;

    if (!received_date || !due_date || !title) {
      return res.status(400).json({
        success: false,
        message: 'Received date, due date, and title are required for official immigration requests'
      });
    }

    // Verify visa case with team scoping
    const accessibleUserIds = await getAccessibleUserIds(req.user, businessId);
    const scope = buildVisaTeamScope({ accessibleUserIds, vAlias: 'v', cAlias: 'c' });
    const [vRows] = await pool.query(
      `SELECT v.*, c.name as contact_name, c.phone as contact_phone, c.branch_id, c.branch_name, c.department_id, c.department_name 
       FROM visas v 
       LEFT JOIN contacts c ON v.contact_id = c.id 
       WHERE v.id = ? AND v.business_id = ? AND (v.is_deleted = 0 OR v.is_deleted IS NULL)
       ${scope.clause}`,
      [id, businessId, ...scope.params]
    );

    if (vRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Visa case not found or access denied' });
    }

    const visa = vRows[0];
    let createdTaskId = null;

    // Auto-create assigned task in contact_tasks if requested (VISA-001 linkage)
    if (create_task) {
      const assigneeId = task_assignee_id || visa.assigned_staff_id || userId;
      let assigneeName = visa.assigned_staff_name || req.user.name || 'Visa Staff';
      if (task_assignee_id && task_assignee_id !== visa.assigned_staff_id) {
        const [u] = await pool.query('SELECT name FROM users WHERE id = ?', [task_assignee_id]);
        if (u.length > 0) assigneeName = u[0].name;
      }

      const [taskRes] = await pool.query(`
        INSERT INTO contact_tasks (
          contact_id, contact_name, contact_phone, branch_id, branch_name,
          dept_id, dept_name, title, description, assigned_to, assigned_to_name,
          created_by, created_by_name, status, is_task_date, task_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?)
      `, [
        visa.contact_id,
        visa.contact_name || 'Student',
        visa.contact_phone || '',
        visa.branch_id || null,
        visa.branch_name || null,
        visa.department_id || null,
        visa.department_name || null,
        `[${request_type}] Immigration Request: ${title}`,
        `Official request received on ${received_date}. Due date: ${due_date}. Notes: ${details || 'Respond before deadline.'}`,
        assigneeId,
        assigneeName,
        userId,
        req.user.name || 'Visa Officer',
        due_date
      ]);
      createdTaskId = taskRes.insertId;
    }

    // Insert immigration request record
    const [insertResult] = await pool.query(`
      INSERT INTO visa_requests (
        visa_id, contact_id, business_id, request_type, received_date, due_date,
        title, details, status, assigned_task_id, document_name, document_url, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?)
    `, [
      id,
      visa.contact_id,
      businessId,
      request_type,
      received_date,
      due_date,
      title,
      details,
      createdTaskId,
      document_name,
      document_url,
      userId
    ]);

    // Automatically transition visa case status to 'RFI-PPI' if active
    if (visa.status !== 'Approved' && visa.status !== 'Declined' && visa.status !== 'Withdrawn') {
      await pool.query(`
        UPDATE visas SET status = 'RFI-PPI', updated_by = ? WHERE id = ?
      `, [userId, id]);
    }

    // History log
    await pool.query(`
      INSERT INTO visa_history (visa_id, contact_id, changed_by, action, status, details, notes, visa_date)
      VALUES (?, ?, ?, ?, 'Submitted', ?, ?, ?)
    `, [
      id,
      visa.contact_id,
      userId,
      `Official ${request_type} request logged: ${title}`,
      `Due on ${due_date}. Linked task #${createdTaskId || 'N/A'}. Document: ${document_name || 'None'}`,
      details,
      received_date
    ]);

    const [newRequestRows] = await pool.query('SELECT * FROM visa_requests WHERE id = ?', [insertResult.insertId]);

    res.json({
      success: true,
      data: newRequestRows[0],
      message: 'Official immigration request logged successfully'
    });
  } catch (err) {
    console.error('addVisaRequest error:', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// PATCH /api/visas/:id/requests/:requestId
// Update status, document, or notes of an official immigration request
const updateVisaRequest = async (req, res) => {
  try {
    const { id, requestId } = req.params;
    const businessId = req.user.businessId;
    const accessibleUserIds = await getAccessibleUserIds(req.user, businessId);

    // Permission check with team scoping
    const scope = buildVisaTeamScope({ accessibleUserIds, vAlias: 'v', cAlias: 'c' });
    const [rows] = await pool.query(
      `SELECT vr.* 
       FROM visa_requests vr 
       JOIN visas v ON vr.visa_id = v.id 
       LEFT JOIN contacts c ON v.contact_id = c.id 
       WHERE vr.id = ? AND vr.visa_id = ? AND vr.business_id = ? AND (v.is_deleted = 0 OR v.is_deleted IS NULL)
       ${scope.clause}`,
      [requestId, id, businessId, ...scope.params]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Request not found or access denied' });
    }

    const current = rows[0];
    const { status, details, document_name, document_url } = req.body;

    await pool.query(`
      UPDATE visa_requests SET
        status = COALESCE(?, status),
        details = COALESCE(?, details),
        document_name = COALESCE(?, document_name),
        document_url = COALESCE(?, document_url)
      WHERE id = ?
    `, [status, details, document_name, document_url, requestId]);

    // If marked Closed, auto-complete linked task in contact_tasks
    if (status === 'Closed' && current.assigned_task_id) {
      await pool.query(
        'UPDATE contact_tasks SET status = 1, completed_at = NOW() WHERE id = ?',
        [current.assigned_task_id]
      );
    }

    const [updated] = await pool.query('SELECT * FROM visa_requests WHERE id = ?', [requestId]);

    res.json({
      success: true,
      data: updated[0],
      message: 'Request updated successfully'
    });
  } catch (err) {
    console.error('updateVisaRequest error:', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// DELETE /api/visas/:id/requests/:requestId
const deleteVisaRequest = async (req, res) => {
  try {
    const { id, requestId } = req.params;
    const businessId = req.user.businessId;
    const accessibleUserIds = await getAccessibleUserIds(req.user, businessId);

    // Permission check with team scoping
    const scope = buildVisaTeamScope({ accessibleUserIds, vAlias: 'v', cAlias: 'c' });
    const [vRows] = await pool.query(
      `SELECT v.id FROM visas v LEFT JOIN contacts c ON v.contact_id = c.id WHERE v.id = ? AND v.business_id = ? AND (v.is_deleted = 0 OR v.is_deleted IS NULL) ${scope.clause}`,
      [id, businessId, ...scope.params]
    );
    if (vRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Visa case not found or access denied' });
    }

    await pool.query(
      'DELETE FROM visa_requests WHERE id = ? AND visa_id = ? AND business_id = ?',
      [requestId, id, businessId]
    );

    res.json({ success: true, message: 'Request deleted successfully' });
  } catch (err) {
    console.error('deleteVisaRequest error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/visas/:id
// Soft delete structured visa case record
const deleteVisa = async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.user.businessId;
    const accessibleUserIds = await getAccessibleUserIds(req.user, businessId);

    const scope = buildVisaTeamScope({
      accessibleUserIds,
      vAlias: 'v',
      cAlias: 'c'
    });

    const [existing] = await pool.query(`
      SELECT v.contact_id 
      FROM visas v 
      LEFT JOIN contacts c ON v.contact_id = c.id 
      WHERE v.id = ? AND v.business_id = ? AND (v.is_deleted = 0 OR v.is_deleted IS NULL)
      ${scope.clause}
      LIMIT 1
    `, [id, businessId, ...scope.params]);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Visa case record not found or access denied' });
    }

    const contactId = existing[0].contact_id;

    // SOFT DELETE: mark is_deleted = 1
    await pool.query(
      'UPDATE visas SET is_deleted = 1, updated_by = ? WHERE id = ? AND business_id = ?', 
      [req.user.id, id, businessId]
    );

    try {
      await pool.query(`
        INSERT INTO contact_history (contact_id, business_id, user_id, field_name, old_value, new_value)
        VALUES (?, ?, ?, 'Visa Case Deleted (Soft Delete)', 'Active Case', 'Deleted')
      `, [contactId, businessId, req.user.id]);
    } catch (e) {}

    res.json({ success: true, message: 'Visa case record soft deleted successfully' });
  } catch (err) {
    console.error('deleteVisa error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/visas/:id/pre-departure
// VISA-003: Update pre-departure action items checklist
const updatePreDeparture = async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.user.businessId;
    const accessibleUserIds = await getAccessibleUserIds(req.user, businessId);

    // Permission check with team scoping
    const scope = buildVisaTeamScope({ accessibleUserIds, vAlias: 'v', cAlias: 'c' });
    const [vRows] = await pool.query(
      `SELECT v.id FROM visas v LEFT JOIN contacts c ON v.contact_id = c.id WHERE v.id = ? AND v.business_id = ? AND (v.is_deleted = 0 OR v.is_deleted IS NULL) ${scope.clause}`,
      [id, businessId, ...scope.params]
    );
    if (vRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Visa case not found or access denied' });
    }

    const { pre_departure_data } = req.body;

    if (!pre_departure_data || !Array.isArray(pre_departure_data)) {
      return res.status(400).json({ success: false, message: 'pre_departure_data must be an array' });
    }

    await pool.query(
      'UPDATE visas SET pre_departure_data = ?, updated_by = ? WHERE id = ? AND business_id = ?',
      [JSON.stringify(pre_departure_data), req.user.id, id, businessId]
    );

    const resolved = await resolvePreDepartureChecklist(businessId, pre_departure_data);

    res.json({
      success: true,
      data: resolved,
      message: 'Pre-departure checklist updated successfully'
    });
  } catch (err) {
    console.error('updatePreDeparture error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/visas/deadline-alerts
// VISA-002: Dedicated reporting endpoint for all pending deadlines & overdue tasks
const getDeadlineAlerts = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const accessibleUserIds = await getAccessibleUserIds(req.user, businessId);
    const { assigned_staff_id, agent } = req.query;
    const requestedStaff = assigned_staff_id || agent;
    const staffIdParam = requestedStaff === 'me' ? req.user.id : requestedStaff;

    const scope = buildVisaTeamScope({
      accessibleUserIds,
      requestedStaffId: staffIdParam,
      vAlias: 'v',
      cAlias: 'c'
    });

    // Overdue or upcoming RFI / PPI requests
    const [requests] = await pool.query(`
      SELECT 
        vr.*,
        v.application_no,
        v.visa_type,
        v.status as visa_status,
        c.id as contact_id,
        c.name as contact_name,
        c.phone as contact_phone,
        u.name as staff_name,
        DATEDIFF(vr.due_date, CURDATE()) as days_remaining
      FROM visa_requests vr
      JOIN visas v ON vr.visa_id = v.id
      JOIN contacts c ON vr.contact_id = c.id
      LEFT JOIN users u ON v.assigned_staff_id = u.id
      WHERE vr.business_id = ?
        AND (v.is_deleted = 0 OR v.is_deleted IS NULL)
        AND vr.status != 'Closed'
        AND vr.due_date <= DATE_ADD(CURDATE(), INTERVAL 14 DAY)
        ${scope.clause}
      ORDER BY vr.due_date ASC
    `, [businessId, ...scope.params]);

    // Upcoming travel departures within 30 days
    const [travels] = await pool.query(`
      SELECT 
        v.id, v.application_no, v.visa_type, v.status, v.travel_date, v.visa_expiry_date,
        c.id as contact_id, 
        COALESCE(v.contact_name, c.name) as contact_name, 
        COALESCE(v.contact_phone, c.phone) as contact_phone,
        u.name as staff_name,
        DATEDIFF(v.travel_date, CURDATE()) as days_to_travel
      FROM visas v
      JOIN contacts c ON v.contact_id = c.id
      LEFT JOIN users u ON v.assigned_staff_id = u.id
      WHERE v.business_id = ?
        AND (v.is_deleted = 0 OR v.is_deleted IS NULL)
        AND v.travel_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        ${scope.clause}
      ORDER BY v.travel_date ASC
    `, [businessId, ...scope.params]);

    res.json({
      success: true,
      data: {
        immigration_requests: requests,
        upcoming_travels: travels
      },
      message: 'OK'
    });
  } catch (err) {
    console.error('getDeadlineAlerts error:', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// GET /api/visas/decline-analytics
// VISA-004: Management analysis of visa decline reasons with detailed notes
const getDeclineAnalytics = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const accessibleUserIds = await getAccessibleUserIds(req.user, businessId);
    const { assigned_staff_id, agent } = req.query;
    const requestedStaff = assigned_staff_id || agent;
    const staffIdParam = requestedStaff === 'me' ? req.user.id : requestedStaff;

    const scope = buildVisaTeamScope({
      accessibleUserIds,
      requestedStaffId: staffIdParam,
      vAlias: 'v',
      cAlias: 'c'
    });

    const subScope = buildVisaTeamScope({
      accessibleUserIds,
      requestedStaffId: staffIdParam,
      vAlias: 'v2',
      cAlias: 'c2'
    });

    // Aggregated by decline_category
    const [categorySummary] = await pool.query(`
      SELECT 
        COALESCE(NULLIF(TRIM(v.decline_category), ''), 'Uncategorized') as category,
        COUNT(*) as total_count,
        ROUND((COUNT(*) * 100.0 / NULLIF((
          SELECT COUNT(*) 
          FROM visas v2 
          LEFT JOIN contacts c2 ON v2.contact_id = c2.id 
          WHERE v2.business_id = ? AND v2.status = 'Declined' AND (v2.is_deleted = 0 OR v2.is_deleted IS NULL)
          ${subScope.clause}
        ), 0)), 1) as percentage
      FROM visas v
      LEFT JOIN contacts c ON v.contact_id = c.id
      WHERE v.business_id = ? AND v.status = 'Declined' AND (v.is_deleted = 0 OR v.is_deleted IS NULL)
      ${scope.clause}
      GROUP BY category
      ORDER BY total_count DESC
    `, [businessId, ...subScope.params, businessId, ...scope.params]);

    // Detailed cases list for management drill-down
    const [detailedCases] = await pool.query(`
      SELECT 
        v.id,
        v.contact_id,
        COALESCE(v.contact_name, c.name) as contact_name,
        COALESCE(v.contact_phone, c.phone) as contact_phone,
        v.application_no,
        v.visa_type,
        v.officer_name,
        v.outcome_date as decline_date,
        v.decline_category,
        v.decline_detailed_notes,
        v.outcome_notes,
        u.name as staff_name
      FROM visas v
      JOIN contacts c ON v.contact_id = c.id
      LEFT JOIN users u ON v.assigned_staff_id = u.id
      WHERE v.business_id = ? AND v.status = 'Declined' AND (v.is_deleted = 0 OR v.is_deleted IS NULL)
      ${scope.clause}
      ORDER BY v.outcome_date DESC, v.id DESC
    `, [businessId, ...scope.params]);

    res.json({
      success: true,
      data: {
        summary: categorySummary,
        cases: detailedCases
      },
      message: 'OK'
    });
  } catch (err) {
    console.error('getDeclineAnalytics error:', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// GET /api/visas/students
// Search available students / contacts to create visa cases
const getAvailableStudents = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { query = '' } = req.query;
    const accessibleUserIds = await getAccessibleUserIds(req.user, businessId);

    let contactScope = '';
    const scopeParams = [];
    if (accessibleUserIds !== null) {
      if (accessibleUserIds.length === 0) {
        return res.json({ success: true, data: [], message: 'OK' });
      }
      contactScope = ` AND (c.assigned_to IN (${accessibleUserIds.map(() => '?').join(',')}) OR c.created_by_user IN (${accessibleUserIds.map(() => '?').join(',')})) `;
      scopeParams.push(...accessibleUserIds, ...accessibleUserIds);
    }

    let sql = `
      SELECT c.id, c.name, c.phone, c.email, c.branch_name, c.department_name,
             v.id as existing_visa_id, v.status as existing_visa_status
      FROM contacts c
      LEFT JOIN visas v ON c.id = v.contact_id AND v.business_id = ? AND (v.is_deleted = 0 OR v.is_deleted IS NULL)
      WHERE c.business_id = ?
      ${contactScope}
    `;
    const params = [businessId, businessId, ...scopeParams];

    if (query && query.trim()) {
      sql += ` AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?) `;
      const s = `%${query.trim()}%`;
      params.push(s, s, s);
    }

    sql += ` ORDER BY c.id DESC LIMIT 20 `;

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
};

// GET /api/visas/staff
// List staff / counselors for assigned visa staff (filtered to accessible team members)
const getVisaStaffList = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const accessibleUserIds = await getAccessibleUserIds(req.user, businessId);

    let userScope = '';
    const params = [businessId];
    if (accessibleUserIds !== null) {
      if (accessibleUserIds.length === 0) {
        return res.json({ success: true, data: [], message: 'OK' });
      }
      userScope = ` AND id IN (${accessibleUserIds.map(() => '?').join(',')}) `;
      params.push(...accessibleUserIds);
    }

    const [users] = await pool.query(`
      SELECT id, name, email, role
      FROM users
      WHERE business_id = ? AND is_active = 1 ${userScope}
      ORDER BY name ASC
    `, params);

    res.json({ success: true, data: users, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
};

// GET /api/visas/contact/:contactId/history
const getVisaHistory = async (req, res) => {
  try {
    const { contactId } = req.params;
    const { status } = req.query;
    const businessId = req.user.businessId;
    const accessibleUserIds = await getAccessibleUserIds(req.user, businessId);

    let scopeClause = '';
    const scopeParams = [];
    if (accessibleUserIds !== null) {
      if (accessibleUserIds.length === 0) {
        return res.json({ success: true, data: [], message: 'OK' });
      }
      scopeClause = ` AND (c.assigned_to IN (${accessibleUserIds.map(() => '?').join(',')}) OR c.created_by_user IN (${accessibleUserIds.map(() => '?').join(',')})) `;
      scopeParams.push(...accessibleUserIds, ...accessibleUserIds);
    }

    let query = `
      SELECT vh.*, u.name as user_name
      FROM visa_history vh
      JOIN contacts c ON vh.contact_id = c.id
      LEFT JOIN users u ON vh.changed_by = u.id
      WHERE vh.contact_id = ? AND c.business_id = ? ${scopeClause}
    `;
    const params = [contactId, businessId, ...scopeParams];

    if (status && status !== 'all') {
      query += ` AND vh.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY vh.created_at DESC, vh.id DESC`;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// GET /api/visas/leads-report
// Retrieves matching leads joined between visas and contacts for a given status
const getVisaLeadsReport = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const {
      status = 'all',
      search = '',
      page = 1,
      limit = 20,
      assigned_staff_id,
      agent
    } = req.query;

    const accessibleUserIds = await getAccessibleUserIds(req.user, businessId);
    const requestedStaff = assigned_staff_id || agent;
    const staffIdParam = requestedStaff === 'me' ? req.user.id : requestedStaff;

    const scope = buildVisaTeamScope({
      accessibleUserIds,
      requestedStaffId: staffIdParam,
      vAlias: 'v',
      cAlias: 'c'
    });

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    // Resolve status name & id in JS without collation issues
    let targetStatusName = status ? status.trim() : 'all';
    let targetStatusId = null;

    if (targetStatusName !== 'all') {
      try {
        const [matchedStatuses] = await pool.query(
          `SELECT id, name FROM visa_statuses WHERE business_id = ? AND (BINARY LOWER(TRIM(name)) = BINARY LOWER(TRIM(?)) OR CAST(id AS CHAR) = ?) LIMIT 1`,
          [businessId, targetStatusName, targetStatusName]
        );
        if (matchedStatuses && matchedStatuses.length > 0) {
          targetStatusName = matchedStatuses[0].name;
          targetStatusId = String(matchedStatuses[0].id);
        }
      } catch (e) {
        console.warn('Status lookup note:', e.message);
      }
    }

    // 1. Where clause
    let whereSql = ` WHERE v.business_id = ? AND (v.is_deleted = 0 OR v.is_deleted IS NULL) AND (v.is_delete = 0 OR v.is_delete IS NULL) ${scope.clause} `;
    const params = [businessId, ...scope.params];

    if (targetStatusName !== 'all') {
      if (targetStatusId) {
        whereSql += ` AND (
          BINARY LOWER(TRIM(v.status)) = BINARY LOWER(TRIM(?))
          OR BINARY TRIM(v.status) = BINARY ?
        ) `;
        params.push(targetStatusName, targetStatusId);
      } else {
        whereSql += ` AND BINARY LOWER(TRIM(v.status)) = BINARY LOWER(TRIM(?)) `;
        params.push(targetStatusName);
      }
    }

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      whereSql += ` AND (
        c.name LIKE ? OR 
        v.contact_name LIKE ? OR 
        c.phone LIKE ? OR 
        v.contact_phone LIKE ? OR 
        c.email LIKE ? OR 
        v.application_no LIKE ? OR 
        v.assigned_staff_name LIKE ? OR
        v.officer_name LIKE ?
      ) `;
      params.push(s, s, s, s, s, s, s, s);
    }

    // 2. Count Total
    const [countRows] = await pool.query(`
      SELECT COUNT(*) as total
      FROM visas v
      LEFT JOIN contacts c ON v.contact_id = c.id
      ${whereSql}
    `, params);
    const total = countRows[0]?.total || 0;

    // 3. Fetch Paginated Records
    const dataParams = [...params, limitNum, offset];
    const [leads] = await pool.query(`
      SELECT 
        v.id as visa_id,
        v.contact_id,
        COALESCE(c.name, v.contact_name, 'Unknown') as contact_name,
        COALESCE(c.phone, v.contact_phone, '—') as contact_phone,
        COALESCE(c.email, '—') as contact_email,
        c.address as contact_address,
        COALESCE(v.visa_type, 'Student Visa') as visa_type,
        v.status as visa_status,
        COALESCE(vs.color, '#4f46e5') as status_color,
        v.application_no,
        v.visa_date,
        v.submission_date,
        v.outcome_date,
        v.assigned_staff_id,
        v.assigned_staff_name,
        v.officer_name,
        v.travel_date,
        v.intake_date,
        v.created_at
      FROM visas v
      LEFT JOIN contacts c ON v.contact_id = c.id
      LEFT JOIN visa_statuses vs ON vs.business_id = v.business_id
        AND (
          BINARY LOWER(TRIM(v.status)) = BINARY LOWER(TRIM(vs.name))
          OR BINARY TRIM(v.status) = BINARY CAST(vs.id AS CHAR)
        )
      ${whereSql}
      ORDER BY v.created_at DESC, v.id DESC
      LIMIT ? OFFSET ?
    `, dataParams);

    // 4. Status Summary for tab strip
    const [statusSummary] = await pool.query(`
      SELECT 
        vs.id,
        vs.name,
        COALESCE(vs.color, '#4f46e5') as color,
        vs.stage_order,
        COUNT(v.id) as count
      FROM visa_statuses vs
      LEFT JOIN (
        SELECT v.id, v.business_id, v.status
        FROM visas v
        LEFT JOIN contacts c ON v.contact_id = c.id
        WHERE v.business_id = ?
          AND (v.is_deleted = 0 OR v.is_deleted IS NULL)
          AND (v.is_delete = 0 OR v.is_delete IS NULL)
          ${scope.clause}
      ) v ON (
        BINARY LOWER(TRIM(v.status)) = BINARY LOWER(TRIM(vs.name))
        OR BINARY TRIM(v.status) = BINARY CAST(vs.id AS CHAR)
      )
      WHERE vs.business_id = ?
        AND vs.is_active = 1
      GROUP BY vs.id, vs.name, vs.color, vs.stage_order
      ORDER BY vs.stage_order ASC, vs.id ASC
    `, [businessId, ...scope.params, businessId]);

    // Total active across all statuses
    const [overallCount] = await pool.query(`
      SELECT COUNT(*) as total_all
      FROM visas v
      LEFT JOIN contacts c ON v.contact_id = c.id
      WHERE v.business_id = ?
        AND (v.is_deleted = 0 OR v.is_deleted IS NULL)
        AND (v.is_delete = 0 OR v.is_delete IS NULL)
        ${scope.clause}
    `, [businessId, ...scope.params]);

    res.json({
      success: true,
      data: {
        leads,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1
        },
        totalAll: overallCount[0]?.total_all || 0,
        statusSummary
      },
      message: 'OK'
    });
  } catch (err) {
    console.error('getVisaLeadsReport error:', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

module.exports = {
  getVisaList,
  getVisaMetrics,
  getVisaById,
  getContactVisa,
  saveVisa,
  deleteVisa,
  addVisaRequest,
  updateVisaRequest,
  deleteVisaRequest,
  updatePreDeparture,
  getDeadlineAlerts,
  getDeclineAnalytics,
  getAvailableStudents,
  getVisaStaffList,
  getVisaHistory,
  getVisaLeadsReport
};
