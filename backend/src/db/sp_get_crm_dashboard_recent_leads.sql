-- Stored Procedure: sp_get_crm_dashboard_recent_leads
-- Retrieves the latest 5 Recent Leads from the database
-- Features explicit IF conditions for role authorization, agent team scoping, and date range filters

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_get_crm_dashboard_recent_leads`$$

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
