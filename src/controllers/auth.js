// modules
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator/check');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const path = require('path');
// imports
const User = require('../models/user');
// constants
const { JWT_SECRET } = require('../config/constants');

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
		let picture = fs.readFileSync(path.join(__dirname, '..', '..', 'uf', 'default', 'default-original.png'));
		picture = picture.toString('base64');
		let pictureThumb = fs.readFileSync(path.join(__dirname, '..', '..', 'uf', 'default', 'default-thumb.png'));
		pictureThumb = picture.toString('base64');

		const user = await new User({
			email,
			password: hashedPassword,
			picture,
			pictureThumb,
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
		bio: user.bio,
		name: user.name,
		picture: user.picture,
		pictureThumb: user.pictureThumb,
		token, 
		userID: user._id.toString(),
		username: user.username,
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
};
