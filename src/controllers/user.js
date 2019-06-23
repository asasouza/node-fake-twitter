// modules
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const sharp = require('sharp');
// imports
const Tweet = require('../models/tweet');
const User = require('../models/user');
// constants
const { SITE_URL } = require('../config/constants');
// helpers
const { pathToImageProfile } = require('../helpers/pathHelper');

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
				picture: pathToImageProfile(user).picture,
				pictureThumb: pathToImageProfile(user).pictureThumb,
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
	const { body: { email, username, new_password, bio, password }, file, user } = req;

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
		if (file) {
			const fileName = file.filename.split('.')[0];
			await sharp(file.path)
				.resize(360, 360)
				.toFile(path.join(file.destination, `${fileName}-thumb.jpeg`));
			await sharp(file.path)
				.resize(685, 685)
				.toBuffer(async (err, buffer) => {
					if (err) { throw err; }
					await fs.writeFile(path.join(file.destination, `${fileName}.jpeg`), buffer, error => { 
						if (error) {
							throw error; 
						}
					});
				});
			await fs.unlink(file.path, error => {
				if (error) {
					throw error;
				}
			});

			if (user.picture) {
				await fs.unlink(path.join(file.destination, `${user.picture}-thumb.jpeg`), error => {
					if (error) {
						throw error;
					}
				});
				await fs.unlink(path.join(file.destination, `${user.picture}.jpeg`), error => {
					if (error) {
						throw error;
					}
				});
			}

			user.picture = fileName;
		}

		await user.save();
		res.json({ 
			message: 'User updated!', 
			user: {
				username: user.username,
				email: user.email,
				bio: user.bio || '',
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
