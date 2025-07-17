const express = require('express');
const router = express.Router();
const circulationController = require('../controllers/circulationController');

// Borrow a Book
router.post('/borrow', circulationController.borrowBook);

// Return a Book
router.post('/return', circulationController.returnBook);

module.exports = router;
