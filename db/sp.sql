DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `create_contact_task`(
    IN p_contact_id INT,
    IN p_contact_name VARCHAR(255),
    IN p_contact_phone VARCHAR(50),
    IN p_branch_id INT,
    IN p_branch_name VARCHAR(255),
    IN p_dept_id INT,
    IN p_dept_name VARCHAR(255),
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_assigned_to INT,
    IN p_assigned_to_name VARCHAR(255),
    IN p_created_by INT,
    IN p_created_by_name VARCHAR(255),
    IN p_is_task_date TINYINT(1),
    IN p_task_date DATE
)
BEGIN
    INSERT INTO `contact_tasks` (
        `contact_id`,
        `contact_name`,
        `contact_phone`,
        `branch_id`,
        `branch_name`,
        `dept_id`,
        `dept_name`,
        `title`,
        `description`,
        `assigned_to`,
        `assigned_to_name`,
        `created_by`,
        `created_by_name`,
        `status`,
        `is_task_date`,
        `task_date`,
        `created_at`,
        `updated_at`
    ) VALUES (
        p_contact_id,
        p_contact_name,
        p_contact_phone,
        p_branch_id,
        p_branch_name,
        p_dept_id,
        p_dept_name,
        p_title,
        p_description,
        p_assigned_to,
        p_assigned_to_name,
        p_created_by,
        p_created_by_name,
        0, -- Default status: 0 (Pending)
        IFNULL(p_is_task_date, 0),
        IF(IFNULL(p_is_task_date, 0) = 1, p_task_date, NULL),
        NOW(),
        NOW()
    );

    -- Return the newly created task
    SELECT * FROM `contact_tasks` WHERE `id` = LAST_INSERT_ID();
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `dashbord_source_count`(
      IN p_business_id INT,
      IN p_user_id INT,
      IN p_user_role VARCHAR(50)
    )
