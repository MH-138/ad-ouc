/**
 * Web Speech Synthesis TTS Helper for elderly-friendly voice readout
 */
class SpeechHelper {
  private isSupported: boolean;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private speakingId: string | null = null;
  private onStateChangeCallback: ((speakingId: string | null) => void) | null = null;

  constructor() {
    this.isSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  }

  public setListener(cb: (speakingId: string | null) => void) {
    this.onStateChangeCallback = cb;
  }

  public speak(id: string, text: string, rate: number = 0.9) {
    if (!this.isSupported) {
      console.warn("Speech Synthesis is not supported in this browser environment.");
      return;
    }

    // If already speaking this item, toggle stop
    if (this.speakingId === id) {
      this.stop();
      return;
    }

    // Stop any ongoing speech
    this.stop();

    try {
      // Clean up text for clearer speech
      const cleanText = text
        .replace(/[*#_`]/g, "")
        .replace(/【.*?】/g, "")
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "zh-CN";
      utterance.rate = rate; // 0.9 for friendly, clear elderly-friendly cadence
      utterance.pitch = 1.0;

      // Try to find a high quality Chinese voice
      const voices = window.speechSynthesis.getVoices();
      const zhVoice = voices.find(
        (v) => v.lang === "zh-CN" || v.lang === "zh_CN" || v.lang.startsWith("zh")
      );
      if (zhVoice) {
        utterance.voice = zhVoice;
      }

      utterance.onstart = () => {
        this.speakingId = id;
        if (this.onStateChangeCallback) this.onStateChangeCallback(id);
      };

      utterance.onend = () => {
        this.speakingId = null;
        this.currentUtterance = null;
        if (this.onStateChangeCallback) this.onStateChangeCallback(null);
      };

      utterance.onerror = () => {
        this.speakingId = null;
        this.currentUtterance = null;
        if (this.onStateChangeCallback) this.onStateChangeCallback(null);
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("TTS playback error:", e);
      this.speakingId = null;
      if (this.onStateChangeCallback) this.onStateChangeCallback(null);
    }
  }

  public stop() {
    if (this.isSupported && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.speakingId = null;
    this.currentUtterance = null;
    if (this.onStateChangeCallback) this.onStateChangeCallback(null);
  }

  public getSpeakingId() {
    return this.speakingId;
  }
}

export const tts = new SpeechHelper();
