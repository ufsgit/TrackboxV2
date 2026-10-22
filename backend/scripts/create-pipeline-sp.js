const pool = require('../src/db/pool');

async function createPipelineSp() {
  try {
    await pool.query('DROP PROCEDURE IF EXISTS sp_get_crm_dashboard_pipeline');
    console.log('Old sp_get_crm_dashboard_pipeline dropped.');

    const sql = `
CREATE PROCEDURE sp_get_crm_dashboard_pipeline(
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

  -- Scheduling status for Pending & Upcoming
  SELECT
    SUM(CASE 
      WHEN c.follow_up = 1 AND DATE(c.follow_up_date) < CURDATE() THEN 1 
      ELSE 0 
    END),
    SUM(CASE 
      WHEN c.follow_up = 1 AND DATE(c.follow_up_date) > CURDATE() THEN 1 
      ELSE 0 
    END)
  INTO
    v_pending_leads,
    v_upcoming_leads
  FROM contacts c
  WHERE c.business_id = p_business_id
    AND (
      v_is_agent = 0 
      OR c.assigned_to IN (SELECT user_id FROM tmp_pipeline_agents)
    );

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
END;
`;

    await pool.query(sql);
    console.log('Stored procedure sp_get_crm_dashboard_pipeline created successfully!');
    process.exit(0);
  } catch (e) {
    console.error('Failed to create pipeline SP:', e);
    process.exit(1);
  }
}

createPipelineSp();
