const express = require('express');
const router = express.Router();
const { getUsers, getUser, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect, tenantIsolation, authorize } = require('../middleware/auth');

router.use(protect, tenantIsolation);

router.route('/').get(authorize('tenant_admin'), getUsers).post(authorize('tenant_admin'), createUser);
router.route('/:id').get(getUser).put(authorize('tenant_admin'), updateUser).delete(authorize('tenant_admin'), deleteUser);

module.exports = router;
