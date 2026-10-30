-- Stored Procedure: sp_get_crm_dashboard_lead_sources
-- Retrieves Lead Source Analysis breakdown directly from the database
-- Features explicit IF conditions for role authorization, agent team scoping, and date range filters

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_get_crm_dashboard_lead_sources`$$

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
