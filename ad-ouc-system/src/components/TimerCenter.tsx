import React, { useState, useEffect } from "react";
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  X,
  Bell,
  CheckCircle,
} from "lucide-react";

interface TimerItem {
  id: string;
  name: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isFinished: boolean;
}

const INITIAL_TIMERS: TimerItem[] = [
  {
    id: "avlt_short",
    name: "华山记忆 (AVLT-H) 短延迟回忆",
    totalSeconds: 300, // 5 mins
    remainingSeconds: 300,
    isRunning: false,
    isFinished: false,
  },
  {
    id: "avlt_long",
    name: "华山记忆 (AVLT-H) 长延迟回忆与再认",
    totalSeconds: 1200, // 20 mins
    remainingSeconds: 1200,
    isRunning: false,
    isFinished: false,
  },
  {
    id: "moca_delay",
    name: "MoCA-B 基础认知延迟回忆计时",
    totalSeconds: 300, // 5 mins
    remainingSeconds: 300,
    isRunning: false,
    isFinished: false,
  },
  {
    id: "vft_60s",
    name: "言语流畅性测验 (VFT) 60秒倒计时",
    totalSeconds: 60, // 1 min
    remainingSeconds: 60,
    isRunning: false,
    isFinished: false,
  },
];

interface TimerCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TimerCenter: React.FC<TimerCenterProps> = ({ isOpen, onClose }) => {
  const [timers, setTimers] = useState<TimerItem[]>(() => {
    const saved = localStorage.getItem("scd_active_timers");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_TIMERS;
      }
    }
    return INITIAL_TIMERS;
  });

  // Sound generator using Web Audio API
  const playAlarmSound = () => {
    try {
      const AudioContext =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const playBeep = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Play chime: 3 harmonious beeps
      playBeep(880, 0, 0.2);
      playBeep(1046.5, 0.25, 0.2);
      playBeep(1318.5, 0.5, 0.4);
    } catch (err) {
      console.warn("Web audio playback not permitted or supported yet:", err);
    }
  };

  // Timer Tick Interval
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        let hasChanges = false;
        const updated = prev.map((t) => {
          if (!t.isRunning) return t;
          hasChanges = true;
          if (t.remainingSeconds <= 1) {
            playAlarmSound();
            return {
              ...t,
              remainingSeconds: 0,
              isRunning: false,
              isFinished: true,
            };
          }
          return {
            ...t,
            remainingSeconds: t.remainingSeconds - 1,
          };
        });

        if (hasChanges) {
          localStorage.setItem("scd_active_timers", JSON.stringify(updated));
        }
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleTimer = (id: string) => {
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          if (t.remainingSeconds === 0) {
            return {
              ...t,
              remainingSeconds: t.totalSeconds,
              isRunning: true,
              isFinished: false,
            };
          }
          return { ...t, isRunning: !t.isRunning };
        }
        return t;
      })
    );
  };

  const resetTimer = (id: string) => {
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            remainingSeconds: t.totalSeconds,
            isRunning: false,
            isFinished: false,
          };
        }
        return t;
      })
    );
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                延迟回忆与测验计时控制台
              </h3>
              <p className="text-xs text-slate-500">
                后台持续计时，到时温和蜂鸣提醒，保障延迟回忆时间节点精准
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timers List */}
        <div className="p-6 space-y-3.5 overflow-y-auto flex-1 bg-white">
          {timers.map((timer) => {
            const percent = ((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100;
            return (
              <div
                key={timer.id}
                className={`p-4 rounded-xl border transition ${
                  timer.isFinished
                    ? "bg-amber-50/80 border-amber-300"
                    : timer.isRunning
                    ? "bg-teal-50/50 border-teal-300 shadow-2xs"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-800">
                      {timer.name}
                    </span>
                    {timer.isFinished && (
                      <span className="px-2 py-0.5 text-[11px] rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200 flex items-center space-x-1">
                        <Bell className="w-3 h-3 text-amber-600" />
                        <span>已到时！请开始延迟回忆</span>
                      </span>
                    )}
                  </div>
                  <div
                    className={`font-mono text-xl font-bold tracking-wider ${
                      timer.isFinished
                        ? "text-amber-700"
                        : timer.isRunning
                        ? "text-teal-700"
                        : "text-slate-700"
                    }`}
                  >
                    {formatTime(timer.remainingSeconds)}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full transition-all duration-300 ${
                      timer.isFinished
                        ? "bg-amber-500"
                        : timer.isRunning
                        ? "bg-teal-600"
                        : "bg-slate-400"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {/* Control Actions */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    设定时长: {Math.round(timer.totalSeconds / 60)} 分钟 ({timer.totalSeconds} 秒)
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleTimer(timer.id)}
                      className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs ${
                        timer.isRunning
                          ? "bg-amber-600 hover:bg-amber-700 text-white"
                          : "bg-teal-600 hover:bg-teal-700 text-white"
                      }`}
                    >
                      {timer.isRunning ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>暂停</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>{timer.remainingSeconds === 0 ? "重新开始" : "开始计时"}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => resetTimer(timer.id)}
                      className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
                      title="重置"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1.5">
            <Volume2 className="w-4 h-4 text-teal-600" />
            <span>提醒音效已开启（内置温和三音提示）</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition shadow-2xs"
          >
            完成并留在后台运行
          </button>
        </div>
      </div>
    </div>
  );
};
