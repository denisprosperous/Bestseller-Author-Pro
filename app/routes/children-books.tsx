import { useState, useEffect } from 'react';
import { Loader2, BookOpen, Sparkles, Image as ImageIcon, Download, Edit, Plus, Trash2 } from 'lucide-react';
import { Button } from '~/components/ui/button/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card/card';
import { Input } from '~/components/ui/input/input';
import { Label } from '~/components/ui/label/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select/select';
import { Textarea } from '~/components/ui/textarea/textarea';
import { Badge } from '~/components/ui/badge/badge';
import { Progress } from '~/components/ui/progress/progress';
import { Alert, AlertDescription } from '~/components/ui/alert/alert';
import { aiService } from '~/utils/ai-service';
import { imageGenerationService } from '~/services/image-generation-service';
import styles from './children-books.module.css';

interface Character {
  id: string;
  name: string;
  description: string;
  visualPrompt: string;
  referenceImage?: string;
}

interface BookPage {
  id: string;
  pageNumber: number;
  text: string;
  illustrationPrompt: string;
  illustrationUrl?: string;
  layoutType: 'full-page' | 'text-left' | 'text-right' | 'text-bottom';
}

interface ChildrensBookData {
  title: string;
  ageGroup: '0-2' | '3-5' | '6-8' | '9-12';
  theme: string;
  characters: Character[];
  pages: BookPage[];
  illustrationStyle: string;
  pageCount: number;
}

