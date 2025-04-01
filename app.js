//imports
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const router = require('./routes');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const session = require('express-session');

const app = express(); 
const port = 3000;

//connexion à la base de données
try {
    mongoose.connect('mongodb://localhost:27017/loco_app', {useNewUrlParser: true, useUnifiedTopology: true});
    console.log('Connected to the database');
}
catch (error) {
    console.log('Error connecting to the database');
}

//middlewares
app.use(session({
    secret: 'votreSecret',
    resave: false,
    saveUninitialized: false
}));
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});
app.use(express.urlencoded({extended: true}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(methodOverride('_method'));

//configuration des vues
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//configuration du dossier public
app.use(express.static(path.join(__dirname, 'public')));

//routes
app.use('/', router);

//lancement du serveur
app.listen(port, ()=>{
    console.log(`Server started on http://localhost:${port}`);
});