-- ========================================================================
-- Stored Procedure: sp_get_visa_dashboard_kpis
-- Purpose:
--   Retrieves dynamic Visa Dashboard KPIs and Status Breakdown Cards
--   using `visas` and `visa_statuses`.
-- 
-- Features:
--   1. Dynamic Status KPI Cards generated from `visa_statuses`
--   2. Role authorization and team scoping (admin, superadmin, or agent)
--   3. Date range filters ('today', 'this_week', 'this_month', 'last_30_days', 'this_year', 'all_time')
--   4. Trend delta calculations (% change vs previous month)
--   5. Success / Approval rate computation
--   6. Integration with `visa_requests` for overdue / imminent deadline alerts
--
-- Returns 2 Result Sets:
--   Result Set 1: Consolidated KPI Summary (Total, In-Progress, Approved, Declined, Overdue, Success Rate)
--   Result Set 2: Dynamic Status Cards (Status Name, Color, Order, Visa Count, Percentage, Trend Delta)
-- ========================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_get_visa_dashboard_kpis`$$

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
    -- Find team ID if the teams table is in use
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
  -- 2. Date Range Parameter Normalization
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
  -- 3. Calculate Overall Visas Total for Current Filter
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
  -- 4. Calculate Last Month Baseline for Comparison
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
  -- 5. Calculate Deadline & Overdue Metrics (from visa_requests)
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
    status_id INT,
    status_name VARCHAR(100),
    cnt INT DEFAULT 0,
    PRIMARY KEY (status_id)
  );

  DROP TEMPORARY TABLE IF EXISTS tmp_status_prev_counts;
  CREATE TEMPORARY TABLE tmp_status_prev_counts (
    status_id INT,
    status_name VARCHAR(100),
    cnt INT DEFAULT 0,
    PRIMARY KEY (status_id)
  );

  -- Count visas per status in the selected date range
  INSERT INTO tmp_status_curr_counts (status_id, status_name, cnt)
  SELECT 
    vs.id,
    vs.name,
    COUNT(v.id) as cnt
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

  -- Count visas per status for baseline (Last Month)
  INSERT INTO tmp_status_prev_counts (status_id, status_name, cnt)
  SELECT 
    vs.id,
    vs.name,
    COUNT(v.id) as cnt
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
      OR v.assigned_staff_id IN (SELECT user_id FROM tmp_visa_scoped_agents)
      OR (v.assigned_staff_id IS NULL AND v.updated_by IN (SELECT user_id FROM tmp_visa_scoped_agents))
    )
    AND YEAR(v.created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
    AND MONTH(v.created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
  WHERE vs.business_id = p_business_id
    AND vs.is_active = 1
  GROUP BY vs.id, vs.name;

  -- -------------------------------------------------------------
  -- 7. High-Level Outcome Counts & Success Rate
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

  -- Active cases under ongoing processing (all except Approved, Declined, Withdrawn)
  SET v_active_cases = GREATEST(0, v_total_visas - v_approved_cases - v_declined_cases - v_withdrawn_cases);

  -- Success / Approval Rate: Approved / Total completed decisions (Approved + Declined)
  IF (v_approved_cases + v_declined_cases) > 0 THEN
    SET v_success_rate = ROUND((v_approved_cases / (v_approved_cases + v_declined_cases)) * 100, 1);
  ELSEIF v_approved_cases > 0 THEN
    SET v_success_rate = 100.0;
  ELSE
    SET v_success_rate = 0.0;
  END IF;

  -- Trends vs Last Month
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
  -- Returns each status configured in `visa_statuses` with its
  -- visa count, percentage, color, and trend delta
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

  -- Clean up temporary tables
  DROP TEMPORARY TABLE IF EXISTS tmp_status_curr_counts;
  DROP TEMPORARY TABLE IF EXISTS tmp_status_prev_counts;
  DROP TEMPORARY TABLE IF EXISTS tmp_visa_scoped_agents;

END$$

DELIMITER ;
