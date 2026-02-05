import jsPDF from 'jspdf';
import JSZip from 'jszip';

export interface ExportOptions {
  format: "pdf" | "epub" | "markdown" | "html" | "ibook" | "mobi" | "flipbook";
  title: string;
  author: string;
  content: string;
  includeTableOfContents: boolean;
  includeCopyright: boolean;
}

export class ExportService {
  async exportBook(options: ExportOptions): Promise<Blob> {
    switch (options.format) {
      case "markdown":
        return this.exportMarkdown(options);
      case "html":
        return this.exportHTML(options);
      case "pdf":
        return this.exportPDF(options);
      case "epub":
        return this.exportEPUB(options);
      case "ibook":
        return this.exportIBook(options);
      case "mobi":
        return this.exportMobi(options);
      case "flipbook":
        return this.exportFlipbook(options);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  private exportMarkdown(options: ExportOptions): Blob {
    const chapters = this.extractChapters(options.content);
    const wordCount = this.calculateWordCount(options.content);
    const currentDate = new Date().toISOString().split('T')[0];
    
    // YAML frontmatter
    let markdown = `---
title: "${options.title}"
author: "${options.author}"
date: "${currentDate}"
description: "An AI-generated ebook created with Bestseller Author Pro"
word_count: ${wordCount}
chapters: ${chapters.length}
format: "ebook"
generator: "Bestseller Author Pro"
---

# ${options.title}

**By ${options.author}**

*Generated on ${new Date().toLocaleDateString()}*

---

`;

    // Copyright section
    if (options.includeCopyright) {
      markdown += `## Copyright

© ${new Date().getFullYear()} ${options.author}. All rights reserved.

This book is protected by copyright. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the author, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.

---

`;
    }

    // Enhanced table of contents
    if (options.includeTableOfContents) {
      markdown += this.generateEnhancedMarkdownTOC(chapters, wordCount);
    }

    // Book content with enhanced formatting
    chapters.forEach((chapter, index) => {
      markdown += `## Chapter ${index + 1}: ${chapter.title}\n\n`;
      
      // Add chapter metadata
      const chapterWordCount = this.calculateWordCount(chapter.content);
      const readingTime = Math.ceil(chapterWordCount / 200); // Average reading speed
      
      markdown += `*Reading time: ~${readingTime} minute${readingTime !== 1 ? 's' : ''} | ${chapterWordCount} words*\n\n`;
      
      // Process chapter content with enhanced formatting
      const processedContent = this.enhanceMarkdownFormatting(chapter.content);
      markdown += processedContent + '\n\n';
      
      markdown += '---\n\n';
    });

    // Footer
    markdown += `---

*This ebook was generated using Bestseller Author Pro - AI-powered content creation platform.*

**Book Statistics:**
- **Total Words:** ${wordCount.toLocaleString()}
- **Chapters:** ${chapters.length}
- **Estimated Reading Time:** ~${Math.ceil(wordCount / 200)} minutes
- **Generated:** ${new Date().toLocaleDateString()}

---`;

    return new Blob([markdown], { type: "text/markdown" });
  }

  private exportHTML(options: ExportOptions): Blob {
    const chapters = this.extractChapters(options.content);
    const wordCount = this.calculateWordCount(options.content);
    const readingTime = Math.ceil(wordCount / 200);
    const toc = options.includeTableOfContents ? this.generateEnhancedHTMLTOC(chapters) : '';
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="An AI-generated ebook: ${options.title} by ${options.author}">
  <meta name="author" content="${options.author}">
  <meta name="generator" content="Bestseller Author Pro">
  <title>${options.title} - ${options.author}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  ${this.generateEnhancedCSS()}
</head>
<body class="theme-light">
  <!-- Navigation Bar -->
  <nav class="book-nav" id="bookNav">
    <div class="nav-container">
      <div class="nav-brand">
        <h1>${options.title}</h1>
        <span class="nav-author">by ${options.author}</span>
      </div>
      <div class="nav-controls">
        <select id="chapterSelector" class="chapter-selector" aria-label="Navigate to chapter">
          <option value="">Select Chapter</option>
          ${chapters.map((chapter, index) => 
            `<option value="chapter-${index + 1}">Chapter ${index + 1}: ${this.escapeHTML(chapter.title)}</option>`
          ).join('')}
        </select>
        <button id="fontSizeToggle" class="control-btn" aria-label="Adjust font size" title="Font Size">
          <span class="font-icon">A</span>
        </button>
        <button id="themeToggle" class="control-btn" aria-label="Toggle theme" title="Toggle Theme">
          <span class="theme-icon">🌙</span>
        </button>
        <button id="tocToggle" class="control-btn" aria-label="Toggle table of contents" title="Table of Contents">
          <span class="toc-icon">📑</span>
        </button>
      </div>
    </div>
    <div class="reading-progress">
      <div class="progress-bar" id="progressBar"></div>
    </div>
  </nav>

  <!-- Main Content -->
  <main class="book-content">
    <!-- Title Page -->
    <section class="title-page" id="title-page">
      <div class="title-container">
        <h1 class="book-title">${options.title}</h1>
        ${options.author ? `<p class="book-author">By ${options.author}</p>` : ''}
        <div class="book-meta">
          <p class="meta-item"><strong>${wordCount.toLocaleString()}</strong> words</p>
          <p class="meta-item"><strong>${chapters.length}</strong> chapters</p>
          <p class="meta-item"><strong>~${readingTime}</strong> minutes reading</p>
          <p class="meta-item">Generated on <strong>${new Date().toLocaleDateString()}</strong></p>
        </div>
      </div>
    </section>

    ${options.includeCopyright ? this.generateCopyrightSection(options) : ''}
    
    ${toc}
    
    <!-- Chapters -->
    <div class="chapters-container">
      ${chapters.map((chapter, index) => this.generateEnhancedChapterHTML(chapter, index + 1)).join('')}
    </div>

    <!-- Footer -->
    <footer class="book-footer">
      <div class="footer-content">
        <p><em>This ebook was generated using <strong>Bestseller Author Pro</strong> - AI-powered content creation platform.</em></p>
        <div class="book-stats">
          <span><strong>Total Words:</strong> ${wordCount.toLocaleString()}</span>
          <span><strong>Chapters:</strong> ${chapters.length}</span>
          <span><strong>Reading Time:</strong> ~${readingTime} minutes</span>
          <span><strong>Generated:</strong> ${new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </footer>
  </main>

  ${this.generateEnhancedJavaScript()}
</body>
</html>`;

    return new Blob([html], { type: "text/html" });
  }

  private async exportPDF(options: ExportOptions): Promise<Blob> {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      floatPrecision: 16
    });

    // Set up page margins and dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    const lineHeight = 7;
    let yPosition = margin;

    // Helper function to add new page if needed
    const checkPageBreak = (requiredHeight: number = lineHeight) => {
      if (yPosition + requiredHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Helper function to add text with word wrapping
    const addText = (text: string, fontSize: number = 12, fontStyle: string = 'normal') => {
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', fontStyle);
      
      const lines = pdf.splitTextToSize(text, contentWidth);
      
      for (const line of lines) {
        checkPageBreak();
        pdf.text(line, margin, yPosition);
        yPosition += lineHeight;
      }
    };

    // Title Page
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    const titleLines = pdf.splitTextToSize(options.title, contentWidth);
    const titleHeight = titleLines.length * 10;
    const titleY = (pageHeight / 2) - (titleHeight / 2);
    
    titleLines.forEach((line: string, index: number) => {
      const textWidth = pdf.getTextWidth(line);
      const x = (pageWidth - textWidth) / 2;
      pdf.text(line, x, titleY + (index * 10));
    });

    if (options.author) {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      const authorText = `By ${options.author}`;
      const authorWidth = pdf.getTextWidth(authorText);
      const authorX = (pageWidth - authorWidth) / 2;
      pdf.text(authorText, authorX, titleY + titleHeight + 20);
    }

    // Copyright Page
    if (options.includeCopyright) {
      pdf.addPage();
      yPosition = margin;
      
      const copyrightText = `© ${new Date().getFullYear()} ${options.author}. All rights reserved.

This book is protected by copyright. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the author, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.`;
      
      addText(copyrightText, 10);
    }

    // Table of Contents
    if (options.includeTableOfContents) {
      pdf.addPage();
      yPosition = margin;
      
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Table of Contents', margin, yPosition);
      yPosition += lineHeight * 2;
      
      const chapters = this.extractChapters(options.content);
      chapters.forEach((chapter, index) => {
        checkPageBreak();
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${index + 1}. ${chapter.title}`, margin + 5, yPosition);
        yPosition += lineHeight;
      });
    }

    // Content
    pdf.addPage();
    yPosition = margin;

    const chapters = this.extractChapters(options.content);
    
