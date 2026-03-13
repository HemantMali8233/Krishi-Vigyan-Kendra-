const express = require('express');
const router = express.Router();

const {
  listTrainings,
  listDeletedTrainings,
  getTraining,
  createTraining,
  updateTraining,
  deleteTraining,
  recoverTraining,
  permanentDeleteTraining
} = require('../controllers/trainingController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

// Any authenticated user can list/view trainings
router.get('/', protect, listTrainings);
router.get('/deleted', protect, adminOnly, listDeletedTrainings);
router.get('/:id', protect, getTraining);

// Admin CRUD
router.post('/', protect, adminOnly, createTraining);
router.put('/:id', protect, adminOnly, updateTraining);
router.put('/:id/recover', protect, adminOnly, recoverTraining);
router.delete('/:id', protect, adminOnly, deleteTraining);
router.delete('/:id/permanent', protect, adminOnly, permanentDeleteTraining);

module.exports = router;
