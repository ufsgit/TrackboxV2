-- ========================================================================
-- Stored Procedure: sp_get_visa_status_kpis
-- Purpose:
--   Dynamically retrieves all active KPI status cards from `visa_statuses`
--   and counts the number of matching active visa cases from `visas`.
--
-- Tables:
--   - visa_statuses (Status definition: id, name, color, stage_order, description)
--   - visas (Visa records: counted by matching v.status to vs.name or vs.id)
-- ========================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_get_visa_status_kpis`$$

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

  -- 1. Role Scoping: Check if user is restricted agent or counselor
  IF p_user_role IS NOT NULL AND p_user_role NOT IN ('admin', 'superadmin') AND p_user_id IS NOT NULL AND p_user_id > 0 THEN
    SET v_is_agent = 1;
    SELECT id INTO v_agent_team_id 
    FROM teams 
    WHERE user_id = p_user_id AND business_id = p_business_id 
    LIMIT 1;
  ELSE
    SET v_is_agent = 0;
  END IF;

  DROP TEMPORARY TABLE IF EXISTS tmp_visa_kpi_agents;
  CREATE TEMPORARY TABLE tmp_visa_kpi_agents (
    user_id INT PRIMARY KEY
  );

  IF v_is_agent = 1 THEN
    INSERT IGNORE INTO tmp_visa_kpi_agents (user_id) VALUES (p_user_id);
    IF v_agent_team_id IS NOT NULL THEN
      INSERT IGNORE INTO tmp_visa_kpi_agents (user_id)
      SELECT user_id FROM team_members WHERE team_id = v_agent_team_id;
    END IF;
  END IF;

  -- 2. Date Range Normalization
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

  -- 3. Calculate Total Active Visas for Percentage Share
  SELECT COUNT(*)
  INTO v_total_visas
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

  -- 4. Dynamic KPI Selection:
  -- Takes every active status from `visa_statuses` and counts matching rows in `visas`
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
      BINARY LOWER(TRIM(v.status)) = BINARY LOWER(TRIM(vs.name))
      OR BINARY TRIM(v.status) = BINARY CAST(vs.id AS CHAR)
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
