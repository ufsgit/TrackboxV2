-- Stored Procedure: sp_get_crm_dashboard_monthly_performance
-- Returns grouped bar chart metrics (Leads, Applications, Follow-ups Done, Won)
-- Supports 6m trailing or 12m full year mode, role authorization, agent team scoping, and year filter

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_get_crm_dashboard_monthly_performance`$$

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
