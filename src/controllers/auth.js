// modules
const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// imports
const User = require('../models/user');
// constants
const { JWT_SECRET } = require('../config/constants');
// helper
const { pathToImageProfile } = require('../helpers/pathHelper');

exports.signup = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error('Validation Failed');
		error.statusCode = 422;
		error.data = errors.array();
		return next(error);
	}
	const { email, password, username } = req.body;
	try {
		const hashedPassword = await bcrypt.hash(password, 12);
		const user = await new User({
			email,
			password: hashedPassword,
			username
		}).save();
		const token = jwt.sign(
			{
				email,
				userID: user._id.toString()
			},
			JWT_SECRET
		);
		res.status(201).json({ message: 'User created!', userID: user._id, token });
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		return next(err);
	}
};

exports.login = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error('Validation Failed');
		error.statusCode = 422;
		error.data = errors.array();
		return next(error);
	}
	const { email, password } = req.body;

	const user = await User.findOne({ email });
	if (!user) {
		const error = new Error('Wrong email or password!');
		error.statusCode = 401;
		return next(error);
	}

	if (!await bcrypt.compare(password, user.password)) {
		const error = new Error('Wrong email or password!');
		error.statusCode = 401;
		return next(error);
	}
	const token = jwt.sign(
		{
			email,
			userID: user._id.toString()
		},
		JWT_SECRET
	);
	res.status(200).json({ 
		token, 
		userID: user._id.toString(),
		username: user.username,
		picture: pathToImageProfile(user).picture,
		pictureThumb: pathToImageProfile(user).pictureThumb,
		bio: user.bio
	});
};

exports.validate = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error('Validation Failed');
		error.statusCode = 422;
		error.data = errors.array();
		return next(error);
	}
	res.status(200).json();
}
