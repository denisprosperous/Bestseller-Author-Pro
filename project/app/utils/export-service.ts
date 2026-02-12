export interface ExportOptions {
  format: "pdf" | "epub" | "markdown" | "html";
  title: string;
  author: string;
  content: string;
  includeTableOfContents?: boolean;
  includeCopyright?: boolean;
}

export const exportService = {
  async exportBook(options: ExportOptions): Promise<Blob> {
    const { format, title, content } = options;
    let data = "";
    let mimeType = "text/plain";

    if (format === "markdown") {
      data = `# ${title}\n\n${content}`;
      mimeType = "text/markdown";
    } else if (format === "html") {
      data = `<!DOCTYPE html>
<html>
<head><title>${title}</title></head>
<body>
<h1>${title}</h1>
${content.replace(/\n\n/g, "<p>").replace(/\n/g, "<br>")}
</body>
</html>`;
      mimeType = "text/html";
    } else {
      // Fallback for PDF/EPUB (stub)
      data = `[${format.toUpperCase()} EXPORT NOT IMPLEMENTED YET]\n\n# ${title}\n\n${content}`;
      mimeType = "text/plain";
    }

    return new Blob([data], { type: mimeType });
  },

  downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
