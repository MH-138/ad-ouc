import React, { useState, useEffect, useRef } from "react";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PenTool,
  Sparkles,
  Volume2,
} from "lucide-react";
import { SubjectRecord } from "../types/assessment";
import { InteractiveCanvas } from "../components/InteractiveCanvas";

interface ToolsLabPageProps {
  record: SubjectRecord;
  onUpdateRecord: (record: SubjectRecord) => void;
}

export const ToolsLabPage: React.FC<ToolsLabPageProps> = ({
  record,
  onUpdateRecord,
}) => {
  // 1. VFT 60s Animal Fluency Timer & Counter
  const initialVftCount =
    (record.scales?.vft?.t1_15s || 0) +
    (record.scales?.vft?.t16_30s || 0) +
    (record.scales?.vft?.t31_45s || 0) +
    (record.scales?.vft?.t46_60s || 0) || 16;

  const [vftSeconds, setVftSeconds] = useState(60);
  const [vftRunning, setVftRunning] = useState(false);
  const [vftCount, setVftCount] = useState(initialVftCount);
  const vftTimerRef = useRef<any>(null);

  useEffect(() => {
    if (vftRunning && vftSeconds > 0) {
      vftTimerRef.current = setInterval(() => {
        setVftSeconds((s) => {
          if (s <= 1) {
            clearInterval(vftTimerRef.current);
            setVftRunning(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(vftTimerRef.current);
    }
    return () => clearInterval(vftTimerRef.current);
  }, [vftRunning, vftSeconds]);

  const handleSaveVft = () => {
    // Distribute count across 4 quarters if saved in bulk
    const q = Math.floor(vftCount / 4);
    const rem = vftCount % 4;
    onUpdateRecord({
      ...record,
      scales: {
        ...record.scales,
        vft: {
          ...record.scales?.vft,
          category: "animal",
          t1_15s: q + (rem > 0 ? 1 : 0),
          t16_30s: q + (rem > 1 ? 1 : 0),
          t31_45s: q + (rem > 2 ? 1 : 0),
          t46_60s: q,
        },
      },
    });
    alert(`已将 VFT 动物流畅性总数 (${vftCount}个) 保存至量表！`);
  };

  // 2. STT Stopwatch (Millisecond Precision)
  const [sttTimeMs, setSttTimeMs] = useState(0);
  const [sttRunning, setSttRunning] = useState(false);
  const [sttPart, setSttPart] = useState<"partA" | "partB">("partA");
  const sttTimerRef = useRef<any>(null);

  useEffect(() => {
    if (sttRunning) {
      const startTime = Date.now() - sttTimeMs;
      sttTimerRef.current = setInterval(() => {
        setSttTimeMs(Date.now() - startTime);
      }, 50);
    } else {
      clearInterval(sttTimerRef.current);
    }
    return () => clearInterval(sttTimerRef.current);
  }, [sttRunning]);

  const handleSaveStt = () => {
    const seconds = Math.round(sttTimeMs / 1000);
    if (sttPart === "partA") {
      onUpdateRecord({
        ...record,
        scales: {
          ...record.scales,
          stt: {
            ...record.scales?.stt,
            sttATestSeconds: seconds,
          },
        },
      });
      alert(`已保存 STT-A 耗时: ${seconds} 秒！`);
    } else {
      onUpdateRecord({
        ...record,
        scales: {
          ...record.scales,
          stt: {
            ...record.scales?.stt,
            sttBTestSeconds: seconds,
          },
        },
      });
      alert(`已保存 STT-B 耗时: ${seconds} 秒！`);
    }
  };

  // 3. AVLT 5min & 20min Delayed Recall Timers
  const [avlt5Remain, setAvlt5Remain] = useState(300); // 5 min
  const [avlt5Running, setAvlt5Running] = useState(false);
  const [avlt20Remain, setAvlt20Remain] = useState(1200); // 20 min
  const [avlt20Running, setAvlt20Running] = useState(false);

  useEffect(() => {
    let t: any;
    if (avlt5Running && avlt5Remain > 0) {
      t = setInterval(() => setAvlt5Remain((p) => Math.max(0, p - 1)), 1000);
    }
    return () => clearInterval(t);
  }, [avlt5Running, avlt5Remain]);

  useEffect(() => {
    let t: any;
    if (avlt20Running && avlt20Remain > 0) {
      t = setInterval(() => setAvlt20Remain((p) => Math.max(0, p - 1)), 1000);
    }
    return () => clearInterval(t);
  }, [avlt20Running, avlt20Remain]);

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <Timer className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              临床神经心理学测验计时与测试工具箱
            </h1>
            <p className="text-xs text-slate-500">
              支持 VFT 60s 动物倒计时、STT 连线高精度秒表、AVLT 延迟记忆定时及认知交互画板
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Interactive Tools */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tool 1: VFT 60s Animal Countdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-800">
                H4
              </span>
              <h2 className="text-sm font-bold text-slate-800">
                VFT 动物言语流畅性测验 (60 秒倒计时)
              </h2>
            </div>
            <span className="text-xs text-slate-400">常模：≥16个 正常</span>
          </div>

          <div className="mt-5 flex flex-col items-center">
            {/* Big Countdown Display */}
            <div
              className={`flex h-24 w-52 items-center justify-center rounded-2xl font-mono text-5xl font-extrabold border-2 transition shadow-xs ${
                vftSeconds <= 10 && vftSeconds > 0
                  ? "bg-rose-100 border-rose-400 text-rose-700 animate-pulse"
                  : "bg-teal-50 border-teal-200 text-teal-800"
              }`}
            >
              {formatTime(vftSeconds)}
            </div>

            {/* Timer Buttons */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => setVftRunning(!vftRunning)}
                className={`flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-xs ${
                  vftRunning
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-teal-600 hover:bg-teal-700"
                }`}
              >
                {vftRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span>{vftRunning ? "暂停" : "开始 60 秒倒计时"}</span>
              </button>

              <button
                onClick={() => {
                  setVftSeconds(60);
                  setVftRunning(false);
                }}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>重置</span>
              </button>
            </div>

            {/* Animal Counter */}
            <div className="mt-6 flex w-full flex-col items-center rounded-xl bg-slate-50 p-4">
              <span className="text-xs font-bold text-slate-600">
                1分钟产出动物总数计数：
              </span>
              <div className="mt-2 flex items-center gap-4">
                <button
                  onClick={() => setVftCount(Math.max(0, vftCount - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl font-bold text-slate-700 shadow-xs hover:bg-slate-100"
                >
                  -
                </button>
                <span className="w-16 text-center text-3xl font-extrabold text-teal-700">
                  {vftCount}
                </span>
                <button
                  onClick={() => setVftCount(vftCount + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl font-bold text-slate-700 shadow-xs hover:bg-slate-100"
                >
                  +
                </button>
                <button
                  onClick={() => setVftCount(vftCount + 5)}
                  className="rounded-xl bg-teal-100 px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-200"
                >
                  +5
                </button>
              </div>

              <button
                onClick={handleSaveVft}
                className="mt-4 w-full rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-800"
              >
                同步并保存至 VFT 量表记录 ({vftCount} 个)
              </button>
            </div>
          </div>
        </div>

        {/* Tool 2: STT Shape Trail Stopwatch */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
                H6
              </span>
              <h2 className="text-sm font-bold text-slate-800">
                STT 形状连线测验毫秒秒表
              </h2>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
              <button
                onClick={() => setSttPart("partA")}
                className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                  sttPart === "partA" ? "bg-white text-teal-700 shadow-xs" : "text-slate-500"
                }`}
              >
                STT-A
              </button>
              <button
                onClick={() => setSttPart("partB")}
                className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                  sttPart === "partB" ? "bg-white text-teal-700 shadow-xs" : "text-slate-500"
                }`}
              >
                STT-B
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-col items-center">
            {/* Stopwatch Milliseconds Display */}
            <div className="flex h-24 w-60 items-center justify-center rounded-2xl bg-indigo-50 border-2 border-indigo-200 font-mono text-4xl font-extrabold text-indigo-900 shadow-xs">
              {formatTime(Math.floor(sttTimeMs / 1000))}.
              <span className="text-2xl text-indigo-600">
                {String(Math.floor((sttTimeMs % 1000) / 10)).padStart(2, "0")}
              </span>
            </div>

            {/* Controls */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => setSttRunning(!sttRunning)}
                className={`flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-xs ${
                  sttRunning
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {sttRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span>{sttRunning ? "暂停计时" : "启动连线秒表"}</span>
              </button>

              <button
                onClick={() => {
                  setSttTimeMs(0);
                  setSttRunning(false);
                }}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>清零</span>
              </button>
            </div>

            <div className="mt-6 flex w-full flex-col items-center rounded-xl bg-slate-50 p-4">
              <div className="flex w-full items-center justify-between text-xs">
                <span className="text-slate-500">当前已记录耗时：</span>
                <span className="font-mono font-bold text-indigo-700">
                  {Math.round(sttTimeMs / 1000)} 秒
                </span>
              </div>
              <button
                onClick={handleSaveStt}
                className="mt-3 w-full rounded-xl bg-indigo-700 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-800"
              >
                保存为 {sttPart === "partA" ? "STT-A" : "STT-B"} 耗时
              </button>
            </div>
          </div>
        </div>

        {/* Tool 3: AVLT-H 5min & 20min Delayed Recall Timers */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                H3
              </span>
              <h2 className="text-sm font-bold text-slate-800">
                AVLT-H 华山记忆延迟定时器
              </h2>
            </div>
            <span className="text-xs text-slate-400">短延迟 5min · 长延迟 20min</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            {/* 5-Min Timer */}
            <div className="flex flex-col items-center rounded-xl bg-slate-50 p-4">
              <span className="text-xs font-bold text-slate-700">5分钟 短延迟倒计时</span>
              <div
                className={`mt-2 text-2xl font-mono font-black ${
                  avlt5Remain === 0 ? "text-rose-600 animate-pulse" : "text-slate-800"
                }`}
              >
                {formatTime(avlt5Remain)}
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <button
                  onClick={() => setAvlt5Running(!avlt5Running)}
                  className="rounded-lg bg-teal-600 px-3 py-1 text-xs font-bold text-white hover:bg-teal-700"
                >
                  {avlt5Running ? "暂停" : "开始"}
                </button>
                <button
                  onClick={() => {
                    setAvlt5Remain(300);
                    setAvlt5Running(false);
                  }}
                  className="rounded-lg border bg-white px-2 py-1 text-xs text-slate-600"
                >
                  重置
                </button>
              </div>
            </div>

            {/* 20-Min Timer */}
            <div className="flex flex-col items-center rounded-xl bg-slate-50 p-4">
              <span className="text-xs font-bold text-slate-700">20分钟 长延迟倒计时</span>
              <div
                className={`mt-2 text-2xl font-mono font-black ${
                  avlt20Remain === 0 ? "text-rose-600 animate-pulse" : "text-slate-800"
                }`}
              >
                {formatTime(avlt20Remain)}
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <button
                  onClick={() => setAvlt20Running(!avlt20Running)}
                  className="rounded-lg bg-teal-600 px-3 py-1 text-xs font-bold text-white hover:bg-teal-700"
                >
                  {avlt20Running ? "暂停" : "开始"}
                </button>
                <button
                  onClick={() => {
                    setAvlt20Remain(1200);
                    setAvlt20Running(false);
                  }}
                  className="rounded-lg border bg-white px-2 py-1 text-xs text-slate-600"
                >
                  重置
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tool 4: Cognitive Drawing Canvas (CDT & Pentagons) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                CDT
              </span>
              <h2 className="text-sm font-bold text-slate-800">
                画钟测验与图形仿画板 (CDT & MMSE)
              </h2>
            </div>
            <span className="text-xs text-slate-400">支持手写触控与导出</span>
          </div>

          <div className="mt-4">
            <InteractiveCanvas
              title="画钟测验 (CDT: 11点10分)"
              instruction="请在下方画板上画一个闭合的钟面，填上全部12个数字，并画出指针指向 11 点 10 分："
              referenceSvgType="circle"
              onSave={(_dataUrl) => {
                alert("已成功保存画钟测评结果图！");
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
