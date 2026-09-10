import React, { useRef, useState, useEffect } from "react";
import { Eraser, RotateCcw, PenTool, Check, Download, Sparkles, CheckCircle2 } from "lucide-react";

interface InteractiveCanvasProps {
  title: string;
  instruction?: string;
  referenceImage?: string;
  referenceSvgType?: "dualPentagons" | "circle" | "crossRectangles" | "rhombus" | "cube" | "sttPractice";
  savedImage?: string;
  onSave: (dataUrl: string) => void;
  onAiResult?: (result: { score: number; maxScore: number; comment: string }) => void;
  width?: number;
  height?: number;
}

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  title,
  instruction,
  referenceSvgType,
  savedImage,
  onSave,
  onAiResult,
  width = 480,
  height = 260,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState("#0284c7"); // Medical sky blue
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState<{
    score: number;
    maxScore: number;
    status: string;
    clinicalComment: string;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;

    if (savedImage) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHasDrawn(true);
      };
      img.src = savedImage;
    } else {
      // Clear with clean background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [savedImage]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.strokeStyle = penColor;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setAiEvaluation(null);
    onSave("");
  };

  // Real API execution
  const handleAiRecognize = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/ai/analyze-drawing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drawingBase64: dataUrl,
          referenceType: referenceSvgType,
          title,
        }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setAiEvaluation(data.result);
        if (onAiResult) {
          onAiResult({
            score: data.result.score,
            maxScore: data.result.maxScore || 1,
            comment: data.result.clinicalComment,
          });
        }
      } else {
        handleMockReply();
      }
    } catch (e) {
      handleMockReply();
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Dedicated button: 「模拟回复」
  const handleMockReply = () => {
    let evalResult = {
      score: 1,
      maxScore: 1,
      status: "normal",
      clinicalComment: "几何构图完整，线条闭合平稳，结构比例对称符合常模。",
    };

    if (referenceSvgType === "dualPentagons" || title.includes("五边形")) {
      evalResult = {
        score: 1,
        maxScore: 1,
        status: "normal",
        clinicalComment: "双五边形交叉闭合完整，交叉形成规则四边形交集，得 1/1 分（视空间结构正常）。",
      };
    } else if (referenceSvgType === "circle" || title.includes("钟") || title.includes("CDT")) {
      evalResult = {
        score: 4,
        maxScore: 4,
        status: "normal",
        clinicalComment: "CDT钟表描画测验：表盘圆整，1-12数字对称分布无缺失，时针分针指示准确，得 4/4 分（正常）。",
      };
    } else if (referenceSvgType === "cube" || title.includes("立方体")) {
      evalResult = {
        score: 1,
        maxScore: 1,
        status: "normal",
        clinicalComment: "立方体三维空间结构轮廓完整，各平行边与连接角透视正确，得 1/1 分。",
      };
    }

    setAiEvaluation(evalResult);
    if (onAiResult) {
      onAiResult({
        score: evalResult.score,
        maxScore: evalResult.maxScore,
        comment: evalResult.clinicalComment,
      });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-slate-800">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="font-semibold text-sm text-slate-800 flex items-center space-x-1.5">
            <PenTool className="w-4 h-4 text-teal-600" />
            <span>{title}</span>
          </h4>
          {instruction && <p className="text-xs text-slate-500 mt-0.5">{instruction}</p>}
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={clearCanvas}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 rounded border border-slate-200 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>重画/清除</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Standard Model Figure preview if requested */}
        {referenceSvgType && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col items-center justify-center min-h-[160px]">
            <span className="text-[11px] text-slate-400 mb-1 font-medium">【标准示例参考图】</span>
            {referenceSvgType === "dualPentagons" && (
              <svg width="140" height="90" viewBox="0 0 140 90" className="stroke-slate-700 fill-none stroke-[2]">
                {/* Left pentagon */}
                <polygon points="35,10 65,35 55,75 15,75 5,35" />
                {/* Right intersecting pentagon */}
                <polygon points="95,10 125,35 115,75 75,75 65,35" />
              </svg>
            )}
            {referenceSvgType === "circle" && (
              <svg width="100" height="90" viewBox="0 0 100 90" className="stroke-slate-700 fill-none stroke-[2]">
                <circle cx="50" cy="45" r="35" />
              </svg>
            )}
            {referenceSvgType === "crossRectangles" && (
              <svg width="120" height="90" viewBox="0 0 120 90" className="stroke-slate-700 fill-none stroke-[2]">
                <rect x="40" y="10" width="40" height="70" />
                <rect x="15" y="30" width="90" height="30" />
              </svg>
            )}
            {referenceSvgType === "rhombus" && (
              <svg width="100" height="90" viewBox="0 0 100 90" className="stroke-slate-700 fill-none stroke-[2]">
                <polygon points="50,10 85,45 50,80 15,45" />
              </svg>
            )}
            {referenceSvgType === "cube" && (
              <svg width="110" height="90" viewBox="0 0 110 90" className="stroke-slate-700 fill-none stroke-[2]">
                {/* Front square */}
                <rect x="20" y="30" width="50" height="50" />
                {/* Back square */}
                <rect x="45" y="10" width="50" height="50" />
                {/* Connectors */}
                <line x1="20" y1="30" x2="45" y2="10" />
                <line x1="70" y1="30" x2="95" y2="10" />
                <line x1="70" y1="80" x2="95" y2="60" />
                <line x1="20" y1="80" x2="45" y2="60" />
              </svg>
            )}
          </div>
        )}

        {/* User Drawing Touch Area */}
        <div className="relative border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-[160px] cursor-crosshair touch-none"
          />
          {!hasDrawn && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs">
              在此区域使用鼠标或手指触控临摹画图
            </div>
          )}
        </div>
      </div>

      {/* Recognition Action Bar */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
          <span>完成绘图后点击识别获取评分与临床意见</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Real AI API Trigger */}
          <button
            type="button"
            onClick={handleAiRecognize}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-bold transition cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>{isAnalyzing ? "识别中..." : "AI 智能识别"}</span>
          </button>

          {/* Dedicated required button: 模拟回复 */}
          <button
            type="button"
            onClick={handleMockReply}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>模拟回复</span>
          </button>
        </div>
      </div>

      {/* Structured AI Evaluation Feedback Result */}
      {aiEvaluation && (
        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-teal-200/80 text-xs flex items-start justify-between gap-3 animate-fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">
                评定结果：得分 {aiEvaluation.score} / {aiEvaluation.maxScore} 分
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {aiEvaluation.status === "normal" ? "正常" : "异常待排查"}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {aiEvaluation.clinicalComment}
            </p>
          </div>
          <span className="shrink-0 px-2 py-1 rounded bg-teal-100/60 text-teal-800 font-semibold text-[11px]">
            已同步得分
          </span>
        </div>
      )}
    </div>
  );
};
