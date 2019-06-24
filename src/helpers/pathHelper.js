// constants
const { SITE_URL } = require('../config/constants');

exports.pathToImageProfile = (user) => {
	return {
		picture: `${SITE_URL}/uf/${user._id.toString()}/${user.picture}-original.jpeg`,
		pictureThumb: `${SITE_URL}/uf/${user._id.toString()}/${user.picture}-thumb.jpeg`
	};
};
