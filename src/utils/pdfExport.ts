// Advanced PDF Export with Custom Templates

import jsPDF from 'jspdf';

interface PDFOptions {
  clientName: string;
  bookTitle: string;
  sport: string;
  content: string;
  coverImage?: string;
  includeTableOfContents?: boolean;
  includePageNumbers?: boolean;
}

export async function exportToPDFAdvanced(options: PDFOptions) {
  const {
    clientName,
    bookTitle,
    sport,
    content,
    coverImage,
    includeTableOfContents = true,
    includePageNumbers = true
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Helper function to add new page
  const addNewPage = () => {
    doc.addPage();
    yPosition = margin;
    if (includePageNumbers) {
      addPageNumber();
    }
  };

  // Helper function to add page numbers
  const addPageNumber = () => {
    const pageNum = doc.internal.pages.length - 1;
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${pageNum}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  };

  // 1. COVER PAGE
  doc.setFillColor(41, 128, 185); // Blue background
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(bookTitle, contentWidth);
  doc.text(titleLines, pageWidth / 2, 80, { align: 'center' });

  // Author
  doc.setFontSize(24);
  doc.setFont('helvetica', 'normal');
  doc.text(`by ${clientName}`, pageWidth / 2, 120, { align: 'center' });

  // Sport badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth / 2 - 30, 140, 60, 15, 3, 3, 'F');
  doc.setTextColor(41, 128, 185);
  doc.setFontSize(14);
  doc.text(sport.toUpperCase(), pageWidth / 2, 150, { align: 'center' });

  // Footer
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text('An Athlete Biography', pageWidth / 2, pageHeight - 30, { align: 'center' });

  // 2. TABLE OF CONTENTS (if enabled)
  if (includeTableOfContents) {
    addNewPage();
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Table of Contents', margin, yPosition);
    yPosition += 15;

    // Extract chapters from content
    const chapters = extractChapters(content);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    chapters.forEach((chapter, index) => {
      if (yPosition > pageHeight - margin) {
        addNewPage();
      }
      
      doc.text(`${index + 1}. ${chapter.title}`, margin, yPosition);
      doc.text(`${chapter.page}`, pageWidth - margin - 10, yPosition, { align: 'right' });
      yPosition += 8;
    });
  }

  // 3. CONTENT PAGES
  addNewPage();
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  // Split content into paragraphs
  const paragraphs = content.split('\n\n');
  
  paragraphs.forEach((paragraph) => {
    if (!paragraph.trim()) return;

    // Check if it's a heading
    if (paragraph.startsWith('**') || paragraph.startsWith('#')) {
      // Add some space before heading
      yPosition += 10;
      
      if (yPosition > pageHeight - margin - 20) {
        addNewPage();
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const heading = paragraph.replace(/\*\*/g, '').replace(/#/g, '').trim();
      doc.text(heading, margin, yPosition);
      yPosition += 10;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
    } else {
      // Regular paragraph
      const lines = doc.splitTextToSize(paragraph, contentWidth);
      
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin - 10) {
          addNewPage();
        }
        
        doc.text(line, margin, yPosition);
        yPosition += 7;
      });
      
      yPosition += 5; // Space between paragraphs
    }
  });

  // Save the PDF
  const fileName = `${bookTitle.replace(/[^a-z0-9]/gi, '_')}_${clientName.replace(/[^a-z0-9]/gi, '_')}.pdf`;
  doc.save(fileName);
}

// Helper function to extract chapters
function extractChapters(content: string): Array<{ title: string; page: number }> {
  const chapters: Array<{ title: string; page: number }> = [];
  const lines = content.split('\n');
  let currentPage = 3; // Start after cover and TOC
  
  lines.forEach((line, index) => {
    if (line.startsWith('**') || line.startsWith('#')) {
      const title = line.replace(/\*\*/g, '').replace(/#/g, '').trim();
      if (title.length > 0 && title.length < 100) {
        chapters.push({ title, page: currentPage });
      }
    }
    
    // Rough page calculation (40 lines per page)
    if (index % 40 === 0 && index > 0) {
      currentPage++;
    }
  });
  
  return chapters;
}

// Simple PDF export (existing functionality)
export function exportToPDFSimple(clientName: string, bookTitle: string, content: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(bookTitle, margin, margin);
  
  // Author
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`by ${clientName}`, margin, margin + 10);
  
  // Content
  doc.setFontSize(12);
  const lines = doc.splitTextToSize(content, contentWidth);
  doc.text(lines, margin, margin + 25);
  
  // Save
  const fileName = `${bookTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`;
  doc.save(fileName);
}

