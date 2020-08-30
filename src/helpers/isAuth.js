// modules
const jwt = require('jsonwebtoken');
// imports
const User = require('../models/user');
// constants
const { JWT_SECRET } = require('../config/constants');

exports.isAuth = async (req, res, next) => {
	if (!req.headers.authorization) {
		if (req.public) {
			return next();
		}
		const error = new Error('Forbidden route, to access must provide a valid Authorization');
		error.statusCode = 403;
		return next(error);
	}
	const token = req.headers.authorization.split(' ')[1];
	
	try {
		const decodedData = jwt.verify(token, JWT_SECRET);

		const user = await User.findById(decodedData.userID);
		if (!user) {
			const error = new Error('Could not find user provided by Authorization');
			error.statusCode = 403;
			return next(error);
		}

		req.user = user;

		next();
	} catch (err) {
		err.statusCode = 403;
		return next(err);
	}
};

exports.isPublic = (req, res, next) => {
	req.public = true;
	next();
}
