// modules
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sizeOf = require('buffer-image-size');
// const sizeOf = require('image-size');
// constants
const { IMAGES_MAX_SIZE, IMAGE_PROFILE_ORIGINAL_SIZE, UF_PATH } = require('../config/constants');

// const storage = multer.diskStorage({
// 	destination: (req, file, cb) => {
// 		const filePath = path.join(UF_PATH, req.user._id.toString());
// 		if (!fs.existsSync(filePath)) {
// 			fs.mkdirSync(filePath);
// 		}
// 		cb(null, filePath);
// 	},
// 	filename: async (req, file, cb) => {
// 		cb(null, `${Date.now()}${path.extname(file.originalname)}`);
// 	}
// });

const fileFilter = (req, file, cb) => {
	if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
		cb(null, true);
	} else {
		const error = new Error('Validation Failed');
		error.statusCode = 422;
		error.data = [{
			location: 'file',
			msg: 'Allowed image extensions are png, jpg, jpeg.',
			value: file.originalname,
			param: file.fieldname
		}];
		cb(error, false);
	}
};

const limits = {
	fileSize: IMAGES_MAX_SIZE
};

const fileUploader = multer({ 
	// storage, 
	fileFilter, 
	limits 
});

module.exports = (field) => {
	return (req, res, next) => {
		fileUploader.single(field)(req, res, err => {
			if (err) {
				if (!err.statusCode) {
					err.statusCode = 422;
				}
				if (!err.data) {
					err.data = [{
						location: 'file',
						msg: err.message,
						param: field
					}];
				}
				err.message = 'Validation Failed';
				return next(err);
			}
			if (req.file) {
				const dimensions = sizeOf(req.file.buffer);
				if (dimensions.width < IMAGE_PROFILE_ORIGINAL_SIZE || dimensions.height < IMAGE_PROFILE_ORIGINAL_SIZE) {
					const error = new Error('Validation Failed');
					error.statusCode = 422;
					error.data = [{
						location: 'file',
						msg: `Image too small. Must have at least ${IMAGE_PROFILE_ORIGINAL_SIZE}px of width and height.`,
						param: field,
					}];
					// fs.unlink(req.file.path, err => {
					// 	if (err) {
					// 		return next(err);
					// 	}
					// });
					return next(error);
				}
			}
			next();
		});
	};
};
