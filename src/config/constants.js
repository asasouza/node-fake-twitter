const path = require('path');

module.exports.MONGODB_URL = process.env.MONGODB_URL || 'mongodb+srv://testUser:root@faketwitter-sk4bg.mongodb.net/fake-twitter?retryWrites=true';
module.exports.JWT_SECRET = process.env.JWT_SECRET || 'jwt_hash_secret';

module.exports.SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
module.exports.UF_PATH = path.resolve(__dirname, '..', '..', 'uf');

exports.IMAGES_MAX_SIZE = 8000000;
exports.IMAGE_PROFILE_THUMB_SIZE = 360;
exports.IMAGE_PROFILE_ORIGINAL_SIZE = 685;
