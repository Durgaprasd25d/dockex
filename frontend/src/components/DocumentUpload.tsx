import React, { useState, useRef } from 'react';
import { Upload, Camera, FileText, X, AlertTriangle } from 'lucide-react';
import { api, IDocument } from '../services/api';

interface DocumentUploadProps {
  onProcessingStarted: () => void;
  onProcessingFinished: (doc: IDocument) => void;
  onProcessingError: (err: string) => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onProcessingStarted,
  onProcessingFinished,
  onProcessingError,
}) => {
  const [documentType, setDocumentType] = useState<'AADHAAR' | 'PAN' | 'DRIVING_LICENSE' | 'VEHICLE_RC'>('AADHAAR');
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const filesArray = Array.from(e.dataTransfer.files);
      addFilesToStage(filesArray);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      addFilesToStage(filesArray);
    }
  };

  const addFilesToStage = (files: File[]) => {
    setErrorMsg(null);
    const validFiles = files.filter(file => {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
      if (!allowed.includes(ext)) {
        setErrorMsg(`File "${file.name}" is not supported. Upload JPG, JPEG, PNG, or PDF.`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg(`File "${file.name}" exceeds the 10MB limit.`);
        return false;
      }
      return true;
    });

    setStagedFiles(prev => {
      const combined = [...prev, ...validFiles];
      if (combined.length > 2) {
        setErrorMsg('You can upload a maximum of 2 files concurrently.');
        return combined.slice(0, 2);
      }
      return combined;
    });
  };

  const removeStagedFile = (index: number) => {
    setStagedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      setIsCameraOpen(false);
      setErrorMsg(`Could not open camera: ${err.message}. Please upload files manually.`);
    }
  };

  const closeCamera = () => {
    setIsCameraOpen(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const capturedFile = new File(
              [blob],
              `camera-capture-${Date.now()}.png`,
              { type: 'image/png' }
            );
            addFilesToStage([capturedFile]);
            closeCamera();
          }
        }, 'image/png');
      }
    }
  };

  const handleUploadSubmit = async () => {
    if (stagedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(15);
    setLogs(['[System] Initializing file uploads...']);
    onProcessingStarted();

    try {
      setUploadProgress(50);
      setLogs(prev => [...prev, `[Upload] Sending documents for type: ${documentType}...`]);
      
      const docResult = await api.uploadDocuments(stagedFiles, documentType, (percent) => {
        setUploadProgress(Math.min(50 + Math.round(percent * 0.4), 90));
      });

      setUploadProgress(90);
      setLogs(prev => [
        ...prev, 
        `[OCR] Successfully processed and extracted data for ${documentType}.`
      ]);

      await new Promise(r => setTimeout(r, 400));
      setUploadProgress(100);
      setIsUploading(false);
      setStagedFiles([]);
      onProcessingFinished(docResult);
    } catch (err: any) {
      setIsUploading(false);
      const errMsg = err.response?.data?.message || err.message || 'Processing failed.';
      setLogs(prev => [...prev, `[Error] ${errMsg}`]);
      onProcessingError(errMsg);
    }
  };

  return (
    <div className="glass-panel">
      <h2 className="panel-title">
        <Upload size={20} />
        Upload Identity Card
      </h2>

      {errorMsg && (
        <div className="quality-warning-card" style={{ marginBottom: '1rem', background: 'var(--color-error-glow)', borderColor: 'rgba(239,68,68,0.3)' }}>
          <AlertTriangle className="warning-icon" style={{ color: 'var(--color-error)' }} />
          <div className="warning-details">
            <span className="warning-title" style={{ color: '#f87171' }}>Validation Issue</span>
            <span className="warning-item">{errorMsg}</span>
          </div>
        </div>
      )}

      {!isUploading ? (
        <>
          {/* Document Type Dropdown */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Select Document Type to Upload</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as any)}
              className="form-input"
              style={{ background: 'rgba(0,0,0,0.3)', cursor: 'pointer' }}
            >
              <option value="AADHAAR">Aadhaar Card (UIDAI)</option>
              <option value="PAN">PAN Card (Income Tax Dept)</option>
              <option value="DRIVING_LICENSE">Driving License (DL)</option>
              <option value="VEHICLE_RC">Vehicle Registration Certificate (RC)</option>
            </select>
          </div>

          <div
            className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="file-input"
              onChange={handleFileSelect}
              accept=".jpg,.jpeg,.png,.pdf"
            />
            <div className="upload-icon-wrapper">
              <Upload size={40} />
            </div>
            <span className="upload-prompt">Drag & Drop files or browse</span>
            <span className="upload-support">Supports JPG, JPEG, PNG, PDF up to 10MB</span>
          </div>

          <div className="button-row mt-2">
            <button className="btn btn-secondary btn-block" onClick={startCamera}>
              <Camera size={16} />
              Capture with Camera
            </button>
          </div>

          {stagedFiles.length > 0 && (
            <div className="staged-files-container mt-2">
              <h4 className="text-secondary-label" style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
                Staged Files ({stagedFiles.length}/2)
              </h4>
              <div className="staged-files-list">
                {stagedFiles.map((file, idx) => (
                  <div key={idx} className="staged-file-card">
                    <div className="file-info">
                      <FileText size={16} className="text-secondary-label" />
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                    </div>
                    <button className="remove-file-btn" onClick={() => removeStagedFile(idx)}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary btn-block mt-2" onClick={handleUploadSubmit}>
                Upload & Extract {documentType}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="processing-container">
          <div className="processing-header">
            <span>Extracting Data...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="progress-bar-wrapper">
            <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
          </div>
          <div className="processing-status-log">
            {logs.map((log, index) => (
              <span key={index} className="processing-step done">
                {log}
              </span>
            ))}
            <span className="processing-step active">Processing files...</span>
          </div>
        </div>
      )}

      {isCameraOpen && (
        <div className="camera-overlay">
          <div className="camera-modal">
            <div className="camera-header">
              <h3>Capture ID Document</h3>
              <button className="remove-file-btn" onClick={closeCamera}>
                <X size={20} />
              </button>
            </div>
            <div className="camera-preview-container">
              <video ref={videoRef} className="camera-video" playsInline></video>
              <div className="camera-overlay-box"></div>
            </div>
            <div className="camera-controls">
              <button className="shutter-btn" onClick={capturePhoto}>
                <div className="shutter-btn-inner"></div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
