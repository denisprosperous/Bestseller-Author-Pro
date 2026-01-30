import React from "react";
import { Download, Wand2, Loader2 } from "lucide-react";
import type { Route } from "./+types/preview";
import { Navigation } from "~/components/navigation";
import { Button } from "~/components/ui/button/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog/dialog";
import { Alert, AlertDescription } from "~/components/ui/alert/alert";
import { EXPORT_FORMATS } from "~/data/ai-providers";
import { exportService } from "~/utils/export-service";
import { contentService, type GeneratedEbook } from "~/services/content-service";
import { aiService } from "~/utils/ai-service";
import { apiKeyService } from "~/services/api-key-service";
import { AuthService } from "~/services/auth-service";
import { ProtectedRoute } from "~/components/protected-route";
import styles from "./preview.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Preview - Bestseller Author Pro" },
    { name: "description", content: "Preview and export your ebook" },
  ];
}

export default function Preview() {
  const [ebook, setEbook] = React.useState<GeneratedEbook | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeChapter, setActiveChapter] = React.useState("0");
  const [exportFormat, setExportFormat] = React.useState("pdf");
  const [isExporting, setIsExporting] = React.useState(false);
  const [humanizing, setHumanizing] = React.useState(false);
  const [humanizedContent, setHumanizedContent] = React.useState<string | null>(null);

  // Helper function to get authenticated user ID
  const getUserId = async (): Promise<string> => {
    const userId = await AuthService.getUserId();
    if (!userId) {
      throw new Error("User not authenticated");
    }
    return userId;
  };

  // Load ebook on mount
  React.useEffect(() => {
    loadEbook();
  }, []);

  const loadEbook = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = await getUserId();

      // Get ebook ID from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const ebookId = urlParams.get('ebook');

      if (!ebookId) {
        // If no ebook ID, try to load the most recent ebook
        const userEbooks = await contentService.getUserEbooks(userId);
        if (userEbooks.length === 0) {
          setError('No ebooks found. Please create an ebook first.');
          return;
        }
        
        // Load the most recent ebook
        const recentEbook = await contentService.getEbook(userId, userEbooks[0].id);
        if (!recentEbook) {
          setError('Failed to load ebook content.');
          return;
        }
        
        setEbook(recentEbook);
        if (recentEbook.chapters.length > 0) {
          setActiveChapter("0");
        }
      } else {
        // Load specific ebook
        const loadedEbook = await contentService.getEbook(userId, ebookId);
        if (!loadedEbook) {
          setError('Ebook not found or access denied.');
          return;
        }
        
        setEbook(loadedEbook);
        if (loadedEbook.chapters.length > 0) {
          setActiveChapter("0");
        }
      }
    } catch (error) {
      console.error('Error loading ebook:', error);
      setError(error instanceof Error ? error.message : 'Failed to load ebook');
    } finally {
      setLoading(false);
    }
  };

  const handleHumanize = async () => {
    if (!ebook || !ebook.chapters.length) {
      setError('No content to humanize');
      return;
    }

    setHumanizing(true);
    setError(null);

    try {
      const userId = await getUserId();
      
      // Get API key for humanization
      const providers = ['openai', 'anthropic', 'xai', 'google', 'deepseek'];
      let apiKey = '';
      let provider = '';

      for (const p of providers) {
        const key = await apiKeyService.getApiKey(userId, p);
        if (key) {
          apiKey = key;
          provider = p;
          break;
        }
      }

      if (!apiKey) {
        setError('No API keys found. Please add at least one API key in Settings to use humanization.');
        return;
      }

      // Humanize the current chapter
      const currentChapterIndex = parseInt(activeChapter);
      const currentChapter = ebook.chapters[currentChapterIndex];
      
      if (!currentChapter) {
        setError('No chapter selected for humanization');
        return;
      }

      const humanized = await aiService.humanizeContent(
        currentChapter.content,
        provider,
        'auto', // Let AI service choose the best model
        apiKey
      );

      setHumanizedContent(humanized);
    } catch (error) {
      console.error('Error humanizing content:', error);
      setError(error instanceof Error ? error.message : 'Failed to humanize content');
    } finally {
      setHumanizing(false);
    }
  };

  const handleAcceptHumanization = async () => {
    if (!ebook || !humanizedContent) return;

    try {
      const userId = await getUserId();
      const currentChapterIndex = parseInt(activeChapter);
      const updatedChapters = [...ebook.chapters];
      updatedChapters[currentChapterIndex] = {
        ...updatedChapters[currentChapterIndex],
        content: humanizedContent
      };

      // Update the ebook in database
      await contentService.saveChapters(userId, ebook.id, updatedChapters);

      // Update local state
      setEbook({
        ...ebook,
        chapters: updatedChapters
      });

      setHumanizedContent(null);
    } catch (error) {
      console.error('Error saving humanized content:', error);
      setError('Failed to save humanized content');
    }
  };

  const handleExport = async () => {
    if (!ebook) {
      setError('No ebook to export');
      return;
    }

    setIsExporting(true);
    try {
      // Combine all chapters into a single content string
      const content = ebook.chapters
        .map((ch) => `## Chapter ${ch.number}: ${ch.title}\n\n${ch.content}`)
        .join("\n\n");

      const blob = await exportService.exportBook({
        format: exportFormat as "pdf" | "epub" | "markdown" | "html",
        title: ebook.title,
        author: "Generated by Bestseller Author Pro",
        content,
        includeTableOfContents: true,
        includeCopyright: true,
      });

      const extension = exportFormat === "markdown" ? "md" : exportFormat;
      exportService.downloadBlob(blob, `${ebook.title}.${extension}`);
    } catch (error) {
      console.error("Export error:", error);
      setError("Failed to export ebook");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Navigation />
        <div className={styles.content}>
          <div className={styles.loading}>
            <Loader2 className={styles.spinner} />
            <p>Loading your ebook...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Navigation />
        <div className={styles.content}>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className={styles.actions} style={{ marginTop: '1rem' }}>
            <Button onClick={() => window.location.href = '/brainstorm'}>
              Create New Ebook
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className={styles.container}>
        <Navigation />
        <div className={styles.content}>
          <p>No ebook found.</p>
          <Button onClick={() => window.location.href = '/brainstorm'}>
            Create New Ebook
          </Button>
        </div>
      </div>
    );
  }

  const currentChapter = ebook.chapters[parseInt(activeChapter)];

  return (
    <ProtectedRoute>
      <div className={styles.container}>
        <Navigation />

        <div className={styles.content}>
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <h1 className={styles.title}>Preview Your Book</h1>
              <p className={styles.subtitle}>Review, edit, and export your completed ebook</p>
            </div>

          <div className={styles.actions}>
            <Button variant="outline" onClick={handleHumanize} disabled={humanizing}>
              {humanizing ? (
                <>
                  <Loader2 className={styles.spinner} />
                  Humanizing...
                </>
              ) : (
                <>
                  <Wand2 size={18} />
                  Humanize Content
                </>
              )}
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Download size={18} />
                  Export Book
                </Button>
              </DialogTrigger>
              <DialogContent className={styles.exportDialog}>
                <DialogHeader>
                  <DialogTitle className={styles.exportTitle}>Export Your Book</DialogTitle>
                </DialogHeader>

                <div className={styles.exportOptions}>
                  {EXPORT_FORMATS.map((format) => (
                    <div
                      key={format.value}
                      className={`${styles.exportOption} ${exportFormat === format.value ? styles.selected : ""}`}
                      onClick={() => setExportFormat(format.value)}
                    >
                      <h3 className={styles.exportOptionTitle}>{format.label}</h3>
                      <p className={styles.exportOptionDesc}>{format.description}</p>
                    </div>
                  ))}
                </div>

                <div className={styles.exportActions}>
                  <Button variant="outline" onClick={() => {}}>
                    Cancel
                  </Button>
                  <Button onClick={handleExport} disabled={isExporting}>
                    {isExporting ? "Exporting..." : "Download"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className={styles.grid}>
          <aside className={styles.sidebar}>
            <h2 className={styles.sidebarTitle}>Table of Contents</h2>
            <ul className={styles.toc}>
              {ebook.chapters.map((chapter, index) => (
                <li
                  key={chapter.id}
                  className={`${styles.tocItem} ${activeChapter === index.toString() ? styles.active : ""}`}
                  onClick={() => setActiveChapter(index.toString())}
                >
                  Chapter {chapter.number}: {chapter.title}
                </li>
              ))}
            </ul>
          </aside>

          <main className={styles.main}>
            <h1 className={styles.bookTitle}>{ebook.title}</h1>
            {ebook.subtitle && <p className={styles.bookSubtitle}>{ebook.subtitle}</p>}

            {humanizedContent && (
              <div className={styles.humanizationPreview}>
                <h3>Humanized Version Preview</h3>
                <div className={styles.humanizedContent}>
                  {humanizedContent.split('\n\n').map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>
                <div className={styles.humanizationActions}>
                  <Button onClick={handleAcceptHumanization}>Accept Changes</Button>
                  <Button variant="outline" onClick={() => setHumanizedContent(null)}>
                    Reject Changes
                  </Button>
                </div>
              </div>
            )}

            {currentChapter && (
              <article className={styles.chapter}>
                <h2 className={styles.chapterTitle}>
                  Chapter {currentChapter.number}: {currentChapter.title}
                </h2>
                <div className={styles.chapterContent}>
                  {currentChapter.content.split("\n\n").map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>
              </article>
            )}
          </main>
        </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
