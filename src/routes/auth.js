// modules
const express = require('express');
// imports
const User = require('../models/user');

const routes = express.Router();

routes.get('/signup', async (req, res, next) => {
	const user = await new User({
		username: 'asasouza',
		email: 'asasouza.alex@gmail.com',
		password: '123456'
	})
	.save();
	res.status(201).send(user);
});

module.exports = routes;
