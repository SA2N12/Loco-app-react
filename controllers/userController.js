const bcrypt = require('bcrypt');
const User = require('../models/User');

exports.postRegister = async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    // Vérifier que tous les champs sont remplis
    if (!username || !email || !password || !confirmPassword) {
        return res.status(400).json({ message: "Tous les champs sont obligatoires" });
    }

    // Validation du nom : minimum 3 lettres
    if (username.trim().length < 3) {
        return res.status(400).json({ message: "Le nom d'utilisateur doit contenir au moins 3 lettres" });
    }

    // Validation de l'email : format valide
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Veuillez entrer une adresse email valide" });
    }

    // Validation du mot de passe : minimum 6 caractères
    if (password.length < 6) {
        return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    // Vérification du password et du confirmPassword
    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
    }

    // Vérifier si l'email existe déjà en base de données
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: "L'email est déjà utilisé" });
    }

    // Hachage du mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Créer un nouvel utilisateur
    const user = new User({
        username, 
        email,
        password: hashedPassword
    });

    await user.save();
    res.redirect('/');
};

exports.getRegister = async (req, res) => {
    res.render('user/register.ejs');
};

exports.postLogin = async (req, res) => {
    const { email, password } = req.body;

    // Vérifier que tous les champs sont remplis
    if (!email || !password) {
        return res.status(400).json({ message: "Tous les champs sont obligatoires" });
    }

    // Vérifier si l'email existe en base de données
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: "L'email n'existe pas" });
    }

    // Vérifier si le mot de passe est correct
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(400).json({ message: "Le mot de passe est incorrect" });
    }

    req.session.user = user;
    res.redirect('/');  
};

exports.getLogin = async (req, res) => {
    res.render('user/login.ejs');
};

exports.getLogout = async (req, res) => {
    req.session.destroy(err => {
        if(err){
            console.error(err);
            return res.status(500).send('Erreur serveur');
        }
        res.redirect('/');
    });
};