// controllers/fileController.js
import path from 'path';
import fs from 'fs';
import client, { download_File,getFiles } from '../db/connectDB.js'; // PostgreSQL connection
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

// File upload controller
export const uploadFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { originalname, filename } = req.file;
    
    const userId = req.userId; // Ensure userId is attached from JWT token

    try {
        // Store file metadata in PostgreSQL (raw SQL)
        const filePath = path.join(__dirname, 'uploads', filename);
        const query = 'INSERT INTO files (user_id, filename, file_path) VALUES ($1, $2, $3) RETURNING *';
        const values = [userId, originalname, filePath];

        const result = await client.query(query, values);

        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            file: result.rows[0] // Return the newly created file metadata
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ success: false, message: 'Error uploading file' });
    }
};

// Fetch user files controller
export const getUserFiles = async (req, res) => {
    const userId = req.userId; 

    try {
        const result=await getFiles(userId);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No files found for this user' });
        }
       
        res.status(200).json({
            success: true,
            files: result.rows
        });
    } catch (error) {
        console.error('Error fetching user files:', error);
        res.status(500).json({ success: false, message: 'Error fetching files' });
    }
};

// File download controller

export const downloadFile = async (req, res) => {
    const { fileId } = req.params;
    const userId = req.userId;

    try {
        
        const result = await download_File(fileId, userId);

        const file = result.rows[0];

        const filePath = file.file_path;
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'File not found on server' });
        }

        // Ensure the content type is set to PDF (if file is a PDF)
        res.setHeader('Content-Type', 'application/pdf');
        
        // Add Content-Disposition header to prompt for download with the correct filename
        res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);

        res.download(filePath);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ success: false, message: 'Error downloading file' });
    }
};