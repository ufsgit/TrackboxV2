-- ===================================================================================
-- Stored Procedure: sp_resolve_or_create_channel
-- Purpose: Case-insensitive Channel / Source Resolution & Auto-Creation for Excel Import
-- Behavior:
--   1. Matches incoming Source against channels table case-insensitively (e.g., 'Facebook' = 'facebook' = 'FACEBOOK').
--   2. If match exists, returns the existing Channel ID and canonical name.
--   3. If match does not exist, inserts a new Channel record for this business and returns the new Channel ID.
--   4. Prevents duplicate channel records for the same business.
-- ===================================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_resolve_or_create_channel`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_resolve_or_create_channel`(
    IN  p_business_id   INT,
    IN  p_channel_name  VARCHAR(100),
    OUT p_channel_id    INT,
    OUT p_resolved_name VARCHAR(100)
)
BEGIN
    DECLARE v_clean_name VARCHAR(100);

    -- Normalize input: trim and default to 'whatsapp' if null or empty
    SET v_clean_name = TRIM(p_channel_name);
    IF v_clean_name IS NULL OR v_clean_name = '' THEN
        SET v_clean_name = 'whatsapp';
    END IF;

    -- 1. Case-insensitive lookup against channels table
    SELECT id, name
      INTO p_channel_id, p_resolved_name
      FROM channels
     WHERE business_id = p_business_id
       AND LOWER(TRIM(name)) = LOWER(v_clean_name)
     LIMIT 1;

    -- 2. If not exists, insert new channel and retrieve its new ID
    IF p_channel_id IS NULL THEN
        INSERT INTO channels (business_id, name)
        VALUES (p_business_id, v_clean_name)
        ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);

        SET p_channel_id = LAST_INSERT_ID();

        SELECT name INTO p_resolved_name
          FROM channels
         WHERE id = p_channel_id
         LIMIT 1;
    END IF;
END$$

DELIMITER ;
