// modules
const { validationResult } = require('express-validator/check');
// imports
const Tweet = require('../models/tweet');

exports.list = async (req, res, next) => {
	res.json({ teste: 'list' });
};

exports.details = async (req, res, next) => {
	res.json({ teste: 'details' });
};

exports.create = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error('Validation Failed');
		error.statusCode = 422;
		error.data = errors.array();
		return next(error);
	}

	try {
		const { user, body: { content } } = req;
		const tweet = await new Tweet({
			author: user,
			content,
		}).save();

		if (!tweet) {
			throw new Error();
		}

		tweet.author = { username: user.username, picture: user.picture, _id: user._id };

		res.status(201).json({ 
			message: 'Tweet created!', 
			tweet
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		return next(err);
	}
};