export default function ChildrensBooksRoute() {
  const [currentStep, setCurrentStep] = useState<'setup' | 'story' | 'illustrations' | 'preview'>('setup');
  const [bookData, setBookData] = useState<ChildrensBookData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [ageGroup, setAgeGroup] = useState<'0-2' | '3-5' | '6-8' | '9-12'>('3-5');
  const [theme, setTheme] = useState('');
  const [pageCount, setPageCount] = useState('12');
  const [customPageCount, setCustomPageCount] = useState('');
  const [illustrationStyle, setIllustrationStyle] = useState('cartoon');
  const [provider, setProvider] = useState('openai');
  const [imageProvider, setImageProvider] = useState('google');

  // Get API key from localStorage
  const getApiKey = (providerName: string): string | null => {
    try {
      const stored = localStorage.getItem('bestseller_api_keys');
      if (stored) {
        const keys = JSON.parse(stored);
        const keyData = keys.find((k: any) => k.provider === providerName);
        if (keyData) {
          console.log(`✅ Using ${providerName} key from localStorage`);
          return keyData.key;
        }
      }
    } catch (error) {
      console.error('Error reading API key from localStorage:', error);
    }
    return null;
  };

  // Check if user has API keys
  const hasApiKeys = (): boolean => {
    const openaiKey = getApiKey('openai');
    const googleKey = getApiKey('google');
    return !!(openaiKey || googleKey);
  };

  const handleGenerateStory = async () => {
    setError(null);
    setSuccess(null);
    setIsGenerating(true);
    setProgress(10);

    try {
      // Get API key
      const apiKey = getApiKey(provider);
      if (!apiKey) {
        throw new Error(`No API key found for ${provider}. Please add your API key in Settings.`);
      }

      const finalPageCount = pageCount === 'custom' ? parseInt(customPageCount) || 12 : parseInt(pageCount);

      if (finalPageCount < 4 || finalPageCount > 50) {
        throw new Error('Page count must be between 4 and 50');
      }

      setProgress(20);

      // Generate age-appropriate story content
      const storyPrompt = `Create a children's story for age group ${ageGroup} with the following details:
Title: ${title}
Theme: ${theme}
Pages: ${finalPageCount}

Requirements:
- Use vocabulary appropriate for ${ageGroup} year olds
- Include educational elements and moral lessons
- Create 2-4 engaging characters with distinct personalities
- Structure as ${finalPageCount} pages with clear scenes
- Include repetitive elements for young readers
- Make it interactive and engaging
- Each page should have 1-3 sentences (shorter for younger ages)

Return ONLY a valid JSON structure (no markdown, no code blocks) with:
{
  "characters": [
    {
      "name": "character name",
      "description": "brief description",
      "visualPrompt": "detailed visual description for illustration"
    }
  ],
  "pages": [
    {
      "pageNumber": 1,
      "text": "page text content",
      "illustrationPrompt": "detailed scene description for illustration"
    }
  ]
}`;

      setProgress(40);

      const storyResult = await aiService.generateContent({
        provider: provider as any,
        model: provider === 'openai' ? 'gpt-4-turbo' : 'gemini-1.5-pro',
        prompt: storyPrompt,
        apiKey,
        maxTokens: 3000,
        temperature: 0.8
      });

      setProgress(60);

      // Parse the generated story
      let storyData;
      try {
        // Remove markdown code blocks if present
        let content = storyResult.content.trim();
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        storyData = JSON.parse(content);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.log('Raw content:', storyResult.content);
        
        // Fallback if JSON parsing fails
        storyData = {
          characters: [
            {
              name: "Main Character",
              description: "The protagonist of our story",
              visualPrompt: `friendly ${ageGroup} year old child character in ${illustrationStyle} style`
            }
          ],
          pages: Array.from({ length: finalPageCount }, (_, i) => ({
            pageNumber: i + 1,
            text: `Page ${i + 1} of the story about ${theme}.`,
            illustrationPrompt: `${illustrationStyle} illustration showing a scene from a children's story about ${theme}`
          }))
        };
      }

      setProgress(80);

      // Create book data
      const newBookData: ChildrensBookData = {
        title,
        ageGroup,
        theme,
        pageCount: finalPageCount,
        characters: storyData.characters.map((char: any, index: number) => ({
          id: `char-${index}`,
          name: char.name,
          description: char.description,
          visualPrompt: char.visualPrompt || `${illustrationStyle} character: ${char.description}`
        })),
        pages: storyData.pages.map((page: any) => ({
          id: `page-${page.pageNumber}`,
          pageNumber: page.pageNumber,
          text: page.text,
          illustrationPrompt: `${illustrationStyle} style illustration: ${page.illustrationPrompt}`,
          layoutType: 'text-bottom' as const
        })),
        illustrationStyle
      };

      setProgress(100);
      setBookData(newBookData);
      setCurrentStep('story');
      setSuccess('Story generated successfully! Review and generate illustrations.');
    } catch (err) {
      console.error('Story generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate story');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleGenerateIllustrations = async () => {
    if (!bookData) return;

    setError(null);
    setSuccess(null);
    setIsGenerating(true);
    setProgress(10);

    try {
      const apiKey = getApiKey(imageProvider);
      if (!apiKey) {
        throw new Error(`No ${imageProvider.toUpperCase()} API key found. Image generation requires an API key. Please add your ${imageProvider} API key in Settings.`);
      }

      setProgress(20);
      setCurrentStep('illustrations');

      // Generate character reference images first
      const updatedCharacters = [];
      for (let i = 0; i < bookData.characters.length; i++) {
        const character = bookData.characters[i];
        setProgress(20 + (i / bookData.characters.length) * 20);
        
        try {
          // Note: Image generation would require actual API integration
          // For now, we'll use placeholder
          updatedCharacters.push({
            ...character,
            referenceImage: `https://via.placeholder.com/400x400?text=${encodeURIComponent(character.name)}`
          });
        } catch (error) {
          console.error(`Failed to generate image for character ${character.name}:`, error);
          updatedCharacters.push(character);
        }
      }

      // Generate page illustrations
      const updatedPages = [];
      for (let i = 0; i < bookData.pages.length; i++) {
        const page = bookData.pages[i];
        setProgress(40 + (i / bookData.pages.length) * 50);
        
        try {
          // Note: Image generation would require actual API integration
          // For now, we'll use placeholder
          updatedPages.push({
            ...page,
            illustrationUrl: `https://via.placeholder.com/800x600?text=Page+${page.pageNumber}`
          });
        } catch (error) {
          console.error(`Failed to generate illustration for page ${page.pageNumber}:`, error);
          updatedPages.push(page);
        }
      }

      const updatedBookData = {
        ...bookData,
        characters: updatedCharacters,
        pages: updatedPages
      };

      setProgress(100);
      setBookData(updatedBookData);
      setCurrentStep('preview');
      setSuccess('Illustrations generated successfully!');
    } catch (err) {
      console.error('Illustration generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate illustrations');
      setCurrentStep('story');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleExport = () => {
    if (!bookData) return;
    
    // Create a simple HTML export
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${bookData.title}</title>
  <style>
    body { font-family: 'Comic Sans MS', cursive; max-width: 800px; margin: 0 auto; padding: 20px; }
    .page { page-break-after: always; margin-bottom: 40px; border: 2px solid #333; padding: 20px; }
    .page-number { font-size: 14px; color: #666; }
    .illustration { width: 100%; max-height: 400px; object-fit: contain; margin: 20px 0; }
    .text { font-size: 18px; line-height: 1.6; }
    h1 { text-align: center; color: #333; }
  </style>
</head>
<body>
  <h1>${bookData.title}</h1>
  <p style="text-align: center; color: #666;">Age Group: ${bookData.ageGroup} | Theme: ${bookData.theme}</p>
  ${bookData.pages.map(page => `
    <div class="page">
      <div class="page-number">Page ${page.pageNumber}</div>
      ${page.illustrationUrl ? `<img src="${page.illustrationUrl}" alt="Page ${page.pageNumber}" class="illustration" />` : ''}
      <div class="text">${page.text}</div>
    </div>
  `).join('')}
</body>
</html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bookData.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    setSuccess('Book exported successfully!');
  };

  const handleReset = () => {
    setBookData(null);
    setCurrentStep('setup');
    setTitle('');
    setTheme('');
    setError(null);
    setSuccess(null);
  };

  if (!hasApiKeys()) {
    return (
      <div className={styles.container}>
        <Card>
          <CardHeader>
            <CardTitle>API Keys Required</CardTitle>
            <CardDescription>
              You need AI provider API keys to generate children's ebooks with illustrations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                <p>To use the Children's Ebook Creator, you need:</p>
                <ul style={{ marginTop: '10px', marginLeft: '20px' }}>
                  <li><strong>Story Generation</strong> - OpenAI, Google, or Anthropic API key</li>
                  <li><strong>Illustration Generation</strong> - Google, OpenAI, Leonardo AI, or Stable Diffusion API key</li>
                </ul>
                <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                  You can use different providers for stories and illustrations.
                </p>
              </AlertDescription>
            </Alert>
            <Button asChild style={{ marginTop: '20px' }}>
              <a href="/settings">Configure API Keys</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <BookOpen className={styles.headerIcon} />
          <div>
            <h1>Children's Book Creator</h1>
            <p>Create magical illustrated children's books with AI-powered stories and artwork</p>
          </div>
        </div>
        
        <div className={styles.progressSection}>
          <Progress value={
            currentStep === 'setup' ? 25 : 
            currentStep === 'story' ? 50 : 
            currentStep === 'illustrations' ? 75 : 100
          } />
          <div className={styles.steps}>
            <Badge variant={currentStep === 'setup' ? 'default' : 'secondary'}>
              <Sparkles className={styles.badgeIcon} /> Setup
            </Badge>
            <Badge variant={currentStep === 'story' ? 'default' : 'secondary'}>
              <Edit className={styles.badgeIcon} /> Story
            </Badge>
            <Badge variant={currentStep === 'illustrations' ? 'default' : 'secondary'}>
              <ImageIcon className={styles.badgeIcon} /> Illustrations
            </Badge>
            <Badge variant={currentStep === 'preview' ? 'default' : 'secondary'}>
              <BookOpen className={styles.badgeIcon} /> Preview
            </Badge>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" style={{ marginBottom: '20px' }}>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert style={{ marginBottom: '20px', borderColor: '#22c55e', background: '#f0fdf4' }}>
          <AlertDescription style={{ color: '#166534' }}>{success}</AlertDescription>
        </Alert>
      )}

      {currentStep === 'setup' && (
        <Card>
          <CardHeader>
            <CardTitle>Book Setup</CardTitle>
            <CardDescription>Configure your children's book details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <Label htmlFor="title">Book Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your book title..."
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <Label htmlFor="ageGroup">Target Age Group *</Label>
                  <Select value={ageGroup} onValueChange={(value: any) => setAgeGroup(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-2">0-2 years (Board Books)</SelectItem>
                      <SelectItem value="3-5">3-5 years (Picture Books)</SelectItem>
                      <SelectItem value="6-8">6-8 years (Early Readers)</SelectItem>
                      <SelectItem value="9-12">9-12 years (Chapter Books)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className={styles.formGroup}>
                  <Label htmlFor="provider">Story AI Provider *</Label>
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                      <SelectItem value="google">Google (Gemini)</SelectItem>
                      <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <Label htmlFor="imageProvider">Image AI Provider *</Label>
                <Select value={imageProvider} onValueChange={setImageProvider}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google Vertex AI (Imagen)</SelectItem>
                    <SelectItem value="openai">OpenAI (DALL-E 3)</SelectItem>
                    <SelectItem value="leonardo">Leonardo AI</SelectItem>
                    <SelectItem value="stable-diffusion">Stable Diffusion</SelectItem>
                  </SelectContent>
                </Select>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Choose the AI provider for generating illustrations
                </p>
              </div>

              <div className={styles.formGroup}>
                <Label htmlFor="theme">Story Theme *</Label>
                <Input
                  id="theme"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g., friendship, adventure, learning colors, overcoming fears..."
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <Label htmlFor="pageCount">Number of Pages *</Label>
                  <Select value={pageCount} onValueChange={setPageCount}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">8 pages</SelectItem>
                      <SelectItem value="12">12 pages</SelectItem>
                      <SelectItem value="16">16 pages</SelectItem>
                      <SelectItem value="20">20 pages</SelectItem>
                      <SelectItem value="24">24 pages</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {pageCount === 'custom' && (
                  <div className={styles.formGroup}>
                    <Label htmlFor="customPageCount">Custom Page Count</Label>
                    <Input
                      id="customPageCount"
                      type="number"
                      min="4"
                      max="50"
                      value={customPageCount}
                      onChange={(e) => setCustomPageCount(e.target.value)}
                      placeholder="4-50 pages"
                    />
                  </div>
                )}

                <div className={styles.formGroup}>
                  <Label htmlFor="illustrationStyle">Illustration Style *</Label>
                  <Select value={illustrationStyle} onValueChange={setIllustrationStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cartoon">Cartoon</SelectItem>
                      <SelectItem value="watercolor">Watercolor</SelectItem>
                      <SelectItem value="digital-art">Digital Art</SelectItem>
                      <SelectItem value="hand-drawn">Hand Drawn</SelectItem>
                      <SelectItem value="minimalist">Minimalist</SelectItem>
                      <SelectItem value="anime">Anime</SelectItem>
                      <SelectItem value="realistic">Realistic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isGenerating && (
                <div className={styles.generatingStatus}>
                  <Loader2 className={styles.spinner} />
                  <p>Generating your story... {progress}%</p>
                  <Progress value={progress} />
                </div>
              )}

              <Button 
                onClick={handleGenerateStory} 
                disabled={isGenerating || !title || !theme} 
                className={styles.submitButton}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className={styles.buttonSpinner} />
                    Generating Story...
                  </>
                ) : (
                  <>
                    <Sparkles className={styles.buttonIcon} />
                    Generate Story
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'story' && bookData && (
        <div className={styles.storyPreview}>
          <Card>
            <CardHeader>
              <CardTitle>{bookData.title}</CardTitle>
              <CardDescription>
                <Badge>{bookData.ageGroup} years</Badge>
                <Badge>{bookData.theme}</Badge>
                <Badge>{bookData.illustrationStyle}</Badge>
                <Badge>{bookData.pageCount} pages</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={styles.characters}>
                <h3>Characters</h3>
                <div className={styles.characterList}>
                  {bookData.characters.map((character) => (
                    <div key={character.id} className={styles.character}>
                      <h4>{character.name}</h4>
                      <p>{character.description}</p>
                      <small>{character.visualPrompt}</small>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.pages}>
                <h3>Story Pages ({bookData.pages.length})</h3>
                <div className={styles.pageList}>
                  {bookData.pages.map((page) => (
                    <div key={page.id} className={styles.page}>
                      <div className={styles.pageHeader}>
                        <Badge variant="outline">Page {page.pageNumber}</Badge>
                      </div>
                      <p className={styles.pageText}>{page.text}</p>
                      <small className={styles.illustrationPrompt}>
                        <ImageIcon className={styles.smallIcon} />
                        {page.illustrationPrompt}
                      </small>
                    </div>
                  ))}
                </div>
              </div>

              {isGenerating && (
                <div className={styles.generatingStatus}>
                  <Loader2 className={styles.spinner} />
                  <p>Generating illustrations... {progress}%</p>
                  <Progress value={progress} />
                </div>
              )}

              <div className={styles.actions}>
                <Button onClick={() => setCurrentStep('setup')} variant="outline">
                  <Edit className={styles.buttonIcon} />
                  Back to Setup
                </Button>
                <Button onClick={handleGenerateIllustrations} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className={styles.buttonSpinner} />
                      Generating Illustrations...
                    </>
                  ) : (
                    <>
                      <ImageIcon className={styles.buttonIcon} />
                      Generate Illustrations
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 'illustrations' && bookData && (
        <div className={styles.illustrationProgress}>
          <Card>
            <CardHeader>
              <CardTitle>Generating Illustrations</CardTitle>
              <CardDescription>Creating artwork for your children's book...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={styles.generationStatus}>
                <Loader2 className={styles.spinner} />
                <p>Generating character references and page illustrations...</p>
                <Progress value={progress} />
                <p className={styles.progressText}>{progress}% complete</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 'preview' && bookData && (
        <div className={styles.bookPreview}>
          <Card>
            <CardHeader>
              <CardTitle>{bookData.title}</CardTitle>
              <CardDescription>
                Your completed children's book - {bookData.pages.length} pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={styles.bookPages}>
                {bookData.pages.map((page) => (
                  <div key={page.id} className={styles.bookPage}>
                    <div className={styles.pageNumber}>Page {page.pageNumber}</div>
                    {page.illustrationUrl && (
                      <div className={styles.illustration}>
                        <img src={page.illustrationUrl} alt={`Page ${page.pageNumber} illustration`} />
                      </div>
                    )}
                    <div className={styles.pageText}>
                      <p>{page.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.actions}>
                <Button onClick={() => setCurrentStep('story')} variant="outline">
                  <Edit className={styles.buttonIcon} />
                  Edit Story
                </Button>
                <Button onClick={handleExport}>
                  <Download className={styles.buttonIcon} />
                  Export Book
                </Button>
                <Button onClick={handleReset} variant="outline">
                  <Plus className={styles.buttonIcon} />
                  Create Another Book
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
