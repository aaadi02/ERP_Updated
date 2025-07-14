import React, { useState } from 'react';
import axios from 'axios';

const MaterialUpload = () => {
  const [form, setForm] = useState({ title: '', subject: '', description: '', file: null });
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  const handleChange = e => {
    if (e.target.name === 'file') {
      setForm({ ...form, file: e.target.files[0] });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    const data = new FormData();
    data.append('title', form.title);
    data.append('subject', form.subject);
    data.append('description', form.description);
    data.append('file', form.file);

    try {
      await axios.post('/api/upload-material', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total))
      });
      setMessage('Upload successful!');
      setForm({ title: '', subject: '', description: '', file: null });
      setProgress(0);
    } catch (err) {
      setMessage('Upload failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded">
      <input name="title" value={form.title} onChange={handleChange} placeholder="Title" required className="block w-full border p-2" />
      <input name="subject" value={form.subject} onChange={handleChange} placeholder="Subject" required className="block w-full border p-2" />
      <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="block w-full border p-2" />
      <input type="file" name="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" onChange={handleChange} required className="block" />
      {progress > 0 && <progress value={progress} max="100">{progress}%</progress>}
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Upload</button>
      {message && <div>{message}</div>}
    </form>
  );
};

export default MaterialUpload;