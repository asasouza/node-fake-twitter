// modules
const { validationResult } = require('express-validator/check');
// imports
const Tweet = require('../models/tweet');

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

exports.delete = async (req, res, next) => {
	const { params: { id }, user } = req;
	try {
		const tweet = await Tweet.findById(id);
		if (!tweet) {
			const error = new Error('Tweet not found!');
			error.statusCode = 404;
			throw error;
		}
		if (tweet.author.toString() !== user._id.toString()) {
			const error = new Error('Only the author can delete this tweet');
			error.statusCode = 403;
			throw error;
		}
		await tweet.delete();
		res.json({ message: 'Tweet deleted' });
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		return next(err);
	}
};

exports.details = async (req, res, next) => {
	const { params: { id } } = req;
	try {
		const tweet = await Tweet.findById(id).populate('author', ['username', 'picture']);
		if (!tweet) {
			const error = new Error('Tweet not found!');
			error.statusCode = 404;
			throw error;
		}
		res.json({ 
			message: 'Tweet found!', 
			tweet: {
				_id: tweet._id,
				author: tweet.author,
				content: tweet.content,
				createdAt: tweet.createdAt,
				updatedAt: tweet.updatedAt,
				likesCount: tweet.likes.length
			}
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		return next(err);
	}
};

exports.list = async (req, res, next) => {
	let { query: { limit, offset } } = req;
	const { user } = req;
	try {
		limit = parseInt(limit, 10) || 20;
		offset = parseInt(offset, 10) || 0;
		const tweets = await Tweet.find({
			$or: [
				{ author: user },
				{ author: { $in: user.following } }

			]
		})
		.populate('author', ['username', 'picture'])
		.skip(offset)
		.limit(limit)
		.sort({ createdAt: -1 });

		const totalTweets = await Tweet.estimatedDocumentCount({
			$or: [
				{ author: user },
				{ author: { $in: user.following } }

			]
		});
		
		const tweetsList = tweets.map(tweet => {
			return {
				_id: tweet._id,
				author: tweet.author,
				content: tweet.content,
				createdAt: tweet.createdAt,
				updatedAt: tweet.updatedAt,
				likesCount: tweet.likes.length
			};
		});

		res.json({ 
			message: 'Tweets Founded', 
			tweets: tweetsList,
			moreResults: totalTweets > (offset + limit)
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		return next(err);
	}
};

exports.update = async (req, res, next) => {
	const { body: { content }, params: { id }, user } = req;
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error('Validation Failed');
		error.statusCode = 422;
		error.data = errors.array();
		return next(error);
	}

	try {
		const tweet = await Tweet.findById(id).populate('author', ['username', 'picture']);
		if (!tweet) {
			const error = new Error('Tweet not found');
			error.statusCode = 404;
			throw error;
		}
		if (tweet.author._id.toString() !== user._id.toString()) {
			const error = new Error('Only the author can update this tweet');
			error.statusCode = 403;
			throw error;
		}

		tweet.content = content;
		await tweet.save();
		res.json({ message: 'Tweet updated successfully', tweet });
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		return next(err);
	}
};
