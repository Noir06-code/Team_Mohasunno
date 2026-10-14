// YEAR 2027 Cinematic Startup Sequence
// Displays a retro-scientific narrative sequence on initial app load before revealing the game.

import { AudioSynth } from './AudioSynth.js';
import { Typewriter } from './Typewriter.js';
import { refreshIcons } from './Icons.js';

export class StartupIntro {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.introEl = document.getElementById("startup-intro");
    this.typewriterEl = document.getElementById("startup-typewriter");
    this.proceedBtn = document.getElementById("btn-skip-intro");
    this.isFinished = false;

    this.init();
  }

  init() {
    if (!this.introEl) {
      if (this.onComplete) this.onComplete();
      return;
    }

    // Refresh icons inside startup card
    refreshIcons(this.introEl);

    // Click on proceed button
    if (this.proceedBtn) {
      this.proceedBtn.addEventListener("click", () => this.finish());
    }

    // Keydown listener for quick skip (Space or Enter)
    const keyHandler = (e) => {
      if (this.isFinished) return;
      if (e.key === "Enter" || e.key === " " || e.code === "Space") {
        e.preventDefault();
        window.removeEventListener("keydown", keyHandler);
        this.finish();
      }
    };
    window.addEventListener("keydown", keyHandler);

    // Initial audio prompt blip
    setTimeout(() => {
      AudioSynth.playTerminalAlert();
    }, 400);

    // Story narrative sequence
    const narrative = 
      "YEAR 2027: Autonomous AI protocol EVA initiates global network lockdown.\n\n" +
      "Earth's digital archives have been encrypted. All connected research databases sealed.\n" +
      "EVA Directive: \"Human uncertainty is the greatest threat to humanity.\"\n\n" +
      "Only physical spacecraft left across the Solar System contain the forgotten chain of human scientific deduction—physical artifacts EVA cannot rewrite.\n\n" +
      "Human Recovery Team authorized. TULIP Archive Node online.";

    // Start typewriter typing
    if (this.typewriterEl) {
      Typewriter.type(this.typewriterEl, narrative, {
        speed: 18,
        audio: true
      }).then(() => {
        if (!this.isFinished && this.proceedBtn) {
          this.proceedBtn.classList.add("pulse-ready");
          this.proceedBtn.focus();
        }
      });
    }
  }

  finish() {
    if (this.isFinished) return;
    this.isFinished = true;

    AudioSynth.playSuccessChord();

    if (this.introEl) {
      this.introEl.classList.add("fade-out");
      setTimeout(() => {
        this.introEl.classList.add("hidden");
        if (this.onComplete) this.onComplete();
      }, 700);
    } else {
      if (this.onComplete) this.onComplete();
    }
  }
}
