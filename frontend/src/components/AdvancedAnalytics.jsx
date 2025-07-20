import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const AdvancedAnalytics = ({ analytics, timeRange = 30 }) => {
  const [paymentTrends, setPaymentTrends] = useState(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState(timeRange.toString());

  useEffect(() => {
    if (analytics) {
      generateChartData();
    }
  }, [analytics, period, generateChartData]);

  const generateChartData = async () => {
    setLoading(true);
    try {
      // Fetch additional trend data for charts
      const response = await fetch(`http://localhost:5000/api/payments/analytics?period=${period}&includeDaily=true`);
      if (response.ok) {
        const data = await response.json();
        setPaymentTrends(data);
      }
    } catch (error) {
      console.error('Error fetching trend data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart color schemes
  const colors = {
    primary: 'rgba(59, 130, 246, 0.8)',
    primaryBorder: 'rgba(59, 130, 246, 1)',
    secondary: 'rgba(16, 185, 129, 0.8)',
    secondaryBorder: 'rgba(16, 185, 129, 1)',
    tertiary: 'rgba(245, 158, 11, 0.8)',
    tertiaryBorder: 'rgba(245, 158, 11, 1)',
    danger: 'rgba(239, 68, 68, 0.8)',
    dangerBorder: 'rgba(239, 68, 68, 1)',
    purple: 'rgba(147, 51, 234, 0.8)',
    purpleBorder: 'rgba(147, 51, 234, 1)',
    indigo: 'rgba(99, 102, 241, 0.8)',
    indigoBorder: 'rgba(99, 102, 241, 1)'
  };

  // Revenue vs Expenses Trend Chart
  const revenueExpenseData = {
    labels: paymentTrends?.dailyData?.map(d => 
      new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    ) || Array.from({length: 30}, (_, i) => `Day ${i+1}`),
    datasets: [
      {
        label: 'Student Revenue',
        data: paymentTrends?.dailyData?.map(d => d.studentRevenue) || Array(30).fill(0),
        borderColor: colors.primaryBorder,
        backgroundColor: colors.primary,
        tension: 0.4,
        fill: false
      },
      {
        label: 'Salary Expenses',
        data: paymentTrends?.dailyData?.map(d => d.salaryExpenses) || Array(30).fill(0),
        borderColor: colors.dangerBorder,
        backgroundColor: colors.danger,
        tension: 0.4,
        fill: false
      }
    ]
  };

  // Payment Method Distribution
  const paymentMethodData = {
    labels: ['Cash', 'Online/UPI', 'Bank Transfer', 'Others'],
    datasets: [
      {
        data: [
          analytics?.paymentMethods?.cash || 35,
          analytics?.paymentMethods?.online || 45,
          analytics?.paymentMethods?.bank || 15,
          analytics?.paymentMethods?.others || 5
        ],
        backgroundColor: [
          colors.secondary,
          colors.primary,
          colors.tertiary,
          colors.purple
        ],
        borderColor: [
          colors.secondaryBorder,
          colors.primaryBorder,
          colors.tertiaryBorder,
          colors.purpleBorder
        ],
        borderWidth: 2
      }
    ]
  };

  // Payment Status Distribution
  const paymentStatusData = {
    labels: ['Completed', 'Pending', 'Failed', 'Refunded'],
    datasets: [
      {
        data: [
          analytics?.paymentStatus?.completed || 85,
          analytics?.paymentStatus?.pending || 10,
          analytics?.paymentStatus?.failed || 3,
          analytics?.paymentStatus?.refunded || 2
        ],
        backgroundColor: [
          colors.secondary,
          colors.tertiary,
          colors.danger,
          colors.indigo
        ],
        borderColor: [
          colors.secondaryBorder,
          colors.tertiaryBorder,
          colors.dangerBorder,
          colors.indigoBorder
        ],
        borderWidth: 2
      }
    ]
  };

  // Monthly comparison
  const monthlyComparisonData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: paymentTrends?.monthlyData?.map(d => d.revenue) || [120000, 150000, 180000, 145000, 200000, 175000],
        backgroundColor: colors.primary,
        borderColor: colors.primaryBorder,
        borderWidth: 1
      },
      {
        label: 'Expenses',
        data: paymentTrends?.monthlyData?.map(d => d.expenses) || [80000, 85000, 90000, 88000, 95000, 92000],
        backgroundColor: colors.danger,
        borderColor: colors.dangerBorder,
        borderWidth: 1
      }
    ]
  };

  // Payment volume by hour (for today)
  const hourlyVolumeData = {
    labels: Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`),
    datasets: [
      {
        label: 'Payments per Hour',
        data: paymentTrends?.hourlyData || [0,0,0,0,0,0,1,3,8,12,15,18,20,17,22,19,14,8,5,2,1,0,0,0],
        backgroundColor: colors.primary,
        borderColor: colors.primaryBorder,
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Revenue vs Expenses Trend',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Comparison',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    }
  };

  const hourlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Payment Volume by Hour (Today)',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics Dashboard</h2>
          <div className="flex gap-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold">₹{analytics.totalStudentRevenue?.toLocaleString() || 0}</p>
              <p className="text-blue-100 text-xs mt-1">Last {period} days</p>
            </div>
            <div className="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Expenses</p>
              <p className="text-2xl font-bold">₹{analytics.totalSalaryExpenses?.toLocaleString() || 0}</p>
              <p className="text-red-100 text-xs mt-1">Last {period} days</p>
            </div>
            <div className="w-12 h-12 bg-red-400 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Net Balance</p>
              <p className="text-2xl font-bold">
                ₹{((analytics.totalStudentRevenue || 0) - (analytics.totalSalaryExpenses || 0)).toLocaleString()}
              </p>
              <p className="text-green-100 text-xs mt-1">Profit/Loss</p>
            </div>
            <div className="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Payments</p>
              <p className="text-2xl font-bold">{(analytics.totalStudentPayments || 0) + (analytics.totalSalaryPayments || 0)}</p>
              <p className="text-purple-100 text-xs mt-1">All transactions</p>
            </div>
            <div className="w-12 h-12 bg-purple-400 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="h-80">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <Line data={revenueExpenseData} options={lineChartOptions} />
            )}
          </div>
        </div>

        {/* Monthly Comparison */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="h-80">
            <Bar data={monthlyComparisonData} options={barChartOptions} />
          </div>
        </div>

        {/* Payment Method Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="h-80">
            <Pie 
              data={paymentMethodData} 
              options={{
                ...pieChartOptions,
                plugins: {
                  ...pieChartOptions.plugins,
                  title: {
                    ...pieChartOptions.plugins.title,
                    text: 'Payment Methods'
                  }
                }
              }} 
            />
          </div>
        </div>

        {/* Payment Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="h-80">
            <Doughnut 
              data={paymentStatusData} 
              options={{
                ...pieChartOptions,
                plugins: {
                  ...pieChartOptions.plugins,
                  title: {
                    ...pieChartOptions.plugins.title,
                    text: 'Payment Status'
                  }
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Hourly Volume Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="h-80">
          <Bar data={hourlyVolumeData} options={hourlyChartOptions} />
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-3">Top Payment Times</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Morning (9-12)</span>
              <span className="text-sm font-medium">35%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Afternoon (12-5)</span>
              <span className="text-sm font-medium">45%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Evening (5-8)</span>
              <span className="text-sm font-medium">20%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-3">Average Transaction</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Student Fees</span>
              <span className="text-sm font-medium">₹{analytics.avgStudentPayment?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Salary Payment</span>
              <span className="text-sm font-medium">₹{analytics.avgSalaryPayment?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Overall</span>
              <span className="text-sm font-medium">
                ₹{(((analytics.avgStudentPayment || 0) + (analytics.avgSalaryPayment || 0)) / 2)?.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-3">Payment Success Rate</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Success Rate</span>
              <span className="text-sm font-medium text-green-600">
                {(((analytics.paymentStatus?.completed || 85) / 
                  ((analytics.paymentStatus?.completed || 85) + (analytics.paymentStatus?.failed || 3))) * 100
                ).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Failed Payments</span>
              <span className="text-sm font-medium text-red-600">{analytics.paymentStatus?.failed || 3}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="text-sm font-medium text-yellow-600">{analytics.paymentStatus?.pending || 10}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
