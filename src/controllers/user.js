// modules
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const sharp = require('sharp');
// imports
const Tweet = require('../models/tweet');
const User = require('../models/user');
// helpers
const { pathToImageProfile } = require('../helpers/pathHelper');
// constants
const { IMAGE_PROFILE_ORIGINAL_SIZE, IMAGE_PROFILE_THUMB_SIZE } = require('../config/constants');

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
				bio: user.bio || '',
				followersCount: user.followers.length,
				followingCount: user.following.length,
				name: user.name,
				picture: pathToImageProfile(user).picture,
				pictureThumb: pathToImageProfile(user).pictureThumb,
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

		const followers = user.followers.map(user => {
			return {
				...user._doc,
				picture: pathToImageProfile(user).picture,
				pictureThumb: pathToImageProfile(user).pictureThumb
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

		const following = user.following.map(user => {
			return {
				...user._doc,
				picture: pathToImageProfile(user).picture,
				pictureThumb: pathToImageProfile(user).pictureThumb
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
				author: {
					...tweet.author._doc,
					picture: pathToImageProfile(tweet.author).picture,
					pictureThumb: pathToImageProfile(tweet.author).pictureThumb
				},
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
	const { body: { bio, name, username }, file, user } = req;
	try {
		if (bio !== undefined) {
			user.bio = bio;
		}

		if(name !== undefined) {
			user.name = name;
		}

		if (username) {
			user.username = username;
		}
		
		if (file) {
			const fileName = file.filename.split('.')[0];
			try {
				await sharp(file.path)
					.resize(IMAGE_PROFILE_THUMB_SIZE, IMAGE_PROFILE_THUMB_SIZE)
					.toFile(path.join(file.destination, `${fileName}-thumb.jpeg`));
					
				await sharp(file.path)
					.resize(IMAGE_PROFILE_ORIGINAL_SIZE, IMAGE_PROFILE_ORIGINAL_SIZE)
					.toFile(path.join(file.destination, `${fileName}-original.jpeg`));
					
				fs.unlink(file.path, error => {
					if (error) {
						return next(error);
					}
				});

				if (user.picture && user.picture !== 'default') {
					fs.unlink(path.join(file.destination, `${user.picture}-thumb.jpeg`), error => {
						if (error) {
							console.log('LOG ERROR', error.message);
						}
					});
					fs.unlink(path.join(file.destination, `${user.picture}-original.jpeg`), error => {
						if (error) {
							console.log('LOG ERROR', error.message);
						}
					});
				}

				user.picture = fileName;
			} catch (err) {
				throw err;
			}
		}

		await user.save();
		res.json({ 
			message: 'User updated!', 
			user: {
				bio: user.bio || '',
				name: user.name,
				username: user.username,
				picture: pathToImageProfile(user).picture,
				pictureThumb: pathToImageProfile(user).pictureThumb,
			} 
		});
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};
