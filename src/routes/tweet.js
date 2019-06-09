// modules
const express = require('express');
const { body } = require('express-validator/check');
// imports
const tweetController = require('../controllers/tweet');
const isAuth = require('../helpers/isAuth');

const routes = express.Router();

routes.get('/tweets', isAuth, tweetController.list);

routes.get('/tweets/:id', tweetController.details);

routes.delete('/tweets/:id', isAuth, tweetController.delete);

routes.put('/tweets/:id', isAuth, [
	body('content')
		.trim()
		.isLength({ max: 140 })
		.withMessage('Tweet content max characters is 140')
		.not()
		.isEmpty()
		.withMessage('Tweet content must not be empty')
], tweetController.update);

routes.post('/tweets', isAuth, [
	body('content')
		.trim()
		.isLength({ max: 140 })
		.withMessage('Tweet content max characters is 140')
		.not()
		.isEmpty()
		.withMessage('Tweet content must not be empty')
], tweetController.create);

module.exports = routes;
