const express = require('express');
const router = express.Router();
const { provisionTenant, getTenantStatus } = require('../controllers/onboardingController');

// Public endpoint for tenant provisioning
router.post('/provision', provisionTenant);
router.get('/status/:id', getTenantStatus);

module.exports = router;