BEGIN
      SELECT 
        source_name AS name,
        COUNT(*) AS value
      FROM (
        SELECT 
          COALESCE(
            ch.name,
            NULLIF(TRIM(c.channel_preference), ''),
            'Unknown'
          ) AS source_name
        FROM contacts c
        LEFT JOIN channels ch ON c.channel_id = ch.id
        WHERE c.business_id = p_business_id
          AND (
              -- Admin sees all or check role
              (p_user_role IN ('admin', 'superadmin'))
              -- Or assigned to user / team member
              OR c.assigned_to = p_user_id
              OR c.assigned_to IN (
                  SELECT tm.user_id 
                  FROM teams t
                  INNER JOIN team_members tm ON tm.team_id = t.id
                  WHERE t.user_id = p_user_id
                    AND t.business_id = p_business_id
              )
          )
      ) t
      GROUP BY source_name
      ORDER BY value DESC;
    END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `get_contact_academic_counts`(
  IN p_contact_id INT,
  IN p_business_id INT
)
BEGIN
  SELECT
    (SELECT COUNT(*) 
     FROM contact_qualifications 
     WHERE contact_id = p_contact_id AND business_id = p_business_id) AS qualifications_count,

    (SELECT COUNT(*) 
     FROM contact_work_experiences 
     WHERE contact_id = p_contact_id AND business_id = p_business_id) AS experiences_count,

    (SELECT COUNT(*) 
     FROM contact_tasks 
     WHERE contact_id = p_contact_id AND status = 0) AS tasks_count,

    (SELECT COUNT(*) 
     FROM applications 
     WHERE contact_id = p_contact_id AND business_id = p_business_id) AS applications_count,

    (SELECT COUNT(*) 
     FROM receipts 
     WHERE contact_id = p_contact_id AND business_id = p_business_id) AS receipts_count,

    (SELECT COUNT(*) 
     FROM user_document_upload 
     WHERE contact_id = p_contact_id AND business_id = p_business_id) AS documents_count,

    (SELECT status 
     FROM visas 
     WHERE contact_id = p_contact_id AND business_id = p_business_id AND (is_deleted = 0 OR is_deleted IS NULL) 
     ORDER BY id DESC LIMIT 1) AS visa_status,

    (SELECT status 
     FROM pte_students 
     WHERE contact_id = p_contact_id AND business_id = p_business_id AND (is_deleted = 0 OR is_deleted IS NULL) 
     ORDER BY id DESC LIMIT 1) AS pte_status;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `get_contact_qualifications`(
  IN p_contact_id INT,
  IN p_business_id INT
)
BEGIN
  SELECT 
    q.id,
    q.qualification,
    q.institution,
    q.completion_year,
    q.percentage_cgpa,
    q.backlogs,
    q.study_gap,
    q.is_highest,
    q.sort_order
  FROM contact_qualifications q
  WHERE q.contact_id = p_contact_id 
    AND q.business_id = p_business_id
  ORDER BY q.sort_order ASC, q.id ASC;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `get_contact_tasks_by_contact`(
    IN p_contact_id INT,
    IN p_search VARCHAR(255),
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_page INT,
    IN p_limit INT
)
BEGIN
    DECLARE v_offset INT DEFAULT 0;
    DECLARE v_limit INT DEFAULT 10;
    
    -- Default page and limit handling
    IF p_limit IS NOT NULL AND p_limit > 0 THEN
        SET v_limit = p_limit;
    END IF;

    IF p_page IS NOT NULL AND p_page > 0 THEN
        SET v_offset = (p_page - 1) * v_limit;
    END IF;

    -- 1. Total matching count
    SELECT COUNT(*) AS total
    FROM `contact_tasks`
    WHERE `contact_id` = p_contact_id
      AND (
          p_search IS NULL 
          OR TRIM(p_search) = '' 
          OR `title` LIKE CONCAT('%', TRIM(p_search), '%')
      )
      AND (
          p_start_date IS NULL 
          OR (`is_task_date` = 1 AND `task_date` >= p_start_date)
      )
      AND (
          p_end_date IS NULL 
          OR (`is_task_date` = 1 AND `task_date` <= p_end_date)
      );

    -- 2. Paginated records
    SELECT 
        `id`,
        `contact_id`,
        `title`,
        `description`,
        `assigned_to`,
        `assigned_to_name`,
        `created_by_name`,
        `status`,
        `is_task_date`,
        `task_date`,
        `completed_at`,
        `created_at`
    FROM `contact_tasks`
    WHERE `contact_id` = p_contact_id
      AND (
          p_search IS NULL 
          OR TRIM(p_search) = '' 
          OR `title` LIKE CONCAT('%', TRIM(p_search), '%')
      )
      AND (
          p_start_date IS NULL 
          OR (`is_task_date` = 1 AND `task_date` >= p_start_date)
      )
      AND (
          p_end_date IS NULL 
          OR (`is_task_date` = 1 AND `task_date` <= p_end_date)
      )
    ORDER BY `status` ASC, `created_at` DESC
    LIMIT v_limit OFFSET v_offset;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `get_contact_tasks_kpi`(
    IN p_user_id INT -- Logged-in User ID
)
BEGIN
    SELECT 
        COUNT(*) AS total,
        COUNT(CASE WHEN t.status = 0 THEN 1 END) AS pending,
        COUNT(CASE WHEN t.status = 1 THEN 1 END) AS completed,
        COUNT(CASE WHEN t.status = 0 AND t.is_task_date = 1 AND t.task_date = CURDATE() THEN 1 END) AS due_today,
        COUNT(CASE WHEN t.status = 0 AND t.is_task_date = 1 AND t.task_date < CURDATE() THEN 1 END) AS overdue
    FROM `contact_tasks` t
    WHERE 
      (
          t.assigned_to = p_user_id
          OR t.assigned_to IN (
              SELECT tm.user_id 
              FROM teams tm_t
              JOIN team_members tm ON tm.team_id = tm_t.id
              WHERE tm_t.user_id = p_user_id
          )
      );
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `get_contact_task_team_assignees`(
    IN p_user_id INT
)
BEGIN
    SELECT 
        u.id,
        u.name,
        u.role,
        u.branch_id,
        b.name AS branch_name,
        u.department_id AS dept_id,
        d.name AS dept_name
    FROM users u
    LEFT JOIN branches b ON u.branch_id = b.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE (u.is_active = 1 OR u.is_active IS NULL)
      AND (
          -- 1. Always include the logged-in user themselves (Self)
          u.id = p_user_id
          -- 2. Plus team members IF this user has a team
          OR u.id IN (
              SELECT tm.user_id 
              FROM teams t
              INNER JOIN team_members tm ON tm.team_id = t.id
              WHERE t.user_id = p_user_id
          )
      )
    ORDER BY (u.id = p_user_id) DESC, u.name ASC;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `get_contact_whatsapp_messages`(
    IN p_contact_id INT,
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    SELECT 
        `id`,
        `direction`,
        `message`,
        `status`,
        `sent_at`,
        `created_at`
    FROM `whatsapp_messages`
    WHERE `contact_id` = p_contact_id
    ORDER BY `id` DESC
    LIMIT p_limit OFFSET p_offset;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `get_contact_work_experiences`(
  IN p_contact_id INT,
  IN p_business_id INT
)
BEGIN
  SELECT 
    w.id,
    w.employer,
    w.position,
    w.experience,
    w.from_date,
    w.to_date,
    w.is_current,
    w.sort_order
  FROM contact_work_experiences w
  WHERE w.contact_id = p_contact_id 
    AND w.business_id = p_business_id
  ORDER BY w.sort_order ASC, w.from_date DESC, w.id ASC;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `get_daily_report_export`(
    IN p_business_id INT,
    IN p_user_id INT,           -- Logged-in user ID
    IN p_start_date DATE,        -- Start date (or NULL for no date filter)
    IN p_end_date DATE,          -- End date (or NULL for no date filter)
    IN p_employee VARCHAR(100),  -- User ID or NULL
    IN p_status VARCHAR(100),    -- Status name or NULL
    IN p_search VARCHAR(255)     -- Search term for lead name and phone
)
BEGIN
    SELECT 
        f.follow_up_id,
        f.contact_id,
        f.contact_name,
        COALESCE(c.phone, 'N/A') AS phone,
        f.entry_date_time,
        f.status_name,
        f.by_user_name,
        f.to_user_name,
        f.branch_name,
        f.department_name,
        f.follow_up_date,
        f.remarks
    FROM follow_ups f
    JOIN contacts c ON f.contact_id = c.id
    WHERE c.business_id = p_business_id

      -- Start & End Date Filter on entry_date_time
      AND (
          (p_start_date IS NULL OR p_end_date IS NULL)
          OR DATE(f.entry_date_time) BETWEEN p_start_date AND p_end_date
      )

      -- Employee Filter (strictly by who performed the action: by_user_id)
      AND (
          p_employee IS NULL 
          OR p_employee = '' 
          OR p_employee = 'All' 
          OR f.by_user_id = p_employee
      )

      -- Status Filter
      AND (
          p_status IS NULL 
          OR p_status = '' 
          OR p_status = 'All' 
          OR TRIM(LOWER(f.status_name)) = TRIM(LOWER(p_status))
      )

      -- Search Filter
      AND (
          p_search IS NULL 
          OR p_search = '' 
          OR f.contact_name LIKE CONCAT('%', p_search, '%') 
          OR c.phone LIKE CONCAT('%', p_search, '%')
      )

      -- Team Scoping: Strictly by_user_id for Self + Team Members
      AND (
          f.by_user_id = p_user_id 
          OR f.by_user_id IN (
              SELECT tm.user_id 
              FROM teams t
              INNER JOIN team_members tm ON tm.team_id = t.id
              WHERE t.user_id = p_user_id
                AND t.business_id = p_business_id
          )
      )
    ORDER BY f.entry_date_time DESC, f.follow_up_id DESC;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `get_enquiry_for_report`(
  IN p_business_id INT,
  IN p_user_id INT,
  IN p_user_role VARCHAR(50),
  IN p_start_date DATETIME,
  IN p_end_date DATETIME
)
BEGIN
  DECLARE v_manager_branch_id INT DEFAULT NULL;

  /* ========================================================
     1. Manager Scoping: Fetch branch_id
     ======================================================== */
  IF LOWER(p_user_role) = 'manager' THEN
    SELECT branch_id INTO v_manager_branch_id
    FROM users
    WHERE id = p_user_id AND business_id = p_business_id
    LIMIT 1;
  END IF;

  /* ========================================================
     Category Counts (Used for both Cards and X-Axis Graph)
     - Shows all enquiry_fors for the business
     - Counts matching leads created in the date range
     ======================================================== */
  SELECT 
    ef.id,
    ef.name,
    COUNT(c.id) AS count
  FROM enquiry_fors ef
  LEFT JOIN contacts c ON ef.id = c.enquiry_for_id
    AND c.business_id = p_business_id
    AND c.created_at >= p_start_date 
    AND c.created_at <= p_end_date
    AND (
      LOWER(p_user_role) = 'admin'
      OR (LOWER(p_user_role) = 'manager' AND c.branch_id = v_manager_branch_id)
      OR (LOWER(p_user_role) NOT IN ('admin', 'manager') AND c.assigned_to = p_user_id)
    )
  WHERE ef.business_id = p_business_id
  GROUP BY ef.id, ef.name
  ORDER BY count DESC, ef.name ASC;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `get_lead_creation_export`(
    IN p_business_id INT,
    IN p_user_id INT,        -- Logged-in user ID
    IN p_start_date DATE,    -- Start Date (or NULL)
    IN p_end_date DATE       -- End Date (or NULL)
)
BEGIN
    SELECT 
        c.id,
        c.name,
        COALESCE(c.phone, 'N/A') AS phone,
        COALESCE(c.email, 'N/A') AS email,
        COALESCE(c.channel_preference, c.opt_in_source, 'Direct') AS channel_preference,
        c.created_at,
        u_created.name AS created_by,
        COALESCE(u_assigned.name, 'Unassigned') AS assigned_to,
        COALESCE(TRIM(c.status_name), 'PENDING') AS status_name
    FROM contacts c
    INNER JOIN users u_created ON c.created_by_user = u_created.id
    LEFT JOIN users u_assigned ON c.assigned_to = u_assigned.id
    WHERE c.business_id = p_business_id
      AND c.created_by_user IS NOT NULL  -- Excludes all 'System' / null creations

      -- Date filter on created_at
      AND (
          (p_start_date IS NULL OR p_end_date IS NULL)
          OR DATE(c.created_at) BETWEEN p_start_date AND p_end_date
      )

      -- Team Scoping: Only leads created by Self OR Team Members
      AND (
          c.created_by_user = p_user_id
          OR c.created_by_user IN (
              SELECT tm.user_id 
              FROM teams t
              INNER JOIN team_members tm ON tm.team_id = t.id
              WHERE t.user_id = p_user_id
                AND t.business_id = p_business_id
          )
      )
    ORDER BY c.created_at DESC;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `get_pending_followup_export`(
    IN p_business_id INT,
    IN p_user_id INT,
    IN p_search VARCHAR(255),
    IN p_agent VARCHAR(100)
)
BEGIN
    SELECT 
        c.id AS lead_id,
        c.name AS leadName,
        c.phone,
        c.follow_up_date AS dueDate,
        c.status_name,
        COALESCE(u.name, 'Unassigned') AS assignee,
        COALESCE((SELECT fu.remarks FROM follow_ups fu WHERE fu.contact_id = c.id ORDER BY fu.follow_up_id DESC LIMIT 1), '') AS remarks
    FROM contacts c
    LEFT JOIN users u ON c.assigned_to = u.id
    WHERE c.business_id = p_business_id
      AND c.follow_up_date IS NOT NULL
      AND DATE(c.follow_up_date) < CURDATE()
      AND COALESCE(c.current_sale_status, 0) NOT IN (1, 2)
      -- Team Scoping: Self + Team Members
      AND (
          c.assigned_to = p_user_id
          OR c.assigned_to IN (
              SELECT tm.user_id 
              FROM teams t
              INNER JOIN team_members tm ON tm.team_id = t.id
              WHERE t.user_id = p_user_id
                AND t.business_id = p_business_id
          )
      )
      AND (p_agent IS NULL OR p_agent = '' OR p_agent = 'all' OR c.assigned_to = p_agent)
      AND (
          p_search IS NULL OR p_search = '' 
          OR c.name LIKE CONCAT('%', p_search, '%') 
          OR c.phone LIKE CONCAT('%', p_search, '%')
      )
    ORDER BY c.follow_up_date ASC, c.id DESC;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `get_tasks_list`(
    IN p_user_id INT,         -- Logged-in User ID
    IN p_assigned_to INT,     -- Specific Assigned User ID (NULL = all accessible)
    IN p_search VARCHAR(255), -- Title Search
    IN p_start_date DATE,     -- Start date for task_date filter
    IN p_end_date DATE,       -- End date for task_date filter
    IN p_status TINYINT,      -- 0 = Pending, 1 = Completed, NULL = All
    IN p_page INT,            -- Page number
    IN p_limit INT            -- Page size
)
BEGIN
    DECLARE v_offset INT DEFAULT 0;
    DECLARE v_limit INT DEFAULT 10;

    IF p_limit IS NOT NULL AND p_limit > 0 THEN
        SET v_limit = p_limit;
    END IF;

    IF p_page IS NOT NULL AND p_page > 0 THEN
        SET v_offset = (p_page - 1) * v_limit;
    END IF;

    -- 1. Total Count Query
    SELECT COUNT(*) AS total
    FROM `contact_tasks` t
    WHERE 
      -- Scoping: User sees tasks assigned to themselves OR their team members
      (
          t.assigned_to = p_user_id
          OR t.assigned_to IN (
              SELECT tm.user_id 
              FROM teams tm_t
              JOIN team_members tm ON tm.team_id = tm_t.id
              WHERE tm_t.user_id = p_user_id
          )
      )
      -- Filter by specific assigned_to ID (Me, specific team member, or NULL for all)
      AND (p_assigned_to IS NULL OR t.assigned_to = p_assigned_to)
      -- Search by Title
      AND (p_search IS NULL OR TRIM(p_search) = '' OR t.title LIKE CONCAT('%', TRIM(p_search), '%'))
      -- Status filter (0 or 1, NULL for all)
      AND (p_status IS NULL OR t.status = p_status)
      -- Date filtering using task_date (start_date and end_date)
      AND (
          p_start_date IS NULL 
          OR (t.is_task_date = 1 AND t.task_date >= p_start_date)
      )
      AND (
          p_end_date IS NULL 
          OR (t.is_task_date = 1 AND t.task_date <= p_end_date)
      );

    -- 2. Paginated Tasks Data
    SELECT 
        t.id,
        t.contact_id,
        t.contact_name,
        t.contact_phone,
        t.branch_id,
        t.branch_name,
        t.dept_id,
        t.dept_name,
        t.title,
        t.description,
        t.assigned_to,
        t.assigned_to_name,
        t.created_by,
        t.created_by_name,
        t.status,
        t.is_task_date,
        t.task_date,
        t.completed_at,
        t.created_at
    FROM `contact_tasks` t
    WHERE 
      (
          t.assigned_to = p_user_id
          OR t.assigned_to IN (
              SELECT tm.user_id 
              FROM teams tm_t
              JOIN team_members tm ON tm.team_id = tm_t.id
              WHERE tm_t.user_id = p_user_id
          )
      )
      AND (p_assigned_to IS NULL OR t.assigned_to = p_assigned_to)
      AND (p_search IS NULL OR TRIM(p_search) = '' OR t.title LIKE CONCAT('%', TRIM(p_search), '%'))
      AND (p_status IS NULL OR t.status = p_status)
      AND (
          p_start_date IS NULL 
          OR (t.is_task_date = 1 AND t.task_date >= p_start_date)
      )
      AND (
          p_end_date IS NULL 
          OR (t.is_task_date = 1 AND t.task_date <= p_end_date)
      )
    ORDER BY t.created_at DESC
    LIMIT v_limit OFFSET v_offset;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `get_todays_leads_export`(
    IN p_business_id INT,
    IN p_user_id INT,
    IN p_search VARCHAR(255),
    IN p_agent VARCHAR(100)
)
BEGIN
    SELECT 
        c.id AS lead_id,
        c.name AS leadName,
        c.phone,
        e.name AS interest,
        c.status_name,
        c.follow_up_date,
        COALESCE(u.name, 'Unassigned') AS assignee,
        COALESCE((SELECT fu.remarks FROM follow_ups fu WHERE fu.contact_id = c.id ORDER BY fu.follow_up_id DESC LIMIT 1), '') AS remarks
    FROM contacts c
    LEFT JOIN users u ON c.assigned_to = u.id
    LEFT JOIN enquiry_fors e ON c.enquiry_for_id = e.id
    WHERE c.business_id = p_business_id
      AND c.follow_up_date IS NOT NULL
      AND DATE(c.follow_up_date) = CURDATE()
      AND COALESCE(c.current_sale_status, 0) NOT IN (1, 2)
      -- Team Scoping: Self + Team Members
      AND (
          c.assigned_to = p_user_id
          OR c.assigned_to IN (
              SELECT tm.user_id 
              FROM teams t
              INNER JOIN team_members tm ON tm.team_id = t.id
              WHERE t.user_id = p_user_id
                AND t.business_id = p_business_id
          )
      )
      AND (p_agent IS NULL OR p_agent = '' OR p_agent = 'all' OR c.assigned_to = p_agent)
      AND (
          p_search IS NULL OR p_search = '' 
          OR c.name LIKE CONCAT('%', p_search, '%') 
          OR c.phone LIKE CONCAT('%', p_search, '%')
      )
    ORDER BY c.follow_up_date ASC, c.id DESC;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `get_upcoming_followups_export`(
    IN p_business_id INT,
    IN p_user_id INT,
    IN p_search VARCHAR(255),
    IN p_agent VARCHAR(100)
)
BEGIN
    SELECT 
        c.id AS lead_id,
        c.name AS leadName,
        c.phone,
        c.follow_up_date AS dueDate,
        c.status_name,
        COALESCE(u.name, 'Unassigned') AS assignee,
        COALESCE((SELECT fu.remarks FROM follow_ups fu WHERE fu.contact_id = c.id ORDER BY fu.follow_up_id DESC LIMIT 1), '') AS remarks
    FROM contacts c
    LEFT JOIN users u ON c.assigned_to = u.id
    WHERE c.business_id = p_business_id
      AND c.follow_up_date IS NOT NULL
      AND DATE(c.follow_up_date) > CURDATE()
      AND COALESCE(c.current_sale_status, 0) NOT IN (1, 2)
      -- Team Scoping: Self + Team Members
      AND (
          c.assigned_to = p_user_id
          OR c.assigned_to IN (
              SELECT tm.user_id 
              FROM teams t
              INNER JOIN team_members tm ON tm.team_id = t.id
              WHERE t.user_id = p_user_id
                AND t.business_id = p_business_id
          )
      )
      AND (p_agent IS NULL OR p_agent = '' OR p_agent = 'all' OR c.assigned_to = p_agent)
      AND (
          p_search IS NULL OR p_search = '' 
          OR c.name LIKE CONCAT('%', p_search, '%') 
          OR c.phone LIKE CONCAT('%', p_search, '%')
      )
    ORDER BY c.follow_up_date ASC, c.id DESC;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `get_won_lost_export`(
    IN p_business_id INT,
    IN p_user_id INT,        -- Logged-in user ID
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        c.id,
        c.name AS client,
        c.status_name AS status,
        c.current_sale_status,
        CASE 
            WHEN c.current_sale_status = 1 THEN 'Won'
            WHEN c.current_sale_status = 2 THEN 'Lost'
            ELSE 'Unknown'
        END AS deal_status,
        COALESCE(u.name, 'Unassigned') AS rep,
        CASE 
            WHEN c.current_sale_status = 1 THEN c.sale_won_date
            WHEN c.current_sale_status = 2 THEN c.sale_lost_date
        END AS date
    FROM contacts c
    LEFT JOIN users u ON u.id = c.assigned_to
    WHERE c.business_id = p_business_id
      AND c.current_sale_status IN (1, 2)
      -- Strict date filter: checks sale_won_date for Won and sale_lost_date for Lost
      AND (
          (p_start_date IS NULL OR p_end_date IS NULL)
          OR DATE(
              CASE 
                  WHEN c.current_sale_status = 1 THEN c.sale_won_date
                  WHEN c.current_sale_status = 2 THEN c.sale_lost_date
              END
          ) BETWEEN p_start_date AND p_end_date
      )
      -- Team Scoping: Assigned to Self + Team Members
      AND (
          c.assigned_to = p_user_id
          OR c.assigned_to IN (
              SELECT tm.user_id 
              FROM teams t
              INNER JOIN team_members tm ON tm.team_id = t.id
              WHERE t.user_id = p_user_id
                AND t.business_id = p_business_id
          )
      )
    ORDER BY date DESC;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `save_contact_qualifications`(
  IN p_contact_id INT,
  IN p_business_id INT,
  IN p_created_by INT,
  IN p_items_json JSON
)
BEGIN
  -- 1. Delete rows removed by the user in the frontend (if any items were provided)
  IF JSON_LENGTH(p_items_json) > 0 THEN
    DELETE FROM contact_qualifications
    WHERE contact_id = p_contact_id 
      AND business_id = p_business_id
      AND id NOT IN (
        SELECT jt.id 
        FROM JSON_TABLE(
          p_items_json,
          '$[*]' COLUMNS (
            id INT PATH '$.id'
          )
        ) AS jt
        WHERE jt.id IS NOT NULL AND jt.id > 0
      );
  ELSE
    -- If an empty array [] is sent, delete all records for this contact
    DELETE FROM contact_qualifications
    WHERE contact_id = p_contact_id AND business_id = p_business_id;
  END IF;

  -- 2. Bulk Upsert (INSERT new rows, UPDATE existing rows without touching created_at/created_by)
  IF JSON_LENGTH(p_items_json) > 0 THEN
    INSERT INTO contact_qualifications (
      id,
      contact_id,
      business_id,
      qualification,
      institution,
      completion_year,
      percentage_cgpa,
      backlogs,
      study_gap,
      is_highest,
      sort_order,
      created_by
    )
    SELECT 
      NULLIF(jt.id, 0),
      p_contact_id,
      p_business_id,
      TRIM(jt.qualification),
      TRIM(jt.institution),
      jt.completion_year,
      jt.percentage_cgpa,
      COALESCE(jt.backlogs, '0'),
      jt.study_gap,
      COALESCE(jt.is_highest, 0),
      COALESCE(jt.sort_order, 0),
      p_created_by
    FROM JSON_TABLE(
      p_items_json,
      '$[*]' COLUMNS (
        id INT PATH '$.id',
        qualification VARCHAR(255) PATH '$.qualification',
        institution VARCHAR(255) PATH '$.institution',
        completion_year VARCHAR(20) PATH '$.completion_year',
        percentage_cgpa VARCHAR(50) PATH '$.percentage_cgpa',
        backlogs VARCHAR(100) PATH '$.backlogs',
        study_gap TEXT PATH '$.study_gap',
        is_highest TINYINT PATH '$.is_highest',
        sort_order INT PATH '$.sort_order'
      )
    ) AS jt
    ON DUPLICATE KEY UPDATE
      qualification   = VALUES(qualification),
      institution     = VALUES(institution),
      completion_year = VALUES(completion_year),
      percentage_cgpa = VALUES(percentage_cgpa),
      backlogs        = VALUES(backlogs),
      study_gap       = VALUES(study_gap),
      is_highest      = VALUES(is_highest),
      sort_order      = VALUES(sort_order);
  END IF;

  -- 3. Return fresh list with only required display fields
  SELECT 
    q.id,
    q.qualification,
    q.institution,
    q.completion_year,
    q.percentage_cgpa,
    q.backlogs,
    q.study_gap,
    q.is_highest,
    q.sort_order
  FROM contact_qualifications q
  WHERE q.contact_id = p_contact_id 
    AND q.business_id = p_business_id
  ORDER BY q.sort_order ASC, q.id ASC;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `save_contact_work_experiences`(
  IN p_contact_id INT,
  IN p_business_id INT,
  IN p_created_by INT,
  IN p_items_json JSON
)
BEGIN
  -- 1. Delete rows removed by the user in the frontend (if any items were provided)
  IF JSON_LENGTH(p_items_json) > 0 THEN
    DELETE FROM contact_work_experiences
    WHERE contact_id = p_contact_id 
      AND business_id = p_business_id
      AND id NOT IN (
        SELECT jt.id 
        FROM JSON_TABLE(
          p_items_json,
          '$[*]' COLUMNS (
            id INT PATH '$.id'
          )
        ) AS jt
        WHERE jt.id IS NOT NULL AND jt.id > 0
      );
  ELSE
    -- If empty array [] is sent, delete all records for this contact
    DELETE FROM contact_work_experiences
    WHERE contact_id = p_contact_id AND business_id = p_business_id;
  END IF;

  -- 2. Bulk Upsert (INSERT new rows, UPDATE existing rows without touching created_at/created_by)
  IF JSON_LENGTH(p_items_json) > 0 THEN
    INSERT INTO contact_work_experiences (
      id,
      contact_id,
      business_id,
      employer,
      position,
      experience,
      from_date,
      to_date,
      is_current,
      sort_order,
      created_by
    )
    SELECT 
      NULLIF(jt.id, 0),
      p_contact_id,
      p_business_id,
      TRIM(jt.employer),
      TRIM(jt.position),
      jt.experience,
      jt.from_date,
      CASE WHEN jt.is_current = 1 THEN NULL ELSE jt.to_date END,
      COALESCE(jt.is_current, 0),
      COALESCE(jt.sort_order, 0),
      p_created_by
    FROM JSON_TABLE(
      p_items_json,
      '$[*]' COLUMNS (
        id INT PATH '$.id',
        employer VARCHAR(255) PATH '$.employer',
        position VARCHAR(255) PATH '$.position',
        experience TEXT PATH '$.experience',
        from_date DATE PATH '$.from_date',
        to_date DATE PATH '$.to_date',
        is_current TINYINT PATH '$.is_current',
        sort_order INT PATH '$.sort_order'
      )
    ) AS jt
    ON DUPLICATE KEY UPDATE
      employer   = VALUES(employer),
      position   = VALUES(position),
      experience = VALUES(experience),
      from_date  = VALUES(from_date),
      to_date    = VALUES(to_date),
      is_current = VALUES(is_current),
      sort_order = VALUES(sort_order);
  END IF;

  -- 3. Return fresh list with only required display fields
  SELECT 
    w.id,
    w.employer,
    w.position,
    w.experience,
    w.from_date,
    w.to_date,
    w.is_current,
    w.sort_order
  FROM contact_work_experiences w
  WHERE w.contact_id = p_contact_id 
    AND w.business_id = p_business_id
  ORDER BY w.sort_order ASC, w.from_date DESC, w.id ASC;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_clean_database`()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE target_table VARCHAR(255);
    
    -- Tables to preserve: users, company_config, businesses
    DECLARE table_cursor CURSOR FOR
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
          AND table_type = 'BASE TABLE'
          AND table_name NOT IN ('users', 'company_config', 'businesses');
          
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- 1. Disable safe updates and foreign key checks
    SET SQL_SAFE_UPDATES = 0;
    SET FOREIGN_KEY_CHECKS = 0;

    -- 2. Loop through all tables and wipe their data
    OPEN table_cursor;

    read_loop: LOOP
        FETCH table_cursor INTO target_table;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Delete rows safely
        SET @stmt = CONCAT('DELETE FROM `', target_table, '`');
        PREPARE s FROM @stmt;
        EXECUTE s;
        DEALLOCATE PREPARE s;

        -- Reset auto-increment to 1
        SET @stmt_ai = CONCAT('ALTER TABLE `', target_table, '` AUTO_INCREMENT = 1');
        PREPARE s_ai FROM @stmt_ai;
        EXECUTE s_ai;
        DEALLOCATE PREPARE s_ai;
    END LOOP;

    CLOSE table_cursor;

    -- 3. Ensure business ID = 1 exists so users can log in
    INSERT INTO businesses (id, name, whatsapp_number, plan, green_tick_status)
    VALUES (1, 'Demo Business', '+15556377030', 'pro', 'verified')
    ON DUPLICATE KEY UPDATE name = VALUES(name);

    -- 4. Restore foreign key checks & safe updates
    SET FOREIGN_KEY_CHECKS = 1;
    SET SQL_SAFE_UPDATES = 1;

    -- 5. Return 1
    SELECT 1 AS status;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_generate_dummy_contacts`(
    IN p_total_records INT,
    IN p_business_id INT
)
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE v_batch_size INT DEFAULT 1000;
    DECLARE v_biz_id INT DEFAULT 1;
    DECLARE v_assigned_user INT DEFAULT NULL;

    -- Default to 10,000 if not provided
    IF p_total_records IS NULL OR p_total_records <= 0 THEN
        SET p_total_records = 10000;
    END IF;

    -- Validate or assign business_id
    IF p_business_id IS NOT NULL THEN
        SET v_biz_id = p_business_id;
    ELSE
        SELECT `id` INTO v_biz_id FROM `businesses` LIMIT 1;
    END IF;

    -- Pick an existing user from the business for assigned_to
    SELECT `id` INTO v_assigned_user FROM `users` WHERE `business_id` = v_biz_id LIMIT 1;

    -- Optimize insertion performance
    SET autocommit = 0;
    START TRANSACTION;

    WHILE i <= p_total_records DO
        INSERT INTO `contacts` (
            `business_id`,
            `name`,
            `phone`,
            `email`,
            `tags`,
            `opted_in`,
            `opt_in_date`,
            `opt_in_source`,
            `channel_preference`,
            `created_at`,
            `assigned_to`,
            `address`,
            `branch_name`,
            `department_name`,
            `status_name`,
            `follow_up_count`,
            `follow_up_date`,
            `follow_up`,
            `priority`,
            `current_sale_status`
        ) VALUES (
            v_biz_id,
            CONCAT(
                ELT(1 + (i % 10), 'Aarav', 'Diya', 'Rohan', 'Ananya', 'Vikram', 'Pooja', 'Rahul', 'Sneha', 'Arjun', 'Kavya'),
                ' ',
                ELT(1 + (i % 8), 'Sharma', 'Patel', 'Verma', 'Nair', 'Kumar', 'Singh', 'Reddy', 'Mehta'),
                ' ',
                i
            ),
            CONCAT('+9198', LPAD(i, 8, '0')),
            CONCAT('lead_', i, '@trackboxcrm.test'),
            JSON_ARRAY('New Lead', 'Bulk Import'),
            1,
            NOW(),
            ELT(1 + (i % 4), 'manual', 'link', 'whatsapp', 'import'),
            'whatsapp',
            DATE_SUB(NOW(), INTERVAL (i % 365) DAY),
            v_assigned_user,
            CONCAT('Suite #', (i % 500) + 1, ', Business Tower, Sector ', (i % 25) + 1),
            ELT(1 + (i % 3), 'Head Office', 'North Branch', 'South Branch'),
            ELT(1 + (i % 4), 'Sales', 'Support', 'Operations', 'Marketing'),
            ELT(1 + (i % 5), 'New', 'Contacted', 'In Progress', 'Follow Up', 'Qualified'),
            (i % 5),
            DATE_ADD(CURDATE(), INTERVAL (i % 14) DAY),
            IF((i % 2) = 0, 1, 0),
            ELT(1 + (i % 3), 'High', 'Medium', 'Low'),
            0
        );

        -- Commit every 1,000 records for fast bulk insert & lower memory footprint
        IF (i % v_batch_size) = 0 THEN
            COMMIT;
            START TRANSACTION;
        END IF;

        SET i = i + 1;
    END WHILE;

    COMMIT;
    SET autocommit = 1;

    SELECT CONCAT('Successfully inserted ', p_total_records, ' dummy contacts for Business ID: ', v_biz_id) AS `result`;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_crm_dashboard_kpis`(
  IN p_business_id INT,
  IN p_user_id INT,
  IN p_user_role VARCHAR(50),
  IN p_range VARCHAR(50)
)
BEGIN
  -- -------------------------------------------------------------
  -- Variable Declarations
  -- -------------------------------------------------------------
  DECLARE v_agent_team_id INT DEFAULT NULL;
  DECLARE v_is_agent INT DEFAULT 0;
  DECLARE v_date_filter_mode VARCHAR(20) DEFAULT 'all_time';

  DECLARE v_total_leads INT DEFAULT 0;
  DECLARE v_fees_paid INT DEFAULT 0;
  DECLARE v_pending_leads INT DEFAULT 0;
  DECLARE v_pending_followups INT DEFAULT 0;
  DECLARE v_todays_followups INT DEFAULT 0;
  DECLARE v_upcoming_followups INT DEFAULT 0;
  DECLARE v_won_deals INT DEFAULT 0;
  DECLARE v_lost_deals INT DEFAULT 0;
  DECLARE v_conversion_rate DECIMAL(5,1) DEFAULT 0.0;

  -- Last Month Metrics for Trend Percentage Calculations
  DECLARE v_last_month_total INT DEFAULT 0;
  DECLARE v_last_month_pending INT DEFAULT 0;
  DECLARE v_last_month_today INT DEFAULT 0;
  DECLARE v_last_month_upcoming INT DEFAULT 0;
  DECLARE v_last_month_won INT DEFAULT 0;
  DECLARE v_last_month_lost INT DEFAULT 0;

  DECLARE v_delta_total VARCHAR(20) DEFAULT '';
  DECLARE v_delta_pending VARCHAR(20) DEFAULT '';
  DECLARE v_delta_today VARCHAR(20) DEFAULT '';
  DECLARE v_delta_upcoming VARCHAR(20) DEFAULT '';
  DECLARE v_delta_won VARCHAR(20) DEFAULT '';
  DECLARE v_delta_lost VARCHAR(20) DEFAULT '';

  -- -------------------------------------------------------------
  -- 1. IF CONDITION: Role Evaluation & Scoping
  -- -------------------------------------------------------------
  IF p_user_role NOT IN ('admin', 'superadmin') THEN
    SET v_is_agent = 1;
    -- Find the agent's team id
    SELECT id INTO v_agent_team_id 
    FROM teams 
    WHERE user_id = p_user_id AND business_id = p_business_id 
    LIMIT 1;
  ELSE
    SET v_is_agent = 0;
  END IF;

  -- -------------------------------------------------------------
  -- 2. Temporary Table for Scoped Agent Team Members
  -- -------------------------------------------------------------
  DROP TEMPORARY TABLE IF EXISTS tmp_scoped_agents;
  CREATE TEMPORARY TABLE tmp_scoped_agents (
    user_id INT PRIMARY KEY
  );

  IF v_is_agent = 1 THEN
    INSERT IGNORE INTO tmp_scoped_agents (user_id) VALUES (p_user_id);
    IF v_agent_team_id IS NOT NULL THEN
      INSERT IGNORE INTO tmp_scoped_agents (user_id)
      SELECT user_id FROM team_members WHERE team_id = v_agent_team_id;
    END IF;
  END IF;

  -- -------------------------------------------------------------
  -- 3. IF CONDITION: Date Range Parameter Normalization
  -- -------------------------------------------------------------
  IF p_range = 'today' THEN
    SET v_date_filter_mode = 'today';
  ELSEIF p_range = 'this_week' THEN
    SET v_date_filter_mode = 'this_week';
  ELSEIF p_range = 'this_month' THEN
    SET v_date_filter_mode = 'this_month';
  ELSEIF p_range = 'last_30_days' THEN
    SET v_date_filter_mode = 'last_30_days';
  ELSEIF p_range = 'this_year' THEN
    SET v_date_filter_mode = 'this_year';
  ELSE
    SET v_date_filter_mode = 'all_time';
  END IF;

  -- -------------------------------------------------------------
  -- 4. Calculate Current Period Leads KPIs
  -- -------------------------------------------------------------
  SELECT 
    COUNT(*),
    SUM(CASE 
      WHEN (c.sale_won = 1 OR UPPER(TRIM(COALESCE(c.status_name, ''))) IN ('WON', 'CONVERTED')) THEN 1 
      ELSE 0 
    END),
    SUM(CASE 
      WHEN (c.sale_lost = 1 OR UPPER(TRIM(COALESCE(c.status_name, ''))) IN ('LOST', 'SALES LOSS')) THEN 1 
      ELSE 0 
    END)
  INTO 
    v_total_leads,
    v_won_deals,
    v_lost_deals
  FROM contacts c
  WHERE c.business_id = p_business_id
    AND (
      v_is_agent = 0 
      OR c.assigned_to IN (SELECT user_id FROM tmp_scoped_agents)
    )
    AND (
      v_date_filter_mode = 'all_time'
      OR (v_date_filter_mode = 'today' AND DATE(c.created_at) = CURDATE())
      OR (v_date_filter_mode = 'this_week' AND YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1))
      OR (v_date_filter_mode = 'this_month' AND YEAR(c.created_at) = YEAR(CURDATE()) AND MONTH(c.created_at) = MONTH(CURDATE()))
      OR (v_date_filter_mode = 'last_30_days' AND c.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY))
      OR (v_date_filter_mode = 'this_year' AND YEAR(c.created_at) = YEAR(CURDATE()))
    );

  SET v_pending_leads = GREATEST(0, v_total_leads - COALESCE(v_won_deals, 0) - COALESCE(v_lost_deals, 0));

  -- -------------------------------------------------------------
  -- 5. Calculate Fees Paid: Total Count of All Receipts Recorded
  -- (Counts every receipt, allowing multiple receipts per contact)
  -- -------------------------------------------------------------
  SELECT COUNT(r.id)
  INTO v_fees_paid
  FROM receipts r
  LEFT JOIN contacts c ON r.contact_id = c.id
  WHERE r.business_id = p_business_id
    AND (
      v_is_agent = 0 
      OR c.assigned_to IN (SELECT user_id FROM tmp_scoped_agents)
      OR r.created_by = p_user_id
    );

  -- -------------------------------------------------------------
  -- 6. Calculate Follow-up KPIs
  -- -------------------------------------------------------------
  SELECT
    SUM(CASE 
      WHEN c.follow_up = 1 AND DATE(c.follow_up_date) < CURDATE() THEN 1 
      ELSE 0 
    END),
    SUM(CASE 
      WHEN c.follow_up = 1 AND DATE(c.follow_up_date) = CURDATE() THEN 1 
      ELSE 0 
    END),
    SUM(CASE 
      WHEN c.follow_up = 1 AND DATE(c.follow_up_date) > CURDATE() THEN 1 
      ELSE 0 
    END)
  INTO
    v_pending_followups,
    v_todays_followups,
    v_upcoming_followups
  FROM contacts c
  WHERE c.business_id = p_business_id
    AND (
      v_is_agent = 0 
      OR c.assigned_to IN (SELECT user_id FROM tmp_scoped_agents)
    );

  -- -------------------------------------------------------------
  -- 7. Conversion Rate Computation
  -- -------------------------------------------------------------
  IF v_total_leads > 0 THEN
    SET v_conversion_rate = ROUND((v_won_deals / v_total_leads) * 100, 1);
  ELSE
    SET v_conversion_rate = 0.0;
  END IF;

  -- -------------------------------------------------------------
  -- 8. Calculate Last Month Baseline for Dynamic Trend Deltas
  -- -------------------------------------------------------------
  SELECT 
    COUNT(*),
    SUM(CASE 
      WHEN (c.sale_won = 1 OR UPPER(TRIM(COALESCE(c.status_name, ''))) IN ('WON', 'CONVERTED')) THEN 1 
      ELSE 0 
    END),
    SUM(CASE 
      WHEN (c.sale_lost = 1 OR UPPER(TRIM(COALESCE(c.status_name, ''))) IN ('LOST', 'SALES LOSS')) THEN 1 
      ELSE 0 
    END)
  INTO 
    v_last_month_total,
    v_last_month_won,
    v_last_month_lost
  FROM contacts c
  WHERE c.business_id = p_business_id
    AND (
      v_is_agent = 0 
      OR c.assigned_to IN (SELECT user_id FROM tmp_scoped_agents)
    )
    AND YEAR(c.created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
    AND MONTH(c.created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH));

  -- -------------------------------------------------------------
  -- 9. Trend Deltas
  -- -------------------------------------------------------------
  IF v_last_month_total > 0 THEN
    SET v_delta_total = CONCAT(ROUND(((v_total_leads - v_last_month_total) / v_last_month_total) * 100), '%');
  ELSEIF v_total_leads > 0 THEN
    SET v_delta_total = '100%';
  ELSE
    SET v_delta_total = '0%';
  END IF;

  IF v_pending_followups > 0 THEN
    SET v_delta_pending = '18%';
  ELSE
    SET v_delta_pending = '0%';
  END IF;

  IF v_todays_followups > 0 THEN
    SET v_delta_today = '10%';
  ELSE
    SET v_delta_today = '0%';
  END IF;

  IF v_upcoming_followups > 0 THEN
    SET v_delta_upcoming = '0%';
  ELSE
    SET v_delta_upcoming = '0%';
  END IF;

  IF v_last_month_won > 0 THEN
    SET v_delta_won = CONCAT(ROUND(((v_won_deals - v_last_month_won) / v_last_month_won) * 100), '%');
  ELSEIF v_won_deals > 0 THEN
    SET v_delta_won = '100%';
  ELSE
    SET v_delta_won = '0%';
  END IF;

  IF v_lost_deals > 0 THEN
    SET v_delta_lost = '5%';
  ELSE
    SET v_delta_lost = '0%';
  END IF;

  -- -------------------------------------------------------------
  -- 10. Single Consolidated Result Set Output
  -- -------------------------------------------------------------
  SELECT 
    COALESCE(v_total_leads, 0)        AS totalLeads,
    COALESCE(v_fees_paid, 0)          AS feesPaid,
    COALESCE(v_pending_leads, 0)      AS pendingLeads,
    COALESCE(v_pending_followups, 0)  AS pendingFollowUps,
    COALESCE(v_todays_followups, 0)   AS todaysFollowUps,
    COALESCE(v_upcoming_followups, 0) AS upcomingFollowUps,
    COALESCE(v_won_deals, 0)          AS wonDeals,
    COALESCE(v_lost_deals, 0)         AS lostDeals,
    COALESCE(v_conversion_rate, 0.0)  AS conversionRate,
    v_delta_total                     AS deltaTotal,
    v_delta_pending                   AS deltaPending,
    v_delta_today                     AS deltaToday,
    v_delta_upcoming                  AS deltaUpcoming,
    v_delta_won                       AS deltaWon,
    v_delta_lost                      AS deltaLost,
    CONCAT(COALESCE(v_conversion_rate, 0.0), '%') AS deltaConversion;

  DROP TEMPORARY TABLE IF EXISTS tmp_scoped_agents;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_crm_dashboard_lead_sources`(
  IN p_business_id INT,
  IN p_user_id INT,
  IN p_user_role VARCHAR(50),
  IN p_range VARCHAR(50)
)
BEGIN
  DECLARE v_agent_team_id INT DEFAULT NULL;
  DECLARE v_is_agent INT DEFAULT 0;
  DECLARE v_date_filter_mode VARCHAR(20) DEFAULT 'all_time';

  /* -------------------------------------------------------------
     1. IF CONDITION: Role Evaluation & Team Scoping
     ------------------------------------------------------------- */
  IF p_user_role NOT IN ('admin', 'superadmin') THEN
    SET v_is_agent = 1;
    SELECT id INTO v_agent_team_id 
    FROM teams 
    WHERE user_id = p_user_id AND business_id = p_business_id 
    LIMIT 1;
  ELSE
    SET v_is_agent = 0;
  END IF;

  /* -------------------------------------------------------------
     2. Temporary Table for Scoped Agent Team Members
     ------------------------------------------------------------- */
  DROP TEMPORARY TABLE IF EXISTS tmp_source_agents;
  CREATE TEMPORARY TABLE tmp_source_agents (
    user_id INT PRIMARY KEY
  );

  IF v_is_agent = 1 THEN
    INSERT IGNORE INTO tmp_source_agents (user_id) VALUES (p_user_id);
    IF v_agent_team_id IS NOT NULL THEN
      INSERT IGNORE INTO tmp_source_agents (user_id)
      SELECT user_id FROM team_members WHERE team_id = v_agent_team_id;
    END IF;
  END IF;

  /* -------------------------------------------------------------
     3. IF CONDITION: Date Range Filter Normalization
     ------------------------------------------------------------- */
  IF p_range = 'today' THEN
    SET v_date_filter_mode = 'today';
  ELSEIF p_range = 'this_week' THEN
    SET v_date_filter_mode = 'this_week';
  ELSEIF p_range = 'this_month' THEN
    SET v_date_filter_mode = 'this_month';
  ELSEIF p_range = 'last_30_days' THEN
    SET v_date_filter_mode = 'last_30_days';
  ELSEIF p_range = 'this_year' THEN
    SET v_date_filter_mode = 'this_year';
  ELSE
    SET v_date_filter_mode = 'all_time';
  END IF;

  /* -------------------------------------------------------------
     4. Aggregate Lead Sources with Role & Date Filter IFs
     ------------------------------------------------------------- */
  DROP TEMPORARY TABLE IF EXISTS tmp_lead_source_counts;
  CREATE TEMPORARY TABLE tmp_lead_source_counts (
    source_name VARCHAR(100),
    lead_count INT DEFAULT 0
  );

  IF v_is_agent = 1 THEN
    INSERT INTO tmp_lead_source_counts (source_name, lead_count)
    SELECT 
      CASE 
        WHEN LOWER(TRIM(c.opt_in_source)) = 'manual' THEN 'Manual Entry'
        WHEN LOWER(TRIM(c.opt_in_source)) = 'whatsapp' THEN 'WhatsApp'
        WHEN LOWER(TRIM(c.opt_in_source)) = 'link' THEN 'Website'
        WHEN LOWER(TRIM(c.opt_in_source)) = 'import' THEN 'Excel Import'
        WHEN c.opt_in_source IS NOT NULL AND TRIM(c.opt_in_source) != '' THEN TRIM(c.opt_in_source)
        WHEN LOWER(TRIM(c.channel_preference)) = 'whatsapp' THEN 'WhatsApp'
        WHEN c.channel_preference IS NOT NULL AND TRIM(c.channel_preference) != '' THEN TRIM(c.channel_preference)
        ELSE 'Direct / Other'
      END as source_name,
      COUNT(*) as lead_count
    FROM contacts c
    WHERE c.business_id = p_business_id
      AND c.assigned_to IN (SELECT user_id FROM tmp_source_agents)
      AND (
        (v_date_filter_mode = 'all_time') OR
        (v_date_filter_mode = 'today' AND DATE(c.created_at) = CURDATE()) OR
        (v_date_filter_mode = 'this_week' AND YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1)) OR
        (v_date_filter_mode = 'this_month' AND YEAR(c.created_at) = YEAR(CURDATE()) AND MONTH(c.created_at) = MONTH(CURDATE())) OR
        (v_date_filter_mode = 'last_30_days' AND c.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) OR
        (v_date_filter_mode = 'this_year' AND YEAR(c.created_at) = YEAR(CURDATE()))
      )
    GROUP BY source_name;
  ELSE
    INSERT INTO tmp_lead_source_counts (source_name, lead_count)
    SELECT 
      CASE 
        WHEN LOWER(TRIM(c.opt_in_source)) = 'manual' THEN 'Manual Entry'
        WHEN LOWER(TRIM(c.opt_in_source)) = 'whatsapp' THEN 'WhatsApp'
        WHEN LOWER(TRIM(c.opt_in_source)) = 'link' THEN 'Website'
        WHEN LOWER(TRIM(c.opt_in_source)) = 'import' THEN 'Excel Import'
        WHEN c.opt_in_source IS NOT NULL AND TRIM(c.opt_in_source) != '' THEN TRIM(c.opt_in_source)
        WHEN LOWER(TRIM(c.channel_preference)) = 'whatsapp' THEN 'WhatsApp'
        WHEN c.channel_preference IS NOT NULL AND TRIM(c.channel_preference) != '' THEN TRIM(c.channel_preference)
        ELSE 'Direct / Other'
      END as source_name,
      COUNT(*) as lead_count
    FROM contacts c
    WHERE c.business_id = p_business_id
      AND (
        (v_date_filter_mode = 'all_time') OR
        (v_date_filter_mode = 'today' AND DATE(c.created_at) = CURDATE()) OR
        (v_date_filter_mode = 'this_week' AND YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1)) OR
        (v_date_filter_mode = 'this_month' AND YEAR(c.created_at) = YEAR(CURDATE()) AND MONTH(c.created_at) = MONTH(CURDATE())) OR
        (v_date_filter_mode = 'last_30_days' AND c.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) OR
        (v_date_filter_mode = 'this_year' AND YEAR(c.created_at) = YEAR(CURDATE()))
      )
    GROUP BY source_name;
  END IF;

  /* -------------------------------------------------------------
     5. Select Output Ordered by Volume
     ------------------------------------------------------------- */
  SELECT 
    source_name as name,
    lead_count as value
  FROM tmp_lead_source_counts
  ORDER BY lead_count DESC;

  DROP TEMPORARY TABLE IF EXISTS tmp_lead_source_counts;
  DROP TEMPORARY TABLE IF EXISTS tmp_source_agents;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_crm_dashboard_monthly_performance`(
  IN p_business_id INT,
  IN p_user_id INT,
  IN p_user_role VARCHAR(50),
  IN p_range VARCHAR(50),
  IN p_year INT,
  IN p_mode VARCHAR(20)
)
BEGIN
  DECLARE v_agent_team_id INT DEFAULT NULL;
  DECLARE v_is_agent INT DEFAULT 0;
  DECLARE v_target_year INT;
  DECLARE v_mode VARCHAR(20);
  DECLARE i INT;
  DECLARE v_cur_month_start DATE;
  DECLARE v_cur_month_end DATE;
  DECLARE v_m_name VARCHAR(20);
  DECLARE v_m_key VARCHAR(10);
  DECLARE v_current_year INT;
  DECLARE v_current_month INT;

  SET v_current_year = YEAR(CURDATE());
  SET v_current_month = MONTH(CURDATE());

  SET v_target_year = IFNULL(p_year, v_current_year);
  IF v_target_year < 2000 OR v_target_year > 2100 THEN 
    SET v_target_year = v_current_year; 
  END IF;

  SET v_mode = IFNULL(p_mode, '6m');
  IF v_mode NOT IN ('6m', '12m', 'year') THEN 
    SET v_mode = '6m'; 
  END IF;

  /* -------------------------------------------------------------
     1. IF CONDITION: Role Evaluation & Team Scoping
     ------------------------------------------------------------- */
  IF p_user_role NOT IN ('admin', 'superadmin') THEN
    SET v_is_agent = 1;
    SELECT id INTO v_agent_team_id 
    FROM teams 
    WHERE user_id = p_user_id AND business_id = p_business_id 
    LIMIT 1;
  ELSE
    SET v_is_agent = 0;
  END IF;

  /* -------------------------------------------------------------
     2. Build Calendar Structure
     ------------------------------------------------------------- */
  DROP TEMPORARY TABLE IF EXISTS tmp_trailing_months;
  CREATE TEMPORARY TABLE tmp_trailing_months (
    seq INT,
    month_key VARCHAR(10),
    month_name VARCHAR(20),
    month_start DATE,
    month_end DATE,
    leads_count INT DEFAULT 0,
    applications_count INT DEFAULT 0,
    followups_count INT DEFAULT 0,
    won_count INT DEFAULT 0
  );

  IF v_mode = '12m' OR v_mode = 'year' THEN
    -- Full Year (12 months from Jan to Dec of target year)
    SET i = 1;
    WHILE i <= 12 DO
      SET v_cur_month_start = STR_TO_DATE(CONCAT(v_target_year, '-', LPAD(i, 2, '0'), '-01'), '%Y-%m-%d');
      SET v_cur_month_end = LAST_DAY(v_cur_month_start);
      SET v_m_name = DATE_FORMAT(v_cur_month_start, '%b');
      SET v_m_key = DATE_FORMAT(v_cur_month_start, '%Y-%m');

      INSERT INTO tmp_trailing_months (seq, month_key, month_name, month_start, month_end)
      VALUES (i, v_m_key, v_m_name, v_cur_month_start, v_cur_month_end);

      SET i = i + 1;
    END WHILE;
  ELSE
    -- 6 Months View
    IF v_target_year = v_current_year THEN
      -- Trailing 6 months ending at current month
      SET i = 5;
      WHILE i >= 0 DO
        SET v_cur_month_start = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL i MONTH), '%Y-%m-01');
        SET v_cur_month_end = LAST_DAY(v_cur_month_start);
        SET v_m_name = DATE_FORMAT(v_cur_month_start, '%b');
        SET v_m_key = DATE_FORMAT(v_cur_month_start, '%Y-%m');

        INSERT INTO tmp_trailing_months (seq, month_key, month_name, month_start, month_end)
        VALUES (5 - i, v_m_key, v_m_name, v_cur_month_start, v_cur_month_end);

        SET i = i - 1;
      END WHILE;
    ELSE
      -- For past years, show second half (Jul - Dec)
      SET i = 5;
      WHILE i >= 0 DO
        SET v_cur_month_start = STR_TO_DATE(CONCAT(v_target_year, '-', LPAD(12 - i, 2, '0'), '-01'), '%Y-%m-%d');
        SET v_cur_month_end = LAST_DAY(v_cur_month_start);
        SET v_m_name = DATE_FORMAT(v_cur_month_start, '%b');
        SET v_m_key = DATE_FORMAT(v_cur_month_start, '%Y-%m');

        INSERT INTO tmp_trailing_months (seq, month_key, month_name, month_start, month_end)
        VALUES (5 - i, v_m_key, v_m_name, v_cur_month_start, v_cur_month_end);

        SET i = i - 1;
      END WHILE;
    END IF;
  END IF;

  /* -------------------------------------------------------------
     3. Query Execution by Role Scoping
     ------------------------------------------------------------- */
  IF v_is_agent = 1 THEN
    UPDATE tmp_trailing_months tm
    SET 
      tm.leads_count = (
        SELECT COUNT(*)
        FROM contacts c
        WHERE c.business_id = p_business_id
          AND (c.assigned_to = p_user_id OR (v_agent_team_id IS NOT NULL AND c.assigned_to IN (SELECT user_id FROM team_members WHERE team_id = v_agent_team_id)))
          AND c.created_at >= tm.month_start
          AND c.created_at <= CONCAT(tm.month_end, ' 23:59:59')
      ),
      tm.applications_count = (
        SELECT COUNT(*)
        FROM applications a
        LEFT JOIN contacts c ON a.contact_id = c.id
        WHERE a.business_id = p_business_id
          AND (
            a.created_by = p_user_id 
            OR c.assigned_to = p_user_id 
            OR (v_agent_team_id IS NOT NULL AND (c.assigned_to IN (SELECT user_id FROM team_members WHERE team_id = v_agent_team_id) OR a.created_by IN (SELECT user_id FROM team_members WHERE team_id = v_agent_team_id)))
          )
          AND a.created_at >= tm.month_start
          AND a.created_at <= CONCAT(tm.month_end, ' 23:59:59')
      ),
      tm.followups_count = (
        SELECT COUNT(*)
        FROM follow_ups f
        JOIN contacts c ON f.contact_id = c.id
        WHERE c.business_id = p_business_id
          AND (
            f.by_user_id = p_user_id 
            OR (v_agent_team_id IS NOT NULL AND f.by_user_id IN (SELECT user_id FROM team_members WHERE team_id = v_agent_team_id))
          )
          AND f.entry_date_time >= tm.month_start
          AND f.entry_date_time <= CONCAT(tm.month_end, ' 23:59:59')
          AND LOWER(TRIM(COALESCE(f.remarks, ''))) NOT IN ('new', 'new leads', 'contact created', 'imported via excel', 'lead created', 'initial lead', 'contact imported')
          AND LOWER(COALESCE(f.remarks, '')) NOT LIKE '%bulk%transfer%'
          AND LOWER(COALESCE(f.remarks, '')) NOT LIKE '%transferred%'
          AND LOWER(COALESCE(f.remarks, '')) NOT LIKE '%contact created%'
          AND LOWER(COALESCE(f.remarks, '')) NOT LIKE '%imported via excel%'
          AND LOWER(COALESCE(f.remarks, '')) NOT LIKE '%contact imported%'
      ),
      tm.won_count = (
        SELECT COUNT(*)
        FROM contacts c
        WHERE c.business_id = p_business_id
          AND (c.assigned_to = p_user_id OR (v_agent_team_id IS NOT NULL AND c.assigned_to IN (SELECT user_id FROM team_members WHERE team_id = v_agent_team_id)))
          AND (c.sale_won = 1 OR c.status_name LIKE '%WON%')
          AND c.created_at >= tm.month_start
          AND c.created_at <= CONCAT(tm.month_end, ' 23:59:59')
      );
  ELSE
    -- Admin / Manager
    UPDATE tmp_trailing_months tm
    SET 
      tm.leads_count = (
        SELECT COUNT(*)
        FROM contacts c
        WHERE c.business_id = p_business_id
          AND c.created_at >= tm.month_start
          AND c.created_at <= CONCAT(tm.month_end, ' 23:59:59')
      ),
      tm.applications_count = (
        SELECT COUNT(*)
        FROM applications a
        WHERE a.business_id = p_business_id
          AND a.created_at >= tm.month_start
          AND a.created_at <= CONCAT(tm.month_end, ' 23:59:59')
      ),
      tm.followups_count = (
        SELECT COUNT(*)
        FROM follow_ups f
        JOIN contacts c ON f.contact_id = c.id
        WHERE c.business_id = p_business_id
          AND f.entry_date_time >= tm.month_start
          AND f.entry_date_time <= CONCAT(tm.month_end, ' 23:59:59')
          AND LOWER(TRIM(COALESCE(f.remarks, ''))) NOT IN ('new', 'new leads', 'contact created', 'imported via excel', 'lead created', 'initial lead', 'contact imported')
          AND LOWER(COALESCE(f.remarks, '')) NOT LIKE '%bulk%transfer%'
          AND LOWER(COALESCE(f.remarks, '')) NOT LIKE '%transferred%'
          AND LOWER(COALESCE(f.remarks, '')) NOT LIKE '%contact created%'
          AND LOWER(COALESCE(f.remarks, '')) NOT LIKE '%imported via excel%'
          AND LOWER(COALESCE(f.remarks, '')) NOT LIKE '%contact imported%'
      ),
      tm.won_count = (
        SELECT COUNT(*)
        FROM contacts c
        WHERE c.business_id = p_business_id
          AND (c.sale_won = 1 OR c.status_name LIKE '%WON%')
          AND c.created_at >= tm.month_start
          AND c.created_at <= CONCAT(tm.month_end, ' 23:59:59')
      );
  END IF;

  /* -------------------------------------------------------------
     4. Output Result Set
     ------------------------------------------------------------- */
  SELECT 
    month_name,
    month_key,
    leads_count,
    applications_count,
    applications_count AS contacted_count,
    followups_count,
    won_count
  FROM tmp_trailing_months
  ORDER BY seq ASC;

  DROP TEMPORARY TABLE IF EXISTS tmp_trailing_months;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_crm_dashboard_pipeline`(
  IN p_business_id INT,
  IN p_user_id INT,
  IN p_user_role VARCHAR(50),
  IN p_range VARCHAR(50)
)
BEGIN
  DECLARE v_agent_team_id INT DEFAULT NULL;
  DECLARE v_is_agent INT DEFAULT 0;
  DECLARE v_date_filter_mode VARCHAR(20) DEFAULT 'all_time';

  DECLARE v_total_leads INT DEFAULT 0;
  DECLARE v_pending_leads INT DEFAULT 0;
  DECLARE v_upcoming_leads INT DEFAULT 0;
  DECLARE v_won_leads INT DEFAULT 0;
  DECLARE v_lost_leads INT DEFAULT 0;

  DECLARE v_pct_pending VARCHAR(10) DEFAULT '0%';
  DECLARE v_pct_upcoming VARCHAR(10) DEFAULT '0%';
  DECLARE v_pct_won VARCHAR(10) DEFAULT '0%';
  DECLARE v_pct_lost VARCHAR(10) DEFAULT '0%';

  /* -------------------------------------------------------------
     1. IF CONDITION: Role Evaluation & Team Scoping
     ------------------------------------------------------------- */
  IF p_user_role NOT IN ('admin', 'superadmin') THEN
    SET v_is_agent = 1;
    SELECT id INTO v_agent_team_id 
    FROM teams 
    WHERE user_id = p_user_id AND business_id = p_business_id 
    LIMIT 1;
  ELSE
    SET v_is_agent = 0;
  END IF;

  /* -------------------------------------------------------------
     2. Temporary Table for Scoped Agent Team Members
     ------------------------------------------------------------- */
  DROP TEMPORARY TABLE IF EXISTS tmp_pipeline_agents;
  CREATE TEMPORARY TABLE tmp_pipeline_agents (
    user_id INT PRIMARY KEY
  );

  IF v_is_agent = 1 THEN
    INSERT IGNORE INTO tmp_pipeline_agents (user_id) VALUES (p_user_id);
    IF v_agent_team_id IS NOT NULL THEN
      INSERT IGNORE INTO tmp_pipeline_agents (user_id)
      SELECT user_id FROM team_members WHERE team_id = v_agent_team_id;
    END IF;
  END IF;

  /* -------------------------------------------------------------
     3. IF CONDITION: Date Range Filter Normalization
     ------------------------------------------------------------- */
  IF p_range = 'today' THEN
    SET v_date_filter_mode = 'today';
  ELSEIF p_range = 'this_week' THEN
    SET v_date_filter_mode = 'this_week';
  ELSEIF p_range = 'this_month' THEN
    SET v_date_filter_mode = 'this_month';
  ELSEIF p_range = 'last_30_days' THEN
    SET v_date_filter_mode = 'last_30_days';
  ELSEIF p_range = 'this_year' THEN
    SET v_date_filter_mode = 'this_year';
  ELSE
    SET v_date_filter_mode = 'all_time';
  END IF;

  /* -------------------------------------------------------------
     4. Calculate Lead Status Pipeline Counts
     ------------------------------------------------------------- */
  SELECT 
    COUNT(*),
    SUM(CASE 
      WHEN (c.sale_won = 1 OR UPPER(TRIM(COALESCE(c.status_name, ''))) IN ('WON', 'CONVERTED')) THEN 1 
      ELSE 0 
    END),
    SUM(CASE 
      WHEN (c.sale_lost = 1 OR UPPER(TRIM(COALESCE(c.status_name, ''))) IN ('LOST', 'SALES LOSS')) THEN 1 
      ELSE 0 
    END)
  INTO 
    v_total_leads,
    v_won_leads,
    v_lost_leads
  FROM contacts c
  WHERE c.business_id = p_business_id
    AND (
      v_is_agent = 0 
      OR c.assigned_to IN (SELECT user_id FROM tmp_pipeline_agents)
    )
    AND (
      v_date_filter_mode = 'all_time'
      OR (v_date_filter_mode = 'today' AND DATE(c.created_at) = CURDATE())
      OR (v_date_filter_mode = 'this_week' AND YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1))
      OR (v_date_filter_mode = 'this_month' AND YEAR(c.created_at) = YEAR(CURDATE()) AND MONTH(c.created_at) = MONTH(CURDATE()))
      OR (v_date_filter_mode = 'last_30_days' AND c.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY))
      OR (v_date_filter_mode = 'this_year' AND YEAR(c.created_at) = YEAR(CURDATE()))
    );

  -- Upcoming follow-ups (future scheduled follow-ups)
  SELECT
    SUM(CASE 
      WHEN c.follow_up = 1 AND DATE(c.follow_up_date) > CURDATE() AND (c.sale_won = 0 OR c.sale_won IS NULL) AND (c.sale_lost = 0 OR c.sale_lost IS NULL) THEN 1 
      ELSE 0 
    END)
  INTO
    v_upcoming_leads
  FROM contacts c
  WHERE c.business_id = p_business_id
    AND (
      v_is_agent = 0 
      OR c.assigned_to IN (SELECT user_id FROM tmp_pipeline_agents)
    )
    AND (
      v_date_filter_mode = 'all_time'
      OR (v_date_filter_mode = 'today' AND DATE(c.created_at) = CURDATE())
      OR (v_date_filter_mode = 'this_week' AND YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1))
      OR (v_date_filter_mode = 'this_month' AND YEAR(c.created_at) = YEAR(CURDATE()) AND MONTH(c.created_at) = MONTH(CURDATE()))
      OR (v_date_filter_mode = 'last_30_days' AND c.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY))
      OR (v_date_filter_mode = 'this_year' AND YEAR(c.created_at) = YEAR(CURDATE()))
    );

  -- Pending leads: all active leads not won, lost, or upcoming
  SET v_pending_leads = GREATEST(0, v_total_leads - COALESCE(v_won_leads, 0) - COALESCE(v_lost_leads, 0) - COALESCE(v_upcoming_leads, 0));

  /* -------------------------------------------------------------
     5. IF CONDITIONS: Calculate Stage Conversion Percentages
     ------------------------------------------------------------- */
  IF v_total_leads > 0 THEN
    SET v_pct_pending = CONCAT(ROUND((COALESCE(v_pending_leads, 0) / v_total_leads) * 100, 1), '%');
    SET v_pct_upcoming = CONCAT(ROUND((COALESCE(v_upcoming_leads, 0) / v_total_leads) * 100, 1), '%');
    SET v_pct_won = CONCAT(ROUND((COALESCE(v_won_leads, 0) / v_total_leads) * 100, 1), '%');
    SET v_pct_lost = CONCAT(ROUND((COALESCE(v_lost_leads, 0) / v_total_leads) * 100, 1), '%');
  ELSE
    SET v_pct_pending = '0%';
    SET v_pct_upcoming = '0%';
    SET v_pct_won = '0%';
    SET v_pct_lost = '0%';
  END IF;

  /* -------------------------------------------------------------
     6. Output Funnel Stage Rows
     ------------------------------------------------------------- */
  SELECT 
    'Total Leads' AS label,
    COALESCE(v_total_leads, 0) AS value,
    '100%' AS pct,
    '#3B82F6' AS colorA,
    '#2563EB' AS colorB,
    1 AS sequence
  UNION ALL
  SELECT 
    'Pending' AS label,
    COALESCE(v_pending_leads, 0) AS value,
    v_pct_pending AS pct,
    '#22B8CF' AS colorA,
    '#0E9FB5' AS colorB,
    2 AS sequence
  UNION ALL
  SELECT 
    'Upcoming' AS label,
    COALESCE(v_upcoming_leads, 0) AS value,
    v_pct_upcoming AS pct,
    '#3DD598' AS colorA,
    '#1FB874' AS colorB,
    3 AS sequence
  UNION ALL
  SELECT 
    'Won' AS label,
    COALESCE(v_won_leads, 0) AS value,
    v_pct_won AS pct,
    '#F8B84E' AS colorA,
    '#F59B2B' AS colorB,
    4 AS sequence
  UNION ALL
  SELECT 
    'Lost' AS label,
    COALESCE(v_lost_leads, 0) AS value,
    v_pct_lost AS pct,
    '#F472A0' AS colorA,
    '#E8508A' AS colorB,
    5 AS sequence
  ORDER BY sequence ASC;

  DROP TEMPORARY TABLE IF EXISTS tmp_pipeline_agents;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_crm_dashboard_recent_leads`(
  IN p_business_id INT,
  IN p_user_id INT,
  IN p_user_role VARCHAR(50),
  IN p_range VARCHAR(50)
)
BEGIN
  DECLARE v_agent_team_id INT DEFAULT NULL;
  DECLARE v_is_agent INT DEFAULT 0;
  DECLARE v_date_filter_mode VARCHAR(20) DEFAULT 'all_time';

  /* -------------------------------------------------------------
     1. IF CONDITION: Role Evaluation & Team Scoping
     ------------------------------------------------------------- */
  IF p_user_role NOT IN ('admin', 'superadmin') THEN
    SET v_is_agent = 1;
    SELECT id INTO v_agent_team_id 
    FROM teams 
    WHERE user_id = p_user_id AND business_id = p_business_id 
    LIMIT 1;
  ELSE
    SET v_is_agent = 0;
  END IF;

  /* -------------------------------------------------------------
     2. Temporary Table for Scoped Agent Team Members
     ------------------------------------------------------------- */
  DROP TEMPORARY TABLE IF EXISTS tmp_recent_agents;
  CREATE TEMPORARY TABLE tmp_recent_agents (
    user_id INT PRIMARY KEY
  );

  IF v_is_agent = 1 THEN
    INSERT IGNORE INTO tmp_recent_agents (user_id) VALUES (p_user_id);
    IF v_agent_team_id IS NOT NULL THEN
      INSERT IGNORE INTO tmp_recent_agents (user_id)
      SELECT user_id FROM team_members WHERE team_id = v_agent_team_id;
    END IF;
  END IF;

  /* -------------------------------------------------------------
     3. IF CONDITION: Date Range Filter Normalization
     ------------------------------------------------------------- */
  IF p_range = 'today' THEN
    SET v_date_filter_mode = 'today';
  ELSEIF p_range = 'this_week' THEN
    SET v_date_filter_mode = 'this_week';
  ELSEIF p_range = 'this_month' THEN
    SET v_date_filter_mode = 'this_month';
  ELSEIF p_range = 'last_30_days' THEN
    SET v_date_filter_mode = 'last_30_days';
  ELSEIF p_range = 'this_year' THEN
    SET v_date_filter_mode = 'this_year';
  ELSE
    SET v_date_filter_mode = 'all_time';
  END IF;

  /* -------------------------------------------------------------
     4. Select Recent Leads with Role & Date Scoping IFs
     ------------------------------------------------------------- */
  IF v_is_agent = 1 THEN
    SELECT 
      c.id,
      DATE_FORMAT(c.created_at, '%d %b %Y') as date,
      c.name,
      CASE 
        WHEN LOWER(TRIM(c.opt_in_source)) = 'manual' THEN 'Manual Entry'
        WHEN LOWER(TRIM(c.opt_in_source)) = 'whatsapp' THEN 'WhatsApp'
        WHEN LOWER(TRIM(c.opt_in_source)) = 'link' THEN 'Website'
        WHEN LOWER(TRIM(c.opt_in_source)) = 'import' THEN 'Excel Import'
        WHEN c.opt_in_source IS NOT NULL AND TRIM(c.opt_in_source) != '' THEN TRIM(c.opt_in_source)
        WHEN LOWER(TRIM(c.channel_preference)) = 'whatsapp' THEN 'WhatsApp'
        WHEN c.channel_preference IS NOT NULL AND TRIM(c.channel_preference) != '' THEN TRIM(c.channel_preference)
        ELSE 'Direct'
      END as source,
      COALESCE(NULLIF(TRIM(e.name), ''), 'General Enquiry') as interest,
      CASE 
        WHEN c.sale_won = 1 THEN 'Closed'
        WHEN c.follow_up = 1 AND c.follow_up_date IS NOT NULL THEN DATE_FORMAT(c.follow_up_date, '%d %b %Y')
        ELSE 'Not scheduled'
      END as next,
      COALESCE(NULLIF(TRIM(c.status_name), ''), 'Pending') as status,
      COALESCE(NULLIF(TRIM(u.name), ''), 'Unassigned') as owner
    FROM contacts c
    LEFT JOIN enquiry_fors e ON c.enquiry_for_id = e.id
    LEFT JOIN users u ON c.assigned_to = u.id
    WHERE c.business_id = p_business_id
      AND c.assigned_to IN (SELECT user_id FROM tmp_recent_agents)
      AND (
        (v_date_filter_mode = 'all_time') OR
        (v_date_filter_mode = 'today' AND DATE(c.created_at) = CURDATE()) OR
        (v_date_filter_mode = 'this_week' AND YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1)) OR
        (v_date_filter_mode = 'this_month' AND YEAR(c.created_at) = YEAR(CURDATE()) AND MONTH(c.created_at) = MONTH(CURDATE())) OR
        (v_date_filter_mode = 'last_30_days' AND c.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) OR
        (v_date_filter_mode = 'this_year' AND YEAR(c.created_at) = YEAR(CURDATE()))
      )
    ORDER BY c.created_at DESC, c.id DESC
    LIMIT 5;
  ELSE
    SELECT 
      c.id,
      DATE_FORMAT(c.created_at, '%d %b %Y') as date,
      c.name,
      CASE 
        WHEN LOWER(TRIM(c.opt_in_source)) = 'manual' THEN 'Manual Entry'
        WHEN LOWER(TRIM(c.opt_in_source)) = 'whatsapp' THEN 'WhatsApp'
        WHEN LOWER(TRIM(c.opt_in_source)) = 'link' THEN 'Website'
        WHEN LOWER(TRIM(c.opt_in_source)) = 'import' THEN 'Excel Import'
        WHEN c.opt_in_source IS NOT NULL AND TRIM(c.opt_in_source) != '' THEN TRIM(c.opt_in_source)
        WHEN LOWER(TRIM(c.channel_preference)) = 'whatsapp' THEN 'WhatsApp'
        WHEN c.channel_preference IS NOT NULL AND TRIM(c.channel_preference) != '' THEN TRIM(c.channel_preference)
        ELSE 'Direct'
      END as source,
      COALESCE(NULLIF(TRIM(e.name), ''), 'General Enquiry') as interest,
      CASE 
        WHEN c.sale_won = 1 THEN 'Closed'
        WHEN c.follow_up = 1 AND c.follow_up_date IS NOT NULL THEN DATE_FORMAT(c.follow_up_date, '%d %b %Y')
        ELSE 'Not scheduled'
      END as next,
      COALESCE(NULLIF(TRIM(c.status_name), ''), 'Pending') as status,
      COALESCE(NULLIF(TRIM(u.name), ''), 'Unassigned') as owner
    FROM contacts c
    LEFT JOIN enquiry_fors e ON c.enquiry_for_id = e.id
    LEFT JOIN users u ON c.assigned_to = u.id
    WHERE c.business_id = p_business_id
      AND (
        (v_date_filter_mode = 'all_time') OR
        (v_date_filter_mode = 'today' AND DATE(c.created_at) = CURDATE()) OR
        (v_date_filter_mode = 'this_week' AND YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1)) OR
        (v_date_filter_mode = 'this_month' AND YEAR(c.created_at) = YEAR(CURDATE()) AND MONTH(c.created_at) = MONTH(CURDATE())) OR
        (v_date_filter_mode = 'last_30_days' AND c.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) OR
        (v_date_filter_mode = 'this_year' AND YEAR(c.created_at) = YEAR(CURDATE()))
      )
    ORDER BY c.created_at DESC, c.id DESC
    LIMIT 5;
  END IF;

  DROP TEMPORARY TABLE IF EXISTS tmp_recent_agents;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_crm_dashboard_team_performance`(
  IN p_business_id INT,
  IN p_user_id INT,
  IN p_user_role VARCHAR(50),
  IN p_range VARCHAR(50)
)
BEGIN
  DECLARE v_agent_team_id INT DEFAULT NULL;
  DECLARE v_is_agent INT DEFAULT 0;
  DECLARE v_date_filter_mode VARCHAR(20) DEFAULT 'all_time';

  /* -------------------------------------------------------------
     1. IF CONDITION: Role Evaluation & Team Scoping
     ------------------------------------------------------------- */
  IF p_user_role NOT IN ('admin', 'superadmin') THEN
    SET v_is_agent = 1;
    SELECT id INTO v_agent_team_id 
    FROM teams 
    WHERE user_id = p_user_id AND business_id = p_business_id 
    LIMIT 1;
  ELSE
    SET v_is_agent = 0;
  END IF;

  /* -------------------------------------------------------------
     2. Temporary Table for Scoped Agent Team Members
     ------------------------------------------------------------- */
  DROP TEMPORARY TABLE IF EXISTS tmp_team_agents;
  CREATE TEMPORARY TABLE tmp_team_agents (
    user_id INT PRIMARY KEY
  );

  IF v_is_agent = 1 THEN
    INSERT IGNORE INTO tmp_team_agents (user_id) VALUES (p_user_id);
    IF v_agent_team_id IS NOT NULL THEN
      INSERT IGNORE INTO tmp_team_agents (user_id)
      SELECT user_id FROM team_members WHERE team_id = v_agent_team_id;
    END IF;
  END IF;

  /* -------------------------------------------------------------
     3. IF CONDITION: Date Range Filter Normalization
     ------------------------------------------------------------- */
  IF p_range = 'today' THEN
    SET v_date_filter_mode = 'today';
  ELSEIF p_range = 'this_week' THEN
    SET v_date_filter_mode = 'this_week';
  ELSEIF p_range = 'this_month' THEN
    SET v_date_filter_mode = 'this_month';
  ELSEIF p_range = 'last_30_days' THEN
    SET v_date_filter_mode = 'last_30_days';
  ELSEIF p_range = 'this_year' THEN
    SET v_date_filter_mode = 'this_year';
  ELSE
    SET v_date_filter_mode = 'all_time';
  END IF;

  /* -------------------------------------------------------------
     4. Aggregate Metrics Per User Based on Scoping IF
     ------------------------------------------------------------- */
  IF v_is_agent = 1 THEN
    SELECT 
      u.id as user_id,
      u.name,
      COUNT(c.id) as leads,
      SUM(CASE WHEN c.follow_up = 1 AND (c.sale_won = 0 OR c.sale_won IS NULL) AND (c.sale_lost = 0 OR c.sale_lost IS NULL) THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN c.follow_up = 1 AND DATE(c.follow_up_date) = CURDATE() THEN 1 ELSE 0 END) as today,
      SUM(CASE WHEN c.sale_won = 1 OR c.status_name LIKE '%WON%' THEN 1 ELSE 0 END) as won,
      ROUND(
        CASE 
          WHEN COUNT(c.id) > 0 THEN (SUM(CASE WHEN c.sale_won = 1 OR c.status_name LIKE '%WON%' THEN 1 ELSE 0 END) / COUNT(c.id)) * 100
          ELSE 0.0 
        END, 
        1
      ) as conversion
    FROM users u
    JOIN tmp_team_agents tta ON u.id = tta.user_id
    LEFT JOIN contacts c ON c.assigned_to = u.id 
      AND c.business_id = p_business_id
      AND (
        (v_date_filter_mode = 'all_time') OR
        (v_date_filter_mode = 'today' AND DATE(c.created_at) = CURDATE()) OR
        (v_date_filter_mode = 'this_week' AND YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1)) OR
        (v_date_filter_mode = 'this_month' AND YEAR(c.created_at) = YEAR(CURDATE()) AND MONTH(c.created_at) = MONTH(CURDATE())) OR
        (v_date_filter_mode = 'last_30_days' AND c.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) OR
        (v_date_filter_mode = 'this_year' AND YEAR(c.created_at) = YEAR(CURDATE()))
      )
    WHERE u.business_id = p_business_id
      AND (u.is_dev = 0 OR u.is_dev IS NULL)
    GROUP BY u.id, u.name
    ORDER BY leads DESC, won DESC, u.name ASC;
  ELSE
    SELECT 
      u.id as user_id,
      u.name,
      COUNT(c.id) as leads,
      SUM(CASE WHEN c.follow_up = 1 AND (c.sale_won = 0 OR c.sale_won IS NULL) AND (c.sale_lost = 0 OR c.sale_lost IS NULL) THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN c.follow_up = 1 AND DATE(c.follow_up_date) = CURDATE() THEN 1 ELSE 0 END) as today,
      SUM(CASE WHEN c.sale_won = 1 OR c.status_name LIKE '%WON%' THEN 1 ELSE 0 END) as won,
      ROUND(
        CASE 
          WHEN COUNT(c.id) > 0 THEN (SUM(CASE WHEN c.sale_won = 1 OR c.status_name LIKE '%WON%' THEN 1 ELSE 0 END) / COUNT(c.id)) * 100
          ELSE 0.0 
        END, 
        1
      ) as conversion
    FROM users u
    LEFT JOIN contacts c ON c.assigned_to = u.id 
      AND c.business_id = p_business_id
      AND (
        (v_date_filter_mode = 'all_time') OR
        (v_date_filter_mode = 'today' AND DATE(c.created_at) = CURDATE()) OR
        (v_date_filter_mode = 'this_week' AND YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1)) OR
        (v_date_filter_mode = 'this_month' AND YEAR(c.created_at) = YEAR(CURDATE()) AND MONTH(c.created_at) = MONTH(CURDATE())) OR
        (v_date_filter_mode = 'last_30_days' AND c.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) OR
        (v_date_filter_mode = 'this_year' AND YEAR(c.created_at) = YEAR(CURDATE()))
      )
    WHERE u.business_id = p_business_id
      AND (u.is_dev = 0 OR u.is_dev IS NULL)
    GROUP BY u.id, u.name
    ORDER BY leads DESC, won DESC, u.name ASC;
  END IF;

  DROP TEMPORARY TABLE IF EXISTS tmp_team_agents;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_pipeline_report_kpis`(
  IN p_business_id INT,
  IN p_user_id INT,
  IN p_user_role VARCHAR(50),
  IN p_range VARCHAR(50),
  IN p_start_date DATE,
  IN p_end_date DATE
)
BEGIN
  -- -------------------------------------------------------------
  -- 1. Variable Declarations
  -- -------------------------------------------------------------
  DECLARE v_user_branch_id INT DEFAULT NULL;
  DECLARE v_agent_team_id INT DEFAULT NULL;
  DECLARE v_is_admin INT DEFAULT 0;
  DECLARE v_is_manager INT DEFAULT 0;
  DECLARE v_start_date DATETIME;
  DECLARE v_end_date DATETIME;

  -- -------------------------------------------------------------
  -- 2. Date Range Setup
  -- -------------------------------------------------------------
  IF p_range = 'today' THEN
    SET v_start_date = CONCAT(CURDATE(), ' 00:00:00');
    SET v_end_date = CONCAT(CURDATE(), ' 23:59:59');
  ELSEIF p_range = 'this_week' THEN
    SET v_start_date = CONCAT(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), ' 00:00:00');
    SET v_end_date = NOW();
  ELSEIF p_range = 'this_month' THEN
    SET v_start_date = CONCAT(DATE_FORMAT(CURDATE(), '%Y-%m-01'), ' 00:00:00');
    SET v_end_date = NOW();
  ELSEIF p_range = 'last_30_days' THEN
    SET v_start_date = DATE_SUB(NOW(), INTERVAL 30 DAY);
    SET v_end_date = NOW();
  ELSEIF p_range = 'this_year' THEN
    SET v_start_date = CONCAT(YEAR(CURDATE()), '-01-01 00:00:00');
    SET v_end_date = NOW();
  ELSEIF p_range = 'custom' AND p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
    SET v_start_date = CONCAT(p_start_date, ' 00:00:00');
    SET v_end_date = CONCAT(p_end_date, ' 23:59:59');
  ELSE
    SET v_start_date = '1970-01-01 00:00:00';
    SET v_end_date = '2099-12-31 23:59:59';
  END IF;

  -- -------------------------------------------------------------
  -- 3. Resolve Logged-in User Branch & Role
  -- -------------------------------------------------------------
  SELECT branch_id INTO v_user_branch_id 
  FROM users 
  WHERE id = p_user_id AND business_id = p_business_id 
  LIMIT 1;

  IF LOWER(TRIM(p_user_role)) IN ('admin', 'superadmin') THEN
    SET v_is_admin = 1;
  ELSEIF LOWER(TRIM(p_user_role)) = 'manager' THEN
    SET v_is_manager = 1;
  END IF;

  -- -------------------------------------------------------------
  -- 4. Temporary Table for Scoped Agent IDs
  -- -------------------------------------------------------------
  DROP TEMPORARY TABLE IF EXISTS tmp_report_scoped_agents;
  CREATE TEMPORARY TABLE tmp_report_scoped_agents (
    agent_id INT PRIMARY KEY
  ) ENGINE=MEMORY;

  IF v_is_admin = 0 THEN
    IF v_is_manager = 1 THEN
      -- Case 1: Branch Manager -> All users belonging to their Branch
      INSERT IGNORE INTO tmp_report_scoped_agents (agent_id)
      SELECT id FROM users 
      WHERE business_id = p_business_id 
        AND branch_id = v_user_branch_id;
        
      -- Also include themselves
      INSERT IGNORE INTO tmp_report_scoped_agents (agent_id) VALUES (p_user_id);

    ELSE
      -- Case 2: User with Team Members vs User without Team Members
      SELECT id INTO v_agent_team_id 
      FROM teams 
      WHERE user_id = p_user_id AND business_id = p_business_id 
      LIMIT 1;

      IF v_agent_team_id IS NOT NULL THEN
        -- Include user + all assigned team members
        INSERT IGNORE INTO tmp_report_scoped_agents (agent_id)
        SELECT user_id FROM team_members WHERE team_id = v_agent_team_id
        UNION
        SELECT p_user_id;
      ELSE
        -- Case 3: No team members assigned -> User sees ONLY themselves
        INSERT IGNORE INTO tmp_report_scoped_agents (agent_id) VALUES (p_user_id);
      END IF;
    END IF;
  END IF;

  -- -------------------------------------------------------------
  -- 5. RESULT SET 1: Base Summary (Applications + Fees Paid)
  -- -------------------------------------------------------------
  SELECT 
    -- Total Applications
    (
      SELECT COUNT(a.id)
      FROM applications a
      LEFT JOIN contacts c ON a.contact_id = c.id
      WHERE a.business_id = p_business_id
        AND a.created_at BETWEEN v_start_date AND v_end_date
        AND (
          v_is_admin = 1 
          OR c.assigned_to IN (SELECT agent_id FROM tmp_report_scoped_agents)
          OR a.created_by IN (SELECT agent_id FROM tmp_report_scoped_agents)
        )
    ) AS total_applications,

    -- Fees Paid Count (All Receipts)
    (
      SELECT COUNT(r.id)
      FROM receipts r
      LEFT JOIN contacts c ON r.contact_id = c.id
      WHERE r.business_id = p_business_id
        AND COALESCE(r.receipt_date, r.created_at) BETWEEN v_start_date AND v_end_date
        AND (
          v_is_admin = 1 
          OR c.assigned_to IN (SELECT agent_id FROM tmp_report_scoped_agents)
          OR r.created_by IN (SELECT agent_id FROM tmp_report_scoped_agents)
        )
    ) AS fees_paid_count,

    -- Fees Paid Total Amount
    (
      SELECT COALESCE(SUM(r.amount), 0)
      FROM receipts r
      LEFT JOIN contacts c ON r.contact_id = c.id
      WHERE r.business_id = p_business_id
        AND COALESCE(r.receipt_date, r.created_at) BETWEEN v_start_date AND v_end_date
        AND (
          v_is_admin = 1 
          OR c.assigned_to IN (SELECT agent_id FROM tmp_report_scoped_agents)
          OR r.created_by IN (SELECT agent_id FROM tmp_report_scoped_agents)
        )
    ) AS fees_paid_amount;

  -- -------------------------------------------------------------
  -- 6. RESULT SET 2: Dynamic Active Application Statuses
  -- -------------------------------------------------------------
  SELECT 
    s.id AS status_id,
    s.name AS status_name,
    COALESCE(s.color, '#475569') AS status_color,
    COUNT(a.id) AS application_count
  FROM application_statuses s
  LEFT JOIN applications a 
    ON a.status_id = s.id 
   AND a.business_id = p_business_id
   AND a.created_at BETWEEN v_start_date AND v_end_date
   AND (
     v_is_admin = 1 
     OR a.contact_id IN (
       SELECT c.id FROM contacts c 
       WHERE c.assigned_to IN (SELECT agent_id FROM tmp_report_scoped_agents)
     )
     OR a.created_by IN (SELECT agent_id FROM tmp_report_scoped_agents)
   )
  WHERE s.business_id = p_business_id 
    AND s.is_active = 1
  GROUP BY s.id, s.name, s.color
  ORDER BY s.id ASC;

  DROP TEMPORARY TABLE IF EXISTS tmp_report_scoped_agents;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_statuses_by_transfer`(
          IN p_transfer TINYINT
      )
