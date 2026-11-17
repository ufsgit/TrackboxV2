const router = require('express').Router();
const controller = require('../../controllers/contact_tasks/contact_tasks.controller');
const authenticate = require('../../middleware/authenticate');

router.use(authenticate);

// Get team members under the logged-in user
router.get('/team', controller.getTaskTeamAssignees);

// Get global tasks list (supports ?assigned_to=&search=&start_date=&end_date=&status=&page=&limit=)
router.get('/', controller.getTasksList);

// Get all tasks for a contact (supports ?search=...&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&page=1&limit=10)
router.get('/contact/:contactId', controller.getTasksByContact);

// Create a new task
router.post('/', controller.createTask);

// Update task status (0 = Pending, 1 = Completed)
router.patch('/:id/status', controller.updateTaskStatus);

module.exports = router;
