const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Pastikan folder uploads/profiles ada
const uploadDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Folder uploads/profiles berhasil dibuat');
}

// Konfigurasi storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Format: profile_userId_timestamp.extension
    const userId = req.params.id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `profile_${userId}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

// Filter file - hanya terima jpg, jpeg, png
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Hanya file JPG, JPEG, dan PNG yang diperbolehkan!'));
  }
};

// Setup multer
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024  // Max 5MB
  },
  fileFilter: fileFilter
});

module.exports = upload;