-- ===================================================================================
-- Stored Procedure: sp_check_contact_phone_exists
-- Purpose: Fast, read-only lookup to check if a phone number already exists in the CRM
-- Features:
--   1. Automatically strips spaces, symbols, and formatting.
--   2. Matches by exact phone number OR last 10 digits (works with or without +91 / country code).
--   3. Returns contact details with assigned agent and status (Read-Only).
-- ===================================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_check_contact_phone_exists`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_check_contact_phone_exists`(
    IN p_business_id   INT,
    IN p_phone         VARCHAR(50),
    IN p_country_code  VARCHAR(10)
)
BEGIN
    DECLARE v_clean_digits VARCHAR(50);
    DECLARE v_last10       VARCHAR(10);
    DECLARE v_c_code       VARCHAR(10);

    -- 1. Country code normalization
    SET v_c_code = TRIM(COALESCE(p_country_code, ''));
    IF v_c_code != '' AND NOT v_c_code LIKE '+%' THEN
        SET v_c_code = CONCAT('+', v_c_code);
    END IF;

    -- 2. Extract digits only and last 10 digits
    SET v_clean_digits = REGEXP_REPLACE(COALESCE(p_phone, ''), '[^0-9]', '');
    IF LENGTH(v_clean_digits) >= 10 THEN
        SET v_last10 = RIGHT(v_clean_digits, 10);
    ELSE
        SET v_last10 = v_clean_digits;
    END IF;

    -- 3. Check existence and return only essential details
    SELECT 
        c.id,
        c.name,
        c.phone,
        COALESCE(c.country_code, '+91')        AS country_code,
        COALESCE(c.status_name, 'Unassigned')  AS status_name,
        c.assigned_to,
        COALESCE(u.name, 'Unassigned')         AS assigned_agent,
        c.created_at,
        1                                      AS already_exists
    FROM contacts c
    LEFT JOIN users u ON c.assigned_to = u.id
    WHERE c.business_id = p_business_id
      AND (
          c.phone = TRIM(p_phone)
          OR (v_c_code != '' AND c.phone = CONCAT(v_c_code, v_clean_digits))
          OR (v_last10 != '' AND c.phone LIKE CONCAT('%', v_last10))
      )
    ORDER BY c.id DESC
    LIMIT 1;

END$$

DELIMITER ;