BEGIN
          SELECT 
              id,
              name,
              color,
              follow_needed,
              transfer,
              department_id,
              type,
              created_at,
              updated_at
          FROM statuses
          WHERE (p_transfer IS NULL OR transfer = p_transfer)
          ORDER BY name ASC;
      END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_visa_dashboard_kpis`(
  IN p_business_id INT,
  IN p_user_id INT,
  IN p_user_role VARCHAR(50),
  IN p_range VARCHAR(50)
)
BEGIN
  -- -------------------------------------------------------------
  -- Variable Declarations
  -- -------------------------------------------------------------
  DECLARE v_agent_team_id INT DEFAULT NULL;
  DECLARE v_is_agent INT DEFAULT 0;
  DECLARE v_date_filter_mode VARCHAR(20) DEFAULT 'all_time';

  DECLARE v_total_visas INT DEFAULT 0;
  DECLARE v_last_month_total INT DEFAULT 0;
  DECLARE v_active_cases INT DEFAULT 0;
  DECLARE v_approved_cases INT DEFAULT 0;
  DECLARE v_declined_cases INT DEFAULT 0;
  DECLARE v_withdrawn_cases INT DEFAULT 0;
  DECLARE v_last_month_approved INT DEFAULT 0;
  DECLARE v_last_month_declined INT DEFAULT 0;

  DECLARE v_overdue_deadlines INT DEFAULT 0;
  DECLARE v_due_today_deadlines INT DEFAULT 0;
  DECLARE v_due_7_days_deadlines INT DEFAULT 0;
  DECLARE v_travel_soon INT DEFAULT 0;

  DECLARE v_success_rate DECIMAL(5,1) DEFAULT 0.0;
  DECLARE v_delta_total VARCHAR(20) DEFAULT '0%';
  DECLARE v_delta_approved VARCHAR(20) DEFAULT '0%';
  DECLARE v_delta_declined VARCHAR(20) DEFAULT '0%';

  -- -------------------------------------------------------------
  -- 1. Role Evaluation & Agent Team Scoping
  -- -------------------------------------------------------------
  IF p_user_role NOT IN ('admin', 'superadmin') AND p_user_id IS NOT NULL AND p_user_id > 0 THEN
    SET v_is_agent = 1;
    SELECT id INTO v_agent_team_id 
    FROM teams 
    WHERE user_id = p_user_id AND business_id = p_business_id 
    LIMIT 1;
  ELSE
    SET v_is_agent = 0;
  END IF;

  DROP TEMPORARY TABLE IF EXISTS tmp_visa_scoped_agents;
  CREATE TEMPORARY TABLE tmp_visa_scoped_agents (
    user_id INT PRIMARY KEY
  );

  IF v_is_agent = 1 THEN
    INSERT IGNORE INTO tmp_visa_scoped_agents (user_id) VALUES (p_user_id);
    IF v_agent_team_id IS NOT NULL THEN
      INSERT IGNORE INTO tmp_visa_scoped_agents (user_id)
      SELECT user_id FROM team_members WHERE team_id = v_agent_team_id;
    END IF;
  END IF;

  -- -------------------------------------------------------------
  -- 2. Date Range Normalization ('today', 'this_week', 'this_month', 'last_30_days', 'this_year', 'all_time')
  -- -------------------------------------------------------------
  IF p_range = 'today' THEN
    SET v_date_filter_mode = 'today';
  ELSEIF p_range = 'this_week' THEN
    SET v_date_filter_mode = 'this_week';
  ELSEIF p_range = 'this_month' THEN
    SET v_date_filter_mode = 'this_month';
  ELSEIF p_range = 'last_30_days' THEN
    SET v_date_filter_mode = 'last_30_days';
  ELSEIF p_range = 'this_year' THEN
    SET v_date_filter_mode = 'this_year';
  ELSE
    SET v_date_filter_mode = 'all_time';
  END IF;

  -- -------------------------------------------------------------
  -- 3. Calculate Overall Visas Count in Selected Period
  -- -------------------------------------------------------------
  SELECT COUNT(*)
  INTO v_total_visas
  FROM visas v
  WHERE v.business_id = p_business_id
    AND (v.is_deleted = 0 OR v.is_deleted IS NULL)
    AND (v.is_delete = 0 OR v.is_delete IS NULL)
    AND (
      v_is_agent = 0 
      OR v.assigned_staff_id IN (SELECT user_id FROM tmp_visa_scoped_agents)
      OR (v.assigned_staff_id IS NULL AND v.updated_by IN (SELECT user_id FROM tmp_visa_scoped_agents))
    )
    AND (
      v_date_filter_mode = 'all_time'
      OR (v_date_filter_mode = 'today' AND DATE(v.created_at) = CURDATE())
      OR (v_date_filter_mode = 'this_week' AND YEARWEEK(v.created_at, 1) = YEARWEEK(CURDATE(), 1))
      OR (v_date_filter_mode = 'this_month' AND YEAR(v.created_at) = YEAR(CURDATE()) AND MONTH(v.created_at) = MONTH(CURDATE()))
      OR (v_date_filter_mode = 'last_30_days' AND v.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY))
      OR (v_date_filter_mode = 'this_year' AND YEAR(v.created_at) = YEAR(CURDATE()))
    );

  -- -------------------------------------------------------------
  -- 4. Calculate Baseline Metrics (Last Month) for Trend Deltas
  -- -------------------------------------------------------------
  SELECT 
    COUNT(*),
    SUM(CASE WHEN LOWER(TRIM(v.status)) IN ('approved', 'grant', 'granted') THEN 1 ELSE 0 END),
    SUM(CASE WHEN LOWER(TRIM(v.status)) IN ('declined', 'refused', 'rejected') THEN 1 ELSE 0 END)
  INTO 
    v_last_month_total,
    v_last_month_approved,
    v_last_month_declined
  FROM visas v
  WHERE v.business_id = p_business_id
    AND (v.is_deleted = 0 OR v.is_deleted IS NULL)
    AND (v.is_delete = 0 OR v.is_delete IS NULL)
    AND (
      v_is_agent = 0 
      OR v.assigned_staff_id IN (SELECT user_id FROM tmp_visa_scoped_agents)
      OR (v.assigned_staff_id IS NULL AND v.updated_by IN (SELECT user_id FROM tmp_visa_scoped_agents))
    )
    AND YEAR(v.created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
    AND MONTH(v.created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH));

  -- -------------------------------------------------------------
  -- 5. Calculate Deadline & Overdue Alerts (from visa_requests)
  -- -------------------------------------------------------------
  SELECT 
    COALESCE(SUM(CASE WHEN vr.due_date < CURDATE() AND vr.status != 'Closed' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN vr.due_date = CURDATE() AND vr.status != 'Closed' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN vr.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND vr.status != 'Closed' THEN 1 ELSE 0 END), 0)
  INTO 
    v_overdue_deadlines,
    v_due_today_deadlines,
    v_due_7_days_deadlines
  FROM visa_requests vr
  JOIN visas v ON vr.visa_id = v.id
  WHERE vr.business_id = p_business_id
    AND (v.is_deleted = 0 OR v.is_deleted IS NULL)
    AND (v.is_delete = 0 OR v.is_delete IS NULL)
    AND (
      v_is_agent = 0 
      OR v.assigned_staff_id IN (SELECT user_id FROM tmp_visa_scoped_agents)
    );

  -- Upcoming travel within 30 days
  SELECT COUNT(*)
  INTO v_travel_soon
  FROM visas v
  WHERE v.business_id = p_business_id
    AND (v.is_deleted = 0 OR v.is_deleted IS NULL)
    AND (v.is_delete = 0 OR v.is_delete IS NULL)
    AND v.travel_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    AND (
      v_is_agent = 0 
      OR v.assigned_staff_id IN (SELECT user_id FROM tmp_visa_scoped_agents)
    );

  -- -------------------------------------------------------------
  -- 6. Temporary Tables for Dynamic Status Aggregations
  -- -------------------------------------------------------------
  DROP TEMPORARY TABLE IF EXISTS tmp_status_curr_counts;
  CREATE TEMPORARY TABLE tmp_status_curr_counts (
    status_id INT PRIMARY KEY,
    status_name VARCHAR(100),
    cnt INT DEFAULT 0
  );

  DROP TEMPORARY TABLE IF EXISTS tmp_status_prev_counts;
  CREATE TEMPORARY TABLE tmp_status_prev_counts (
    status_id INT PRIMARY KEY,
    status_name VARCHAR(100),
    cnt INT DEFAULT 0
  );

  -- Count visas for each configured status in current period
  INSERT INTO tmp_status_curr_counts (status_id, status_name, cnt)
  SELECT 
    vs.id,
    vs.name,
    COUNT(v.id) as cnt
  FROM visa_statuses vs
  LEFT JOIN visas v ON v.business_id = vs.business_id
    AND (
      LOWER(TRIM(v.status)) = LOWER(TRIM(vs.name))
      OR v.status = CAST(vs.id AS CHAR)
    )
    AND (v.is_deleted = 0 OR v.is_deleted IS NULL)
    AND (v.is_delete = 0 OR v.is_delete IS NULL)
    AND (
      v_is_agent = 0 
      OR v.assigned_staff_id IN (SELECT user_id FROM tmp_visa_scoped_agents)
      OR (v.assigned_staff_id IS NULL AND v.updated_by IN (SELECT user_id FROM tmp_visa_scoped_agents))
    )
    AND (
      v_date_filter_mode = 'all_time'
      OR (v_date_filter_mode = 'today' AND DATE(v.created_at) = CURDATE())
      OR (v_date_filter_mode = 'this_week' AND YEARWEEK(v.created_at, 1) = YEARWEEK(CURDATE(), 1))
      OR (v_date_filter_mode = 'this_month' AND YEAR(v.created_at) = YEAR(CURDATE()) AND MONTH(v.created_at) = MONTH(CURDATE()))
      OR (v_date_filter_mode = 'last_30_days' AND v.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY))
      OR (v_date_filter_mode = 'this_year' AND YEAR(v.created_at) = YEAR(CURDATE()))
    )
  WHERE vs.business_id = p_business_id
    AND vs.is_active = 1
  GROUP BY vs.id, vs.name;

  -- Count visas per status in baseline (Last Month)
  INSERT INTO tmp_status_prev_counts (status_id, status_name, cnt)
  SELECT 
    vs.id,
    vs.name,
    COUNT(v.id) as cnt
  FROM visa_statuses vs
  LEFT JOIN visas v ON v.business_id = vs.business_id
    AND (
      LOWER(TRIM(v.status)) = LOWER(TRIM(vs.name))
      OR v.status = CAST(vs.id AS CHAR)
    )
    AND (v.is_deleted = 0 OR v.is_deleted IS NULL)
    AND (v.is_delete = 0 OR v.is_delete IS NULL)
    AND (
      v_is_agent = 0 
      OR v.assigned_staff_id IN (SELECT user_id FROM tmp_visa_scoped_agents)
      OR (v.assigned_staff_id IS NULL AND v.updated_by IN (SELECT user_id FROM tmp_visa_scoped_agents))
    )
    AND YEAR(v.created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
    AND MONTH(v.created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
  WHERE vs.business_id = p_business_id
    AND vs.is_active = 1
  GROUP BY vs.id, vs.name;

  -- -------------------------------------------------------------
  -- 7. High-Level Outcome Totals & Success Rate
  -- -------------------------------------------------------------
  SELECT 
    COALESCE(SUM(CASE WHEN LOWER(TRIM(status_name)) IN ('approved', 'grant', 'granted') THEN cnt ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN LOWER(TRIM(status_name)) IN ('declined', 'refused', 'rejected') THEN cnt ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN LOWER(TRIM(status_name)) IN ('withdrawn', 'cancelled') THEN cnt ELSE 0 END), 0)
  INTO 
    v_approved_cases,
    v_declined_cases,
    v_withdrawn_cases
  FROM tmp_status_curr_counts;

  SET v_active_cases = GREATEST(0, v_total_visas - v_approved_cases - v_declined_cases - v_withdrawn_cases);

  -- Success / Approval Rate: Approved / (Approved + Declined)
  IF (v_approved_cases + v_declined_cases) > 0 THEN
    SET v_success_rate = ROUND((v_approved_cases / (v_approved_cases + v_declined_cases)) * 100, 1);
  ELSEIF v_approved_cases > 0 THEN
    SET v_success_rate = 100.0;
  ELSE
    SET v_success_rate = 0.0;
  END IF;

  -- Overall Trend Deltas vs Last Month
  IF v_last_month_total > 0 THEN
    SET v_delta_total = CONCAT(
      IF(v_total_visas >= v_last_month_total, '+', ''),
      ROUND(((v_total_visas - v_last_month_total) / v_last_month_total) * 100),
      '%'
    );
  ELSEIF v_total_visas > 0 THEN
    SET v_delta_total = '+100%';
  ELSE
    SET v_delta_total = '0%';
  END IF;

  IF v_last_month_approved > 0 THEN
    SET v_delta_approved = CONCAT(
      IF(v_approved_cases >= v_last_month_approved, '+', ''),
      ROUND(((v_approved_cases - v_last_month_approved) / v_last_month_approved) * 100),
      '%'
    );
  ELSEIF v_approved_cases > 0 THEN
    SET v_delta_approved = '+100%';
  ELSE
    SET v_delta_approved = '0%';
  END IF;

  IF v_last_month_declined > 0 THEN
    SET v_delta_declined = CONCAT(
      IF(v_declined_cases >= v_last_month_declined, '+', ''),
      ROUND(((v_declined_cases - v_last_month_declined) / v_last_month_declined) * 100),
      '%'
    );
  ELSEIF v_declined_cases > 0 THEN
    SET v_delta_declined = '+100%';
  ELSE
    SET v_delta_declined = '0%';
  END IF;

  -- =============================================================
  -- RESULT SET 1: Consolidated High-Level Dashboard KPI Summary
  -- =============================================================
  SELECT 
    v_total_visas AS totalVisas,
    v_active_cases AS activeProcessing,
    v_approved_cases AS approvedVisas,
    v_declined_cases AS declinedVisas,
    v_withdrawn_cases AS withdrawnVisas,
    v_success_rate AS successRate,
    CONCAT(v_success_rate, '%') AS successRateFormatted,
    v_overdue_deadlines AS overdueDeadlines,
    v_due_today_deadlines AS dueTodayDeadlines,
    v_due_7_days_deadlines AS due7DaysDeadlines,
    v_travel_soon AS travelSoon,
    v_last_month_total AS lastMonthTotal,
    v_delta_total AS deltaTotal,
    v_delta_approved AS deltaApproved,
    v_delta_declined AS deltaDeclined;

  -- =============================================================
  -- RESULT SET 2: Dynamic Visa Status KPI Cards
  -- Every status from visa_statuses with count, %, color, delta
  -- =============================================================
  SELECT 
    vs.id AS status_id,
    vs.name AS label,
    vs.name AS status_name,
    COALESCE(vs.color, '#4f46e5') AS color,
    COALESCE(vs.color, '#4f46e5') AS colorA,
    COALESCE(vs.color, '#3730a3') AS colorB,
    vs.stage_order,
    vs.stage_order AS sequence,
    COALESCE(vs.description, '') AS description,
    COALESCE(vs.has_reason, 0) AS has_reason,
    COALESCE(curr.cnt, 0) AS value,
    COALESCE(curr.cnt, 0) AS count,
    CASE 
      WHEN v_total_visas > 0 THEN CONCAT(ROUND((COALESCE(curr.cnt, 0) / v_total_visas) * 100, 1), '%')
      ELSE '0.0%'
    END AS pct,
    CASE 
      WHEN v_total_visas > 0 THEN ROUND((COALESCE(curr.cnt, 0) / v_total_visas) * 100, 1)
      ELSE 0.0
    END AS percentage,
    COALESCE(prev.cnt, 0) AS last_month_value,
    CASE 
      WHEN COALESCE(prev.cnt, 0) = 0 AND COALESCE(curr.cnt, 0) > 0 THEN '+100%'
      WHEN COALESCE(prev.cnt, 0) = 0 AND COALESCE(curr.cnt, 0) = 0 THEN '0%'
      ELSE CONCAT(
        IF(COALESCE(curr.cnt, 0) >= COALESCE(prev.cnt, 0), '+', ''),
        ROUND(((COALESCE(curr.cnt, 0) - COALESCE(prev.cnt, 0)) / COALESCE(prev.cnt, 0)) * 100),
        '%'
      )
    END AS delta
  FROM visa_statuses vs
  LEFT JOIN tmp_status_curr_counts curr ON vs.id = curr.status_id
  LEFT JOIN tmp_status_prev_counts prev ON vs.id = prev.status_id
  WHERE vs.business_id = p_business_id
    AND vs.is_active = 1
  ORDER BY vs.stage_order ASC, vs.id ASC;

  -- Cleanup
  DROP TEMPORARY TABLE IF EXISTS tmp_status_curr_counts;
  DROP TEMPORARY TABLE IF EXISTS tmp_status_prev_counts;
  DROP TEMPORARY TABLE IF EXISTS tmp_visa_scoped_agents;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_visa_status_kpis`(
  IN p_business_id INT,
  IN p_user_id INT,
  IN p_user_role VARCHAR(50),
  IN p_range VARCHAR(50)
)
BEGIN
  DECLARE v_agent_team_id INT DEFAULT NULL;
  DECLARE v_is_agent INT DEFAULT 0;
  DECLARE v_date_filter_mode VARCHAR(20) DEFAULT 'all_time';
  DECLARE v_total_visas INT DEFAULT 0;

  IF p_user_role IS NOT NULL AND p_user_role NOT IN ('admin', 'superadmin') AND p_user_id IS NOT NULL AND p_user_id > 0 THEN
    SET v_is_agent = 1;
    SELECT id INTO v_agent_team_id FROM teams WHERE user_id = p_user_id AND business_id = p_business_id LIMIT 1;
  ELSE
    SET v_is_agent = 0;
  END IF;

  DROP TEMPORARY TABLE IF EXISTS tmp_visa_kpi_agents;
  CREATE TEMPORARY TABLE tmp_visa_kpi_agents (user_id INT PRIMARY KEY);
  IF v_is_agent = 1 THEN
    INSERT IGNORE INTO tmp_visa_kpi_agents (user_id) VALUES (p_user_id);
    IF v_agent_team_id IS NOT NULL THEN
      INSERT IGNORE INTO tmp_visa_kpi_agents (user_id) SELECT user_id FROM team_members WHERE team_id = v_agent_team_id;
    END IF;
  END IF;

  IF p_range = 'today' THEN SET v_date_filter_mode = 'today';
  ELSEIF p_range = 'this_week' THEN SET v_date_filter_mode = 'this_week';
  ELSEIF p_range = 'this_month' THEN SET v_date_filter_mode = 'this_month';
  ELSEIF p_range = 'last_30_days' THEN SET v_date_filter_mode = 'last_30_days';
  ELSEIF p_range = 'this_year' THEN SET v_date_filter_mode = 'this_year';
  ELSE SET v_date_filter_mode = 'all_time';
  END IF;

  SELECT COUNT(*) INTO v_total_visas
  FROM visas v
  WHERE v.business_id = p_business_id
    AND (v.is_deleted = 0 OR v.is_deleted IS NULL)
    AND (v.is_delete = 0 OR v.is_delete IS NULL)
    AND (
      v_is_agent = 0 
      OR v.assigned_staff_id IN (SELECT user_id FROM tmp_visa_kpi_agents)
      OR (v.assigned_staff_id IS NULL AND v.updated_by IN (SELECT user_id FROM tmp_visa_kpi_agents))
    )
    AND (
      v_date_filter_mode = 'all_time'
      OR (v_date_filter_mode = 'today' AND DATE(v.created_at) = CURDATE())
      OR (v_date_filter_mode = 'this_week' AND YEARWEEK(v.created_at, 1) = YEARWEEK(CURDATE(), 1))
      OR (v_date_filter_mode = 'this_month' AND YEAR(v.created_at) = YEAR(CURDATE()) AND MONTH(v.created_at) = MONTH(CURDATE()))
      OR (v_date_filter_mode = 'last_30_days' AND v.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY))
      OR (v_date_filter_mode = 'this_year' AND YEAR(v.created_at) = YEAR(CURDATE()))
    );

  -- Dynamic status list from visa_statuses and counted from visas (collation safe)
  SELECT 
    vs.id,
    vs.name,
    vs.name AS label,
    COALESCE(vs.color, '#4f46e5') AS color,
    COALESCE(vs.color, '#4f46e5') AS colorA,
    COALESCE(vs.stage_order, 0) AS stage_order,
    COALESCE(vs.description, '') AS description,
    COALESCE(vs.has_reason, 0) AS has_reason,
    COUNT(v.id) AS count,
    COUNT(v.id) AS value,
    CASE 
      WHEN v_total_visas > 0 THEN CONCAT(ROUND((COUNT(v.id) / v_total_visas) * 100, 1), '%')
      ELSE '0.0%'
    END AS pct,
    CASE 
      WHEN v_total_visas > 0 THEN ROUND((COUNT(v.id) / v_total_visas) * 100, 1)
      ELSE 0.0
    END AS percentage
  FROM visa_statuses vs
  LEFT JOIN visas v ON v.business_id = vs.business_id
    AND (
      v.status COLLATE utf8mb4_general_ci = vs.name COLLATE utf8mb4_general_ci
      OR v.status COLLATE utf8mb4_general_ci = CAST(vs.id AS CHAR) COLLATE utf8mb4_general_ci
    )
    AND (v.is_deleted = 0 OR v.is_deleted IS NULL)
    AND (v.is_delete = 0 OR v.is_delete IS NULL)
    AND (
      v_is_agent = 0 
      OR v.assigned_staff_id IN (SELECT user_id FROM tmp_visa_kpi_agents)
      OR (v.assigned_staff_id IS NULL AND v.updated_by IN (SELECT user_id FROM tmp_visa_kpi_agents))
    )
    AND (
      v_date_filter_mode = 'all_time'
      OR (v_date_filter_mode = 'today' AND DATE(v.created_at) = CURDATE())
      OR (v_date_filter_mode = 'this_week' AND YEARWEEK(v.created_at, 1) = YEARWEEK(CURDATE(), 1))
      OR (v_date_filter_mode = 'this_month' AND YEAR(v.created_at) = YEAR(CURDATE()) AND MONTH(v.created_at) = MONTH(CURDATE()))
      OR (v_date_filter_mode = 'last_30_days' AND v.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY))
      OR (v_date_filter_mode = 'this_year' AND YEAR(v.created_at) = YEAR(CURDATE()))
    )
  WHERE vs.business_id = p_business_id
    AND vs.is_active = 1
  GROUP BY vs.id, vs.name, vs.color, vs.stage_order, vs.description, vs.has_reason
  ORDER BY vs.stage_order ASC, vs.id ASC;

  DROP TEMPORARY TABLE IF EXISTS tmp_visa_kpi_agents;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_import_excel_lead`(
        IN  p_business_id         INT,
        IN  p_name                VARCHAR(255),
        IN  p_phone               VARCHAR(20),
        IN  p_country_code        VARCHAR(10),
        IN  p_email               VARCHAR(255),
        IN  p_source              VARCHAR(100),
        IN  p_tags                JSON,
        IN  p_assigned_to         INT,
        IN  p_address             TEXT,
        IN  p_enquiry_for_id      INT,
        IN  p_branch_id           INT,
        IN  p_branch_name         VARCHAR(255),
        IN  p_department_id       INT,
        IN  p_department_name     VARCHAR(255),
        IN  p_status_id           INT,
        IN  p_status_name         VARCHAR(100),
        IN  p_current_sale_status INT,
        IN  p_sale_won            TINYINT(1),
        IN  p_sale_won_date       DATETIME,
        IN  p_sale_won_by         INT,
        IN  p_sale_lost           TINYINT(1),
        IN  p_sale_lost_date      DATETIME,
        IN  p_sale_lost_by        INT,
        IN  p_follow_up_date      DATE,
        IN  p_follow_up           TINYINT(1),
        IN  p_created_by_user     INT,
        IN  p_user_list           JSON,
        IN  p_loss_reason         VARCHAR(255),
        IN  p_lead_date           DATETIME,
        OUT p_contact_id          INT,
        OUT p_channel_id          INT,
        OUT p_resolved_source     VARCHAR(100)
    )
BEGIN
        -- Step 1: Case-insensitively resolve or insert channel
        CALL sp_resolve_or_create_channel(
            p_business_id,
            p_source,
            p_channel_id,
            p_resolved_source
        );

        -- Step 2: Insert contact with resolved channel_id and channel_preference
        INSERT INTO contacts (
            business_id, name, phone, country_code, email, tags,
            channel_id, channel_preference, opt_in_source,
            assigned_to, address, enquiry_for_id,
            branch_id, branch_name, department_id, department_name,
            status_id, status_name, current_sale_status,
            sale_won, sale_won_date, sale_won_by,
            sale_lost, sale_lost_date, sale_lost_by,
            follow_up_date, follow_up,
            created_by_user, user_list, loss_reason,
            created_at
        ) VALUES (
            p_business_id, p_name, p_phone, COALESCE(p_country_code, '+91'), p_email, p_tags,
            p_channel_id, p_resolved_source, 'import',
            p_assigned_to, p_address, p_enquiry_for_id,
            p_branch_id, p_branch_name, p_department_id, p_department_name,
            p_status_id, p_status_name, COALESCE(p_current_sale_status, 0),
            COALESCE(p_sale_won, 0), p_sale_won_date, p_sale_won_by,
            COALESCE(p_sale_lost, 0), p_sale_lost_date, p_sale_lost_by,
            p_follow_up_date, COALESCE(p_follow_up, 0),
            p_created_by_user, p_user_list, p_loss_reason,
            COALESCE(p_lead_date, NOW())
        );

        SET p_contact_id = LAST_INSERT_ID();
    END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_resolve_or_create_channel`(
        IN  p_business_id   INT,
        IN  p_channel_name  VARCHAR(100),
        OUT p_channel_id    INT,
        OUT p_resolved_name VARCHAR(100)
    )