// Export functions for ClientInterview component with beautiful formatting
export async function exportToPDF(bookTitle: string, clientName: string, content: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Helper to add new page
  const addNewPage = () => {
    doc.addPage();
    yPosition = margin;
    // Page number
    const pageNum = doc.internal.pages.length - 1;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  };

  // COVER PAGE - Beautiful gradient effect
  doc.setFillColor(79, 70, 229); // Indigo
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Title with shadow effect
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(bookTitle, contentWidth - 20);
  doc.text(titleLines, pageWidth / 2, 80, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  doc.text(`An Autobiography`, pageWidth / 2, 110, { align: 'center' });
  
  // Author
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`by ${clientName}`, pageWidth / 2, 140, { align: 'center' });
  
  // Decorative line
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 40, 150, pageWidth / 2 + 40, 150);
  
  // Footer
  doc.setFontSize(11);
  doc.setFont('helvetica', 'italic');
  doc.text('Created with Muse AI', pageWidth / 2, pageHeight - 20, { align: 'center' });

  // CONTENT PAGES
  addNewPage();
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  // Process content
  const sections = content.split('\n\n');
  
  sections.forEach((section) => {
    if (!section.trim()) return;

    // Check for headings
    if (section.includes('**') || section.startsWith('#')) {
      yPosition += 8;
      
      if (yPosition > pageHeight - margin - 20) {
        addNewPage();
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(79, 70, 229);
      const heading = section.replace(/\*\*/g, '').replace(/#/g, '').replace(/User:|AI:/g, '').trim();
      doc.text(heading, margin, yPosition);
      yPosition += 8;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
    } else {
      // Regular text
      const cleanText = section.replace(/\*\*/g, '').replace(/User:|AI:/g, '').trim();
      const lines = doc.splitTextToSize(cleanText, contentWidth);
      
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin - 10) {
          addNewPage();
        }
        
        doc.text(line, margin, yPosition);
        yPosition += 6;
      });
      
      yPosition += 4;
    }
  });

  // Save
  const fileName = `${bookTitle.replace(/[^a-z0-9]/gi, '_')}_${clientName.replace(/[^a-z0-9]/gi, '_')}.pdf`;
  doc.save(fileName);
}

export async function exportToDOCX(bookTitle: string, clientName: string, content: string) {
  // Create beautiful HTML for DOCX
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Georgia', 'Times New Roman', serif;
          line-height: 1.8;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
        }
        .cover {
          text-align: center;
          padding: 100px 0;
          border-bottom: 3px solid #4f46e5;
          margin-bottom: 60px;
        }
        .cover h1 {
          font-size: 42px;
          color: #4f46e5;
          margin-bottom: 20px;
          font-weight: bold;
        }
        .cover h2 {
          font-size: 24px;
          color: #666;
          font-weight: normal;
          margin-bottom: 40px;
        }
        .cover .author {
          font-size: 28px;
          color: #333;
          font-style: italic;
        }
        .content {
          font-size: 14px;
        }
        .content p {
          margin-bottom: 20px;
          text-align: justify;
        }
        .content h3 {
          font-size: 20px;
          color: #4f46e5;
          margin-top: 40px;
          margin-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="cover">
        <h1>${bookTitle}</h1>
        <h2>An Autobiography</h2>
        <p class="author">by ${clientName}</p>
      </div>
      <div class="content">
        ${content.split('\n\n').map(para => {
          const clean = para.replace(/\*\*/g, '').replace(/User:|AI:/g, '').trim();
          if (clean.startsWith('#') || clean.length < 100 && clean.includes(':')) {
            return `<h3>${clean.replace(/#/g, '')}</h3>`;
          }
          return `<p>${clean}</p>`;
        }).join('\n')}
      </div>
    </body>
    </html>
  `;
  
  const blob = new Blob([htmlContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${bookTitle.replace(/[^a-z0-9]/gi, '_')}_${clientName.replace(/[^a-z0-9]/gi, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportToMarkdown(bookTitle: string, clientName: string, content: string) {
  const markdown = `# ${bookTitle}

**An Autobiography**

*by ${clientName}*

---

${content.replace(/User:|AI:/g, '').replace(/\*\*\*\*/g, '**')}

---

*Created with Muse AI - AI Autobiography Interview Platform*
`;
  
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${bookTitle.replace(/[^a-z0-9]/gi, '_')}_${clientName.replace(/[^a-z0-9]/gi, '_')}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportToText(bookTitle: string, clientName: string, content: string) {
  const text = `
${'='.repeat(60)}
${bookTitle.toUpperCase()}
${'='.repeat(60)}

An Autobiography
by ${clientName}

${'-'.repeat(60)}

${content.replace(/User:|AI:/g, '').replace(/\*\*/g, '')}

${'-'.repeat(60)}

Created with Muse AI
AI Autobiography Interview Platform
`;
  
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${bookTitle.replace(/[^a-z0-9]/gi, '_')}_${clientName.replace(/[^a-z0-9]/gi, '_')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
