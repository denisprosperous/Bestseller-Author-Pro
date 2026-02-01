/**
 * Demo Mode Configuration
 * 
 * PRODUCTION MODE: Demo mode is permanently disabled.
 * All demo exports are kept for backward compatibility but should not be used.
 */

export const DEMO_MODE = false as const;

// Deprecated: Do not use in production
export const DEMO_USER = {
  id: "demo-user-123",
  email: "demo@example.com",
  created_at: new Date().toISOString()
};

// Deprecated: Do not use in production
export const DEMO_EBOOK = {
  id: "demo-ebook-1",
  title: "The Complete Guide to AI-Powered Content Creation",
  subtitle: "Transform Your Ideas into Professional Publications",
  topic: "AI content creation",
  chapters: [
    {
      id: "chapter-1",
      number: 1,
      title: "Introduction to AI Content Creation",
      content: `# Introduction to AI Content Creation

Welcome to the revolutionary world of AI-powered content creation. In this comprehensive guide, you'll discover how artificial intelligence is transforming the way we write, create, and publish content.

## The AI Revolution in Writing

Artificial Intelligence has fundamentally changed how we approach content creation. What once took weeks of research, writing, and editing can now be accomplished in hours with the right AI tools and techniques.

### Key Benefits of AI Content Creation

1. **Speed and Efficiency**: Generate high-quality content in minutes rather than hours
2. **Consistency**: Maintain a consistent tone and style across all your content
3. **Scalability**: Create multiple pieces of content simultaneously
4. **Research Integration**: AI can incorporate vast amounts of information seamlessly

## Understanding AI Writing Tools

Modern AI writing tools use advanced language models trained on billions of text samples. These models understand context, tone, and structure, allowing them to generate human-like content that serves your specific needs.

### Popular AI Writing Platforms

- **GPT-4**: OpenAI's flagship model for creative and technical writing
- **Claude**: Anthropic's AI assistant known for nuanced understanding
- **Gemini**: Google's multimodal AI for comprehensive content creation

## Getting Started

The key to successful AI content creation lies in understanding how to craft effective prompts and guide the AI to produce exactly what you need. Throughout this guide, we'll explore proven techniques and strategies that will transform your content creation process.`,
      wordCount: 1250
    },
    {
      id: "chapter-2", 
      number: 2,
      title: "Crafting Effective AI Prompts",
      content: `# Crafting Effective AI Prompts

The art of prompt engineering is crucial for getting the best results from AI writing tools. A well-crafted prompt can mean the difference between generic content and precisely targeted, high-quality writing.

## The Anatomy of a Great Prompt

Every effective AI prompt contains several key elements that guide the AI toward your desired outcome:

### 1. Clear Context
Always provide the AI with sufficient background information. Instead of asking "Write about marketing," specify "Write a comprehensive guide to digital marketing for small businesses with limited budgets."

### 2. Specific Instructions
Be explicit about what you want. Include details about:
- Tone and style
- Target audience
- Content length
- Format requirements
- Key points to cover

### 3. Examples and Templates
When possible, provide examples of the type of content you're looking for. This helps the AI understand your expectations and maintain consistency.

## Advanced Prompting Techniques

### The Chain-of-Thought Method
Break complex requests into smaller, logical steps. This helps the AI process information more effectively and produce more coherent results.

### Role-Playing Prompts
Ask the AI to assume a specific role or expertise level. For example: "As a senior marketing consultant with 15 years of experience, explain the most effective strategies for..."

### Iterative Refinement
Don't expect perfection on the first try. Use follow-up prompts to refine and improve the content:
- "Make this more conversational"
- "Add specific examples"
- "Simplify the language for beginners"

## Common Prompting Mistakes

Avoid these common pitfalls that can lead to poor AI output:

1. **Being too vague**: Generic prompts produce generic content
2. **Overloading with information**: Too much context can confuse the AI
3. **Ignoring tone specifications**: Always specify the desired tone
4. **Not providing constraints**: Set clear boundaries for length and scope

## Practical Examples

Here are some before-and-after examples of prompt improvement:

**Poor Prompt**: "Write about social media"

**Improved Prompt**: "Write a 1,500-word beginner's guide to social media marketing for local restaurants. Include practical tips for Facebook, Instagram, and TikTok. Use a friendly, encouraging tone and include specific examples of successful posts."

The improved prompt provides context, specifies the audience, sets length requirements, defines the scope, establishes tone, and requests examples.

## Testing and Iteration

Always test your prompts and be prepared to iterate. What works for one type of content may not work for another. Keep a library of successful prompts for future use.`,
      wordCount: 1850
    }
  ],
  metadata: {
    wordCount: 3100,
    chapterCount: 2,
    aiProvider: "openai",
    aiModel: "gpt-4-turbo",
    tone: "professional",
    audience: "content creators and marketers",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  status: "completed" as const
};

export const DEMO_BRAINSTORM_RESULT = {
  titles: [
    "The Complete Guide to AI-Powered Content Creation",
    "Mastering AI Writing: From Beginner to Expert",
    "The Content Creator's AI Toolkit",
    "AI Writing Revolution: Transform Your Content Strategy",
    "Smart Content: How AI is Changing the Writing Game"
  ],
  outline: `# The Complete Guide to AI-Powered Content Creation

## Chapter 1: Introduction to AI Content Creation
- The AI revolution in writing
- Benefits of AI-powered content
- Understanding AI writing tools
- Getting started with AI content creation

## Chapter 2: Crafting Effective AI Prompts
- The anatomy of a great prompt
- Advanced prompting techniques
- Common mistakes to avoid
- Practical examples and templates

## Chapter 3: Content Strategy with AI
- Planning your content calendar
- Maintaining brand voice consistency
- Scaling content production
- Quality control and editing

## Chapter 4: Advanced AI Writing Techniques
- Long-form content creation
- Multi-format content adaptation
- SEO optimization with AI
- Personalization at scale

## Chapter 5: Tools and Platforms
- Comprehensive tool comparison
- Integration strategies
- Workflow optimization
- Cost-benefit analysis

## Chapter 6: Future of AI Content Creation
- Emerging trends and technologies
- Ethical considerations
- Building sustainable AI workflows
- Preparing for the next evolution`,
  topic: "AI content creation",
  provider: "openai",
  model: "gpt-4-turbo"
};