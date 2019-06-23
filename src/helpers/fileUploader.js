const fs = require('fs');
const path = require('path');

const multer = require('multer');

const { IMAGES_MAX_SIZE, UF_PATH } = require('../config/constants');

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const filePath = path.join(UF_PATH, req.user._id.toString());
		if (!fs.existsSync(filePath)) {
			fs.mkdirSync(filePath);
		}
		cb(null, filePath);
	},
	filename: async (req, file, cb) => {
		cb(null, `${Date.now()}${path.extname(file.originalname)}`);
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

const limits = {
	fileSize: IMAGES_MAX_SIZE
};

const fileUploader = multer({ storage, fileFilter, limits });

module.exports = fileUploader;
