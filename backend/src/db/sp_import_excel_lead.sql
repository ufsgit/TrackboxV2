-- ===================================================================================
-- Stored Procedure: sp_import_excel_lead
-- Purpose: Complete single-lead Excel Import with automated Channel resolution
-- Behavior:
--   1. Calls sp_resolve_or_create_channel to resolve / create channel case-insensitively.
--   2. Inserts contact with mapped channel_id and canonical channel_preference.
--   3. Returns generated contact_id and resolved channel_id.
-- ===================================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_import_excel_lead`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_import_excel_lead`(
    IN  p_business_id         INT,
    IN  p_name                VARCHAR(255),
    IN  p_phone               VARCHAR(20),
    IN  p_country_code        VARCHAR(10),
    IN  p_email               VARCHAR(255),
    IN  p_source              VARCHAR(100),
    IN  p_tags                JSON,
    IN  p_assigned_to         INT,
    IN  p_address             TEXT,
    IN  p_enquiry_for_id      INT,
    IN  p_branch_id           INT,
    IN  p_branch_name         VARCHAR(255),
    IN  p_department_id       INT,
    IN  p_department_name     VARCHAR(255),
    IN  p_status_id           INT,
    IN  p_status_name         VARCHAR(100),
    IN  p_current_sale_status INT,
    IN  p_sale_won            TINYINT(1),
    IN  p_sale_won_date       DATETIME,
    IN  p_sale_won_by         INT,
    IN  p_sale_lost           TINYINT(1),
    IN  p_sale_lost_date      DATETIME,
    IN  p_sale_lost_by        INT,
    IN  p_follow_up_date      DATE,
    IN  p_follow_up           TINYINT(1),
    IN  p_created_by_user     INT,
    IN  p_user_list           JSON,
    IN  p_loss_reason         VARCHAR(255),
    IN  p_lead_date           DATETIME,
    OUT p_contact_id          INT,
    OUT p_channel_id          INT,
    OUT p_resolved_source     VARCHAR(100)
)
BEGIN
    -- Step 1: Case-insensitively resolve or insert channel
    CALL sp_resolve_or_create_channel(
        p_business_id,
        p_source,
        p_channel_id,
        p_resolved_source
    );

    -- Step 2: Insert contact with resolved channel_id and channel_preference
    INSERT INTO contacts (
        business_id, name, phone, country_code, email, tags,
        channel_id, channel_preference, opt_in_source,
        assigned_to, address, enquiry_for_id,
        branch_id, branch_name, department_id, department_name,
        status_id, status_name, current_sale_status,
        sale_won, sale_won_date, sale_won_by,
        sale_lost, sale_lost_date, sale_lost_by,
        follow_up_date, follow_up,
        created_by_user, user_list, loss_reason,
        created_at
    ) VALUES (
        p_business_id, p_name, p_phone, COALESCE(p_country_code, '+91'), p_email, p_tags,
        p_channel_id, p_resolved_source, 'import',
        p_assigned_to, p_address, p_enquiry_for_id,
        p_branch_id, p_branch_name, p_department_id, p_department_name,
        p_status_id, p_status_name, COALESCE(p_current_sale_status, 0),
        COALESCE(p_sale_won, 0), p_sale_won_date, p_sale_won_by,
        COALESCE(p_sale_lost, 0), p_sale_lost_date, p_sale_lost_by,
        p_follow_up_date, COALESCE(p_follow_up, 0),
        p_created_by_user, p_user_list, p_loss_reason,
        COALESCE(p_lead_date, NOW())
    );

    SET p_contact_id = LAST_INSERT_ID();
END$$

DELIMITER ;
