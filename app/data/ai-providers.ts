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
    description: "GPT-5.2 and GPT-4 models for high-quality content generation",
    requiresApiKey: true,
    models: [
      {
        id: "auto",
        name: "Best Available",
        description: "Automatically chooses the latest/best model for your API key",
        bestFor: ["all"],
      },
      {
        id: "gpt-5.2",
        name: "GPT-5.2 (Latest)",
        description: "Latest GPT-5.2 with breakthrough performance and reasoning",
        bestFor: ["long-form", "creative", "technical", "complex-reasoning"],
      },
      {
        id: "gpt-5",
        name: "GPT-5",
        description: "Advanced GPT-5 model with superior capabilities",
        bestFor: ["long-form", "creative", "technical"],
      },
      {
        id: "gpt-4-turbo",
        name: "GPT-4 Turbo",
        description: "Proven GPT-4 Turbo with excellent performance",
        bestFor: ["long-form", "creative", "technical"],
      },
      {
        id: "gpt-4",
        name: "GPT-4",
        description: "Reliable model for complex writing tasks",
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
    description: "Claude 4 and Claude 3.5 models for nuanced, context-aware writing",
    requiresApiKey: true,
    models: [
      {
        id: "auto",
        name: "Best Available",
        description: "Automatically chooses the latest Claude model for your API key",
        bestFor: ["all"],
      },
      {
        id: "claude-4-opus",
        name: "Claude 4 Opus (Latest)",
        description: "Latest and most powerful Claude model with exceptional reasoning",
        bestFor: ["long-form", "creative", "analysis", "complex-reasoning"],
      },
      {
        id: "claude-4-sonnet",
        name: "Claude 4 Sonnet",
        description: "Balanced Claude 4 model with great performance",
        bestFor: ["long-form", "creative", "analysis"],
      },
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        description: "Proven Claude 3.5 model with excellent capabilities",
        bestFor: ["long-form", "creative", "analysis", "coding"],
      },
      {
        id: "claude-3-opus-20240229",
        name: "Claude 3 Opus",
        description: "Powerful Claude 3 model for complex tasks",
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
    description: "Gemini 2 and 1.5 models for versatile content creation",
    requiresApiKey: true,
    models: [
      {
        id: "auto",
        name: "Best Available",
        description: "Automatically chooses the latest Gemini model for your API key",
        bestFor: ["all"],
      },
      {
        id: "gemini-2-pro",
        name: "Gemini 2 Pro (Latest)",
        description: "Latest Gemini 2 with breakthrough multimodal capabilities",
        bestFor: ["long-form", "technical", "research", "multimodal"],
      },
      {
        id: "gemini-2-flash",
        name: "Gemini 2 Flash",
        description: "Fast Gemini 2 model with excellent efficiency",
        bestFor: ["brainstorming", "quick-generation", "outlines"],
      },
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
    description: "Grok 3 models with real-time knowledge and reasoning",
    requiresApiKey: true,
    models: [
      {
        id: "auto",
        name: "Best Available",
        description: "Automatically chooses the latest Grok model for your API key",
        bestFor: ["all"],
      },
      {
        id: "grok-3",
        name: "Grok 3 (Latest)",
        description: "Latest Grok 3 with advanced reasoning and real-time knowledge",
        bestFor: ["current-events", "research", "creative", "reasoning"],
      },
      {
        id: "grok-2-latest",
        name: "Grok 2",
        description: "Proven Grok 2 model with current information",
        bestFor: ["current-events", "research", "general"],
      },
      {
        id: "grok-beta",
        name: "Grok Beta",
        description: "Beta Grok model with experimental features",
        bestFor: ["current-events", "research", "creative"],
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
        id: "auto",
        name: "Best Available",
        description: "Automatically chooses the best DeepSeek model for your API key",
        bestFor: ["all"],
      },
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
