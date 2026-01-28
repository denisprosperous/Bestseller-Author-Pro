import React from "react";
import { Upload, FileText, X } from "lucide-react";
import type { Route } from "./+types/builder";
import { Navigation } from "~/components/navigation";
import { ProtectedRoute } from "~/components/protected-route";
import { Button } from "~/components/ui/button/button";
import { Input } from "~/components/ui/input/input";
import { Textarea } from "~/components/ui/textarea/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select/select";
import { Alert, AlertDescription } from "~/components/ui/alert/alert";
import { AI_PROVIDERS, TONE_OPTIONS } from "~/data/ai-providers";
import { aiService } from "~/utils/ai-service";
import { apiKeyService } from "~/services/api-key-service";
import { sessionService } from "~/services/session-service";
import { contentService } from "~/services/content-service";
import { AuthService } from "~/services/auth-service";
import styles from "./builder.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Builder - Bestseller Author Pro" },
    { name: "description", content: "Build your ebook with AI assistance" },
  ];
}

export default function Builder() {
  const [topic, setTopic] = React.useState("");
  const [wordCount, setWordCount] = React.useState("30000");
  const [tone, setTone] = React.useState("auto");
  const [customTone, setCustomTone] = React.useState("");
  const [audience, setAudience] = React.useState("");
  const [provider, setProvider] = React.useState("auto");
  const [model, setModel] = React.useState("auto");
  const [outline, setOutline] = React.useState("");
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [improveOutline, setImproveOutline] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [sessionId, setSessionId] = React.useState<string | null>(null);

  // Helper function to get authenticated user ID
  const getUserId = async (): Promise<string> => {
    const userId = await AuthService.getUserId();
    if (!userId) {
      throw new Error("User not authenticated");
    }
    return userId;
  };

  const selectedProvider = AI_PROVIDERS.find((p) => p.id === provider);
  const availableModels = selectedProvider?.models || [];

  // Initialize session and load data from brainstorm if available
  React.useEffect(() => {
    initializeBuilder();
  }, []);

  const initializeBuilder = async () => {
    try {
      const userId = await getUserId();

      // Get session ID from URL or create new one
      const urlParams = new URLSearchParams(window.location.search);
      const sessionIdFromUrl = urlParams.get('session');
      
      let currentSessionId = sessionIdFromUrl;
      if (!currentSessionId) {
        currentSessionId = await sessionService.getOrCreateActiveSession(userId);
      }
      
      setSessionId(currentSessionId);

      // Load brainstorm data if available
      const brainstormData = await sessionService.getBrainstormResult(userId, currentSessionId);
      if (brainstormData) {
        setTopic(brainstormData.topic);
        setProvider(brainstormData.provider);
        setModel(brainstormData.model);
        
        // Convert outline object to string if needed
        if (typeof brainstormData.outline === 'object') {
          setOutline(JSON.stringify(brainstormData.outline, null, 2));
        } else {
          setOutline(brainstormData.outline || '');
        }
      }

      // Load existing builder config if available
      const builderConfig = await sessionService.getBuilderConfig(userId, currentSessionId);
      if (builderConfig) {
        setTopic(builderConfig.topic);
        setWordCount(builderConfig.wordCount.toString());
        setTone(builderConfig.tone);
        setCustomTone(builderConfig.customTone || '');
        setAudience(builderConfig.audience);
        setProvider(builderConfig.provider);
        setModel(builderConfig.model);
        setOutline(builderConfig.outline || '');
        setImproveOutline(builderConfig.improveOutline);
      }
    } catch (error) {
      console.error('Failed to initialize builder:', error);
      setError('Failed to initialize builder. Please refresh the page.');
    }
  };

  // Auto-select first model when provider changes
  React.useEffect(() => {
    if (availableModels.length > 0 && !availableModels.find((m) => m.id === model)) {
      setModel(availableModels[0].id);
    }
  }, [provider, availableModels, model]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // Read file content
      const reader = new FileReader();
      reader.onload = (event) => {
        setOutline(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setOutline("");
  };

  const handleGenerate = async () => {
    if (!topic || !outline) {
      setError('Please provide both topic and outline');
      return;
    }

    if (!sessionId) {
      setError('Session not initialized. Please refresh the page.');
      return;
    }

    setGenerating(true);
    setProgress(0);
    setError(null);

    try {
      const userId = await getUserId();
      // Save builder configuration to session
      const builderConfig = {
        topic,
        wordCount: parseInt(wordCount),
        tone,
        customTone,
        audience,
        provider,
        model,
        outline,
        improveOutline
      };

      await sessionService.saveBuilderConfig(userId, sessionId, builderConfig);

      // Get API key for the selected provider
      let apiKey = '';
      if (provider !== 'auto') {
        apiKey = await apiKeyService.getApiKey(userId, provider) || '';
        if (!apiKey) {
          throw new Error(`No API key found for ${selectedProvider?.name}. Please add your API key in Settings.`);
        }
      } else {
        // For auto mode, get any available API key
        const providers = ['openai', 'anthropic', 'xai', 'google', 'deepseek'];
        for (const p of providers) {
          const key = await apiKeyService.getApiKey(userId, p);
          if (key) {
            apiKey = key;
            break;
          }
        }
        if (!apiKey) {
          throw new Error('No API keys found. Please add at least one API key in Settings to use auto mode.');
        }
      }

      // Update progress: Starting generation
      setProgress(10);
      await sessionService.saveGenerationProgress(userId, sessionId, {
        phase: 'generating',
        percentage: 10,
        message: 'Starting ebook generation...',
        startedAt: new Date().toISOString()
      });

      // Improve outline if requested
      let finalOutline = outline;
      if (improveOutline) {
        setProgress(20);
        await sessionService.saveGenerationProgress(userId, sessionId, {
          phase: 'outlining',
          percentage: 20,
          message: 'Improving outline with AI...',
          startedAt: new Date().toISOString()
        });

        try {
          finalOutline = await aiService.improveOutline(outline, provider, model, apiKey);
        } catch (error) {
          console.warn('Failed to improve outline, using original:', error);
          // Continue with original outline if improvement fails
        }
      }

      // Generate the complete ebook
      setProgress(30);
      await sessionService.saveGenerationProgress(userId, sessionId, {
        phase: 'generating',
        percentage: 30,
        message: 'Generating ebook content...',
        startedAt: new Date().toISOString()
      });

      const ebookContent = await aiService.generateEbook({
        topic,
        wordCount: parseInt(wordCount),
        tone,
        customTone,
        audience,
        outline: finalOutline,
        provider,
        model,
        apiKey
      });

      setProgress(70);
      await sessionService.saveGenerationProgress(userId, sessionId, {
        phase: 'generating',
        percentage: 70,
        message: 'Processing generated content...',
        startedAt: new Date().toISOString()
      });

      // Parse the generated content into chapters
      const chapters = parseEbookContent(ebookContent, topic);

      // Save the ebook to database
      setProgress(90);
      await sessionService.saveGenerationProgress(userId, sessionId, {
        phase: 'generating',
        percentage: 90,
        message: 'Saving ebook to database...',
        startedAt: new Date().toISOString()
      });

      const ebookId = await contentService.saveEbook(userId, {
        title: topic,
        subtitle: `A comprehensive guide to ${topic.toLowerCase()}`,
        topic,
        tone,
        custom_tone: customTone,
        audience,
        ai_provider: provider,
        ai_model: model,
        outline: finalOutline,
        chapters
      });

      // Complete the session
      setProgress(100);
      await sessionService.saveGenerationProgress(userId, sessionId, {
        phase: 'complete',
        percentage: 100,
        message: 'Ebook generation completed successfully!',
        startedAt: new Date().toISOString(),
        ebookId
      });

      await sessionService.completeSession(userId, sessionId, ebookId);

      // Navigate to preview with the generated ebook
      setTimeout(() => {
        window.location.href = `/preview?ebook=${ebookId}`;
      }, 1000);

    } catch (error) {
      console.error("Error generating ebook:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate ebook';
      setError(errorMessage);
      
      // Save error state to session
      await sessionService.saveGenerationProgress(userId, sessionId, {
        phase: 'generating',
        percentage: 0,
        message: `Error: ${errorMessage}`,
        startedAt: new Date().toISOString()
      });

      setGenerating(false);
      setProgress(0);
    }
  };

  // Helper function to parse ebook content into chapters
  const parseEbookContent = (content: string, title: string) => {
    const lines = content.split('\n');
    const chapters = [];
    let currentChapter = null;
    let chapterNumber = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if this line is a chapter heading
      if (trimmedLine.match(/^#+\s*(Chapter\s+\d+|Introduction|Conclusion)/i) || 
          trimmedLine.match(/^Chapter\s+\d+/i)) {
        
        // Save previous chapter if exists
        if (currentChapter) {
          chapters.push({
            title: currentChapter.title,
            content: currentChapter.content.trim(),
            chapter_number: currentChapter.number
          });
        }

        // Start new chapter
        chapterNumber++;
        currentChapter = {
          title: trimmedLine.replace(/^#+\s*/, '').replace(/^Chapter\s+\d+:\s*/i, ''),
          content: '',
          number: chapterNumber
        };
      } else if (currentChapter && trimmedLine) {
        // Add content to current chapter
        currentChapter.content += line + '\n';
      }
    }

    // Add the last chapter
    if (currentChapter) {
      chapters.push({
        title: currentChapter.title,
        content: currentChapter.content.trim(),
        chapter_number: currentChapter.number
      });
    }

    // If no chapters were found, create a single chapter with all content
    if (chapters.length === 0) {
      chapters.push({
        title: title,
        content: content,
        chapter_number: 1
      });
    }

    return chapters;
  };

  return (
    <ProtectedRoute>
      <div className={styles.container}>
        <Navigation />
        <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.title}>Build Your Ebook</h1>
          <p className={styles.description}>
            Configure your book settings and provide an outline. AI will generate complete, professional content based
            on your specifications.
          </p>
        </header>

        {!generating ? (
          <>
            <div className={styles.grid}>
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Book Details</h2>

                <div className={styles.formGroup}>
                  <label htmlFor="topic" className={styles.label}>
                    Topic or Niche
                  </label>
                  <Input
                    id="topic"
                    placeholder="e.g., Digital Marketing for Small Businesses"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="wordCount" className={styles.label}>
                    Target Word Count
                  </label>
                  <Input
                    id="wordCount"
                    type="number"
                    placeholder="30000"
                    value={wordCount}
                    onChange={(e) => setWordCount(e.target.value)}
                  />
                  <span className={styles.hint}>Typical ebook: 20,000-50,000 words</span>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="tone" className={styles.label}>
                    Writing Tone
                  </label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {tone !== "custom" && (
                    <span className={styles.hint}>
                      {TONE_OPTIONS.find((t) => t.value === tone)?.description}
                    </span>
                  )}
                </div>

                {tone === "custom" && (
                  <div className={styles.formGroup}>
                    <label htmlFor="customTone" className={styles.label}>
                      Describe Your Writing Style
                    </label>
                    <Textarea
                      id="customTone"
                      className={styles.textarea}
                      placeholder="Example: Conversational yet authoritative, with humor and real-world examples. Use simple language and avoid jargon."
                      value={customTone}
                      onChange={(e) => setCustomTone(e.target.value)}
                      style={{ minHeight: "80px" }}
                    />
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label htmlFor="audience" className={styles.label}>
                    Target Audience
                  </label>
                  <Input
                    id="audience"
                    placeholder="e.g., Entrepreneurs aged 25-45"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.card}>
                <h2 className={styles.cardTitle}>AI Configuration</h2>

                <div className={styles.formGroup}>
                  <label className={styles.label}>AI Provider</label>
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_PROVIDERS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className={styles.hint}>{selectedProvider?.description}</span>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Model</label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className={styles.hint}>{availableModels.find((m) => m.id === model)?.description}</span>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <input
                      type="checkbox"
                      checked={improveOutline}
                      onChange={(e) => setImproveOutline(e.target.checked)}
                      style={{ marginRight: "var(--space-2)" }}
                    />
                    Improve outline with AI
                  </label>
                  <span className={styles.hint}>AI will enhance structure and add depth to your outline</span>
                </div>
              </div>
            </div>

            <div className={styles.card} style={{ gridColumn: "1 / -1" }}>
              <h2 className={styles.cardTitle}>Book Outline</h2>

              <div className={styles.formGroup}>
                <label className={styles.label}>Upload Outline or Draft</label>
                <div className={styles.uploadArea} onClick={() => document.getElementById("file-upload")?.click()}>
                  <Upload className={styles.uploadIcon} />
                  <p className={styles.uploadText}>Click to upload or drag and drop</p>
                  <p className={styles.uploadHint}>Supports .txt, .md, .docx files</p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className={styles.fileInput}
                  accept=".txt,.md,.docx"
                  onChange={handleFileUpload}
                />

                {uploadedFile && (
                  <div className={styles.fileName}>
                    <FileText className={styles.fileIcon} />
                    <span className={styles.fileNameText}>{uploadedFile.name}</span>
                    <button className={styles.removeFile} onClick={handleRemoveFile} type="button">
                      <X size={20} />
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="outline" className={styles.label}>
                  Or paste your outline here
                </label>
                <Textarea
                  id="outline"
                  className={styles.textarea}
                  placeholder="Chapter 1: Introduction&#10;  - Overview&#10;  - Key concepts&#10;&#10;Chapter 2: Getting Started&#10;  - First steps&#10;  - Essential tools"
                  value={outline}
                  onChange={(e) => setOutline(e.target.value)}
                  style={{ minHeight: "200px" }}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className={styles.actions}>
                <Button variant="outline" onClick={() => (window.location.href = "/brainstorm")}>
                  Back to Brainstorm
                </Button>
                <Button onClick={handleGenerate} disabled={!topic || !outline || generating}>
                  {generating ? "Generating..." : "Generate Book"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.progress}>
            <h2 className={styles.progressTitle}>Generating Your Book</h2>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <p className={styles.progressText}>
              {progress < 30 && "Analyzing outline and structure..."}
              {progress >= 30 && progress < 60 && "Generating chapters..."}
              {progress >= 60 && progress < 90 && "Humanizing content..."}
              {progress >= 90 && "Finalizing your book..."}
            </p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
