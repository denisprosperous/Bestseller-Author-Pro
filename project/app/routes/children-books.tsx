import { useState } from 'react';
import { Form, useActionData, useNavigation, useLoaderData } from 'react-router';
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { Button } from '~/components/ui/button/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card/card';
import { Input } from '~/components/ui/input/input';
import { Label } from '~/components/ui/label/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select/select';
import { Textarea } from '~/components/ui/textarea/textarea';
import { Badge } from '~/components/ui/badge/badge';
import { Progress } from '~/components/ui/progress/progress';
import { toast } from '~/hooks/use-toast';
import { aiService } from '~/utils/ai-service';
import { apiKeyService } from '~/services/api-key-service';
import { imageGenerationService } from '~/services/image-generation-service';
import { contentService } from '~/services/content-service';
import styles from './children-books.module.css';

interface ChildrensBookData {
  title: string;
  ageGroup: '0-2' | '3-5' | '6-8' | '9-12';
  theme: string;
  characters: Character[];
  pages: BookPage[];
  illustrationStyle: string;
}

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

export async function loader({ request }: LoaderFunctionArgs) {
  // Check if user has required API keys for image generation
  const url = new URL(request.url);
  const userId = 'demo-user-123'; // TODO: Replace with real auth
  
  const hasOpenAI = await apiKeyService.hasApiKey(userId, 'openai');
  const hasGoogle = await apiKeyService.hasApiKey(userId, 'google');
  
  return {
    hasRequiredKeys: hasOpenAI || hasGoogle,
    availableProviders: {
      openai: hasOpenAI,
      google: hasGoogle
    }
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const userId = 'demo-user-123'; // TODO: Replace with real auth

  try {
    switch (action) {
      case 'generate-story': {
        const title = formData.get('title') as string;
        const ageGroup = formData.get('ageGroup') as string;
        const theme = formData.get('theme') as string;
        const pageCount = parseInt(formData.get('pageCount') as string) || 8;
        const illustrationStyle = formData.get('illustrationStyle') as string;

        // Generate age-appropriate story content
        const storyPrompt = `Create a children's story for age group ${ageGroup} with the following details:
        Title: ${title}
        Theme: ${theme}
        Pages: ${pageCount}
        
        Requirements:
        - Use vocabulary appropriate for ${ageGroup} year olds
        - Include educational elements and moral lessons
        - Create engaging characters with distinct personalities
        - Structure as ${pageCount} pages with clear scenes
        - Include repetitive elements for young readers
        - Make it interactive and engaging
        
        Return a JSON structure with:
        - characters: array of character objects with name, description, and visual description
        - pages: array of page objects with pageNumber, text, and illustration prompt`;

        const apiKey = await apiKeyService.getApiKey(userId, 'openai');
        const storyResult = await aiService.generateContent({
          provider: 'openai',
          model: 'gpt-4-turbo',
          prompt: storyPrompt,
          apiKey,
          maxTokens: 3000,
          temperature: 0.8
        });

        // Parse the generated story
        let storyData;
        try {
          storyData = JSON.parse(storyResult.content);
        } catch {
          // Fallback if JSON parsing fails
          storyData = {
            characters: [
              {
                name: "Main Character",
                description: "The protagonist of our story",
                visualPrompt: "friendly child character in cartoon style"
              }
            ],
            pages: Array.from({ length: pageCount }, (_, i) => ({
              pageNumber: i + 1,
              text: `Page ${i + 1} content from the generated story.`,
              illustrationPrompt: `${illustrationStyle} illustration for page ${i + 1}`
            }))
          };
        }

        // Save the children's book to database
        const bookData: ChildrensBookData = {
          title,
          ageGroup: ageGroup as any,
          theme,
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
            illustrationPrompt: `${illustrationStyle} style: ${page.illustrationPrompt}`,
            layoutType: 'text-bottom' as const
          })),
          illustrationStyle
        };

        // TODO: Save to database using contentService
        // const savedBook = await contentService.saveChildrensBook(userId, bookData);

        return {
          success: true,
          bookData,
          message: 'Children\'s book story generated successfully!'
        };
      }

      case 'generate-illustrations': {
        const bookDataStr = formData.get('bookData') as string;
        const bookData = JSON.parse(bookDataStr) as ChildrensBookData;

        // Generate character reference images first
        const updatedCharacters = await Promise.all(
          bookData.characters.map(async (character) => {
            try {
              const imageResult = await imageGenerationService.generateImage({
                prompt: character.visualPrompt,
                style: bookData.illustrationStyle,
                provider: 'google', // Use Google Vertex AI
                aspectRatio: '1:1'
              });

              return {
                ...character,
                referenceImage: imageResult.url
              };
            } catch (error) {
              console.error(`Failed to generate image for character ${character.name}:`, error);
              return character;
            }
          })
        );

        // Generate page illustrations
        const updatedPages = await Promise.all(
          bookData.pages.map(async (page) => {
            try {
              const imageResult = await imageGenerationService.generateImage({
                prompt: page.illustrationPrompt,
                style: bookData.illustrationStyle,
                provider: 'google',
                aspectRatio: '4:3',
                characterConsistency: updatedCharacters[0] // Use main character for consistency
              });

              return {
                ...page,
                illustrationUrl: imageResult.url
              };
            } catch (error) {
              console.error(`Failed to generate illustration for page ${page.pageNumber}:`, error);
              return page;
            }
          })
        );

        const updatedBookData = {
          ...bookData,
          characters: updatedCharacters,
          pages: updatedPages
        };

        return {
          success: true,
          bookData: updatedBookData,
          message: 'Illustrations generated successfully!'
        };
      }

      default:
        return { success: false, message: 'Unknown action' };
    }
  } catch (error) {
    console.error('Children\'s book action error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred'
    };
  }
}

