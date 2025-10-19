const { body, validationResult } = require('express-validator');

// Middleware untuk handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validasi gagal',
      errors: errors.array() 
    });
  }
  next();
};

// Validasi untuk register
const validateRegister = [
  body('nama')
    .trim()
    .notEmpty().withMessage('Nama wajib diisi')
    .isLength({ min: 3 }).withMessage('Nama minimal 3 karakter'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email wajib diisi')
    .isEmail().withMessage('Format email tidak valid')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password wajib diisi')
    .isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  
  body('nim')
    .trim()
    .notEmpty().withMessage('NIM wajib diisi')
    .isLength({ min: 8, max: 15 }).withMessage('NIM harus 8-15 karakter'),
  
  body('no_telp')
    .trim()
    .notEmpty().withMessage('Nomor telepon wajib diisi'),
  
  handleValidationErrors
];

// Validasi untuk login
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email wajib diisi')
    .isEmail().withMessage('Format email tidak valid'),
  
  body('password')
    .notEmpty().withMessage('Password wajib diisi'),
  
  handleValidationErrors
];

// Validasi untuk update profile
const validateUpdateProfile = [
  body('nama')
    .optional()
    .trim()
    .isLength({ min: 3 }).withMessage('Nama minimal 3 karakter'),
  
  body('no_telp')
    .optional()
    .trim(),
  
  body('alamat')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Alamat maksimal 500 karakter'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Bio maksimal 500 karakter'),
  
  handleValidationErrors
];

// Validasi untuk update password
const validateUpdatePassword = [
  body('oldPassword')
    .notEmpty().withMessage('Password lama wajib diisi'),
  
  body('newPassword')
    .notEmpty().withMessage('Password baru wajib diisi')
    .isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateUpdatePassword
};