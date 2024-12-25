import { downloadFile, uploadFile, getUserFiles } from '../controllers/upload.controller.js'
import { verifyToken } from '../middleware/verifyToken.js'
import router from './auth.route.js'
import multer from 'multer';

const upload = multer({
    dest: 'uploads/', 
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true); 
        } else {
            cb(new Error('Only image and PDF files are allowed!'), false);
        }
    }
});


router.post('/upload', verifyToken, upload.single('file'), uploadFile);

router.get('/user-files', verifyToken, getUserFiles);

router.get('/download/:fileId', verifyToken, downloadFile);

export default router