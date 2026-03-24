const express = require('express');
const router = express.Router();
const { getProjects, getProject, createProject, updateProject, deleteProject, getKPIs } = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/kpis', getKPIs);
router.get('/', getProjects);
router.post('/', authorize('tenant_admin', 'project_manager'), createProject);
router.get('/:id', getProject);
router.put('/:id', authorize('tenant_admin', 'project_manager'), updateProject);
router.delete('/:id', authorize('tenant_admin'), deleteProject);

module.exports = router;
