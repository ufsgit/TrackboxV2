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

  // Superadmin, Admin, and Developer have full business-wide access
  if (role === 'superadmin' || role === 'admin' || isDev) {
    return null;
  }

  // Breadth-First Search (BFS) for recursive subordinate resolution
  const accessibleIds = new Set([userId]);
  const queue = [userId];
  const visited = new Set([userId]);

  try {
    const p = pool.promise ? pool.promise() : pool;

    while (queue.length > 0) {
      const currentId = queue.shift();

      // Find the team owned by currentId
      const [teamRows] = await p.query(
        `SELECT id FROM teams WHERE name = ? AND business_id = ? LIMIT 1`,
        [`__agent_${currentId}`, businessId]
      );

      if (teamRows && teamRows.length > 0) {
        const teamId = teamRows[0].id;
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
 *
 * @param {Object} options
 * @param {Array<number>|null} options.accessibleUserIds - Output from getAccessibleUserIds
 * @param {string|number} [options.requestedAgent] - Value from req.query.agent or req.query.employee or req.query.userId
 * @param {string} [options.column='c.assigned_to'] - SQL column to filter on
 * @returns {{ clause: string, params: Array<any> }}
 */
function buildUserScopeFilter({ accessibleUserIds, requestedAgent, column = 'c.assigned_to' }) {
  let clause = '';
  const params = [];

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
          clause = ` AND ${column} = ? `;
          params.push(requestedId);
        } else {
          // Security violation: requested agent is outside their team hierarchy
          clause = ' AND 1 = 0 ';
        }
      } else {
        // Requested by name or string -> handled by caller or fallback
        clause = ` AND ${column} IN (${accessibleUserIds.map(() => '?').join(',')}) `;
        params.push(...accessibleUserIds);
      }
    } else {
      // No specific agent requested -> include all accessible agents
      clause = ` AND ${column} IN (${accessibleUserIds.map(() => '?').join(',')}) `;
      params.push(...accessibleUserIds);
    }
  } else {
    // Admin: unrestricted access
    if (hasSpecificAgent) {
      const requestedId = Number(requestedAgent);
      if (!isNaN(requestedId)) {
        clause = ` AND ${column} = ? `;
        params.push(requestedId);
      }
    }
  }

  return { clause, params };
}

module.exports = {
  getAccessibleUserIds,
  buildUserScopeFilter
};