    chapters.forEach((chapter, index) => {
      // Chapter title
      checkPageBreak(lineHeight * 2);
      yPosition += lineHeight; // Extra space before chapter
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const chapterTitle = `Chapter ${index + 1}: ${chapter.title}`;
      pdf.text(chapterTitle, margin, yPosition);
      yPosition += lineHeight * 2;

      // Chapter content
      const paragraphs = chapter.content.split('\n\n').filter(p => p.trim());
      
      paragraphs.forEach(paragraph => {
        if (paragraph.trim()) {
          checkPageBreak();
          addText(paragraph.trim(), 12, 'normal');
          yPosition += lineHeight * 0.5; // Paragraph spacing
        }
      });
      
      yPosition += lineHeight; // Extra space after chapter
    });

    // Add page numbers
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      if (i > 1) { // Skip page number on title page
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const pageText = `${i - 1}`;
        const textWidth = pdf.getTextWidth(pageText);
        pdf.text(pageText, (pageWidth - textWidth) / 2, pageHeight - 10);
      }
    }

    // Convert to blob
    const pdfBlob = pdf.output('blob');
    return pdfBlob;
  }

  private async exportEPUB(options: ExportOptions): Promise<Blob> {
    const zip = new JSZip();
    
    // Create standard EPUB structure
    const chapters = this.extractChapters(options.content);
    const bookId = `urn:uuid:${this.generateUUID()}`;
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Add mimetype file (must be first and uncompressed)
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
    
    // Create META-INF directory
    const metaInf = zip.folder('META-INF');
    if (metaInf) {
      metaInf.file('container.xml', this.generateContainerXML());
    }
    
    // Create OEBPS directory for content
    const oebps = zip.folder('OEBPS');
    if (!oebps) throw new Error('Failed to create OEBPS folder');
    
    // Generate content.opf (package document)
    oebps.file('content.opf', this.generateContentOPF(options, chapters, bookId, currentDate));
    
    // Generate toc.ncx (navigation)
    oebps.file('toc.ncx', this.generateTocNCX(options, chapters, bookId));
    
    // Generate stylesheet
    oebps.file('styles.css', this.generateEPUBCSS());
    
    // Generate title page
    oebps.file('title.xhtml', this.generateTitlePage(options));
    
    // Generate copyright page if requested
    if (options.includeCopyright) {
      oebps.file('copyright.xhtml', this.generateCopyrightPage(options));
    }
    
    // Generate table of contents if requested
    if (options.includeTableOfContents) {
      oebps.file('toc.xhtml', this.generateTOCPage(chapters));
    }
    
    // Generate chapter files
    chapters.forEach((chapter, index) => {
      const filename = `chapter${index + 1}.xhtml`;
      oebps.file(filename, this.generateChapterXHTML(chapter, index + 1));
    });
    
    // Generate the EPUB file
    const epubBlob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/epub+zip',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });
    
    return epubBlob;
  }

  private async exportIBook(options: ExportOptions): Promise<Blob> {
    const zip = new JSZip();
    
    // Create EPUB 3.0 structure for iBooks
    const chapters = this.extractChapters(options.content);
    const bookId = `urn:uuid:${this.generateUUID()}`;
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Add mimetype file (must be first and uncompressed)
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
    
    // Create META-INF directory
    const metaInf = zip.folder('META-INF');
    if (metaInf) {
      metaInf.file('container.xml', this.generateContainerXML());
      // Add iBooks-specific display options
      metaInf.file('com.apple.ibooks.display-options.xml', this.generateIBooksDisplayOptions());
    }
    
    // Create OEBPS directory for content
    const oebps = zip.folder('OEBPS');
    if (!oebps) throw new Error('Failed to create OEBPS folder');
    
    // Generate EPUB 3.0 content.opf with iBooks enhancements
    oebps.file('content.opf', this.generateIBookContentOPF(options, chapters, bookId, currentDate));
    
    // Generate EPUB 3.0 navigation document
    oebps.file('nav.xhtml', this.generateEPUB3Navigation(options, chapters));
    
    // Generate toc.ncx for backward compatibility
    oebps.file('toc.ncx', this.generateTocNCX(options, chapters, bookId));
    
    // Generate enhanced stylesheet with iBooks optimizations
    oebps.file('styles.css', this.generateIBookCSS());
    
    // Generate title page
    oebps.file('title.xhtml', this.generateTitlePage(options));
    
    // Generate copyright page if requested
    if (options.includeCopyright) {
      oebps.file('copyright.xhtml', this.generateCopyrightPage(options));
    }
    
    // Generate table of contents if requested
    if (options.includeTableOfContents) {
      oebps.file('toc.xhtml', this.generateTOCPage(chapters));
    }
    
    // Generate chapter files with enhanced XHTML
    chapters.forEach((chapter, index) => {
      const filename = `chapter${index + 1}.xhtml`;
      oebps.file(filename, this.generateEnhancedChapterXHTML(chapter, index + 1));
    });
    
    // Generate the iBook EPUB file
    const ibookBlob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/epub+zip',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });
    
    return ibookBlob;
  }

  private async exportMobi(options: ExportOptions): Promise<Blob> {
    // Generate Kindle-compatible Mobi structure
    // Note: This creates a simplified Mobi-like format that Kindle can read
    const chapters = this.extractChapters(options.content);
    const wordCount = this.calculateWordCount(options.content);
    
    // Create HTML structure optimized for Kindle
    const kindleHTML = this.generateKindleHTML(options, chapters, wordCount);
    
    // For now, we'll create an HTML file that Kindle can convert
    // In production, you might want to use a proper Mobi generator library
    const mobiBlob = new Blob([kindleHTML], { type: "application/x-mobipocket-ebook" });
    
    return mobiBlob;
  }

  private generateKindleHTML(options: ExportOptions, chapters: Array<{title: string, content: string}>, wordCount: number): string {
    const toc = this.generateKindleTOC(chapters);
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
  <style>
    ${this.generateKindleCSS()}
  </style>
</head>
<body>
  <!-- Kindle-specific metadata -->
  <div style="display: none;">
    <meta name="Author" content="${options.author}">
    <meta name="Title" content="${options.title}">
    <meta name="Language" content="en-US">
    <meta name="Creator" content="Bestseller Author Pro">
    <meta name="Publisher" content="${options.author}">
    <meta name="Subject" content="Ebook">
    <meta name="Description" content="Generated with Bestseller Author Pro">
    <meta name="Rights" content="© ${new Date().getFullYear()} ${options.author}. All rights reserved.">
  </div>

  <!-- Title Page -->
  <div class="kindle-page-break">
    <div class="title-page">
      <h1 class="book-title">${options.title}</h1>
      ${options.author ? `<p class="book-author">By ${options.author}</p>` : ''}
      <div class="book-info">
        <p>${wordCount.toLocaleString()} words • ${chapters.length} chapters</p>
        <p>Generated with Bestseller Author Pro</p>
      </div>
    </div>
  </div>

  ${options.includeCopyright ? this.generateKindleCopyright(options) : ''}
  
  ${options.includeTableOfContents ? toc : ''}
  
  <!-- Chapters -->
  ${chapters.map((chapter, index) => this.generateKindleChapter(chapter, index + 1)).join('')}

  <!-- End Matter -->
  <div class="kindle-page-break">
    <div class="end-matter">
      <h2>About This Book</h2>
      <p>This ebook was generated using <strong>Bestseller Author Pro</strong>, an AI-powered content creation platform.</p>
      <p><strong>Book Statistics:</strong></p>
      <ul>
        <li>Total Words: ${wordCount.toLocaleString()}</li>
        <li>Chapters: ${chapters.length}</li>
        <li>Generated: ${new Date().toLocaleDateString()}</li>
      </ul>
    </div>
  </div>
</body>
</html>`;
  }

  private generateKindleCSS(): string {
    return `
    /* Kindle-optimized CSS */
    body {
      font-family: serif;
      line-height: 1.4;
      margin: 0;
      padding: 1em;
      text-align: justify;
    }

    .kindle-page-break {
      page-break-before: always;
      margin-bottom: 2em;
    }

    .title-page {
      text-align: center;
      margin: 3em 0;
    }

    .book-title {
      font-size: 2.5em;
      font-weight: bold;
      margin: 2em 0 1em 0;
      line-height: 1.2;
    }

    .book-author {
      font-size: 1.3em;
      font-style: italic;
      margin: 1em 0;
      color: #666;
    }

    .book-info {
      margin-top: 2em;
      font-size: 0.9em;
      color: #666;
    }

    h1 {
      font-size: 2em;
      font-weight: bold;
      margin: 2em 0 1em 0;
      text-align: center;
    }

    h2 {
      font-size: 1.5em;
      font-weight: bold;
      margin: 1.5em 0 1em 0;
      page-break-before: always;
    }

    h3 {
      font-size: 1.2em;
      font-weight: bold;
      margin: 1.2em 0 0.8em 0;
    }

    p {
      margin: 0 0 1em 0;
      text-indent: 1.5em;
    }

    p:first-child,
    .no-indent {
      text-indent: 0;
    }

    .chapter-header {
      text-align: center;
      margin: 2em 0;
    }

    .chapter-title {
      font-size: 1.8em;
      font-weight: bold;
      margin: 1em 0;
    }

    .chapter-meta {
      font-size: 0.9em;
      color: #666;
      font-style: italic;
    }

    .toc {
      margin: 2em 0;
    }

    .toc h2 {
      text-align: center;
      page-break-before: auto;
    }

    .toc ul {
      list-style: none;
      padding: 0;
    }

    .toc li {
      margin: 0.5em 0;
      padding-left: 1em;
    }

    .toc a {
      text-decoration: none;
      color: #000;
    }

    .copyright {
      text-align: center;
      font-size: 0.9em;
      margin: 2em 0;
      color: #666;
    }

    .end-matter {
      margin: 2em 0;
    }

    .end-matter h2 {
      page-break-before: auto;
    }

    .end-matter ul {
      margin: 1em 0;
      padding-left: 2em;
    }

    .end-matter li {
      margin: 0.5em 0;
    }

    /* Kindle-specific optimizations */
    strong, b {
      font-weight: bold;
    }

    em, i {
      font-style: italic;
    }

    code {
      font-family: monospace;
      background-color: #f5f5f5;
      padding: 0.2em 0.4em;
    }

    blockquote {
      margin: 1em 2em;
      padding: 0.5em 1em;
      border-left: 3px solid #ccc;
      font-style: italic;
    }
    `;
  }

  private generateKindleTOC(chapters: Array<{title: string, content: string}>): string {
    const tocItems = chapters.map((chapter, index) => {
      const chapterWordCount = this.calculateWordCount(chapter.content);
      return `<li><a href="#chapter-${index + 1}">Chapter ${index + 1}: ${this.escapeHTML(chapter.title)} <span class="word-count">(${chapterWordCount} words)</span></a></li>`;
    }).join('\n        ');

    return `
    <div class="kindle-page-break">
      <div class="toc">
        <h2>Table of Contents</h2>
        <ul>
          ${tocItems}
        </ul>
      </div>
    </div>`;
  }

  private generateKindleCopyright(options: ExportOptions): string {
    return `
    <div class="kindle-page-break">
      <div class="copyright">
        <h2>Copyright</h2>
        <p><strong>© ${new Date().getFullYear()} ${this.escapeHTML(options.author)}. All rights reserved.</strong></p>
        <p>This book is protected by copyright. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the author, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.</p>
      </div>
    </div>`;
  }

  private generateKindleChapter(chapter: {title: string, content: string}, chapterNumber: number): string {
    const chapterWordCount = this.calculateWordCount(chapter.content);
    const readingTime = Math.ceil(chapterWordCount / 200);
    
    return `
    <div class="kindle-page-break" id="chapter-${chapterNumber}">
      <div class="chapter-header">
        <h2 class="chapter-title">Chapter ${chapterNumber}: ${this.escapeHTML(chapter.title)}</h2>
        <p class="chapter-meta">Reading time: ~${readingTime} minute${readingTime !== 1 ? 's' : ''} • ${chapterWordCount} words</p>
      </div>
      <div class="chapter-content">
        ${this.convertMarkdownToKindleHTML(chapter.content)}
      </div>
    </div>`;
  }

  private convertMarkdownToKindleHTML(markdown: string): string {
    return markdown
      .split('\n\n')
      .map((para) => {
        if (!para.trim()) return '';
        
        if (para.startsWith('### ')) {
          const title = para.substring(4);
          return `<h3>${this.escapeHTML(title)}</h3>`;
        }
        
        // Simple markdown processing for Kindle
        let processed = para
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/\*([^*]+)\*/g, '<em>$1</em>')
          .replace(/`([^`]+)`/g, '<code>$1</code>');
        
        return `<p>${this.escapeHTML(processed)}</p>`;
      })
      .filter(line => line !== '')
      .join('\n');
  }

  private async exportFlipbook(options: ExportOptions): Promise<Blob> {
    const zip = new JSZip();
    
    // Create interactive flipbook structure
    const chapters = this.extractChapters(options.content);
    const pages = this.generateFlipbookPages(options, chapters);
    
    // Generate main HTML file
    zip.file('index.html', this.generateFlipbookHTML(options, pages));
    
    // Generate CSS for flipbook
    zip.file('styles.css', this.generateFlipbookCSS());
    
    // Generate JavaScript for flipbook functionality
    zip.file('flipbook.js', this.generateFlipbookJavaScript());
    
    // Generate individual page files
    pages.forEach((page, index) => {
      zip.file(`pages/page-${index + 1}.html`, page.content);
    });
    
    // Add assets folder for any additional resources
    const assets = zip.folder('assets');
    if (assets) {
      // Add a simple book icon or placeholder
      assets.file('book-icon.svg', this.generateBookIcon());
    }
    
    // Generate the flipbook ZIP file
    const flipbookBlob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/zip',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });
    
    return flipbookBlob;
  }

  // Helper methods for enhanced Markdown
  private generateEnhancedMarkdownTOC(chapters: Array<{title: string, content: string}>, totalWordCount: number): string {
    const readingTime = Math.ceil(totalWordCount / 200);
    
    let toc = `## Table of Contents

*Total reading time: ~${readingTime} minutes | ${totalWordCount.toLocaleString()} words*

`;
    
    chapters.forEach((chapter, index) => {
      const chapterWordCount = this.calculateWordCount(chapter.content);
      const chapterReadingTime = Math.ceil(chapterWordCount / 200);
      const anchor = this.createMarkdownAnchor(`Chapter ${index + 1}: ${chapter.title}`);
      
      toc += `${index + 1}. [${chapter.title}](#${anchor}) *(~${chapterReadingTime} min, ${chapterWordCount} words)*\n`;
    });
    
    toc += '\n---\n\n';
    return toc;
  }

  private enhanceMarkdownFormatting(content: string): string {
    return content
      .split('\n\n')
      .map(paragraph => {
        if (!paragraph.trim()) return '';
        
        if (paragraph.startsWith('###')) {
          return paragraph;
        }
        
        return paragraph.trim();
      })
      .filter(p => p)
      .join('\n\n');
  }

  private createMarkdownAnchor(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private calculateWordCount(text: string): number {
    return text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length;
  }

  // Helper methods for enhanced HTML
  private generateEnhancedCSS(): string {
    return `<style>
    :root {
      --primary-color: #2c3e50;
      --secondary-color: #34495e;
      --accent-color: #3498db;
      --text-color: #2c3e50;
      --text-light: #7f8c8d;
      --bg-color: #ffffff;
      --bg-secondary: #f8f9fa;
      --border-color: #e9ecef;
      --shadow: 0 2px 10px rgba(0,0,0,0.1);
      --nav-height: 80px;
      --font-size-base: 18px;
      --line-height: 1.7;
    }

    .theme-dark {
      --primary-color: #ecf0f1;
      --secondary-color: #bdc3c7;
      --accent-color: #3498db;
      --text-color: #ecf0f1;
      --text-light: #95a5a6;
      --bg-color: #2c3e50;
      --bg-secondary: #34495e;
      --border-color: #4a5f7a;
      --shadow: 0 2px 10px rgba(0,0,0,0.3);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
      font-size: var(--font-size-base);
    }

    body {
      font-family: 'Crimson Text', Georgia, serif;
      line-height: var(--line-height);
      color: var(--text-color);
      background-color: var(--bg-color);
      transition: all 0.3s ease;
      padding-top: var(--nav-height);
    }

    .book-nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: var(--bg-color);
      border-bottom: 1px solid var(--border-color);
      box-shadow: var(--shadow);
      z-index: 1000;
      transition: all 0.3s ease;
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
    }

    .nav-brand h1 {
      font-family: 'Inter', sans-serif;
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--primary-color);
      margin: 0;
    }

    .nav-author {
      font-size: 0.9rem;
      color: var(--text-light);
      font-style: italic;
    }

    .nav-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .chapter-selector {
      font-family: 'Inter', sans-serif;
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background: var(--bg-color);
      color: var(--text-color);
      font-size: 0.9rem;
      min-width: 200px;
    }

    .control-btn {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 1rem;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .control-btn:hover {
      background: var(--accent-color);
      color: white;
      transform: translateY(-1px);
    }

    .reading-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--border-color);
    }

    .progress-bar {
      height: 100%;
      background: var(--accent-color);
      width: 0%;
      transition: width 0.3s ease;
    }

    .book-content {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    .title-page {
      text-align: center;
      padding: 4rem 0;
      margin-bottom: 4rem;
      border-bottom: 1px solid var(--border-color);
    }

    .book-title {
      font-family: 'Inter', sans-serif;
      font-size: 3rem;
      font-weight: 600;
      color: var(--primary-color);
      margin-bottom: 1rem;
      line-height: 1.2;
    }

    .book-author {
      font-size: 1.5rem;
      color: var(--text-light);
      font-style: italic;
      margin-bottom: 2rem;
    }

    .book-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-top: 2rem;
      padding: 2rem;
      background: var(--bg-secondary);
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }

    .meta-item {
      text-align: center;
      font-family: 'Inter', sans-serif;
      font-size: 0.9rem;
      color: var(--text-light);
    }

    .copyright-section {
      background: var(--bg-secondary);
      padding: 2rem;
      margin: 2rem 0;
      border-radius: 12px;
      border: 1px solid var(--border-color);
      text-align: center;
    }

    .copyright-section h2 {
      font-family: 'Inter', sans-serif;
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: var(--primary-color);
    }

    .toc-section {
      margin: 3rem 0;
      padding: 2rem;
      background: var(--bg-secondary);
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }

    .toc-section h2 {
      font-family: 'Inter', sans-serif;
      font-size: 2rem;
      margin-bottom: 1.5rem;
      color: var(--primary-color);
      text-align: center;
    }

    .toc-list {
      list-style: none;
      padding: 0;
    }

    .toc-item {
      margin: 1rem 0;
      padding: 1rem;
      background: var(--bg-color);
      border-radius: 8px;
      border: 1px solid var(--border-color);
      transition: all 0.2s ease;
    }

    .toc-item:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow);
    }

    .toc-link {
      text-decoration: none;
      color: var(--text-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .toc-title {
      font-weight: 600;
      font-size: 1.1rem;
    }

    .toc-meta {
      font-size: 0.9rem;
      color: var(--text-light);
      font-family: 'Inter', sans-serif;
    }

    .chapter {
      margin: 4rem 0;
      scroll-margin-top: calc(var(--nav-height) + 2rem);
    }

    .chapter-header {
      text-align: center;
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid var(--border-color);
    }

    .chapter-title {
      font-family: 'Inter', sans-serif;
      font-size: 2.5rem;
      font-weight: 600;
      color: var(--primary-color);
      margin-bottom: 1rem;
      line-height: 1.2;
    }

    .chapter-meta {
      font-family: 'Inter', sans-serif;
      font-size: 0.9rem;
      color: var(--text-light);
      display: flex;
      justify-content: center;
      gap: 2rem;
      flex-wrap: wrap;
    }

    .chapter-content {
      font-size: 1.1rem;
      line-height: var(--line-height);
    }

    .chapter-content p {
      margin-bottom: 1.5rem;
      text-align: justify;
      text-indent: 2rem;
    }

    .chapter-content p:first-child {
      text-indent: 0;
      font-size: 1.2rem;
      font-weight: 500;
    }

    .book-footer {
      margin-top: 4rem;
      padding: 3rem 0;
      border-top: 1px solid var(--border-color);
      text-align: center;
      background: var(--bg-secondary);
      border-radius: 12px;
    }

    .footer-content {
      max-width: 600px;
      margin: 0 auto;
    }

    .book-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-top: 2rem;
      font-family: 'Inter', sans-serif;
      font-size: 0.9rem;
      color: var(--text-light);
    }

    .font-small { --font-size-base: 16px; }
    .font-medium { --font-size-base: 18px; }
    .font-large { --font-size-base: 20px; }
    .font-xl { --font-size-base: 22px; }

    @media (max-width: 768px) {
      .nav-container {
        padding: 1rem;
        flex-direction: column;
        gap: 1rem;
      }

      .nav-controls {
        width: 100%;
        justify-content: center;
      }

      .chapter-selector {
        min-width: 150px;
      }

      .book-content {
        padding: 1rem;
      }

      .book-title {
        font-size: 2rem;
      }

      .chapter-title {
        font-size: 1.8rem;
      }

      .book-meta,
      .book-stats {
        grid-template-columns: 1fr;
      }

      .toc-link {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .chapter-meta {
        flex-direction: column;
        gap: 0.5rem;
      }
    }

    @media print {
      body {
        padding-top: 0;
        font-size: 12pt;
        line-height: 1.4;
      }

      .book-nav {
        display: none;
      }

      .title-page,
      .copyright-section,
      .toc-section,
      .chapter {
        page-break-after: always;
      }

      .chapter-title {
        page-break-before: always;
      }

      .book-footer {
        page-break-before: always;
      }

      .control-btn,
      .chapter-selector {
        display: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }

      html {
        scroll-behavior: auto;
      }
    }

    .control-btn:focus,
    .chapter-selector:focus,
    .toc-link:focus {
      outline: 2px solid var(--accent-color);
      outline-offset: 2px;
    }
    </style>`;
  }

  private generateEnhancedHTMLTOC(chapters: Array<{title: string, content: string}>): string {
    if (chapters.length === 0) return '';
    
    const tocItems = chapters.map((chapter, index) => {
      const chapterWordCount = this.calculateWordCount(chapter.content);
      const readingTime = Math.ceil(chapterWordCount / 200);
      const chapterId = `chapter-${index + 1}`;
      
      return `
        <li class="toc-item">
          <a href="#${chapterId}" class="toc-link">
            <span class="toc-title">Chapter ${index + 1}: ${this.escapeHTML(chapter.title)}</span>
            <span class="toc-meta">${readingTime} min • ${chapterWordCount} words</span>
          </a>
        </li>`;
    }).join('');

    return `
      <section class="toc-section" id="table-of-contents">
        <h2>Table of Contents</h2>
        <ul class="toc-list">
          ${tocItems}
        </ul>
      </section>`;
  }

  private generateCopyrightSection(options: ExportOptions): string {
    return `
      <section class="copyright-section" id="copyright">
        <h2>Copyright</h2>
        <p><strong>© ${new Date().getFullYear()} ${this.escapeHTML(options.author)}. All rights reserved.</strong></p>
        <p>This book is protected by copyright. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the author, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.</p>
      </section>`;
  }

  private generateEnhancedChapterHTML(chapter: {title: string, content: string}, chapterNumber: number): string {
    const chapterWordCount = this.calculateWordCount(chapter.content);
    const readingTime = Math.ceil(chapterWordCount / 200);
    const chapterId = `chapter-${chapterNumber}`;
    
    return `
      <section class="chapter" id="${chapterId}">
        <header class="chapter-header">
          <h2 class="chapter-title">Chapter ${chapterNumber}: ${this.escapeHTML(chapter.title)}</h2>
          <div class="chapter-meta">
            <span>Reading time: ~${readingTime} minute${readingTime !== 1 ? 's' : ''}</span>
            <span>${chapterWordCount} words</span>
            <span>Chapter ${chapterNumber}</span>
          </div>
        </header>
        <div class="chapter-content">
          ${this.convertMarkdownToEnhancedHTML(chapter.content)}
        </div>
      </section>`;
  }

  private convertMarkdownToEnhancedHTML(markdown: string): string {
    return markdown
      .split('\n\n')
      .map((para) => {
        if (!para.trim()) return '';
        
        if (para.startsWith('### ')) {
          const title = para.substring(4);
          const anchor = this.createMarkdownAnchor(title);
          return `<h3 id="${anchor}">${this.escapeHTML(title)}</h3>`;
        }
        
        let processed = para
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/\*([^*]+)\*/g, '<em>$1</em>')
          .replace(/`([^`]+)`/g, '<code>$1</code>')
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        
        return `<p>${this.escapeHTML(processed)}</p>`;
      })
      .filter(line => line !== '')
      .join('\n');
  }

  private generateEnhancedJavaScript(): string {
    return `<script>
    class BookReader {
      constructor() {
        this.currentFontSize = 'medium';
        this.currentTheme = 'light';
        this.tocVisible = false;
        this.init();
      }

      init() {
        this.setupEventListeners();
        this.setupProgressTracking();
        this.loadUserPreferences();
      }

      setupEventListeners() {
        const chapterSelector = document.getElementById('chapterSelector');
        if (chapterSelector) {
          chapterSelector.addEventListener('change', (e) => {
            if (e.target.value) {
              this.navigateToChapter(e.target.value);
            }
          });
        }

        const fontSizeToggle = document.getElementById('fontSizeToggle');
        if (fontSizeToggle) {
          fontSizeToggle.addEventListener('click', () => this.toggleFontSize());
        }

        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
          themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        window.addEventListener('scroll', () => {
          this.updateProgressBar();
        });
      }

      setupProgressTracking() {
        this.updateProgressBar();
      }

      navigateToChapter(chapterId) {
        const element = document.getElementById(chapterId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }

      toggleFontSize() {
        const sizes = ['small', 'medium', 'large', 'xl'];
        const currentIndex = sizes.indexOf(this.currentFontSize);
        const nextIndex = (currentIndex + 1) % sizes.length;
        this.currentFontSize = sizes[nextIndex];
        
        sizes.forEach(size => document.body.classList.remove('font-' + size));
        document.body.classList.add('font-' + this.currentFontSize);
        this.saveUserPreferences();
      }

      toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.body.className = document.body.className.replace(/theme-\\w+/, 'theme-' + this.currentTheme);
        this.saveUserPreferences();
      }

      updateProgressBar() {
        const progressBar = document.getElementById('progressBar');
        if (!progressBar) return;

        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const progress = (scrollTop / documentHeight) * 100;
        
        progressBar.style.width = Math.min(Math.max(progress, 0), 100) + '%';
      }

      saveUserPreferences() {
        const preferences = {
          fontSize: this.currentFontSize,
          theme: this.currentTheme
        };
        localStorage.setItem('bookReaderPreferences', JSON.stringify(preferences));
      }

      loadUserPreferences() {
        try {
          const saved = localStorage.getItem('bookReaderPreferences');
          if (saved) {
            const preferences = JSON.parse(saved);
            if (preferences.fontSize) {
              this.currentFontSize = preferences.fontSize;
              document.body.classList.add('font-' + this.currentFontSize);
            }
            if (preferences.theme) {
              this.currentTheme = preferences.theme;
              document.body.className = document.body.className.replace(/theme-\\w+/, 'theme-' + this.currentTheme);
            }
          }
        } catch (e) {
          console.warn('Could not load user preferences:', e);
        }
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => new BookReader());
    } else {
      new BookReader();
    }
    </script>`;
  }

  private escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // iBook-specific helper methods
  private generateIBooksDisplayOptions(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<display_options>
  <platform name="*">
    <option name="specified-fonts">true</option>
    <option name="interactive">false</option>
    <option name="fixed-layout">false</option>
    <option name="open-to-spread">false</option>
    <option name="color-img">automatic</option>
    <option name="double-tap-to-zoom">true</option>
    <option name="pinch-to-zoom">true</option>
    <option name="orientation-lock">none</option>
  </platform>
</display_options>`;
  }

  private generateIBookContentOPF(options: ExportOptions, chapters: Array<{title: string, content: string}>, bookId: string, currentDate: string): string {
    const chapterManifest = chapters.map((_, index) => 
      `    <item id="chapter${index + 1}" href="chapter${index + 1}.xhtml" media-type="application/xhtml+xml"/>`
    ).join('\n');
    
    const chapterSpine = chapters.map((_, index) => 
      `    <itemref idref="chapter${index + 1}"/>`
    ).join('\n');
    
    const tocItems = options.includeTableOfContents ? 
      '    <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml"/>' : '';
    
    const copyrightItems = options.includeCopyright ? 
      '    <item id="copyright" href="copyright.xhtml" media-type="application/xhtml+xml"/>' : '';
    
    const tocSpine = options.includeTableOfContents ? 
      '    <itemref idref="toc"/>' : '';
    
    const copyrightSpine = options.includeCopyright ? 
      '    <itemref idref="copyright"/>' : '';

    return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0" prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0/">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${this.escapeXML(options.title)}</dc:title>
    <dc:creator opf:role="aut">${this.escapeXML(options.author)}</dc:creator>
    <dc:identifier id="bookid">${bookId}</dc:identifier>
    <dc:language>en</dc:language>
    <dc:date>${currentDate}</dc:date>
    <dc:rights>© ${new Date().getFullYear()} ${this.escapeXML(options.author)}. All rights reserved.</dc:rights>
    <meta property="dcterms:modified">${new Date().toISOString()}</meta>
    <meta name="cover" content="title"/>
    <meta property="ibooks:specified-fonts">true</meta>
    <meta property="ibooks:binding">true</meta>
    <meta property="ibooks:interactive">false</meta>
    <meta property="rendition:layout">reflowable</meta>
    <meta property="rendition:orientation">auto</meta>
    <meta property="rendition:spread">auto</meta>
  </metadata>
  
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="styles.css" media-type="text/css"/>
    <item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>
${copyrightItems}
${tocItems}
${chapterManifest}
  </manifest>
  
  <spine toc="ncx">
    <itemref idref="title"/>
${copyrightSpine}
${tocSpine}
${chapterSpine}
  </spine>
</package>`;
  }

  private generateEPUB3Navigation(options: ExportOptions, chapters: Array<{title: string, content: string}>): string {
    const navItems = chapters.map((chapter, index) => 
      `        <li><a href="chapter${index + 1}.xhtml">Chapter ${index + 1}: ${this.escapeXML(chapter.title)}</a></li>`
    ).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Navigation</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      <li><a href="title.xhtml">Title Page</a></li>
${options.includeCopyright ? '      <li><a href="copyright.xhtml">Copyright</a></li>' : ''}
${navItems}
    </ol>
  </nav>
</body>
</html>`;
  }

  private generateIBookCSS(): string {
    return `
/* iBooks Enhanced CSS */
@namespace epub "http://www.idpf.org/2007/ops";

body {
  font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif;
  line-height: 1.6;
  margin: 1em;
  color: #333;
  text-align: justify;
  hyphens: auto;
  -webkit-hyphens: auto;
  -moz-hyphens: auto;
  -ms-hyphens: auto;
}

/* iBooks-specific font stacks */
h1, h2, h3, h4, h5, h6 {
  font-family: "Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-weight: 600;
  line-height: 1.2;
  margin: 1.5em 0 1em 0;
  color: #2c3e50;
  text-align: left;
}

h1 {
  font-size: 2.2em;
  text-align: center;
  margin: 2em 0 1.5em 0;
  page-break-before: always;
}

h2 {
  font-size: 1.8em;
  margin: 2em 0 1em 0;
  page-break-before: always;
  border-bottom: 2px solid #3498db;
  padding-bottom: 0.5em;
}

h3 {
  font-size: 1.4em;
  margin: 1.5em 0 0.8em 0;
}

p {
  margin: 0 0 1.2em 0;
  text-indent: 1.5em;
  orphans: 2;
  widows: 2;
}

p:first-child,
p.no-indent {
  text-indent: 0;
}

/* Enhanced typography for iBooks */
em {
  font-style: italic;
}

strong {
  font-weight: 700;
}

code {
  font-family: "SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace;
  background-color: #f8f9fa;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
}

blockquote {
  margin: 1.5em 2em;
  padding: 1em;
  border-left: 4px solid #3498db;
  background-color: #f8f9fa;
  font-style: italic;
}

/* Title page styling */
.title-page {
  text-align: center;
  page-break-after: always;
  margin: 3em 0;
}

.title-page h1 {
  font-size: 3em;
  margin: 2em 0 0.5em 0;
  page-break-before: auto;
  color: #2c3e50;
  font-weight: 700;
}

.author {
  font-size: 1.4em;
  font-style: italic;
  margin: 1.5em 0;
  color: #7f8c8d;
}

/* Copyright page */
.copyright {
  font-size: 0.9em;
  text-align: center;
  margin: 2em 0;
  page-break-after: always;
  color: #7f8c8d;
}

/* Table of contents */
.toc {
  page-break-after: always;
}

.toc h2 {
  border-bottom: none;
  page-break-before: auto;
  text-align: center;
}

.toc ul, .toc ol {
  list-style: none;
  padding: 0;
}

.toc li {
  margin: 0.8em 0;
  padding-left: 1em;
}

.toc a {
  text-decoration: none;
  color: #2c3e50;
  border-bottom: 1px dotted #bdc3c7;
  padding-bottom: 2px;
}

.toc a:hover {
  color: #3498db;
  border-bottom-color: #3498db;
}

/* Chapter styling */
.chapter-title {
  page-break-before: always;
}

/* iBooks-specific enhancements */
@media amzn-kf8 {
  body {
    font-family: serif;
  }
}

@media amzn-mobi {
  body {
    font-family: serif;
  }
}

/* Print optimizations */
@media print {
  .title-page, .copyright, .toc, .chapter-title {
    page-break-after: always;
  }
  
  body {
    font-size: 12pt;
    line-height: 1.4;
  }
}

/* Dark mode support for iBooks */
@media (prefers-color-scheme: dark) {
  body {
    background-color: #1a1a1a;
    color: #e0e0e0;
  }
  
  h1, h2, h3, h4, h5, h6 {
    color: #ffffff;
  }
  
  .toc a {
    color: #e0e0e0;
    border-bottom-color: #666;
  }
  
  blockquote {
    background-color: #2a2a2a;
    border-left-color: #3498db;
  }
  
  code {
    background-color: #2a2a2a;
    color: #e0e0e0;
  }
}
`;
  }

  private generateEnhancedChapterXHTML(chapter: {title: string, content: string}, chapterNumber: number): string {
    const htmlContent = this.convertMarkdownToEnhancedHTML(chapter.content);
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Chapter ${chapterNumber}: ${this.escapeXML(chapter.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
  <meta charset="UTF-8"/>
</head>
<body>
  <section epub:type="chapter">
    <h2 class="chapter-title">Chapter ${chapterNumber}: ${this.escapeXML(chapter.title)}</h2>
    ${htmlContent}
  </section>
</body>
</html>`;
  }

  // EPUB helper methods
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private generateContainerXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  }

  private generateContentOPF(options: ExportOptions, chapters: Array<{title: string, content: string}>, bookId: string, currentDate: string): string {
    const chapterManifest = chapters.map((_, index) => 
      `    <item id="chapter${index + 1}" href="chapter${index + 1}.xhtml" media-type="application/xhtml+xml"/>`
    ).join('\n');
    
    const chapterSpine = chapters.map((_, index) => 
      `    <itemref idref="chapter${index + 1}"/>`
    ).join('\n');
    
    const tocItems = options.includeTableOfContents ? 
      '    <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml"/>' : '';
    
    const copyrightItems = options.includeCopyright ? 
      '    <item id="copyright" href="copyright.xhtml" media-type="application/xhtml+xml"/>' : '';
    
    const tocSpine = options.includeTableOfContents ? 
      '    <itemref idref="toc"/>' : '';
    
    const copyrightSpine = options.includeCopyright ? 
      '    <itemref idref="copyright"/>' : '';

    return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${this.escapeXML(options.title)}</dc:title>
    <dc:creator opf:role="aut">${this.escapeXML(options.author)}</dc:creator>
    <dc:identifier id="bookid">${bookId}</dc:identifier>
    <dc:language>en</dc:language>
    <dc:date>${currentDate}</dc:date>
    <dc:rights>© ${new Date().getFullYear()} ${this.escapeXML(options.author)}. All rights reserved.</dc:rights>
    <meta name="cover" content="title"/>
  </metadata>
  
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="styles.css" media-type="text/css"/>
    <item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>
${copyrightItems}
${tocItems}
${chapterManifest}
  </manifest>
  
  <spine toc="ncx">
    <itemref idref="title"/>
${copyrightSpine}
${tocSpine}
${chapterSpine}
  </spine>
</package>`;
  }

  private generateTocNCX(options: ExportOptions, chapters: Array<{title: string, content: string}>, bookId: string): string {
    const navPoints = chapters.map((chapter, index) => `
    <navPoint id="chapter${index + 1}" playOrder="${index + 2}">
      <navLabel>
        <text>Chapter ${index + 1}: ${this.escapeXML(chapter.title)}</text>
      </navLabel>
      <content src="chapter${index + 1}.xhtml"/>
    </navPoint>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${bookId}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  
  <docTitle>
    <text>${this.escapeXML(options.title)}</text>
  </docTitle>
  
  <navMap>
    <navPoint id="title" playOrder="1">
      <navLabel>
        <text>Title Page</text>
      </navLabel>
      <content src="title.xhtml"/>
    </navPoint>${navPoints}
  </navMap>
</ncx>`;
  }

  private generateEPUBCSS(): string {
    return `
body {
  font-family: Georgia, serif;
  line-height: 1.6;
  margin: 1em;
  color: #333;
}

h1 {
  font-size: 2em;
  text-align: center;
  margin: 2em 0 1em 0;
  page-break-before: always;
}

h2 {
  font-size: 1.5em;
  margin: 1.5em 0 1em 0;
  page-break-before: always;
}

h3 {
  font-size: 1.2em;
  margin: 1.2em 0 0.8em 0;
}

p {
  margin: 0 0 1em 0;
  text-indent: 1.5em;
  text-align: justify;
}

.title-page {
  text-align: center;
  page-break-after: always;
}

.title-page h1 {
  font-size: 2.5em;
  margin: 2em 0 0.5em 0;
  page-break-before: auto;
}

.author {
  font-size: 1.2em;
  font-style: italic;
  margin: 1em 0;
}

.copyright {
  font-size: 0.9em;
  text-align: center;
  margin: 2em 0;
  page-break-after: always;
}

.toc {
  page-break-after: always;
}

.toc ul {
  list-style: none;
  padding: 0;
}

.toc li {
  margin: 0.5em 0;
  padding-left: 1em;
}

.toc a {
  text-decoration: none;
  color: #333;
}

.chapter-title {
  page-break-before: always;
}

@media print {
  .title-page, .copyright, .toc, .chapter-title {
    page-break-after: always;
  }
}
`;
  }

  private generateTitlePage(options: ExportOptions): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${this.escapeXML(options.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <div class="title-page">
    <h1>${this.escapeXML(options.title)}</h1>
    ${options.author ? `<p class="author">By ${this.escapeXML(options.author)}</p>` : ''}
  </div>
</body>
</html>`;
  }

  private generateCopyrightPage(options: ExportOptions): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Copyright</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <div class="copyright">
    <p>© ${new Date().getFullYear()} ${this.escapeXML(options.author)}. All rights reserved.</p>
    <p>This book is protected by copyright. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the author, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.</p>
  </div>
</body>
</html>`;
  }

  private generateTOCPage(chapters: Array<{title: string, content: string}>): string {
    const tocItems = chapters.map((chapter, index) => 
      `<li><a href="chapter${index + 1}.xhtml">Chapter ${index + 1}: ${this.escapeXML(chapter.title)}</a></li>`
    ).join('\n      ');

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <div class="toc">
    <h2>Table of Contents</h2>
    <ul>
      ${tocItems}
    </ul>
  </div>
</body>
</html>`;
  }

  private generateChapterXHTML(chapter: {title: string, content: string}, chapterNumber: number): string {
    const htmlContent = this.convertMarkdownToEnhancedHTML(chapter.content);
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Chapter ${chapterNumber}: ${this.escapeXML(chapter.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h2 class="chapter-title">Chapter ${chapterNumber}: ${this.escapeXML(chapter.title)}</h2>
  ${htmlContent}
</body>
</html>`;
  }

  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Flipbook helper methods
  private generateFlipbookPages(options: ExportOptions, chapters: Array<{title: string, content: string}>): Array<{title: string, content: string}> {
    const pages: Array<{title: string, content: string}> = [];
    
    // Title page
    pages.push({
      title: 'Title Page',
      content: this.generateFlipbookTitlePage(options)
    });
    
    // Copyright page if requested
    if (options.includeCopyright) {
      pages.push({
        title: 'Copyright',
        content: this.generateFlipbookCopyrightPage(options)
      });
    }
    
    // Table of contents if requested
    if (options.includeTableOfContents) {
      pages.push({
        title: 'Table of Contents',
        content: this.generateFlipbookTOCPage(chapters)
      });
    }
    
    // Chapter pages - split long chapters into multiple pages
    chapters.forEach((chapter, chapterIndex) => {
      const chapterPages = this.splitChapterIntoPages(chapter, chapterIndex + 1);
      pages.push(...chapterPages);
    });
    
    return pages;
  }

  private generateFlipbookHTML(options: ExportOptions, pages: Array<{title: string, content: string}>): string {
    const pagesList = pages.map((page, index) => 
      `<div class="page" id="page-${index + 1}" data-page="${index + 1}">
        ${page.content}
      </div>`
    ).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHTML(options.title)} - Interactive Flipbook</title>
  <link rel="stylesheet" href="styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
</head>
<body>
  <div class="flipbook-container">
    <!-- Navigation Header -->
    <header class="flipbook-header">
      <div class="header-content">
        <h1 class="book-title">${this.escapeHTML(options.title)}</h1>
        <div class="header-controls">
          <button id="fullscreenBtn" class="control-btn" title="Toggle Fullscreen">
            <span class="icon">⛶</span>
          </button>
          <button id="zoomInBtn" class="control-btn" title="Zoom In">
            <span class="icon">🔍+</span>
          </button>
          <button id="zoomOutBtn" class="control-btn" title="Zoom Out">
            <span class="icon">🔍-</span>
          </button>
          <button id="themeToggle" class="control-btn" title="Toggle Theme">
            <span class="icon">🌙</span>
          </button>
        </div>
      </div>
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" id="progressFill"></div>
        </div>
        <span class="page-counter" id="pageCounter">1 / ${pages.length}</span>
      </div>
    </header>

    <!-- Flipbook Content -->
    <main class="flipbook-main">
      <div class="flipbook" id="flipbook">
        <div class="book-spine"></div>
        <div class="pages-container" id="pagesContainer">
          ${pagesList}
        </div>
      </div>
    </main>

    <!-- Navigation Controls -->
    <nav class="flipbook-nav">
      <button id="prevBtn" class="nav-btn prev-btn" title="Previous Page">
        <span class="icon">‹</span>
        <span class="label">Previous</span>
      </button>
      
      <div class="page-selector">
        <input type="range" id="pageSlider" min="1" max="${pages.length}" value="1" class="page-slider">
        <div class="page-thumbnails" id="pageThumbnails">
          ${pages.map((page, index) => 
            `<div class="thumbnail" data-page="${index + 1}" title="${this.escapeHTML(page.title)}">
              <div class="thumbnail-content">${index + 1}</div>
            </div>`
          ).join('')}
        </div>
      </div>
      
      <button id="nextBtn" class="nav-btn next-btn" title="Next Page">
        <span class="label">Next</span>
        <span class="icon">›</span>
      </button>
    </nav>

    <!-- Loading Overlay -->
    <div class="loading-overlay" id="loadingOverlay">
      <div class="loading-spinner"></div>
      <p>Loading flipbook...</p>
    </div>
  </div>

  <script src="flipbook.js"></script>
</body>
</html>`;
  }

  private generateFlipbookCSS(): string {
    return `
/* Flipbook CSS */
:root {
  --primary-color: #2c3e50;
  --secondary-color: #34495e;
  --accent-color: #3498db;
  --text-color: #2c3e50;
  --text-light: #7f8c8d;
  --bg-color: #f8f9fa;
  --bg-secondary: #ffffff;
  --border-color: #e9ecef;
  --shadow: 0 4px 20px rgba(0,0,0,0.1);
  --shadow-heavy: 0 8px 40px rgba(0,0,0,0.15);
  --page-bg: #ffffff;
  --page-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.theme-dark {
  --primary-color: #ecf0f1;
  --secondary-color: #bdc3c7;
  --accent-color: #3498db;
  --text-color: #ecf0f1;
  --text-light: #95a5a6;
  --bg-color: #2c3e50;
  --bg-secondary: #34495e;
  --border-color: #4a5f7a;
  --shadow: 0 4px 20px rgba(0,0,0,0.3);
  --shadow-heavy: 0 8px 40px rgba(0,0,0,0.4);
  --page-bg: #34495e;
  --page-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Crimson Text', Georgia, serif;
  background: var(--bg-color);
  color: var(--text-color);
  overflow: hidden;
  height: 100vh;
  transition: all 0.3s ease;
}

.flipbook-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
}

/* Header */
.flipbook-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow);
  z-index: 100;
  padding: 1rem 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.book-title {
  font-family: 'Inter', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary-color);
}

.header-controls {
  display: flex;
  gap: 0.5rem;
}

.control-btn {
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover {
  background: var(--accent-color);
  color: white;
  transform: translateY(-1px);
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: var(--border-color);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-color);
  width: 0%;
  transition: width 0.3s ease;
}

.page-counter {
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: var(--text-light);
  min-width: 80px;
  text-align: right;
}

/* Main Flipbook Area */
.flipbook-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  perspective: 1000px;
}

.flipbook {
  position: relative;
  width: 90%;
  max-width: 1200px;
  height: 80vh;
  max-height: 800px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-spine {
  position: absolute;
  left: 50%;
  top: 5%;
  bottom: 5%;
  width: 4px;
  background: linear-gradient(to bottom, #8b4513, #654321);
  transform: translateX(-50%);
  z-index: 10;
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(0,0,0,0.3);
}

.pages-container {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

.page {
  position: absolute;
  width: 50%;
  height: 100%;
  background: var(--page-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--page-shadow);
  padding: 3rem;
  overflow-y: auto;
  transform-origin: left center;
  transition: transform 0.6s ease-in-out;
  backface-visibility: hidden;
  font-size: 1.1rem;
  line-height: 1.7;
}

.page.left {
  right: 50%;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
}

.page.right {
  left: 50%;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-left: none;
}

.page.flipping {
  transform: rotateY(-180deg);
  z-index: 20;
}

.page.flipped {
  transform: rotateY(-180deg);
  z-index: 1;
}

.page.current {
  z-index: 10;
}

/* Page Content Styling */
.page h1 {
  font-family: 'Inter', sans-serif;
  font-size: 2.5rem;
  font-weight: 600;
  color: var(--primary-color);
  text-align: center;
  margin-bottom: 2rem;
  line-height: 1.2;
}

.page h2 {
  font-family: 'Inter', sans-serif;
  font-size: 2rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 2rem 0 1.5rem 0;
  line-height: 1.3;
}

.page h3 {
  font-family: 'Inter', sans-serif;
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--secondary-color);
  margin: 1.5rem 0 1rem 0;
}

.page p {
  margin-bottom: 1.5rem;
  text-align: justify;
  text-indent: 2rem;
}

.page p:first-child {
  text-indent: 0;
  font-size: 1.2rem;
  font-weight: 500;
}

.page .author {
  font-size: 1.3rem;
  font-style: italic;
  color: var(--text-light);
  text-align: center;
  margin: 2rem 0;
}

.page .book-meta {
  text-align: center;
  margin: 2rem 0;
  padding: 2rem;
  background: var(--bg-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.page .meta-item {
  display: block;
  margin: 0.5rem 0;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: var(--text-light);
}

/* Navigation */
.flipbook-nav {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.nav-btn {
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 1rem 2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 120px;
}

.nav-btn:hover {
  background: var(--secondary-color);
  transform: translateY(-1px);
}

.nav-btn:disabled {
  background: var(--text-light);
  cursor: not-allowed;
  transform: none;
}

.nav-btn .icon {
  font-size: 1.5rem;
}

.page-selector {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.page-slider {
  width: 100%;
  max-width: 400px;
  height: 6px;
  background: var(--border-color);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.page-slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: var(--accent-color);
  border-radius: 50%;
  cursor: pointer;
}

.page-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: var(--accent-color);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.page-thumbnails {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.5rem;
  max-width: 100%;
}

.thumbnail {
  min-width: 40px;
  height: 40px;
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 500;
}

.thumbnail:hover,
.thumbnail.active {
  border-color: var(--accent-color);
  background: var(--accent-color);
  color: white;
  transform: scale(1.1);
}

/* Loading Overlay */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 1000;
  transition: opacity 0.3s ease;
}

.loading-overlay.hidden {
  opacity: 0;
  pointer-events: none;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255,255,255,0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .flipbook-header {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .book-title {
    font-size: 1.2rem;
  }
  
  .flipbook-main {
    padding: 1rem;
  }
  
  .page {
    padding: 2rem 1.5rem;
    font-size: 1rem;
  }
  
  .page h1 {
    font-size: 2rem;
  }
  
  .page h2 {
    font-size: 1.5rem;
  }
  
  .flipbook-nav {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
  
  .nav-btn {
    min-width: 100px;
    padding: 0.8rem 1.5rem;
  }
  
  .page-thumbnails {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .page {
    width: 100%;
    position: relative;
    height: auto;
    min-height: 70vh;
  }
  
  .page.left,
  .page.right {
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }
  
  .book-spine {
    display: none;
  }
  
  .pages-container {
    display: block;
  }
  
  .page:not(.current) {
    display: none;
  }
}

/* Print Styles */
@media print {
  .flipbook-header,
  .flipbook-nav,
  .loading-overlay {
    display: none;
  }
  
  .flipbook-main {
    padding: 0;
  }
  
  .page {
    position: relative;
    width: 100%;
    height: auto;
    page-break-after: always;
    box-shadow: none;
    border: none;
  }
}
`;
  }

  private generateFlipbookJavaScript(): string {
    return `
class FlipbookReader {
  constructor() {
    this.currentPage = 1;
    this.totalPages = 0;
    this.isAnimating = false;
    this.zoomLevel = 1;
    this.theme = 'light';
    
    this.init();
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
    this.loadUserPreferences();
    this.hideLoading();
    this.updateDisplay();
  }

  setupElements() {
    this.flipbook = document.getElementById('flipbook');
    this.pagesContainer = document.getElementById('pagesContainer');
    this.pages = document.querySelectorAll('.page');
    this.totalPages = this.pages.length;
    
    this.prevBtn = document.getElementById('prevBtn');
    this.nextBtn = document.getElementById('nextBtn');
    this.pageSlider = document.getElementById('pageSlider');
    this.pageCounter = document.getElementById('pageCounter');
    this.progressFill = document.getElementById('progressFill');
    this.thumbnails = document.querySelectorAll('.thumbnail');
    
    this.fullscreenBtn = document.getElementById('fullscreenBtn');
    this.zoomInBtn = document.getElementById('zoomInBtn');
    this.zoomOutBtn = document.getElementById('zoomOutBtn');
    this.themeToggle = document.getElementById('themeToggle');
    
    // Set up initial page positions
    this.setupPagePositions();
  }

  setupPagePositions() {
    this.pages.forEach((page, index) => {
      if (index === 0) {
        page.classList.add('current', 'right');
      } else if (index % 2 === 1) {
        page.classList.add('left');
      } else {
        page.classList.add('right');
      }
    });
  }

  setupEventListeners() {
    // Navigation buttons
    this.prevBtn?.addEventListener('click', () => this.previousPage());
    this.nextBtn?.addEventListener('click', () => this.nextPage());
    
    // Page slider
    this.pageSlider?.addEventListener('input', (e) => {
      this.goToPage(parseInt(e.target.value));
    });
    
    // Thumbnails
    this.thumbnails.forEach(thumbnail => {
      thumbnail.addEventListener('click', (e) => {
        const pageNum = parseInt(e.target.closest('.thumbnail').dataset.page);
        this.goToPage(pageNum);
      });
    });
    
    // Control buttons
    this.fullscreenBtn?.addEventListener('click', () => this.toggleFullscreen());
    this.zoomInBtn?.addEventListener('click', () => this.zoomIn());
    this.zoomOutBtn?.addEventListener('click', () => this.zoomOut());
    this.themeToggle?.addEventListener('click', () => this.toggleTheme());
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        this.previousPage();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        this.nextPage();
      } else if (e.key === 'Home') {
        e.preventDefault();
        this.goToPage(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        this.goToPage(this.totalPages);
      } else if (e.key === 'F11') {
        e.preventDefault();
        this.toggleFullscreen();
      }
    });
    
    // Touch/swipe support
    let startX = 0;
    let startY = 0;
    
    this.flipbook?.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });
    
    this.flipbook?.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      
      // Only trigger if horizontal swipe is dominant
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          this.previousPage();
        } else {
          this.nextPage();
        }
      }
    });
    
    // Mouse wheel for page navigation
    this.flipbook?.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        // Zoom with Ctrl+wheel
        e.preventDefault();
        if (e.deltaY < 0) {
          this.zoomIn();
        } else {
          this.zoomOut();
        }
      } else {
        // Page navigation with wheel
        e.preventDefault();
        if (e.deltaY < 0) {
          this.previousPage();
        } else {
          this.nextPage();
        }
      }
    });
  }

  previousPage() {
    if (this.currentPage > 1 && !this.isAnimating) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages && !this.isAnimating) {
      this.goToPage(this.currentPage + 1);
    }
  }

  goToPage(pageNum) {
    if (pageNum < 1 || pageNum > this.totalPages || pageNum === this.currentPage || this.isAnimating) {
      return;
    }

    this.isAnimating = true;
    const oldPage = this.currentPage;
    this.currentPage = pageNum;

    // Animate page transition
    this.animatePageTransition(oldPage, pageNum).then(() => {
      this.isAnimating = false;
      this.updateDisplay();
    });
  }

  async animatePageTransition(fromPage, toPage) {
    const fromElement = this.pages[fromPage - 1];
    const toElement = this.pages[toPage - 1];

    // Remove current class from all pages
    this.pages.forEach(page => page.classList.remove('current'));

    if (toPage > fromPage) {
      // Moving forward
      fromElement?.classList.add('flipping');
      await this.delay(300);
      fromElement?.classList.add('flipped');
      fromElement?.classList.remove('flipping');
    } else {
      // Moving backward
      const prevFlipped = this.pages[toPage];
      prevFlipped?.classList.add('flipping');
      await this.delay(300);
      prevFlipped?.classList.remove('flipped', 'flipping');
    }

    // Set new current page
    toElement?.classList.add('current');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  updateDisplay() {
    // Update page counter
    if (this.pageCounter) {
      this.pageCounter.textContent = \`\${this.currentPage} / \${this.totalPages}\`;
    }

    // Update progress bar
    if (this.progressFill) {
      const progress = (this.currentPage / this.totalPages) * 100;
      this.progressFill.style.width = \`\${progress}%\`;
    }

    // Update page slider
    if (this.pageSlider) {
      this.pageSlider.value = this.currentPage;
    }

    // Update navigation buttons
    if (this.prevBtn) {
      this.prevBtn.disabled = this.currentPage === 1;
    }
    if (this.nextBtn) {
      this.nextBtn.disabled = this.currentPage === this.totalPages;
    }

    // Update thumbnails
    this.thumbnails.forEach((thumbnail, index) => {
      thumbnail.classList.toggle('active', index + 1 === this.currentPage);
    });

    // Save current page
    this.saveUserPreferences();
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Could not enter fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.warn('Could not exit fullscreen:', err);
      });
    }
  }

  zoomIn() {
    this.zoomLevel = Math.min(this.zoomLevel + 0.1, 2);
    this.applyZoom();
  }

  zoomOut() {
    this.zoomLevel = Math.max(this.zoomLevel - 0.1, 0.5);
    this.applyZoom();
  }

  applyZoom() {
    if (this.flipbook) {
      this.flipbook.style.transform = \`scale(\${this.zoomLevel})\`;
    }
    this.saveUserPreferences();
  }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    document.body.className = \`theme-\${this.theme}\`;
    this.saveUserPreferences();
  }

  hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
      setTimeout(() => {
        loadingOverlay.style.display = 'none';
      }, 300);
    }
  }

  saveUserPreferences() {
    const preferences = {
      currentPage: this.currentPage,
      zoomLevel: this.zoomLevel,
      theme: this.theme
    };
    localStorage.setItem('flipbookPreferences', JSON.stringify(preferences));
  }

  loadUserPreferences() {
    try {
      const saved = localStorage.getItem('flipbookPreferences');
      if (saved) {
        const preferences = JSON.parse(saved);
        
        if (preferences.currentPage && preferences.currentPage <= this.totalPages) {
          this.currentPage = preferences.currentPage;
        }
        
        if (preferences.zoomLevel) {
          this.zoomLevel = preferences.zoomLevel;
          this.applyZoom();
        }
        
        if (preferences.theme) {
          this.theme = preferences.theme;
          document.body.className = \`theme-\${this.theme}\`;
        }
      }
    } catch (e) {
      console.warn('Could not load user preferences:', e);
    }
  }
}

// Initialize flipbook when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new FlipbookReader());
} else {
  new FlipbookReader();
}
`;
  }

  private generateFlipbookTitlePage(options: ExportOptions): string {
    const wordCount = this.calculateWordCount(options.content);
    const chapters = this.extractChapters(options.content);
    
    return `
      <div class="title-page-content">
        <h1>${this.escapeHTML(options.title)}</h1>
        ${options.author ? `<p class="author">By ${this.escapeHTML(options.author)}</p>` : ''}
        <div class="book-meta">
          <div class="meta-item"><strong>${wordCount.toLocaleString()}</strong> words</div>
          <div class="meta-item"><strong>${chapters.length}</strong> chapters</div>
          <div class="meta-item"><strong>~${Math.ceil(wordCount / 200)}</strong> minutes reading</div>
          <div class="meta-item">Generated on <strong>${new Date().toLocaleDateString()}</strong></div>
        </div>
      </div>`;
  }

  private generateFlipbookCopyrightPage(options: ExportOptions): string {
    return `
      <div class="copyright-page">
        <h2>Copyright</h2>
        <p><strong>© ${new Date().getFullYear()} ${this.escapeHTML(options.author)}. All rights reserved.</strong></p>
        <p>This book is protected by copyright. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the author, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.</p>
        <p style="margin-top: 2rem;"><em>This ebook was generated using <strong>Bestseller Author Pro</strong> - AI-powered content creation platform.</em></p>
      </div>`;
  }

  private generateFlipbookTOCPage(chapters: Array<{title: string, content: string}>): string {
    const tocItems = chapters.map((chapter, index) => {
      const chapterWordCount = this.calculateWordCount(chapter.content);
      const readingTime = Math.ceil(chapterWordCount / 200);
      return `<li>
        <span class="toc-title">Chapter ${index + 1}: ${this.escapeHTML(chapter.title)}</span>
        <span class="toc-meta">${readingTime} min • ${chapterWordCount} words</span>
      </li>`;
    }).join('');

    return `
      <div class="toc-page">
        <h2>Table of Contents</h2>
        <ul class="toc-list">
          ${tocItems}
        </ul>
      </div>`;
  }

  private splitChapterIntoPages(chapter: {title: string, content: string}, chapterNumber: number): Array<{title: string, content: string}> {
    const pages: Array<{title: string, content: string}> = [];
    const wordsPerPage = 500; // Approximate words per page for good readability
    const paragraphs = chapter.content.split('\n\n').filter(p => p.trim());
    
    let currentPageContent = '';
    let currentWordCount = 0;
    let pageNumber = 1;
    
    // Add chapter title to first page
    const chapterTitle = `<h2>Chapter ${chapterNumber}: ${this.escapeHTML(chapter.title)}</h2>`;
    currentPageContent = chapterTitle;
    currentWordCount = this.calculateWordCount(chapter.title) + 10; // Account for "Chapter X:"
    
    paragraphs.forEach((paragraph, index) => {
      const paragraphWordCount = this.calculateWordCount(paragraph);
      
      if (currentWordCount + paragraphWordCount > wordsPerPage && currentPageContent.trim() !== chapterTitle) {
        // Create new page
        pages.push({
          title: `Chapter ${chapterNumber} - Page ${pageNumber}`,
          content: `<div class="chapter-content">${currentPageContent}</div>`
        });
        
        currentPageContent = paragraph.startsWith('###') ? 
          `<h3>${this.escapeHTML(paragraph.substring(4))}</h3>` : 
          `<p>${this.escapeHTML(paragraph)}</p>`;
        currentWordCount = paragraphWordCount;
        pageNumber++;
      } else {
        // Add to current page
        const formattedParagraph = paragraph.startsWith('###') ? 
          `<h3>${this.escapeHTML(paragraph.substring(4))}</h3>` : 
          `<p>${this.escapeHTML(paragraph)}</p>`;
        
        currentPageContent += formattedParagraph;
        currentWordCount += paragraphWordCount;
      }
    });
    
    // Add final page if there's content
    if (currentPageContent.trim() !== chapterTitle) {
      pages.push({
        title: `Chapter ${chapterNumber} - Page ${pageNumber}`,
        content: `<div class="chapter-content">${currentPageContent}</div>`
      });
    }
    
    return pages;
  }

  private generateBookIcon(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/>
    </svg>`;
  }

  private extractChapters(content: string): Array<{title: string, content: string}> {
    const chapters: Array<{title: string, content: string}> = [];
    const lines = content.split('\n');
    
    let currentChapter: {title: string, content: string} | null = null;
    
    lines.forEach(line => {
      if (line.startsWith('## ')) {
        if (currentChapter) {
          chapters.push(currentChapter);
        }
        currentChapter = {
          title: line.replace('## ', ''),
          content: ''
        };
      } else if (currentChapter) {
        currentChapter.content += line + '\n';
      }
    });
    
    if (currentChapter) {
      chapters.push(currentChapter);
    }
    
    return chapters;
  }

  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async generatePrintPDF(options: ExportOptions): Promise<void> {
    const htmlBlob = this.exportHTML(options);
    const htmlText = await htmlBlob.text();
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Could not open print window. Please allow popups.');
    }
    
    printWindow.document.write(htmlText);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  }
}

export const exportService = new ExportService();