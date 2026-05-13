import React, { useState, useEffect } from 'react';
import { FileText, Download, Plus, Eye, Trash2, Search, AlertCircle, CheckCircle } from 'lucide-react';
import '../styles/sop-repository.css';

const SOPRepository = () => {
  const [sops, setSops] = useState([]);
  const [filteredSops, setFilteredSops] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedSop, setSelectedSop] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);

  const mockSops = [
    {
      id: 1,
      title: 'Quality Control Procedures',
      description: 'Standard Operating Procedures for Quality Control department',
      version: '2.1',
      file_url: '/files/qc_procedures_v2.1.pdf',
      created_by: 'Admin User',
      created_at: '2024-01-15',
      updated_at: '2024-05-10',
      courses_using: 3,
    },
    {
      id: 2,
      title: 'Pharmaceutical Safety Protocols',
      description: 'Safety guidelines and protocols for all pharmaceutical operations',
      version: '1.8',
      file_url: '/files/safety_protocols_v1.8.pdf',
      created_by: 'John Smith',
      created_at: '2024-02-20',
      updated_at: '2024-04-15',
      courses_using: 5,
    },
    {
      id: 3,
      title: 'Laboratory Equipment Maintenance',
      description: 'Maintenance and care instructions for laboratory equipment',
      version: '3.0',
      file_url: '/files/lab_equipment_v3.0.pdf',
      created_by: 'Dr. Jane Williams',
      created_at: '2024-03-10',
      updated_at: '2024-05-01',
      courses_using: 2,
    },
    {
      id: 4,
      title: 'Data Management Standards',
      description: 'Standards for data collection, storage, and management',
      version: '1.5',
      file_url: '/files/data_management_v1.5.pdf',
      created_by: 'Admin User',
      created_at: '2024-04-05',
      updated_at: '2024-05-08',
      courses_using: 4,
    },
    {
      id: 5,
      title: 'Regulatory Compliance Guide',
      description: 'Compliance requirements and regulatory guidelines',
      version: '2.3',
      file_url: '/files/regulatory_compliance_v2.3.pdf',
      created_by: 'Compliance Team',
      created_at: '2024-01-20',
      updated_at: '2024-05-12',
      courses_using: 6,
    },
  ];

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setSops(mockSops);
      setFilteredSops(mockSops);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDownload = (sop) => {
    try {
      if (!sop.file_url) {
        showToast('File URL not available', 'error');
        return;
      }

      const link = document.createElement('a');
      link.href = sop.file_url;
      link.download = `${sop.title.replace(/\s+/g, '_')}_v${sop.version}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Downloaded ${sop.title}`, 'success');
    } catch (error) {
      console.error('Download error:', error);
      showToast('Failed to download SOP', 'error');
    }
  };

  const handleDelete = async (sop) => {
    if (!window.confirm(`Are you sure you want to delete "${sop.title}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(sop.id);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/sops/${sop.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete SOP');
      }

      setSops(sops.filter((s) => s.id !== sop.id));
      setFilteredSops(filteredSops.filter((s) => s.id !== sop.id));

      showToast(`"${sop.title}" deleted successfully`, 'success');

      if (showDetailModal && selectedSop?.id === sop.id) {
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Failed to delete SOP. Please try again.', 'error');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleViewDetails = (sop) => {
    setSelectedSop(sop);
    setShowDetailModal(true);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredSops(sops);
    } else {
      const filtered = sops.filter(
        (sop) =>
          sop.title.toLowerCase().includes(query.toLowerCase()) ||
          sop.description.toLowerCase().includes(query.toLowerCase()) ||
          sop.version.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSops(filtered);
    }
  };

  return (
    <div className="sop-repository-container">
      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          <div className="toast-content">
            {toast.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
      <div className="sop-header">
        <div>
          <h1>SOP Repository</h1>
          <p>Access and manage all Standard Operating Procedures for employee training</p>
        </div>
        <button className="btn-upload" onClick={() => setShowUploadModal(true)}>
          <Plus size={20} />
          Upload New SOP
        </button>
      </div>

      <div className="sop-search-bar">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Search SOPs by title, description, or version..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {isLoading ? (
        <div className="sop-loading">Loading SOPs...</div>
      ) : filteredSops.length === 0 ? (
        <div className="sop-empty">
          <FileText size={48} />
          <h3>No SOPs Found</h3>
          <p>{searchQuery ? 'Try adjusting your search query' : 'No SOPs available yet'}</p>
        </div>
      ) : (
        <div className="sop-grid">
          {filteredSops.map((sop) => (
            <div key={sop.id} className="sop-card">
              <div className="sop-card-header">
                <div className="sop-icon">
                  <FileText size={32} />
                </div>
                <div className="sop-meta">
                  <span className="sop-version">v{sop.version}</span>
                  <span className="sop-courses">{sop.courses_using} courses</span>
                </div>
              </div>

              <div className="sop-card-content">
                <h3 className="sop-title">{sop.title}</h3>
                <p className="sop-description">{sop.description}</p>

                <div className="sop-details">
                  <div className="detail-item">
                    <span className="detail-label">Created by:</span>
                    <span className="detail-value">{sop.created_by}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Last updated:</span>
                    <span className="detail-value">{sop.updated_at}</span>
                  </div>
                </div>
              </div>

              <div className="sop-card-actions">
                <button
                  className="btn-action btn-view"
                  onClick={() => handleViewDetails(sop)}
                  title="View Details"
                  disabled={isDeleting === sop.id}
                >
                  <Eye size={18} />
                </button>
                <button
                  className="btn-action btn-download"
                  onClick={() => handleDownload(sop)}
                  title="Download"
                  disabled={isDeleting === sop.id}
                >
                  <Download size={18} />
                </button>
                <button
                  className="btn-action btn-delete"
                  onClick={() => handleDelete(sop)}
                  title="Delete"
                  disabled={isDeleting === sop.id}
                >
                  {isDeleting === sop.id ? (
                    <span className="spinner-small" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetailModal && selectedSop && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedSop.title}</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-group">
                <label>Description</label>
                <p>{selectedSop.description}</p>
              </div>

              <div className="detail-group">
                <label>Version</label>
                <p>v{selectedSop.version}</p>
              </div>

              <div className="detail-group">
                <label>Created by</label>
                <p>{selectedSop.created_by}</p>
              </div>

              <div className="detail-group">
                <label>Created Date</label>
                <p>{selectedSop.created_at}</p>
              </div>

              <div className="detail-group">
                <label>Last Updated</label>
                <p>{selectedSop.updated_at}</p>
              </div>

              <div className="detail-group">
                <label>Used in Courses</label>
                <p>{selectedSop.courses_using} courses</p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-download" onClick={() => handleDownload(selectedSop)}>
                <Download size={18} />
                Download SOP
              </button>
              <button className="btn-close" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload New SOP</h2>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-group">
                <label>SOP Title *</label>
                <input type="text" placeholder="Enter SOP title" />
              </div>

              <div className="detail-group">
                <label>Description *</label>
                <textarea placeholder="Enter SOP description" rows="4"></textarea>
              </div>

              <div className="detail-group">
                <label>Version *</label>
                <input type="text" placeholder="e.g., 1.0" defaultValue="1.0" />
              </div>

              <div className="detail-group">
                <label>Upload File *</label>
                <div className="file-upload">
                  <input type="file" accept=".pdf,.doc,.docx" />
                  <p>PDF, DOC, DOCX accepted</p>
                </div>
              </div>

              <div className="detail-group">
                <label>Associated Courses</label>
                <div className="checkbox-group">
                  <label>
                    <input type="checkbox" />
                    Quality Control Training
                  </label>
                  <label>
                    <input type="checkbox" />
                    Safety Protocols
                  </label>
                  <label>
                    <input type="checkbox" />
                    Lab Equipment Training
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-upload" onClick={() => setShowUploadModal(false)}>
                Upload SOP
              </button>
              <button className="btn-close" onClick={() => setShowUploadModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SOPRepository;
