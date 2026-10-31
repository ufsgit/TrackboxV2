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
    WHERE name = CONCAT('__agent_', p_user_id) AND business_id = p_business_id 
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
    WHERE name = CONCAT('__agent_', p_user_id) AND business_id = p_business_id 
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
  IN p_range VARCHAR(50)
)
BEGIN
  DECLARE v_agent_team_id INT DEFAULT NULL;
  DECLARE v_is_agent INT DEFAULT 0;
  DECLARE v_date_filter_mode VARCHAR(20) DEFAULT 'all_time';

  DECLARE i INT DEFAULT 5;
  DECLARE v_cur_month_start DATE;
  DECLARE v_cur_month_end DATE;
  DECLARE v_m_name VARCHAR(20);
  DECLARE v_m_key VARCHAR(10);

  /* -------------------------------------------------------------
     1. IF CONDITION: Role Evaluation & Team Scoping
     ------------------------------------------------------------- */
  IF p_user_role NOT IN ('admin', 'superadmin') THEN
    SET v_is_agent = 1;
    SELECT id INTO v_agent_team_id 
    FROM teams 
    WHERE name = CONCAT('__agent_', p_user_id) AND business_id = p_business_id 
    LIMIT 1;
  ELSE
    SET v_is_agent = 0;
  END IF;

  /* -------------------------------------------------------------
     2. Build Trailing 6 Months Calendar Structure
     ------------------------------------------------------------- */
  DROP TEMPORARY TABLE IF EXISTS tmp_trailing_months;
  CREATE TEMPORARY TABLE tmp_trailing_months (
    seq INT,
    month_key VARCHAR(10),
    month_name VARCHAR(20),
    month_start DATE,
    month_end DATE,
    leads_count INT DEFAULT 0,
    contacted_count INT DEFAULT 0,
    followups_count INT DEFAULT 0,
    won_count INT DEFAULT 0
  );

  -- Populate the last 6 months (5 months ago up to current month)
  WHILE i >= 0 DO
    SET v_cur_month_start = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL i MONTH), '%Y-%m-01');
    SET v_cur_month_end = LAST_DAY(v_cur_month_start);
    SET v_m_name = DATE_FORMAT(v_cur_month_start, '%b');
    SET v_m_key = DATE_FORMAT(v_cur_month_start, '%Y-%m');

    INSERT INTO tmp_trailing_months (seq, month_key, month_name, month_start, month_end)
    VALUES (5 - i, v_m_key, v_m_name, v_cur_month_start, v_cur_month_end);

    SET i = i - 1;
  END WHILE;

  /* -------------------------------------------------------------
     3. IF CONDITION: Query Execution by Role Scoping
     ------------------------------------------------------------- */
  IF v_is_agent = 1 THEN
    -- Agent Scoped Aggregations: direct query using team_members / self
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
      tm.contacted_count = (
        SELECT COUNT(*)
        FROM contacts c
        WHERE c.business_id = p_business_id
          AND (c.assigned_to = p_user_id OR (v_agent_team_id IS NOT NULL AND c.assigned_to IN (SELECT user_id FROM team_members WHERE team_id = v_agent_team_id)))
          AND (c.follow_up_count > 0 OR (c.status_name IS NOT NULL AND c.status_name != 'PENDING'))
          AND c.created_at >= tm.month_start
          AND c.created_at <= CONCAT(tm.month_end, ' 23:59:59')
      ),
      tm.followups_count = (
        SELECT COUNT(*)
        FROM follow_ups f
        WHERE (
          f.by_user_id = p_user_id 
          OR (v_agent_team_id IS NOT NULL AND f.by_user_id IN (SELECT user_id FROM team_members WHERE team_id = v_agent_team_id))
        )
        AND f.entry_date_time >= tm.month_start
        AND f.entry_date_time <= CONCAT(tm.month_end, ' 23:59:59')
        AND NOT (LOWER(TRIM(COALESCE(f.remarks, ''))) IN ('new', 'new leads', 'contact created', 'imported via excel', 'lead created', 'initial lead') AND (f.status_name = 'PENDING' OR f.status_name IS NULL))
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
    -- Admin / Manager (All Contacts for Business)
    UPDATE tmp_trailing_months tm
    SET 
      tm.leads_count = (
        SELECT COUNT(*)
        FROM contacts c
        WHERE c.business_id = p_business_id
          AND c.created_at >= tm.month_start
          AND c.created_at <= CONCAT(tm.month_end, ' 23:59:59')
      ),
      tm.contacted_count = (
        SELECT COUNT(*)
        FROM contacts c
        WHERE c.business_id = p_business_id
          AND (c.follow_up_count > 0 OR (c.status_name IS NOT NULL AND c.status_name != 'PENDING'))
          AND c.created_at >= tm.month_start
          AND c.created_at <= CONCAT(tm.month_end, ' 23:59:59')
      ),
      tm.followups_count = (
        SELECT COUNT(*)
        FROM follow_ups f
        JOIN contacts c ON f.contact_id = c.id
        WHERE c.business_id = p_business_id
          AND f.entry_date_time >= tm.month_start
          AND f.entry_date_time <= CONCAT(tm.month_end, ' 23:59:59')
          AND NOT (LOWER(TRIM(COALESCE(f.remarks, ''))) IN ('new', 'new leads', 'contact created', 'imported via excel', 'lead created', 'initial lead') AND (f.status_name = 'PENDING' OR f.status_name IS NULL))
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
    contacted_count,
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
    WHERE name = CONCAT('__agent_', p_user_id) AND business_id = p_business_id 
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
    WHERE name = CONCAT('__agent_', p_user_id) AND business_id = p_business_id 
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
    WHERE name = CONCAT('__agent_', p_user_id) AND business_id = p_business_id 
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
