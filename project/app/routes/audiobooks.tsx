import React from "react";
import { Play, Pause, Download, Volume2, Settings, Loader2, Users, Mic, Upload, FileAudio } from "lucide-react";
import type { MetaFunction } from "react-router";
import { Navigation } from "~/components/navigation";
import { Button } from "~/components/ui/button/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select/select";
import { Slider } from "~/components/ui/slider/slider";
import { Alert, AlertDescription } from "~/components/ui/alert/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog/dialog";
import { Input } from "~/components/ui/input/input";
import { Label } from "~/components/ui/label/label";
import { Textarea } from "~/components/ui/textarea/textarea";
import { Badge } from "~/components/ui/badge/badge";
import { contentService, type EbookSummary } from "~/services/content-service";
import { ttsService, type VoiceProfile, type Audiobook } from "~/services/tts-service";
import { voiceManagementService, type VoiceCreationParams } from "~/services/voice-management-service";
import { dialogueDetectionService, type Character, type DialogueAnalysis } from "~/services/dialogue-detection-service";
import { distributionService, type ACXExport, type SpotifyExport } from "~/services/distribution-service";
import { characterVoiceMappingService, type VoiceSuggestion } from "~/services/character-voice-mapping-service";
import { apiKeyService } from "~/services/api-key-service";
import { AuthService } from "~/services/auth-service";
import { ProtectedRoute } from "~/components/protected-route";
import styles from "./audiobooks.module.css";

export const meta: MetaFunction = () => {
  return [
    { title: "Audiobooks - Bestseller Author Pro" },
    { name: "description", content: "Convert your ebooks to audiobooks with AI voices" },
  ];
};

