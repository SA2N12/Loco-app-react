const { body, validationResult } = require('express-validator');
const Stock = require('../models/Stock');
const Item = require('../models/Item');

exports.getStocks = async (req, res) => {
    try {
        // Vérifier que l'utilisateur est connecté
        if (!req.session.user) {
            return res.status(401).render('error', { errorMessage: "L'utilisateur doit être connecté." });
        }

        // Récupérer uniquement les stocks créés par l'utilisateur connecté
        const stocks = await Stock.find({ user: req.session.user._id })
            .populate('item')
            .populate('user')
            .sort({ createdAt: -1 });
        res.render('stock/stocks', { stocks, errors: [] });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.createStock = [
    // Validation code...

    async (req, res) => {
        const errors = validationResult(req);
        // Use the Item model to check for an existing item if needed
        if (!errors.isEmpty()) {
            return res.render('stock/stocks', {
                errors: errors.array(),
                stocks: [] // or current stocks list
            });
        }

        try {
            const newItem = new Item({
                name: req.body.stockName,
                quantity: req.body.stockQuantity,
                createdAt: new Date()
            });
            await newItem.save();

            const newStock = new Stock({
                item: newItem._id,
                quantity: newItem.quantity,
                user: req.session.user ? req.session.user._id : null // Ensure user is logged in
            });
            await newStock.save();

            res.redirect('/stocks');
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    }
];

exports.getStock = async (req, res) => {
    try {
        const stockId = req.params.id;
        const stock = await Item.findById(stockId);
        if (!stock) {
            return res.status(404).send("Stock non trouvé");
        }
        return res.render('stock/stockEdit', { stock });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.updateStock = async (req, res) => {
    try {
        const stockId = req.params.id;
        const updatedStock = await Stock.findByIdAndUpdate(
            stockId,
            { quantity: req.body.stockQuantity },
            { new: true }
        );
        if (!updatedStock) {
            return res.status(404).send('Stock non trouvé');
        }
        res.redirect('/stocks');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.deleteStock = async (req, res) => {
    try {
        await Item.findByIdAndDelete(req.params.id);
        res.redirect('/stocks');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};