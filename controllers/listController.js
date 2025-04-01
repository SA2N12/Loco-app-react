const { body, validationResult } = require('express-validator');
const List = require('../models/list');
const Item = require('../models/Item');
const Stock = require('../models/Stock');
const Recipe = require('../models/Recipe');

exports.getLists = async (req, res) => {
    try {
        // Vérifiez que l'utilisateur est connecté
        if (!req.session.user) {
            return res.status(401).render('error', { errorMessage: "L'utilisateur doit être connecté." });
        }
        // Récupérer uniquement les listes de l'utilisateur connecté
        const lists = await List.find({ user: req.session.user._id })
            .populate('items.item')
            .populate('user')
            .sort({ createdAt: -1 });
        res.render('list/lists.ejs', { lists, errors: [] });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.createList = [
    body('listName').notEmpty().withMessage('Le nom de la liste est obligatoire'),
    async (req, res) => {
        if (!req.session.user) {
            return res.status(401).render('error', { errorMessage: "L'utilisateur doit être connecté." });
        }
        const errors = validationResult(req);
        // Récupérer uniquement les listes de l'utilisateur connecté
        let lists = await List.find({ user: req.session.user._id });

        if (!errors.isEmpty()) {
            // On retourne la vue d'erreur avec uniquement les listes de l'utilisateur connecté
            return res.render('list/lists.ejs', { errors: errors.array(), lists });
        }

        let listExistante = lists.find(list => list.name === req.body.listName);
        if (listExistante) {
            errors.errors.push({ msg: 'La liste existe déjà' });
            return res.render('list/lists.ejs', { errors: errors.array(), lists });
        }

        let newList = new List({
            name: req.body.listName,
            description: req.body.description,
            user: req.session.user._id
        });
        await newList.save();
        res.redirect('/listes');
    }
];

exports.getList = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).render('error', { errorMessage: "L'utilisateur doit être connecté." });
        }

        const listId = req.params.id;

        // Récupérer la liste avec les items peuplés
        const list = await List.findById(listId).populate('items.item');
        if (!list) return res.status(404).send('Liste introuvable');

        // Récupérer les items disponibles pour le select
        const items = await Item.find({ user: req.session.user._id });

        // Récupérer tous les stocks de l'utilisateur connecté
        const stocks = await Stock.find({ user: req.session.user._id }).populate('item');

        // Récupérer toutes les recettes de l'utilisateur connecté
        const recipes = await Recipe.find({ user: req.session.user._id });

        // Rendre la vue avec les données mises à jour
        res.render('list/listEdit.ejs', { list, items, stocks, recipes });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur Serveur");
    }
};

exports.updateList = async (req, res) => {
    try {
        console.log('req.body:', req.body);

        const listId = req.params.id;
        const { listName, description, itemId, stockQuantity } = req.body;

        const list = await List.findById(listId);
        if (!list) {
            return res.status(404).send('Liste non trouvée');
        }

        // Mettre à jour nom + description
        list.name = listName;
        list.description = description;

        // Gérer l'ajout d'item (optionnel) si présent dans req.body
        if (itemId && itemId.trim() !== '') {
            list.items = list.items || [];
            const itemAlreadyInList = list.items.some(existingItemId => existingItemId.toString() === itemId);
            if (!itemAlreadyInList) {
                list.items.push(itemId);
                console.log(`Item ${itemId} ajouté à la liste.`);
            } else {
                console.log("Item déjà présent dans la liste.");
            }
            // Optionnel : gérer la quantité stockQuantity si nécessaire
            list.items.push({ item: itemId, listQuantity: stockQuantity });
        }

        await list.save();
        console.log('Liste sauvegardée avec succès.');
        res.redirect('/listes');
    } catch (err) {
        console.error('Erreur dans updateList:', err);
        res.status(500).send('Erreur Serveur');
    }
};

