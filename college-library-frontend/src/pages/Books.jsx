// import React, { useState } from 'react';
// import { Button, TextField, Grid, Typography } from '@mui/material';

// const Books = () => {
//   const [books, setBooks] = useState([
//     { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', year: '1925' },
//     { id: 2, title: '1984', author: 'George Orwell', year: '1949' },
//     // Add more mock books here
//   ]);

//   const [newBook, setNewBook] = useState({ title: '', author: '', year: '' });

//   const handleAddBook = () => {
//     setBooks([...books, { ...newBook, id: books.length + 1 }]);
//     setNewBook({ title: '', author: '', year: '' });
//   };

//   return (
//     <div>
//       <Typography variant="h4" gutterBottom>
//         Manage Books
//       </Typography>

//       {/* Add New Book Form */}
//       <Grid container spacing={2}>
//         <Grid item xs={12} sm={4}>
//           <TextField
//             label="Title"
//             fullWidth
//             value={newBook.title}
//             onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
//           />
//         </Grid>
//         <Grid item xs={12} sm={4}>
//           <TextField
//             label="Author"
//             fullWidth
//             value={newBook.author}
//             onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
//           />
//         </Grid>
//         <Grid item xs={12} sm={4}>
//           <TextField
//             label="Year"
//             fullWidth
//             value={newBook.year}
//             onChange={(e) => setNewBook({ ...newBook, year: e.target.value })}
//           />
//         </Grid>
//         <Grid item xs={12}>
//           <Button variant="contained" onClick={handleAddBook}>
//             Add Book
//           </Button>
//         </Grid>
//       </Grid>

//       {/* List of Books */}
//       <Grid container spacing={2} style={{ marginTop: '20px' }}>
//         {books.map((book) => (
//           <Grid item xs={12} sm={6} md={4} key={book.id}>
//             <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
//               <Typography variant="h6">{book.title}</Typography>
//               <Typography variant="body2">Author: {book.author}</Typography>
//               <Typography variant="body2">Year: {book.year}</Typography>
//             </div>
//           </Grid>
//         ))}
//       </Grid>
//     </div>
//   );
// };

// export default Books;


import { useState } from "react";
import { BookOpen, Plus, X, Edit2, Search } from "lucide-react";

export default function ImprovedBooks() {
  const [books, setBooks] = useState([
    { id: 1, title: "The Great Gatsby", author: "F. Scott Fitzgerald", year: "1925" },
    { id: 2, title: "1984", author: "George Orwell", year: "1949" },
    { id: 3, title: "To Kill a Mockingbird", author: "Harper Lee", year: "1960" },
    { id: 4, title: "The Catcher in the Rye", author: "J.D. Salinger", year: "1951" },
    { id: 5, title: "Pride and Prejudice", author: "Jane Austen", year: "1813" },
  ]);

  const [newBook, setNewBook] = useState({ title: "", author: "", year: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const toggleForm = () => {
    setIsFormOpen(!isFormOpen);
  };

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <BookOpen className="h-8 w-8 text-indigo-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">Book Collection</h1>
        </div>
        <button
          onClick={toggleForm}
          className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
        >
          {isFormOpen ? (
            <>
              <X className="h-5 w-5 mr-2" /> Cancel
            </>
          ) : (
            <>
              <Plus className="h-5 w-5 mr-2" /> Add New Book
            </>
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-8 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search books by title or author..."
          className="pl-10 pr-4 py-3 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Add New Book Form */}
      {isFormOpen && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Add New Book</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={newBook.title}
                onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Author
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={newBook.year}
                onChange={(e) => setNewBook({ ...newBook, year: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Books Display Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
          <Edit2 className="h-5 w-5 mr-2 text-indigo-600" />
          Your Collection ({filteredBooks.length} books)
        </h2>

        {filteredBooks.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg shadow-sm border border-gray-200">
            <p className="text-gray-500">No books found. Add some books to your collection!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200"
              >
                <div className="bg-indigo-100 py-2 px-4 border-l-4 border-indigo-600">
                  <p className="text-xs font-medium text-indigo-800">Published: {book.year}</p>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{book.title}</h3>
                  <p className="text-gray-600">
                    by <span className="font-medium">{book.author}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}