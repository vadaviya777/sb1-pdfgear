import * as pdfjsLib from 'pdfjs-dist';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

class PDFToExcelConverter {
  constructor() {
    this.fileInput = document.getElementById('fileInput');
    this.uploadBox = document.querySelector('.upload-box');
    this.selectedFiles = [];
    this.convertedFiles = [];
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
      } else if (e.target.classList.contains('toggle-advanced')) {
        const advancedOptions = document.querySelector('.advanced-options');
        const toggleBtn = document.querySelector('.toggle-advanced');
        if (advancedOptions) {
          advancedOptions.classList.toggle('show');
          toggleBtn.innerHTML = advancedOptions.classList.contains('show') ? 
            '<i class="fas fa-chevron-up"></i> Hide Advanced Options' : 
            '<i class="fas fa-chevron-down"></i> Show Advanced Options';
        }
      } else if (e.target.classList.contains('download-excel')) {
        const index = parseInt(e.target.dataset.index);
        this.downloadFile(index);
      } else if (e.target.classList.contains('download-all')) {
        this.downloadAllFiles();
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
    
    if (this.convertedFiles.length > 0) {
      const filesList = this.convertedFiles.map((file, index) => `
        <div class="converted-file-item">
          <i class="fas fa-file-excel" style="color: #1D6F42;"></i>
          <div class="file-details">
            <h4>${file.name.replace('.pdf', '.xlsx')}</h4>
            <p>Ready to download</p>
          </div>
          <button class="download-excel" data-index="${index}">
            <i class="fas fa-download"></i> Download
          </button>
        </div>
      `).join('');

      uploadContent.innerHTML = `
        <div class="conversion-success">
          <i class="fas fa-check-circle" style="color: #22c55e; font-size: 48px; margin-bottom: 16px;"></i>
          <h3>Conversion Complete!</h3>
          <p>Your files are ready to download</p>
        </div>
        <div class="converted-files-list">
          ${filesList}
        </div>
        <div class="download-actions">
          ${this.convertedFiles.length > 1 ? `
            <button class="download-all">
              <i class="fas fa-download"></i> Download All Files
            </button>
          ` : ''}
          <button class="convert-other-btn">
            <i class="fas fa-redo"></i> Convert Another File
          </button>
        </div>
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
        <button class="toggle-advanced">
          <i class="fas fa-chevron-down"></i> Show Advanced Options
        </button>
        <div class="advanced-options">
          <div class="option-group">
            <label for="tableDetection">Table Detection</label>
            <select id="tableDetection" class="advanced-option">
              <option value="auto">Automatic</option>
              <option value="strict">Strict (Better Accuracy)</option>
              <option value="loose">Loose (Better Coverage)</option>
            </select>
          </div>
          <div class="option-group">
            <label for="outputFormat">Output Format</label>
            <select id="outputFormat" class="advanced-option">
              <option value="xlsx">Excel (XLSX)</option>
              <option value="xls">Excel 97-2003 (XLS)</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          <div class="option-group">
            <label for="dataType">Data Type Detection</label>
            <select id="dataType" class="advanced-option">
              <option value="auto">Automatic</option>
              <option value="text">All as Text</option>
              <option value="smart">Smart Detection</option>
            </select>
          </div>
        </div>
        <div class="action-buttons">
          <button class="convert-button" onclick="window.pdfConverter.convertToExcel()">
            <i class="fas fa-exchange-alt"></i>
            Convert to Excel
          </button>
          <button class="convert-other-btn">
            <i class="fas fa-random"></i>
            Convert Other
          </button>
        </div>
      ` : `
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
    this.selectedFiles = [];
    this.convertedFiles = [];
    this.fileInput.value = '';
    this.updateUploadBoxContent();
  }

  async extractTablesFromPage(page) {
    const scale = 2;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    const textContent = await page.getTextContent();
    const tables = [];
    
    // Simple table detection based on text layout
    let currentTable = [];
    let currentRow = [];
    let lastY = null;
    
    textContent.items.forEach(item => {
      const { str, transform } = item;
      const y = transform[5];
      
      if (lastY === null || Math.abs(y - lastY) > 5) {
        if (currentRow.length > 0) {
          currentTable.push(currentRow);
          currentRow = [];
        }
        
        if (currentTable.length > 0 && Math.abs(y - lastY) > 20) {
          if (currentTable[0].length > 1) {
            tables.push(currentTable);
          }
          currentTable = [];
        }
      }
      
      currentRow.push(str);
      lastY = y;
    });
    
    if (currentRow.length > 0) {
      currentTable.push(currentRow);
    }
    if (currentTable.length > 0 && currentTable[0].length > 1) {
      tables.push(currentTable);
    }
    
    return tables;
  }

  async convertToExcel() {
    if (this.selectedFiles.length === 0) return;

    try {
      const convertButton = document.querySelector('.convert-button');
      convertButton.disabled = true;
      convertButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';

      this.convertedFiles = [];

      for (const file of this.selectedFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const workbook = XLSX.utils.book_new();
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const tables = await this.extractTablesFromPage(page);
          
          tables.forEach((table, tableIndex) => {
            const worksheet = XLSX.utils.aoa_to_sheet(table);
            XLSX.utils.book_append_sheet(workbook, worksheet, `Page ${i} Table ${tableIndex + 1}`);
          });
        }
        
        const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        this.convertedFiles.push({
          name: file.name,
          blob: blob
        });
      }

      this.updateUploadBoxContent();
    } catch (error) {
      console.error('Error converting PDF to Excel:', error);
      alert('Error converting PDF. Please try again.');
      const convertButton = document.querySelector('.convert-button');
      if (convertButton) {
        convertButton.disabled = false;
        convertButton.innerHTML = '<i class="fas fa-exchange-alt"></i> Convert to Excel';
      }
    }
  }

  downloadFile(index) {
    const file = this.convertedFiles[index];
    if (file) {
      saveAs(file.blob, file.name.replace('.pdf', '.xlsx'));
    }
  }

  async downloadAllFiles() {
    if (this.convertedFiles.length === 1) {
      this.downloadFile(0);
    } else {
      const zip = new JSZip();
      
      this.convertedFiles.forEach((file) => {
        zip.file(file.name.replace('.pdf', '.xlsx'), file.blob);
      });
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'converted-excel-files.zip');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.pdfConverter = new PDFToExcelConverter();
});