exports.deleteList = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).render('error', { errorMessage: "L'utilisateur doit être connecté." });
        }
        // Supprimer uniquement la liste appartenant à l'utilisateur connecté
        await List.findOneAndDelete({ _id: req.params.id, user: req.session.user._id });
        // Redirection vers GET /listes
        res.redirect('/listes');
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur Serveur");
    }
};

exports.addNewItemToList = async (req, res) => {
    try {
        const { id } = req.params;                  // id de la liste
        const { itemId, itemQuantity } = req.body;   // quantité demandée dans la liste
        const parsedQty = parseInt(itemQuantity, 10) || 1;

        // Vérifier que l'item de référence existe
        const baseItem = await require('../models/Item').findById(itemId);
        if (!baseItem) return res.status(404).send("Item source introuvable");

        const list = await List.findById(id);
        if (!list) return res.status(404).send("Liste introuvable");

        // Pour éviter les doublons, on peut vérifier si cet item est déjà dans la liste
        const existing = list.items.find(li => li.item.toString() === itemId);
        if (existing) {
            return res.status(400).send('Cet item est déjà présent dans la liste.');
        }

        // Ajouter à la liste l'item avec la quantité souhaitée (liste indépendante du stock)
        list.items.push({ item: itemId, listQuantity: parsedQty });

        await list.save();
        res.redirect('/listes/' + id);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur Serveur");
    }
};

exports.deleteItemFromList = async (req, res) => {
    try {
        const { id, itemId } = req.params;
        const list = await List.findById(id);
        if (!list) {
            return res.status(404).send('Liste non trouvée');
        }

        // Si itemToRemove.remove() n'est pas défini, utilisez filter pour retirer l'item
        list.items = list.items.filter(item => item._id.toString() !== itemId);

        await list.save();
        res.redirect(`/listes/${id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur Serveur");
    }
};

exports.addRecipeToList = async (req, res) => {
    try {
        console.log('req.body:', req.body);
        const { id } = req.params;
        const { recipeId } = req.body;

        // Rechercher la liste
        const list = await List.findById(id);
        if (!list) {
            return res.status(404).send('Liste introuvable');
        }

        // Rechercher la recette par son id et peupler les items
        const recipe = await Recipe.findById(recipeId).populate('items.item');
        if (!recipe) {
            return res.status(404).send('Recette non trouvée');
        }

        // Pour chaque item de la recette, on l'ajoute à la liste ou on met à jour sa quantité
        const recipeItems = recipe.items || [];
        for (const recipeItem of recipeItems) {
            // Utiliser recipeItem.item._id si l'item est peuplé, sinon recipeItem.item
            const recipeItemId = recipeItem.item._id ? recipeItem.item._id.toString() : recipeItem.item.toString();
            const existing = list.items.find(li => li.item.toString() === recipeItemId);
            if (existing) {
                existing.listQuantity += recipeItem.recipeQuantity;
            } else {
                list.items.push({ item: recipeItem.item, listQuantity: recipeItem.recipeQuantity });
            }
        }

        await list.save();
        res.redirect(`/listes/${id}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur serveur");
    }
};

exports.updateListItemQuantity = async (req, res) => {
    try {
        const { id, itemId } = req.params;
        console.log("Liste ID :", id);
        console.log("Item ID :", itemId);

        const action = req.body.action;
        const list = await List.findById(id);
        if (!list) return res.status(404).send('Liste non trouvée');

        // Chercher l'item dans la liste par son _id plutôt que par item.toString()
        const listItem = list.items.find(li => li._id.toString() === itemId);
        if (!listItem) return res.status(404).send("Item dans la liste non trouvé");

        // Mise à jour en fonction de l'action
        if (action === 'increment') {
            listItem.listQuantity = (listItem.listQuantity || 1) + 1;
        } else if (action === 'decrement' && listItem.listQuantity > 1) {
            listItem.listQuantity = listItem.listQuantity - 1;
        }

        await list.save();
        res.redirect('/listes/' + id);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur Serveur");
    }
};