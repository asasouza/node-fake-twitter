// modules
const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
// imports
const Tweet = require('../models/tweet');
const User = require('../models/user');

exports.details = async (req, res, next) => {
	const { params: { id } } = req;
	try {
		const user = await User.findById(id);
		if (!user) {
			const error = new Error('User not found!');
			error.statusCode = 404;
			throw error;
		}
		res.json({
			message: 'User found!',
			user: {
				_id: user._id,
				username: user.username,
				bio: user.bio || '',
				picture: user.picture,
				followersCount: user.followers.length,
				followingCount: user.following.length,
			}
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		return next(err);
	}
};

exports.follow = async (req, res, next) => {
	const { params: { id }, user } = req;
	try {
		if (id.toString() === user._id.toString()) {
			return res.json({ message: 'Can\'t follow yourself!' });
		}
		const followedUser = await User.findById(id);
		if (!followedUser) {
			const error = new Error('User not found!');
			error.statusCode = 404;
			throw error;
		}
		if (followedUser.followers.indexOf(user._id.toString()) > -1) {
			return res.json({ message: 'Already following!' });
		}

		followedUser.followers.push(user);
		await followedUser.save();

		user.following.push(followedUser);
		await user.save();

		return res.json({ message: 'Following!' });
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		return next(err);
	}
};

exports.followers = async (req, res, next) => {
	const { params: { id } } = req;
	let { query: { limit, offset } } = req;
	try {
		limit = parseInt(limit, 10) || 20;
		offset = parseInt(offset, 10) || 0;

		const user = await User.findById(id, { followers: { $slice: [offset, limit] } })
		.populate('followers', ['username', 'picture']);

		if (!user) {
			const error = new Error('User not found!');
			error.statusCode = 404;
			throw error;
		}

		let followersCount = await User.findById(id);
		followersCount = followersCount.followers.length;

		return res.json({ 
			message: 'Followers founded!', 
			followers: user.followers,
			moreResults: followersCount > (offset + limit)
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		return next(err);
	}
};

exports.following = async (req, res, next) => {
	const { params: { id } } = req;
	let { query: { limit, offset } } = req;
	try {
		limit = parseInt(limit, 10) || 20;
		offset = parseInt(offset, 10) || 0;

		const user = await User.findById(id, { following: { $slice: [offset, limit] } })
		.populate('following', ['username', 'picture']);

		if (!user) {
			const error = new Error('User not found!');
			error.statusCode = 404;
			throw error;
		}

		let followingCount = await User.findById(id);
		followingCount = followingCount.following.length;

		return res.json({ 
			message: 'Following founded!', 
			following: user.following,
			moreResults: followingCount > (limit + offset)
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		return next(err);
	}
};

exports.unfollow = async (req, res, next) => {
	const { params: { id }, user } = req;
	try {
		const unfollowedUser = await User.findById(id);
		if (!unfollowedUser) {
			const error = new Error('User not found!');
			error.statusCode = 404;
			throw error;
		}

		const userFollowerIndex = unfollowedUser.followers.indexOf(user._id.toString());
		const userFollowingIndex = user.following.indexOf(unfollowedUser._id.toString());

		if (userFollowerIndex === -1) {
			return res.json({ message: 'Already not a follower' });
		}

		unfollowedUser.followers.splice(userFollowerIndex, 1);
		await unfollowedUser.save();

		user.following.splice(userFollowingIndex, 1);
		await user.save();

		return res.json({ message: 'Unfollowed!' });
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

exports.tweets = async (req, res, next) => {
	const { params: { id } } = req;
	let { query: { limit, offset } } = req;
	try {
		limit = parseInt(limit, 10) || 20;
		offset = parseInt(offset, 10) || 0;

		const tweets = await Tweet.find({ author: id })
		.populate('author', ['username', 'picture'])
		.skip(offset)
		.limit(limit)
		.sort({ createdAt: -1 });

		const totalTweets = await Tweet.estimatedDocumentCount({ author: id });

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
		next(err);
	}
};

exports.update = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error('Validation Failed');
		error.statusCode = 422;
		error.data = errors.array();
		return next(error);
	}
	const { body: { email, username, new_password, bio, picture, password }, user } = req;

	try {
		if (!await bcrypt.compare(password, user.password)) {
			const error = new Error('Wrong password');
			error.statusCode = 400;
			throw error;
		}

		if (email) {
			user.email = email;
		}
		if (username) {
			user.username = username;
		}
		if (new_password) {
			user.password = await bcrypt.hash(new_password, 12);
		}
		if (bio !== undefined) {
			user.bio = bio;
		}
		if (picture) {
			user.picture = picture;
		}

		await user.save();
		res.json({ 
			message: 'User updated!', 
			user: {
				username: user.username,
				email: user.email,
				bio: user.bio || '',
				picture: user.picture
			} 
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};
