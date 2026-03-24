const express = require('express');
const router = express.Router();
const { getTenant, updateTenant, getUsers, inviteUser, updateUser, getAllTenants, provisionTenant } = require('../controllers/tenantController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/me', getTenant);
router.put('/me', authorize('tenant_admin'), updateTenant);
router.get('/me/users', authorize('tenant_admin'), getUsers);
router.post('/me/users', authorize('tenant_admin'), inviteUser);
router.put('/me/users/:userId', authorize('tenant_admin'), updateUser);

// Superadmin routes
router.get('/', authorize('superadmin'), getAllTenants);
router.post('/provision', authorize('superadmin'), provisionTenant);

module.exports = router;
