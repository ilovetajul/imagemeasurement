import { Unit, Point, Measurement } from '../types';
import { Upload, Ruler, MousePointer2, Move, Settings2, Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  mode: 'calibrate' | 'measure' | 'pan';
  setMode: (mode: 'calibrate' | 'measure' | 'pan') => void;
  unit: Unit;
  setUnit: (unit: Unit) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  image: string | null;
  scale: number | null;
  setScale: (scale: number | null) => void;
  measurements: Measurement[];
}

export function Sidebar({ 
  mode, 
  setMode, 
  unit, 
  setUnit, 
  onUpload, 
  image, 
  scale,
  setScale,
  measurements
}: SidebarProps) {
  return (
    <aside className="w-72 border-r border-zinc-800 bg-zinc-900 flex flex-col z-20">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
            <Ruler size={18} className="text-zinc-950" />
          </div>
          <span className="font-bold tracking-tight text-xl">PhotoMeasure</span>
        </div>

        <label className="flex items-center justify-center gap-2 w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg cursor-pointer transition-colors text-sm font-medium">
          <Upload size={16} />
          {image ? 'Change Image' : 'Upload Image'}
          <input type="file" className="hidden" accept="image/*" onChange={onUpload} />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <section>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Settings2 size={12} />
            Tools
          </h3>
          <div className="grid grid-cols-1 gap-2">
            <ToolButton 
              active={mode === 'pan'} 
              onClick={() => setMode('pan')}
              icon={<Move size={18} />}
              label="Pan & Zoom"
              description="Navigate the image"
            />
            <ToolButton 
              active={mode === 'calibrate'} 
              onClick={() => setMode('calibrate')}
              icon={<Settings2 size={18} />}
              label="Calibrate"
              description="Set reference scale"
            />
            <ToolButton 
              active={mode === 'measure'} 
              onClick={() => setMode('measure')}
              disabled={!scale}
              icon={<Ruler size={18} />}
              label="Measure"
              description="Measure objects"
            />
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Measurement Unit</label>
              <select 
                value={unit} 
                onChange={(e) => setUnit(e.target.value as Unit)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
              >
                <option value="inches">Inches (in)</option>
                <option value="feet">Feet (ft)</option>
                <option value="cm">Centimeters (cm)</option>
                <option value="meters">Meters (m)</option>
              </select>
            </div>

            {scale && (
              <div className="p-3 bg-zinc-800/50 border border-zinc-800 rounded-lg">
                <div className="text-xs text-zinc-500 mb-1">Current Scale</div>
                <div className="text-sm font-mono">{scale.toFixed(2)} px / {unit}</div>
                <button 
                  onClick={() => setScale(null)}
                  className="text-[10px] text-zinc-500 hover:text-zinc-300 underline mt-2"
                >
                  Reset Calibration
                </button>
              </div>
            )}
          </div>
        </section>

        {!scale && image && (
          <div className="p-4 bg-amber-950/20 border border-amber-900/50 rounded-lg flex gap-3">
            <Info size={18} className="text-amber-500 shrink-0" />
            <p className="text-xs text-amber-200/80 leading-relaxed">
              Please calibrate first. Use the Calibrate tool to draw a line over an object of known length.
            </p>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-zinc-800 text-[10px] text-zinc-600">
        &copy; 2026 PhotoMeasure. Precision through pixels.
      </div>
    </aside>
  );
}

function ToolButton({ active, onClick, icon, label, description, disabled = false }: any) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-start gap-3 p-3 rounded-xl border transition-all text-left w-full group",
        active 
          ? "bg-zinc-100 border-zinc-100 text-zinc-950" 
          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/50",
        disabled && "opacity-30 cursor-not-allowed grayscale"
      )}
    >
      <div className={cn(
        "p-2 rounded-lg transition-colors",
        active ? "bg-zinc-950 text-zinc-100" : "bg-zinc-800 text-zinc-400 group-hover:text-zinc-200"
      )}>
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className={cn("text-[10px]", active ? "text-zinc-600" : "text-zinc-500")}>
          {description}
        </div>
      </div>
    </button>
  );
}
