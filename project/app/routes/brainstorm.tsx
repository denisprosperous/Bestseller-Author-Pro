import React from "react";
import { Loader2 } from "lucide-react";
import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { useLoaderData, useActionData, useNavigation, Form } from "react-router";
import type { Route } from "./+types/brainstorm";
import { Navigation } from "~/components/navigation";
import { ProtectedRoute } from "~/components/protected-route";
import { Button } from "~/components/ui/button/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select/select";
import { Textarea } from "~/components/ui/textarea/textarea";
import { Alert, AlertDescription } from "~/components/ui/alert/alert";
import { AI_PROVIDERS } from "~/data/ai-providers";
import { aiService } from "~/utils/ai-service";
import { apiKeyService } from "~/services/api-key-service";
import { sessionService } from "~/services/session-service";
import { AuthService } from "~/services/auth-service";
import styles from "./brainstorm.module.css";

interface BrainstormResults {
  titles: string[];
  outline: string;
  topic: string;
  provider: string;
  model: string;
}

interface LoaderData {
  sessionId: string | null;
  existingResults: BrainstormResults | null;
  hasApiKeys: boolean;
}

interface ActionData {
  success?: boolean;
  results?: BrainstormResults;
  error?: string;
  sessionId?: string;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Brainstorm - Bestseller Author Pro" },
    { name: "description", content: "Generate book ideas and outlines with AI" },
  ];
}

/**
 * Loader: Initialize session and load existing brainstorm results
 */
export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
  try {
    const authService = new AuthService();
    const user = await authService.getCurrentUser();
    
    if (!user) {
      return redirect('/login');
    }

    // Get or create session
    let sessionId = await sessionService.getActiveSession(user.id);
    if (!sessionId) {
      sessionId = await sessionService.createSession(user.id);
    }

    // Load existing brainstorm results from session
    const sessionData = await sessionService.getSessionData(sessionId);
    const existingResults = sessionData?.brainstorm_data || null;

    // Check if user has any API keys
    const providers = await apiKeyService.getAllApiKeys(user.id);
    const hasApiKeys = providers.length > 0;

    return json<LoaderData>({
      sessionId,
      existingResults,
      hasApiKeys
    });
  } catch (error) {
    console.error('Brainstorm loader error:', error);
    return json<LoaderData>({
      sessionId: null,
      existingResults: null,
      hasApiKeys: false
    });
  }
}

/**
 * Action: Handle brainstorm form submission
 */
export async function action({ request }: ActionFunctionArgs): Promise<Response> {
  try {
    const authService = new AuthService();
    const user = await authService.getCurrentUser();
    
    if (!user) {
      return json<ActionData>({ error: 'Authentication required' }, { status: 401 });
    }

    const formData = await request.formData();
    const actionType = formData.get('actionType') as string;

    if (actionType === 'generate') {
      const idea = formData.get('idea') as string;
      const provider = formData.get('provider') as string;
      const model = formData.get('model') as string;
      const sessionId = formData.get('sessionId') as string;

      if (!idea?.trim()) {
        return json<ActionData>({ error: 'Please enter a book idea' });
      }

      if (!sessionId) {
        return json<ActionData>({ error: 'Session not found. Please refresh the page.' });
      }

      try {
        // Get API key for the selected provider
        const apiKey = await apiKeyService.getApiKey(user.id, provider === 'auto' ? 'openai' : provider);
        if (!apiKey) {
          return json<ActionData>({ 
            error: `No API key found for ${provider}. Please add your API key in Settings.` 
          });
        }

        // Generate brainstorm results
        const results = await aiService.brainstorm(idea.trim(), provider, model, apiKey);
        
        const brainstormResults: BrainstormResults = {
          titles: results.titles,
          outline: results.outline,
          topic: idea.trim(),
          provider,
          model
        };

        // Save results to session
        await sessionService.updateSessionData(sessionId, {
          brainstorm_data: brainstormResults
        });

        return json<ActionData>({
          success: true,
          results: brainstormResults,
          sessionId
        });
      } catch (error) {
        console.error('Brainstorm generation error:', error);
        return json<ActionData>({
          error: error instanceof Error ? error.message : 'Failed to generate brainstorm ideas'
        });
      }
    }

    if (actionType === 'selectTitle') {
      const selectedTitle = formData.get('selectedTitle') as string;
      const sessionId = formData.get('sessionId') as string;

      if (!selectedTitle || !sessionId) {
        return json<ActionData>({ error: 'Missing required data' });
      }

      // Update session with selected title
      const sessionData = await sessionService.getSessionData(sessionId);
      if (sessionData?.brainstorm_data) {
        await sessionService.updateSessionData(sessionId, {
          brainstorm_data: {
            ...sessionData.brainstorm_data,
            selectedTitle
          }
        });
      }

      // Redirect to builder with session
      return redirect(`/builder?session=${sessionId}`);
    }

    return json<ActionData>({ error: 'Invalid action' });
  } catch (error) {
    console.error('Brainstorm action error:', error);
    return json<ActionData>({
      error: 'An unexpected error occurred. Please try again.'
    });
  }
}

