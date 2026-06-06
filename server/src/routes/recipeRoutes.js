const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
  listRecipes, getRecipe, createRecipe, updateRecipe, deleteRecipe,
} = require('../controllers/recipeController');

const router = express.Router();

// 공개 (조회)
router.get('/', asyncHandler(listRecipes));
router.get('/:id', asyncHandler(getRecipe));

// 관리자 전용 (추가/수정/삭제)
router.post('/', requireAuth, requireAdmin, asyncHandler(createRecipe));
router.put('/:id', requireAuth, requireAdmin, asyncHandler(updateRecipe));
router.delete('/:id', requireAuth, requireAdmin, asyncHandler(deleteRecipe));

module.exports = router;
