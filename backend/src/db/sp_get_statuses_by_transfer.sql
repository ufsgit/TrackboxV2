-- Stored Procedure: sp_get_statuses_by_transfer
-- Retrieves statuses filtered by transfer flag (e.g. transfer = 1 for Excel Import) sorted by name

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_get_statuses_by_transfer`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_statuses_by_transfer`(
    IN p_transfer TINYINT
)
BEGIN
    SELECT 
        id,
        name,
        color,
        follow_needed,
        transfer,
        department_id,
        type,
        created_at,
        updated_at
    FROM statuses
    WHERE (p_transfer IS NULL OR transfer = p_transfer)
    ORDER BY name ASC;
END$$

DELIMITER ;

