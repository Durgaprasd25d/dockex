import React, { useState } from 'react';
import { History, Search, FileText } from 'lucide-react';
import { IDocument } from '../services/api';

interface DocumentHistoryProps {
  documents: IDocument[];
  selectedId: string | null;
  onSelectDocument: (doc: IDocument) => void;
}

export const DocumentHistory: React.FC<DocumentHistoryProps> = ({
  documents,
  selectedId,
  onSelectDocument,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredDocs = documents.filter(doc => {
    const term = searchTerm.toLowerCase();
    const typeMatch = doc.documentType.toLowerCase().includes(term);
    const textMatch = doc.rawText.toLowerCase().includes(term);
    const fileMatch = doc.files.some(f => f.originalname.toLowerCase().includes(term));
    return typeMatch || textMatch || fileMatch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="glass-panel">
      <h2 className="panel-title">
        <History size={20} />
        Extraction Log History
      </h2>

      <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
        <input
          type="text"
          placeholder="Filter by type, filename, or text..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
          style={{ paddingLeft: '2.25rem' }}
        />
        <Search
          size={16}
          className="text-secondary-label"
          style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }}
        />
      </div>

      <div className="history-list">
        {filteredDocs.length > 0 ? (
          filteredDocs.map((doc) => {
            const fileLabel = doc.files.map(f => f.originalname).join(', ');

            return (
              <div
                key={doc._id}
                className={`history-card ${selectedId === doc._id ? 'active' : ''}`}
                onClick={() => onSelectDocument(doc)}
              >
                <div className="history-details" style={{ width: '100%' }}>
                  <div className="history-type-row" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span className={`doc-type-badge badge-${doc.documentType.toLowerCase()}`}>
                      {doc.documentType}
                    </span>
                    <span className="history-subtext" style={{ fontSize: '0.7rem' }}>
                      {formatDate(doc.uploadedAt)}
                    </span>
                  </div>
                  <span className="history-subtext" title={fileLabel} style={{ marginTop: '0.25rem', display: 'block' }}>
                    {fileLabel || 'Uploaded file'}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <FileText className="empty-icon" size={32} />
            <span className="history-subtext">No records match your filters.</span>
          </div>
        )}
      </div>
    </div>
  );
};
