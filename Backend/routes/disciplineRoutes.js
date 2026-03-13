const express = require('express');
const router = express.Router();

const {
  listDisciplines,
  listDeletedDisciplines,
  createDiscipline,
  updateDiscipline,
  deleteDiscipline,
  recoverDiscipline,
  permanentDeleteDiscipline
} = require('../controllers/disciplineController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

// Any authenticated user can list disciplines
router.get('/', protect, listDisciplines);
// Admin: list deleted disciplines
router.get('/deleted', protect, adminOnly, listDeletedDisciplines);

// Admin CRUD
router.post('/', protect, adminOnly, createDiscipline);
router.put('/:id', protect, adminOnly, updateDiscipline);
router.delete('/:id', protect, adminOnly, deleteDiscipline);

// Admin: recover and permanent delete
router.put('/:id/recover', protect, adminOnly, recoverDiscipline);
router.delete('/:id/permanent', protect, adminOnly, permanentDeleteDiscipline);

module.exports = router;

