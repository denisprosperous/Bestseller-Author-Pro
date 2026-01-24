# Features Guide - Bestseller Author Pro v1.1

## Table of Contents
1. [Auto AI Provider Selection](#auto-ai-provider-selection)
2. [Manual Provider & Model Selection](#manual-provider--model-selection)
3. [Custom Writing Tone](#custom-writing-tone)
4. [Workflow Examples](#workflow-examples)

---

## Auto AI Provider Selection

### Overview
The Auto AI Provider feature automatically selects the best available AI provider based on your configured API keys. This simplifies the user experience and ensures optimal performance without requiring technical knowledge of different AI models.

### How It Works

**Provider Selection Order:**
1. OpenAI (GPT-4 Turbo)
2. Anthropic (Claude 3.5 Sonnet)
3. xAI (Grok 4)
4. Google (Gemini 1.5 Pro)
5. DeepSeek (via Hugging Face)

The system checks for available API keys in this order and uses the first available provider.

### When to Use Auto Mode

✅ **Recommended for:**
- First-time users
- Quick content generation
- Users who don't want to manage provider details
- Testing the platform
- Production content when you have multiple API keys

❌ **Not recommended for:**
- Specific model requirements
- Cost optimization for specific use cases
- Testing provider-specific features
- Comparing output quality across providers

### Using Auto Mode

**In Brainstorm Page:**
```
1. Go to Brainstorm page
2. Select "Auto - Best Available" in AI Provider dropdown
3. Select "Auto Select" in Model dropdown (auto-selected)
4. Enter your book idea
5. Click "Generate Ideas"
```

**In Builder Page:**
```
1. Go to Builder page
2. Fill in book details
3. In AI Configuration section:
   - Select "Auto - Best Available" for AI Provider
   - "Auto Select" will be chosen for Model
4. Configure other settings
5. Click "Generate Book"
```

---

## Manual Provider & Model Selection

### Overview
Power users can manually select specific AI providers and models for fine-grained control over content generation quality, cost, and performance.

### Available Providers & Models

#### 1. OpenAI
**Best for:** Professional content, technical writing, long-form content

**Models:**
- **GPT-4 Turbo** - Latest GPT-4, improved performance
- **GPT-4** - Most capable for complex tasks
- **GPT-3.5 Turbo** - Fast and efficient, lower cost

**Use Cases:**
- Professional ebooks
- Technical documentation
- Educational content
- Business writing

---

#### 2. Anthropic Claude
**Best for:** Nuanced writing, analysis, creative content

**Models:**
- **Claude 3.5 Sonnet** - Latest and most capable
- **Claude 3 Opus** - Complex tasks, deep analysis
- **Claude 3 Sonnet** - Balanced performance

**Use Cases:**
- Creative fiction
- Long-form essays
- Research-based content
- Analytical writing

---

#### 3. Google Gemini
**Best for:** Technical content, research, large context

**Models:**
- **Gemini 1.5 Pro** - Large context window, technical
- **Gemini 1.5 Flash** - Fast, efficient generation

**Use Cases:**
- Research papers
- Technical guides
- Data-heavy content
- Academic writing

---

#### 4. xAI Grok
**Best for:** Current events, real-time information

**Models:**
- **Grok 4** - Latest with real-time knowledge
- **Grok Beta** - Current information access

**Use Cases:**
- News-based content
- Current events books
- Trend analysis
- Up-to-date information

---

#### 5. DeepSeek
**Best for:** Open-source, cost-effective content

**Models:**
- **DeepSeek LLM 7B** - Efficient open-source model

**Use Cases:**
- Budget-friendly projects
- Testing and development
- Simple content generation

---

### Model Selection Strategy

**For Brainstorming:**
- Use faster, cheaper models (GPT-3.5, Gemini Flash, Claude Sonnet)
- Auto mode works well for idea generation

**For Full Ebook Generation:**
- Use premium models (GPT-4 Turbo, Claude 3.5 Sonnet, Gemini Pro)
- Consider cost vs. quality tradeoff
- Manual selection recommended for production content

**For Outline Improvement:**
- Mid-tier models sufficient (GPT-4, Claude Sonnet)
- Balance between quality and cost

---

## Custom Writing Tone

### Overview
The Custom Writing Tone feature allows you to define your exact writing style beyond the preset options. This gives you complete control over the voice, personality, and stylistic elements of your ebook.

### Preset Tones

**Available Presets:**
1. **Let AI Decide** (Auto) - AI chooses appropriate tone
2. **Formal** - Professional and authoritative
3. **Casual** - Friendly and conversational
4. **Storytelling** - Narrative and engaging
5. **Academic** - Scholarly and research-focused
6. **Persuasive** - Convincing and sales-oriented
7. **Custom Tone** - Your own definition

### Using Custom Tone

**When to Use Custom Tone:**
✅ Unique brand voice required
✅ Specific style guidelines to follow
✅ Emulating a particular author's style
✅ Niche-specific writing conventions
✅ Multi-dimensional tone requirements

**Custom Tone Input Field:**
Located in Builder page, appears when "Custom Tone" is selected.

**What to Include in Custom Tone Description:**

1. **Voice Characteristics**
   - Conversational, formal, technical, casual
   - First person, second person, third person
   - Active vs. passive voice

2. **Personality Traits**
   - Authoritative, friendly, humorous, serious
   - Empathetic, analytical, inspirational
   - Professional, casual, academic

3. **Stylistic Elements**
   - Sentence length (short/punchy vs. long/complex)
   - Paragraph structure
   - Use of rhetorical questions
   - Metaphors and analogies
   - Examples and anecdotes

4. **Prohibited Elements**
   - Words or phrases to avoid
   - Clichés to exclude
   - Overly complex jargon

### Custom Tone Examples

#### Example 1: Seth Godin Style
```
Write in a conversational, thought-provoking tone similar to Seth Godin. 
Use short paragraphs (2-3 sentences each). Include personal anecdotes 
and real-world examples. Ask rhetorical questions to engage readers. 
Avoid jargon and corporate speak. Be direct and actionable. Use 
analogies to explain complex ideas simply.
```

#### Example 2: Academic Research
```
Use formal academic tone with third-person perspective. Include 
citations and references to research. Use complex sentence structures 
with clear logical flow. Avoid contractions and colloquialisms. 
Include transitional phrases. Present evidence-based arguments with 
multiple supporting points.
```

#### Example 3: Motivational Self-Help
```
Write in an uplifting, inspirational tone using second-person ("you"). 
Be empathetic and understanding of reader challenges. Use personal 
stories and transformational narratives. Include actionable steps and 
practical exercises. Be encouraging without being cheesy. Use powerful, 
emotional language while remaining authentic.
```

#### Example 4: Technical Tutorial
```
Use clear, instructional tone with step-by-step guidance. Write in 
second person with imperative sentences. Include specific examples 
and code snippets. Explain technical concepts in simple terms before 
diving into complexity. Use headings, bullet points, and numbered 
lists. Avoid assumptions about reader knowledge.
```

#### Example 5: Business Professional
```
Professional but approachable tone. Use first-person plural ("we") 
to build rapport. Include industry-specific terminology but explain 
it clearly. Reference case studies and ROI examples. Focus on practical 
business outcomes. Use data and statistics to support points. Balance 
authority with accessibility.
```

#### Example 6: Humorous Non-Fiction
```
Conversational and humorous tone with witty observations. Use pop 
culture references and relatable scenarios. Include self-deprecating 
humor. Write as if talking to a friend over coffee. Break the fourth 
wall occasionally. Use parenthetical asides and footnotes for jokes. 
Maintain readability while being entertaining.
```

### Custom Tone Best Practices

**Do:**
✅ Be specific about voice and style
✅ Include examples of what you want
✅ Specify what to avoid
✅ Mention target audience expectations
✅ Reference similar authors if helpful
✅ Include structural preferences

**Don't:**
❌ Be too vague ("write well")
❌ Contradict yourself (formal + casual)
❌ Over-specify every detail
❌ Use technical writing terminology without explaining
❌ Forget about your target audience
❌ Copy exact copyrighted styles

---

## Workflow Examples

### Workflow 1: Quick Ebook (Auto Mode)

**Goal:** Generate a complete ebook quickly without technical decisions

**Steps:**
1. **Brainstorm**
   - Provider: Auto - Best Available
   - Model: Auto Select
   - Enter book idea
   - Select favorite title and outline

2. **Build**
   - Provider: Auto - Best Available
   - Model: Auto Select
   - Tone: Let AI Decide
   - Fill in basic details
   - Paste/upload outline
   - Generate

3. **Preview & Export**
   - Review content
   - Apply humanization
   - Export as PDF/EPUB

**Time:** ~10-15 minutes (depending on length)

---

### Workflow 2: Professional Ebook (Manual Control)

**Goal:** High-quality ebook with specific style requirements

**Steps:**
1. **Brainstorm**
   - Provider: OpenAI
   - Model: GPT-3.5 Turbo (fast, good for ideas)
   - Generate multiple title options
   - Select and refine outline

2. **Build**
   - Provider: Anthropic
   - Model: Claude 3.5 Sonnet (quality writing)
   - Tone: Custom
   - Custom Tone: "Professional yet accessible, with real-world 
     examples. Use second person. Avoid jargon."
   - Enable outline improvement
   - Generate with refined settings

3. **Preview & Edit**
   - Review for quality
   - Make manual edits
   - Apply 4-phase humanization
   - Check KDP compliance

4. **Export**
   - Export as PDF and EPUB
   - Verify formatting

**Time:** ~30-45 minutes

---

### Workflow 3: Multi-Style Comparison

**Goal:** Generate same content with different AI providers for comparison

**Steps:**
1. **Create Base Outline** (once)
   - Use brainstorm or manual outline
   - Save outline text

2. **Generate with OpenAI**
   - Provider: OpenAI
   - Model: GPT-4 Turbo
   - Tone: Professional
   - Generate and export

3. **Generate with Anthropic**
   - Provider: Anthropic
   - Model: Claude 3.5 Sonnet
   - Same settings
   - Generate and export

4. **Compare Results**
   - Review both versions
   - Choose best or combine elements

**Time:** ~40-60 minutes

---

### Workflow 4: Cost-Optimized Production

**Goal:** Maximize quality while minimizing API costs

**Steps:**
1. **Brainstorm with Budget Model**
   - Provider: OpenAI
   - Model: GPT-3.5 Turbo (cheaper)
   - Generate outline quickly

2. **Improve Outline with Premium**
   - Provider: Anthropic
   - Model: Claude 3.5 Sonnet
   - Enhance structure (one-time cost)

3. **Generate with Mid-Tier**
   - Provider: Google
   - Model: Gemini 1.5 Flash (balanced)
   - Use improved outline
   - Generate full content

4. **Polish**
   - Apply humanization (free)
   - Manual edits as needed
   - Export

**Time:** ~25-35 minutes

---

### Workflow 5: Brand-Specific Ebook

**Goal:** Ebook matching exact brand voice and guidelines

**Steps:**
1. **Define Custom Tone**
   - Document brand voice guidelines
   - Create detailed custom tone description
   - Include do's and don'ts

2. **Brainstorm**
   - Provider: Auto or preferred
   - Generate multiple options
   - Select best fit for brand

3. **Build with Custom Tone**
   - Provider: Anthropic (best for nuance)
   - Model: Claude 3.5 Sonnet
   - Tone: Custom
   - Paste brand voice description
   - Generate

4. **Review for Brand Compliance**
   - Check against brand guidelines
   - Adjust tone description if needed
   - Regenerate specific sections
   - Apply final polish

5. **Export**
   - KDP-compliant format
   - Brand-consistent output

**Time:** ~1-2 hours (including brand definition)

---

## Tips & Tricks

### Provider Selection
- **Start with Auto** - Let the system choose for you
- **Test providers** - Same prompt, different providers = different results
- **Consider cost** - GPT-3.5 is 10x cheaper than GPT-4
- **Check rate limits** - Some providers have stricter limits

### Tone Customization
- **Be specific** - "Conversational" is vague, describe exactly what that means
- **Use examples** - "Like Malcolm Gladwell" gives clear direction
- **Iterate** - Refine tone description based on output
- **Save templates** - Keep successful tone descriptions for reuse

### Quality Optimization
- **Outline matters** - Better outline = better content
- **Improve outlines** - Use AI to enhance before generation
- **Chunk large books** - Generate chapters separately for better quality
- **Humanize everything** - Always apply 4-phase humanization

### Cost Management
- **Brainstorm cheap** - Use budget models for ideas
- **Generate premium** - Use best models for final content
- **Monitor usage** - Track API costs across providers
- **Batch operations** - Generate multiple sections at once

---

## Troubleshooting

### "Auto provider not working"
- **Check:** At least one API key must be configured
- **Solution:** Add API keys in Settings page

### "Custom tone not applying"
- **Check:** Tone is set to "Custom Tone"
- **Check:** Custom tone description is filled out
- **Solution:** Make description more specific

### "Model not available"
- **Check:** Selected provider supports chosen model
- **Solution:** Choose compatible model or switch providers

### "Generation quality poor"
- **Check:** Using appropriate model for task
- **Check:** Outline is clear and detailed
- **Solution:** Use premium model or improve outline

---

## Next Steps

1. **Experiment** with different providers and models
2. **Create** your custom tone templates
3. **Document** what works best for your use cases
4. **Share** successful configurations with team
5. **Optimize** costs while maintaining quality

---

**Need Help?** Check the main [README.md](./README.md) or [QUICKSTART.md](./QUICKSTART.md)