export default function Brainstorm() {
  const { sessionId, existingResults, hasApiKeys } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  
  const [idea, setIdea] = React.useState("");
  const [provider, setProvider] = React.useState("auto");
  const [model, setModel] = React.useState("auto");
  const [selectedTitle, setSelectedTitle] = React.useState<string | null>(null);

  const isSubmitting = navigation.state === "submitting";
  const results = actionData?.results || existingResults;
  const error = actionData?.error;

  const selectedProvider = AI_PROVIDERS.find((p) => p.id === provider);
  const availableModels = selectedProvider?.models || [];

  // Auto-select first model when provider changes
  React.useEffect(() => {
    if (availableModels.length > 0 && model === "auto") {
      setModel(availableModels[0].id);
    }
  }, [provider, availableModels, model]);

  if (!hasApiKeys) {
    return (
      <ProtectedRoute>
        <div className={styles.container}>
          <Navigation />
          <main className={styles.main}>
            <div className={styles.content}>
              <Alert>
                <AlertDescription>
                  You need to add at least one AI provider API key to use the brainstorm feature.
                  <br />
                  <a href="/settings" className={styles.settingsLink}>
                    Go to Settings to add your API keys
                  </a>
                </AlertDescription>
              </Alert>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }
  return (
    <ProtectedRoute>
      <div className={styles.container}>
        <Navigation />
        <main className={styles.main}>
          <div className={styles.content}>
            <header className={styles.header}>
              <h1 className={styles.title}>Brainstorm Your Book</h1>
              <p className={styles.description}>
                Describe your book idea, and AI will generate compelling titles and a detailed outline to get you started.
              </p>
            </header>

            <Form method="post" className={styles.form}>
              <input type="hidden" name="actionType" value="generate" />
              <input type="hidden" name="sessionId" value={sessionId || ''} />
              
              <div className={styles.formGroup}>
                <label htmlFor="idea" className={styles.label}>
                  What's your book about?
                </label>
                <Textarea
                  id="idea"
                  name="idea"
                  className={styles.textarea}
                  placeholder="Example: A practical guide to mindfulness and meditation for busy professionals who want to reduce stress and improve focus..."
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  required
                />
              </div>

              <div className={styles.selectGroup}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>AI Provider</label>
                  <Select name="provider" value={provider} onValueChange={setProvider}>
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
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Model</label>
                  <Select name="model" value={model} onValueChange={setModel}>
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
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className={styles.actions}>
                <Button type="submit" disabled={!idea.trim() || isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className={styles.spinner} />
                      Generating...
                    </>
                  ) : (
                    "Generate Ideas"
                  )}
                </Button>
              </div>
            </Form>

            {isSubmitting && (
              <div className={styles.loading}>
                <Loader2 className={styles.spinner} />
                <p className={styles.loadingText}>AI is brainstorming your book ideas...</p>
              </div>
            )}

            {results && !isSubmitting && (
              <div className={styles.results}>
                <h2 className={styles.resultsTitle}>Your Book Ideas</h2>

                <div className={styles.titlesSection}>
                  <h3 className={styles.sectionTitle}>Suggested Titles</h3>
                  <ul className={styles.titlesList}>
                    {results.titles.map((title, index) => (
                      <li
                        key={index}
                        className={`${styles.titleItem} ${selectedTitle === title ? styles.selected : ""}`}
                        onClick={() => setSelectedTitle(title)}
                      >
                        {title}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={styles.outlineSection}>
                  <h3 className={styles.sectionTitle}>Suggested Outline</h3>
                  <div className={styles.outlineContent}>
                    <pre className={styles.outlineText}>{results.outline}</pre>
                  </div>
                </div>

                <div className={styles.actions}>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Start Over
                  </Button>
                  
                  <Form method="post" style={{ display: 'inline' }}>
                    <input type="hidden" name="actionType" value="selectTitle" />
                    <input type="hidden" name="sessionId" value={sessionId || ''} />
                    <input type="hidden" name="selectedTitle" value={selectedTitle || ''} />
                    <Button type="submit" disabled={!selectedTitle}>
                      Use This Outline
                    </Button>
                  </Form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
