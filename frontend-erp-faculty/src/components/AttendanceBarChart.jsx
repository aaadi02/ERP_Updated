import { Bar } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AttendanceBarChart({ data, labels, title }) {
  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "Attendance %",
        data: data,
        backgroundColor: "rgba(99, 102, 241, 0.7)",
      },
    ],
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: !!title, text: title },
    },
    scales: {
      y: { beginAtZero: true, max: 100 },
    },
    // Add canvas configuration to prevent Canvas2D warnings
    animation: {
      duration: 0, // Disable animations to reduce canvas operations
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };
  
  return (
    <div style={{ height: '400px', position: 'relative' }}>
      <Bar 
        data={chartData} 
        options={options}
        plugins={[{
          beforeInit: (chart) => {
            // Set willReadFrequently on the canvas context
            const ctx = chart.canvas.getContext('2d');
            if (ctx) {
              ctx.willReadFrequently = true;
            }
          }
        }]}
      />
    </div>
  );
}
