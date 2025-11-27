import React, { useState, useEffect } from 'react';
import { TargetLanguage, TranslatedBubble, ComicPage } from './types';
import { translateComicImage } from './services/geminiService';
import { loadArchive, getPageImage, clearArchive } from './services/archiveService';
import { Dropzone } from './components/Dropzone';
import { BubbleOverlay } from './components/BubbleOverlay';
import { 
  Loader2, 
  Languages, 
  Download, 
  RotateCcw, 
  Eye, 
  EyeOff,
  Github,
  Wand2,
  Activity,
  ChevronLeft,
  ChevronRight,
  Library
} from 'lucide-react';

const App: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [bubbles, setBubbles] = useState<TranslatedBubble[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetLang, setTargetLang] = useState<TargetLanguage>(TargetLanguage.TURKISH);
  const [error, setError] = useState<string | null>(null);
  const [showBubbles, setShowBubbles] = useState(true);

  // Archive State
  const [archiveName, setArchiveName] = useState<string | null>(null);
  const [pages, setPages] = useState<ComicPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  // Handle new file upload (Image or Archive)
  const handleFileSelected = async (file: File) => {
    handleReset();
    setError(null);

    const isArchive = file.name.endsWith('.cbz') || file.name.endsWith('.cbr') || file.name.endsWith('.zip');
    
    if (isArchive) {
      if (file.name.endsWith('.cbr')) {
         // Warning for CBR as we are using JSZip primarily
         // In a full app we'd use libarchive.js, but for this demo JSZip is safer.
         // Most modern .cbr files are actually just rars, but JSZip might fail if not zip.
         // We will try to process it as zip (some users rename cbz to cbr).
         // If it fails, we show error.
      }
      
      try {
        setIsLoadingPage(true);
        const pageList = await loadArchive(file);
        if (pageList.length === 0) {
          throw new Error("No images found in this archive.");
        }
        setPages(pageList);
        setArchiveName(file.name);
        setCurrentPageIndex(0);
        
        // Load first page
        await loadPage(pageList[0].fileName);
      } catch (err: any) {
        setError("Could not read archive. Please ensure it is a valid .cbz or .zip file. For .cbr, try converting to .cbz.");
        setIsLoadingPage(false);
      }
    } else {
      // Standard single image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadPage = async (fileName: string) => {
    try {
      setIsLoadingPage(true);
      setBubbles([]); // Clear previous translations
      const base64 = await getPageImage(fileName);
      setImageSrc(base64);
    } catch (err) {
      setError("Failed to load page image.");
    } finally {
      setIsLoadingPage(false);
    }
  };

  const handlePageChange = async (newIndex: number) => {
    if (newIndex < 0 || newIndex >= pages.length) return;
    setCurrentPageIndex(newIndex);
    await loadPage(pages[newIndex].fileName);
  };

  const handleTranslate = async () => {
    if (!imageSrc) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await translateComicImage(imageSrc, targetLang);
      setBubbles(result.bubbles);
    } catch (err: any) {
      setError(err.message || "Failed to translate comic.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setImageSrc(null);
    setBubbles([]);
    setError(null);
    setArchiveName(null);
    setPages([]);
    setCurrentPageIndex(0);
    clearArchive();
  };

  const avgConfidence = bubbles.length > 0 
    ? Math.round(bubbles.reduce((acc, b) => acc + (b.confidence || 0), 0) / bubbles.length)
    : 0;

  const getAvgConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Languages size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              ComicTranslate AI
            </h1>
          </div>
          <div className="flex items-center gap-4">
             {archiveName && (
               <div className="hidden md:flex items-center gap-2 text-sm text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
                 <Library size={14} />
                 <span className="truncate max-w-[200px]">{archiveName}</span>
               </div>
             )}
             <a href="#" className="text-slate-400 hover:text-white transition-colors">
               <Github size={20} />
             </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {!imageSrc && !isLoadingPage ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-8 max-w-lg">
              <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
                Read Comics in <span className="text-indigo-400">Any Language</span>
              </h2>
              <p className="text-slate-400 text-lg">
                Upload <b>CBZ, CBR</b>, or images. AI detects bubbles and translates them instantly. 
                Optimized for large files up to <b>1GB</b>.
              </p>
            </div>
            {error && (
                <div className="mb-6 bg-red-900/20 border border-red-800 text-red-300 p-4 rounded-xl text-sm max-w-lg">
                  {error}
                </div>
            )}
            <Dropzone onFileSelected={handleFileSelected} />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 h-full items-start">
            
            {/* Sidebar Controls */}
            <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
              
              {/* Navigation for Archives */}
              {pages.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
                  <div className="flex justify-between items-center mb-2">
                     <h3 className="font-semibold text-slate-200">Page Navigation</h3>
                     <span className="text-xs text-slate-500">{currentPageIndex + 1} / {pages.length}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handlePageChange(currentPageIndex - 1)}
                      disabled={currentPageIndex === 0 || isLoadingPage}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white py-2 rounded-lg flex justify-center items-center transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button 
                      onClick={() => handlePageChange(currentPageIndex + 1)}
                      disabled={currentPageIndex === pages.length - 1 || isLoadingPage}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white py-2 rounded-lg flex justify-center items-center transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  <div className="mt-3 overflow-x-auto pb-2 custom-scrollbar">
                     <div className="flex gap-2">
                       {pages.map((p, idx) => (
                         <button
                           key={idx}
                           onClick={() => handlePageChange(idx)}
                           className={`min-w-[40px] h-[40px] rounded border text-xs font-medium transition-colors ${
                             idx === currentPageIndex 
                             ? 'bg-indigo-600 border-indigo-500 text-white' 
                             : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                           }`}
                         >
                           {idx + 1}
                         </button>
                       ))}
                     </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <Wand2 size={18} className="text-indigo-400" />
                  Translation
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                      Target Language
                    </label>
                    <select 
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value as TargetLanguage)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      disabled={isProcessing || isLoadingPage}
                    >
                      {Object.values(TargetLanguage).map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>

                  {bubbles.length === 0 && (
                    <button
                      onClick={handleTranslate}
                      disabled={isProcessing || isLoadingPage}
                      className={`
                        w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2
                        transition-all duration-200
                        ${(isProcessing || isLoadingPage)
                          ? 'bg-indigo-600/50 cursor-not-allowed text-indigo-200' 
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:shadow-indigo-500/25'}
                      `}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Translating...
                        </>
                      ) : (
                        <>
                          Translate Page
                        </>
                      )}
                    </button>
                  )}

                  {bubbles.length > 0 && (
                     <div className="grid grid-cols-2 gap-2">
                       <button
                        onClick={() => setShowBubbles(!showBubbles)}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm transition-colors"
                      >
                        {showBubbles ? <Eye size={16}/> : <EyeOff size={16} />}
                        {showBubbles ? 'Hide Text' : 'Show Text'}
                      </button>
                      <button
                        onClick={() => window.print()}
                         className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm transition-colors"
                      >
                        <Download size={16} />
                        Save PDF
                      </button>
                     </div>
                  )}

                  <button
                    onClick={handleReset}
                    className="w-full py-2 text-sm text-slate-500 hover:text-slate-300 flex items-center justify-center gap-2 transition-colors mt-2"
                  >
                    <RotateCcw size={14} />
                    Close File
                  </button>
                </div>
              </div>
              
              {/* Stats / Info */}
              {bubbles.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl animate-in fade-in slide-in-from-top-2">
                   <h3 className="font-semibold text-slate-200 mb-3 text-sm flex items-center gap-2">
                     <Activity size={16} className="text-indigo-400"/>
                     Page Stats
                   </h3>
                   
                   <div className="space-y-2">
                     <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-400">Bubbles:</span>
                       <span className="font-mono text-slate-200">{bubbles.length}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-400">Confidence:</span>
                       <span className={`font-mono font-bold ${getAvgConfidenceColor(avgConfidence)}`}>
                         {avgConfidence}%
                       </span>
                     </div>
                   </div>
                </div>
              )}

              {error && (
                <div className="bg-red-900/20 border border-red-800 text-red-300 p-4 rounded-xl text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Main Image Viewer */}
            <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden relative min-h-[500px] flex items-center justify-center">
               <div className="relative w-full max-w-4xl mx-auto">
                 {/* The Image */}
                 {imageSrc && (
                   <img 
                    src={imageSrc} 
                    alt="Comic Page" 
                    className={`w-full h-auto object-contain block transition-opacity duration-300 ${isLoadingPage ? 'opacity-50' : 'opacity-100'}`}
                   />
                 )}

                 {/* Loading Page Spinner */}
                 {isLoadingPage && (
                   <div className="absolute inset-0 flex items-center justify-center z-50">
                     <Loader2 size={48} className="text-indigo-500 animate-spin" />
                   </div>
                 )}

                 {/* Processing Overlay */}
                 {isProcessing && (
                   <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                     <div className="relative">
                       <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                       <Loader2 size={48} className="text-indigo-400 animate-spin relative z-10" />
                     </div>
                     <p className="mt-4 text-indigo-200 font-medium animate-pulse">AI is reading & translating...</p>
                   </div>
                 )}

                 {/* Translation Overlays */}
                 {bubbles.length > 0 && showBubbles && !isLoadingPage && (
                   <div className="absolute inset-0 w-full h-full">
                     {bubbles.map((bubble) => (
                       <BubbleOverlay key={bubble.id} bubble={bubble} scale={1} />
                     ))}
                   </div>
                 )}
               </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default App;
