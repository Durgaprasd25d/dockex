import { useState, useEffect } from 'react';
import { FileText, Cpu, AlertCircle, Info } from 'lucide-react';
import { api, IDocument } from './services/api';
import { DocumentUpload } from './components/DocumentUpload';
import { DocumentHistory } from './components/DocumentHistory';
import { DocumentViewer } from './components/DocumentViewer';

function App() {
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<IDocument | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch extraction history on load
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const data = await api.getHistory();
        setDocuments(data);
        if (data.length > 0) {
          setSelectedDoc(data[0]);
        }
      } catch (err: any) {
        setError('Failed to establish connection with backend API. Ensure MongoDB and local server are running.');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const handleProcessingStarted = () => {
    setError(null);
  };

  const handleProcessingFinished = (newDoc: IDocument) => {
    setDocuments(prev => [newDoc, ...prev]);
    setSelectedDoc(newDoc);
  };

  const handleProcessingError = (errMsg: string) => {
    setError(errMsg);
  };

  const handleDocumentDeleted = (id: string) => {
    setDocuments(prev => {
      const remaining = prev.filter(doc => doc._id !== id);
      if (selectedDoc?._id === id) {
        setSelectedDoc(remaining.length > 0 ? remaining[0] : null);
      }
      return remaining;
    });
  };

  const handleDocumentUpdated = (updatedDoc: IDocument) => {
    setDocuments(prev => prev.map(doc => doc._id === updatedDoc._id ? updatedDoc : doc));
    setSelectedDoc(updatedDoc);
  };

  return (
    <div className="app-container">
      {/* Header Panel */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo-wrapper">
            <Cpu className="brand-logo" />
          </div>
          <div>
            <h1 className="brand-title">Dock-Ex</h1>
            <span className="brand-subtitle">Intelligent OCR & Data Extraction System</span>
          </div>
        </div>
        <div className="brand-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
          <Info size={14} className="text-secondary" />
          <span>Supports Aadhaar (Front/Back), PAN, Driving License, and RC</span>
        </div>
      </header>

      {/* Global Errors Banner */}
      {error && (
        <div className="quality-warning-card" style={{ background: 'var(--color-error-glow)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <AlertCircle className="warning-icon" style={{ color: 'var(--color-error)' }} />
          <div className="warning-details">
            <span className="warning-title" style={{ color: '#f87171' }}>System Connection Error</span>
            <span className="warning-item">{error}</span>
          </div>
        </div>
      )}

      {/* Main Grid Content */}
      <main className="dashboard-grid">
        {/* Left Side: Upload Panel and history logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <DocumentUpload
            onProcessingStarted={handleProcessingStarted}
            onProcessingFinished={handleProcessingFinished}
            onProcessingError={handleProcessingError}
          />
          {!loading && (
            <DocumentHistory
              documents={documents}
              selectedId={selectedDoc?._id || null}
              onSelectDocument={setSelectedDoc}
            />
          )}
        </div>

        {/* Right Side: Detail review panel */}
        <div>
          {loading ? (
            <div className="glass-panel" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
              <div className="brand-logo-wrapper animate-spin" style={{ background: 'none', boxShadow: 'none' }}>
                <Cpu size={32} className="text-secondary" style={{ color: 'var(--color-primary)' }} />
              </div>
              <span className="text-secondary-label">Loading repository history...</span>
            </div>
          ) : selectedDoc ? (
            <DocumentViewer
              document={selectedDoc}
              onDocumentDeleted={handleDocumentDeleted}
              onDocumentUpdated={handleDocumentUpdated}
            />
          ) : (
            <div className="glass-panel" style={{ minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="empty-state">
                <FileText className="empty-icon" size={48} />
                <h3>No Document Inspected</h3>
                <p className="text-secondary-label" style={{ maxWidth: '300px', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                  Please drag & drop your files on the left or select an item from the log history to review fields.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
