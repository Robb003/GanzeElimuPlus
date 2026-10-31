
const multer = require('multer');
const path = require('path');

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Temporary in-memory storage.
// The controller will upload these files to Cloudinary.
const storage = multer.memoryStorage();

// Check the file type before accepting it.
const fileFilter = (req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (
    file.mimetype !== 'application/pdf' ||
    extension !== '.pdf'
  ) {
    return callback(
      new Error('Only PDF documents are allowed.')
    );
  }

  callback(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
});

// These names must match the React FormData field names.
const documentFields = [
  { name: 'chiefLetter', maxCount: 1 },
  { name: 'feeStructure', maxCount: 1 },
  { name: 'reportCard', maxCount: 1 },
  { name: 'parentIDOrDeathCertificate', maxCount: 1 },
  { name: 'studentIDOrBirthCert', maxCount: 1 },
];

const uploadApplicationDocuments = (req, res, next) => {
  upload.fields(documentFields)(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Each PDF must not exceed 10 MB.',
          });
        }

        if (error.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'You can upload a maximum of five documents.',
          });
        }

        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: `Unexpected document field: ${error.field}`,
          });
        }

        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || 'Document upload failed.',
      });
    }

    // Check the actual PDF file signature.
    // MIME type and file extension alone can be spoofed.
    const files = Object.values(req.files || {}).flat();

    const invalidFile = files.find((file) => {
      return (
        !file.buffer ||
        file.buffer.subarray(0, 5).toString() !== '%PDF-'
      );
    });

    if (invalidFile) {
      return res.status(400).json({
        success: false,
        message: `${invalidFile.originalname} is not a valid PDF document.`,
      });
    }

    next();
  });
};

module.exports = {
  uploadApplicationDocuments,
};
