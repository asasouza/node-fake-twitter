const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tweetSchema = new Schema(
{
	content: {
		type: String,
		required: true,
		maxLength: 140,
	},
	author: {
		type: { type: Schema.Types.ObjectId, ref: 'User' },
		required: true
	},
	likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, 
{ 
	timestamps: true 
});

module.exports = mongoose.model('Tweet', tweetSchema);