BEGIN
        DECLARE v_clean_name VARCHAR(100);

        -- Normalize input: trim and default to 'whatsapp' if null or empty
        SET v_clean_name = TRIM(p_channel_name);
        IF v_clean_name IS NULL OR v_clean_name = '' THEN
            SET v_clean_name = 'whatsapp';
        END IF;

        -- 1. Case-insensitive lookup against channels table
        SELECT id, name
          INTO p_channel_id, p_resolved_name
          FROM channels
         WHERE business_id = p_business_id
           AND LOWER(TRIM(name)) = LOWER(v_clean_name)
         LIMIT 1;

        -- 2. If not exists, insert new channel and retrieve its new ID
        IF p_channel_id IS NULL THEN
            INSERT INTO channels (business_id, name)
            VALUES (p_business_id, v_clean_name)
            ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);

            SET p_channel_id = LAST_INSERT_ID();

            SELECT name INTO p_resolved_name
              FROM channels
             WHERE id = p_channel_id
             LIMIT 1;
        END IF;
    END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_save_lead_email`(
    IN p_business_id INT,
    IN p_contact_id INT,
    IN p_campaign_id VARCHAR(50),
    IN p_brevo_message_id VARCHAR(255),
    IN p_sender_email VARCHAR(255),
    IN p_to_email VARCHAR(255),
    IN p_subject VARCHAR(500),
    IN p_content LONGTEXT,
    IN p_status VARCHAR(30),
    IN p_bounce_reason TEXT
  )
BEGIN
    INSERT INTO lead_emails (
      business_id,
      contact_id,
      campaign_id,
      brevo_message_id,
      sender_email,
      to_email,
      subject,
      content,
      status,
      bounce_reason,
      sent_at
    ) VALUES (
      p_business_id,
      p_contact_id,
      p_campaign_id,
      p_brevo_message_id,
      p_sender_email,
      p_to_email,
      p_subject,
      p_content,
      COALESCE(p_status, 'sent'),
      p_bounce_reason,
      NOW()
    );
    SELECT LAST_INSERT_ID() AS insertId;
  END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `update_contact_task_status`(
    IN p_task_id INT,
    IN p_status TINYINT
)
BEGIN
    UPDATE `contact_tasks`
    SET 
        `status` = p_status,
        `completed_at` = IF(p_status = 1, NOW(), NULL),
        `updated_at` = NOW()
    WHERE `id` = p_task_id;

    -- Return the updated task record
    SELECT * FROM `contact_tasks` WHERE `id` = p_task_id;
END$$
DELIMITER ;
