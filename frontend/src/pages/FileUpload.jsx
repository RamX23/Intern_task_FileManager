import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import axios from 'axios';
import Navbar from '../components/Navbar';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const { isLoading, FileUpload, FetchFiles } = useAuthStore();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await FileUpload(formData);
      toast.success("File uploaded successfully");
      fetchFilesFromServer();  // Fetch updated file list after upload
      setFile(null);
    } catch (err) {
      console.log("Error occurred while uploading file", err);
      toast.error("Error uploading file");
    }
  };

  const fetchFilesFromServer = async () => {
    try {
      await FetchFiles();
      
      // Access the files from the Zustand store
      const { files } = useAuthStore.getState();  
      console.log("Files from state:", files);

      if (files) {
        // Assuming each file object has 'filename' and 'id' properties
        const updatedFiles = files.map((file) => ({
          id: file.id, 
          filename: file.filename, 
          downloadUrl: `/api/download/${file.id}`
        }));

        setFiles(updatedFiles);  // Set the updated files to local state
      } else {
        console.error('No files found in the response');
        setFiles([]);
      }
    } catch (error) {
      console.error('Error fetching files from server:', error);
      toast.error("Error fetching files");
    }
  };

  useEffect(() => {
    fetchFilesFromServer();
  }, []);

  const handleDownload = async (fileId) => {
    try {
      const response = await axios({
        url: `/api/download/${fileId}`,
        method: 'GET',
        responseType: 'blob',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `file-${fileId}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error("Error downloading file");
    }
  };

  return (
    <div className="file-upload-container min-h-screen items-center justify-center relative overflow-hidden'">
      <Navbar/>
      <h1 className='h1 text-info flex justify-center'>Upload and Manage Your Files</h1>

      <form onSubmit={handleSubmit} className="upload-form flex justify-center m-4 p-2 px-5">
        <input type="file" className='w-120 btn btn-secondary flex justify-end p-1 px-5 mx-5' onChange={handleFileChange} />
        <button type="submit" className='btn btn-primary mx-5' disabled={isLoading}>Upload</button>
      </form>

      <h3 className='h3 text-info px-5'>Your Files</h3>
      <div className="files-list p-5">
        {files.length > 0 ? (
          files.map((file) => (
            <div key={file.id} className="file-item flex p-1 w-150 justify-between border border-primary my-2 bg-light">
              <p className='fs-5 text-secondary-emphasis flex align-center'>{file.filename}</p>
              <button className="btn btn-primary mx-5" onClick={() => handleDownload(file.id)} >
                Download
              </button>
            </div>
          ))
        ) : (
          <p>No files available</p>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
