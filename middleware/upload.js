const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("@aws-sdk/client-s3");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Allowed types: PDF, JPEG, PNG, DOC, DOCX"), false);
  }
}

//Upload CSV to S3
const uploadFiles = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const filename = `nortifi/attachments/${Date.now()}-${file.originalname}`;
      cb(null, filename);
    },
  }),
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, //Limit to 20mb
    files: 5, //Allow 5 files
  }
}).array("attachments", 5);

module.exports = { uploadFiles };
