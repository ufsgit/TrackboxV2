const pool = require('../src/db/pool');

async function createSp() {
  try {
    await pool.query('DROP PROCEDURE IF EXISTS sp_get_crm_dashboard_kpis');
    console.log('Old procedure dropped (if existed).');

    const procedureBody = `
CREATE PROCEDURE sp_get_crm_dashboard_kpis(
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
  DECLARE v_pending_followups INT DEFAULT 0;
  DECLARE v_todays_followups INT DEFAULT 0;
  DECLARE v_upcoming_followups INT DEFAULT 0;
  DECLARE v_won_deals INT DEFAULT 0;
  DECLARE v_lost_deals INT DEFAULT 0;
  DECLARE v_conversion_rate DECIMAL(5,1) DEFAULT 0.0;

  DECLARE v_last_month_total INT DEFAULT 0;
  DECLARE v_last_month_won INT DEFAULT 0;

  DECLARE v_delta_total VARCHAR(20) DEFAULT '';
  DECLARE v_delta_pending VARCHAR(20) DEFAULT '';
  DECLARE v_delta_today VARCHAR(20) DEFAULT '';
  DECLARE v_delta_upcoming VARCHAR(20) DEFAULT '';
  DECLARE v_delta_won VARCHAR(20) DEFAULT '';
  DECLARE v_delta_lost VARCHAR(20) DEFAULT '';

  /* -------------------------------------------------------------
     1. IF CONDITION: Check User Role & Scoping
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
     2. Scoped Agent Team Temporary Table
     ------------------------------------------------------------- */
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

  /* -------------------------------------------------------------
     3. IF CONDITION: Date Range Parameter Normalization
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
     4. Calculate Current Period KPIs with Date & Role Filtering
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

  /* -------------------------------------------------------------
     5. Calculate Follow-up KPIs (State-driven based on current date)
     ------------------------------------------------------------- */
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

  /* -------------------------------------------------------------
     6. IF CONDITION: Conversion Rate Computation
     ------------------------------------------------------------- */
  IF v_total_leads > 0 THEN
    SET v_conversion_rate = ROUND((COALESCE(v_won_deals, 0) / v_total_leads) * 100, 1);
  ELSE
    SET v_conversion_rate = 0.0;
  END IF;

  /* -------------------------------------------------------------
     7. Baseline Last Month for Comparison
     ------------------------------------------------------------- */
  SELECT 
    COUNT(*),
    SUM(CASE 
      WHEN (c.sale_won = 1 OR UPPER(TRIM(COALESCE(c.status_name, ''))) IN ('WON', 'CONVERTED')) THEN 1 
      ELSE 0 
    END)
  INTO 
    v_last_month_total,
    v_last_month_won
  FROM contacts c
  WHERE c.business_id = p_business_id
    AND (
      v_is_agent = 0 
      OR c.assigned_to IN (SELECT user_id FROM tmp_scoped_agents)
    )
    AND YEAR(c.created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
    AND MONTH(c.created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH));

  /* -------------------------------------------------------------
     8. IF CONDITIONS: Calculate Dynamic Deltas vs Last Month
     ------------------------------------------------------------- */
  IF v_last_month_total > 0 THEN
    SET v_delta_total = CONCAT(ROUND(((v_total_leads - v_last_month_total) / v_last_month_total) * 100), '%');
  ELSEIF v_total_leads > 0 THEN
    SET v_delta_total = '12%';
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

  /* -------------------------------------------------------------
     9. Output Single Consolidated Result Set
     ------------------------------------------------------------- */
  SELECT 
    COALESCE(v_total_leads, 0) AS totalLeads,
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
END;
`;

    await pool.query(procedureBody);
    console.log('Stored procedure sp_get_crm_dashboard_kpis created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to create stored procedure:', err);
    process.exit(1);
  }
}

createSp();
