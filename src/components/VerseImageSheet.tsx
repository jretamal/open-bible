import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Copy,
  DownloadSimple,
  ImageSquare,
  Rectangle,
  ShareNetwork,
  Square,
} from '@phosphor-icons/react';
import { Sheet } from './Sheet';
import { Button } from './Button';
import { useUI } from '../state/ui';
import { useStudy } from '../state/study';
import { useSettings } from '../state/settings';
import { useBookName, useChapter } from '../hooks';
import { abbrOf } from '../data/catalog';
import { refLabel } from '../ref';
import { useT } from '../i18n';

interface StylePreset {
  id: string;
  name: string;
  gradientColors: string[];
  textColor: string;
  refColor: string;
  brandColor: string;
  quoteColor: string;
  previewBg: string;
}

const STYLES: StylePreset[] = [
  {
    id: 'midnight',
    name: 'Medianoche',
    gradientColors: ['#0b1021', '#1e1438', '#2d1254'],
    textColor: '#ffffff',
    refColor: '#c4b5fd',
    brandColor: 'rgba(196, 181, 253, 0.55)',
    quoteColor: 'rgba(196, 181, 253, 0.25)',
    previewBg: 'linear-gradient(135deg, #0b1021, #2d1254)',
  },
  {
    id: 'sunset',
    name: 'Atardecer',
    gradientColors: ['#3b0d06', '#7c2d12', '#b45309'],
    textColor: '#fffbeb',
    refColor: '#fcd34d',
    brandColor: 'rgba(252, 211, 77, 0.55)',
    quoteColor: 'rgba(252, 211, 77, 0.25)',
    previewBg: 'linear-gradient(135deg, #3b0d06, #b45309)',
  },
  {
    id: 'forest',
    name: 'Bosque',
    gradientColors: ['#041f17', '#064e3b', '#047857'],
    textColor: '#ecfdf5',
    refColor: '#6ee7b7',
    brandColor: 'rgba(110, 231, 183, 0.55)',
    quoteColor: 'rgba(110, 231, 183, 0.25)',
    previewBg: 'linear-gradient(135deg, #041f17, #047857)',
  },
  {
    id: 'parchment',
    name: 'Pergamino',
    gradientColors: ['#fbf8f1', '#f3ebd8', '#e9ddc3'],
    textColor: '#292524',
    refColor: '#78350f',
    brandColor: 'rgba(120, 53, 15, 0.55)',
    quoteColor: 'rgba(120, 53, 15, 0.2)',
    previewBg: 'linear-gradient(135deg, #fbf8f1, #e9ddc3)',
  },
  {
    id: 'minimal',
    name: 'Minimal Oscuro',
    gradientColors: ['#121316', '#181a1f', '#22252c'],
    textColor: '#f9fafb',
    refColor: '#9ca3af',
    brandColor: 'rgba(156, 163, 175, 0.55)',
    quoteColor: 'rgba(156, 163, 175, 0.2)',
    previewBg: 'linear-gradient(135deg, #121316, #22252c)',
  },
  {
    id: 'ocean',
    name: 'Océano',
    gradientColors: ['#021b2d', '#083344', '#0e7490'],
    textColor: '#f0fdfa',
    refColor: '#5eead4',
    brandColor: 'rgba(94, 234, 212, 0.55)',
    quoteColor: 'rgba(94, 234, 212, 0.25)',
    previewBg: 'linear-gradient(135deg, #021b2d, #0e7490)',
  },
];

type AspectRatio = 'square' | 'story';
type FontFamily = 'serif' | 'sans';
type FontSize = 'sm' | 'md' | 'lg';

