const fs = require('fs');
const path = require('path');

const multer = require('multer');

const { UF_PATH } = require('../config/constants');

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const filePath = path.join(UF_PATH, req.user._id.toString());
		if (!fs.existsSync(filePath)) {
			fs.mkdirSync(filePath);
		}
		cb(null, filePath);
	},
	filename: async (req, file, cb) => {
		cb(null, `profile-${Date.now()}${path.extname(file.originalname)}`);
	}
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const fileUploader = multer({ storage, fileFilter });

module.exports = fileUploader;
