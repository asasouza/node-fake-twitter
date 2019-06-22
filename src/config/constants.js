const path = require('path');

module.exports.MONGODB_URL = 'mongodb+srv://commonUser:root@faketwitter-sk4bg.mongodb.net/fake-twitter?retryWrites=true';
module.exports.JWT_SECRET = 'jwt_hash_secret';

module.exports.UF_PATH = path.resolve(__dirname, '..', '..', 'uf');
