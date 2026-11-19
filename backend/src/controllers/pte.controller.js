const pool = require('../db/pool');

/**
 * GET /api/pte/contact/:contactId
 * Fetches complete PTE details, conversion timeline, attendance %, mock tests, exams, and results
 */
const getPteByContactId = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const contactId = req.params.contactId;

    // 1. Fetch Contact & Original Counsellor Info
    const [contactRows] = await pool.query(`
      SELECT 
        c.id, c.name, c.phone, c.email, c.assigned_to, c.branch_id, c.branch_name,
        u.name as assigned_counsellor_name
      FROM contacts c
      LEFT JOIN users u ON c.assigned_to = u.id
      WHERE c.id = ? AND c.business_id = ?
    `, [contactId, businessId]);

    if (!contactRows || contactRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    const contact = contactRows[0];

    // 2. Fetch PTE Student Record (PTE-001)
    const [pteRows] = await pool.query(`
      SELECT ps.*, 
             pb.batch_name as joined_batch_name,
             pb.schedule as joined_batch_schedule,
             pb.capacity as joined_batch_capacity
      FROM pte_students ps
      LEFT JOIN pte_batches pb ON ps.batch_id = pb.id
      WHERE ps.contact_id = ? AND ps.business_id = ? AND (ps.is_deleted = 0 OR ps.is_deleted IS NULL)
      ORDER BY ps.id DESC LIMIT 1
    `, [contactId, businessId]);

    if (!pteRows || pteRows.length === 0) {
      return res.json({
        success: true,
        data: null,
        contact: {
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          original_counsellor_id: contact.assigned_to,
          original_counsellor_name: contact.assigned_counsellor_name
        },
        message: 'No PTE record initialized'
      });
    }

    const pte = pteRows[0];

    // 3. Attendance & Attendance % (Section 3.4)
    const [attendanceRows] = await pool.query(`
      SELECT * FROM pte_attendance 
      WHERE pte_student_id = ? AND contact_id = ?
      ORDER BY session_date DESC, id DESC
    `, [pte.id, contactId]);

    const totalSessions = attendanceRows.length;
    const presentSessions = attendanceRows.filter(a => a.status === 'Present').length;
    const attendancePercentage = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

    // 4. Mock Tests History (Section 3.5)
    const [mockTests] = await pool.query(`
      SELECT * FROM pte_mock_tests 
      WHERE pte_student_id = ? AND contact_id = ?
      ORDER BY test_date DESC, id DESC
    `, [pte.id, contactId]);

    // 5. Exams History (Section 3.6)
    const [exams] = await pool.query(`
      SELECT * FROM pte_exams 
      WHERE pte_student_id = ? AND contact_id = ?
      ORDER BY exam_date DESC, id DESC
    `, [pte.id, contactId]);

    // 6. Results History (Section 3.7)
    const [results] = await pool.query(`
      SELECT * FROM pte_results 
      WHERE pte_student_id = ? AND contact_id = ?
      ORDER BY exam_date DESC, id DESC
    `, [pte.id, contactId]);

    // 7. Batch Capacity Metrics (Section 3.3)
    let batchCapacityInfo = null;
    if (pte.batch_id) {
      const [bCountRows] = await pool.query(`
        SELECT COUNT(*) as joined_count 
        FROM pte_students 
        WHERE batch_id = ? AND business_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
      `, [pte.batch_id, businessId]);

      const joinedCount = bCountRows[0]?.joined_count || 0;
      const capacity = pte.joined_batch_capacity || 20;
      batchCapacityInfo = {
        batch_id: pte.batch_id,
        batch_name: pte.joined_batch_name,
        capacity: capacity,
        joined: joinedCount,
        available: Math.max(0, capacity - joinedCount),
        schedule: pte.joined_batch_schedule
      };
    }

    // 8. Conversion Durations (PTE-002)
    const calcDays = (d1, d2) => {
      if (!d1 || !d2) return null;
      const diffTime = Math.abs(new Date(d2).getTime() - new Date(d1).getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const conversionMetrics = {
      days_referral_to_join: calcDays(pte.referral_date, pte.join_date),
      days_join_to_target_achieved: calcDays(pte.join_date, pte.target_achievement_date),
      days_target_to_application: calcDays(pte.target_achievement_date, pte.application_date)
    };

    res.json({
      success: true,
      data: {
        ...pte,
        attendance: {
          records: attendanceRows,
          total_sessions: totalSessions,
          present_sessions: presentSessions,
          percentage: attendancePercentage
        },
        mock_tests: mockTests,
        exams: exams,
        results: results,
        batch_capacity: batchCapacityInfo,
        conversion_metrics: conversionMetrics,
        contact: {
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          original_counsellor_id: pte.original_counsellor_id || contact.assigned_to,
          original_counsellor_name: pte.original_counsellor_name || contact.assigned_counsellor_name
        }
      }
    });
  } catch (err) {
    console.error('getPteByContactId error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/pte/contact/:contactId
 * Creates or updates student PTE enrollment (PTE-001, PTE-002, batch capacity)
 */
const savePteEnrollment = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;
    const contactId = req.params.contactId;

    const {
      status = 'Recommended',
      package_name,
      target_score,
      current_score,
      batch_id,
      trainer_id,
      trainer_name,
      recommendation_date,
      referral_date,
      join_date,
      followup_date,
      followup_remarks,
      remarks,
      referring_counsellor_id
    } = req.body;

    // 1. Fetch Contact info to preserve PTE-001 Original Counsellor
    const [contactRows] = await pool.query(`
      SELECT c.*, u.name as assigned_user_name 
      FROM contacts c
      LEFT JOIN users u ON c.assigned_to = u.id
      WHERE c.id = ? AND c.business_id = ?
    `, [contactId, businessId]);

    if (!contactRows || contactRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    const contact = contactRows[0];

    // 2. Check if student already has a PTE record
    const [existingRows] = await pool.query(`
      SELECT * FROM pte_students 
      WHERE contact_id = ? AND business_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
      LIMIT 1
    `, [contactId, businessId]);

    const existingPte = existingRows[0] || null;

    // 3. Batch Capacity Verification (Section 3.3)
    let resolvedBatchName = null;
    if (batch_id) {
      const [batchRows] = await pool.query(`
        SELECT id, batch_name, capacity 
        FROM pte_batches 
        WHERE id = ? AND business_id = ?
      `, [batch_id, businessId]);

      if (batchRows.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid batch selected' });
      }

      const batch = batchRows[0];
      resolvedBatchName = batch.batch_name;

      // Count currently enrolled in this batch (excluding this student)
      const excludeStudentId = existingPte ? existingPte.id : 0;
      const [enrolledCount] = await pool.query(`
        SELECT COUNT(*) as cnt 
        FROM pte_students 
        WHERE batch_id = ? AND business_id = ? AND (is_deleted = 0 OR is_deleted IS NULL) AND id != ?
      `, [batch_id, businessId, excludeStudentId]);

      const currentCount = enrolledCount[0]?.cnt || 0;
      if (currentCount >= batch.capacity) {
        return res.status(400).json({
          success: false,
          message: `Cannot assign batch: "${batch.batch_name}" has reached full capacity (${batch.capacity} seats). Available: 0.`
        });
      }
    }

    // 4. Resolve Counsellor Names (PTE-001)
    let originalCounsellorId = existingPte ? existingPte.original_counsellor_id : (contact.assigned_to || userId);
    let originalCounsellorName = existingPte ? existingPte.original_counsellor_name : (contact.assigned_user_name || req.user.name || 'Counsellor');

    let referringCounsellorId = referring_counsellor_id || (existingPte ? existingPte.referring_counsellor_id : userId);
    let referringCounsellorName = req.user.name || 'Counsellor';
    if (referringCounsellorId) {
      const [refUser] = await pool.query('SELECT name FROM users WHERE id = ?', [referringCounsellorId]);
      if (refUser.length > 0) referringCounsellorName = refUser[0].name;
    }

    // Determine stage dates based on status change (PTE-002)
    const today = new Date().toISOString().slice(0, 10);
    const resolvedRecDate = recommendation_date || (existingPte?.recommendation_date || today);
    const resolvedRefDate = referral_date || (status !== 'Recommended' ? (existingPte?.referral_date || today) : null);
    const resolvedJoinDate = join_date || (['Joined', 'Training', 'Mock Test', 'Exam Booked', 'Target Achieved'].includes(status) ? (existingPte?.join_date || today) : null);

    let pteStudentId = existingPte ? existingPte.id : null;

    if (existingPte) {
      // Update existing record
      await pool.query(`
        UPDATE pte_students SET
          status = ?,
          package_name = ?,
          target_score = ?,
          current_score = ?,
          batch_id = ?,
          batch_name = ?,
          trainer_id = ?,
          trainer_name = ?,
          recommendation_date = ?,
          referral_date = ?,
          join_date = ?,
          followup_date = ?,
          followup_remarks = ?,
          remarks = ?,
          referring_counsellor_id = ?,
          referring_counsellor_name = ?
        WHERE id = ? AND business_id = ?
      `, [
        status,
        package_name || existingPte.package_name,
        target_score !== undefined ? target_score : existingPte.target_score,
        current_score !== undefined ? current_score : existingPte.current_score,
        batch_id || null,
        resolvedBatchName || existingPte.batch_name,
        trainer_id || null,
        trainer_name || existingPte.trainer_name,
        resolvedRecDate,
        resolvedRefDate,
        resolvedJoinDate,
        followup_date || null,
        followup_remarks || null,
        remarks || null,
        referringCounsellorId,
        referringCounsellorName,
        existingPte.id,
        businessId
      ]);
    } else {
      // Insert new PTE record
      const [insertRes] = await pool.query(`
        INSERT INTO pte_students (
          contact_id, business_id,
          original_counsellor_id, original_counsellor_name,
          referring_counsellor_id, referring_counsellor_name,
          recommendation_date, referral_date, join_date,
          status, package_name, target_score, current_score,
          batch_id, batch_name, trainer_id, trainer_name,
          followup_date, followup_remarks, remarks, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        contactId, businessId,
        originalCounsellorId, originalCounsellorName,
        referringCounsellorId, referringCounsellorName,
        resolvedRecDate, resolvedRefDate, resolvedJoinDate,
        status, package_name || 'Standard Coaching',
        target_score || 65.0, current_score || null,
        batch_id || null, resolvedBatchName || null,
        trainer_id || null, trainer_name || null,
        followup_date || null, followup_remarks || null,
        remarks || null, userId
      ]);
      pteStudentId = insertRes.insertId;
    }

    // History Log
    await pool.query(`
      INSERT INTO contact_history (contact_id, business_id, user_id, field_name, old_value, new_value)
      VALUES (?, ?, ?, 'PTE Status Updated', ?, ?)
    `, [contactId, businessId, userId, existingPte?.status || 'None', status]);

    res.json({
      success: true,
      message: 'PTE Enrollment saved successfully',
      data: { pteStudentId }
    });
  } catch (err) {
    console.error('savePteEnrollment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/pte/contact/:contactId/attendance
 * Logs a session attendance record (Section 3.4)
 */
const addAttendance = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;
    const contactId = req.params.contactId;
    const { pte_student_id, session_date, session_title, status = 'Present', remarks, batch_id } = req.body;

    if (!session_date) {
      return res.status(400).json({ success: false, message: 'Session date is required' });
    }

    await pool.query(`
      INSERT INTO pte_attendance (
        pte_student_id, contact_id, business_id, batch_id,
        session_date, session_title, status, remarks, marked_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      pte_student_id, contactId, businessId, batch_id || null,
      session_date, session_title || 'Class Session', status, remarks || '', userId
    ]);

    res.json({ success: true, message: 'Attendance marked successfully' });
  } catch (err) {
    console.error('addAttendance error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/pte/attendance/:id
 */
const deleteAttendance = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    await pool.query('DELETE FROM pte_attendance WHERE id = ? AND business_id = ?', [req.params.id, businessId]);
    res.json({ success: true, message: 'Attendance record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/pte/contact/:contactId/mock-tests
 * Records a mock test result (Section 3.5)
 */
const addMockTest = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;
    const contactId = req.params.contactId;
    const {
      pte_student_id, test_date, test_title,
      overall_score, listening, reading, speaking, writing, comments
    } = req.body;

    if (!test_date || overall_score === undefined) {
      return res.status(400).json({ success: false, message: 'Test date and overall score are required' });
    }

    await pool.query(`
      INSERT INTO pte_mock_tests (
        pte_student_id, contact_id, business_id, test_date, test_title,
        overall_score, listening, reading, speaking, writing, comments, evaluated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      pte_student_id, contactId, businessId, test_date, test_title || 'Mock Test',
      overall_score, listening || null, reading || null, speaking || null, writing || null, comments || '', userId
    ]);

    // Update current score on student profile
    await pool.query(`
      UPDATE pte_students SET current_score = ?, status = 'Mock Test' 
      WHERE id = ? AND business_id = ?
    `, [overall_score, pte_student_id, businessId]);

    res.json({ success: true, message: 'Mock test recorded successfully' });
  } catch (err) {
    console.error('addMockTest error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/pte/mock-tests/:id
 */
const deleteMockTest = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    await pool.query('DELETE FROM pte_mock_tests WHERE id = ? AND business_id = ?', [req.params.id, businessId]);
    res.json({ success: true, message: 'Mock test deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/pte/contact/:contactId/exams
 * Logs an exam booking (Section 3.6)
 */
const addExam = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const contactId = req.params.contactId;
    const {
      pte_student_id, booking_date, exam_date, venue, mode, notes, result_status = 'Result Pending'
    } = req.body;

    if (!exam_date) {
      return res.status(400).json({ success: false, message: 'Exam date is required' });
    }

    await pool.query(`
      INSERT INTO pte_exams (
        pte_student_id, contact_id, business_id,
        booking_date, exam_date, venue, mode, notes, result_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      pte_student_id, contactId, businessId,
      booking_date || new Date().toISOString().slice(0, 10), exam_date, venue || 'Official Pearson VUE Test Center',
      mode || 'Offline Center', notes || '', result_status
    ]);

    await pool.query(`
      UPDATE pte_students SET status = 'Exam Booked' 
      WHERE id = ? AND business_id = ? AND status NOT IN ('Result Received', 'Target Achieved')
    `, [pte_student_id, businessId]);

    res.json({ success: true, message: 'Exam logged successfully' });
  } catch (err) {
    console.error('addExam error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/pte/contact/:contactId/results
 * Records final/official PTE exam result (Section 3.7 & PTE-003 Automated Follow-up)
 */
const addResult = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;
    const contactId = req.params.contactId;
    const {
      pte_student_id, exam_id, exam_date,
      overall_score, listening, reading, speaking, writing,
      remarks, next_action
    } = req.body;

    if (!exam_date || overall_score === undefined) {
      return res.status(400).json({ success: false, message: 'Exam date and overall score are required' });
    }

    // 1. Fetch Student Target Score
    const [pteStudentRows] = await pool.query(`
      SELECT ps.*, c.name as student_name, c.phone as student_phone, c.branch_id, c.branch_name, c.department_id, c.department_name
      FROM pte_students ps
      LEFT JOIN contacts c ON ps.contact_id = c.id
      WHERE ps.id = ? AND ps.business_id = ?
    `, [pte_student_id, businessId]);

    if (pteStudentRows.length === 0) {
      return res.status(404).json({ success: false, message: 'PTE Student not found' });
    }
    const pte = pteStudentRows[0];
    const targetScore = pte.target_score || 65.0;

    // 2. Automatically Determine Target Achieved (Section 3.7)
    const isTargetAchieved = Number(overall_score) >= Number(targetScore) ? 1 : 0;
    const achievementDate = isTargetAchieved ? (exam_date || new Date().toISOString().slice(0, 10)) : null;

    // 3. Insert Result Record
    const [resultInsert] = await pool.query(`
      INSERT INTO pte_results (
        pte_student_id, contact_id, business_id, exam_id, exam_date,
        overall_score, listening, reading, speaking, writing,
        target_score, target_achieved, achievement_date, next_action, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      pte_student_id, contactId, businessId, exam_id || null, exam_date,
      overall_score, listening || null, reading || null, speaking || null, writing || null,
      targetScore, isTargetAchieved, achievementDate, next_action || (isTargetAchieved ? 'Apply for University' : 'Re-take Coaching'), remarks || ''
    ]);

    // 4. Update Exam status if linked
    if (exam_id) {
      await pool.query(`
        UPDATE pte_exams SET result_status = 'Result Received', result_received_date = ? 
        WHERE id = ? AND business_id = ?
      `, [exam_date, exam_id, businessId]);
    }

    // 5. Update Student PTE Status
    const newStatus = isTargetAchieved ? 'Target Achieved' : 'Target Not Achieved';
    await pool.query(`
      UPDATE pte_students SET
        current_score = ?,
        status = ?,
        target_achieved = ?,
        target_achievement_date = ?
      WHERE id = ? AND business_id = ?
    `, [overall_score, newStatus, isTargetAchieved, achievementDate, pte_student_id, businessId]);

    // 6. PTE-003: AUTOMATIC APPLICATION FOLLOW-UP TRIGGER
    let followUpTaskCreated = false;
    if (isTargetAchieved) {
      try {
        const assigneeId = pte.original_counsellor_id || pte.created_by || userId;
        const assigneeName = pte.original_counsellor_name || req.user.name || 'Counsellor';

        await pool.query(`
          INSERT INTO contact_tasks (
            contact_id, contact_name, contact_phone, branch_id, branch_name,
            dept_id, dept_name, title, description, assigned_to, assigned_to_name,
            created_by, created_by_name, status, is_task_date, task_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, DATE_ADD(CURDATE(), INTERVAL 2 DAY))
        `, [
          contactId,
          pte.student_name || 'Student',
          pte.student_phone || '',
          pte.branch_id || null,
          pte.branch_name || null,
          pte.department_id || null,
          pte.department_name || null,
          `PTE Target Achieved – Application follow-up required for Student: ${pte.student_name || 'Student'}`,
          `Student achieved PTE score of ${overall_score} (Target: ${targetScore}) on ${exam_date}. Automatically triggered: Proceed to university course shortlisting and visa application preparation.`,
          assigneeId,
          assigneeName,
          userId,
          req.user.name || 'PTE Module'
        ]);

        followUpTaskCreated = true;

        await pool.query(`
          INSERT INTO contact_history (contact_id, business_id, user_id, field_name, old_value, new_value)
          VALUES (?, ?, ?, 'PTE Target Achieved', 'Target: ${targetScore}', 'Achieved: ${overall_score} - Application Task Generated')
        `, [contactId, businessId, userId]);
      } catch (taskErr) {
        console.error('Error auto-creating application task (PTE-003):', taskErr);
      }
    }

    res.json({
      success: true,
      message: isTargetAchieved
        ? 'Target Achieved! Automatic Application follow-up task has been generated for the counsellor.'
        : 'Result recorded successfully.',
      data: {
        isTargetAchieved,
        overallScore: overall_score,
        targetScore,
        followUpTaskCreated
      }
    });
  } catch (err) {
    console.error('addResult error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/pte/batches
 * Returns batches with capacity and enrollment counts
 */
const getBatches = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const includeInactive = req.query.all === 'true' || req.query.all === '1';

    let query = `
      SELECT 
        pb.*,
        COUNT(ps.id) as joined_count,
        GREATEST(0, pb.capacity - COUNT(ps.id)) as available_seats
      FROM pte_batches pb
      LEFT JOIN pte_students ps ON pb.id = ps.batch_id AND (ps.is_deleted = 0 OR ps.is_deleted IS NULL)
      WHERE pb.business_id = ?
    `;

    if (!includeInactive) {
      query += ` AND pb.is_active = 1`;
    }

    query += `
      GROUP BY pb.id
      ORDER BY pb.id ASC
    `;

    const [batches] = await pool.query(query, [businessId]);
    res.json({ success: true, data: batches });
  } catch (err) {
    console.error('getBatches error:', err);
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
};

/**
 * POST /api/pte/batches
 * Creates a new batch with capacity limits
 */
const createBatch = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { batch_name, trainer_id, trainer_name, schedule, start_date, end_date, capacity = 20, is_active = 1 } = req.body;

    if (!batch_name || !batch_name.trim()) {
      return res.status(400).json({ success: false, message: 'Batch name is required' });
    }

    const [result] = await pool.query(`
      INSERT INTO pte_batches (business_id, batch_name, trainer_id, trainer_name, schedule, start_date, end_date, capacity, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [businessId, batch_name.trim(), trainer_id || null, trainer_name || null, schedule || null, start_date || null, end_date || null, parseInt(capacity, 10) || 20, is_active ? 1 : 0]);

    res.json({ success: true, message: 'Batch created successfully', data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/pte/batches/:id
 */
const updateBatch = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { id } = req.params;
    const { batch_name, trainer_id, trainer_name, schedule, start_date, end_date, capacity = 20, is_active = 1 } = req.body;

    if (!batch_name || !batch_name.trim()) {
      return res.status(400).json({ success: false, message: 'Batch name is required' });
    }

    await pool.query(`
      UPDATE pte_batches 
      SET batch_name = ?, trainer_id = ?, trainer_name = ?, schedule = ?, start_date = ?, end_date = ?, capacity = ?, is_active = ?
      WHERE id = ? AND business_id = ?
    `, [batch_name.trim(), trainer_id || null, trainer_name || null, schedule || null, start_date || null, end_date || null, parseInt(capacity, 10) || 20, is_active ? 1 : 0, id, businessId]);

    res.json({ success: true, message: 'Batch updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/pte/batches/:id
 */
const deleteBatch = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { id } = req.params;

    await pool.query('DELETE FROM pte_batches WHERE id = ? AND business_id = ?', [id, businessId]);
    res.json({ success: true, message: 'Batch deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/pte/trainers
 * Returns trainers list from pte_trainers table
 */
const getTrainers = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const includeInactive = req.query.all === 'true' || req.query.all === '1';

    let query = `
      SELECT t.*, u.name as user_name, u.email as user_email
      FROM pte_trainers t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.business_id = ?
    `;

    if (!includeInactive) {
      query += ` AND t.is_active = 1`;
    }

    query += ` ORDER BY t.name ASC`;

    const [trainers] = await pool.query(query, [businessId]);
    res.json({ success: true, data: trainers });
  } catch (err) {
    console.error('getTrainers error:', err);
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
};

/**
 * POST /api/pte/trainers
 */
const createTrainer = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { name, email, phone, specialization = 'PTE Academic', user_id, is_active = 1 } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Trainer name is required' });
    }

    const [result] = await pool.query(`
      INSERT INTO pte_trainers (business_id, name, email, phone, specialization, user_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [businessId, name.trim(), email || null, phone || null, specialization || 'PTE Academic', user_id || null, is_active ? 1 : 0]);

    res.json({ success: true, message: 'Trainer added successfully', data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/pte/trainers/:id
 */
const updateTrainer = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { id } = req.params;
    const { name, email, phone, specialization, user_id, is_active = 1 } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Trainer name is required' });
    }

    await pool.query(`
      UPDATE pte_trainers
      SET name = ?, email = ?, phone = ?, specialization = ?, user_id = ?, is_active = ?
      WHERE id = ? AND business_id = ?
    `, [name.trim(), email || null, phone || null, specialization || 'PTE Academic', user_id || null, is_active ? 1 : 0, id, businessId]);

    res.json({ success: true, message: 'Trainer updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/pte/trainers/:id
 */
const deleteTrainer = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { id } = req.params;

    await pool.query('DELETE FROM pte_trainers WHERE id = ? AND business_id = ?', [id, businessId]);
    res.json({ success: true, message: 'Trainer deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * --- PTE STATUSES CRUD ---
 */
const getStatuses = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const includeInactive = req.query.all === 'true' || req.query.all === '1';

    let query = `SELECT * FROM pte_statuses WHERE business_id = ?`;
    if (!includeInactive) {
      query += ` AND is_active = 1`;
    }
    query += ` ORDER BY stage_order ASC, id ASC`;

    const [rows] = await pool.query(query, [businessId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getStatuses error:', err);
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
};

const createStatus = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { name, stage_order = 1, color = '#3b82f6', description, is_active = 1 } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Status name is required' });
    }

    const [result] = await pool.query(`
      INSERT INTO pte_statuses (business_id, name, stage_order, color, description, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [businessId, name.trim(), parseInt(stage_order, 10) || 1, color || '#3b82f6', description || null, is_active ? 1 : 0]);

    res.json({ success: true, message: 'Status created successfully', data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { id } = req.params;
    const { name, stage_order = 1, color = '#3b82f6', description, is_active = 1 } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Status name is required' });
    }

    await pool.query(`
      UPDATE pte_statuses
      SET name = ?, stage_order = ?, color = ?, description = ?, is_active = ?
      WHERE id = ? AND business_id = ?
    `, [name.trim(), parseInt(stage_order, 10) || 1, color || '#3b82f6', description || null, is_active ? 1 : 0, id, businessId]);

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteStatus = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { id } = req.params;

    await pool.query('DELETE FROM pte_statuses WHERE id = ? AND business_id = ?', [id, businessId]);
    res.json({ success: true, message: 'Status deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * --- PTE PACKAGES CRUD ---
 */
const getPackages = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const includeInactive = req.query.all === 'true' || req.query.all === '1';

    let query = `SELECT * FROM pte_packages WHERE business_id = ?`;
    if (!includeInactive) {
      query += ` AND is_active = 1`;
    }
    query += ` ORDER BY price ASC, id ASC`;

    const [rows] = await pool.query(query, [businessId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getPackages error:', err);
    res.status(500).json({ success: false, message: err.message, data: [] });
  }
};

const createPackage = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { name, duration, price = 0, total_sessions = 20, mock_tests_count = 5, description, is_active = 1 } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Package name is required' });
    }

    const [result] = await pool.query(`
      INSERT INTO pte_packages (business_id, name, duration, price, total_sessions, mock_tests_count, description, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [businessId, name.trim(), duration || null, parseFloat(price) || 0, parseInt(total_sessions, 10) || 20, parseInt(mock_tests_count, 10) || 5, description || null, is_active ? 1 : 0]);

    res.json({ success: true, message: 'Package created successfully', data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updatePackage = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { id } = req.params;
    const { name, duration, price = 0, total_sessions = 20, mock_tests_count = 5, description, is_active = 1 } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Package name is required' });
    }

    await pool.query(`
      UPDATE pte_packages
      SET name = ?, duration = ?, price = ?, total_sessions = ?, mock_tests_count = ?, description = ?, is_active = ?
      WHERE id = ? AND business_id = ?
    `, [name.trim(), duration || null, parseFloat(price) || 0, parseInt(total_sessions, 10) || 20, parseInt(mock_tests_count, 10) || 5, description || null, is_active ? 1 : 0, id, businessId]);

    res.json({ success: true, message: 'Package updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deletePackage = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { id } = req.params;

    await pool.query('DELETE FROM pte_packages WHERE id = ? AND business_id = ?', [id, businessId]);
    res.json({ success: true, message: 'Package deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getPteByContactId,
  savePteEnrollment,
  addAttendance,
  deleteAttendance,
  addMockTest,
  deleteMockTest,
  addExam,
  addResult,
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  getTrainers,
  createTrainer,
  updateTrainer,
  deleteTrainer,
  getStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
  getPackages,
  createPackage,
  updatePackage,
  deletePackage
};
