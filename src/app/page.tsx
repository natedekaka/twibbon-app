'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, Type, Image as ImageIcon, Palette, RotateCcw, Move, ZoomIn, Save, FolderOpen, Scissors, Wand2, X, Plus, ChevronDown, Maximize2, Minimize2, Link as LinkIcon, Hand, MousePointer2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import Cropper from 'react-easy-crop';

const FRAMES = [
  { id: 'none', name: 'Tanpa Frame', gradient: 'transparent', color: null },
  { id: 'gradient1', name: 'Gradien Gold', gradient: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)', color: '#f5af19' },
  { id: 'gradient2', name: 'Gradien Ungu', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#667eea' },
  { id: 'gradient3', name: 'Gradien Hijau', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: '#11998e' },
  { id: 'gradient4', name: 'Gradien Biru', gradient: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)', color: '#2193b0' },
  { id: 'gradient5', name: 'Gradien Pink', gradient: 'linear-gradient(135deg, #ec008c 0%, #fc6767 100%)', color: '#ec008c' },
  { id: 'solid1', name: 'Solid Gold', gradient: '#ffd700', color: '#ffd700' },
  { id: 'solid2', name: 'Solid Hitam', gradient: '#1a1a1a', color: '#1a1a1a' },
  { id: 'solid3', name: 'Solid Putih', gradient: '#ffffff', color: '#ffffff' },
];

const FILTERS = [
  { id: 'none', name: 'Normal', filter: 'none' },
  { id: 'vintage', name: 'Vintage', filter: 'sepia(0.4) contrast(1.1) brightness(1.1)' },
  { id: 'cool', name: 'Cool', filter: 'saturate(1.3) hue-rotate(20deg)' },
  { id: 'warm', name: 'Warm', filter: 'saturate(1.3) hue-rotate(-20deg) brightness(1.05)' },
  { id: 'dramatic', name: 'Dramatic', filter: 'contrast(1.4) brightness(0.9) saturate(1.2)' },
  { id: 'fade', name: 'Soft', filter: 'contrast(0.9) brightness(1.1) saturate(0.9)' },
  { id: 'bw', name: 'B&W', filter: 'grayscale(1)' },
  { id: 'sepia', name: 'Sepia', filter: 'sepia(0.8)' },
];

const STICKERS = [
  { id: 'star', emoji: '⭐', name: 'Bintang' },
  { id: 'heart', emoji: '❤️', name: 'Hati' },
  { id: 'fire', emoji: '🔥', name: 'Api' },
  { id: 'sparkles', emoji: '✨', name: 'Sparkles' },
  { id: 'crown', emoji: '👑', name: 'Mahkota' },
  { id: 'rocket', emoji: '🚀', name: 'Roket' },
  { id: 'rainbow', emoji: '🌈', name: 'Pelangi' },
  { id: 'sun', emoji: '☀️', name: 'Matahari' },
  { id: 'moon', emoji: '🌙', name: 'Bulan' },
  { id: 'flower', emoji: '🌸', name: 'Bunga' },
  { id: 'guitar', emoji: '🎸', name: 'Gitar' },
  { id: 'camera', emoji: '📸', name: 'Kamera' },
  { id: 'party', emoji: '🎉', name: 'Party' },
  { id: 'music', emoji: '🎵', name: 'Musik' },
  { id: 'diamond', emoji: '💎', name: 'Berlian' },
  { id: 'trophy', emoji: '🏆', name: 'Trophy' },
];

interface StickerInstance {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

interface Template {
  id: string;
  name: string;
  frameId: string;
  filterId: string;
  text: string;
  textColor: string;
  textPosition: string;
  textSize: number;
  fontFamily: string;
  frameThickness: number;
  stickers: StickerInstance[];
}

export default function TwibbonEditor() {
  const [image, setImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedFrames, setSelectedFrames] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  const [text, setText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textPosition, setTextPosition] = useState<'top' | 'bottom'>('bottom');
  const [textSize, setTextSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [frameThickness, setFrameThickness] = useState(40);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [activeTab, setActiveTab] = useState<'frame' | 'text' | 'filter' | 'sticker' | 'crop' | 'resize' | 'adjust'>('frame');
  const [stickers, setStickers] = useState<StickerInstance[]>([]);
  const [selectedSticker, setSelectedSticker] = useState<StickerInstance | null>(null);
  const [stickerSize, setStickerSize] = useState(48);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{width: number, height: number, x: number, y: number} | null>(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [originalDimensions, setOriginalDimensions] = useState<{width: number, height: number} | null>(null);
  const [targetWidth, setTargetWidth] = useState(1080);
  const [targetHeight, setTargetHeight] = useState(1080);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [resizeQuality, setResizeQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const editorRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgRemovedRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem('twibbon-templates');
    if (saved) {
      setTemplates(JSON.parse(saved));
    }
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setOriginalImage(event.target?.result as string);
        setPanX(0);
        setPanY(0);
        setZoom(1);
        bgRemovedRef.current = false;
        const img = new window.Image();
        img.onload = () => {
          setOriginalDimensions({ width: img.width, height: img.height });
          setTargetWidth(img.width);
          setTargetHeight(img.height);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleResize = async () => {
    if (!image) return;
    setIsResizing(true);
    
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = resizeQuality;
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          
          const qualityMap = { low: 0.5, medium: 0.75, high: 1 };
          const resizedImage = canvas.toDataURL('image/jpeg', qualityMap[resizeQuality]);
          setImage(resizedImage);
          bgRemovedRef.current = false;
        }
        setIsResizing(false);
      };
      
      img.src = image;
    } catch (err) {
      console.error('Resize failed:', err);
      setIsResizing(false);
    }
  };

  const presetSizes = [
    { name: 'Instagram Post', width: 1080, height: 1080 },
    { name: 'Instagram Story', width: 1080, height: 1920 },
    { name: 'Facebook', width: 1200, height: 630 },
    { name: 'Twitter/X', width: 1200, height: 675 },
    { name: 'WhatsApp', width: 800, height: 800 },
    { name: '4x6 Print (300dpi)', width: 1200, height: 1800 },
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanStart({ x: panX, y: panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const dx = (e.clientX - dragStart.x) / zoom;
    const dy = (e.clientY - dragStart.y) / zoom;
    setPanX(panStart.x + dx);
    setPanY(panStart.y + dy);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.3), 3));
  };

  const handleResetPosition = () => {
    setPanX(0);
    setPanY(0);
    setZoom(1);
  };

  const handleReset = () => {
    setImage(originalImage);
    bgRemovedRef.current = false;
    setSelectedFrames([]);
    setSelectedFilter(FILTERS[0]);
    setText('');
    setTextColor('#ffffff');
    setTextPosition('bottom');
    setTextSize(24);
    setFontFamily('Arial');
    setFrameThickness(40);
    setRotation(0);
    setZoom(1);
    setStickers([]);
    setSelectedSticker(null);
  };

  const handleClearAll = () => {
    setImage(null);
    setOriginalImage(null);
    setSelectedFrames([]);
    setSelectedFilter(FILTERS[0]);
    setText('');
    setTextColor('#ffffff');
    setTextPosition('bottom');
    setTextSize(24);
    setFontFamily('Arial');
    setFrameThickness(40);
    setRotation(0);
    setZoom(1);
    setStickers([]);
    setSelectedSticker(null);
    bgRemovedRef.current = false;
  };

  const handleDownload = async () => {
    if (editorRef.current) {
      try {
        const dataUrl = await toPng(editorRef.current, {
          quality: 1,
          pixelRatio: 2,
        });
        const link = document.createElement('a');
        link.download = 'twibbon.png';
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Failed to download image', err);
      }
    }
  };

  const saveTemplate = () => {
    if (!templateName.trim()) return;
    const newTemplate: Template = {
      id: Date.now().toString(),
      name: templateName,
      frameId: selectedFrames.join(','),
      filterId: selectedFilter.id,
      text,
      textColor,
      textPosition,
      textSize,
      fontFamily,
      frameThickness,
      stickers,
    };
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    localStorage.setItem('twibbon-templates', JSON.stringify(updated));
    setTemplateName('');
    setShowTemplateModal(false);
  };

  const loadTemplate = (template: Template) => {
    setSelectedFrames(template.frameId ? template.frameId.split(',') : []);
    setSelectedFilter(FILTERS.find(f => f.id === template.filterId) || FILTERS[0]);
    setText(template.text);
    setTextColor(template.textColor);
    setTextPosition(template.textPosition as 'top' | 'bottom');
    setTextSize(template.textSize);
    setFontFamily(template.fontFamily);
    setFrameThickness(template.frameThickness);
    setStickers(template.stickers || []);
    setShowTemplateModal(false);
  };

  const deleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('twibbon-templates', JSON.stringify(updated));
  };

  const toggleFrame = (frameId: string) => {
    setSelectedFrames(prev =>
      prev.includes(frameId)
        ? prev.filter(id => id !== frameId)
        : [...prev, frameId]
    );
  };

  const addSticker = (sticker: typeof STICKERS[0]) => {
    const newSticker: StickerInstance = {
      id: Date.now().toString(),
      emoji: sticker.emoji,
      x: 50,
      y: 50,
      size: stickerSize,
      rotation: 0,
    };
    setStickers([...stickers, newSticker]);
    setSelectedSticker(newSticker);
  };

  const updateSticker = (id: string, updates: Partial<StickerInstance>) => {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    if (selectedSticker?.id === id) {
      setSelectedSticker(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const removeSelectedSticker = () => {
    if (selectedSticker) {
      setStickers(prev => prev.filter(s => s.id !== selectedSticker.id));
      setSelectedSticker(null);
    }
  };

  const removeBackground = async () => {
    if (!image || bgRemovedRef.current) return;
    setIsRemovingBg(true);
    
    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const blob = await removeBackground(image);
      const url = URL.createObjectURL(blob);
      setImage(url);
      bgRemovedRef.current = true;
    } catch (err) {
      console.error('Background removal failed:', err);
      alert('Background removal tidak tersedia. Gunakan foto dengan background sederhana.');
    } finally {
      setIsRemovingBg(false);
    }
  };

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const applyCrop = async () => {
    if (!image || !croppedAreaPixels) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const cap = croppedAreaPixels;
      canvas.width = cap.width;
      canvas.height = cap.height;
      if (ctx) {
        ctx.drawImage(
          img,
          cap.x,
          cap.y,
          cap.width,
          cap.height,
          0,
          0,
          cap.width,
          cap.height
        );
        const croppedImage = canvas.toDataURL('image/png');
        setImage(croppedImage);
        setOriginalImage(croppedImage);
        bgRemovedRef.current = false;
      }
      setCropModalOpen(false);
    };
    img.src = image;
  };

  const getActiveFrames = () => {
    return FRAMES.filter(f => selectedFrames.includes(f.id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-8 h-8" />
            Twibbon Creator
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              Template
            </button>
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex justify-center mb-6">
              <div
                ref={editorRef}
                className="relative overflow-hidden rounded-xl"
                style={{
                  width: '400px',
                  height: '400px',
                  background: image ? '#000' : '#1a1a2e',
                  overflow: 'hidden',
                }}
              >
                {image ? (
                  <>
                    <div
                      ref={imageContainerRef}
                      className="absolute cursor-grab"
                      style={{
                        width: '800px',
                        height: '800px',
                        left: '50%',
                        top: '50%',
                        transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) rotate(${rotation}deg) scale(${zoom})`,
                        transformOrigin: 'center center',
                      }}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      onWheel={handleWheel}
                    >
                      <img
                        src={image}
                        alt="Preview"
                        className="w-full h-full object-contain pointer-events-none select-none"
                        style={{
                          filter: selectedFilter.filter,
                        }}
                        draggable={false}
                      />
                    </div>
                    {getActiveFrames().map((frame) => (
                      <div
                        key={frame.id}
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: frame.gradient,
                          boxShadow: `inset 0 0 ${frameThickness}px ${frameThickness}px rgba(0,0,0,0.5)`,
                        }}
                      />
                    ))}
                    {stickers.map((sticker) => (
                      <div
                        key={sticker.id}
                        className="absolute cursor-move select-none"
                        style={{
                          left: `${sticker.x}%`,
                          top: `${sticker.y}%`,
                          transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
                          fontSize: `${sticker.size}px`,
                          zIndex: selectedSticker?.id === sticker.id ? 100 : 10,
                          outline: selectedSticker?.id === sticker.id ? '2px solid blue' : 'none',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSticker(sticker);
                        }}
                        draggable={false}
                      >
                        {sticker.emoji}
                      </div>
                    ))}
                    {text && (
                      <div
                        className="absolute left-0 right-0 text-center font-bold pointer-events-none"
                        style={{
                          [textPosition]: '20px',
                          color: textColor,
                          fontSize: `${textSize}px`,
                          fontFamily,
                          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                          letterSpacing: '2px',
                        }}
                      >
                        {text}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-white/50">
                    <Upload className="w-16 h-16 mb-4" />
                    <p>Upload foto untuk mulai</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center gap-4 flex-wrap">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl text-white font-semibold transition-all transform hover:scale-105"
              >
                <Upload className="w-5 h-5" />
                Upload Foto
              </button>
              <button
                onClick={handleDownload}
                disabled={!image}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 rounded-xl text-white font-semibold transition-all transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-xl text-white font-semibold transition-all transform hover:scale-105"
              >
                <Save className="w-5 h-5" />
                Simpan Template
              </button>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex gap-2 mb-6 flex-wrap">
              {[
                { id: 'frame', icon: ImageIcon, label: 'Frame' },
                { id: 'text', icon: Type, label: 'Teks' },
                { id: 'filter', icon: Palette, label: 'Filter' },
                { id: 'sticker', icon: Plus, label: 'Stiker' },
                { id: 'crop', icon: Scissors, label: 'Crop' },
                { id: 'adjust', icon: Move, label: 'Atur' },
                { id: 'resize', icon: Maximize2, label: 'Resize' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'frame' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-white/70 mb-3 font-medium">
                    Pilih Frame (bisa pilih lebih dari 1)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {FRAMES.map((frame) => (
                      <button
                        key={frame.id}
                        onClick={() => toggleFrame(frame.id)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          selectedFrames.includes(frame.id)
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                      >
                        <div
                          className="w-full h-12 rounded-lg mb-2 border border-white/20"
                          style={{
                            background: frame.gradient || '#333',
                            border: frame.color === '#ffffff' ? '1px solid #666' : 'none'
                          }}
                        />
                        <p className="text-white text-xs text-center truncate">
                          {frame.name}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 mb-2 font-medium">
                    Ketebalan Frame: {frameThickness}px
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={frameThickness}
                    onChange={(e) => setFrameThickness(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-white/70 mb-2 font-medium flex items-center gap-2">
                    <Move className="w-4 h-4" /> Rotasi: {rotation}°
                  </label>
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-white/70 mb-2 font-medium flex items-center gap-2">
                    <ZoomIn className="w-4 h-4" /> Zoom: {(zoom * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-white/70 mb-2 font-medium">
                    Teks
                  </label>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Masukkan teks twibbon..."
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-white/70 mb-2 font-medium">
                    Posisi Teks
                  </label>
                  <div className="flex gap-3">
                    {['top', 'bottom'].map((pos) => (
                      <button
                        key={pos}
                        onClick={() => setTextPosition(pos as 'top' | 'bottom')}
                        className={`flex-1 py-2 rounded-lg font-medium capitalize transition-all ${
                          textPosition === pos
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        {pos === 'top' ? 'Atas' : 'Bawah'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 mb-2 font-medium">
                      Warna Teks
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {['#ffffff', '#000000', '#ffd700', '#ff6b6b', '#4ecdc4', '#a855f7'].map(
                        (color) => (
                          <button
                            key={color}
                            onClick={() => setTextColor(color)}
                            className={`w-10 h-10 rounded-lg border-2 transition-all ${
                              textColor === color
                                ? 'border-blue-500 scale-110'
                                : 'border-white/20 hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        )
                      )}
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/70 mb-2 font-medium">
                      Font
                    </label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      {['Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Impact'].map(
                        (font) => (
                          <option key={font} value={font} style={{ fontFamily: font }}>
                            {font}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 mb-2 font-medium">
                    Ukuran Teks: {textSize}px
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="48"
                    value={textSize}
                    onChange={(e) => setTextSize(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>
            )}

            {activeTab === 'filter' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-white/70 mb-3 font-medium">
                    Pilih Filter
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {FILTERS.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setSelectedFilter(filter)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          selectedFilter.id === filter.id
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                      >
                        <div
                          className="w-full h-12 rounded-lg mb-2 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600"
                          style={{ filter: filter.filter }}
                        />
                        <p className="text-white text-xs text-center">{filter.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <label className="block text-white/70 mb-3 font-medium flex items-center gap-2">
                    <Wand2 className="w-4 h-4" /> Hapus Background
                  </label>
                  <button
                    onClick={removeBackground}
                    disabled={!image || isRemovingBg || bgRemovedRef.current}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-gray-500 disabled:to-gray-600 rounded-xl text-white font-semibold transition-all disabled:cursor-not-allowed"
                  >
                    <Wand2 className="w-5 h-5" />
                    {isRemovingBg ? 'Memproses...' : bgRemovedRef.current ? 'Background Sudah Dihapus' : 'Hapus Background'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'sticker' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-white/70 mb-3 font-medium">
                    Tambah Stiker
                  </label>
                  <div className="grid grid-cols-8 gap-2 mb-4">
                    {STICKERS.map((sticker) => (
                      <button
                        key={sticker.id}
                        onClick={() => addSticker(sticker)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-2xl"
                        title={sticker.name}
                      >
                        {sticker.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {stickers.length > 0 && (
                  <>
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-white/70 font-medium">
                          Stiker Dipilih
                        </label>
                        {selectedSticker && (
                          <button
                            onClick={removeSelectedSticker}
                            className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                          >
                            <X className="w-4 h-4" /> Hapus
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {stickers.map((sticker) => (
                          <button
                            key={sticker.id}
                            onClick={() => setSelectedSticker(sticker)}
                            className={`p-2 rounded-lg text-3xl transition-all ${
                              selectedSticker?.id === sticker.id
                                ? 'bg-blue-500/30 border-2 border-blue-500'
                                : 'bg-white/10 hover:bg-white/20'
                            }`}
                          >
                            {sticker.emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedSticker && (
                      <div className="space-y-4 pt-4 border-t border-white/10">
                        <div>
                          <label className="block text-white/70 mb-2 font-medium">
                            Ukuran: {selectedSticker.size}px
                          </label>
                          <input
                            type="range"
                            min="20"
                            max="100"
                            value={selectedSticker.size}
                            onChange={(e) => updateSticker(selectedSticker.id, { size: Number(e.target.value) })}
                            className="w-full accent-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-white/70 mb-2 font-medium">
                            Rotasi: {selectedSticker.rotation}°
                          </label>
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            value={selectedSticker.rotation}
                            onChange={(e) => updateSticker(selectedSticker.id, { rotation: Number(e.target.value) })}
                            className="w-full accent-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-white/70 mb-2 font-medium">
                            Posisi X: {selectedSticker.x.toFixed(0)}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={selectedSticker.x}
                            onChange={(e) => updateSticker(selectedSticker.id, { x: Number(e.target.value) })}
                            className="w-full accent-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-white/70 mb-2 font-medium">
                            Posisi Y: {selectedSticker.y.toFixed(0)}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={selectedSticker.y}
                            onChange={(e) => updateSticker(selectedSticker.id, { y: Number(e.target.value) })}
                            className="w-full accent-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'crop' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-white/70 mb-3 font-medium">
                    Potong Foto
                  </label>
                  <p className="text-white/50 text-sm mb-4">
                    Gunakan kontrol di bawah untuk memotong foto Anda.
                  </p>
                  <button
                    onClick={() => setCropModalOpen(true)}
                    disabled={!image}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:from-gray-500 disabled:to-gray-600 rounded-xl text-white font-semibold transition-all disabled:cursor-not-allowed"
                  >
                    <Scissors className="w-5 h-5" />
                    Buka Crop Tool
                  </button>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-4">
                  <div>
                    <label className="block text-white/70 mb-2 font-medium">
                      Rotasi Presisi: {rotation}°
                    </label>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={rotation}
                      onChange={(e) => setRotation(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 mb-2 font-medium">
                      Zoom: {(zoom * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'resize' && (
              <div className="space-y-6">
                {originalDimensions && (
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-white/70 text-sm mb-1">Ukuran Asli:</p>
                    <p className="text-white font-medium">
                      {originalDimensions.width} × {originalDimensions.height} px
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-white/70 mb-3 font-medium">
                    Preset Ukuran
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {presetSizes.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setTargetWidth(preset.width);
                          setTargetHeight(preset.height);
                        }}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${
                          targetWidth === preset.width && targetHeight === preset.height
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                      >
                        <p className="text-white text-sm font-medium">{preset.name}</p>
                        <p className="text-white/50 text-xs">{preset.width}×{preset.height}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-white/70 font-medium">
                      Ukuran Manual
                    </label>
                    <button
                      onClick={() => setMaintainAspectRatio(!maintainAspectRatio)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-all ${
                        maintainAspectRatio
                          ? 'bg-blue-500/30 text-blue-400'
                          : 'bg-white/10 text-white/50'
                      }`}
                    >
                      <LinkIcon className="w-4 h-4" />
                      {maintainAspectRatio ? 'Locked' : 'Free'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-white/50 text-sm mb-2">Width (px)</label>
                      <input
                        type="number"
                        value={targetWidth}
                        onChange={(e) => {
                          const newWidth = Number(e.target.value);
                          setTargetWidth(newWidth);
                          if (maintainAspectRatio && originalDimensions) {
                            const ratio = originalDimensions.height / originalDimensions.width;
                            setTargetHeight(Math.round(newWidth * ratio));
                          }
                        }}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        min="1"
                        max="4096"
                      />
                    </div>
                    <div>
                      <label className="block text-white/50 text-sm mb-2">Height (px)</label>
                      <input
                        type="number"
                        value={targetHeight}
                        onChange={(e) => {
                          const newHeight = Number(e.target.value);
                          setTargetHeight(newHeight);
                          if (maintainAspectRatio && originalDimensions) {
                            const ratio = originalDimensions.width / originalDimensions.height;
                            setTargetWidth(Math.round(newHeight * ratio));
                          }
                        }}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        min="1"
                        max="4096"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <label className="block text-white/70 mb-3 font-medium">
                    Kualitas
                  </label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map((q) => (
                      <button
                        key={q}
                        onClick={() => setResizeQuality(q)}
                        className={`flex-1 py-2 rounded-lg font-medium capitalize transition-all ${
                          resizeQuality === q
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <p className="text-white/50 text-xs mt-2">
                    High = ukuran lebih besar, Medium = seimbang, Low = ukuran kecil
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setTargetWidth(originalDimensions?.width || 1080);
                        setTargetHeight(originalDimensions?.height || 1080);
                      }}
                      disabled={!originalDimensions}
                      className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-xl text-white font-medium transition-colors"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleResize}
                      disabled={!image || isResizing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 rounded-xl text-white font-semibold transition-all disabled:cursor-not-allowed"
                    >
                      <Maximize2 className="w-5 h-5" />
                      {isResizing ? 'Memproses...' : 'Resize'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'adjust' && (
              <div className="space-y-6">
                <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <MousePointer2 className="w-5 h-5 text-blue-400" />
                    <p className="text-blue-400 font-medium">Tips:</p>
                  </div>
                  <p className="text-white/70 text-sm">
                    Klik dan drag foto untuk menggeser posisi. Scroll mouse untuk zoom in/out.
                  </p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-white/50 text-xs mb-1">Zoom</p>
                      <p className="text-white font-bold text-lg">{(zoom * 100).toFixed(0)}%</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs mb-1">Posisi X</p>
                      <p className="text-white font-bold text-lg">{panX.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs mb-1">Posisi Y</p>
                      <p className="text-white font-bold text-lg">{panY.toFixed(0)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 mb-2 font-medium flex items-center gap-2">
                    <ZoomIn className="w-4 h-4" /> Zoom: {(zoom * 100).toFixed(0)}%
                  </label>
                  <div className="flex gap-2 items-center">
                    <Minimize2 className="w-5 h-5 text-white/50" />
                    <input
                      type="range"
                      min="0.3"
                      max="3"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="flex-1 accent-blue-500"
                    />
                    <Maximize2 className="w-5 h-5 text-white/50" />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setZoom(0.5)}
                      className="flex-1 py-1 text-xs bg-white/10 hover:bg-white/20 rounded text-white/70"
                    >
                      50%
                    </button>
                    <button
                      onClick={() => setZoom(1)}
                      className="flex-1 py-1 text-xs bg-white/10 hover:bg-white/20 rounded text-white/70"
                    >
                      100%
                    </button>
                    <button
                      onClick={() => setZoom(1.5)}
                      className="flex-1 py-1 text-xs bg-white/10 hover:bg-white/20 rounded text-white/70"
                    >
                      150%
                    </button>
                    <button
                      onClick={() => setZoom(2)}
                      className="flex-1 py-1 text-xs bg-white/10 hover:bg-white/20 rounded text-white/70"
                    >
                      200%
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 mb-2 font-medium flex items-center gap-2">
                    <Move className="w-4 h-4" /> Posisi Geser
                  </label>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-white/50 text-sm mb-1">Horizontal (X): {panX.toFixed(0)}px</label>
                      <input
                        type="range"
                        min="-200"
                        max="200"
                        value={panX}
                        onChange={(e) => setPanX(Number(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-white/50 text-sm mb-1">Vertikal (Y): {panY.toFixed(0)}px</label>
                      <input
                        type="range"
                        min="-200"
                        max="200"
                        value={panY}
                        onChange={(e) => setPanY(Number(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => { setPanX(0); setPanY(0); }}
                      className="flex-1 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg text-white/70 flex items-center justify-center gap-2"
                    >
                      <Hand className="w-4 h-4" />
                      Center
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 mb-2 font-medium flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" /> Rotasi: {rotation}°
                  </label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setRotation(0)}
                      className="flex-1 py-1 text-xs bg-white/10 hover:bg-white/20 rounded text-white/70"
                    >
                      0°
                    </button>
                    <button
                      onClick={() => setRotation(-90)}
                      className="flex-1 py-1 text-xs bg-white/10 hover:bg-white/20 rounded text-white/70"
                    >
                      -90°
                    </button>
                    <button
                      onClick={() => setRotation(90)}
                      className="flex-1 py-1 text-xs bg-white/10 hover:bg-white/20 rounded text-white/70"
                    >
                      90°
                    </button>
                    <button
                      onClick={() => setRotation(180)}
                      className="flex-1 py-1 text-xs bg-white/10 hover:bg-white/20 rounded text-white/70"
                    >
                      180°
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={handleResetPosition}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-xl text-white font-semibold transition-all"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Reset Semua Posisi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-12 text-center text-white/40">
          <p>Buat twibbon keren untuk media sosial kamu!</p>
        </footer>
      </main>

      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Template</h2>
              <button onClick={() => setShowTemplateModal(false)} className="text-white/70 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Nama template..."
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={saveTemplate}
                  disabled={!templateName.trim()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 rounded-lg text-white font-medium transition-colors"
                >
                  Simpan
                </button>
              </div>
            </div>

            {templates.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-white/70 font-medium mb-2">Template Tersimpan</h3>
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <span className="text-white">{template.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadTemplate(template)}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded text-white text-sm"
                      >
                        Gunakan
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 text-sm"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {templates.length === 0 && (
              <p className="text-white/50 text-center py-8">
                Belum ada template tersimpan
              </p>
            )}
          </div>
        </div>
      )}

      {cropModalOpen && image && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Crop Foto</h2>
              <button onClick={() => setCropModalOpen(false)} className="text-white/70 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="relative w-full h-96 bg-black rounded-lg overflow-hidden mb-4">
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="mb-4">
              <label className="block text-white/70 mb-2 font-medium">
                Zoom: {(zoom * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setCropModalOpen(false)}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={applyCrop}
                className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-medium transition-colors"
              >
                Terapkan Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
