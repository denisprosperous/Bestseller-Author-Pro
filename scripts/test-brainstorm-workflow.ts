
import { aiService } from '../app/utils/ai-service';
import { contentService } from '../app/services/content-service';
import { AI_PROVIDERS } from '../app/data/ai-providers';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

// Initialize Supabase client for admin operations
const supabaseUrl = process.env.VITE_SUPABASE_PROJECT_URL;
const supabaseKey = process.env.VITE_SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAdminUserId() {
  // Try to find the admin user created earlier
  const { data: users, error } = await supabase.from('auth.users').select('id').eq('email', 'admin@bestseller.pro').single();
  
  if (users) return users.id;
  
  // If not found, get the first user
  const { data: firstUser } = await supabase.from('auth.users').select('id').limit(1).single();
  if (firstUser) return firstUser.id;

  throw new Error('No user found to assign ebooks to. Please run database/create_admin_user.sql first.');
}

async function runTest() {
  console.log('🚀 Starting Brainstorm Workflow Test...');
  
  const userId = await getAdminUserId();
  console.log(`👤 Using User ID: ${userId}`);

  // Providers to test (excluding 'auto')
  const providersToTest = AI_PROVIDERS.filter(p => p.id !== 'auto');

  for (const provider of providersToTest) {
    console.log(`\n----------------------------------------`);
    console.log(`🧪 Testing Provider: ${provider.name} (${provider.id})`);
    console.log(`----------------------------------------`);

    // Get API Key from environment variable
    // Env vars should be named VITE_OPENAI_API_KEY, VITE_ANTHROPIC_API_KEY, etc.
    const envKeyName = `VITE_${provider.id.toUpperCase()}_API_KEY`;
    const apiKey = process.env[envKeyName];

    if (!apiKey) {
      console.warn(`⚠️  Skipping ${provider.name}: No API Key found in ${envKeyName}`);
      continue;
    }

    try {
      // 1. Validate Key
      console.log(`🔑 Validating API Key...`);
      const validation = await aiService.testApiKey(provider.id, apiKey);
      if (!validation.valid) {
        throw new Error(`Invalid API Key: ${validation.error}`);
      }
      console.log(`✅ API Key is valid.`);

      // 2. List Available Models
      const availableModels = provider.models.filter(m => m.id !== 'auto').map(m => m.id);
      console.log(`📋 Available Models: ${availableModels.join(', ')}`);

      // 3. Generate Content (Brainstorming + Ebook)
      const topic = `Capabilities of ${provider.name} AI`;
      const prompt = `Write 3 paragraphs about the capabilities of ${provider.name} models. 
      Specifically mention these available models: ${availableModels.join(', ')}.
      This is a test of the generation workflow.`;

      console.log(`📝 Generating content with model: ${availableModels[0]}...`);
      
      const content = await aiService.generateEbook({
        topic: topic,
        wordCount: 500,
        tone: 'formal',
        audience: 'Developers',
        provider: provider.id,
        model: availableModels[0], // Use first available model
        apiKey: apiKey
      });

      console.log(`✅ Content generated successfully (${content.length} chars).`);

      // 4. Save as Ebook
      const ebookData = {
        title: `Test Ebook - ${provider.name}`,
        subtitle: `Generated via API Test`,
        topic: topic,
        outline: '1. Introduction\n2. Capabilities\n3. Conclusion',
        chapters: [
          {
            id: 'ch1',
            number: 1,
            title: 'Capabilities Overview',
            content: content,
            wordCount: content.split(/\s+/).length
          }
        ],
        metadata: {
          wordCount: content.split(/\s+/).length,
          chapterCount: 1,
          aiProvider: provider.id,
          aiModel: availableModels[0],
          tone: 'formal',
          audience: 'Developers',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        status: 'completed'
      };

      console.log(`💾 Saving Ebook to database...`);
      // Direct DB insert since we're in a script environment
      const { data: savedEbook, error: saveError } = await supabase
        .from('ebooks')
        .insert({
          user_id: userId,
          title: ebookData.title,
          subtitle: ebookData.subtitle,
          topic: ebookData.topic,
          outline: ebookData.outline,
          status: ebookData.status,
          metadata: ebookData.metadata
        })
        .select()
        .single();

      if (saveError) throw saveError;
      
      console.log(`✅ Ebook saved! ID: ${savedEbook.id}`);

    } catch (error) {
      console.error(`❌ Failed test for ${provider.name}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`\n----------------------------------------`);
  console.log('🎉 Test Complete.');
}

runTest().catch(console.error);
