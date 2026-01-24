export interface AIProvider {
  id: string;
  name: string;
  description: string;
  requiresApiKey: boolean;
  models: AIModel[];
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  bestFor: string[];
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: "auto",
    name: "Auto - Best Available",
    description: "Automatically selects the best AI provider based on your API keys",
    requiresApiKey: false,
    models: [
      {
        id: "auto",
        name: "Auto Select",
        description: "Automatically chooses the best model",
        bestFor: ["all"],
      },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4 and GPT-3.5 models for high-quality content generation",
    requiresApiKey: true,
    models: [
      {
        id: "gpt-4-turbo",
        name: "GPT-4 Turbo",
        description: "Latest GPT-4 with improved performance",
        bestFor: ["long-form", "creative", "technical"],
      },
      {
        id: "gpt-4",
        name: "GPT-4",
        description: "Most capable model for complex writing tasks",
        bestFor: ["long-form", "creative", "technical"],
      },
      {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        description: "Fast and efficient for most writing tasks",
        bestFor: ["brainstorming", "outlines", "quick-generation"],
      },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    description: "Claude models for nuanced, context-aware writing",
    requiresApiKey: true,
    models: [
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        description: "Latest and most capable Claude model",
        bestFor: ["long-form", "creative", "analysis", "coding"],
      },
      {
        id: "claude-3-opus-20240229",
        name: "Claude 3 Opus",
        description: "Most powerful Claude model for complex tasks",
        bestFor: ["long-form", "creative", "analysis"],
      },
      {
        id: "claude-3-sonnet-20240229",
        name: "Claude 3 Sonnet",
        description: "Balanced performance and speed",
        bestFor: ["general", "brainstorming", "editing"],
      },
    ],
  },
  {
    id: "google",
    name: "Google Gemini",
    description: "Gemini models for versatile content creation",
    requiresApiKey: true,
    models: [
      {
        id: "gemini-1.5-pro",
        name: "Gemini 1.5 Pro",
        description: "Advanced model with large context window",
        bestFor: ["long-form", "technical", "research"],
      },
      {
        id: "gemini-1.5-flash",
        name: "Gemini 1.5 Flash",
        description: "Fast and efficient model",
        bestFor: ["brainstorming", "quick-generation", "outlines"],
      },
    ],
  },
  {
    id: "xai",
    name: "xAI Grok",
    description: "Grok models with real-time knowledge",
    requiresApiKey: true,
    models: [
      {
        id: "grok-4-latest",
        name: "Grok 4",
        description: "Latest Grok model with real-time knowledge",
        bestFor: ["current-events", "research", "creative"],
      },
      {
        id: "grok-beta",
        name: "Grok Beta",
        description: "Latest Grok model with current information",
        bestFor: ["current-events", "research", "general"],
      },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    description: "Open-source models via Hugging Face",
    requiresApiKey: true,
    models: [
      {
        id: "deepseek-llm-7b-instruct",
        name: "DeepSeek LLM 7B",
        description: "Efficient open-source model",
        bestFor: ["general", "brainstorming", "outlines"],
      },
    ],
  },
];

export const TONE_OPTIONS = [
  { value: "auto", label: "Let AI Decide", description: "AI chooses the best tone" },
  { value: "formal", label: "Formal", description: "Professional and authoritative" },
  { value: "casual", label: "Casual", description: "Friendly and conversational" },
  { value: "storytelling", label: "Storytelling", description: "Narrative and engaging" },
  { value: "academic", label: "Academic", description: "Scholarly and research-focused" },
  { value: "persuasive", label: "Persuasive", description: "Convincing and sales-oriented" },
  { value: "custom", label: "Custom Tone", description: "Define your own writing style" },
];

export const EXPORT_FORMATS = [
  { value: "pdf", label: "PDF", description: "KDP-compliant PDF format" },
  { value: "epub", label: "EPUB", description: "KDP-compliant EPUB format" },
  { value: "markdown", label: "Markdown", description: "Plain text with formatting" },
  { value: "html", label: "HTML", description: "Web-ready HTML format" },
];
