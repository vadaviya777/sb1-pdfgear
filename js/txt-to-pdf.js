import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';

class TXTToPDFConverter {
  constructor() {
    this.fileInput = document.getElementById('fileInput');
    this.uploadBox = document.querySelector('.upload-box');
    this.selectedFiles = [];
    this.convertedPdfBlob = null;
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
      const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'text/plain');
      if (files.length > 0) {
        this.handleFileSelection(files);
      }
    });

    this.fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files).filter(file => file.type === 'text/plain');
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
      } else if (e.target.closest('.download-button')) {
        this.downloadPDF();
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
    
    if (this.convertedPdfBlob) {
      uploadContent.innerHTML = `
        <div class="conversion-success">
          <i class="fas fa-check-circle success-icon"></i>
          <h3>Conversion Complete!</h3>
          <p>Your file is ready to download</p>
        </div>
        <div class="file-download-container">
          <div class="file-info-row">
            <div class="file-icon">
              <i class="fas fa-file-pdf"></i>
            </div>
            <div class="file-details">
              <span class="file-name">converted.pdf</span>
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
    } else {
      const filesList = this.selectedFiles.map((file, index) => `
        <div class="selected-file-item">
          <i class="fas fa-file-alt" style="color: #64748b;"></i>
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
            <label for="fontSize">Font Size</label>
            <select id="fontSize" class="advanced-option">
              <option value="10">10pt</option>
              <option value="12" selected>12pt</option>
              <option value="14">14pt</option>
              <option value="16">16pt</option>
            </select>
          </div>
          <div class="option-group">
            <label for="margins">Margins</label>
            <select id="margins" class="advanced-option">
              <option value="narrow">Narrow</option>
              <option value="normal" selected>Normal</option>
              <option value="wide">Wide</option>
            </select>
          </div>
          <div class="option-group">
            <label for="pageSize">Page Size</label>
            <select id="pageSize" class="advanced-option">
              <option value="a4" selected>A4</option>
              <option value="letter">Letter</option>
              <option value="legal">Legal</option>
            </select>
          </div>
        </div>
        <div class="action-buttons">
          <button class="convert-button" onclick="window.txtToPdfConverter.convertToPDF()">
            <i class="fas fa-exchange-alt"></i>
            Convert to PDF
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
        <h3>Drop your text file here</h3>
        <p>or</p>
        <button class="select-file-btn">Choose File</button>
        <p class="file-info">Maximum file size: 50MB</p>
      `;
    }
  }

  resetFile() {
    this.selectedFiles = [];
    this.convertedPdfBlob = null;
    this.fileInput.value = '';
    this.updateUploadBoxContent();
  }

  async convertToPDF() {
    if (this.selectedFiles.length === 0) return;

    try {
      const convertButton = document.querySelector('.convert-button');
      convertButton.disabled = true;
      convertButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';

      const fontSize = parseInt(document.getElementById('fontSize')?.value || '12');
      const margins = document.getElementById('margins')?.value || 'normal';
      const pageSize = document.getElementById('pageSize')?.value || 'a4';

      // Set margins based on selection
      let marginSize;
      switch (margins) {
        case 'narrow':
          marginSize = 15;
          break;
        case 'wide':
          marginSize = 30;
          break;
        default:
          marginSize = 20;
      }

      const doc = new jsPDF({
        format: pageSize,
        unit: 'mm'
      });

      for (const file of this.selectedFiles) {
        const text = await file.text();
        const lines = text.split('\n');

        // Calculate available width for text
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const maxWidth = pageWidth - (2 * marginSize);

        // Set font size and calculate line height
        doc.setFontSize(fontSize);
        const lineHeight = fontSize * 0.3527777778; // Convert pt to mm

        let y = marginSize;
        
        for (const line of lines) {
          // Split long lines to fit page width
          const words = line.split(' ');
          let currentLine = '';

          for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const testWidth = doc.getStringUnitWidth(testLine) * fontSize / doc.internal.scaleFactor;

            if (testWidth > maxWidth) {
              // Add current line and start new one
              doc.text(currentLine, marginSize, y);
              currentLine = word;
              y += lineHeight;

              // Check if we need a new page
              if (y > pageHeight - marginSize) {
                doc.addPage();
                y = marginSize;
              }
            } else {
              currentLine = testLine;
            }
          }

          // Add remaining text
          if (currentLine) {
            doc.text(currentLine, marginSize, y);
            y += lineHeight;
          }

          // Add extra line break
          y += lineHeight / 2;

          // Check if we need a new page
          if (y > pageHeight - marginSize) {
            doc.addPage();
            y = marginSize;
          }
        }
      }

      this.convertedPdfBlob = doc.output('blob');
      this.updateUploadBoxContent();
    } catch (error) {
      console.error('Error converting TXT to PDF:', error);
      alert('Error converting file. Please try again.');
      const convertButton = document.querySelector('.convert-button');
      convertButton.disabled = false;
      convertButton.innerHTML = '<i class="fas fa-exchange-alt"></i> Convert to PDF';
    }
  }

  downloadPDF() {
    if (this.convertedPdfBlob) {
      const fileName = this.selectedFiles[0]?.name.replace(/\.[^/.]+$/, '') + '.pdf';
      saveAs(this.convertedPdfBlob, fileName || 'converted.pdf');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.txtToPdfConverter = new TXTToPDFConverter();
});