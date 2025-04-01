const Recipe = require('../models/Recipe');
const Item = require('../models/Item');

// create
exports.createRecipe = async (req, res) => {
    let items = await Item.find();

    // Vérifier que l'utilisateur est connecté
    if (!req.session.user) {
        return res.status(401).send("L'utilisateur doit être connecté.");
    }

    // Créer une nouvelle recette
    let newRecipe = new Recipe({
        name: req.body.recipeName,
        description: req.body.recipeDescription,
        user: req.session.user._id
    });
    await newRecipe.save();

    res.redirect('/recettes');
}

//read
exports.getRecipes = async (req, res) => {
    try {
        // Vérifiez que l'utilisateur est connecté
        if (!req.session.user) {
            return res.status(401).render('error', { errorMessage: "L'utilisateur doit être connecté." });
        }
        // Récupère uniquement les recettes appartenant à l'utilisateur connecté
        const recipes = await Recipe.find({ user: req.session.user._id })
            .populate('items.item')
            .populate('user')
            .sort({ createdAt: -1 });
        res.render('recipe/recipes', { recipes });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur Serveur");
    }
};

//update
exports.updateRecipe = async (req, res) => {
    let recipe = await Recipe.findById(req.params.id);

    recipe.name = req.body.recipeName;
    recipe.description = req.body.recipeDescription;
    await recipe.save();

    res.redirect('/recettes');
}

//delete
exports.deleteRecipe = async (req, res) => {
    let recipes = await Recipe.find();
    await Recipe.findByIdAndDelete(req.params.id);

    res.redirect('/recettes');
}

//details

//create
exports.createRecipeItem = async (req, res) => {
    const recipeId = req.params.id;
    const itemId = req.body.recipeItems;
    const quantity = Number(req.body.quantity);

    // Rechercher la recette
    const recipe = await Recipe.findById(recipeId);

    //ajouter l'item à la recette
    recipe.items.push({
        item: itemId,
        recipeQuantity: quantity
    });

    // Sauvegarder la recette mise à jour
    await recipe.save();

    // Rediriger vers les détails de la recette afin d'observer le nouvel item ajouté
    res.redirect(`/recettes/detail/${recipeId}`);
}


//read
exports.getRecipeDetails = async (req, res) => {
    // Vérifier que l'utilisateur est connecté
    if (!req.session.user) {
        return res.status(401).render('error', { errorMessage: "L'utilisateur doit être connecté." });
    }

    // Récupérer la recette en populant les items
    let recipe = await Recipe.findById(req.params.id).populate('items.item');
    let items = await Item.find({ user: req.session.user._id });

    // Extraire le tableau d'items de la recette
    const recipeItems = recipe.items;

    console.log(recipeItems);

    // Passer recipe, items et recipeItems au template
    res.render('recipe/recipeDetails.ejs', { recipe, items, recipeItems });
}

//delete
exports.deleteRecipeItem = async (req, res) => {
    try {
        const recipeId = req.params.id;
        const itemId = req.params.itemId;
        const recipe = await Recipe.findById(recipeId);
        if (!recipe) {
            return res.status(404).send('Recette non trouvée');
        }

        // Filtrer le tableau des items pour exclure l'item à supprimer
        recipe.items = recipe.items.filter(item => item._id.toString() !== itemId);

        await recipe.save();

        res.redirect(`/recettes/detail/${recipeId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur serveur');
    }
};

exports.updateRecipeItemQuantity = async (req, res) => {
    try {
        const { recipeId, itemId } = req.params;
        const action = req.body.action;
        const recipe = await Recipe.findById(recipeId).populate('items.item').populate('user');
        if (!recipe) return res.status(404).send('Recette non trouvée');

        const recipeItem = recipe.items.find(ri => ri._id.toString() === itemId);
        if (!recipeItem) return res.status(404).send("Item dans la recette non trouvé");

        if (action === 'increment') {
            recipeItem.recipeQuantity = (recipeItem.recipeQuantity || 1) + 1;
        } else if (action === 'decrement' && recipeItem.recipeQuantity > 1) {
            recipeItem.recipeQuantity--;
        }

        await recipe.save();
        res.redirect('/recettes/detail/' + recipeId);
    } catch (error) {
        console.error(error);
        res.status(500).send('Erreur Serveur');
    }
};