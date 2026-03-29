import { Measurement, Unit } from '../types';
import { Trash2, Hash, Ruler } from 'lucide-react';

interface ResultsPanelProps {
  measurements: Measurement[];
  onDelete: (id: string) => void;
  unit: Unit;
}

export function ResultsPanel({ measurements, onDelete, unit }: ResultsPanelProps) {
  return (
    <aside className="w-80 border-l border-zinc-800 bg-zinc-900 flex flex-col z-20">
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Hash size={16} className="text-zinc-500" />
          Measurements
        </h3>
        <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400">
          {measurements.length} total
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {measurements.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-40">
            <Ruler size={32} className="mb-4" />
            <p className="text-xs">No measurements yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {measurements.map((m, i) => (
              <div key={m.id} className="p-4 hover:bg-zinc-800/50 transition-colors group">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase block mb-0.5">
                      {m.isReference ? 'Reference' : `Measurement #${i + 1}`}
                    </span>
                    <h4 className="text-sm font-medium text-zinc-100">
                      {m.realDistance.toFixed(2)} {m.unit}
                    </h4>
                  </div>
                  <button 
                    onClick={() => onDelete(m.id)}
                    className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                  <span>{m.pixelDistance.toFixed(0)} px</span>
                  <span>•</span>
                  <span>{m.label || 'No label'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-6 bg-zinc-950/50 border-t border-zinc-800">
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
          <span>Total Length</span>
          <span>{measurements.reduce((acc, m) => acc + m.realDistance, 0).toFixed(2)} {unit}</span>
        </div>
      </div>
    </aside>
  );
}
