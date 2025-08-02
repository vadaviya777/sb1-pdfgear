import * as pdfjsLib from 'pdfjs-dist';
import { saveAs } from 'file-saver';
import { PDFDocument } from 'pdf-lib';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

class PDFMerger {
  constructor() {
    this.fileInput = document.getElementById('fileInput');
    this.uploadBox = document.querySelector('.upload-box');
    this.selectedFiles = [];
    this.mergedPdfBlob = null;
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
      } else if (e.target.classList.contains('add-more-btn')) {
        this.fileInput.click();
      } else if (e.target.classList.contains('convert-other-btn')) {
        this.resetFile();
      } else if (e.target.classList.contains('remove-file')) {
        const index = parseInt(e.target.dataset.index);
        this.removeFile(index);
      } else if (e.target.classList.contains('move-up')) {
        const index = parseInt(e.target.dataset.index);
        this.moveFile(index, index - 1);
      } else if (e.target.classList.contains('move-down')) {
        const index = parseInt(e.target.dataset.index);
        this.moveFile(index, index + 1);
      } else if (e.target.closest('.download-button')) {
        this.downloadMergedPDF();
      }
    });
  }

  handleFileSelection(files) {
    this.selectedFiles.push(...files);
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

  moveFile(fromIndex, toIndex) {
    if (toIndex >= 0 && toIndex < this.selectedFiles.length) {
      const file = this.selectedFiles[fromIndex];
      this.selectedFiles.splice(fromIndex, 1);
      this.selectedFiles.splice(toIndex, 0, file);
      this.updateUploadBoxContent();
    }
  }

  updateUploadBoxContent() {
    const uploadContent = document.querySelector('.upload-content');
    
    if (this.selectedFiles.length > 0) {
      const filesList = this.selectedFiles.map((file, index) => `
        <div class="selected-file-item" draggable="true">
          <div class="file-order">${index + 1}</div>
          <i class="fas fa-file-pdf" style="color: #ef4444;"></i>
          <div class="file-details">
            <h4>${file.name}</h4>
            <p>${(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
          <div class="file-actions">
            ${index > 0 ? `<button class="move-up" data-index="${index}"><i class="fas fa-arrow-up"></i></button>` : ''}
            ${index < this.selectedFiles.length - 1 ? `<button class="move-down" data-index="${index}"><i class="fas fa-arrow-down"></i></button>` : ''}
            <button class="remove-file" data-index="${index}">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      `).join('');

      uploadContent.innerHTML = `
        <div class="selected-files-list">
          ${filesList}
        </div>
        <div class="action-buttons">
          <button class="add-more-btn">
            <i class="fas fa-plus"></i>
            Add More Files
          </button>
          <button class="convert-button" onclick="window.pdfMerger.mergePDFs()">
            <i class="fas fa-object-group"></i>
            Merge PDFs
          </button>
          <button class="convert-other-btn">
            <i class="fas fa-random"></i>
            Start Over
          </button>
        </div>
      `;

      this.setupDragAndDrop();
    } else {
      uploadContent.innerHTML = `
        <div class="upload-icon">
          <i class="fas fa-cloud-upload-alt"></i>
        </div>
        <h3>Drop your PDF files here</h3>
        <p>or</p>
        <button class="select-file-btn">Choose Files</button>
        <p class="file-info">Maximum file size: 50MB per file</p>
      `;
    }
  }

  setupDragAndDrop() {
    const fileItems = document.querySelectorAll('.selected-file-item');
    let draggedItem = null;

    fileItems.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        draggedItem = item;
        e.dataTransfer.effectAllowed = 'move';
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', () => {
        draggedItem.classList.remove('dragging');
        draggedItem = null;
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedItem && draggedItem !== item) {
          const allItems = [...fileItems];
          const fromIndex = allItems.indexOf(draggedItem);
          const toIndex = allItems.indexOf(item);
          this.moveFile(fromIndex, toIndex);
        }
      });
    });
  }

  resetFile() {
    this.selectedFiles = [];
    this.mergedPdfBlob = null;
    this.fileInput.value = '';
    this.updateUploadBoxContent();
  }

  async mergePDFs() {
    if (this.selectedFiles.length === 0) return;

    try {
      const mergeButton = document.querySelector('.convert-button');
      mergeButton.disabled = true;
      mergeButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Merging...';

      const pdfs = await Promise.all(
        this.selectedFiles.map(file => file.arrayBuffer().then(data => pdfjsLib.getDocument({ data }).promise))
      );

      const totalPages = pdfs.reduce((sum, pdf) => sum + pdf.numPages, 0);
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < pdfs.length; i++) {
        const pdf = pdfs[i];
        const pdfDoc = await PDFDocument.load(await this.selectedFiles[i].arrayBuffer());
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      this.mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });

      const uploadContent = document.querySelector('.upload-content');
      uploadContent.innerHTML = `
        <div class="conversion-success">
          <i class="fas fa-check-circle success-icon"></i>
          <h3>Conversion Complete!</h3>
          <p>Your files are ready to download</p>
        </div>
        <div class="file-download-container">
          <div class="file-info-row">
            <div class="file-icon">
              <i class="fas fa-file-pdf"></i>
            </div>
            <div class="file-details">
              <span class="file-name">merged.pdf</span>
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
          Convert Another File
        </button>
      `;
    } catch (error) {
      console.error('Error merging PDFs:', error);
      alert('Error merging PDFs. Please try again.');
      const mergeButton = document.querySelector('.convert-button');
      mergeButton.disabled = false;
      mergeButton.innerHTML = '<i class="fas fa-object-group"></i> Merge PDFs';
    }
  }

  downloadMergedPDF() {
    if (this.mergedPdfBlob) {
      saveAs(this.mergedPdfBlob, 'merged.pdf');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.pdfMerger = new PDFMerger();
});