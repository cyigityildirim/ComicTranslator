import React, { useState, useEffect, useRef } from 'react';
import { TranslatedBubble } from '../types';
import { Maximize2, X, AlertCircle } from 'lucide-react';

interface BubbleOverlayProps {
  bubble: TranslatedBubble;
  scale: number;
}

export const BubbleOverlay: React.FC<BubbleOverlayProps> = ({ bubble }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [fontSize, setFontSize] = useState(14); // Initial generic size
  const textRef = useRef<HTMLParagraphElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Gemini returns 0-1000 scale. Convert to percentages.
  const [ymin, xmin, ymax, xmax] = bubble.box_2d;
  
  const top = ymin / 10;
  const left = xmin / 10;
  const height = (ymax - ymin) / 10;
  const width = (xmax - xmin) / 10;

  const style: React.CSSProperties = {
    top: `${top}%`,
    left: `${left}%`,
    height: `${height}%`,
    width: `${width}%`,
    position: 'absolute',
  };

  // Auto-resize text effect
  useEffect(() => {
    if (!textRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const text = textRef.current;

    // Start slightly larger, then shrink
    let currentSize = 20; 
    
    // Heuristic: start size based on bubble height to save iterations
    const boxHeightPx = container.clientHeight;
    if (boxHeightPx > 0) {
        currentSize = Math.min(Math.max(boxHeightPx / 3, 10), 30);
    }

    const fitText = () => {
      text.style.fontSize = `${currentSize}px`;
      
      // Binary-like reduction if overflowing
      // Reduce until scroll dimensions match client dimensions (no overflow)
      while (
        currentSize > 8 && 
        (text.scrollHeight > container.clientHeight || text.scrollWidth > container.clientWidth)
      ) {
        currentSize -= 1;
        text.style.fontSize = `${currentSize}px`;
      }
      setFontSize(currentSize);
    };

    // Run slightly delayed to ensure DOM render
    const raf = requestAnimationFrame(fitText);
    return () => cancelAnimationFrame(raf);
  }, [bubble.translatedText, height, width]);

  const getConfidenceBadgeColor = (score: number = 0) => {
    if (score >= 90) return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
    if (score >= 70) return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
    return 'bg-red-500/10 text-red-600 border-red-200';
  };

  if (expanded) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
      >
        <div 
          className="bg-white text-slate-900 p-6 rounded-2xl max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Translation</h4>
            {bubble.confidence !== undefined && (
              <div className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getConfidenceBadgeColor(bubble.confidence)}`}>
                {bubble.confidence}% confidence
              </div>
            )}
            <button 
              onClick={() => setExpanded(false)}
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-900"
            >
              <X size={20} />
            </button>
          </div>
          
          <p className="font-comic text-xl leading-relaxed">{bubble.translatedText}</p>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Original</h4>
            <p className="text-sm text-slate-600 italic">{bubble.originalText}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={style}
      className="group z-10 flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        ref={containerRef}
        className={`
          w-full h-full 
          bg-white text-black 
          rounded-xl shadow-lg border 
          overflow-hidden flex items-center justify-center text-center 
          transition-all duration-300 ease-out
          ${isHovered ? 'scale-105 z-20 shadow-xl ring-2 ring-indigo-400 border-indigo-200' : 'opacity-95 border-slate-200'}
          ${(bubble.confidence || 100) < 50 ? 'ring-1 ring-red-400/50' : ''}
        `}
      >
        <div className="w-full h-full p-0.5 sm:p-1 flex flex-col items-center justify-center overflow-hidden">
          <p 
            ref={textRef}
            className="font-comic font-bold leading-tight select-none"
            style={{ 
              fontSize: `${fontSize}px`, 
              wordBreak: 'break-word',
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          >
            {bubble.translatedText}
          </p>
        </div>

        {(bubble.confidence || 100) < 50 && !isHovered && (
          <div className="absolute top-0 right-0 p-0.5 text-red-500 opacity-70">
            <AlertCircle size={8} />
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
          className="absolute bottom-0 right-0 p-0.5 bg-indigo-100 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-tl-md"
          title="Expand text"
        >
          <Maximize2 size={10} />
        </button>
      </div>
    </div>
  );
};
