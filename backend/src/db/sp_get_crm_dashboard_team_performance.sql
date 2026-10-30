-- Stored Procedure: sp_get_crm_dashboard_team_performance
-- Retrieves Team Performance metrics (Executive, Leads, Pending, Today, Won, Conversion)
-- Features explicit IF conditions for role authorization, agent team scoping, and date range filters

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_get_crm_dashboard_team_performance`$$

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
