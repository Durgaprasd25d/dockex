import React, { useState, useEffect } from 'react';
import { Save, Trash2, Download, Check, AlertCircle, FileText } from 'lucide-react';
import { api, IDocument } from '../services/api';

interface DocumentViewerProps {
  document: IDocument;
  onDocumentDeleted: (id: string) => void;
  onDocumentUpdated: (doc: IDocument) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document: doc,
  onDocumentDeleted,
  onDocumentUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'table' | 'raw'>('table');
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (doc) {
      setFormData(doc.data || {});
      setActiveImageIdx(0);
      setSaveStatus('idle');
    }
  }, [doc]);

  const handleInputChange = (fieldKey: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const updatedDoc = await api.updateFields(doc._id, formData);
      onDocumentUpdated(updatedDoc);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to permanently delete this document record?')) {
      try {
        await api.deleteDocument(doc._id);
        onDocumentDeleted(doc._id);
      } catch (err) {
        alert('Failed to delete document.');
      }
    }
  };

  const getFieldsConfig = () => {
    const common = {
      name: 'Full Name',
      dob: 'Date of Birth',
    };

    switch (doc.documentType) {
      case 'AADHAAR':
        return {
          ...common,
          gender: 'Gender',
          aadhaarNumber: 'Aadhaar Card Number',
          address: 'Residential Address',
          pincode: 'Pincode',
        };
      case 'PAN':
        return {
          ...common,
          fatherName: "Father's Name",
          panNumber: 'PAN Card Number',
        };
      case 'DRIVING_LICENSE':
        return {
          ...common,
          licenseNumber: 'Driving License Number',
          expiryDate: 'License Expiry Date',
          address: 'Registered Address',
          pincode: 'Pincode',
        };
      case 'VEHICLE_RC':
        return {
          registrationNumber: 'Registration Number (Plate)',
          ownerName: 'Owner Name',
          chassisNumber: 'Chassis Number (VIN)',
          engineNumber: 'Engine Number',
          vehicleModel: 'Vehicle Model & Class',
          expiryDate: 'Registration Expiry Date',
        };
      default:
        return Object.keys(formData).reduce((acc, key) => {
          acc[key] = key.toUpperCase();
          return acc;
        }, {} as Record<string, string>);
    }
  };

  const fieldsConfig = getFieldsConfig();

  return (
    <div className="glass-panel">
      <div className="viewer-header-row">
        <div>
          <span className={`doc-type-badge badge-${doc.documentType.toLowerCase()}`}>
            {doc.documentType}
          </span>
        </div>
        <div className="toggle-tab-group">
          <button
            className={`toggle-tab-btn ${activeTab === 'table' ? 'active' : ''}`}
            onClick={() => setActiveTab('table')}
          >
            Table View
          </button>
          <button
            className={`toggle-tab-btn ${activeTab === 'raw' ? 'active' : ''}`}
            onClick={() => setActiveTab('raw')}
          >
            Raw OCR Text
          </button>
        </div>
      </div>

      <div className="split-viewer-panel mt-2">
        <div className="image-preview-panel">
          <div className="preview-carousel">
            {doc.files && doc.files.length > 0 ? (
              doc.files[activeImageIdx]?.mimeType === 'application/pdf' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <FileText size={48} />
                  <span>PDF Document: {doc.files[activeImageIdx].originalname}</span>
                </div>
              ) : (
                <img
                  src={doc.files[activeImageIdx]?.path}
                  alt="Uploaded preview"
                  className="preview-image"
                />
              )
            ) : (
              <span className="text-secondary-label">No preview available</span>
            )}

            {doc.files && doc.files.length > 1 && (
              <div className="carousel-controls">
                {doc.files.map((_, idx) => (
                  <button
                    key={idx}
                    className={`carousel-dot ${activeImageIdx === idx ? 'active' : ''}`}
                    onClick={() => setActiveImageIdx(idx)}
                  ></button>
                ))}
              </div>
            )}
          </div>

          {doc.files && doc.files.length > 1 && (
            <div className="preview-file-tab">
              {doc.files.map((file, idx) => (
                <button
                  key={idx}
                  className={`file-tab ${activeImageIdx === idx ? 'active' : ''}`}
                  onClick={() => setActiveImageIdx(idx)}
                >
                  {file.originalname}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="extraction-content">
          {activeTab === 'table' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <table className="extraction-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ width: '35%', textAlign: 'left', padding: '0.75rem', borderBottom: '2px solid var(--border-glass)' }}>Field Name</th>
                    <th style={{ width: '65%', textAlign: 'left', padding: '0.75rem', borderBottom: '2px solid var(--border-glass)' }}>Extracted Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(fieldsConfig).map(([key, label]) => {
                    const val = formData[key] || '';
                    return (
                      <tr key={key}>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-glass)', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {label}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-glass)' }}>
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => handleInputChange(key, e.target.value)}
                            className="form-input"
                            style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid rgba(255,255,255,0.05)', background: 'transparent' }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="button-row mt-2">
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={isSaving}
                  onClick={handleSave}
                >
                  {isSaving ? (
                    'Saving...'
                  ) : saveStatus === 'success' ? (
                    <>
                      <Check size={16} />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
                <a
                  className="btn btn-secondary"
                  href={api.getDownloadUrl(doc._id)}
                  download
                >
                  <Download size={16} />
                  Download JSON
                </a>
                <button className="btn btn-danger" onClick={handleDelete} title="Delete document">
                  <Trash2 size={16} />
                </button>
              </div>

              {saveStatus === 'error' && (
                <span className="text-error" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <AlertCircle size={14} /> Failed to save edits. Please try again.
                </span>
              )}
            </div>
          ) : (
            <div className="raw-text-panel">
              <h4 className="text-secondary-label" style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Full OCR Raw Text
              </h4>
              <div className="raw-text-container">{doc.rawText || 'No raw text extracted.'}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
