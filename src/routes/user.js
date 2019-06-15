// modules
const express = require('express');
const { body } = require('express-validator/check');
// imports
const User = require('../models/user');
const userController = require('../controllers/user');
const isAuth = require('../helpers/isAuth');

const routes = express.Router();

routes.get('/users/:id', userController.details);

routes.get('/users/:id/followers', userController.followers);

routes.get('/users/:id/following', userController.following);

routes.put('/users/:id/follow', isAuth, userController.follow);

routes.put('/users/:id/unfollow', isAuth, userController.unfollow);

routes.put('/users', isAuth, [
	body('email')
		.optional()
		.isEmail()
		.withMessage('Enter a valid e-mail address')
		.custom((value, { req }) => {
			return User.findOne({ email: value }).then(userDoc => {
				if (userDoc) {
					return Promise.reject('E-mail address already in use.');
				}
			});
		})
		.normalizeEmail({ gmail_remove_dots: false }),
	body('new_password')
		.optional()
		.trim()
		.isLength({ min: 6 })
		.withMessage('New password must be at least 6 characters'),
	body('password')
		.not()
		.isEmpty()
		.withMessage('Enter the current password to apply changes'),
	body('username')
		.optional()
		.trim()
		.not()
		.isEmpty()
		.custom((value, { req }) => {
			return User.findOne({ username: value }).then(userDoc => {
				if (userDoc) {
					return Promise.reject('Username already in use.');
				}
			});
		}),
	body('bio')
		.optional()
		.trim()
		.isLength({ max: 280 })
		.withMessage('Bio maximum characters is 280')
], userController.update);

module.exports = routes;
