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
		
		tweet.author = {
			name: user.name, 
			picture: user.picture,
			pictureThumb: user.pictureThumb,
			username: user.username,
		};

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
	const { params: { id }, user } = req;
	try {
		const tweet = await Tweet.findById(id).populate('author', ['name', 'picture', 'pictureThumb', 'username']);
		if (!tweet) {
			const error = new Error('Tweet not found!');
			error.statusCode = 404;
			throw error;
		}
		const isLiked = user ? tweet.likes.includes(user._id.toString()) : false;
		res.json({ 
			message: 'Tweet found!', 
			tweet: {
				_id: tweet._id,
				author: tweet.author._doc,
				content: tweet.content,
				createdAt: tweet.createdAt,
				isLiked,
				likesCount: tweet.likes.length,
				updatedAt: tweet.updatedAt,
			}
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		return next(err);
	}
};

exports.like = async (req, res, next) => {
	const { params: { id }, user } = req;
	try {
		const tweet = await Tweet.findById(id);
		if (!tweet) {
			const error = new Error('Tweet not found!');
			error.statusCode = 404;
			throw error;
		}

		if (tweet.likes.indexOf(user._id.toString()) > -1) {
			return res.json({ message: 'Tweet already liked!' });
		}

		tweet.likes.push(user);
		await tweet.save();

		return res.json({ message: 'Liked!' });
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.likes = async (req, res, next) => {
	let { query: { limit, offset } } = req;
	const { params: { id }, user: loggedUser } = req;
	try {
		limit = parseInt(limit, 10) || 20;
		offset = parseInt(offset, 10) || 0;

		const tweet = await Tweet.findById(id, { likes: { $slice: [offset, limit] } })
		.populate('likes', ['bio', 'followers', 'name', 'picture', 'pictureThumb', 'username']);

		if (!tweet) {
			const error = new Error('Tweet not found!');
			error.statusCode = 404;
			throw error;
		}

		let likesCount = await Tweet.findById(id);
		likesCount = likesCount.likes.length;
		const likes = tweet.likes.map(user => {
			return {
				_id: user._id,
				bio: user.bio,
				isFollowing: loggedUser ? user.followers.includes(loggedUser._id.toString()) : false,
				name: user.name,
				picture: user.picture,
				pictureThumb: user.pictureThumb,
				username: user.username,
			};
		});

		res.json({ 
			likes,
			message: 'Liked list found!',
			moreResults: likesCount > (limit + offset)
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
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
		.populate('author', ['name', 'picture', 'pictureThumb', 'username'])
		.skip(offset)
		.limit(limit)
		.sort({ createdAt: -1 });

		const totalTweets = await Tweet.countDocuments({
			$or: [
				{ author: user },
				{ author: { $in: user.following } }

			]
		});
		
		const tweetsList = tweets.map(tweet => {
			return {
				_id: tweet._id,
				author: tweet.author._doc,
				content: tweet.content,
				createdAt: tweet.createdAt,
				isLiked: tweet.likes.includes(user._id.toString()),
				likesCount: tweet.likes.length,
				updatedAt: tweet.updatedAt,
			};
		});

		res.json({ 
			message: 'Tweets Founded', 
			moreResults: totalTweets > (offset + limit),
			tweets: tweetsList,
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		return next(err);
	}
};

exports.unlike = async (req, res, next) => {
	const { params: { id }, user } = req;
	try {
		const tweet = await Tweet.findById(id);
		if (!tweet) {
			const error = new Error('Tweet not found!');
			error.statusCode = 500;
			throw error;
		}

		const likeIndex = tweet.likes.indexOf(user._id.toString());
		if (likeIndex === -1) {
			return res.json({ message: 'Tweet already unliked' });
		}

		tweet.likes.splice(likeIndex, 1);
		await tweet.save();

		return res.json({ message: 'Unliked' });
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
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
		const tweet = await Tweet.findById(id).populate('author', ['picture', 'pictureThumb', 'username']);
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

		tweet.author.set('picture', user.picture, { strict: false });
		tweet.author.set('pictureThumb', user.pictureThumb, { strict: false });

		res.json({ message: 'Tweet updated successfully', tweet });
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		return next(err);
	}
};

