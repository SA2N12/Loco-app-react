const mongoose = require('mongoose');

const categories = ['viande', 'poisson', 'légume', 'fruit', 'produit laitier', 'féculent', 'épice', 'goûter', 'divers'];

const ItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { 
        type: String, 
        required: true,
        enum: categories
    },
    createdAt: { type: Date, default: Date.now },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

const Item = mongoose.model('Item', ItemSchema);
module.exports = Item;

// Exporter aussi le tableau de catégories
module.exports.categories = categories;