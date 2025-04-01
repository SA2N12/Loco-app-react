//imports
const mongoose = require('mongoose');

//schema
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    lists: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'List'
        }
    ],
    items: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item'
        }
    ],
     stocks: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Stock'
        }  
    ]
});

// exports
module.exports = mongoose.model('User', UserSchema);