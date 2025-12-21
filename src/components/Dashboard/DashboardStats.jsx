import { Bar, Line, Doughnut } from "react-chartjs-2";
import { FiCalendar, FiUser, FiClock, FiArrowUpRight, FiArrowDownRight } from "react-icons/fi";

const DashboardStats = ({ 
  isMobile, 
  stats, 
  totalCount,
  indexationCount, 
  pendingCount, 
  rejectedCount,
  miniLineGraphData,
  indexedStatusData,
  monthlyIndexationsData,
  weeklyIndexationData,
}) => {
  return (
    <>
      <div className="stats-grid">
        <div className="stat-card total-indexations">
          <div className="stat-content">
            <div className="stat-icon">
              <FiCalendar />
            </div>
            <div className="stat-info">
              <h3>{totalCount}</h3>
              <p>Total Url Indexation</p>
            </div>
          </div>
          <div className="mini-graph">
            <Line
              data={miniLineGraphData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } },
              }}
            />
          </div>
        </div>

        <div className="stat-card accepted">
          <div className="stat-content">
            <div className="stat-icon">
              <FiArrowUpRight />
            </div>
            <div className="stat-info">
              <h3>{indexationCount}</h3>
              <p>Indexed URLs</p>
            </div>
          </div>
          <div className="mini-graph">
            <Line
              data={miniLineGraphData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } },
              }}
            />
          </div>
        </div>

        <div className="stat-card rejected">
          <div className="stat-content">
            <div className="stat-icon">
              <FiArrowDownRight />
            </div>
            <div className="stat-info">
              <h3>{rejectedCount}</h3>
              <p>Not Indexed URLs</p>
            </div>
          </div>
          <div className="mini-graph">
            <Line
              data={miniLineGraphData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } },
              }}
            />
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-content">
            <div className="stat-icon">
              <FiClock />
            </div>
            <div className="stat-info">
              <h3>{stats.pending}</h3>
              <p>Invalid and Pending URLs</p>
            </div>
          </div>
          <div className="mini-graph">
            <Line
              data={miniLineGraphData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } },
              }}
            />
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h4>Url Indexation Status</h4>
          <div className="chart-container">
            <Doughnut
              data={indexedStatusData}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: isMobile ? "bottom" : "right",
                    labels: {
                      color: "#e9ecef",
                      font: {
                        size: 10,
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="chart-card">
          <h4>Monthly Indexation </h4>
          <div className="chart-container">
            <Line
              data={monthlyIndexationsData}
              options={{
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: "rgba(255, 255, 255, 0.1)",
                    },
                    ticks: {
                      color: "#e9ecef",
                      font: { size: 10 },
                    },
                  },
                  x: {
                    grid: {
                      color: "rgba(255, 255, 255, 0.1)",
                    },
                    ticks: {
                      color: "#e9ecef",
                      font: { size: 10 },
                    },
                  },
                },
                plugins: {
                  legend: {
                    labels: {
                      color: "#e9ecef",
                      font: { size: 10 },
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="chart-card">
          <h4>Weekly Indexation Data</h4>
          <div className="chart-container">
            <Bar
              data={weeklyIndexationData}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: isMobile ? "bottom" : "right",
                    display: false,
                    labels: {
                      color: "#e9ecef",
                      font: {
                        size: 10,
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardStats;