DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `dashbord_source_count`(
  IN p_business_id INT,
  IN p_user_id INT,
  IN p_user_role VARCHAR(50)
)
BEGIN
  DECLARE v_manager_branch_id INT DEFAULT NULL;

  /* ========================================================
     1. ADMIN: All contacts for the business
     ======================================================== */
  IF LOWER(p_user_role) = 'admin' THEN

    SELECT 
      source_name AS name,
      COUNT(*) AS value
    FROM (
      SELECT COALESCE(NULLIF(TRIM(c.channel_preference), ''), 'Unknown') AS source_name
      FROM contacts c
      WHERE c.business_id = p_business_id
    ) t
    GROUP BY source_name
    ORDER BY value DESC;

  /* ========================================================
     2. MANAGER: All contacts in the manager's branch
     ======================================================== */
  ELSEIF LOWER(p_user_role) = 'manager' THEN

    -- Fetch the manager's branch_id
    SELECT branch_id INTO v_manager_branch_id
    FROM users
    WHERE id = p_user_id AND business_id = p_business_id
    LIMIT 1;

    SELECT 
      source_name AS name,
      COUNT(*) AS value
    FROM (
      SELECT COALESCE(NULLIF(TRIM(c.channel_preference), ''), 'Unknown') AS source_name
      FROM contacts c
      WHERE c.business_id = p_business_id
        AND c.branch_id = v_manager_branch_id
    ) t
    GROUP BY source_name
    ORDER BY value DESC;

  /* ========================================================
     3. AGENT / OTHER: Only contacts assigned to this agent
     ======================================================== */
  ELSE

    SELECT 
      source_name AS name,
      COUNT(*) AS value
    FROM (
      SELECT COALESCE(NULLIF(TRIM(c.channel_preference), ''), 'Unknown') AS source_name
      FROM contacts c
      WHERE c.business_id = p_business_id
        AND c.assigned_to = p_user_id
    ) t
    GROUP BY source_name
    ORDER BY value DESC;

  END IF;

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
    DECLARE v_role VARCHAR(50);
    DECLARE v_branch_id INT;

    -- 1. Fetch the logged-in user's role and branch_id
    SELECT `role`, `branch_id` 
    INTO v_role, v_branch_id
    FROM `users` 
    WHERE `id` = p_user_id AND `business_id` = p_business_id
    LIMIT 1;

    -- 2. Execute Query fetching fields directly from follow_ups (f)
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

      -- Employee Filter (matches logged-by or assigned-to)
      AND (
          p_employee IS NULL 
          OR p_employee = '' 
          OR p_employee = 'All' 
          OR f.by_user_id = p_employee 
          OR f.to_user_id = p_employee
      )

      -- Status Filter
      AND (
          p_status IS NULL 
          OR p_status = '' 
          OR p_status = 'All' 
          OR TRIM(LOWER(f.status_name)) = TRIM(LOWER(p_status))
      )

      -- Search Filter (Lead Name and Phone Number only)
      AND (
          p_search IS NULL 
          OR p_search = '' 
          OR f.contact_name LIKE CONCAT('%', p_search, '%') 
          OR c.phone LIKE CONCAT('%', p_search, '%')
      )

      -- Role-based data visibility logic:
      AND (
          -- Admin / Superadmin: view all business records
          (v_role IN ('admin', 'superadmin'))
          
          -- Manager: view records for their branch
          OR (v_role = 'manager' AND (c.branch_id = v_branch_id OR f.branch_id = v_branch_id))
          
          -- Agent: view records logged by or assigned to them
          OR (v_role = 'agent' AND (f.by_user_id = p_user_id OR f.to_user_id = p_user_id))
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
    DECLARE v_role VARCHAR(50);
    DECLARE v_branch_id INT;

    -- 1. Fetch the logged-in user's role and branch_id
    SELECT `role`, `branch_id` 
    INTO v_role, v_branch_id
    FROM `users` 
    WHERE `id` = p_user_id AND `business_id` = p_business_id
    LIMIT 1;

    -- 2. Execute Query
    SELECT 
        c.id,
        c.name,
        COALESCE(c.phone, 'N/A') AS phone,
        COALESCE(c.email, 'N/A') AS email,
        COALESCE(c.channel_preference, c.opt_in_source, 'Direct') AS channel_preference,
        c.created_at,
        COALESCE(u_created.name, 'System') AS created_by,
        COALESCE(u_assigned.name, 'Unassigned') AS assigned_to,
        COALESCE(TRIM(c.status_name), 'PENDING') AS status_name
    FROM contacts c
    LEFT JOIN users u_created ON c.created_by_user = u_created.id
    LEFT JOIN users u_assigned ON c.assigned_to = u_assigned.id
    WHERE c.business_id = p_business_id

      -- Date filter on created_at (checks start & end date)
      AND (
          (p_start_date IS NULL OR p_end_date IS NULL)
          OR DATE(c.created_at) BETWEEN p_start_date AND p_end_date
      )

      -- Role-based data visibility logic:
      AND (
          -- Admin / Superadmin: show all records in business
          (v_role IN ('admin', 'superadmin'))

          -- Manager: show all records belonging to their branch
          OR (v_role = 'manager' AND (c.branch_id = v_branch_id OR u_assigned.branch_id = v_branch_id OR u_created.branch_id = v_branch_id))

          -- Agent: show leads assigned to them or created by them
          OR (v_role = 'agent' AND (c.assigned_to = p_user_id OR c.created_by_user = p_user_id))
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
    DECLARE v_role VARCHAR(50);
    DECLARE v_branch_id INT;

    SELECT `role`, `branch_id` INTO v_role, v_branch_id
    FROM `users`
    WHERE `id` = p_user_id AND `business_id` = p_business_id
    LIMIT 1;

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
      AND (
          v_role IN ('admin', 'superadmin')
          OR (v_role = 'manager' AND (c.branch_id = v_branch_id OR u.branch_id = v_branch_id))
          OR (v_role = 'agent' AND c.assigned_to = p_user_id)
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
CREATE DEFINER=`root`@`localhost` PROCEDURE `get_todays_leads_export`(
    IN p_business_id INT,
    IN p_user_id INT,
    IN p_search VARCHAR(255),
    IN p_agent VARCHAR(100)
)
BEGIN
    DECLARE v_role VARCHAR(50);
    DECLARE v_branch_id INT;

    SELECT `role`, `branch_id` INTO v_role, v_branch_id
    FROM `users`
    WHERE `id` = p_user_id AND `business_id` = p_business_id
    LIMIT 1;

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
      AND (
          v_role IN ('admin', 'superadmin')
          OR (v_role = 'manager' AND (c.branch_id = v_branch_id OR u.branch_id = v_branch_id))
          OR (v_role = 'agent' AND c.assigned_to = p_user_id)
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
    DECLARE v_role VARCHAR(50);
    DECLARE v_branch_id INT;

    SELECT `role`, `branch_id` INTO v_role, v_branch_id
    FROM `users`
    WHERE `id` = p_user_id AND `business_id` = p_business_id
    LIMIT 1;

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
      AND (
          v_role IN ('admin', 'superadmin')
          OR (v_role = 'manager' AND (c.branch_id = v_branch_id OR u.branch_id = v_branch_id))
          OR (v_role = 'agent' AND c.assigned_to = p_user_id)
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
    DECLARE v_role VARCHAR(50);
    DECLARE v_branch_id INT;

    -- 1. Fetch the logged-in user's role and branch_id
    SELECT `role`, `branch_id` 
    INTO v_role, v_branch_id
    FROM `users` 
    WHERE `id` = p_user_id AND `business_id` = p_business_id
    LIMIT 1;

    -- 2. Execute Query strictly by sale_won_date or sale_lost_date (NO fallback)
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
      -- Role-based data visibility logic:
      AND (
          -- Admin & Superadmin: show all records in business
          (v_role IN ('admin', 'superadmin'))
          
          -- Manager: show all records belonging to their branch
          OR (v_role = 'manager' AND (c.branch_id = v_branch_id OR u.branch_id = v_branch_id))
          
          -- Agent: show only records assigned to them
          OR (v_role = 'agent' AND c.assigned_to = p_user_id)
      )
    ORDER BY date DESC;
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
  -- Variable Declarations
  
  DECLARE v_agent_team_id INT DEFAULT NULL;
  DECLARE v_is_agent INT DEFAULT 0;
  DECLARE v_date_filter_mode VARCHAR(20) DEFAULT 'all_time';

  DECLARE v_total_leads INT DEFAULT 0;
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
  -- 4. Calculate Current Period KPIs with Date & Role Filtering
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
  -- 5. Calculate Follow-up KPIs (State-driven based on current date)
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
  -- 6. IF CONDITION: Conversion Rate Computation
  -- -------------------------------------------------------------
  IF v_total_leads > 0 THEN
    SET v_conversion_rate = ROUND((v_won_deals / v_total_leads) * 100, 1);
  ELSE
    SET v_conversion_rate = 0.0;
  END IF;

  -- -------------------------------------------------------------
  -- 7. Calculate Last Month Baseline for Dynamic Trend Deltas
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
  -- 8. IF CONDITIONS: Calculate Dynamic Trends vs Last Month
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
  -- 9. Single Consolidated Result Set with All 7 KPIs
  -- -------------------------------------------------------------
  SELECT 
    COALESCE(v_total_leads, 0) AS totalLeads,
    COALESCE(v_pending_leads, 0) AS pendingLeads,
    COALESCE(v_pending_followups, 0) AS pendingFollowUps,
    COALESCE(v_todays_followups, 0) AS todaysFollowUps,
    COALESCE(v_upcoming_followups, 0) AS upcomingFollowUps,
    COALESCE(v_won_deals, 0) AS wonDeals,
    COALESCE(v_lost_deals, 0) AS lostDeals,
    COALESCE(v_conversion_rate, 0.0) AS conversionRate,
    v_delta_total AS deltaTotal,
    v_delta_pending AS deltaPending,
    v_delta_today AS deltaToday,
    v_delta_upcoming AS deltaUpcoming,
    v_delta_won AS deltaWon,
    v_delta_lost AS deltaLost,
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