export function VerseImageSheet() {
  const t = useT();
  const { close, notify } = useUI();
  const { book, chapter, selection } = useStudy();
  const versionId = useSettings((s) => s.versionId);
  const bookName = useBookName();
  const textData = useChapter(book, chapter);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [format, setFormat] = useState<AspectRatio>('square');
  const [styleId, setStyleId] = useState<string>('midnight');
  const [fontFamily, setFontFamily] = useState<FontFamily>('serif');
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const [copied, setCopied] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    if (document.fonts) {
      document.fonts.ready.then(() => setFontsLoaded(true));
    }
  }, []);

  const verses = textData.status === 'ready' ? textData.verses : [];
  const selectedText = selection
    .map((v) => verses[v - 1])
    .filter(Boolean)
    .join(' ');
  const first = selection[0] || 1;
  const last = selection[selection.length - 1] || first;
  const citation = `${refLabel(bookName(book), chapter, first, last)} (${abbrOf(versionId)})`;

  const activeStyle = STYLES.find((s) => s.id === styleId) || STYLES[0];

  // Draw canvas whenever state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedText) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1080;
    const height = format === 'square' ? 1080 : 1920;
    canvas.width = width;
    canvas.height = height;

    // 1. Draw Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    activeStyle.gradientColors.forEach((color, i) => {
      gradient.addColorStop(i / (activeStyle.gradientColors.length - 1), color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle radial glow in the center
    const radial = ctx.createRadialGradient(
      width / 2,
      height * 0.42,
      50,
      width / 2,
      height * 0.42,
      width * 0.75,
    );
    radial.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);

    // 2. Wrap Verse Text into lines
    const paddingX = 110;
    const maxTextWidth = width - paddingX * 2;
    const fontStack = fontFamily === 'serif'
      ? '"Literata Variable", "Literata", Georgia, "Times New Roman", serif'
      : '"Inter Variable", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    // Calculate optimal font size
    let currentFontSize = fontSize === 'sm' ? 44 : fontSize === 'lg' ? 62 : 52;
    if (format === 'story') currentFontSize = Math.round(currentFontSize * 1.08);

    const getLines = (size: number): string[] => {
      ctx.font = `400 ${size}px ${fontStack}`;
      const words = selectedText.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxTextWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    let lines = getLines(currentFontSize);
    const maxAllowedHeight = height * (format === 'square' ? 0.58 : 0.65);
    const getBlockHeight = (s: number, l: string[]) => l.length * (s * 1.55);

    // Auto-scale down if text overflows
    while (getBlockHeight(currentFontSize, lines) > maxAllowedHeight && currentFontSize > 28) {
      currentFontSize -= 3;
      lines = getLines(currentFontSize);
    }

    const lineHeight = Math.round(currentFontSize * 1.55);
    const textBlockHeight = lines.length * lineHeight;

    // 3. Compute Vertical Center
    const centerY = height * (format === 'square' ? 0.45 : 0.47);
    const startY = centerY - textBlockHeight / 2;

    // 4. Draw Ornamental Top Quote Symbol
    ctx.fillStyle = activeStyle.quoteColor;
    ctx.font = `600 ${Math.min(76, currentFontSize * 1.4)}px ${fontStack}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('“', width / 2, startY - 24);

    // 5. Draw Verse Lines
    ctx.fillStyle = activeStyle.textColor;
    ctx.font = `400 ${currentFontSize}px ${fontStack}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    lines.forEach((line, i) => {
      const y = startY + i * lineHeight + lineHeight / 2;
      ctx.fillText(line, width / 2, y);
    });

    // 6. Draw Decorative Divider Line
    const dividerY = startY + textBlockHeight + 38;
    ctx.strokeStyle = activeStyle.quoteColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 40, dividerY);
    ctx.lineTo(width / 2 + 40, dividerY);
    ctx.stroke();

    // 7. Draw Bible Reference
    const refFontSize = Math.max(30, Math.round(currentFontSize * 0.68));
    ctx.fillStyle = activeStyle.refColor;
    ctx.font = `600 ${refFontSize}px "Inter", -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(citation, width / 2, dividerY + 28);

    // 8. Draw Subtle Footer Watermark
    ctx.fillStyle = activeStyle.brandColor;
    ctx.font = '500 22px "Inter Variable", "Inter", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('biblia.jretamal.cl', width / 2, height - (format === 'story' ? 70 : 45));
  }, [selectedText, citation, format, styleId, fontFamily, fontSize, activeStyle, fontsLoaded]);

  const getCanvasBlob = async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  };

  const downloadImage = async () => {
    const blob = await getCanvasBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `versiculo-${book}-${chapter}-${selection.join('-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const shareImage = async () => {
    const blob = await getCanvasBlob();
    if (!blob) return;
    const filename = `versiculo-${book}-${chapter}.png`;
    const file = new File([blob], filename, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: citation,
          text: citation,
        });
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback to downloading
      await downloadImage();
    }
  };

  const copyImage = async () => {
    const blob = await getCanvasBlob();
    if (!blob) return;
    try {
      if (navigator.clipboard && 'write' in navigator.clipboard) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        notify(t('verseImageCopied'));
        setTimeout(() => setCopied(false), 2500);
      } else {
        await downloadImage();
      }
    } catch {
      await downloadImage();
    }
  };

  return (
    <Sheet title={t('verseImageTitle')} icon={ImageSquare} onClose={close} tall>
      <div className="verse-image-sheet">
        {/* Live Preview */}
        <div className="verse-image-preview-wrap">
          <canvas
            ref={canvasRef}
            className="verse-image-canvas"
            style={{
              aspectRatio: format === 'square' ? '1 / 1' : '9 / 16',
            }}
          />
        </div>

        {/* Controls */}
        <div className="verse-image-controls">
          {/* Format selection */}
          <div className="verse-image-row">
            <span className="verse-image-label">{t('verseImageFormat')}</span>
            <div className="verse-image-options">
              <button
                type="button"
                className={`format-pill ${format === 'square' ? 'active' : ''}`}
                onClick={() => setFormat('square')}
              >
                <Square size={16} weight={format === 'square' ? 'fill' : 'regular'} />
                {t('verseImageSquare')}
              </button>
              <button
                type="button"
                className={`format-pill ${format === 'story' ? 'active' : ''}`}
                onClick={() => setFormat('story')}
              >
                <Rectangle size={16} weight={format === 'story' ? 'fill' : 'regular'} />
                {t('verseImageStory')}
              </button>
            </div>
          </div>

          {/* Style swatches */}
          <div className="verse-image-row">
            <span className="verse-image-label">{t('verseImageStyle')}</span>
            <div className="style-swatches">
              {STYLES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  aria-label={st.name}
                  className={`style-swatch-btn ${styleId === st.id ? 'active' : ''}`}
                  style={{ background: st.previewBg }}
                  onClick={() => setStyleId(st.id)}
                />
              ))}
            </div>
          </div>

          {/* Font & Size options */}
          <div className="verse-image-row">
            <span className="verse-image-label">{t('verseImageFont')}</span>
            <div className="verse-image-options">
              <button
                type="button"
                className={`format-pill ${fontFamily === 'serif' ? 'active' : ''}`}
                style={{ fontFamily: 'var(--font-serif)' }}
                onClick={() => setFontFamily('serif')}
              >
                {t('verseImageSerif')}
              </button>
              <button
                type="button"
                className={`format-pill ${fontFamily === 'sans' ? 'active' : ''}`}
                style={{ fontFamily: 'var(--font-sans)' }}
                onClick={() => setFontFamily('sans')}
              >
                {t('verseImageSans')}
              </button>
            </div>
          </div>

          <div className="verse-image-row">
            <span className="verse-image-label">{t('verseImageSize')}</span>
            <div className="verse-image-options">
              {(['sm', 'md', 'lg'] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  className={`format-pill ${fontSize === sz ? 'active' : ''}`}
                  onClick={() => setFontSize(sz)}
                >
                  {sz === 'sm' ? 'A-' : sz === 'lg' ? 'A+' : 'A'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="verse-image-actions">
          <Button
            variant="primary"
            className="full-width"
            icon={ShareNetwork}
            onClick={shareImage}
          >
            {t('verseImageShare')}
          </Button>
          <Button icon={DownloadSimple} onClick={downloadImage}>
            {t('verseImageDownload')}
          </Button>
          <Button icon={copied ? Check : Copy} onClick={copyImage}>
            {copied ? t('verseImageCopied') : t('verseImageCopy')}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
