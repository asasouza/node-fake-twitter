// modules
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// constants
const { MONGODB_URL } = require('./src/config/constants');

const app = express();
const server = require('http').Server(app);

const authRoutes = require('./src/routes/auth');

app.use(bodyParser.json());

app.use(authRoutes);

mongoose.connect(MONGODB_URL, { useNewUrlParser: true })
.then(() => {
	server.listen(3000, () => console.log('Server Started'));	
})
.catch(err => console.log(err));
