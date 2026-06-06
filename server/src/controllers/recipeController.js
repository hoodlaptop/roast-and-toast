const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');

const RECIPE_TYPES = ['coffee', 'baking'];

// mass-assignment 방지: 허용된 필드만 추출 (createdBy, _id 등 차단)
function pickRecipeFields(body = {}) {
  const { type, title, description, ingredients, ingredientGroups, steps } = body;
  // yield 는 예약어이므로 변수 바인딩 없이 속성으로만 다룬다
  return { type, title, description, ingredients, ingredientGroups, steps, yield: body.yield };
}

function validateRecipe(data) {
  const errors = [];
  if (!RECIPE_TYPES.includes(data.type)) {
    errors.push('type 은 coffee 또는 baking 이어야 합니다.');
  }
  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    errors.push('title 은 필수입니다.');
  }
  // 재료는 구버전 ingredients 또는 신버전 ingredientGroups 중 하나만 와도 통과 (둘 다 선택)
  if (data.ingredients && !Array.isArray(data.ingredients)) {
    errors.push('ingredients 는 배열이어야 합니다.');
  }
  if (data.ingredientGroups != null) {
    if (!Array.isArray(data.ingredientGroups)) {
      errors.push('ingredientGroups 는 배열이어야 합니다.');
    } else {
      data.ingredientGroups.forEach((g, gi) => {
        if (!g || !Array.isArray(g.items)) {
          errors.push(`ingredientGroups[${gi}].items 는 배열이어야 합니다.`);
          return;
        }
        g.items.forEach((it, ii) => {
          if (!it || typeof it.name !== 'string') {
            errors.push(`ingredientGroups[${gi}].items[${ii}].name 은 문자열이어야 합니다.`);
          }
        });
      });
    }
  }
  if (data.yield != null && typeof data.yield !== 'string') {
    errors.push('yield 는 문자열이어야 합니다.');
  }
  if (data.steps && !Array.isArray(data.steps)) {
    errors.push('steps 는 배열이어야 합니다.');
  }
  if (Array.isArray(data.steps)) {
    data.steps.forEach((s, i) => {
      if (!s || typeof s.instruction !== 'string' || !s.instruction.trim()) {
        errors.push(`steps[${i}].instruction 은 필수입니다.`);
      }
      if (s && s.durationSec != null &&
          (typeof s.durationSec !== 'number' || s.durationSec < 0)) {
        errors.push(`steps[${i}].durationSec 은 0 이상의 숫자여야 합니다.`);
      }
    });
  }
  return errors;
}

// 단계 order 를 1부터 순차 정규화하고, 빈 durationSec 은 null 로 통일
function normalizeSteps(steps = []) {
  return steps.map((s, i) => ({
    order: i + 1,
    instruction: s.instruction,
    durationSec: s.durationSec ?? null,
  }));
}

// 응답 정규화: 옛 평탄 ingredients 만 있는 데이터를 ingredientGroups 형태로 변환해 내려준다.
// (DB 마이그레이션 없이 읽을 때 처리) → 프론트는 항상 ingredientGroups 만 보면 된다.
function normalizeRecipeResponse(recipe) {
  const obj = typeof recipe.toObject === 'function' ? recipe.toObject() : recipe;
  const hasGroups = Array.isArray(obj.ingredientGroups) && obj.ingredientGroups.length > 0;
  if (!hasGroups) {
    obj.ingredientGroups = Array.isArray(obj.ingredients) && obj.ingredients.length > 0
      ? [{ groupName: '', items: obj.ingredients }]
      : [];
  }
  return obj;
}

async function listRecipes(req, res) {
  const { type, q } = req.query;
  const filter = {};
  if (type) {
    if (!RECIPE_TYPES.includes(type)) {
      return res.status(400).json({ message: 'type 은 coffee 또는 baking 이어야 합니다.' });
    }
    filter.type = type;
  }
  if (q) filter.title = { $regex: String(q).trim(), $options: 'i' };

  const recipes = await Recipe.find(filter).sort({ createdAt: -1 });
  res.json(recipes.map(normalizeRecipeResponse));
}

async function getRecipe(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: '잘못된 id 형식입니다.' });
  }
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).json({ message: '레시피를 찾을 수 없습니다.' });
  res.json(normalizeRecipeResponse(recipe));
}

async function createRecipe(req, res) {
  const data = pickRecipeFields(req.body);
  const errors = validateRecipe(data);
  if (errors.length) return res.status(400).json({ message: '입력값 오류', errors });

  if (Array.isArray(data.steps)) data.steps = normalizeSteps(data.steps);
  const recipe = await Recipe.create({ ...data, createdBy: req.user.id });
  res.status(201).json(normalizeRecipeResponse(recipe));
}

async function updateRecipe(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: '잘못된 id 형식입니다.' });
  }
  const data = pickRecipeFields(req.body);
  const errors = validateRecipe(data);
  if (errors.length) return res.status(400).json({ message: '입력값 오류', errors });

  if (Array.isArray(data.steps)) data.steps = normalizeSteps(data.steps);
  const recipe = await Recipe.findByIdAndUpdate(req.params.id, data, {
    new: true, runValidators: true,
  });
  if (!recipe) return res.status(404).json({ message: '레시피를 찾을 수 없습니다.' });
  res.json(normalizeRecipeResponse(recipe));
}

async function deleteRecipe(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: '잘못된 id 형식입니다.' });
  }
  const recipe = await Recipe.findByIdAndDelete(req.params.id);
  if (!recipe) return res.status(404).json({ message: '레시피를 찾을 수 없습니다.' });
  res.json({ message: '삭제되었습니다.' });
}

module.exports = { listRecipes, getRecipe, createRecipe, updateRecipe, deleteRecipe };
