//imports
const Item = require('../models/Item');
const Stock = require('../models/Stock');

// Affiche la liste des items
exports.getItems = async (req, res) => {
  try {
    // Vérifiez que l'utilisateur est connecté
    if (!req.session.user) {
      return res.status(401).render('error', { errorMessage: "L'utilisateur doit être connecté." });
    }

    // Récupérer uniquement les items de l'utilisateur connecté
    const allItems = await Item.find({ user: req.session.user._id }).populate('user', 'username');

    // Filtrer pour ne garder qu'un item par nom
    const uniqueItems = allItems.reduce((acc, item) => {
      if (!acc.some(existingItem => existingItem.name === item.name)) {
        acc.push(item);
      }
      return acc;
    }, []);

    console.log(uniqueItems);
    res.render('item/items.ejs', { items: uniqueItems });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur Serveur");
  }
};

// Afficher le formulaire d'ajout d'un nouvel item
exports.getNewItem = (req, res) => {
  res.render('item/newItem.ejs');
};

// Créer un nouvel item et un stock associé
exports.createItem = async (req, res) => {
  try {
    const { name, quantity } = req.body;
    if (!name) {
      return res.status(400).send("Le nom est requis");
    }

    // Vérifiez que l'utilisateur est connecté et que req.session.user est défini
    if (!req.session.user) {
      return res.status(401).send("L'utilisateur doit être connecté.");
    }

    const newItem = new Item({
      name,
      quantity: quantity || 1,
      price: 0,
      category: 'divers',
      user: req.session.user._id
    });
    await newItem.save();

    // Créer un stock correspondant en référence à ce nouvel item et à l'utilisateur connecté
    const newStock = new Stock({
      item: newItem._id,        // référence à l'item
      quantity: newItem.quantity, // quantité initiale
      user: req.session.user._id  // assigne l'id de l'utilisateur connecté
    });
    await newStock.save();

    res.redirect('/items');
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
};

// Afficher le formulaire de modification d'un item
exports.getEditItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).send("Item non trouvé");
    res.render('item/editItem', { item, categories: Item.categories });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur Serveur");
  }
};

// Mettre à jour un item
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, quantity, price, category } = req.body;
    const updatedItem = await Item.findByIdAndUpdate(id, { name, quantity, price, category }, { new: true });
    if (!updatedItem) {
      return res.status(404).send("Item non trouvé");
    }
    res.redirect('/items');
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur Serveur");
  }
};

// Supprimer un item
exports.deleteItem = async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.redirect('/items');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};