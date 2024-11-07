const multer = require("multer")
const path = require("path")

const Storage = multer.diskStorage({
    filename: (req, file, cb) => {
        const fn = Date.now() + path.extname(file.originalname)
        cb(null, fn)
    }
})
// const upload = multer({ storage: Storage }).single("images")

const Upload = multer({ storage: Storage }).fields([
    { name: "photo", maxCount: 1 },
    { name: "resume", maxCount: 1 },
    { name: "expletter", maxCount: 5 },
    { name: "other", maxCount: 5 },
    // { name: "screenshots-Mobile-other", maxCount: 5 },
    // { name: "sections-web-images", maxCount: 1 },
    // { name: "sections-mobile-images", maxCount: 1 },
])
module.exports = { Upload }