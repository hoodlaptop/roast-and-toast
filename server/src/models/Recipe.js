const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name:   { type: String, required: true },
  amount: { type: String, default: '' },   // "18g", "200ml" 등 자유 형식
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
  ingredients: [ingredientSchema],
  steps:       [stepSchema],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Recipe', recipeSchema);
