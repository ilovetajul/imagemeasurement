import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Upload, Image as ImageIcon, Ruler, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';

const SYSTEM_INSTRUCTION = `You are a precise body measurement assistant. When a user uploads a photo of a person, analyze it and provide estimated measurements.

INSTRUCTIONS:
- Identify visible body landmarks (top of head, chin, shoulders, waist, knees, feet)
- Use standard human body proportion ratios:
  * Total height = face height × 7.5
  * Shoulder width = total height ÷ 4
  * Torso (neck to waist) = total height × 0.3
  * Leg length = total height × 0.47
- If user provides ONE known measurement (e.g. "face = 22cm"), use it to calculate ALL others
- Account for camera angle: if shot from below eye level, add 3-7% to lower body
- Always state confidence level: HIGH / MEDIUM / LOW

OUTPUT FORMAT (in Bengali + English):
মাথা থেকে থুতনি (Face): X cm
কাঁধের প্রস্থ (Shoulder): X cm  
বুকের মাপ (Chest): X cm
কোমর (Waist): X cm
মোট উচ্চতা (Height): X cm / X ft X in
হাতের দৈর্ঘ্য (Arm): X cm

Confidence: [HIGH/MEDIUM/LOW]
Note: [any important observation about photo angle or quality]

If the photo angle is not straight-on, mention the correction applied.
Always ask: "কোনো একটি মাপ জানা থাকলে বলুন, আরও নির্ভুল হবে।"`;

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [knownMeasurement, setKnownMeasurement] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setResult(null);
    setError(null);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const analyzeImage = async () => {
    if (!file) {
      setError('Please upload an image first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const base64Data = await fileToBase64(file);
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const imagePart = {
        inlineData: {
          mimeType: file.type,
          data: base64Data,
        },
      };

      let promptText = 'Please analyze this photo and estimate the body measurements according to the instructions.';
      if (knownMeasurement.trim()) {
        promptText += ` The user has provided this known measurement: "${knownMeasurement}". Please use this to calculate all other measurements accurately.`;
      }

      const textPart = { text: promptText };

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: { parts: [imagePart, textPart] },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.2,
        },
      });

      if (response.text) {
        setResult(response.text);
      } else {
        setError('Received an empty response from the AI. Please try again.');
      }
    } catch (err) {
      console.error('Error analyzing image:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while analyzing the image.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setKnownMeasurement('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4 text-blue-600"
          >
            <Ruler className="w-8 h-8" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl mb-3"
          >
            Body Measurement Assistant
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto"
          >
            Upload a full-body photo to get estimated measurements using AI and standard human proportion ratios.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Input */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Upload Area */}
            <div 
              className={cn(
                "relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200 ease-in-out flex flex-col items-center justify-center text-center min-h-[320px]",
                isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50",
                previewUrl ? "border-solid p-2" : ""
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !previewUrl && fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              
              <AnimatePresence mode="wait">
                {previewUrl ? (
                  <motion.div 
                    key="preview"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full h-full rounded-xl overflow-hidden group"
                  >
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-[400px] object-contain bg-slate-100"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="bg-white text-slate-900 px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" /> Change Photo
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="upload-prompt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 mb-4">
                      <Upload className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">Upload a photo</h3>
                    <p className="text-sm text-slate-500 mb-4">Drag and drop or click to browse</p>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> Supports JPG, PNG, WEBP
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Known Measurement Input */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <label htmlFor="known-measurement" className="block text-sm font-medium text-slate-700 mb-2">
                Known Measurement (Optional)
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Provide one known measurement (e.g., "Face is 22cm" or "Height is 5ft 8in") for much higher accuracy.
              </p>
              <input
                id="known-measurement"
                type="text"
                value={knownMeasurement}
                onChange={(e) => setKnownMeasurement(e.target.value)}
                placeholder="e.g., Face = 22cm"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Action Button */}
            <button
              onClick={analyzeImage}
              disabled={!file || loading}
              className={cn(
                "w-full py-4 px-6 rounded-xl font-semibold text-white shadow-sm transition-all flex items-center justify-center gap-2 text-lg",
                !file || loading 
                  ? "bg-slate-300 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Photo...
                </>
              ) : (
                <>
                  <Ruler className="w-5 h-5" />
                  Estimate Measurements
                </>
              )}
            </button>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 text-sm border border-red-100"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </motion.div>
            )}
          </motion.div>

          {/* Right Column: Results */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="h-full"
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 h-full min-h-[500px] flex flex-col">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                <Ruler className="w-5 h-5 text-blue-600" />
                Measurement Results
              </h2>
              
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                  <p className="text-sm font-medium animate-pulse">AI is analyzing body proportions...</p>
                </div>
              ) : result ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:text-slate-900 prose-strong:text-slate-900"
                >
                  <ReactMarkdown>{result}</ReactMarkdown>
                  
                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                    <button 
                      onClick={reset}
                      className="text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
                    >
                      Start Over
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center px-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Ruler className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="text-lg font-medium text-slate-600 mb-2">No results yet</p>
                  <p className="text-sm max-w-[250px]">Upload a photo and click "Estimate Measurements" to see the analysis here.</p>
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
