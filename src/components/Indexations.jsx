import { useContext, useEffect, useState, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Navigate } from "react-router-dom";
import { FiSearch, FiFilter, FiDownload, FiTrash2, FiUpload, FiArrowUpRight, FiArrowDownRight, FiPlay } from "react-icons/fi";
import { FaEquals } from "react-icons/fa";
import { GiLBrick } from "react-icons/gi";
import * as XLSX from "xlsx";
import Lottie from "lottie-react";
import notFoundAnimation from "../../public/notfountAnimation.json";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { getUrlIndexation, uploadUrlIndexationExcel, deleteUrlIndexation, runSingleManualCheck } from "../api/indexation";
import { FaRegClock } from "react-icons/fa6";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const NotFoundDisplay = () => (
  <div style={{ textAlign: 'center', padding: '2rem', color: '#adb5bd' }}>
    <Lottie
      animationData={notFoundAnimation}
      loop={true}
      style={{ height: 200, width: 200, margin: '0 auto', overflow: 'hidden' }}
    />
    <h3 style={{ color: '#ffffff', marginTop: '1rem' }}>No indexations Found</h3>
    <p>Try adjusting your search or filter criteria.</p>
  </div>
);

const MiniLineChart = ({ data, color }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    },
    elements: {
      point: { radius: 0 }
    }
  };

  const chartData = {
    labels: ['', '', '', '', '', ''],
    datasets: [{
      data: data,
      borderColor: color,
      backgroundColor: 'rgba(0,0,0,0)',
      borderWidth: 2,
      tension: 0.4,
      fill: false
    }]
  };

  return (
    <div style={{ width: '100%', height: '40px', marginTop: '8px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

const indexations = () => {
  const [indexations, setIndexations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterindexationStatus, setFilterindexationStatus] = useState("all");
  const { isAuthenticated } = useContext(Context);
  const [loading, setLoading] = useState(true);
  const [initialLoadTimePassed, setInitialLoadTimePassed] = useState(false);

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null); // Ref to trigger the hidden file input

  const [totalAccepted, setTotalAccepted] = useState(0);
  const [totalRejected, setTotalRejected] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [indexationsPerPage] = useState(10); // 10 indexations per page

  const [chartType, setChartType] = useState('gender'); // 'gender', 'age', 'indexationStatus'



  useEffect(() => {
    const interval = setInterval(() => {
      setChartType(prev => {
        if (prev === 'gender') { return 'age'; }
        if (prev === 'age') { return 'indexationStatus'; }
        return 'gender';
      });
    }, 4000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoadTimePassed(true);
    }, 2000);

    if (isAuthenticated) {
      fetchUrlIndexationFromApi();
    } else {
      setLoading(false);
    }
    return () => clearTimeout(timer);
  }, [isAuthenticated]);


  const fetchUrlIndexationFromApi = async () => {
    setLoading(true); // Start loading state
    try {
      const { data } = await getUrlIndexation();
      const fetchedIndexation = data || [];

      setIndexations(fetchedIndexation);

      // Calculate metrics for the Dashboard Summary Cards 
      const accepted = fetchedIndexation.filter(item =>
        item.status?.toLowerCase() === 'indexed'
      ).length;

      const rejected = fetchedIndexation.filter(item =>
        item.status?.toLowerCase() === 'not_indexed' || item.status?.toLowerCase() === 'invalid'
      ).length;

      const pending = fetchedIndexation.filter(item =>
        ['pending'].includes(item.status?.toLowerCase())
      ).length;

      // Update the metric states for the MiniLineCharts
      setTotalAccepted(accepted);
      setTotalRejected(rejected);
      setTotalPending(pending);

      console.log("Dashboard state synchronized with API data.");
    } catch (error) {
      console.error("Fetch Error:", error);
      // Handle network/API errors gracefully without crashing 
      toast.error(error.response?.data?.message || "Failed to sync with indexation server.");
      setIndexations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSingleManualCheck = async (id) => {
    const toastId = toast.loading("Running indexation check...");
    try {
      // Call the manual check API
      const { data } = await runSingleManualCheck(id);

      // Update the UI with the backend's start/end time message
      toast.update(toastId, {
        render: data.message,
        type: "success",
        isLoading: false,
        autoClose: 7000
      });

      // Refresh all data to update status, timestamps, and charts
      await fetchUrlIndexationFromApi();
    } catch (error) {
      console.error("Manual Check Error:", error);
      toast.update(toastId, {
        render: error.message || "Manual check failed",
        type: "error",
        isLoading: false,
        autoClose: 5000
      });
    }
  };

  // handle file selection and API call
  const handleImportExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type (Optional but recommended)
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
      toast.error("Please upload a valid Excel file (.xlsx or .xls)");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const { data } = await uploadUrlIndexationExcel(formData);

      toast.success(data.message || "Excel data imported successfully (Max 30 records processed).");

      fetchUrlIndexationFromApi();
    } catch (error) {
      console.error("Import Error:", error);
      toast.error(error.response?.data?.message || "Failed to import Excel file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const exportToExcel = () => {
    const dataToExport = filteredindexations.map(indexation => ({
      "Id": `${indexation.id}`,
      "url": indexation.url,
      "status": indexation.status || "N/A",
      "indexationDetails": indexation.indexationDetails,
      "createdAt": indexation.createdAt ? new Date(indexation.createdAt).toLocaleDateString() : "N/A",
      "updatedAt": indexation.updatedAt ? new Date(indexation.updatedAt).toLocaleDateString() : "N/A",
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "indexations List");
    XLSX.writeFile(workbook, "indexations_List.xlsx", { compression: true });
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const showSkeleton = loading || !initialLoadTimePassed;

  const indexationStatus = useMemo(() => {
    return [...new Set(indexations.map(indexation => indexation.status).filter(Boolean))];
  }, [indexations]);

  const filteredindexations = useMemo(() => {
    return indexations.filter(indexation => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        `${indexation.url || ""} ${indexation.url || ""}`.toLowerCase().includes(searchLower) ||
        (indexation.indexationDetails && indexation.indexationDetails.toLowerCase().includes(searchLower)) ||
        (indexation.id && indexation.id.toString().toLowerCase().includes(searchLower)) ||
        (indexation.updatedAt && new Date(indexation.updatedAt).toLocaleDateString().toLowerCase().includes(searchLower)) ||
        (indexation.status && indexation.status.toLowerCase().includes(searchLower));

      const matchesindexationStatus = filterindexationStatus === "all" ||
        indexation.status === filterindexationStatus;

      return matchesSearch && matchesindexationStatus;
    });
  }, [indexations, searchTerm, filterindexationStatus]);

  // Pagination logic
  const indexOfLastindexation = currentPage * indexationsPerPage;
  const indexOfFirstindexation = indexOfLastindexation - indexationsPerPage;
  const currentindexations = filteredindexations.slice(indexOfFirstindexation, indexOfLastindexation);
  const totalPages = Math.ceil(filteredindexations.length / indexationsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handledeleteIndexation = async (indexationId) => {
    if (window.confirm("Are you sure you want to delete this url indexation? This action cannot be undone.")) {
      try {
        await deleteUrlIndexation(indexationId);
        setIndexations(previndexations => previndexations.filter(doc => doc._id !== indexationId));
        await fetchUrlIndexationFromApi();
        toast.success("Url indexation deleted successfully");
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete url indexation");
      }
    }
  };

  // Generate random data for mini charts
  const generateMiniChartData = (base) => {
    return Array.from({ length: 6 }, (_, i) => base + Math.random() * base * 0.3);
  };

  const indexationStatusData = {
    labels: ['Accepted', 'Rejected', 'Pending'],
    datasets: [{
      label: 'Url Indexation Status',
      data: [totalAccepted, totalRejected, totalPending],
      backgroundColor: ['#4CAF50', '#F44336', '#FFC107'],
      borderColor: ['#388E3C', '#D32F2F', '#FFA000'],
      borderWidth: 1,
      hoverOffset: 10
    }]
  };

  const performanceData = useMemo(() => {
    // 1. Calculate the counts for each status from the filtered list
    const indexedCount = filteredindexations.filter(
      (item) => item.status?.toLowerCase() === "indexed"
    ).length;

    const notIndexedCount = filteredindexations.filter(
      (item) => item.status?.toLowerCase() === "not_indexed"
    ).length;

    const pendingInvalidCount = filteredindexations.filter((item) =>
      ["pending", "invalid", "invalid url"].includes(item.status?.toLowerCase())
    ).length;

    // 2. Return the Chart.js data structure
    return {
      labels: ["Indexed", "Not Indexed", "Pending/Invalid"],
      datasets: [
        {
          label: "URL Count",
          data: [indexedCount, notIndexedCount, pendingInvalidCount],
          backgroundColor: [
            "rgba(76, 175, 80, 0.7)",  // Green for Indexed
            "rgba(244, 67, 54, 0.7)",  // Red for Not Indexed
            "rgba(255, 193, 7, 0.7)",  // Yellow for Pending/Invalid
          ],
          borderColor: [
            "#388E3C",
            "#D32F2F",
            "#FFA000",
          ],
          borderWidth: 1,
          borderRadius: 10, // Modern rounded bars
        },
      ],
    };
  }, [filteredindexations]);

  const trendsData = useMemo(() => {
    // 1. Get unique dates from the last 7 checks
    const lastSevenDays = [...new Set(indexations
      .map(item => item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : null)
      .filter(Boolean)
    )].sort().slice(-7); // Keep it to a 7-day trend

    // 2. Map data for each day
    const indexedData = lastSevenDays.map(date =>
      indexations.filter(item =>
        new Date(item.updatedAt).toLocaleDateString() === date &&
        item.status?.toLowerCase() === 'indexed'
      ).length
    );

    const rejectedData = lastSevenDays.map(date =>
      indexations.filter(item =>
        new Date(item.updatedAt).toLocaleDateString() === date &&
        item.status?.toLowerCase() === 'not_indexed'
      ).length
    );

    const pendingData = lastSevenDays.map(date =>
      indexations.filter(item =>
        new Date(item.updatedAt).toLocaleDateString() === date &&
        ['pending', 'invalid', 'invalid url'].includes(item.status?.toLowerCase())
      ).length
    );

    return {
      labels: lastSevenDays.length > 0 ? lastSevenDays : ['No Data'],
      datasets: [
        {
          label: 'Indexed (Accepted)',
          data: indexedData,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Not Indexed (Rejected)',
          data: rejectedData,
          borderColor: '#F44336',
          backgroundColor: 'rgba(244, 67, 54, 0.2)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Pending / Invalid',
          data: pendingData,
          borderColor: '#FFC107',
          backgroundColor: 'rgba(255, 193, 7, 0.2)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  }, [indexations]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e0e0e0',
          padding: 15,
          font: {
            size: 12,
            weight: '500'
          },
          boxWidth: 12
        }
      },
      tooltip: {
        backgroundColor: '#0f3460',
        titleColor: '#ffffff',
        bodyColor: '#e0e0e0',
        borderColor: '#4d7cfe',
        borderWidth: 1,
        padding: 12,
        boxPadding: 4,
        bodyFont: {
          size: 12
        },
        titleFont: {
          size: 13,
          weight: 'bold'
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#adb5bd' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      },
      y: {
        ticks: { color: '#adb5bd' },
        grid: { color: 'rgba(255,255,255,0.08)' },
        beginAtZero: true
      }
    }
  };

  const SkeletonRow = () => (
    <tr>
      <td><div className="skeleton skeleton-avatar"></div></td>
      <td><div className="skeleton skeleton-text"></div></td>
      <td><div className="skeleton skeleton-text"></div></td>
      <td><div className="skeleton skeleton-text"></div></td>
      <td><div className="skeleton skeleton-text"></div></td>
      <td><div className="skeleton skeleton-text"></div></td>
      <td><div className="skeleton skeleton-text"></div></td>
      <td><div className="skeleton skeleton-text"></div></td>
      <td><div className="skeleton skeleton-actions"></div></td>
    </tr>
  );

  return (
    <div className="indexations-dashboard-container">
      {/* Metrics Bar */}
      <div className="metrics-bar">
        <div className="metric-card">
          <div className="metric-top">
            <FaEquals className="metric-icon" />
            <div className="metric-info">
              <h4>Total indexations</h4>
              <p>{indexations.length}</p>
            </div>
          </div>
          <MiniLineChart
            data={generateMiniChartData(indexations.length)}
            color="#4d7cfe"
          />
        </div>
        <div className="metric-card">
          <div className="metric-top">
            <FiArrowUpRight className="metric-icon accepted" />
            <div className="metric-info">
              <h4>Accepted Url Indexation</h4>
              <p>{totalAccepted}</p>
            </div>
          </div>
          <MiniLineChart
            data={generateMiniChartData(totalAccepted)}
            color="#4CAF50"
          />
        </div>
        <div className="metric-card">
          <div className="metric-top">
            <FiArrowDownRight className="metric-icon rejected" />
            <div className="metric-info">
              <h4>Rejected Url Indexation</h4>
              <p>{totalRejected}</p>
            </div>
          </div>
          <MiniLineChart
            data={generateMiniChartData(totalRejected)}
            color="#F44336"
          />
        </div>
        <div className="metric-card">
          <div className="metric-top">
            <FaRegClock className="metric-icon pending" />
            <div className="metric-info">
              <h4>Pending Url Indexation</h4>
              <p>{totalPending}</p>
            </div>
          </div>
          <MiniLineChart
            data={generateMiniChartData(totalPending)}
            color="#FFC107"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="indexations-main-content">
        <div className="page-header">
          <div className="header-title-group">
            <GiLBrick className="header-main-icon" />
            <div className="header-text">
              <h2>List of URL Indexation Results</h2>
              <p>Manage indexation valid, invalid records.</p>
            </div>
          </div>
          <div className="controls">
            <div className={`search-box ${searchTerm ? 'active' : ''}`}>
              <FiSearch />
              <input
                type="text"
                placeholder="Search by id, url, status, details and createdAt ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="clear-search"
                  onClick={() => setSearchTerm('')}
                >
                  &times;
                </button>
              )}
            </div>
            <div className="filter-box">
              <FiFilter />
              <select
                value={filterindexationStatus}
                onChange={(e) => setFilterindexationStatus(e.target.value)}
              >
                <option value="all">All indexation Status</option>
                {indexationStatus.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <button
              className="export-btn"
              onClick={exportToExcel}
              disabled={showSkeleton || filteredindexations.length === 0}
            >
              <FiDownload /> Export Excel
            </button>

            {/* Import Excel Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportExcel}
              style={{ display: 'none' }}
              accept=".xlsx, .xls"
            />
            <button
              className="export-btn import"
              onClick={triggerFileInput}
              disabled={showSkeleton || uploading}
              style={{ backgroundColor: uploading ? '#3a4a6b' : '#198754' }}
            >
              <FiUpload /> {uploading ? "Importing..." : "Import Excel"}
            </button>
          </div>
        </div>

        <div className="table-container">
          {showSkeleton ? (
            <table>
              <thead>
                <tr>
                  <th>Id</th>
                  <th>url</th>
                  <th>status</th>
                  <th>indexation details</th>
                  <th>crated at</th>
                  <th>updated at</th>
                  <th>Manual Check</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          ) : filteredindexations.length > 0 ? (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Id</th>
                    <th>url</th>
                    <th>status</th>
                    <th>indexation details</th>
                    <th>crated at</th>
                    <th>updated at</th>
                    <th>Manual Check</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentindexations.map((indexation) => (
                    <tr key={indexation.id}>
                      <td>{indexation.id}</td>
                      <td>{indexation.url}</td>
                      <td>{indexation.status || "N/A"}</td>
                      <td>{indexation.indexationDetails}</td>
                      <td>{indexation.createdAt ? new Date(indexation.createdAt).toLocaleDateString() : "N/A"}</td>
                      <td>{indexation.updatedAt ? new Date(indexation.updatedAt).toLocaleDateString() : "N/A"}</td>
                      {/* NEW Action Button Column */}
                      <td>
                        {/* <div className="action-buttons"> */}
                          <button
                            onClick={() => handleSingleManualCheck(indexation.id)}
                            className="action-btn check"
                            title="Run Indexation Check"
                          >
                            <FiPlay style={{ color: '#4CAF50' }} />
                          </button>
                        {/* </div>  */}
                      </td>
                      <td>
                        <button
                          onClick={() => handledeleteIndexation(indexation.id)}
                          className="action-btn delete"
                          title="Delete indexation"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination */}
              {filteredindexations.length > indexationsPerPage && (
                <div className="pagination-container">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
                    >
                      {number}
                    </button>
                  ))}

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <NotFoundDisplay />
          )}
        </div>
      </div>

      {/* Analytics Section */}
      {!showSkeleton && indexations.length > 0 && (
        <div className="graphs-section">
          <h3 className="section-title">Analytics Indexation Summary</h3>
          <div className="charts-grid">
            <div className="chart-container">
              <h4 className="chart-title">Url Indexation Status</h4>
              <div className="chart-wrapper">
                <Doughnut
                  data={indexationStatusData}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        ...chartOptions.plugins.legend,
                        position: 'right'
                      }
                    }
                  }}
                />
              </div>
            </div>
            <div className="chart-container">
              <h4 className="chart-title">Top indexation Performance</h4>
              <div className="chart-wrapper">
                <Bar
                  data={performanceData}
                  options={chartOptions}
                />
              </div>
            </div>
          </div>
          <div className="charts-grid">
            <div className="chart-container full-width-chart">
              <h4 className="chart-title">Weekly Indexation Status</h4>
              <div className="chart-wrapper" style={{ height: '350px' }}>
                <Line
                  data={trendsData}
                  options={{
                    ...chartOptions,
                    interaction: {
                      mode: 'index',
                      intersect: false
                    },
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        ...chartOptions.plugins.legend,
                        position: 'top'
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}


      <style jsx="true">{`
          .indexations-dashboard-container {
            background-color: #1a1a2e;
            color: #e0e0e0;
            min-height: 100vh;
            padding: 1.5rem 2rem;
            margin-left: var(--sidebar-shift,0);
            transition: margin-left .32s cubic-bezier(.4,0,.2,1);
            font-family: 'Roboto', 'Segoe UI', sans-serif;
          }

          .metrics-bar {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2.5rem;
          }
          .metric-card {
            background: linear-gradient(145deg, #1e2a4a, #16213e);
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .metric-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(77, 124, 254, 0.15);
          }
          .metric-top {
            display: flex;
            align-items: center;
            gap: 1.25rem;
            margin-bottom: 0.5rem;
          }
          .metric-icon {
            font-size: 2.5rem;
            color: #4d7cfe;
          }
          .metric-icon.accepted { color: #4CAF50; }
          .metric-icon.rejected { color: #F44336; }
          .metric-icon.pending { color: #FFC107; }

          .metric-info h4 {
            margin: 0 0 0.3rem 0;
            color: #bac8dc;
            font-size: 0.85rem;
            font-weight: 500;
            text-transform: uppercase;
          }
          .metric-info p {
            margin: 0;
            font-size: 1.7rem;
            font-weight: 700;
            color: #ffffff;
          }

          .indexations-main-content {
            background-color: #16213e;
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
          }
          .page-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2rem;
            flex-wrap: wrap;
            gap: 1.5rem;
          }
          .header-title-group {
            display: flex;
            align-items: center;
            gap: 1rem;
          }
          .header-main-icon {
            font-size: 2.8rem;
            color: #4d7cfe;
            padding: 0.5rem;
            background-color: rgba(77, 124, 254, 0.1);
            border-radius: 8px;
          }
          .header-text h2 {
            color: #ffffff;
            margin: 0;
            font-size: 1.8rem;
            font-weight: 600;
          }
          .header-text p {
            color: #adb5bd;
            margin: 0.25rem 0 0 0;
            font-size: 0.95rem;
          }
          .controls {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            align-items: center;
          }
          .search-box {
            display: flex;
            align-items: center;
            background-color: #0f3460;
            border-radius: 8px;
            padding: 0.6rem 0.8rem;
            border: 1px solid #3a4a6b;
            position: relative;
            transition: all 0.2s ease;
          }
          .search-box.active {
            border-color: #4d7cfe;
            box-shadow: 0 0 0 2px rgba(77, 124, 254, 0.2);
          }
          .search-box input {
            background: transparent;
            border: none;
            outline: none;
            color: #e0e0e0;
            font-size: 0.9rem;
            margin-left: 0.5rem;
            width: 220px;
            padding-right: 25px;
          }
          .clear-search {
            position: absolute;
            right: 8px;
            background: none;
            border: none;
            color: #7a8b9e;
            cursor: pointer;
            font-size: 1.2rem;
            padding: 0 5px;
            transition: color 0.2s;
          }
          .clear-search:hover {
            color: #e0e0e0;
          }
          .filter-box {
            display: flex;
            align-items: center;
            background-color: #0f3460;
            border-radius: 8px;
            padding: 0.6rem 0.8rem;
            border: 1px solid #3a4a6b;
          }
          .filter-box select {
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            cursor: pointer;
            padding-right: 1.5rem;
            background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20fill%3D%22%237a8b9e%22%20d%3D%22M5%208l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E');
            background-repeat: no-repeat;
            background-position: right 0.5rem center;
            background: transparent;
            border: none;
            outline: none;
            color: #e0e0e0;
            font-size: 0.9rem;
            margin-left: 0.5rem;
          }
          .filter-box select option {
            background-color: #16213e;
            color: #e0e0e0;
          }
          .search-box svg, .filter-box svg {
            color: #7a8b9e;
          }
          .export-btn {
            background-color: #4d7cfe;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 0.7rem 1.2rem;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: background-color 0.2s ease;
          }
          .export-btn:hover:not(:disabled) {
            background-color: #3a6aed;
          }
          .export-btn:disabled {
            background-color: #3a4a6b;
            cursor: not-allowed;
            opacity: 0.7;
          }
          
          .table-container {
            overflow-x: auto;
          
          
            
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
            color: #e0e0e0;
          }
          th, td {
            padding: 0.9rem 1rem;
            text-align: left;
            border-bottom: 1px solid #2c3e50;
            font-size: 0.9rem;
            white-space: nowrap;
          }
          th {
            background-color: #1f2b4a;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.8rem;
            letter-spacing: 0.5px;
            color: #bac8dc;
          }
          tbody tr:hover {
            background-color: rgba(31, 43, 74, 0.7);
          }
          .indexation-table-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #3a4a6b;
          }
          .action-btn {
            background: none;
            border: none;
            color: #adb5bd;
            cursor: pointer;
            padding: 0.4rem;
            border-radius: 4px;
            transition: color 0.2s, background-color 0.2s;
          }
          .action-btn.delete:hover {
            color: #F44336;
            background-color: rgba(244, 67, 54, 0.1);
          }
          .action-btn svg { font-size: 1.1rem; }

          .graphs-section {
            margin-top: 2.5rem;
            padding: 1rem;
          
          
          }
          .section-title {
            color: #ffffff;
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid #3a4a6b;
          }
          .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
            margin-bottom: 0.75rem;
          }
          .chart-container {
            background-color: #0f3460;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: transform 0.2s ease;
          }
          .chart-container:hover {
            transform: translateY(-3px);
          }
          .chart-title {
            color: #e0e0e0;
            text-align: center;
            margin-bottom: 1rem;
            font-size: 1.1rem;
            font-weight: 500;
          }
          .chart-wrapper {
            height: 300px;
            position: relative;
          }
          .full-width-chart {
            grid-column: 1 / -1;
          }
          .full-width-chart .chart-wrapper {
            height: 350px;
          }

          /* Skeleton Loading Styles */
          .skeleton {
            background-color: #2c3e50;
            background-image: linear-gradient(
              90deg,
              #2c3e50,
              #3a4a6b,
              #2c3e50
            );
            background-size: 200px 100%;
            background-repeat: no-repeat;
            border-radius: 4px;
            animation: shimmer 1.5s infinite linear;
            opacity: 0.7;
          }
          .skeleton-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
          }
          .skeleton-text {
            width: 80%;
            height: 1em;
            margin-bottom: 0.5em;
          }
          td .skeleton-text { width: 100%; height: 1.2em; margin-bottom: 0;}
          .skeleton-actions { width: 40px; height: 1.5em; }

          @keyframes shimmer {
            0% { background-position: -200px 0; }
            100% { background-position: calc(200px + 100%) 0; }
          }

          @media (max-width: 1399px) {
            .indexations-dashboard-container {
              margin-left: 0;
              padding: 1rem 1.5rem;
            }
          }
          @media (max-width: 992px) {
            .metrics-bar {
              grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
              gap: 1rem;
            }
            .metric-info p { font-size: 1.4rem; }
            .metric-icon { font-size: 2rem; }

            .page-header {
              flex-direction: column;
              align-items: stretch;
            }
            .controls {
              flex-direction: column;
              align-items: stretch;
            }
            .search-box input { 
              width: 100%; 
              box-sizing: border-box; 
            }
            .filter-box, .search-box, .export-btn { 
              width: 100%; 
              box-sizing: border-box; 
            }
            .filter-box select { width: 100%; }

            .charts-grid {
              grid-template-columns: 1fr;
            }
          }
          @media (max-width: 768px) {
            .header-text h2 { font-size: 1.5rem; }
            .header-text p { font-size: 0.9rem; }
            .indexations-main-content, .graphs-section { padding: 1.5rem; }
            th, td { padding: 0.7rem 0.5rem; font-size: 0.85rem;}
            .indexation-table-avatar { width: 30px; height: 30px;}
            .action-btn svg { font-size: 1rem; }
          }
          @media (max-width: 576px) {
            .indexations-dashboard-container { padding: 1rem; }
            .metrics-bar { grid-template-columns: 1fr; }
            .metric-card { flex-direction: column; }
            .metric-top { margin-bottom: 1rem; }
            .chart-wrapper, .full-width-chart .chart-wrapper { height: 250px; }
          }
            .pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

.pagination-btn {
  padding: 0.5rem 0.8rem;
  border: none;
  border-radius: 25px;
  background-color: #0f3460;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-btn:hover:not(:disabled) {
  background-color: #1e4b8c;
  transform: translateY(-2px);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.pagination-btn.active {
  background-color: #4d7cfe;
  font-weight: bold;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

@media (max-width: 480px) {
  .pagination-container {
    gap: 0.3rem;
  }
  
  .pagination-btn {
    min-width: 36px;
    height: 36px;
    padding: 0.5rem;
  }
  
  .pagination-btn:first-child,
  .pagination-btn:last-child {
    display: none;
  }
  
  .pagination-btn:first-child::after,
  .pagination-btn:last-child::after {
    content: "◄";
    font-size: 0.8rem;
  }
  
  .pagination-btn:last-child::after {
    content: "►";
  }
}
        `}</style>
    </div>
  );
};

export default indexations;