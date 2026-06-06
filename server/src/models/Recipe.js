const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name:   { type: String, required: true },
  amount: { type: String, default: '' },   // "18g", "200ml" 등 자유 형식
}, { _id: false });

// 재료 그룹: "반죽", "토핑" 처럼 묶어서 표시 (groupName 비우면 단일 그룹)
const ingredientGroupSchema = new mongoose.Schema({
  groupName: { type: String, default: '' },
  items:     [ingredientSchema],
}, { _id: false });

const stepSchema = new mongoose.Schema({
  order:       { type: Number, required: true },
  instruction: { type: String, required: true },
  durationSec: { type: Number, default: null }, // 커피=초 단위 / 베이킹=null
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  type:        { type: String, enum: ['coffee', 'baking'], required: true, index: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  yield:       { type: String, default: '' },   // "머핀팬 30개 분량" 등 자유 형식
  ingredients:      [ingredientSchema],          // 구버전 평탄 배열(하위 호환용, 제거하지 않음)
  ingredientGroups: [ingredientGroupSchema],     // 신버전 그룹 구조
  steps:       [stepSchema],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Recipe', recipeSchema);
