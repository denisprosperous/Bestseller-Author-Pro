# Changelog

## Version 1.1.0 - AI Provider Auto-Selection & Custom Tone

### New Features

#### 1. Auto AI Provider Selection
- **Auto-Select Option**: Added "Auto - Best Available" option for AI providers
- Automatically selects the best AI provider based on available API keys
- Preference order: OpenAI → Anthropic → xAI → Google → DeepSeek
- Available on both Brainstorm and Builder pages
- Auto-selects the best model for each provider when "Auto" is chosen

#### 2. Manual AI Provider & Model Selection
- **Brainstorm Page**: Full AI provider and model selection controls
- **Builder Page**: Enhanced AI configuration section with provider/model selection
- Dynamic model list updates based on selected provider
- Auto-selection of first available model when switching providers
- Descriptive hints for each provider and model

#### 3. Custom Writing Tone
- **Pre-defined Tones**:
  - Let AI Decide (Auto)
  - Formal
  - Casual
  - Storytelling
  - Academic
  - Persuasive
  - **Custom Tone** (NEW)

- **Custom Tone Input**: 
  - Textarea field appears when "Custom Tone" is selected
  - Users can describe their exact writing style
  - Example: "Conversational yet authoritative, with humor and real-world examples"
  - AI uses the custom description to match the writing style

#### 4. Enhanced AI Service
- Auto-provider detection logic
- Default model mapping for each provider
- Custom tone handling in content generation
- Improved error handling and fallback mechanisms

### Technical Changes

#### Files Modified

1. **app/data/ai-providers.ts**
   - Added "Auto" provider option at the top of the list
   - Reordered tone options to put "Auto" first
   - Added "Custom Tone" option with description

2. **app/routes/brainstorm.tsx**
   - Changed default provider from "openai" to "auto"
   - Changed default model from "gpt-4" to "auto"
   - Added useEffect to auto-select model when provider changes
   - Enhanced AI provider selection UI

3. **app/routes/builder.tsx**
   - Changed default provider from "openai" to "auto"
   - Changed default model from "gpt-4" to "auto"
   - Added `customTone` state variable
   - Added conditional custom tone textarea
   - Added useEffect for auto-model selection
   - Enhanced AI configuration section

4. **app/utils/ai-service.ts**
   - Added `getDefaultModel()` method
   - Enhanced `generateContent()` to handle "auto" provider/model
   - Updated `generateEbook()` to accept `customTone` parameter
   - Custom tone integration in prompt generation

5. **app/services/api-key-service.ts**
   - Fixed encryption reference (replaced with simpleEncode/simpleDecode)
   - Browser-safe encoding/decoding implementation

### User Experience Improvements

1. **Simplified Workflow**: Users can start with "Auto" and let the system choose
2. **Power User Control**: Advanced users can select specific providers and models
3. **Flexibility**: Custom tone option for unique writing styles
4. **Smart Defaults**: Auto-selection ensures best available options
5. **Clear Guidance**: Hints and descriptions for all options

### How to Use

#### Auto Mode (Recommended for Most Users)
```
1. Select "Auto - Best Available" for AI Provider
2. Select "Auto Select" for Model
3. Choose "Let AI Decide" for Tone
4. Enter your content requirements
5. Generate
```

#### Manual Mode (Power Users)
```
1. Select specific AI Provider (e.g., "OpenAI")
2. Select specific Model (e.g., "GPT-4 Turbo")
3. Choose a tone or select "Custom Tone"
4. If custom, describe your writing style in detail
5. Generate
```

#### Custom Tone Example
```
Tone: Custom Tone

Custom Style Description:
"Write in a conversational, friendly tone similar to Seth Godin. 
Use short paragraphs, personal anecdotes, and thought-provoking 
questions. Avoid jargon and corporate speak. Include actionable 
insights and real-world examples."
```

### API Integration

All AI providers now support:
- Auto-selection based on API key availability
- Model auto-detection
- Custom tone instructions
- Graceful fallback if preferred provider is unavailable

### Next Steps

Future enhancements planned:
- AI provider cost comparison
- Token usage tracking
- Model performance analytics
- Advanced tone customization with examples
- Multi-provider content comparison

---

**Note**: Ensure API keys are configured in Settings for the providers you want to use. The Auto mode will automatically use the best available provider based on your active API keys.
