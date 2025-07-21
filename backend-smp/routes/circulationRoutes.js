import express from "express.js";
const router = express.Router();
import circulationController from "../controllers/circulationController.js";

// Borrow a Book
router.post('/borrow', circulationController.borrowBook);

// Return a Book
router.post('/return', circulationController.returnBook);

module.exports = router;

