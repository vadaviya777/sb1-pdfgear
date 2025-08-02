import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

class PDFToWordConverter {
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
      } else if (e.target.classList.contains('download-word')) {
        const index = parseInt(e.target.dataset.index);
        this.downloadFile(index);
      } else if (e.target.classList.contains('download-all')) {
        this.downloadAllFiles();
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

  updateUploadBoxContent() {
    const uploadContent = document.querySelector('.upload-content');
    
    if (this.convertedFiles.length > 0) {
      const filesList = this.convertedFiles.map((file, index) => `
        <div class="converted-file-item">
          <i class="fas fa-file-word" style="color: #4285f4;"></i>
          <div class="file-details">
            <h4>${file.name.replace('.pdf', '.docx')}</h4>
            <p>Ready to download</p>
          </div>
          <button class="download-word" data-index="${index}">
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

      uploadContent.innerHTML = `
        <div class="selected-files-list">
          ${filesList}
        </div>
        <button class="toggle-advanced">
          <i class="fas fa-chevron-down"></i> Show Advanced Options
        </button>
        <div class="advanced-options">
          <div class="option-group">
            <label for="format">Output Format</label>
            <select id="format" class="advanced-option">
              <option value="docx">DOCX (Microsoft Word)</option>
              <option value="rtf">RTF (Rich Text Format)</option>
            </select>
          </div>
          <div class="option-group">
            <label for="layout">Layout Accuracy</label>
            <select id="layout" class="advanced-option">
              <option value="high">High (Best for complex layouts)</option>
              <option value="medium">Medium (Balanced)</option>
              <option value="low">Low (Best for simple text)</option>
            </select>
          </div>
          <div class="option-group">
            <label for="imageQuality">Image Quality</label>
            <select id="imageQuality" class="advanced-option">
              <option value="high">High Quality</option>
              <option value="medium">Medium Quality</option>
              <option value="low">Low Quality (Smaller file size)</option>
            </select>
          </div>
        </div>
        <div class="action-buttons">
          <button class="add-more-btn">
            <i class="fas fa-plus"></i>
            Add More Files
          </button>
          <button class="convert-button" onclick="window.pdfConverter.convertPDFToWord()">
            <i class="fas fa-exchange-alt"></i>
            Convert to Word
          </button>
          <button class="convert-other-btn">
            <i class="fas fa-random"></i>
            Convert Other
          </button>
        </div>
      `;
    }
  }

  resetFile() {
    this.selectedFiles = [];
    this.convertedFiles = [];
    this.fileInput.value = '';
    const uploadContent = document.querySelector('.upload-content');
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

  async extractImagesFromPage(page) {
    const scale = 2; // Higher scale for better image quality
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    await page.render(renderContext).promise;

    const operatorList = await page.getOperatorList();
    const images = [];
    
    for (let i = 0; i < operatorList.fnArray.length; i++) {
      if (operatorList.fnArray[i] === pdfjsLib.OPS.paintImageXObject ||
          operatorList.fnArray[i] === pdfjsLib.OPS.paintInlineImageXObject) {
        try {
          const imgData = operatorList.argsArray[i][0];
          const img = await page.objs.get(imgData);
          
          if (img && img.src) {
            // Get image dimensions from transform matrix
            const width = Math.round(img.width * scale);
            const height = Math.round(img.height * scale);

            // Create a temporary canvas for the image
            const imgCanvas = document.createElement('canvas');
            imgCanvas.width = width;
            imgCanvas.height = height;
            const imgContext = imgCanvas.getContext('2d');

            // Draw the image to the canvas
            const imgElement = new Image();
            imgElement.src = img.src;
            await new Promise(resolve => {
              imgElement.onload = resolve;
            });
            imgContext.drawImage(imgElement, 0, 0, width, height);

            // Convert to high-quality PNG
            const imageDataUrl = imgCanvas.toDataURL('image/png', 1.0);
            
            images.push({
              data: imageDataUrl,
              width,
              height
            });
          }
        } catch (error) {
          console.error('Error extracting image:', error);
        }
      }
    }
    
    return images;
  }

  async extractContentFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const content = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      
      // Extract text
      const textContent = await page.getTextContent();
      const text = textContent.items.map(item => item.str).join(' ');
      
      // Extract images with high quality
      const images = await this.extractImagesFromPage(page);
      
      content.push({
        text,
        images
      });
    }

    return content;
  }

  async createWordDocument(content, fileName) {
    const children = [];

    for (const page of content) {
      // Add text
      if (page.text.trim()) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: page.text,
                size: 24 // 12pt font
              })
            ]
          })
        );
      }

      // Add images with proper sizing
      for (const image of page.images) {
        try {
          // Convert data URL to blob
          const response = await fetch(image.data);
          const blob = await response.blob();
          const buffer = await blob.arrayBuffer();

          // Calculate image dimensions (maintaining aspect ratio)
          const maxWidth = 600; // Maximum width in document
          const scale = Math.min(1, maxWidth / image.width);
          const width = Math.round(image.width * scale);
          const height = Math.round(image.height * scale);

          children.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: buffer,
                  transformation: {
                    width,
                    height
                  }
                })
              ]
            })
          );
        } catch (error) {
          console.error('Error adding image to document:', error);
        }
      }

      // Add page break between pages
      children.push(
        new Paragraph({
          children: [new TextRun({ break: 1 })]
        })
      );
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: children
      }]
    });

    const blob = await Packer.toBlob(doc);
    return {
      name: fileName,
      blob: blob
    };
  }

  async downloadFile(index) {
    const file = this.convertedFiles[index];
    saveAs(file.blob, file.name.replace('.pdf', '.docx'));
  }

  async downloadAllFiles() {
    if (this.convertedFiles.length === 1) {
      this.downloadFile(0);
    } else {
      const zip = new JSZip();
      
      this.convertedFiles.forEach((file) => {
        zip.file(file.name.replace('.pdf', '.docx'), file.blob);
      });
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'converted-documents.zip');
    }
  }

  async convertPDFToWord() {
    if (this.selectedFiles.length === 0) return;

    try {
      const convertButton = document.querySelector('.convert-button');
      convertButton.disabled = true;
      convertButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';

      this.convertedFiles = [];

      for (const file of this.selectedFiles) {
        const content = await this.extractContentFromPDF(file);
        const wordDoc = await this.createWordDocument(content, file.name);
        this.convertedFiles.push(wordDoc);
      }

      this.updateUploadBoxContent();
    } catch (error) {
      console.error('Error converting PDF:', error);
      alert('Error converting PDF. Please try again.');
      const convertButton = document.querySelector('.convert-button');
      convertButton.disabled = false;
      convertButton.innerHTML = '<i class="fas fa-exchange-alt"></i> Convert to Word';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.pdfConverter = new PDFToWordConverter();
});