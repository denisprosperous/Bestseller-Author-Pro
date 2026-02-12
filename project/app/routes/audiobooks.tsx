import { useState } from 'react';
import { Form, useActionData, useLoaderData, useNavigation } from 'react-router';
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { Button } from '~/components/ui/button/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card/card';
import { Badge } from '~/components/ui/badge/badge';
import { distributionService } from '~/services/distribution-service';
import { supabase } from '~/lib/supabase';
import { Mic, Play, Download, Radio, Music } from 'lucide-react';

export async function loader({ request }: LoaderFunctionArgs) {
  // In a real app, we would fetch the user's audiobooks from Supabase
  // For now, we'll return some mock data if the DB is empty
  
  const { data: audiobooks, error } = await supabase
    .from('audiobooks')
    .select('*')
    .limit(10);

  if (error || !audiobooks || audiobooks.length === 0) {
    return {
      audiobooks: [
        {
          id: 'mock-1',
          title: 'The Future of AI Publishing',
          author: 'Jane Doe',
          duration: 3600, // 1 hour
          cover_image: 'https://placehold.co/400x400?text=Audiobook+1',
          status: 'ready',
          created_at: new Date().toISOString()
        },
        {
          id: 'mock-2',
          title: 'Children\'s Stories Collection',
          author: 'John Smith',
          duration: 1800, // 30 mins
          cover_image: 'https://placehold.co/400x400?text=Audiobook+2',
          status: 'processing',
          created_at: new Date().toISOString()
        }
      ]
    };
  }

  return { audiobooks };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const audiobookId = formData.get('audiobookId') as string;

  try {
    switch (action) {
      case 'export-acx':
        await distributionService.exportToAudibleACX(audiobookId);
        return { success: true, message: 'Exported to Audible ACX format successfully!' };
      
      case 'export-spotify':
        await distributionService.exportToSpotify(audiobookId);
        return { success: true, message: 'Exported to Spotify format successfully!' };
      
      default:
        return { success: false, message: 'Unknown action' };
    }
  } catch (error) {
    console.error('Audiobook action error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred during export'
    };
  }
}

export default function AudiobooksRoute() {
  const { audiobooks } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Mic className="w-8 h-8 text-purple-600" />
          Audiobook Studio
        </h1>
        <p className="text-slate-600">Manage and distribute your audiobooks to major platforms.</p>
      </div>

      {actionData?.message && (
        <div className={`p-4 mb-6 rounded-lg ${actionData.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {actionData.message}
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {audiobooks.map((book: any) => (
          <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square bg-slate-100 relative group">
              <img 
                src={book.cover_image || 'https://placehold.co/400x400?text=No+Cover'} 
                alt={book.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="secondary" size="icon" className="rounded-full w-12 h-12">
                  <Play className="w-6 h-6 ml-1" />
                </Button>
              </div>
            </div>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="line-clamp-1">{book.title}</CardTitle>
                  <CardDescription>{book.author}</CardDescription>
                </div>
                <Badge variant={book.status === 'ready' ? 'default' : 'secondary'}>
                  {book.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                <Music className="w-4 h-4" />
                <span>{formatDuration(book.duration || 0)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Form method="post">
                  <input type="hidden" name="action" value="export-acx" />
                  <input type="hidden" name="audiobookId" value={book.id} />
                  <Button 
                    type="submit" 
                    variant="outline" 
                    className="w-full text-xs"
                    disabled={isSubmitting || book.status !== 'ready'}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Export ACX
                  </Button>
                </Form>

                <Form method="post">
                  <input type="hidden" name="action" value="export-spotify" />
                  <input type="hidden" name="audiobookId" value={book.id} />
                  <Button 
                    type="submit" 
                    variant="outline" 
                    className="w-full text-xs"
                    disabled={isSubmitting || book.status !== 'ready'}
                  >
                    <Radio className="w-3 h-3 mr-1" />
                    Spotify
                  </Button>
                </Form>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Create New Card */}
        <Card className="border-dashed border-2 bg-slate-50 flex flex-col items-center justify-center min-h-[400px] cursor-pointer hover:bg-slate-100 transition-colors">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-4">
              <Mic className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Create New Audiobook</h3>
            <p className="text-sm text-slate-500 mb-4">Convert text to speech or upload audio</p>
            <Button>Start Project</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
