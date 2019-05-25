// modules
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// constants
const { MONGODB_URL } = require('./src/config/constants');

const app = express();
const server = require('http').Server(app);

app.use(bodyParser.json());

app.get('/', (req, res, next) => {
	res.status(200).json({ hello: 'world' });
});

mongoose.connect(MONGODB_URL, {useNewUrlParser: true})
.then(() => {
	server.listen(3000, () => console.log('Server Started'));	
})
.catch(err => console.log(err));


