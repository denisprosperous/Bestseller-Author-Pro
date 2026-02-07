
import { useState, useEffect } from "react";
import { Form, useNavigate } from "react-router";
import { createClient } from "@supabase/supabase-js";
import { Button } from "~/components/ui/button/button";
import { Input } from "~/components/ui/input/input";
import { Label } from "~/components/ui/label/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert/alert";

export default function SetupSupabase() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [status, setStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Load existing values
    const storedUrl = localStorage.getItem("supabase_project_url");
    const storedKey = localStorage.getItem("supabase_anon_key");
    
    if (storedUrl) setUrl(storedUrl);
    if (storedKey) setKey(storedKey);
  }, []);

  const testConnection = async (testUrl: string, testKey: string) => {
    try {
      setStatus("testing");
      const client = createClient(testUrl, testKey);
      
      // Try a simple public query or auth check
      const { data, error } = await client.from("plans").select("count").limit(1);
      
      // Even if plans table is empty/RLS blocked, a 401/403 is better than "Invalid API Key"
      // But typically "Invalid API Key" throws a specific error structure or 401 with specific message
      
      if (error && error.message.includes("Invalid API key")) {
        throw new Error("Invalid API Key");
      }
      
      // Also try auth check
      const { error: authError } = await client.auth.getSession();
      if (authError && authError.message.includes("Invalid API key")) {
        throw new Error("Invalid API Key");
      }

      setStatus("success");
      setMessage("Connection successful! Settings saved.");
      
      // Save to localStorage
      localStorage.setItem("supabase_project_url", testUrl);
      localStorage.setItem("supabase_anon_key", testKey);
      
      // Reload after a short delay to apply changes
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
      
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setMessage(err.message || "Failed to connect. Check your URL and Key.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !key) {
      setStatus("error");
      setMessage("Please fill in all fields");
      return;
    }
    testConnection(url.trim(), key.trim());
  };

  const handleClear = () => {
    localStorage.removeItem("supabase_project_url");
    localStorage.removeItem("supabase_anon_key");
    setUrl("");
    setKey("");
    setMessage("Settings cleared.");
    setStatus("idle");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Supabase Connection Setup</CardTitle>
          <CardDescription>
            Fix "Invalid API Key" errors by manually configuring your connection.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Project URL</Label>
              <Input
                id="url"
                placeholder="https://your-project.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Found in Supabase Dashboard: Settings &gt; API &gt; Project URL
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="key">Anon Public Key</Label>
              <Input
                id="key"
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Found in Supabase Dashboard: Settings &gt; API &gt; Project API keys &gt; anon public
              </p>
            </div>

            {status === "error" && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {status === "success" && (
              <Alert className="bg-green-50 border-green-200 text-green-800">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1" disabled={status === "testing"}>
                {status === "testing" ? "Testing..." : "Save & Test Connection"}
              </Button>
              <Button type="button" variant="outline" onClick={handleClear}>
                Clear
              </Button>
            </div>
          </Form>
        </CardContent>
        <CardFooter className="justify-center border-t pt-4">
          <p className="text-xs text-gray-400 text-center">
            These settings are saved to your browser's LocalStorage and will override any server-side configuration.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
