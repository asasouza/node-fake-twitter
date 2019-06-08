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
	// res.json({ teste: req.user.username });
};
