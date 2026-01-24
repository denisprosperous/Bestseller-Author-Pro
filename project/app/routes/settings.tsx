import React from "react";
import { Check, X, Info, AlertCircle, Loader2 } from "lucide-react";
import type { Route } from "./+types/settings";
import { Navigation } from "~/components/navigation";
import { Button } from "~/components/ui/button/button";
import { Input } from "~/components/ui/input/input";
import { Alert, AlertDescription } from "~/components/ui/alert/alert";
import { AI_PROVIDERS } from "~/data/ai-providers";
import { apiKeyService, type APIKey } from "~/services/api-key-service";
import { AuthService } from "~/services/auth-service";
import { ProtectedRoute } from "~/components/protected-route";
import styles from "./settings.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Settings - Bestseller Author Pro" },
    { name: "description", content: "Configure your AI provider API keys" },
  ];
}

export default function Settings() {
  const [apiKeys, setApiKeys] = React.useState<Record<string, string>>({});
  const [savedKeys, setSavedKeys] = React.useState<APIKey[]>([]);
  const [showKeys, setShowKeys] = React.useState<Record<string, boolean>>({});
  const [loading, setLoading] = React.useState(false);
  const [loadingProvider, setLoadingProvider] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Helper function to get authenticated user ID
  const getUserId = async (): Promise<string> => {
    const userId = await AuthService.getUserId();
    if (!userId) {
      throw new Error("User not authenticated");
    }
    return userId;
  };

  // Load saved API keys on mount
  React.useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const userId = await getUserId();
      const keys = await apiKeyService.getAllApiKeys(userId);
      setSavedKeys(keys);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = async (providerId: string) => {
    const key = apiKeys[providerId];
    if (!key || !key.trim()) {
      setError("Please enter an API key");
      return;
    }

    try {
      setLoadingProvider(providerId);
      setError(null);
      setSuccess(null);

      const userId = await getUserId();
      await apiKeyService.saveApiKey(userId, providerId, key);

      setSuccess(`${AI_PROVIDERS.find((p) => p.id === providerId)?.name} API key saved securely`);

      // Clear the input
      setApiKeys((prev) => ({ ...prev, [providerId]: "" }));
      setShowKeys((prev) => ({ ...prev, [providerId]: false }));

      // Reload saved keys
      await loadApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save API key");
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleRemoveKey = async (providerId: string) => {
    const providerName = AI_PROVIDERS.find((p) => p.id === providerId)?.name;
    if (!confirm(`Are you sure you want to delete the ${providerName} API key?`)) {
      return;
    }

    try {
      setLoadingProvider(providerId);
      setError(null);
      setSuccess(null);

      const userId = await getUserId();
      await apiKeyService.deleteApiKey(userId, providerId);

      setSuccess(`${providerName} API key deleted`);
      setApiKeys((prev) => {
        const updated = { ...prev };
        delete updated[providerId];
        return updated;
      });

      await loadApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete API key");
    } finally {
      setLoadingProvider(null);
    }
  };

  const isConfigured = (providerId: string) => {
    return savedKeys.some((key) => key.provider === providerId);
  };

  // Auto-dismiss success message
  React.useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <ProtectedRoute>
      <div className={styles.container}>
        <Navigation />

      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.description}>
            Configure your AI provider API keys. Keys are encrypted using AES-256-CBC and stored securely in Supabase.
          </p>
        </header>

        {error && (
          <Alert variant="destructive" className={styles.errorAlert}>
            <AlertCircle className={styles.alertIconSmall} />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className={styles.successAlert}>
            <Check className={styles.alertIconSmall} />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className={styles.section}>
          <div className={styles.alert}>
            <Info className={styles.alertIcon} />
            <div className={styles.alertContent}>
              <h3 className={styles.alertTitle}>Secure API Key Storage</h3>
              <p className={styles.alertText}>
                Your API keys are encrypted with AES-256-CBC encryption before storage. They are protected by Row Level
                Security (RLS) policies and never shared. Keys are only used to make requests to the respective AI
                providers on your behalf. You can remove them at any time.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>AI Provider API Keys</h2>

          {loading && !loadingProvider ? (
            <div className={styles.loadingState}>
              <Loader2 className={styles.spinner} />
              <p>Loading API keys...</p>
            </div>
          ) : (
            <div className={styles.providers}>
              {AI_PROVIDERS.map((provider) => (
                <div key={provider.id} className={styles.provider}>
                  <div className={styles.providerHeader}>
                    <div className={styles.providerInfo}>
                      <h3 className={styles.providerName}>{provider.name}</h3>
                      <p className={styles.providerDesc}>{provider.description}</p>
                    </div>

                    <div
                      className={`${styles.providerStatus} ${isConfigured(provider.id) ? styles.configured : styles.notConfigured}`}
                    >
                      {isConfigured(provider.id) ? (
                        <>
                          <Check className={styles.statusIcon} />
                          Configured
                        </>
                      ) : (
                        <>
                          <X className={styles.statusIcon} />
                          Not Configured
                        </>
                      )}
                    </div>
                  </div>

                  <div className={styles.keyInput}>
                    <Input
                      type={showKeys[provider.id] ? "text" : "password"}
                      placeholder={`Enter ${provider.name} API key`}
                      value={apiKeys[provider.id] || ""}
                      onChange={(e) => setApiKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))}
                      className={styles.keyInputField}
                      disabled={loadingProvider === provider.id}
                    />

                    {isConfigured(provider.id) ? (
                      <Button
                        variant="outline"
                        onClick={() => handleRemoveKey(provider.id)}
                        disabled={loadingProvider === provider.id}
                      >
                        {loadingProvider === provider.id ? (
                          <>
                            <Loader2 className={styles.buttonSpinner} />
                            Removing...
                          </>
                        ) : (
                          "Remove"
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSaveKey(provider.id)}
                        disabled={!apiKeys[provider.id] || loadingProvider === provider.id}
                      >
                        {loadingProvider === provider.id ? (
                          <>
                            <Loader2 className={styles.buttonSpinner} />
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Getting API Keys</h2>
          <div className={styles.alertContent}>
            <p className={styles.alertText}>
              <strong>OpenAI:</strong> Visit{" "}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                platform.openai.com/api-keys
              </a>
              <br />
              <strong>Anthropic:</strong> Visit{" "}
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">
                console.anthropic.com/settings/keys
              </a>
              <br />
              <strong>Google Gemini:</strong> Visit{" "}
              <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                makersuite.google.com/app/apikey
              </a>
              <br />
              <strong>xAI Grok:</strong> Visit{" "}
              <a href="https://console.x.ai" target="_blank" rel="noopener noreferrer">
                console.x.ai
              </a>
              <br />
              <strong>DeepSeek (Hugging Face):</strong> Visit{" "}
              <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer">
                huggingface.co/settings/tokens
              </a>
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
