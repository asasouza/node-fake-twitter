// modules
const express = require('express');
const { body } = require('express-validator/check');
// imports
const User = require('../models/user');
const userController = require('../controllers/user');
const { isAuth, isPublic } = require('../helpers/isAuth');
const fileUploader = require('../helpers/fileUploader');

const routes = express.Router();

routes.get('/users/:id', isPublic, isAuth, userController.details);

routes.get('/users/:id/followers', isPublic, isAuth, userController.followers);

routes.get('/users/:id/following', isPublic, isAuth, userController.following);

routes.get('/users/:id/tweets', isPublic, isAuth, userController.tweets);

routes.put('/users/:id/follow', isAuth, userController.follow);

routes.put('/users/:id/unfollow', isAuth, userController.unfollow);

routes.put('/users', isAuth, fileUploader('picture'), [
	body('bio')
		.optional()
		.trim()
		.isLength({ max: 160 })
		.withMessage('Must be 160 characters or fewer.'),
	body('username')
		.optional()
		.trim()
		.not()
		.isEmpty()
		.custom((value, { req }) => {
			return User.findOne({ username: value }).then(userDoc => {
				if (userDoc && userDoc._id.toString() !== req.user._id.toString()) {
					return Promise.reject('Username already in use.');
				}
			});
		}),
	body('name')
		.optional()
		.trim()
		.isLength({ max: 50 })
		.withMessage('Must be 50 characters or fewer.')
		.not()
		.isEmpty(),
], userController.update);

module.exports = routes;
