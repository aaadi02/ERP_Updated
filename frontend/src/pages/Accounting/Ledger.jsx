import React, { useEffect, useState } from "react";

// DCR export helper (PDF format based on DCR format from image)
function exportToDCR(
  data,
  dateFrom = "",
  dateTo = "",
  filename = "DCR_report.pdf"
) {
  // Create HTML content for PDF
  const htmlContent = generateDCRHTML(data, dateFrom, dateTo);

  // Create a new window for PDF generation
  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Daily Cash Report</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            font-size: 12px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
            font-weight: bold;
          }
          .institute-name { 
            font-size: 16px; 
            font-weight: bold; 
            margin-bottom: 5px; 
          }
          .subtitle { 
            font-size: 12px; 
            margin-bottom: 10px; 
          }
          .report-title { 
            font-size: 14px; 
            font-weight: bold; 
            margin: 10px 0; 
          }
          .date-range { 
            font-size: 12px; 
            margin-bottom: 20px; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 15px; 
          }
          th, td { 
            border: 1px solid #000; 
            padding: 4px; 
            text-align: left; 
            font-size: 10px;
          }
          th { 
            background-color: #f0f0f0; 
            font-weight: bold; 
            text-align: center;
          }
          .amount { 
            text-align: right; 
          }
          .total-row { 
            font-weight: bold; 
            background-color: #f9f9f9; 
          }
          .section-title { 
            font-weight: bold; 
            margin: 15px 0 10px 0; 
            font-size: 12px; 
          }
          .notes { 
            font-size: 10px; 
            margin-top: 20px; 
          }
          .footer { 
            margin-top: 20px; 
            font-size: 10px; 
          }
          @media print { 
            body { margin: 0; } 
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function generateDCRHTML(data, dateFrom, dateTo) {
  // Calculate totals
  const totalReceipts = data
    .filter((e) => e.type === "Payment")
    .reduce(
      (sum, entry) =>
        typeof entry.amount === "number" && !isNaN(entry.amount)
          ? sum + entry.amount
          : sum,
      0
    );
  const totalPayments = data
    .filter((e) => e.type === "Expense")
    .reduce(
      (sum, entry) =>
        typeof entry.amount === "number" && !isNaN(entry.amount)
          ? sum + Math.abs(entry.amount)
          : sum,
      0
    );

  // Get receipts data
  const receipts = data
    .filter((e) => e.type === "Payment")
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  let html = `
    <div class="header">
      <div class="institute-name">NAGARJUNA INSTITUTE OF ENGINEERING, TECHNOLOGY & MANAGEMENT</div>
      <div class="subtitle">(A premier Educational Society)</div>
      <div class="report-title">Daily Cash Report</div>
      <div class="date-range">Receipt Date: From ${
        dateFrom || new Date().toLocaleDateString()
      } To ${dateTo || new Date().toLocaleDateString()}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Receipt No.</th>
          <th>Session</th>
          <th>Student Name</th>
          <th>Course</th>
          <th>Fee Head</th>
          <th>Payment Mode</th>
          <th>Chq/DD No.</th>
          <th>Remarks</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
  `;

  // Add receipts rows
  receipts.forEach((entry, index) => {
    html += `
      <tr>
        <td>${entry.receiptNumber || index + 1}</td>
        <td>2024-2025</td>
        <td>${entry.personName || ""}</td>
        <td>${entry.course || ""}</td>
        <td>${entry.feeHead || ""}</td>
        <td>${entry.method || ""}</td>
        <td>${entry.reference || ""}</td>
        <td>${entry.remarks || ""}</td>
        <td class="amount">${
          typeof entry.amount === "number" && !isNaN(entry.amount)
            ? entry.amount.toFixed(2)
            : "0.00"
        }</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>

    <table>
      <tr class="total-row">
        <td colspan="8">Total Receipts as per ERP ${new Date().toLocaleDateString()}</td>
        <td class="amount">${totalReceipts.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="8">Bank Wise Total Fee Collection</td>
        <td class="amount">${totalReceipts.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="8">G3 Total Fee Collection</td>
        <td class="amount">${totalReceipts.toFixed(2)}</td>
      </tr>
      <tr class="total-row">
        <td colspan="8"><strong>Grand Total</strong></td>
        <td class="amount"><strong>${totalReceipts.toFixed(2)}</strong></td>
      </tr>
    </table>

    <div class="section-title">Bank Account Wise Summary</div>
    <table>
      <thead>
        <tr>
          <th>Sr No.</th>
          <th>Bank Name</th>
          <th>Account No.</th>
          <th>Balance</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>UNION BANK OF INDIA</td>
          <td>386041180003923</td>
          <td class="amount">${totalReceipts.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td colspan="3"><strong>TOTAL</strong></td>
          <td class="amount"><strong>${totalReceipts.toFixed(2)}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="notes">
      <strong>Notes:</strong><br>
      1. If receive any balance after fees collection two total will be mismatch on Refundable report<br>
      2. Balance amount will be display in G3 Central amount report<br>
      3. If G3 Balance cancel receipt
    </div>

    <div class="footer">
      <strong>Print Date:</strong> ${new Date().toLocaleDateString()}
    </div>
  `;

  return html;
}

export default function Ledger() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [personFilter, setPersonFilter] = useState("All");
  const [feeHeads, setFeeHeads] = useState([]);
  const [feeHeadFilter, setFeeHeadFilter] = useState("All");

  useEffect(() => {
    setLoading(true);

    // Fetch ledger data and fee heads in parallel
    Promise.all([
      fetch("http://localhost:5000/api/ledger").then((res) => res.json()),
      fetch("http://localhost:5000/api/fee-heads").then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      }),
    ])
      .then(([ledgerData, feeHeadsData]) => {
        setEntries(ledgerData);
        setFeeHeads(Array.isArray(feeHeadsData) ? feeHeadsData : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
        setLoading(false);
        // Set default values in case of error
        setFeeHeads([]);
      });
  }, []);

  // Get unique persons for dropdown
  const uniquePersons = [
    ...new Set(entries.filter((e) => e.personName).map((e) => e.personName)),
  ].sort();

  // Get unique courses for dropdown
  const uniqueCourses = [
    ...new Set(entries.filter((e) => e.course).map((e) => e.course)),
  ].sort();

  // Sorting
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  // Available sort fields
  const sortFields = [
    { value: "date", label: "Date" },
    { value: "type", label: "Type" },
    { value: "personName", label: "Person" },
    { value: "course", label: "Course" },
    { value: "description", label: "Description" },
    { value: "reference", label: "Reference" },
    { value: "method", label: "Method" },
    { value: "amount", label: "Amount" },
    { value: "feeHead", label: "Fee Head" },
    { value: "receiptNumber", label: "Receipt Number" },
    { value: "remarks", label: "Remarks" },
  ];

  // Handle sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  // Add course filter state
  const [courseFilter, setCourseFilter] = useState("All");

  // Filtering logic
  const filteredEntries = entries.filter((entry) => {
    // Type filter
    if (typeFilter !== "All" && entry.type !== typeFilter) return false;
    // Person filter
    if (
      personFilter &&
      personFilter !== "All" &&
      entry.personName !== personFilter
    )
      return false;
    // Course filter
    if (courseFilter !== "All" && entry.course !== courseFilter) return false;
    // Fee Head filter
    if (feeHeadFilter !== "All" && entry.feeHead !== feeHeadFilter)
      return false;
    // Date range filter
    if (dateFrom && new Date(entry.date) < new Date(dateFrom)) return false;
    if (dateTo && new Date(entry.date) > new Date(dateTo)) return false;
    // Search filter
    if (search) {
      const s = search.toLowerCase();
      if (
        !(entry.description && entry.description.toLowerCase().includes(s)) &&
        !(entry.reference && entry.reference.toLowerCase().includes(s)) &&
        !(entry.feeHead && entry.feeHead.toLowerCase().includes(s)) &&
        !(entry.course && entry.course.toLowerCase().includes(s)) &&
        !(
          entry.receiptNumber && entry.receiptNumber.toLowerCase().includes(s)
        ) &&
        !(entry.remarks && entry.remarks.toLowerCase().includes(s))
      ) {
        return false;
      }
    }
    return true;
  });

  // Apply sorting
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    // Handle different data types
    if (sortBy === "date") {
      valA = new Date(valA || 0);
      valB = new Date(valB || 0);
    } else if (sortBy === "amount") {
      valA = typeof valA === "number" ? valA : 0;
      valB = typeof valB === "number" ? valB : 0;
    } else if (
      sortBy === "feeHead" ||
      sortBy === "course" ||
      sortBy === "receiptNumber" ||
      sortBy === "remarks"
    ) {
      // For fee head, course, receipt number, and remarks, we'll sort by title
      valA = (valA || "").toString().toLowerCase();
      valB = (valB || "").toString().toLowerCase();
    } else {
      valA = (valA || "").toString().toLowerCase();
      valB = (valB || "").toString().toLowerCase();
    }

    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const pageCount = Math.ceil(sortedEntries.length / pageSize);
  const pagedSortedEntries = sortedEntries.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Per-type totals
  const total = sortedEntries.reduce(
    (sum, entry) =>
      typeof entry.amount === "number" && !isNaN(entry.amount)
        ? sum + entry.amount
        : sum,
    0
  );
  const totalPayments = sortedEntries
    .filter((e) => e.type === "Payment")
    .reduce(
      (sum, entry) =>
        typeof entry.amount === "number" && !isNaN(entry.amount)
          ? sum + entry.amount
          : sum,
      0
    );
  const totalExpenses = sortedEntries
    .filter((e) => e.type === "Expense")
    .reduce(
      (sum, entry) =>
        typeof entry.amount === "number" && !isNaN(entry.amount)
          ? sum + entry.amount
          : sum,
      0
    );

  // Row details modal
  const [modalEntry, setModalEntry] = useState(null);

  // Print view
  function handlePrint() {
    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ledger Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; margin-bottom: 20px; }
            .summary { margin-bottom: 20px; text-align: right; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .amount { text-align: right; }
            .expense { background-color: #fef2f2; }
            .payment { background-color: #f0fdf4; }
            @media print { 
              body { margin: 0; } 
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Ledger Report</h1>
          <div class="summary">
            <div><strong>Total: ${total.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
            })}</strong></div>
            <div style="color: green;">Payments: ${totalPayments.toLocaleString(
              "en-IN",
              { style: "currency", currency: "INR" }
            )}</div>
            <div style="color: red;">Expenses: ${totalExpenses.toLocaleString(
              "en-IN",
              { style: "currency", currency: "INR" }
            )}</div>
            <div>Generated on: ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Receipt No</th>
                <th>Person</th>
                <th>Course</th>
                <th>Description</th>
                <th>Reference</th>
                <th>Method</th>
                <th>Fee Head</th>
                <th>Remarks</th>
                <th class="amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${sortedEntries
                .map(
                  (entry) => `
                <tr class="${entry.type === "Expense" ? "expense" : "payment"}">
                  <td>${
                    entry.date ? new Date(entry.date).toLocaleDateString() : ""
                  }</td>
                  <td>${entry.type}</td>
                  <td>${entry.receiptNumber || "-"}</td>
                  <td>${entry.personName || "-"}</td>
                  <td>${entry.course || "-"}</td>
                  <td>${entry.description}</td>
                  <td>${entry.reference}</td>
                  <td>${entry.method}</td>
                  <td>${entry.feeHead || "-"}</td>
                  <td>${entry.remarks || "-"}</td>
                  <td class="amount">${
                    typeof entry.amount === "number" && !isNaN(entry.amount)
                      ? entry.amount.toLocaleString("en-IN", {
                          style: "currency",
                          currency: "INR",
                        })
                      : "-"
                  }</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <div className="p-6">
      {/* College Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-6">
        <div className="flex items-center gap-4">
          <img 
            src="/logo1.png" 
            alt="College Logo" 
            className="h-16 w-auto"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Nagarjuna Institute of Engineering and Technology</h1>
            <p className="text-gray-600">Management Information System - Ledger Management</p>
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-4">Ledger</h1>
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div>
          <label className="block text-sm font-medium">Type</label>
          <select
            className="border rounded px-2 py-1"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Payment">Payment</option>
            <option value="Expense">Expense</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Person</label>
          <select
            className="border rounded px-2 py-1"
            value={personFilter}
            onChange={(e) => setPersonFilter(e.target.value)}
          >
            <option value="All">All Persons</option>
            {uniquePersons.map((person) => (
              <option key={person} value={person}>
                {person}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Course</label>
          <select
            className="border rounded px-2 py-1"
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
          >
            <option value="All">All Courses</option>
            {uniqueCourses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Fee Head</label>
          <select
            className="border rounded px-2 py-1"
            value={feeHeadFilter}
            onChange={(e) => setFeeHeadFilter(e.target.value)}
          >
            <option value="All">All Fee Heads</option>
            {Array.isArray(feeHeads) &&
              feeHeads.map((feeHead) => (
                <option key={feeHead._id} value={feeHead.title}>
                  {feeHead.title}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">From</label>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">To</label>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Search</label>
          <input
            type="text"
            className="border rounded px-2 py-1"
            placeholder="Description, Reference, Fee Head, Course, Receipt, or Remarks"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Sort By</label>
          <select
            className="border rounded px-2 py-1"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {sortFields.map((field) => (
              <option key={field.value} value={field.value}>
                {field.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Order</label>
          <select
            className="border rounded px-2 py-1"
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value)}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
        <button
          className="ml-auto bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          onClick={() => exportToDCR(sortedEntries, dateFrom, dateTo)}
        >
          Export DCR (PDF)
        </button>
      </div>
      <div className="mb-2 flex flex-wrap gap-4 justify-end font-semibold">
        <div>
          Total:{" "}
          {total.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          })}
        </div>
        <div className="text-green-700">
          Payments:{" "}
          {totalPayments.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          })}
        </div>
        <div className="text-red-600">
          Expenses:{" "}
          {totalExpenses.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          })}
        </div>
        <button
          className="ml-4 bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 print:hidden"
          onClick={handlePrint}
        >
          Print
        </button>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded shadow print:bg-white">
            <thead>
              <tr>
                <th
                  className="px-4 py-2 border cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("date")}
                >
                  Date{" "}
                  {sortBy === "date" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  className="px-4 py-2 border cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("type")}
                >
                  Type{" "}
                  {sortBy === "type" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  className="px-4 py-2 border cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("receiptNumber")}
                >
                  Receipt No{" "}
                  {sortBy === "receiptNumber"
                    ? sortDir === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
                <th
                  className="px-4 py-2 border cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("personName")}
                >
                  Person{" "}
                  {sortBy === "personName"
                    ? sortDir === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
                <th
                  className="px-4 py-2 border cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("course")}
                >
                  Course{" "}
                  {sortBy === "course" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  className="px-4 py-2 border cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("description")}
                >
                  Description{" "}
                  {sortBy === "description"
                    ? sortDir === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
                <th
                  className="px-4 py-2 border cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("reference")}
                >
                  Reference{" "}
                  {sortBy === "reference"
                    ? sortDir === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
                <th
                  className="px-4 py-2 border cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("method")}
                >
                  Method{" "}
                  {sortBy === "method" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  className="px-4 py-2 border cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("feeHead")}
                >
                  Fee Head{" "}
                  {sortBy === "feeHead" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  className="px-4 py-2 border cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("remarks")}
                >
                  Remarks{" "}
                  {sortBy === "remarks" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  className="px-4 py-2 border text-right cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("amount")}
                >
                  Amount{" "}
                  {sortBy === "amount" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedSortedEntries.map((entry, idx) => (
                <tr
                  key={idx}
                  className={
                    entry.type === "Expense" ? "bg-red-50" : "bg-green-50"
                  }
                  onClick={() => setModalEntry(entry)}
                  style={{ cursor: "pointer" }}
                >
                  <td className="px-4 py-2 border">
                    {entry.date
                      ? new Date(entry.date).toLocaleDateString()
                      : ""}
                  </td>
                  <td className="px-4 py-2 border">{entry.type}</td>
                  <td className="px-4 py-2 border">
                    {entry.receiptNumber || "-"}
                  </td>
                  <td className="px-4 py-2 border">
                    {entry.personName || "-"}
                  </td>
                  <td className="px-4 py-2 border">{entry.course || "-"}</td>
                  <td className="px-4 py-2 border">{entry.description}</td>
                  <td className="px-4 py-2 border">{entry.reference}</td>
                  <td className="px-4 py-2 border">{entry.method}</td>
                  <td className="px-4 py-2 border">{entry.feeHead || "-"}</td>
                  <td className="px-4 py-2 border">{entry.remarks || "-"}</td>
                  <td
                    className={`px-4 py-2 border text-right font-bold ${
                      entry.amount < 0 ? "text-red-600" : "text-green-700"
                    }`}
                  >
                    {typeof entry.amount === "number" && !isNaN(entry.amount)
                      ? entry.amount.toLocaleString("en-IN", {
                          style: "currency",
                          currency: "INR",
                        })
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination controls */}
          <div className="flex justify-between items-center mt-2 print:hidden">
            <div>
              Page {page} of {pageCount}
            </div>
            <div>
              <button
                className="px-2 py-1 border rounded mr-2"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Prev
              </button>
              <button
                className="px-2 py-1 border rounded"
                disabled={page === pageCount || pageCount === 0}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Row details modal */}
      {modalEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white rounded shadow-lg p-6 min-w-[300px] max-w-[90vw]">
            <h2 className="text-xl font-bold mb-2">Entry Details</h2>
            <div className="mb-2">
              <b>Date:</b>{" "}
              {modalEntry.date
                ? new Date(modalEntry.date).toLocaleString()
                : "-"}
            </div>
            <div className="mb-2">
              <b>Type:</b> {modalEntry.type}
            </div>
            <div className="mb-2">
              <b>Receipt Number:</b> {modalEntry.receiptNumber || "-"}
            </div>
            <div className="mb-2">
              <b>Person:</b> {modalEntry.personName || "-"}
            </div>
            <div className="mb-2">
              <b>Course:</b> {modalEntry.course || "-"}
            </div>
            <div className="mb-2">
              <b>Description:</b> {modalEntry.description}
            </div>
            <div className="mb-2">
              <b>Reference:</b> {modalEntry.reference}
            </div>
            <div className="mb-2">
              <b>Method:</b> {modalEntry.method}
            </div>
            <div className="mb-2">
              <b>Fee Head:</b> {modalEntry.feeHead || "-"}
            </div>
            <div className="mb-2">
              <b>Remarks:</b> {modalEntry.remarks || "-"}
            </div>
            <div className="mb-2">
              <b>Amount:</b>{" "}
              {typeof modalEntry.amount === "number" &&
              !isNaN(modalEntry.amount)
                ? modalEntry.amount.toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                  })
                : "-"}
            </div>
            <button
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => setModalEntry(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}