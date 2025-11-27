export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface TranslatedBubble {
  id: string;
  originalText: string;
  translatedText: string;
  box_2d: number[]; // [ymin, xmin, ymax, xmax] 0-1000 scale
  confidence?: number;
}

export interface TranslationResult {
  bubbles: TranslatedBubble[];
  detectedLanguage?: string;
}

export enum TargetLanguage {
  TURKISH = 'Turkish',
  ENGLISH = 'English',
  SPANISH = 'Spanish',
  JAPANESE = 'Japanese',
  FRENCH = 'French',
  GERMAN = 'German',
  KOREAN = 'Korean',
  CHINESE = 'Chinese (Simplified)',
}

export interface ComicPage {
  fileName: string;
  index: number;
}

export interface AppState {
  // Single image mode
  imageSrc: string | null;
  
  // Archive mode
  archiveName: string | null;
  pages: ComicPage[];
  currentPageIndex: number;
  
  isProcessing: boolean;
  bubbles: TranslatedBubble[];
  targetLanguage: TargetLanguage;
  error: string | null;
}
