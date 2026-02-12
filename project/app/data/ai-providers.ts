export interface AIModel {
  id: string;
  name: string;
}

export interface AIProvider {
  id: string;
  name: string;
  models: AIModel[];
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    models: [
      { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
      { id: "gpt-4", name: "GPT-4" },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    models: [
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
      { id: "claude-3-opus-20240229", name: "Claude 3 Opus" },
      { id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet" },
      { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku" },
    ],
  },
  {
    id: "google",
    name: "Google Gemini",
    models: [
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
    ],
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    models: [
      { id: "grok-4-latest", name: "Grok 4" },
      { id: "grok-beta", name: "Grok Beta" },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    models: [
      { id: "deepseek-llm-7b-instruct", name: "DeepSeek LLM 7B" },
    ],
  },
];

export const TONE_OPTIONS = [
  { id: "professional", name: "Professional & Authoritative" },
  { id: "conversational", name: "Conversational & Friendly" },
  { id: "inspirational", name: "Inspirational & Motivational" },
  { id: "academic", name: "Academic & Scholarly" },
  { id: "humorous", name: "Humorous & Witty" },
  { id: "storytelling", name: "Narrative & Storytelling" },
  { id: "custom", name: "Custom Tone..." },
];

export const EXPORT_FORMATS = [
  { value: "pdf", label: "PDF Document", description: "Best for printing and sharing" },
  { value: "epub", label: "EPUB Ebook", description: "Best for e-readers and Kindle" },
  { value: "markdown", label: "Markdown", description: "Best for editing and formatting" },
  { value: "html", label: "HTML", description: "Best for web publishing" },
];