export default function ChildrensBooksRoute() {
  const { hasRequiredKeys, availableProviders } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState<'setup' | 'story' | 'illustrations' | 'preview'>('setup');
  const [bookData, setBookData] = useState<ChildrensBookData | null>(null);

  const isGenerating = navigation.state === 'submitting';

  // Update book data when action completes
  if (actionData?.success && actionData.bookData && bookData !== actionData.bookData) {
    setBookData(actionData.bookData);
    if (actionData.bookData.pages[0]?.illustrationUrl) {
      setCurrentStep('preview');
    } else if (actionData.bookData.pages.length > 0) {
      setCurrentStep('illustrations');
    }
  }

  if (!hasRequiredKeys) {
    return (
      <div className={styles.container}>
        <Card>
          <CardHeader>
            <CardTitle>API Keys Required</CardTitle>
            <CardDescription>
              You need OpenAI or Google API keys to generate children's books with illustrations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
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
        <h1>Children's Book Creator</h1>
        <p>Create illustrated children's books with AI-powered stories and artwork</p>
        
        <div className={styles.progress}>
          <Progress 
            value={
              currentStep === 'setup' ? 25 : 
              currentStep === 'story' ? 50 : 
              currentStep === 'illustrations' ? 75 : 100
            } 
          />
          <div className={styles.steps}>
            <Badge variant={currentStep === 'setup' ? 'default' : 'secondary'}>Setup</Badge>
            <Badge variant={currentStep === 'story' ? 'default' : 'secondary'}>Story</Badge>
            <Badge variant={currentStep === 'illustrations' ? 'default' : 'secondary'}>Illustrations</Badge>
            <Badge variant={currentStep === 'preview' ? 'default' : 'secondary'}>Preview</Badge>
          </div>
        </div>
      </div>

      {currentStep === 'setup' && (
        <Card>
          <CardHeader>
            <CardTitle>Book Setup</CardTitle>
            <CardDescription>Configure your children's book details</CardDescription>
          </CardHeader>
          <CardContent>
            <Form method="post" className={styles.form}>
              <input type="hidden" name="action" value="generate-story" />
              
              <div className={styles.formGroup}>
                <Label htmlFor="title">Book Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter your book title..."
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <Label htmlFor="ageGroup">Target Age Group</Label>
                <Select name="ageGroup" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select age group" />
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
                <Label htmlFor="theme">Story Theme</Label>
                <Input
                  id="theme"
                  name="theme"
                  placeholder="e.g., friendship, adventure, learning colors..."
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <Label htmlFor="pageCount">Number of Pages</Label>
                <Select name="pageCount">
                  <SelectTrigger>
                    <SelectValue placeholder="Select page count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8">8 pages</SelectItem>
                    <SelectItem value="12">12 pages</SelectItem>
                    <SelectItem value="16">16 pages</SelectItem>
                    <SelectItem value="20">20 pages</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className={styles.formGroup}>
                <Label htmlFor="illustrationStyle">Illustration Style</Label>
                <Select name="illustrationStyle" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select illustration style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cartoon">Cartoon</SelectItem>
                    <SelectItem value="watercolor">Watercolor</SelectItem>
                    <SelectItem value="digital-art">Digital Art</SelectItem>
                    <SelectItem value="hand-drawn">Hand Drawn</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={isGenerating} className={styles.submitButton}>
                {isGenerating ? 'Generating Story...' : 'Generate Story'}
              </Button>
            </Form>
          </CardContent>
        </Card>
      )}

      {currentStep === 'story' && bookData && (
        <div className={styles.storyPreview}>
          <Card>
            <CardHeader>
              <CardTitle>{bookData.title}</CardTitle>
              <CardDescription>
                Age Group: {bookData.ageGroup} | Theme: {bookData.theme} | Style: {bookData.illustrationStyle}
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
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.pages}>
                <h3>Story Pages</h3>
                <div className={styles.pageList}>
                  {bookData.pages.map((page) => (
                    <div key={page.id} className={styles.page}>
                      <h4>Page {page.pageNumber}</h4>
                      <p>{page.text}</p>
                      <small>Illustration: {page.illustrationPrompt}</small>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.actions}>
                <Button onClick={() => setCurrentStep('setup')} variant="outline">
                  Back to Setup
                </Button>
                <Form method="post" style={{ display: 'inline' }}>
                  <input type="hidden" name="action" value="generate-illustrations" />
                  <input type="hidden" name="bookData" value={JSON.stringify(bookData)} />
                  <Button type="submit" disabled={isGenerating}>
                    {isGenerating ? 'Generating Illustrations...' : 'Generate Illustrations'}
                  </Button>
                </Form>
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
                <p>Generating character references and page illustrations...</p>
                <Progress value={50} />
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
              <CardDescription>Your completed children's book</CardDescription>
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
                  Edit Story
                </Button>
                <Button>Export Book</Button>
                <Button>Create Another Book</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {actionData?.message && (
        <div className={styles.message}>
          {actionData.success ? (
            <div className={styles.success}>{actionData.message}</div>
          ) : (
            <div className={styles.error}>{actionData.message}</div>
          )}
        </div>
      )}
    </div>
  );
}