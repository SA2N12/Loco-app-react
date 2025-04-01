//imports
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//schema
const RecipeItemSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  recipeQuantity: { type: Number, required: true, default: 1 }
});

const RecipeSchema = new Schema({
    name: String,
    description: String,
    items: [RecipeItemSchema],
    cost: Number,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
});

//exports
module.exports = mongoose.model('Recipe', RecipeSchema);