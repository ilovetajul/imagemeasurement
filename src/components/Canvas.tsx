import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Circle, Text, Group, Rect } from 'react-konva';
import useImage from 'use-image';
import { Measurement, Point, Unit } from '../types';

interface CanvasProps {
  image: string;
  mode: 'calibrate' | 'measure' | 'pan';
  scale: number | null;
  unit: Unit;
  measurements: Measurement[];
  onAddMeasurement: (m: Measurement) => void;
  zoom: number;
  setZoom: (z: number) => void;
  pan: Point;
  setPan: (p: Point) => void;
}

export const Canvas = forwardRef<any, CanvasProps>(({ 
  image, 
  mode, 
  scale, 
  unit, 
  measurements, 
  onAddMeasurement,
  zoom,
  setZoom,
  pan,
  setPan
}, ref) => {
  const [img] = useImage(image);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [mousePos, setMousePos] = useState<Point | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [calibrationModal, setCalibrationModal] = useState<{p1: Point, p2: Point, pixelDist: number} | null>(null);
  const [calibrationValue, setCalibrationValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    toDataURL: () => stageRef.current?.toDataURL({ pixelRatio: 2 }),
  }));

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleMouseDown = (e: any) => {
    if (mode === 'pan') return;

    const stage = e.target.getStage();
    const pos = stage.getRelativePointerPosition();
    
    if (currentPoints.length === 0) {
      setCurrentPoints([pos]);
    } else if (currentPoints.length === 1) {
      const p1 = currentPoints[0];
      const p2 = pos;
      const pixelDist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

      if (mode === 'calibrate') {
        setCalibrationModal({ p1, p2, pixelDist });
      } else if (mode === 'measure' && scale) {
        onAddMeasurement({
          id: Math.random().toString(36).substr(2, 9),
          p1,
          p2,
          pixelDistance: pixelDist,
          realDistance: pixelDist / scale,
          unit,
          label: `Measurement ${measurements.length + 1}`
        });
      }
      setCurrentPoints([]);
    }
  };

  const handleCalibrationSubmit = () => {
    if (calibrationModal && calibrationValue && !isNaN(Number(calibrationValue))) {
      onAddMeasurement({
        id: Math.random().toString(36).substr(2, 9),
        p1: calibrationModal.p1,
        p2: calibrationModal.p2,
        pixelDistance: calibrationModal.pixelDist,
        realDistance: Number(calibrationValue),
        unit,
        isReference: true,
        label: 'Reference'
      });
      setCalibrationModal(null);
      setCalibrationValue("");
    }
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const pos = stage.getRelativePointerPosition();
    setMousePos(pos);
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    setZoom(newScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setPan(newPos);
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-zinc-950 overflow-hidden relative">
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        draggable={mode === 'pan'}
        scaleX={zoom}
        scaleY={zoom}
        x={pan.x}
        y={pan.y}
        ref={stageRef}
        className={mode === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}
      >
        <Layer>
          {img && (
            <KonvaImage 
              image={img} 
              alt="Uploaded"
            />
          )}

          {measurements.map((m) => (
            <MeasurementLine key={m.id} measurement={m} zoom={zoom} />
          ))}

          {currentPoints.length === 1 && mousePos && (
            <Group>
              <Line
                points={[currentPoints[0].x, currentPoints[0].y, mousePos.x, mousePos.y]}
                stroke="#fff"
                strokeWidth={1 / zoom}
                dash={[5 / zoom, 5 / zoom]}
              />
              <Circle 
                x={currentPoints[0].x} 
                y={currentPoints[0].y} 
                radius={4 / zoom} 
                fill="#fff" 
              />
              <Circle 
                x={mousePos.x} 
                y={mousePos.y} 
                radius={4 / zoom} 
                fill="#fff" 
                opacity={0.5}
              />
            </Group>
          )}
        </Layer>
      </Stage>
      
      {/* Zoom indicator */}
      <div className="absolute bottom-6 right-6 px-3 py-1.5 bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-full text-[10px] font-mono text-zinc-400 pointer-events-none">
        ZOOM: {(zoom * 100).toFixed(0)}%
      </div>

      {/* Calibration Modal */}
      {calibrationModal && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-2xl w-80">
            <h3 className="text-lg font-semibold mb-2 text-zinc-100">Calibrate Measurement</h3>
            <p className="text-sm text-zinc-400 mb-4">Enter the real-world length of the reference line you just drew.</p>
            <div className="flex items-center gap-3 mb-6">
              <input
                type="number"
                autoFocus
                value={calibrationValue}
                onChange={e => setCalibrationValue(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
                placeholder="e.g. 10"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCalibrationSubmit();
                  if (e.key === 'Escape') {
                    setCalibrationModal(null);
                    setCalibrationValue("");
                  }
                }}
              />
              <span className="text-zinc-500">{unit}</span>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setCalibrationModal(null);
                  setCalibrationValue("");
                }}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCalibrationSubmit}
                className="px-4 py-2 text-sm font-medium bg-zinc-100 text-zinc-950 rounded-lg hover:bg-zinc-200 transition-colors"
              >
                Calibrate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

function MeasurementLine({ measurement, zoom }: { measurement: Measurement; zoom: number }) {
  const { p1, p2, realDistance, unit, isReference } = measurement;
  const color = isReference ? '#f59e0b' : '#10b981';
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;

  return (
    <Group>
      <Line
        points={[p1.x, p1.y, p2.x, p2.y]}
        stroke={color}
        strokeWidth={2 / zoom}
        lineCap="round"
        lineJoin="round"
      />
      <Circle x={p1.x} y={p1.y} radius={4 / zoom} fill={color} stroke="#fff" strokeWidth={1 / zoom} />
      <Circle x={p2.x} y={p2.y} radius={4 / zoom} fill={color} stroke="#fff" strokeWidth={1 / zoom} />
      
      <Group x={midX} y={midY} rotation={angle > 90 || angle < -90 ? angle + 180 : angle}>
        <RectWithText 
          text={`${realDistance.toFixed(2)} ${unit}`} 
          color={color} 
          zoom={zoom}
        />
      </Group>
    </Group>
  );
}

function RectWithText({ text, color, zoom }: { text: string; color: string; zoom: number }) {
  const fontSize = 11 / zoom;
  const padding = 4 / zoom;
  const textWidth = text.length * (fontSize * 0.6);
  
  return (
    <Group offsetY={fontSize + padding * 2}>
      <Rect
        width={textWidth + padding * 2}
        height={fontSize + padding * 2}
        fill={color}
        cornerRadius={4 / zoom}
        offsetX={(textWidth + padding * 2) / 2}
      />
      <Text
        text={text}
        fontSize={fontSize}
        fontFamily="monospace"
        fill="#fff"
        width={textWidth + padding * 2}
        align="center"
        padding={padding}
        offsetX={(textWidth + padding * 2) / 2}
      />
    </Group>
  );
}
