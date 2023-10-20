const multer = require('multer')
const storage = multer.diskStorage({})

const imageFileFilter = (req, file, callback) => {
    if (!file.mimetype.startsWith("image")) {
        callback("Supported only image files", false)
    }
    callback(null, true)
}

const videoFileFilter = (req, file, callback) => {
    if (!file.mimetype.startsWith("video")) {
        callback("Supported only image files", false)
    }
    callback(null, true)
}

exports.uploadImage = multer({storage, fileFilter: imageFileFilter})
exports.uploadVideo = multer({storage, fileFilter: videoFileFilter})
