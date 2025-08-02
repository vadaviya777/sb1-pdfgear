import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, degrees } from 'pdf-lib';
import { saveAs } from 'file-saver';

// Fix: Use .js instead of .mjs for PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.js';

class PDFRotator {
  constructor() {
    this.fileInput = document.getElementById('fileInput');
    this.uploadBox = document.querySelector('.upload-box');
    this.selectedFile = null;
    this.rotatedPdfBlob = null;
    this.pageRotations = new Map();
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.uploadBox.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.uploadBox.style.borderColor = 'var(--tool-primary)';
    });

    this.uploadBox.addEventListener('dragleave', () => {
      this.uploadBox.style.borderColor = '#e2e8f0';
    });

    this.uploadBox.addEventListener('drop', (e) => {
      e.preventDefault();
      this.uploadBox.style.borderColor = '#e2e8f0';
      const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
      if (files.length > 0) {
        this.handleFileSelection(files[0]);
      }
    });

    this.fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
      if (files.length > 0) {
        this.handleFileSelection(files[0]);
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('select-file-btn')) {
        this.fileInput.click();
      } else if (e.target.classList.contains('convert-other-btn')) {
        this.resetFile();
      } else if (e.target.classList.contains('remove-file')) {
        this.resetFile();
      } else if (e.target.closest('.rotate-left')) {
        this.rotatePage(0, -90);
      } else if (e.target.closest('.rotate-right')) {
        this.rotatePage(0, 90);
      } else if (e.target.closest('.download-button')) {
        this.downloadRotatedPDF();
      }
    });
  }

  handleFileSelection(file) {
    this.selectedFile = file;
    this.pageRotations.clear();
    this.updateUploadBoxContent();
  }

  updateUploadBoxContent() {
    const uploadContent = document.querySelector('.upload-content');

    if (!uploadContent) return;

    if (this.rotatedPdfBlob) {
      uploadContent.innerHTML = `
        <div class="conversion-success">
          <i class="fas fa-check-circle success-icon"></i>
          <h3>Rotation Complete!</h3>
          <p>Your file is ready to download</p>
        </div>
        <div class="file-download-container">
          <div class="file-info-row">
            <div class="file-icon">
              <i class="fas fa-file-pdf"></i>
            </div>
            <div class="file-details">
              <span class="file-name">rotated.pdf</span>
              <span class="file-status">Ready to download</span>
            </div>
            <button class="download-button">
              <i class="fas fa-download"></i>
              Download
            </button>
          </div>
        </div>
        <button class="convert-other-btn secondary-button">
          <i class="fas fa-redo"></i>
          Rotate Another File
        </button>
      `;
    } else if (this.selectedFile) {
      uploadContent.innerHTML = `
        <div class="selected-file-item">
          <i class="fas fa-file-pdf" style="color: #ef4444;"></i>
          <div class="file-details">
            <h4>${this.selectedFile.name}</h4>
            <p>${(this.selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
          <div class="rotation-controls">
            <button class="rotate-left" title="Rotate Left">
              <i class="fas fa-undo"></i>
            </button>
            <button class="rotate-right" title="Rotate Right">
              <i class="fas fa-redo"></i>
            </button>
          </div>
          <button class="remove-file">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="action-buttons">
          <button class="convert-button" onclick="window.pdfRotator.rotatePDF()">
            <i class="fas fa-sync"></i>
            Apply Rotation
          </button>
          <button class="convert-other-btn">
            <i class="fas fa-random"></i>
            Start Over
          </button>
        </div>
      `;
    } else {
      uploadContent.innerHTML = `
        <div class="upload-icon">
          <i class="fas fa-cloud-upload-alt"></i>
        </div>
        <h3>Drop your PDF here</h3>
        <p>or</p>
        <button class="select-file-btn">Choose File</button>
        <p class="file-info">Maximum file size: 50MB</p>
      `;
    }
  }

  resetFile() {
    this.selectedFile = null;
    this.rotatedPdfBlob = null;
    this.pageRotations.clear();
    this.fileInput.value = '';
    this.updateUploadBoxContent();
  }

  async rotatePage(pageIndex, degreesValue) {
    const currentRotation = this.pageRotations.get(pageIndex) || 0;
    let newRotation = (currentRotation + degreesValue + 360) % 360;
    newRotation = Math.round(newRotation / 90) * 90;
    this.pageRotations.set(pageIndex, newRotation);
    this.updateUploadBoxContent();
  }

  async rotatePDF() {
    if (!this.selectedFile) return;

    try {
      const rotateButton = document.querySelector('.convert-button');
      if (rotateButton) {
        rotateButton.disabled = true;
        rotateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Rotating...';
      }

      const arrayBuffer = await this.selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      const rotation = this.pageRotations.get(0) || 0;
      pages.forEach(page => {
        const currentRotation = page.getRotation().angle || 0;
        const finalRotation = (currentRotation + rotation + 360) % 360;
        page.setRotation(degrees(finalRotation));
      });

      const rotatedPdfBytes = await pdfDoc.save();
      this.rotatedPdfBlob = new Blob([rotatedPdfBytes], { type: 'application/pdf' });
      this.updateUploadBoxContent();
    } catch (error) {
      console.error('Error rotating PDF:', error);
      alert('Error rotating PDF. Please try again.');
      const rotateButton = document.querySelector('.convert-button');
      if (rotateButton) {
        rotateButton.disabled = false;
        rotateButton.innerHTML = '<i class="fas fa-sync"></i> Apply Rotation';
      }
    }
  }

  downloadRotatedPDF() {
    if (this.rotatedPdfBlob) {
      saveAs(this.rotatedPdfBlob, 'rotated.pdf');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.pdfRotator = new PDFRotator();
});
