const pool = require('../db/pool');

/**
 * Resolves the full list of accessible user IDs for a given user based on team hierarchy.
 * @param {Object} user - { userId, id, role, is_dev, businessId }
 * @param {number} businessId
 * @returns {Promise<number[]|null>} Array of accessible user IDs, or null if unrestricted (Admin/SuperAdmin)
 */
async function getAccessibleUserIds(user, businessId) {
  if (!user) return [];
  const userId = Number(user.userId || user.id);
  const role = (user.role || '').toLowerCase().trim();
  const isDev = user.is_dev === 1 || user.is_dev === true || user.isDev === true;
  const username = (user.username || '').toLowerCase().trim();
  const email = (user.email || '').toLowerCase().trim();
  const name = (user.name || '').toLowerCase().trim();

  // Superadmin / Developer / 'ufs' user have full business-wide access (unrestricted)
  let isSuperAdmin =
    role === 'superadmin' ||
    isDev ||
    username === 'ufs' ||
    email === 'ufs' ||
    name === 'ufs' ||
    email.startsWith('ufs@') ||
    email.includes('ufs');

  // If credentials are not on user object but role is admin, double check users table to see if it is ufs
  if (!isSuperAdmin && !username && !email && role === 'admin' && userId) {
    try {
      const p = pool.promise ? pool.promise() : pool;
      const [uRows] = await p.query('SELECT username, email, is_dev, role FROM users WHERE id = ?', [userId]);
      if (uRows && uRows.length > 0) {
        const dbU = uRows[0];
        const dbUsername = (dbU.username || '').toLowerCase().trim();
        const dbEmail = (dbU.email || '').toLowerCase().trim();
        const dbDev = dbU.is_dev === 1 || dbU.is_dev === true;
        const dbRole = (dbU.role || '').toLowerCase().trim();
        if (dbRole === 'superadmin' || dbDev || dbUsername === 'ufs' || dbEmail === 'ufs' || dbEmail.includes('ufs')) {
          isSuperAdmin = true;
        }
      }
    } catch (e) {
      // fallback
    }
  }

  if (isSuperAdmin) {
    return null;
  }

  // Breadth-First Search (BFS) for recursive subordinate resolution
  // Strictly team-based: User + their assigned team members in teams/team_members
  const accessibleIds = new Set([userId]);
  const queue = [userId];
  const visited = new Set([userId]);

  try {
    const p = pool.promise ? pool.promise() : pool;

    while (queue.length > 0) {
      const currentId = queue.shift();

      // Find all teams owned/managed by currentId
      const [teamRows] = await p.query(
        `SELECT id FROM teams WHERE user_id = ? AND business_id = ?`,
        [currentId, businessId]
      );

      for (const teamRow of teamRows) {
        const teamId = teamRow.id;
        // Fetch direct subordinates of currentId (excluding currentId itself)
        const [members] = await p.query(
          `SELECT user_id FROM team_members WHERE team_id = ? AND user_id != ?`,
          [teamId, currentId]
        );

        for (const m of members) {
          const subId = Number(m.user_id);
          if (!visited.has(subId)) {
            visited.add(subId);
            accessibleIds.add(subId);
            queue.push(subId); // Traverse subordinates' sub-teams recursively
          }
        }
      }
    }
  } catch (err) {
    console.error('Error in getAccessibleUserIds hierarchy resolution:', err);
    // Fallback: at least return the user themselves
    return [userId];
  }

  return Array.from(accessibleIds);
}

/**
 * Builds a SQL filter clause and parameter array for an agent/user field (e.g. c.assigned_to)
 * respecting both the user's team hierarchy and any specific agent filter passed in the request.
 * Checks both assignment (column) and lead creation (creatorColumn) so leads created by or assigned
 * to the user/their team members are consistently visible.
 *
 * @param {Object} options
 * @param {Array<number>|null} options.accessibleUserIds - Output from getAccessibleUserIds
 * @param {string|number} [options.requestedAgent] - Value from req.query.agent or req.query.employee or req.query.userId
 * @param {string} [options.column='c.assigned_to'] - SQL column to filter on
 * @param {string|null} [options.creatorColumn] - SQL column for lead creator (defaults to <prefix>created_by_user)
 * @returns {{ clause: string, params: Array<any> }}
 */
function buildUserScopeFilter({ accessibleUserIds, requestedAgent, column = 'c.assigned_to', creatorColumn = null }) {
  let clause = '';
  const params = [];

  const effCreatorColumn = creatorColumn || null;

  const hasSpecificAgent = requestedAgent !== undefined && 
                           requestedAgent !== null && 
                           String(requestedAgent).trim() !== '' && 
                           String(requestedAgent).toLowerCase() !== 'all';

  if (accessibleUserIds !== null) {
    // Non-admin: restricted to accessibleUserIds
    if (accessibleUserIds.length === 0) {
      return { clause: ' AND 1 = 0 ', params: [] };
    }

    if (hasSpecificAgent) {
      const requestedId = Number(requestedAgent);
      if (!isNaN(requestedId)) {
        if (accessibleUserIds.includes(requestedId)) {
          if (effCreatorColumn) {
            clause = ` AND (${column} = ? OR ${effCreatorColumn} = ?) `;
            params.push(requestedId, requestedId);
          } else {
            clause = ` AND ${column} = ? `;
            params.push(requestedId);
          }
        } else {
          // Security violation: requested agent is outside their team hierarchy
          clause = ' AND 1 = 0 ';
        }
      } else {
        // Requested by name or string -> fallback to all accessible
        if (effCreatorColumn) {
          clause = ` AND (${column} IN (${accessibleUserIds.map(() => '?').join(',')}) OR ${effCreatorColumn} IN (${accessibleUserIds.map(() => '?').join(',')})) `;
          params.push(...accessibleUserIds, ...accessibleUserIds);
        } else {
          clause = ` AND ${column} IN (${accessibleUserIds.map(() => '?').join(',')}) `;
          params.push(...accessibleUserIds);
        }
      }
    } else {
      // No specific agent requested -> include all accessible agents (user + their team members)
      if (effCreatorColumn) {
        clause = ` AND (${column} IN (${accessibleUserIds.map(() => '?').join(',')}) OR ${effCreatorColumn} IN (${accessibleUserIds.map(() => '?').join(',')})) `;
        params.push(...accessibleUserIds, ...accessibleUserIds);
      } else {
        clause = ` AND ${column} IN (${accessibleUserIds.map(() => '?').join(',')}) `;
        params.push(...accessibleUserIds);
      }
    }
  } else {
    // Admin: unrestricted access
    if (hasSpecificAgent) {
      const requestedId = Number(requestedAgent);
      if (!isNaN(requestedId)) {
        if (effCreatorColumn) {
          clause = ` AND (${column} = ? OR ${effCreatorColumn} = ?) `;
          params.push(requestedId, requestedId);
        } else {
          clause = ` AND ${column} = ? `;
          params.push(requestedId);
        }
      }
    }
  }

  return { clause, params };
}

module.exports = {
  getAccessibleUserIds,
  buildUserScopeFilter
};
