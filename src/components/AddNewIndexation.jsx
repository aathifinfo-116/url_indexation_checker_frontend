import { createSingleUrlForIndexation } from "../api/indexation";
import { useContext, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Context } from "../main";
import { FaUserPlus, FaLink } from "react-icons/fa";
import Lottie from "lottie-react";
import loadingAnimation from "../../public/loding.json";

const AddNewIndexation = () => {
  const { isAuthenticated } = useContext(Context);
  const navigateTo = useNavigate();

  const [formData, setFormData] = useState({
    url: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.url.trim()) newErrors.url = "URL is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("url", formData.url);

      const response = await createSingleUrlForIndexation(formDataToSend);

      toast.success(response.data.message);
      navigateTo("/indexations");

      // Reset form
      setFormData({
        url: "",
      });

    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <div className="loading-container">
        <Lottie
          animationData={loadingAnimation}
          style={{ overflow: "hidden", height: 400, width: 400, marginLeft: "10%" }}
        />
        <p>Registering indexation...</p>

        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background-color: #1a1a2e;
            color: #e9ecef;
          }
          
          .loading-container p {
            margin-top: -5rem;
            font-size: 1.2rem;
            margin-left: 10%;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="indexation-form-wrapper">
        <div className="form-header">
          <div className="header-content">
            <FaLink className="header-icon" />
            <h2>Register New URL indexation</h2>
            <p>Fill in the details to add a new indexation to the system</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="indexation-form">
          <div className="form-content">

            <div className="form-fields">
              <div className="form-grid">
                {/* URL */}
                <div className={`input-group ${errors.url ? 'error' : ''}`}>
                  <label htmlFor="url">
                    <FaUserPlus className="label-icon" />
                    URL
                  </label>
                  <input
                    type="text"
                    id="url"
                    name="url"
                    placeholder="Enter URL"
                    value={formData.url}
                    onChange={handleChange}
                  />
                  {errors.url && <span className="error-message">{errors.url}</span>}
                </div>

              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registering indexation...' : 'Register indexation'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <style jsx>{`
        .dashboard-container {
          background-color: #1a1a2e;
          color: #e9ecef;
          min-height: 100vh;
          padding: 1rem;
          margin-left: 270px;
        }
        
        .indexation-form-wrapper {
          max-width: 1000px;
          margin: 0 auto;
          background-color: #16213e;
          border-radius: 10px;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .form-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .header-content {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .header-icon {
          font-size: 2.5rem;
          color: #4d7cfe;
          margin-bottom: 1rem;
        }
        
        .form-header h2 {
          color: white;
          margin: 0.5rem 0;
          font-size: 1.8rem;
        }
        
        .form-header p {
          color: #adb5bd;
          margin: 0;
        }
        
        .indexation-form {
          display: flex;
          flex-direction: column;
        }
        
        .form-content {
          display: flex;
          gap: 2rem;
        }
        
        .avatar-section {
          flex: 0 0 250px;
        }
        
        .avatar-upload {
          position: relative;
          margin-bottom: 1rem;
        }
        
        .avatar-preview {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid #3a4a6b;
          position: relative;
          cursor: pointer;
        }
        
        .avatar-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .upload-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .avatar-preview:hover .upload-overlay {
          opacity: 1;
        }
        
        .camera-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        
        .file-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
        
        .form-fields {
          flex: 1;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        
        .input-group {
          display: flex;
          flex-direction: column;
          margin-bottom: 1rem;
        }
        
        .input-group label {
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
          color: #e9ecef;
          font-size: 0.95rem;
          font-weight: 500;
        }
        
        .label-icon {
          margin-right: 0.5rem;
          color: #4d7cfe;
          font-size: 1rem;
        }
        
        .input-group input,
        .input-group select {
          padding: 0.75rem 1rem;
          border-radius: 6px;
          border: 1px solid #3a4a6b;
          background-color: #0f3460;
          color: white;
          font-size: 0.95rem;
          transition: border-color 0.3s ease;
        }
        
        .input-group input:focus,
        .input-group select:focus {
          outline: none;
          border-color: #4d7cfe;
          box-shadow: 0 0 0 2px rgba(77, 124, 254, 0.2);
        }
        
        .input-group.error input,
        .input-group.error select,
        .avatar-upload.error .avatar-preview {
          border-color: #ff6b6b;
        }
        
        .error-message {
          color: #ff6b6b;
          font-size: 0.8rem;
          margin-top: 0.25rem;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }
        
        .submit-btn {
          background-color: #4d7cfe;
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        
        .submit-btn:hover {
          background-color: #3a6aed;
        }
        
        .submit-btn:disabled {
          background-color: #3a4a6b;
          cursor: not-allowed;
        }
        
        /* Responsive Adjustments */
        @media (max-width: 1200px) {
          .dashboard-container {
            margin-left: 0;
          }
        }
        
        @media (max-width: 900px) {
          .form-content {
            flex-direction: column;
            align-items: center;
          }
          
          .avatar-section {
            margin-bottom: 2rem;
          }
        }
        
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 1.5rem;
          }
          
          .indexation-form-wrapper {
            padding: 1.5rem;
          }
        }
        
        @media (max-width: 480px) {
          .dashboard-container {
            padding: 1rem;
          }
          
          .indexation-form-wrapper {
            padding: 1rem;
          }
          
          .form-header h2 {
            font-size: 1.5rem;
          }
          
          .avatar-preview {
            width: 150px;
            height: 150px;
          }
          
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AddNewIndexation;