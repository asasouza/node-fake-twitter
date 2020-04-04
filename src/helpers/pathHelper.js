// constants
const { SITE_URL } = require('../config/constants');

exports.pathToImageProfile = (user) => {
	if (user.picture == 'default') {
		return {
			picture: `${SITE_URL}/uf/default/default-original.png`,
			pictureThumb: `${SITE_URL}/uf/default/default-thumb.png`
		}
	}
	return {
		picture: `${SITE_URL}/uf/${user._id.toString()}/${user.picture}-original.jpeg`,
		pictureThumb: `${SITE_URL}/uf/${user._id.toString()}/${user.picture}-thumb.jpeg`
	};
};
