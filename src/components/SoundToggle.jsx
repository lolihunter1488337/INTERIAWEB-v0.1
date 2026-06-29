import { useState } from "react";
import { isSoundOn, setSound, playClick } from "../sound.js";

export default function SoundToggle() {
  const [on, setOn] = useState(isSoundOn());
  return (
    <button onClick={() => { const v = !on; setSound(v); setOn(v); if (v) playClick(); }}
      className="snd-toggle label flex items-center gap-2 rounded-full border border-white/12 bg-bg/70 px-3 py-2 text-muted backdrop-blur transition-colors hover:text-ink"
      aria-label="Звук">
      <span>{on ? "♪" : "✕"}</span><span className="hidden sm:inline">{on ? "ЗВУК ВКЛ" : "ЗВУК ВЫКЛ"}</span>
    </button>
  );
}
