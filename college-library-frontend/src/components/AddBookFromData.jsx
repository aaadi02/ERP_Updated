import React from 'react';
import AddBook from './AddBook';

const AddBookFromData = () => {
  const bookData = {
    "ACCDATE": "27/07/2024",
    "STATUS": "PRESENT",
    "ACCNO": 248,
    "SERIESCODE": "MBA",
    "CLASSNO": "657.42",
    "AUTHOR": "Arora, M.N",
    "TITLENAME": "Cost And Management Accounting (Theoyr, Problems & Solutions)",
    "PUBLISHER NAME": "Himalay Pub",
    "CITY": "Mumbai",
    "PUB.YEAR": 2023,
    "PAGES": "19.14",
    "VENDER CITY": "Himalaya Publishing House,Nagpur",
    "INVOICENO": "HNR/IN/1093",
    "INVOICE_DATE": "30/03/2024",
    "SUB SUBJECT NAME": "Accounting",
    "PRINTPRICE": 1595,
    "PURPRICE": 1595,
    "REFCIR": "R"
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add Book from Data</h1>
      <AddBook initialData={bookData} />
    </div>
  );
};

export default AddBookFromData; 