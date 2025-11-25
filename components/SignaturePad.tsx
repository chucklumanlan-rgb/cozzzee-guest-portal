import React, { useRef, useEffect, useState } from 'react';

interface SignaturePadProps {
    onChange: (base64: string) => void;
}

export function SignaturePad({ onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set resolution
    canvas.width = 500;
    canvas.height = 200;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#19488a'; // CoZzzee Blue

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
      return { x: x - rect.left, y: y - rect.top };
    };

    const startDrawing = (e: any) => {
      e.preventDefault();
      setIsSigning(true);
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (e: any) => {
      if (!isSigning) return;
      e.preventDefault();
      const { x, y } = getPos(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const stopDrawing = () => {
        setIsSigning(false);
        onChange(canvas.toDataURL());
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [isSigning, onChange]);

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      onChange("");
    }
  };

  return (
    <div>
      <div className="rounded-2xl border border-pink-300 bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-[200px] touch-none"
          style={{ width: '100%', height: '200px' }}
        />
      </div>

      <button
        type="button"
        className="mt-3 text-sm text-blue-600 underline hover:text-blue-800"
        onClick={clear}
      >
        Clear signature
      </button>
    </div>
  );
}
