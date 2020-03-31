const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
{
	bio: {
		type: String,
		maxLength: 160
	},
	email: {
		type: String,
		required: true,
	},
	followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
	following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
	name: {
		type: String,
	},
	password: {
		type: String,
		required: true,
	},
	picture: {
		type: String,
	},
	username: {
		type: String,
		required: true
	},
},
{
	timestamps: true
}
);

module.exports = mongoose.model('User', userSchema);
