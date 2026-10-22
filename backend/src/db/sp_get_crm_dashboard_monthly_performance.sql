-- Stored Procedure: sp_get_crm_dashboard_monthly_performance
-- Returns grouped bar chart metrics for the trailing 6 months (Leads, Contacted, Follow-ups Done, Won)
-- Features explicit IF conditions for role authorization, agent team scoping, and date range filters

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_get_crm_dashboard_monthly_performance`$$

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
  IF p_user_role = 'agent' THEN
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
          AND (c.follow_up_count > 0 OR c.follow_up = 1)
          AND c.created_at >= tm.month_start
          AND c.created_at <= CONCAT(tm.month_end, ' 23:59:59')
      ),
      tm.followups_count = (
        SELECT COUNT(*)
        FROM follow_ups f
        WHERE (
          f.by_user_id = p_user_id 
          OR f.to_user_id = p_user_id 
          OR (v_agent_team_id IS NOT NULL AND (
                f.by_user_id IN (SELECT user_id FROM team_members WHERE team_id = v_agent_team_id)
                OR f.to_user_id IN (SELECT user_id FROM team_members WHERE team_id = v_agent_team_id)
             ))
        )
        AND f.entry_date_time >= tm.month_start
        AND f.entry_date_time <= CONCAT(tm.month_end, ' 23:59:59')
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
          AND (c.follow_up_count > 0 OR c.follow_up = 1)
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
