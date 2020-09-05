// modules
const { validationResult } = require('express-validator/check');
// const fs = require('fs');
// const path = require('path');
const sharp = require('sharp');
// imports
const Tweet = require('../models/tweet');
const User = require('../models/user');
// constants
const { IMAGE_PROFILE_ORIGINAL_SIZE, IMAGE_PROFILE_THUMB_SIZE } = require('../config/constants');

exports.details = async (req, res, next) => {
	const { params: { id }, loggedUser } = req;
	try {
		const user = await User.findById(id);
		if (!user) {
			const error = new Error('User not found!');
			error.statusCode = 404;
			throw error;
		}
		const totalTweets = await Tweet.estimatedDocumentCount({ author: id });

		res.json({
			message: 'User found!',
			user: {
				_id: user._id,
				bio: user.bio || '',
				createdAt: user.createdAt,
				followersCount: user.followers.length,
				followingCount: user.following.length,
				isFollowing: loggedUser ? user.followers.includes(loggedUser._id.toString()) : false,
				name: user.name,
				picture: user.picture,
				pictureThumb: user.pictureThumb,
				totalTweets,
				username: user.username,
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
	const { params: { id }, loggedUser } = req;
	let { query: { limit, offset } } = req;
	try {
		limit = parseInt(limit, 10) || 20;
		offset = parseInt(offset, 10) || 0;

		const user = await User.findById(id, { followers: { $slice: [offset, limit] } })
			.populate('followers', ['bio', 'followers', 'name', 'picture', 'pictureThumb', 'username']);

		if (!user) {
			const error = new Error('User not found!');
			error.statusCode = 404;
			throw error;
		}

		let followersCount = await User.findById(id);
		followersCount = followersCount.followers.length;

		const followers = user.followers.map(user => {
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

		return res.json({
			followers,
			message: 'Followers founded!',
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
	const { params: { id }, loggedUser } = req;
	let { query: { limit, offset } } = req;
	try {
		limit = parseInt(limit, 10) || 20;
		offset = parseInt(offset, 10) || 0;

		const user = await User.findById(id, { following: { $slice: [offset, limit] } })
			.populate('following', ['bio', 'followers', 'name', 'picture', 'pictureThumb', 'username']);

		if (!user) {
			const error = new Error('User not found!');
			error.statusCode = 404;
			throw error;
		}

		let followingCount = await User.findById(id);
		followingCount = followingCount.following.length;

		const following = user.following.map(user => {
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

		return res.json({
			following,
			message: 'Following founded!',
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
	const { params: { id }, user } = req;
	let { query: { limit, offset } } = req;
	try {
		limit = parseInt(limit, 10) || 20;
		offset = parseInt(offset, 10) || 0;

		const tweets = await Tweet.find({ author: id })
			.populate('author', ['name', 'picture', 'pictureThumb', 'username'])
			.skip(offset)
			.limit(limit)
			.sort({ createdAt: -1 });

		const totalTweets = await Tweet.estimatedDocumentCount({ author: id });

		const tweetsList = tweets.map(tweet => {
			return {
				_id: tweet._id,
				author: tweet.author._doc,
				content: tweet.content,
				createdAt: tweet.createdAt,
				isLiked: user ? tweet.likes.includes(user._id.toString()) : false,
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
	const { body: { bio, name, username }, file, user } = req;
	try {
		if (bio !== undefined) {
			user.bio = bio;
		}

		if (name !== undefined) {
			user.name = name;
		}

		if (username) {
			user.username = username;
		}

		if (file) {
			// const fileName = file.filename.split('.')[0];
			try {
				const original = await sharp(file.buffer)
					.resize(IMAGE_PROFILE_ORIGINAL_SIZE, IMAGE_PROFILE_ORIGINAL_SIZE)
					// .toFile(path.join(file.destination, `${fileName}-original.jpeg`));
					.toBuffer();

				const thumbnail = await sharp(file.buffer)
					.resize({ height: IMAGE_PROFILE_THUMB_SIZE, width: IMAGE_PROFILE_THUMB_SIZE})
					// .toFile(path.join(file.destination, `${fileName}-thumb.jpeg`));
					.toBuffer();

				user.picture = original.toString('base64');
				user.pictureThumb = thumbnail.toString('base64');
				// fs.unlink(file.path, error => {
				// 	if (error) {
				// 		return next(error);
				// 	}
				// });

				// if (user.picture && user.picture !== 'default') {
				// 	fs.unlink(path.join(file.destination, `${user.picture}-thumb.jpeg`), error => {
				// 		if (error) {
				// 			console.log('LOG ERROR', error.message);
				// 		}
				// 	});
				// 	fs.unlink(path.join(file.destination, `${user.picture}-original.jpeg`), error => {
				// 		if (error) {
				// 			console.log('LOG ERROR', error.message);
				// 		}
				// 	});
				// }

				// user.picture = fileName;
			} catch (err) {
				throw err;
			}
		}

		await user.save();
		res.json({
			message: 'User updated!',
			user: {
				bio: user.bio || '',
				_id: user._id,
				name: user.name,
				picture: user.picture,
				pictureThumb: user.pictureThumb,
				username: user.username,
			}
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};
