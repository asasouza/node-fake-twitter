// modules
const express = require('express');
const { body } = require('express-validator/check');
const expressBrute = require('express-brute');
// imports
const User = require('../models/user');
const authController = require('../controllers/auth');

const routes = express.Router();

const store = new expressBrute.MemoryStore();
const bruteForce = new expressBrute(store);

routes.post('/signup', [
	body('email')
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
	body('password')
		.trim()
		.isLength({ min: 6 })
		.withMessage('Password must be at least 6 characters'),
	body('username')
		.trim()
		.not()
		.isEmpty()
		.custom((value, { req }) => {
			return User.findOne({ username: value }).then(userDoc => {
				if (userDoc) {
					return Promise.reject('Username already in use.');
				}
			});
		})
], authController.signup);

routes.post('/login', [
	bruteForce.prevent,
	body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
	body('password').trim().not().isEmpty()
], authController.login);

module.exports = routes;