export default function Audiobooks() {
  const [ebooks, setEbooks] = React.useState<EbookSummary[]>([]);
  const [audiobooks, setAudiobooks] = React.useState<Audiobook[]>([]);
  const [voices, setVoices] = React.useState<VoiceProfile[]>([]);
  const [selectedEbook, setSelectedEbook] = React.useState<string>("");
  const [selectedVoice, setSelectedVoice] = React.useState<string>("");
  const [selectedProvider, setSelectedProvider] = React.useState<string>("elevenlabs");
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  
  // Enhanced audiobook features
  const [characters, setCharacters] = React.useState<Character[]>([]);
  const [characterVoices, setCharacterVoices] = React.useState<Record<string, string>>({});
  const [voiceSuggestions, setVoiceSuggestions] = React.useState<Record<string, VoiceSuggestion[]>>({});
  const [dialogueAnalysis, setDialogueAnalysis] = React.useState<DialogueAnalysis | null>(null);
  const [isMultiVoice, setIsMultiVoice] = React.useState(false);
  const [voiceCloning, setVoiceCloning] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [exportFormat, setExportFormat] = React.useState<'audible' | 'spotify' | 'generic'>('audible');
  const [showExportDialog, setShowExportDialog] = React.useState(false);
  const [selectedAudiobookForExport, setSelectedAudiobookForExport] = React.useState<string | null>(null);
  const [exportMetadata, setExportMetadata] = React.useState({
    title: '',
    author: '',
    narrator: '',
    description: '',
    genre: '',
    language: 'en-US',
    copyright: '',
    isbn: ''
  });
  
  // Voice cloning state
  const [cloneVoiceName, setCloneVoiceName] = React.useState("");
  const [cloneVoiceDescription, setCloneVoiceDescription] = React.useState("");
  const [cloneAudioFile, setCloneAudioFile] = React.useState<File | null>(null);
  
  // Audio player state
  const [currentAudiobook, setCurrentAudiobook] = React.useState<Audiobook | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  const [playbackSpeed, setPlaybackSpeed] = React.useState(1);
  const [currentChapter, setCurrentChapter] = React.useState(0);
  const [bookmarks, setBookmarks] = React.useState<Array<{time: number, label: string, chapterIndex: number}>>([]);
  const [showChapterList, setShowChapterList] = React.useState(false);
  const [autoAdvanceChapters, setAutoAdvanceChapters] = React.useState(true);

  const audioRef = React.useRef<HTMLAudioElement>(null);

  // Helper function to get authenticated user ID
  const getUserId = async (): Promise<string> => {
    const userId = await AuthService.getUserId();
    if (!userId) {
      throw new Error("User not authenticated");
    }
    return userId;
  };

  // Load data on mount
  React.useEffect(() => {
    loadData();
  }, []);

  // Load voices when provider changes
  React.useEffect(() => {
    if (selectedProvider) {
      loadVoices();
    }
  }, [selectedProvider]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = await getUserId();

      // Load user's ebooks
      const userEbooks = await contentService.getUserEbooks(userId);
      setEbooks(userEbooks.filter(ebook => ebook.status === 'completed'));

      // Load user's audiobooks
      const userAudiobooks = await ttsService.getUserAudiobooks(userId);
      setAudiobooks(userAudiobooks);

      // Load default voices
      await loadVoices();
    } catch (error) {
      console.error('Failed to load data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadVoices = async () => {
    try {
      // Load both traditional voices and enhanced voice profiles
      const availableVoices = await ttsService.getAvailableVoices();
      const providerVoices = availableVoices.filter(voice => voice.provider === selectedProvider);
      
      // Load enhanced voice profiles
      const userId = await getUserId();
      const enhancedVoices = await voiceManagementService.getVoiceProfiles(userId, selectedProvider);
      
      // Combine traditional and enhanced voices
      const allVoices = [
        ...providerVoices,
        ...enhancedVoices.map(voice => ({
          id: voice.id,
          provider: voice.provider as any,
          voice_id: voice.voiceId,
          name: voice.name,
          gender: voice.gender,
          language: voice.language,
          sample_url: voice.sampleUrl
        }))
      ];
      
      setVoices(allVoices);
      
      if (allVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(allVoices[0].voice_id);
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
    }
  };

  // Analyze ebook for characters when selected
  React.useEffect(() => {
    if (selectedEbook) {
      analyzeEbookCharacters();
    }
  }, [selectedEbook]);

  const analyzeEbookCharacters = async () => {
    try {
      const userId = await getUserId();
      const ebook = await contentService.getEbook(userId, selectedEbook);
      
      if (ebook && ebook.chapters && ebook.chapters.length > 0) {
        const fullContent = ebook.chapters.map(chapter => chapter.content).join('\n\n');
        const analysis = await dialogueDetectionService.analyzeDialogue(fullContent);
        
        setDialogueAnalysis(analysis);
        setCharacters(analysis.characters);
        
        // Get voice suggestions for characters
        if (analysis.characters.length > 0 && voices.length > 0) {
          const suggestions = await characterVoiceMappingService.suggestVoiceAssignments(
            userId,
            analysis.characters,
            voices.map(v => ({
              id: v.voice_id,
              userId,
              provider: v.provider as any,
              voiceId: v.voice_id,
              name: v.name,
              gender: v.gender as any,
              ageRange: 'adult' as any,
              language: v.language,
              accent: 'neutral' as any,
              qualityScore: 8,
              characteristics: {
                pitch: 'medium' as any,
                speed: 'medium' as any,
                tone: 'neutral' as any,
                clarity: 8,
                naturalness: 8
              },
              sampleUrl: v.sample_url || '',
              isActive: true,
              isCloned: false,
              createdAt: new Date(),
              updatedAt: new Date()
            }))
          );
          setVoiceSuggestions(suggestions);
          
          // Auto-assign top suggestions
          const initialVoices: Record<string, string> = {};
          analysis.characters.forEach(character => {
            const topSuggestion = suggestions[character.id]?.[0];
            if (topSuggestion) {
              initialVoices[character.id] = topSuggestion.voiceId;
            }
          });
          setCharacterVoices(initialVoices);
        }
      }
    } catch (error) {
      console.error('Failed to analyze characters:', error);
    }
  };

  const handleVoiceCloning = async () => {
    if (!cloneVoiceName || !cloneAudioFile) {
      setError('Please provide voice name and audio file');
      return;
    }

    setVoiceCloning(true);
    setError(null);

    try {
      const userId = await getUserId();
      
      const metadata = {
        name: cloneVoiceName,
        description: cloneVoiceDescription,
        gender: 'neutral' as const,
        ageRange: 'adult' as const,
        language: 'en-US'
      };

      const cloningJob = await voiceManagementService.initiateVoiceCloning(
        userId,
        cloneAudioFile,
        metadata
      );

      setSuccess(`Voice cloning started! Job ID: ${cloningJob.id}`);
      
      // Reset form
      setCloneVoiceName("");
      setCloneVoiceDescription("");
      setCloneAudioFile(null);
      
      // Reload voices
      await loadVoices();
    } catch (error) {
      console.error('Voice cloning failed:', error);
      setError(error instanceof Error ? error.message : 'Voice cloning failed');
    } finally {
      setVoiceCloning(false);
    }
  };

  const handleExportAudiobook = async (audiobookId: string) => {
    setExporting(true);
    setError(null);

    try {
      let exportResult;
      
      switch (exportFormat) {
        case 'audible':
          exportResult = await distributionService.exportToAudibleACX(audiobookId);
          setSuccess(`Audible ACX export completed! Download: ${exportResult.exportUrl}`);
          break;
        case 'spotify':
          exportResult = await distributionService.exportToSpotify(audiobookId);
          setSuccess(`Spotify export completed! RSS: ${exportResult.rssUrl}`);
          break;
        case 'generic':
          exportResult = await distributionService.exportToGenericFormat(audiobookId, 'MP3');
          setSuccess(`Generic export completed! Download: ${exportResult.exportUrl}`);
          break;
      }
      
      setShowExportDialog(false);
    } catch (error) {
      console.error('Export failed:', error);
      setError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const openExportDialog = (audiobookId: string) => {
    const audiobook = audiobooks.find(a => a.id === audiobookId);
    if (audiobook) {
      setSelectedAudiobookForExport(audiobookId);
      setExportMetadata({
        title: audiobook.title,
        author: 'Unknown Author', // TODO: Get from ebook metadata
        narrator: voices.find(v => v.voice_id === audiobook.voice_id)?.name || 'Unknown',
        description: '',
        genre: 'Fiction',
        language: 'en-US',
        copyright: `© ${new Date().getFullYear()}`,
        isbn: ''
      });
      setShowExportDialog(true);
    }
  };

  const handleGenerateAudiobook = async () => {
    if (!selectedEbook || (!selectedVoice && !isMultiVoice)) {
      setError('Please select an ebook and configure voices');
      return;
    }

    if (isMultiVoice && characters.length > 0) {
      // Validate character voice assignments
      const unassignedCharacters = characters.filter(char => !characterVoices[char.id]);
      if (unassignedCharacters.length > 0) {
        setError(`Please assign voices to all characters: ${unassignedCharacters.map(c => c.name).join(', ')}`);
        return;
      }
    }

    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const userId = await getUserId();
      
      // Get API key for TTS provider
      const apiKey = await apiKeyService.getApiKey(userId, selectedProvider);
      if (!apiKey) {
        throw new Error(`No API key found for ${selectedProvider}. Please add your API key in Settings.`);
      }

      let voiceProfile: VoiceProfile;
      
      if (isMultiVoice) {
        // Use primary voice for narrator
        voiceProfile = voices.find(v => v.voice_id === selectedVoice) || voices[0];
        
        // TODO: Implement multi-voice generation with character assignments
        // This would involve processing the text with dialogue detection
        // and generating audio with different voices for different characters
      } else {
        // Single voice generation
        const selectedVoiceProfile = voices.find(v => v.voice_id === selectedVoice);
        if (!selectedVoiceProfile) {
          throw new Error('Selected voice not found');
        }
        voiceProfile = selectedVoiceProfile;
      }

      // Generate audiobook
      const audiobookId = await ttsService.createAudiobook(userId, selectedEbook, voiceProfile);
      
      setSuccess(`Audiobook generation started! ID: ${audiobookId}`);
      
      // Reload audiobooks list
      await loadData();
      
      // Clear selections
      setSelectedEbook("");
      setSelectedVoice("");
      setCharacters([]);
      setCharacterVoices({});
      setIsMultiVoice(false);
    } catch (error) {
      console.error('Audiobook generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate audiobook';
      setError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handlePlayAudiobook = (audiobook: Audiobook) => {
    setCurrentAudiobook(audiobook);
    setCurrentChapter(0);
    // In a real implementation, this would load the actual audio files
    console.log('Playing audiobook:', audiobook.title);
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipToChapter = (chapterIndex: number) => {
    if (currentAudiobook && chapterIndex >= 0 && chapterIndex < currentAudiobook.audio_files.length) {
      setCurrentChapter(chapterIndex);
      setCurrentTime(0);
      // In real implementation, load the specific audio file
      console.log(`Skipping to audio file ${chapterIndex + 1}`);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 30, duration);
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 30, 0);
    }
  };

  const addBookmark = () => {
    if (currentAudiobook) {
      const label = prompt('Enter bookmark label:');
      if (label) {
        const newBookmark = {
          time: currentTime,
          label,
          chapterIndex: currentChapter
        };
        setBookmarks(prev => [...prev, newBookmark]);
      }
    }
  };

  const jumpToBookmark = (bookmark: {time: number, chapterIndex: number}) => {
    setCurrentChapter(bookmark.chapterIndex);
    if (audioRef.current) {
      audioRef.current.currentTime = bookmark.time;
    }
  };

  const getCurrentChapterInfo = () => {
    if (!currentAudiobook) return null;
    return { title: `Audio File ${currentChapter + 1}` };
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleSpeedChange = (value: number[]) => {
    const newSpeed = value[0];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-dismiss success message
  React.useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className={styles.container}>
          <Navigation />
          <div className={styles.loading}>
            <Loader2 className={styles.spinner} />
            <p>Loading audiobooks...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className={styles.container}>
        <Navigation />

        <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.title}>Audiobooks</h1>
          <p className={styles.description}>
            Convert your ebooks to audiobooks using AI-powered text-to-speech technology.
          </p>
        </header>

        {error && (
          <Alert variant="destructive" className={styles.alert}>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className={styles.successAlert}>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className={styles.grid}>
          {/* Enhanced Generation Panel */}
          <div className={styles.card}>
            <Tabs defaultValue="single-voice" className={styles.tabs}>
              <TabsList className={styles.tabsList}>
                <TabsTrigger value="single-voice">Single Voice</TabsTrigger>
                <TabsTrigger value="multi-voice">Multi-Voice</TabsTrigger>
                <TabsTrigger value="voice-cloning">Voice Cloning</TabsTrigger>
              </TabsList>

              <TabsContent value="single-voice" className={styles.tabContent}>
                <h2 className={styles.cardTitle}>Create Single-Voice Audiobook</h2>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Select Ebook</label>
                  <Select value={selectedEbook} onValueChange={setSelectedEbook}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an ebook to convert" />
                    </SelectTrigger>
                    <SelectContent>
                      {ebooks.map((ebook) => (
                        <SelectItem key={ebook.id} value={ebook.id}>
                          {ebook.title} ({ebook.wordCount.toLocaleString()} words)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Voice Provider</label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elevenlabs">ElevenLabs (Premium)</SelectItem>
                      <SelectItem value="azure">Azure Speech Services</SelectItem>
                      <SelectItem value="aws-polly">AWS Polly</SelectItem>
                      <SelectItem value="google">Google Cloud TTS</SelectItem>
                      <SelectItem value="openai">OpenAI TTS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Voice</label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map((voice) => (
                        <SelectItem key={voice.voice_id} value={voice.voice_id}>
                          <div className={styles.voiceOption}>
                            <span>{voice.name}</span>
                            <div className={styles.voiceMeta}>
                              <Badge variant="secondary">{voice.gender}</Badge>
                              <Badge variant="outline">{voice.language}</Badge>
                              {voice.provider === 'elevenlabs' && <Badge>Premium</Badge>}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className={styles.actions}>
                  <Button 
                    onClick={() => {
                      setIsMultiVoice(false);
                      handleGenerateAudiobook();
                    }} 
                    disabled={!selectedEbook || !selectedVoice || generating}
                  >
                    {generating ? (
                      <>
                        <Loader2 className={styles.spinner} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Volume2 size={18} />
                        Generate Audiobook
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="multi-voice" className={styles.tabContent}>
                <h2 className={styles.cardTitle}>Create Multi-Voice Audiobook</h2>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Select Ebook</label>
                  <Select value={selectedEbook} onValueChange={setSelectedEbook}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an ebook to convert" />
                    </SelectTrigger>
                    <SelectContent>
                      {ebooks.map((ebook) => (
                        <SelectItem key={ebook.id} value={ebook.id}>
                          {ebook.title} ({ebook.wordCount.toLocaleString()} words)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {dialogueAnalysis && (
                  <div className={styles.dialogueAnalysis}>
                    <h3 className={styles.analysisTitle}>
                      <Users size={18} />
                      Detected Characters ({characters.length})
                    </h3>
                    <div className={styles.analysisStats}>
                      <Badge variant="outline">
                        {dialogueAnalysis.totalDialogueCount} dialogue segments
                      </Badge>
                      <Badge variant="outline">
                        Avg. {Math.round(dialogueAnalysis.averageDialogueLength)} chars per dialogue
                      </Badge>
                    </div>
                  </div>
                )}

                {characters.length > 0 && (
                  <div className={styles.characterVoices}>
                    <h4 className={styles.sectionTitle}>Character Voice Assignment</h4>
                    {characters.map((character) => (
                      <div key={character.id} className={styles.characterAssignment}>
                        <div className={styles.characterInfo}>
                          <strong>{character.name}</strong>
                          <p className={styles.characterDesc}>{character.description}</p>
                          <div className={styles.characterMeta}>
                            <Badge variant="secondary">{character.dialogueCount} lines</Badge>
                            <Badge variant="outline">Chapter {character.firstAppearance}</Badge>
                          </div>
                          
                          {/* Voice suggestions */}
                          {voiceSuggestions[character.id] && voiceSuggestions[character.id].length > 0 && (
                            <div className={styles.voiceSuggestions}>
                              <span className={styles.suggestionsLabel}>Suggested voices:</span>
                              {voiceSuggestions[character.id].slice(0, 3).map((suggestion, index) => (
                                <button
                                  key={suggestion.voiceId}
                                  className={`${styles.suggestionChip} ${
                                    characterVoices[character.id] === suggestion.voiceId ? styles.selected : ''
                                  }`}
                                  onClick={() => setCharacterVoices(prev => ({
                                    ...prev,
                                    [character.id]: suggestion.voiceId
                                  }))}
                                >
                                  {suggestion.voiceName}
                                  <Badge variant="outline" className={styles.confidenceBadge}>
                                    {Math.round(suggestion.confidence * 100)}%
                                  </Badge>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <Select 
                          value={characterVoices[character.id] || ""} 
                          onValueChange={(value) => setCharacterVoices(prev => ({
                            ...prev,
                            [character.id]: value
                          }))}
                        >
                          <SelectTrigger className={styles.characterVoiceSelect}>
                            <SelectValue placeholder="Choose voice" />
                          </SelectTrigger>
                          <SelectContent>
                            {voices.map((voice) => (
                              <SelectItem key={voice.voice_id} value={voice.voice_id}>
                                <div className={styles.voiceOptionDetailed}>
                                  <span>{voice.name}</span>
                                  <div className={styles.voiceDetails}>
                                    <Badge variant="secondary">{voice.gender}</Badge>
                                    <Badge variant="outline">{voice.language}</Badge>
                                    {voiceSuggestions[character.id]?.find(s => s.voiceId === voice.voice_id) && (
                                      <Badge variant="default">
                                        {Math.round((voiceSuggestions[character.id].find(s => s.voiceId === voice.voice_id)?.confidence || 0) * 100)}% match
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.label}>Narrator Voice</label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose narrator voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map((voice) => (
                        <SelectItem key={voice.voice_id} value={voice.voice_id}>
                          {voice.name} ({voice.gender})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className={styles.actions}>
                  <Button 
                    onClick={() => {
                      setIsMultiVoice(true);
                      handleGenerateAudiobook();
                    }} 
                    disabled={!selectedEbook || !selectedVoice || characters.length === 0 || generating}
                  >
                    {generating ? (
                      <>
                        <Loader2 className={styles.spinner} />
                        Generating Multi-Voice...
                      </>
                    ) : (
                      <>
                        <Users size={18} />
                        Generate Multi-Voice Audiobook
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="voice-cloning" className={styles.tabContent}>
                <h2 className={styles.cardTitle}>Clone Custom Voice</h2>

                <div className={styles.formGroup}>
                  <Label htmlFor="voice-name">Voice Name</Label>
                  <Input
                    id="voice-name"
                    value={cloneVoiceName}
                    onChange={(e) => setCloneVoiceName(e.target.value)}
                    placeholder="Enter a name for your custom voice"
                  />
                </div>

                <div className={styles.formGroup}>
                  <Label htmlFor="voice-description">Description (Optional)</Label>
                  <Textarea
                    id="voice-description"
                    value={cloneVoiceDescription}
                    onChange={(e) => setCloneVoiceDescription(e.target.value)}
                    placeholder="Describe the voice characteristics"
                    rows={3}
                  />
                </div>

                <div className={styles.formGroup}>
                  <Label htmlFor="audio-file">Audio Sample</Label>
                  <Input
                    id="audio-file"
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setCloneAudioFile(e.target.files?.[0] || null)}
                  />
                  <p className={styles.hint}>
                    Upload a clear audio sample (30 seconds - 5 minutes) for best results.
                  </p>
                </div>

                <div className={styles.actions}>
                  <Button 
                    onClick={handleVoiceCloning}
                    disabled={!cloneVoiceName || !cloneAudioFile || voiceCloning}
                  >
                    {voiceCloning ? (
                      <>
                        <Loader2 className={styles.spinner} />
                        Cloning Voice...
                      </>
                    ) : (
                      <>
                        <Mic size={18} />
                        Clone Voice
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Audiobooks List */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Your Audiobooks</h2>

            {audiobooks.length === 0 ? (
              <div className={styles.emptyState}>
                <Volume2 size={48} className={styles.emptyIcon} />
                <p>No audiobooks yet</p>
                <p className={styles.emptyHint}>
                  Generate your first audiobook from an existing ebook.
                </p>
              </div>
            ) : (
              <div className={styles.audiobooksList}>
                {audiobooks.map((audiobook) => (
                  <div key={audiobook.id} className={styles.audiobookItem}>
                    <div className={styles.audiobookInfo}>
                      <h3 className={styles.audiobookTitle}>{audiobook.title}</h3>
                      <p className={styles.audiobookMeta}>
                        Voice: {voices.find(v => v.voice_id === audiobook.voice_id)?.name || 'Unknown'} • 
                        Duration: {formatTime(audiobook.total_duration)} • 
                        Status: {audiobook.status}
                      </p>
                    </div>
                    
                    <div className={styles.audiobookActions}>
                      {audiobook.status === 'completed' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePlayAudiobook(audiobook)}
                          >
                            <Play size={16} />
                            Play
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openExportDialog(audiobook.id)}
                          >
                            <Download size={16} />
                            Export
                          </Button>
                        </>
                      )}
                      
                      {audiobook.status === 'generating' && (
                        <div className={styles.generatingStatus}>
                          <Loader2 className={styles.spinner} />
                          Generating...
                        </div>
                      )}
                      
                      {audiobook.status === 'error' && (
                        <div className={styles.errorStatus}>
                          Generation failed
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Audio Player */}
        {currentAudiobook && (
          <div className={styles.audioPlayer}>
            <div className={styles.playerHeader}>
              <div className={styles.playerTitleSection}>
                <h3 className={styles.playerTitle}>Now Playing: {currentAudiobook.title}</h3>
                {getCurrentChapterInfo() && (
                  <p className={styles.chapterInfo}>
                    Playing audiobook
                  </p>
                )}
              </div>
              
              <div className={styles.playerActions}>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowChapterList(!showChapterList)}
                >
                  Chapters
                </Button>
                <Button variant="outline" size="sm" onClick={addBookmark}>
                  Bookmark
                </Button>
                <Button variant="outline" size="sm">
                  <Settings size={16} />
                </Button>
              </div>
            </div>

            {/* Chapter List - Simplified for current implementation */}
            {showChapterList && (
              <div className={styles.chapterList}>
                <h4 className={styles.chapterListTitle}>Audio Files</h4>
                <div className={styles.chapterItems}>
                  {currentAudiobook.audio_files.map((audioFile, index) => (
                    <button
                      key={index}
                      className={`${styles.chapterItem} ${index === currentChapter ? styles.currentChapter : ''}`}
                      onClick={() => skipToChapter(index)}
                    >
                      <div className={styles.chapterItemContent}>
                        <span className={styles.chapterNumber}>{index + 1}</span>
                        <div className={styles.chapterDetails}>
                          <span className={styles.chapterTitle}>Audio File {index + 1}</span>
                          <span className={styles.chapterDuration}>
                            {formatTime(currentAudiobook.total_duration / currentAudiobook.audio_files.length)}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bookmarks */}
            {bookmarks.length > 0 && (
              <div className={styles.bookmarks}>
                <h4 className={styles.bookmarksTitle}>Bookmarks</h4>
                <div className={styles.bookmarkItems}>
                  {bookmarks.map((bookmark, index) => (
                    <button
                      key={index}
                      className={styles.bookmarkItem}
                      onClick={() => jumpToBookmark(bookmark)}
                    >
                      <span className={styles.bookmarkLabel}>{bookmark.label}</span>
                      <span className={styles.bookmarkTime}>
                        Ch. {bookmark.chapterIndex + 1} - {formatTime(bookmark.time)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.playerControls}>
              <Button onClick={skipBackward} size="sm" variant="outline">
                ⏪ 30s
              </Button>
              
              <Button onClick={togglePlayPause} size="sm">
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </Button>
              
              <Button onClick={skipForward} size="sm" variant="outline">
                30s ⏩
              </Button>

              <div className={styles.timeInfo}>
                <span>{formatTime(currentTime)}</span>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progress} 
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
                <span>{formatTime(duration)}</span>
              </div>

              <div className={styles.volumeControl}>
                <Volume2 size={16} />
                <Slider
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  step={0.1}
                  className={styles.volumeSlider}
                />
              </div>

              <div className={styles.speedControl}>
                <span>Speed: {playbackSpeed}x</span>
                <Slider
                  value={[playbackSpeed]}
                  onValueChange={handleSpeedChange}
                  min={0.5}
                  max={2}
                  step={0.25}
                  className={styles.speedSlider}
                />
              </div>
            </div>

            <audio
              ref={audioRef}
              onTimeUpdate={() => {
                if (audioRef.current) {
                  setCurrentTime(audioRef.current.currentTime);
                }
              }}
              onLoadedMetadata={() => {
                if (audioRef.current) {
                  setDuration(audioRef.current.duration);
                }
              }}
              onEnded={() => {
                setIsPlaying(false);
                // Auto-advance to next audio file if enabled
                if (autoAdvanceChapters && currentAudiobook && currentChapter < currentAudiobook.audio_files.length - 1) {
                  skipToChapter(currentChapter + 1);
                }
              }}
            />
          </div>
        )}
        </div>

        {/* Export Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className={styles.exportDialog}>
            <DialogHeader>
              <DialogTitle>Export Audiobook</DialogTitle>
            </DialogHeader>
            
            <div className={styles.exportForm}>
              <div className={styles.formGroup}>
                <Label htmlFor="export-format">Export Format</Label>
                <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="audible">
                      <div className={styles.formatOption}>
                        <strong>Audible ACX</strong>
                        <p>Professional audiobook format for Audible distribution</p>
                      </div>
                    </SelectItem>
                    <SelectItem value="spotify">
                      <div className={styles.formatOption}>
                        <strong>Spotify for Podcasters</strong>
                        <p>Podcast format for Spotify distribution</p>
                      </div>
                    </SelectItem>
                    <SelectItem value="generic">
                      <div className={styles.formatOption}>
                        <strong>Generic MP3</strong>
                        <p>Standard MP3 files with metadata</p>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className={styles.metadataSection}>
                <h4 className={styles.sectionTitle}>Metadata</h4>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={exportMetadata.title}
                      onChange={(e) => setExportMetadata(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      value={exportMetadata.author}
                      onChange={(e) => setExportMetadata(prev => ({ ...prev, author: e.target.value }))}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <Label htmlFor="narrator">Narrator</Label>
                    <Input
                      id="narrator"
                      value={exportMetadata.narrator}
                      onChange={(e) => setExportMetadata(prev => ({ ...prev, narrator: e.target.value }))}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <Label htmlFor="genre">Genre</Label>
                    <Select 
                      value={exportMetadata.genre} 
                      onValueChange={(value) => setExportMetadata(prev => ({ ...prev, genre: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fiction">Fiction</SelectItem>
                        <SelectItem value="Non-Fiction">Non-Fiction</SelectItem>
                        <SelectItem value="Biography">Biography</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="Self-Help">Self-Help</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="History">History</SelectItem>
                        <SelectItem value="Children">Children</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={exportMetadata.description}
                    onChange={(e) => setExportMetadata(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Enter a description of your audiobook..."
                  />
                </div>

                {exportFormat === 'audible' && (
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <Label htmlFor="copyright">Copyright</Label>
                      <Input
                        id="copyright"
                        value={exportMetadata.copyright}
                        onChange={(e) => setExportMetadata(prev => ({ ...prev, copyright: e.target.value }))}
                        placeholder="© 2024 Author Name"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <Label htmlFor="isbn">ISBN (Optional)</Label>
                      <Input
                        id="isbn"
                        value={exportMetadata.isbn}
                        onChange={(e) => setExportMetadata(prev => ({ ...prev, isbn: e.target.value }))}
                        placeholder="978-0-123456-78-9"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.exportActions}>
                <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => selectedAudiobookForExport && handleExportAudiobook(selectedAudiobookForExport)}
                  disabled={exporting || !exportMetadata.title || !exportMetadata.author}
                >
                  {exporting ? (
                    <>
                      <Loader2 className={styles.spinner} />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <FileAudio size={16} />
                      Export Audiobook
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}