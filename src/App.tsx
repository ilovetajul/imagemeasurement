import { useState, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { ResultsPanel } from './components/ResultsPanel';
import { Measurement, Unit, Point } from './types';
import { Download, Undo, Redo, Maximize } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [scale, setScale] = useState<number | null>(null); // pixels per unit
  const [unit, setUnit] = useState<Unit>('inches');
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [history, setHistory] = useState<Measurement[][]>([]);
  const [redoStack, setRedoStack] = useState<Measurement[][]>([]);
  const [mode, setMode] = useState<'calibrate' | 'measure' | 'pan'>('pan');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });

  const canvasRef = useRef<any>(null);

  const saveToHistory = useCallback((newMeasurements: Measurement[]) => {
    setHistory(prev => [...prev, measurements]);
    setMeasurements(newMeasurements);
    setRedoStack([]);
  }, [measurements]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack(prevRedo => [...prevRedo, measurements]);
    setMeasurements(prev);
    setHistory(prevHistory => prevHistory.slice(0, -1));
  }, [history, measurements]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory(prevHistory => [...prevHistory, measurements]);
    setMeasurements(next);
    setRedoStack(prevRedo => prevRedo.slice(0, -1));
  }, [redoStack, measurements]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setMeasurements([]);
        setScale(null);
        setHistory([]);
        setRedoStack([]);
        setZoom(1);
        setPan({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const addMeasurement = (m: Measurement) => {
    if (m.isReference) {
      setScale(m.pixelDistance / m.realDistance);
    }
    saveToHistory([...measurements, m]);
  };

  const deleteMeasurement = (id: string) => {
    const m = measurements.find(item => item.id === id);
    if (m?.isReference) {
      setScale(null);
    }
    saveToHistory(measurements.filter(m => m.id !== id));
  };

  const exportAsPNG = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = 'photomeasure-export.png';
    link.href = dataUrl;
    link.click();
  };

  const exportAsPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('PhotoMeasure Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Unit: ${unit}`, 20, 30);
    doc.text(`Scale: ${scale?.toFixed(2)} pixels/${unit}`, 20, 40);
    
    let y = 60;
    measurements.forEach((m, i) => {
      doc.text(`${i + 1}. ${m.label || 'Measurement'}: ${m.realDistance.toFixed(2)} ${m.unit}`, 20, y);
      y += 10;
    });
    
    doc.save('photomeasure-report.pdf');
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar 
        mode={mode} 
        setMode={setMode} 
        unit={unit} 
        setUnit={setUnit}
        onUpload={handleImageUpload}
        image={image}
        scale={scale}
        setScale={setScale}
        measurements={measurements}
      />

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col min-w-0">
        <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-100 italic serif">PhotoMeasure</h1>
            <div className="h-4 w-px bg-zinc-800" />
            <div className="flex items-center gap-1">
              <button 
                onClick={undo} 
                disabled={history.length === 0}
                className="p-1.5 hover:bg-zinc-800 rounded-md disabled:opacity-30 transition-colors"
                title="Undo"
              >
                <Undo size={18} />
              </button>
              <button 
                onClick={redo} 
                disabled={redoStack.length === 0}
                className="p-1.5 hover:bg-zinc-800 rounded-md disabled:opacity-30 transition-colors"
                title="Redo"
              >
                <Redo size={18} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={exportAsPNG}
              disabled={!image}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 text-zinc-950 rounded-md text-sm font-medium hover:bg-zinc-200 disabled:opacity-30 transition-all"
            >
              <Download size={16} />
              Export PNG
            </button>
            <button 
              onClick={exportAsPDF}
              disabled={!image || measurements.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 border border-zinc-700 rounded-md text-sm font-medium hover:bg-zinc-800 disabled:opacity-30 transition-all"
            >
              Export PDF
            </button>
          </div>
        </header>

        <div className="flex-1 relative bg-zinc-950 overflow-hidden">
          {image ? (
            <Canvas 
              ref={canvasRef}
              image={image}
              mode={mode}
              scale={scale}
              unit={unit}
              measurements={measurements}
              onAddMeasurement={addMeasurement}
              zoom={zoom}
              setZoom={setZoom}
              pan={pan}
              setPan={setPan}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center mb-6 border border-zinc-800">
                <Maximize size={40} className="text-zinc-600" />
              </div>
              <h2 className="text-2xl font-light mb-2">No Image Uploaded</h2>
              <p className="text-zinc-500 max-w-md mb-8">
                Upload a photo of an object alongside a reference item (like a ruler or credit card) to start measuring.
              </p>
              <label className="cursor-pointer px-6 py-3 bg-zinc-100 text-zinc-950 rounded-full font-medium hover:scale-105 transition-transform">
                Upload Image
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
          )}
        </div>
      </main>

      {/* Right Sidebar */}
      <ResultsPanel 
        measurements={measurements} 
        onDelete={deleteMeasurement} 
        unit={unit}
      />
    </div>
  );
}
