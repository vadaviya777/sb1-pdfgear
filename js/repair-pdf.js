import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

class PDFRepair {
  constructor() {
    this.fileInput = document.getElementById('fileInput');
    this.uploadBox = document.querySelector('.upload-box');
    this.selectedFiles = [];
    this.repairedPdfBlob = null;
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
        this.handleFileSelection(files);
      }
    });

    this.fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
      if (files.length > 0) {
        this.handleFileSelection(files);
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('select-file-btn')) {
        this.fileInput.click();
      } else if (e.target.classList.contains('convert-other-btn')) {
        this.resetFile();
      } else if (e.target.classList.contains('remove-file')) {
        const index = parseInt(e.target.dataset.index);
        this.removeFile(index);
      } else if (e.target.closest('.download-button')) {
        this.downloadRepairedPDF();
      }
    });
  }

  handleFileSelection(files) {
    this.selectedFiles = files;
    this.updateUploadBoxContent();
  }

  removeFile(index) {
    this.selectedFiles.splice(index, 1);
    if (this.selectedFiles.length === 0) {
      this.resetFile();
    } else {
      this.updateUploadBoxContent();
    }
  }

  updateUploadBoxContent() {
    const uploadContent = document.querySelector('.upload-content');
    
    if (this.repairedPdfBlob) {
      uploadContent.innerHTML = `
        <div class="conversion-success">
          <i class="fas fa-check-circle success-icon"></i>
          <h3>Repair Complete!</h3>
          <p>Your file is ready to download</p>
        </div>
        <div class="file-download-container">
          <div class="file-info-row">
            <div class="file-icon">
              <i class="fas fa-file-pdf"></i>
            </div>
            <div class="file-details">
              <span class="file-name">repaired.pdf</span>
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
          Repair Another File
        </button>
      `;
    } else {
      const filesList = this.selectedFiles.map((file, index) => `
        <div class="selected-file-item">
          <i class="fas fa-file-pdf" style="color: #ef4444;"></i>
          <div class="file-details">
            <h4>${file.name}</h4>
            <p>${(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
          <button class="remove-file" data-index="${index}">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `).join('');

      uploadContent.innerHTML = this.selectedFiles.length > 0 ? `
        <div class="selected-files-list">
          ${filesList}
        </div>
        <div class="action-buttons">
          <button class="convert-button" onclick="window.pdfRepair.repairPDF()">
            <i class="fas fa-tools"></i>
            Repair PDF
          </button>
          <button class="convert-other-btn">
            <i class="fas fa-random"></i>
            Start Over
          </button>
        </div>
      ` : `
        <div class="upload-icon">
          <i class="fas fa-cloud-upload-alt"></i>
        </div>
        <h3>Drop your damaged PDF here</h3>
        <p>or</p>
        <button class="select-file-btn">Choose File</button>
        <p class="file-info">Maximum file size: 50MB</p>
      `;
    }
  }

  resetFile() {
    this.selectedFiles = [];
    this.repairedPdfBlob = null;
    this.fileInput.value = '';
    this.updateUploadBoxContent();
  }

  async repairPDF() {
    if (this.selectedFiles.length === 0) return;

    try {
      const repairButton = document.querySelector('.convert-button');
      repairButton.disabled = true;
      repairButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Repairing...';

      const file = this.selectedFiles[0];
      const arrayBuffer = await file.arrayBuffer();
      
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      
      try {
        // Try to load the damaged PDF
        const damagedPdf = await PDFDocument.load(arrayBuffer, {
          ignoreEncryption: true,
          updateMetadata: false
        });

        // Copy all pages from the damaged PDF
        const pages = await pdfDoc.copyPages(damagedPdf, damagedPdf.getPageIndices());
        pages.forEach(page => pdfDoc.addPage(page));
      } catch (error) {
        console.error('Error during PDF repair:', error);
        
        // If loading fails, try to recover content using PDF.js
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;

        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1 });
          
          // Create a new page in the PDF
          const newPage = pdfDoc.addPage([viewport.width, viewport.height]);
          
          // Extract text content
          const textContent = await page.getTextContent();
          const textItems = textContent.items;
          
          // Add text content to the new page
          for (const item of textItems) {
            const { str, transform } = item;
            newPage.drawText(str, {
              x: transform[4],
              y: viewport.height - transform[5],
              size: 12
            });
          }
        }
      }

      // Save the repaired PDF
      const repairedPdfBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsStack: [],
        updateFieldAppearances: false
      });

      this.repairedPdfBlob = new Blob([repairedPdfBytes], { type: 'application/pdf' });
      this.updateUploadBoxContent();
    } catch (error) {
      console.error('Error repairing PDF:', error);
      alert('Error repairing PDF. The file might be too damaged to repair.');
      const repairButton = document.querySelector('.convert-button');
      repairButton.disabled = false;
      repairButton.innerHTML = '<i class="fas fa-tools"></i> Repair PDF';
    }
  }

  downloadRepairedPDF() {
    if (this.repairedPdfBlob) {
      saveAs(this.repairedPdfBlob, 'repaired.pdf');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.pdfRepair = new PDFRepair();
});