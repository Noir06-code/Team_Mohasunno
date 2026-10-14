// Storytelling Typewriter Animation Engine
// Animates text letter-by-letter with retro cursor and audio clicks

import { AudioSynth } from './AudioSynth.js';

export class Typewriter {
  /**
   * Types out plain text or HTML content into targetElement.
   * Handles HTML tags gracefully by revealing whole tags instantly.
   */
  static type(element, textOrHtml, options = {}) {
    if (!element) return Promise.resolve();

    const speed = options.speed || 18;
    const playAudio = options.audio !== false;
    const onComplete = options.onComplete;

    // Clear element
    element.innerHTML = "";
    element.classList.add("typewriter-active");

    // Tokenize text into printable characters and HTML tags
    const tokens = [];
    let i = 0;
    while (i < textOrHtml.length) {
      if (textOrHtml[i] === "<") {
        const closeIdx = textOrHtml.indexOf(">", i);
        if (closeIdx !== -1) {
          tokens.push({ type: "tag", content: textOrHtml.substring(i, closeIdx + 1) });
          i = closeIdx + 1;
          continue;
        }
      }
      tokens.push({ type: "char", content: textOrHtml[i] });
      i++;
    }

    return new Promise((resolve) => {
      let tokenIdx = 0;
      let isCancelled = false;

      // Allow click-to-skip so students can read at their own pace
      const skipHandler = (e) => {
        if (tokenIdx < tokens.length) {
          e.stopPropagation();
          isCancelled = true;
          element.innerHTML = textOrHtml;
          cleanup();
          resolve();
        }
      };

      element.addEventListener("click", skipHandler, { once: true });

      const cleanup = () => {
        element.classList.remove("typewriter-active");
        element.removeEventListener("click", skipHandler);
        if (onComplete) onComplete();
      };

      let soundCounter = 0;

      const step = () => {
        if (isCancelled) return;

        if (tokenIdx >= tokens.length) {
          cleanup();
          resolve();
          return;
        }

        const token = tokens[tokenIdx];
        if (token.type === "tag") {
          element.innerHTML += token.content;
          tokenIdx++;
          step();
        } else {
          element.innerHTML += token.content;
          tokenIdx++;

          // Audio feedback every 3 characters
          if (playAudio) {
            soundCounter++;
            if (soundCounter % 3 === 0) {
              AudioSynth.playClick();
            }
          }

          setTimeout(step, speed);
        }
      };

      step();
    });
  }

  /**
   * Types out a sequential series of messages (e.g. computer dialog)
   */
  static async typeSequence(messages, container, options = {}) {
    for (const msg of messages) {
      const msgDiv = document.createElement("div");
      msgDiv.className = msg.className || "chat-msg computer";
      container.appendChild(msgDiv);
      await this.type(msgDiv, msg.html, options);
      if (options.pauseBetween) {
        await new Promise(r => setTimeout(r, options.pauseBetween));
      }
    }
  }
}
