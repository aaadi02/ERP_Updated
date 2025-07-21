"use client"

// Note: Currently using mock data since backend analytics endpoints are not implemented
// TODO: Replace with real API calls when backend is ready

import React, { useEffect, useState, useContext, useMemo } from "react"
import { Navigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"
import {
  Users,
  User,
  BookOpen,
  TrendingUp,
  AlertCircle,
  Download,
  Book,
  Clock,
  Award,
  Star,
  Trophy,
  Medal,
} from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import axios from 'axios';

const COLORS = ['#6366f1', '#10b981', '#f59e42', '#ef4444', '#a78bfa', '#fbbf24', '#14b8a6'];

// Redesigned StatCard
const StatCard = ({ icon, label, value, sub, gradient }) => (
  <div className={`rounded-2xl p-6 shadow-xl bg-white/60 backdrop-blur-md border border-white/40 hover:scale-105 transition-transform duration-300`}>
    <div className={`w-12 h-12 flex items-center justify-center rounded-xl mb-4 ${gradient}`}>
      {icon}
    </div>
    <div className="text-3xl font-extrabold text-slate-800 flex items-baseline">
      {value}
      {sub && (
        <>
          <span className="mx-2 text-slate-300 text-2xl">/</span>
          <span className="text-base text-slate-400 font-normal">{sub}</span>
        </>
      )}
    </div>
    <div className="mt-2 text-slate-500 font-semibold">{label}</div>
  </div>
);

// Timeline Item for Most Popular Books
const TimelineItem = ({ book, index, maxCount }) => {
  const icons = [
    <Trophy className="text-yellow-500" size={22} />,
    <Medal className="text-slate-400" size={22} />,
    <Award className="text-amber-600" size={22} />,
  ]
  return (
    <div className="flex items-start group">
      <div className="flex flex-col items-center mr-4">
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-200 to-purple-200 shadow-lg">
          {icons[index] || <Star className="text-indigo-400" size={20} />}
        </div>
        {index < maxCount - 1 && (
          <div className="w-1 h-12 bg-gradient-to-b from-indigo-200 to-purple-200"></div>
        )}
      </div>
      <div className="flex-1 bg-white/70 backdrop-blur-md rounded-xl p-4 mb-4 border border-white/40 shadow">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-lg text-slate-800">{book.title}</div>
            <div className="flex items-center text-slate-500 text-sm mt-1">
              <User size={14} className="mr-1" />
              Borrowed <span className="font-bold text-indigo-700 mx-1">{book.borrowCount}</span> times
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold mr-2">#{index + 1}</span>
            {index < 3 && (
              <span className="text-xs bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-2 py-1 rounded-full font-bold">
                TOP
              </span>
            )}
          </div>
        </div>
        <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${Math.min((book.borrowCount / maxCount) * 100, 100)}%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  )
};

const Analytics = () => {
  const isPrintMode = typeof window !== "undefined" && window.location.search.includes('print=true');
  const { isAuthenticated } = useContext(AuthContext);
  const allowAccess = isAuthenticated || isPrintMode;

  const [analytics, setAnalytics] = useState(null)
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null)
  const [booksBorrowedByMonth, setBooksBorrowedByMonth] = useState([]);
  const [booksAddedByMonth, setBooksAddedByMonth] = useState([]);

  if (!allowAccess) {
  return <Navigate to="/" />;
}

  useEffect(() => {
    const fetchData = async () => {
      try {
        // For initial load, show full loading screen
        if (!analytics) {
          setLoading(true);
        } else {
          // For subsequent updates, show subtle updating state
          setUpdating(true);
        }
        
        // Use mock data since backend endpoints don't exist yet
        const mockAnalyticsData = {
          totalBooks: 1250,
          journalBooks: 89,
          mostBorrowedBooks: [
            { bookId: "1", title: "Introduction to Computer Science", borrowCount: 45 },
            { bookId: "2", title: "Data Structures and Algorithms", borrowCount: 38 },
            { bookId: "3", title: "Database Management Systems", borrowCount: 32 },
            { bookId: "4", title: "Operating Systems Concepts", borrowCount: 28 },
            { bookId: "5", title: "Software Engineering", borrowCount: 24 }
          ]
        };
        
        const mockBooksData = {
          books: [
            // General books
            ...Array.from({ length: 850 }, (_, i) => ({
              _id: `general_${i}`,
              TITLENAME: `General Book ${i + 1}`,
              materialType: "general",
              SERIESCODE: ["BB", "GR", "LR"][i % 3],
              ACCDATE: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
            })),
            // Journal books
            ...Array.from({ length: 89 }, (_, i) => ({
              _id: `journal_${i}`,
              TITLENAME: `Journal ${i + 1}`,
              materialType: "journal",
              SERIESCODE: "JOURNAL",
              ACCDATE: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
            })),
            // MBA books
            ...Array.from({ length: 150 }, (_, i) => ({
              _id: `mba_${i}`,
              TITLENAME: `MBA Book ${i + 1}`,
              materialType: "textbook",
              SERIESCODE: "MBA",
              ACCDATE: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
            })),
            // Thesis books
            ...Array.from({ length: 161 }, (_, i) => ({
              _id: `thesis_${i}`,
              TITLENAME: `Thesis ${i + 1}`,
              materialType: "research",
              SERIESCODE: "THESIS",
              ACCDATE: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
            }))
          ]
        };

        // Mock books borrowed by month data
        const mockBooksBorrowedByMonth = [
          { month: "Jan 2024", count: 45 },
          { month: "Feb 2024", count: 52 },
          { month: "Mar 2024", count: 38 },
          { month: "Apr 2024", count: 67 },
          { month: "May 2024", count: 43 },
          { month: "Jun 2024", count: 58 },
          { month: "Jul 2024", count: 71 },
          { month: "Aug 2024", count: 49 },
          { month: "Sep 2024", count: 63 },
          { month: "Oct 2024", count: 55 },
          { month: "Nov 2024", count: 47 },
          { month: "Dec 2024", count: 42 }
        ];

        // Mock books added by month data (for line chart)
        const mockBooksAddedByMonth = [
          { month: "2023-01", count: 25 },
          { month: "2023-02", count: 18 },
          { month: "2023-03", count: 32 },
          { month: "2023-04", count: 28 },
          { month: "2023-05", count: 35 },
          { month: "2023-06", count: 22 },
          { month: "2023-07", count: 41 },
          { month: "2023-08", count: 29 },
          { month: "2023-09", count: 38 },
          { month: "2023-10", count: 26 },
          { month: "2023-11", count: 33 },
          { month: "2023-12", count: 19 }
        ];
        
        setAnalytics(mockAnalyticsData);
        setBooks(mockBooksData.books);
        setBooksBorrowedByMonth(mockBooksBorrowedByMonth);
        setBooksAddedByMonth(mockBooksAddedByMonth);
        
        console.log('Using mock data for library analytics');
        
      } catch (err) {
        setError(`Failed to load data: ${err.message}`)
      } finally {
        setLoading(false)
        setUpdating(false)
      }
    }

    fetchData()
    // Remove auto-refresh since we're using mock data
  }, [])

  // Manual refresh handler
  const handleManualRefresh = () => {
    window.location.reload();
  }

  // Data processing with useMemo hooks
  const titleBreakdown = useMemo(() => {
    return books.reduce((acc, book) => {
      const title = book.TITLENAME || "Unknown Title"
      acc[title] = (acc[title] || 0) + 1
      return acc
    }, {})
  }, [books])

  const totalBooksCount = useMemo(() => 
    Object.values(titleBreakdown).reduce((sum, count) => sum + count, 0)
  , [titleBreakdown])

  const uniqueTitles = useMemo(() => 
    Object.keys(titleBreakdown).length
  , [titleBreakdown])

  const generalBooksCount = useMemo(() => 
    books.filter((book) => book.materialType === "general").length
  , [books])

  const materialTypeData = useMemo(() => {
    const materialTypeCounts = books.reduce((acc, book) => {
      const type = book.materialType || "Unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(materialTypeCounts).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
    }));
  }, [books]);

  // Series code data for bar chart
  const seriesData = useMemo(() => {
    if (!books?.length) return [];

    const seriesCodes = ["JOURNAL", "MBA", "THESIS", "LR", "GR", "BB"];
    const seriesMap = new Map();

    // Initialize counts for all series codes
    seriesCodes.forEach(code => {
      seriesMap.set(code, 0);
    });

    // Count books for each series code
    books.forEach(book => {
      const seriesCode = book.SERIESCODE?.toUpperCase() || "OTHER";
      if (seriesMap.has(seriesCode)) {
        seriesMap.set(seriesCode, seriesMap.get(seriesCode) + 1);
      }
    });

    // Convert to array format for the chart
    return Array.from(seriesMap.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }, [books]);

  const lineChartData = useMemo(() => {
    const now = new Date();
    const booksByMonth = books.reduce((acc, book) => {
      const date = book.ACCDATE ? new Date(book.ACCDATE) : null;
      if (
        date &&
        !isNaN(date) &&
        date <= now &&
        date.getFullYear() > 2000 && date.getFullYear() < 2100 // reasonable year range
      ) {
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        acc[month] = (acc[month] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(booksByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));
  }, [books]);

  // Sort most borrowed books
  const sortedMostBorrowedBooks = useMemo(() => {
    if (!analytics?.mostBorrowedBooks) return [];
    // Make sure to sort by borrow count in descending order
    return [...analytics.mostBorrowedBooks]
      .sort((a, b) => b.borrowCount - a.borrowCount)
      .map((book, index) => ({
        ...book,
        rank: index + 1 // Add rank for display
      }));
  }, [analytics?.mostBorrowedBooks]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-blue-50 to-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-6 text-lg text-indigo-700 font-semibold animate-pulse">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-100 via-red-50 to-pink-50">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-10 max-w-md flex flex-col items-center border border-red-100">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mb-6">
            <AlertCircle size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-3">
            Oops! Something went wrong
          </h2>
          <p className="text-slate-600 text-center mb-8 leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // If print mode, always allow dashboard rendering
  if (isPrintMode) {
    // skip all authentication checks
  } else if (!allowAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-100 via-red-50 to-pink-50">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-10 max-w-md flex flex-col items-center border border-red-100">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mb-6">
            <AlertCircle size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-3">
            Access Denied
          </h2>
          <p className="text-slate-600 text-center mb-8 leading-relaxed">You must be logged in to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 min-h-screen bg-gradient-to-br from-indigo-100 via-blue-50 to-slate-50 py-12 px-2 md:px-8 z-0 ml-72 overflow-y-auto overflow-x-hidden">
      {/* Glassmorphism floating shapes */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-indigo-300/30 rounded-full -translate-x-48 -translate-y-48 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-pink-300/30 rounded-full translate-x-48 translate-y-48 blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent leading-tight">
              Analytics
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-600 mt-2">Library Dashboard</h2>
            <p className="text-slate-500 max-w-xl mt-4">
              Visualize your library’s performance, user engagement, and resource utilization with real-time metrics and trends.
            </p>
          </div>
        </header>

        {/* Stat Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          <StatCard
            icon={<BookOpen size={28} className="text-indigo-700" />}
            label="Total Books"
            value={totalBooksCount}
            sub={`Unique Titles: ${uniqueTitles}`}
            gradient="bg-gradient-to-br from-indigo-100 to-purple-100"
          />
          <StatCard
            icon={<TrendingUp size={28} className="text-emerald-700" />}
            label="Books Borrowed"
            value={(() => {
              // Find the current month label in booksBorrowedByMonth
              if (!booksBorrowedByMonth.length) return 0;
              const now = new Date();
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const currentLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
              const found = booksBorrowedByMonth.find(b => b.month === currentLabel);
              return found ? found.count : 0;
            })()}
            sub={(() => {
              const now = new Date();
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              return monthNames[now.getMonth()] + ' ' + now.getFullYear();
            })()}
            gradient="bg-gradient-to-br from-emerald-100 to-teal-100"
          />
          <StatCard
            icon={<Clock size={28} className="text-rose-700" />}
            label="Journal Series Books"
            value={analytics?.journalBooks || 0}
            sub="Available"
            gradient="bg-gradient-to-br from-rose-100 to-pink-100"
          />
        </div>

        {/* Most Popular Books Timeline */}
        <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 overflow-hidden px-6 py-10 relative">
          {updating && (
            <div className="absolute top-4 right-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Updating...</span>
            </div>
          )}
          <div className="flex items-center mb-8">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mr-4">
              <Book size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-1">Most Popular Books</h2>
              <p className="text-slate-500">Real-time ranking of most borrowed titles</p>
            </div>
          </div>
          {sortedMostBorrowedBooks.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {sortedMostBorrowedBooks.slice(0, 2).map((book, idx) => (
                <TimelineItem
                  key={book.bookId || book.title}
                  book={book}
                  index={idx}
                  maxCount={Math.max(...sortedMostBorrowedBooks.map((b) => b.borrowCount))}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-12 text-center border border-slate-200">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen size={40} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-600 mb-2">No Data Available</h3>
              <p className="text-slate-500">Most borrowed books will appear here once data is available.</p>
            </div>
          )}
        </div>

        {/* Graphs Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 mb-20">
          {/* Pie Chart: Books by Material Type */}
          <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-indigo-100 hover:shadow-indigo-300 transition-shadow duration-300 group overflow-hidden">
            {/* Floating accent */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-indigo-300/40 to-purple-300/30 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-opacity"></div>
            <h3 className="text-2xl font-bold mb-6 text-indigo-700 flex items-center gap-2">
              <BookOpen size={22} className="text-indigo-400" /> Books by Material Type
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={materialTypeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={60}
                  fill="#6366f1"
                  label={({ name, percent }) => (
                    <tspan>
                      <tspan className="font-bold">{name}</tspan>
                      <tspan> </tspan>
                      <tspan className="text-indigo-500">{(percent * 100).toFixed(0)}%</tspan>
                    </tspan>
                  )}
                  labelLine={false}
                  isAnimationActive={true}
                  animationDuration={1200}
                >
                  {materialTypeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      style={{ filter: "drop-shadow(0 2px 8px rgba(99,102,241,0.15))" }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.97)",
                    border: "1px solid #e0e7ff",
                    color: "#312e81",
                    fontWeight: 600,
                    boxShadow: "0 4px 24px 0 rgba(99,102,241,0.07)",
                  }}
                  itemStyle={{ fontWeight: 600 }}
                />
                <Legend
                  iconType="circle"
                  align="center"
                  verticalAlign="bottom"
                  wrapperStyle={{
                    paddingTop: 24,
                    fontWeight: 700,
                    color: "#6366f1",
                    fontSize: 16,
                    letterSpacing: 1,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Bar Chart: Books by Series Code */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-200 relative overflow-hidden group">
            {/* Gradient background blob */}
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-300 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>

            <h3 className="text-2xl font-bold mb-6 text-purple-700 flex items-center gap-2">
              <Book size={24} className="text-purple-500" /> Books by Series Code
            </h3>

            {/* Chart with horizontal scroll */}
            <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-transparent pb-2">
              <div style={{ width: "100%", minWidth: "600px" }}>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={seriesData} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ede9fe" />
                    
                    <XAxis
                      dataKey="name"
                      tick={{
                        fill: "#7c3aed",
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                    />

                    <YAxis
                      allowDecimals={false}
                      tick={{
                        fill: "#4f46e5",
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                      tickLine={false}
                      axisLine={false}
                    />

                    <Tooltip
                      contentStyle={{
                        borderRadius: 16,
                        background: "#f5f3ff",
                        border: "1px solid #ddd6fe",
                        color: "#6d28d9",
                        fontWeight: 600,
                        boxShadow: "0 4px 24px 0 rgba(124,58,237,0.1)",
                      }}
                      formatter={(value, name, props) => [`${value} books`, `Series: ${props.payload.name}`]}
                    />

                    <Bar
                      name="Total Books"
                      dataKey="count"
                      fill="#a78bfa"
                      radius={[12, 12, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={1200}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>



          {/* Line Chart: Books Added Per Month */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-blue-100 hover:shadow-blue-300 transition-shadow duration-300 group relative overflow-hidden col-span-1 md:col-span-2">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-200 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
            <h3 className="text-2xl font-bold mb-6 text-blue-700 flex items-center gap-2">
              <TrendingUp size={22} className="text-blue-400" /> Books Added Per Month
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbeafe" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#2563eb", fontWeight: 700, fontSize: 15 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(month) => {
                    // month is in 'YYYY-MM' format
                    const [year, m] = month.split('-');
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return monthNames[parseInt(m, 10) - 1] + ' ' + year;
                  }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#6366f1", fontWeight: 700, fontSize: 15 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.95)",
                    border: "1px solid #bfdbfe",
                    color: "#2563eb",
                    fontWeight: 600,
                    boxShadow: "0 4px 24px 0 rgba(37,99,235,0.07)",
                  }}
                  itemStyle={{ fontWeight: 600 }}
                />
                <Legend
                  iconType="plainline"
                  wrapperStyle={{
                    paddingTop: 20,
                    fontWeight: 700,
                    color: "#2563eb",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Books Added"
                  stroke="#2563eb"
                  strokeWidth={4}
                  dot={{ r: 7, fill: "#6366f1", stroke: "#2563eb", strokeWidth: 3 }}
                  activeDot={{ r: 10, fill: "#2563eb", stroke: "#fff", strokeWidth: 4 }}
                  isAnimationActive={true}
                  animationDuration={1200}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Line Chart: Books Borrowed Per Month */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-emerald-100 hover:shadow-emerald-300 transition-shadow duration-300 group relative overflow-hidden col-span-1 md:col-span-2">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-emerald-200 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
            {updating && (
              <div className="absolute top-4 right-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Updating...</span>
              </div>
            )}
            <h3 className="text-2xl font-bold mb-6 text-emerald-700 flex items-center gap-2">
              <TrendingUp size={22} className="text-emerald-400" /> Books Borrowed Per Month
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={booksBorrowedByMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d1fae5" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#10b981", fontWeight: 700, fontSize: 15 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(month) => {
                    if (!month || typeof month !== 'string' || !month.includes('-')) return month || '';
                    const [year, mRaw] = month.split('-');
                    const m = mRaw.trim();
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const monthIdx = parseInt(m, 10) - 1;
                    if (isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) {
                      console.warn('Invalid month for XAxis:', month, 'parsed:', m, 'index:', monthIdx);
                      return month;
                    }
                    return monthNames[monthIdx] + ' ' + year;
                  }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#059669", fontWeight: 700, fontSize: 15 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.95)",
                    border: "1px solid #a7f3d0",
                    color: "#047857",
                    fontWeight: 600,
                    boxShadow: "0 4px 24px 0 rgba(5,150,105,0.07)",
                  }}
                  formatter={(value) => [`${value} books borrowed`, null]}
                  itemStyle={{ fontWeight: 600 }}
                />
                <Legend
                  iconType="plainline"
                  wrapperStyle={{
                    paddingTop: 20,
                    fontWeight: 700,
                    color: "#059669",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Books Borrowed"
                  stroke="#10b981"
                  strokeWidth={4}
                  dot={{ r: 7, fill: "#34d399", stroke: "#10b981", strokeWidth: 3 }}
                  activeDot={{ r: 10, fill: "#10b981", stroke: "#fff", strokeWidth: 4 }}
                  isAnimationActive={true}
                  animationDuration={1200}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics