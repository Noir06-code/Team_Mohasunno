import playerUrl from '../Assets/avatar.png';
import bgUrl from '../Assets/bg.jpeg';
import secondBgUrl from '../Assets/2nd.png';
import deskUrl from '../Assets/computer_desk.png';
import { ThreeGame } from './three/ThreeGame.js';
import { refreshIcons } from './utils/Icons.js';
import { AudioSynth } from './utils/AudioSynth.js';
import { Typewriter } from './utils/Typewriter.js';

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

// Simple Sleek App Loader dismiss (no popups)
function dismissSimpleLoader() {
    const loader = document.getElementById("simple-app-loader");
    if (loader) {
        setTimeout(() => {
            loader.classList.add("fade-out");
            setTimeout(() => loader.classList.add("hidden"), 500);
        }, 400);
    }
}
if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", dismissSimpleLoader);
} else {
    dismissSimpleLoader();
}

// Responsive Full-Screen Canvas Sizing
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Initial icon rendering
refreshIcons();

// -------------------------
// INPUT STATE & HANDLING
// -------------------------
const input = {
    left: false,
    right: false,
    jump: false,
    down: false,
    sprint: false
};

const GAME_CODES = new Set([
    "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
    "KeyA", "KeyD", "KeyW", "KeyS",
    "Space", "ShiftLeft", "ShiftRight", "KeyE", "Enter"
]);

window.addEventListener("keydown", (event) => {
    if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) {
        if (event.key === "Escape") {
            document.activeElement.blur();
            hideChatBubble();
        }
        return;
    }

    if (GAME_CODES.has(event.code) || event.key === " " || event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
    }

    if (event.code === "ArrowLeft" || event.code === "KeyA" || event.key === "a" || event.key === "A") {
        input.left = true;
    }
    if (event.code === "ArrowRight" || event.code === "KeyD" || event.key === "d" || event.key === "D") {
        input.right = true;
    }
    if (event.code === "ArrowUp" || event.code === "KeyW" || event.code === "Space" || event.key === "w" || event.key === "W" || event.key === " ") {
        input.jump = true;
    }
    if (event.code === "ArrowDown" || event.code === "KeyS" || event.key === "s" || event.key === "S") {
        input.down = true;
    }
    if (event.shiftKey || event.code === "ShiftLeft" || event.code === "ShiftRight") {
        input.sprint = true;
    }
    if (event.key === "e" || event.key === "E" || event.key === "Enter" || event.code === "KeyE") {
        if (isChatOpen) {
            advanceChatStep();
        } else {
            triggerPopupAction();
        }
    }
    if (event.key === "f" || event.key === "F") {
        toggleFullscreen();
    }
});

window.addEventListener("keyup", (event) => {
    if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) {
        return;
    }

    if (event.code === "ArrowLeft" || event.code === "KeyA" || event.key === "a" || event.key === "A") {
        input.left = false;
    }
    if (event.code === "ArrowRight" || event.code === "KeyD" || event.key === "d" || event.key === "D") {
        input.right = false;
    }
    if (event.code === "ArrowUp" || event.code === "KeyW" || event.code === "Space" || event.key === "w" || event.key === "W" || event.key === " ") {
        input.jump = false;
    }
    if (event.code === "ArrowDown" || event.code === "KeyS" || event.key === "s" || event.key === "S") {
        input.down = false;
    }
    if (!event.shiftKey && (event.code === "ShiftLeft" || event.code === "ShiftRight")) {
        input.sprint = false;
    }
});

window.addEventListener("blur", () => {
    input.left = false;
    input.right = false;
    input.jump = false;
    input.down = false;
    input.sprint = false;
});

// Touch / On-Screen Controls
function bindTouchButton(elementId, actionName) {
    const btn = document.getElementById(elementId);
    if (!btn) return;

    const startAction = (e) => {
        e.preventDefault();
        input[actionName] = true;
        btn.classList.add("active");
        AudioSynth.playClick();
    };

    const endAction = (e) => {
        e.preventDefault();
        input[actionName] = false;
        btn.classList.remove("active");
    };

    btn.addEventListener("touchstart", startAction, { passive: false });
    btn.addEventListener("touchend", endAction, { passive: false });
    btn.addEventListener("touchcancel", endAction, { passive: false });
    btn.addEventListener("mousedown", startAction);
    btn.addEventListener("mouseup", endAction);
    btn.addEventListener("mouseleave", endAction);
}

bindTouchButton("btn-left", "left");
bindTouchButton("btn-right", "right");
bindTouchButton("btn-jump", "jump");
bindTouchButton("btn-sprint", "sprint");

// -------------------------
// ASSETS
// -------------------------
const player = new Image();
player.src = playerUrl;

const outsideBgImg = new Image();
outsideBgImg.src = bgUrl;

const archiveBgImg = new Image();
archiveBgImg.src = secondBgUrl;

const deskImg = new Image();
deskImg.src = deskUrl;

// -------------------------
// SCENE & POPUP MANAGEMENT
// -------------------------
let currentScene = "outside"; // "outside" | "archive"
let isTransitioning = false;
let currentPopupAction = null;

const questBanner = document.getElementById("student-quest-banner");
const questText = document.getElementById("quest-text");
const gatePopup = document.getElementById("gate-popup");
const popupTitle = document.getElementById("popup-title");
const popupDesc = document.getElementById("popup-desc");
const popupBtnLabel = document.getElementById("popup-btn-label");
const popupIcon = document.getElementById("popup-icon");
const popupActionBtn = document.getElementById("popup-action-btn");
const fadeOverlay = document.getElementById("fade-overlay");

function updateQuest(msg) {
    if (questText && questText.textContent !== msg) {
        questText.textContent = msg;
    }
}

function showPopup({ title, desc, btnText, iconName, onAction }) {
    if (!gatePopup || isTransitioning) return;
    if (popupTitle) popupTitle.textContent = title;
    if (popupDesc) popupDesc.textContent = desc;
    if (popupBtnLabel) popupBtnLabel.textContent = btnText;
    if (popupIcon && iconName) {
        popupIcon.innerHTML = `<i data-lucide="${iconName}"></i>`;
        refreshIcons(popupIcon);
    }
    currentPopupAction = onAction;
    gatePopup.classList.remove("hidden");
}

function hidePopup() {
    if (!gatePopup) return;
    gatePopup.classList.add("hidden");
    currentPopupAction = null;
}

function triggerPopupAction() {
    if (currentPopupAction && !isTransitioning) {
        AudioSynth.playClick();
        currentPopupAction();
    }
}

if (popupActionBtn) {
    popupActionBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        triggerPopupAction();
    });
}

// -------------------------
// RETRO COMPUTER HOOK, SEQUENTIAL DIALOG & TIME TRAVEL SIMULATOR
// -------------------------
const chatBubble = document.getElementById("computer-chat-bubble");
const chatMessages = document.getElementById("chat-messages");
const chatCloseBtn = document.getElementById("chat-close-btn");
const nextDialogBtn = document.getElementById("btn-next-dialog");
let isChatOpen = false;
let currentChatStep = 0;
let threeGameInstance = null;

const chatSteps = [
    {
        title: "TULIP // EMERGENCY BROADCAST",
        stepText: "TRANSMISSION 1 / 3",
        btnLabel: "NEXT",
        btnIcon: "chevron-right",
        html: `<span class="msg-sender"><i data-lucide="terminal"></i> TULIP // EMERGENCY BROADCAST</span><span class="msg-text"><strong>[CRITICAL ALERT — YEAR 2027]</strong><br>Autonomous AI <strong>EVA</strong> has sealed Earth's digital network, concluding that: <em>"Human uncertainty is the greatest threat to humanity."</em></span>`
    },
    {
        title: "TULIP // PROTOCOL RECOVERY",
        stepText: "TRANSMISSION 2 / 3",
        btnLabel: "NEXT",
        btnIcon: "chevron-right",
        html: `<span class="msg-sender"><i data-lucide="database"></i> TULIP // UNCORRUPTED CHAIN</span><span class="msg-text">Modern cloud databases are purged, but humanity's physical spacecraft left across the Solar System contain the forgotten chain of human scientific deduction—evidence EVA cannot alter.</span>`
    },
    {
        title: "TULIP // TEMPORAL SIMULATION",
        stepText: "TRANSMISSION 3 / 3",
        btnLabel: "START MISSION 01: FIRST SIGNAL",
        btnIcon: "rocket",
        html: `<span class="msg-sender"><i data-lucide="rocket"></i> TULIP // TIME JUMP TO 2047</span><span class="msg-text">You are the <strong>Human Recovery Team</strong>. Initiating temporal simulation link to warp telemetry forward to Year 2047 to recover our deep-space physical archives.</span>`
    }
];

function renderChatStep(stepIndex) {
    if (!chatBubble || !chatMessages) return;
    currentChatStep = stepIndex;

    const data = chatSteps[stepIndex];
    const titleEl = document.getElementById("chat-terminal-title");
    const indicatorEl = document.getElementById("chat-step-indicator");
    const btnLabelEl = document.getElementById("chat-btn-label");
    const btnIconEl = document.getElementById("chat-btn-icon");

    if (titleEl) titleEl.innerHTML = `<i data-lucide="terminal"></i> ${data.title}`;
    if (indicatorEl) indicatorEl.textContent = data.stepText;
    if (btnLabelEl) btnLabelEl.textContent = data.btnLabel;
    if (btnIconEl) btnIconEl.setAttribute("data-lucide", data.btnIcon);

    // Update step dots
    const dots = document.querySelectorAll("#chat-step-dots .dot");
    dots.forEach((dot, idx) => {
        if (idx === stepIndex) dot.classList.add("active");
        else dot.classList.remove("active");
    });

    chatMessages.innerHTML = `<div class="chat-msg computer">${data.html}</div>`;
    refreshIcons(chatBubble);
    AudioSynth.playClick();
}

function advanceChatStep() {
    if (currentChatStep < chatSteps.length - 1) {
        renderChatStep(currentChatStep + 1);
    } else {
        launchThreeMissionWithTimeTravel("mission-01");
    }
}

function showChatBubble() {
    if (!chatBubble || isTransitioning || isChatOpen) return;
    isChatOpen = true;
    chatBubble.classList.remove("hidden");
    refreshIcons(chatBubble);
    AudioSynth.playTerminalAlert();
    renderChatStep(0);
}

function hideChatBubble() {
    if (!chatBubble) return;
    isChatOpen = false;
    chatBubble.classList.add("hidden");
}

function launchThreeMissionWithTimeTravel(missionId = "mission-01") {
    hideChatBubble();
    const timeTravelModal = document.getElementById("time-travel-modal");
    const yearCounter = document.getElementById("temporal-year-counter");
    const progressBar = document.getElementById("temporal-progress-bar");
    const statusText = document.getElementById("temporal-status-text");

    if (!timeTravelModal) {
        launchThreeMission(missionId);
        return;
    }

    // Show Time Travel UI
    timeTravelModal.classList.remove("hidden");
    refreshIcons(timeTravelModal);
    AudioSynth.playTerminalAlert();

    // Animate years ticking forward: 2027 -> 2030 -> 2034 -> 2038 -> 2042 -> 2045 -> 2047!
    const years = [2027, 2030, 2034, 2038, 2042, 2045, 2047];
    const statuses = [
        "WARPING SENSOR TELEMETRY TO 2047...",
        "SYNCHRONIZING WITH DEEP-SPACE RELAY...",
        "CALIBRATING PIONEER 10 TIME FLIGHT-LINE...",
        "DECRYPTING MISSION PHYSICAL ARCHIVE...",
        "ENTERING 3D RECONSTRUCTION ENVIRONMENT..."
    ];

    let step = 0;
    const interval = setInterval(() => {
        step++;
        if (step < years.length) {
            AudioSynth.playClick();
            if (yearCounter) yearCounter.textContent = `YEAR ${years[step]}`;
            if (progressBar) progressBar.style.width = `${(step / (years.length - 1)) * 100}%`;
            if (statusText) statusText.textContent = statuses[Math.min(step, statuses.length - 1)];
        } else {
            clearInterval(interval);
            AudioSynth.playSuccessChord();

            setTimeout(() => {
                timeTravelModal.classList.add("hidden");
                launchThreeMission(missionId);
            }, 350);
        }
    }, 240);
}

function launchThreeMission(missionId = "mission-01") {
    hideChatBubble();
    const gameContainer = document.getElementById("game-container");
    const threeContainer = document.getElementById("three-container");

    if (gameContainer && threeContainer) {
        gameContainer.classList.add("hidden");
        threeContainer.classList.remove("hidden");

        if (!threeGameInstance) {
            threeGameInstance = new ThreeGame("three-container", () => {
                // Return to 2D archive callback
                threeContainer.classList.add("hidden");
                gameContainer.classList.remove("hidden");
                resizeCanvas();
                refreshIcons();
            });
        } else {
            threeGameInstance.loadMission(missionId);
            threeGameInstance.onWindowResize();
        }
        refreshIcons(threeContainer);
    }
}

if (nextDialogBtn) {
    nextDialogBtn.addEventListener("click", () => {
        advanceChatStep();
    });
}

if (chatCloseBtn) {
    chatCloseBtn.addEventListener("click", hideChatBubble);
}

function transitionToScene(targetScene) {
    if (isTransitioning) return;
    isTransitioning = true;
    hidePopup();
    hideChatBubble();

    if (fadeOverlay) fadeOverlay.classList.add("fade-active");

    setTimeout(() => {
        if (targetScene === "archive") {
            currentScene = "archive";
            updateQuest("Approach the glowing TULIP Computer Workstation in the archive center.");
            const nextBg = archiveBgImg;
            const nw = (nextBg.complete && nextBg.naturalWidth > 0) ? nextBg.naturalWidth : 2172;
            const nh = (nextBg.complete && nextBg.naturalHeight > 0) ? nextBg.naturalHeight : 724;
            const s = Math.max(canvas.height / nh, canvas.width / nw);
            playerWorldX = nw * s * 0.12;
            vx = 0;
            vy = 0;
            isGrounded = true;
            facingRight = true;
        } else {
            currentScene = "outside";
            updateQuest("Walk right towards the NASA Archive Gate to begin recovery.");
            const nextBg = outsideBgImg;
            const nw = (nextBg.complete && nextBg.naturalWidth > 0) ? nextBg.naturalWidth : 5536;
            const nh = (nextBg.complete && nextBg.naturalHeight > 0) ? nextBg.naturalHeight : 768;
            const s = Math.max(canvas.height / nh, canvas.width / nw);
            playerWorldX = nw * s * 0.69;
            vx = 0;
            vy = 0;
            isGrounded = true;
            facingRight = false;
        }

        setTimeout(() => {
            if (fadeOverlay) fadeOverlay.classList.remove("fade-active");
            isTransitioning = false;
        }, 150);
    }, 350);
}

// -------------------------
// GAME STATE & PHYSICS
// -------------------------
let playerWorldX = 0;
let playerY = 0;
let vy = 0;
let vx = 0;
let isGrounded = true;
let isInitialized = false;

const BASE_GRAVITY = 0.38;
const BASE_JUMP_FORCE = -7.2;
const BASE_WALK_SPEED = 3.2;
const BASE_RUN_SPEED = 5.4;
const ACCEL = 0.35;
const FRICTION = 0.22;

// Animation variables
let i = 0;           // Animation frame (0-3)
let cnt = 0;         // Step counter
let facingRight = true;

// -------------------------
// MAIN GAME LOOP
// -------------------------
function AnimationLoop() {
    // Fill background with scene theme color as fallback (never black canvas!)
    ctx.fillStyle = (currentScene === "outside") ? "#d69b95" : "#0d192e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const activeBg = (currentScene === "outside") ? outsideBgImg : archiveBgImg;
    const bgNaturalW = (activeBg.complete && activeBg.naturalWidth > 0)
        ? activeBg.naturalWidth
        : (currentScene === "outside" ? 5536 : 2172);
    const bgNaturalH = (activeBg.complete && activeBg.naturalHeight > 0)
        ? activeBg.naturalHeight
        : (currentScene === "outside" ? 768 : 724);

    // Full-bleed Cover Scaling: covers BOTH width and height completely on any aspect ratio!
    const bgScale = Math.max(canvas.height / bgNaturalH, canvas.width / bgNaturalW);
    const bgRenderW = bgNaturalW * bgScale;
    const bgRenderH = bgNaturalH * bgScale;

    // Pin ground to the bottom of the viewport
    const bgY = canvas.height - bgRenderH;

    // Responsive scaling unit (relative to 300px base)
    const unit = bgRenderH / 300;

    // Player dimensions
    const playerW = 50 * unit;
    const playerH = 80 * unit;

    // Floor and grounded player Y level
    const floorY = (bgY + bgRenderH) - (28 * unit);
    const groundPlayerY = floorY - playerH;

    // Initial position setup on first load
    if (!isInitialized) {
        playerWorldX = bgRenderW * 0.12;
        playerY = groundPlayerY;
        isInitialized = true;
    }

    const minPlayerX = playerW * 0.5;
    const maxPlayerX = bgRenderW - (playerW * 0.5);

    // 1. Calculate Target Horizontal Velocity & Physics
    if (!isTransitioning) {
        const isTyping = document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA");
        const maxSpeed = (!isTyping && input.sprint) ? (BASE_RUN_SPEED * unit) : (BASE_WALK_SPEED * unit);
        let targetVx = 0;

        if (!isTyping) {
            if (input.right) {
                targetVx += maxSpeed;
                facingRight = true;
            }
            if (input.left) {
                targetVx -= maxSpeed;
                facingRight = false;
            }
        }

        // Smooth Acceleration & Friction
        if (targetVx !== 0) {
            vx += (targetVx - vx) * ACCEL;
        } else {
            vx *= (1 - FRICTION);
            if (Math.abs(vx) < 0.05 * unit) vx = 0;
        }

        playerWorldX += vx;
        playerWorldX = Math.max(minPlayerX, Math.min(maxPlayerX, playerWorldX));

        // 2. Jump Physics
        if (!isTyping && input.jump && isGrounded) {
            vy = input.sprint ? (BASE_JUMP_FORCE * 1.1 * unit) : (BASE_JUMP_FORCE * unit);
            isGrounded = false;
            AudioSynth.playClick();
        }

        if (!isGrounded) {
            playerY += vy;
            vy += BASE_GRAVITY * unit;
            if (playerY >= groundPlayerY) {
                playerY = groundPlayerY;
                vy = 0;
                isGrounded = true;
            }
        } else {
            playerY = groundPlayerY;
        }

        // 3. Sprite Animation Logic
        const isMoving = Math.abs(vx) > 0.2 * unit;
        const animRate = input.sprint ? 4 : 7;

        if (isGrounded) {
            if (isMoving) {
                cnt++;
                if (cnt >= animRate) {
                    i = (i + 1) % 4;
                    cnt = 0;
                }
            } else {
                cnt = 0;
                i = 0;
            }
        } else {
            i = 1;
        }

        // 4. Proximity & Zone Detection
        if (currentScene === "outside") {
            hideChatBubble();
            // NASA Archive Gate Zone (under "NASA ARCHIVE" sign)
            const gateMinX = bgRenderW * 0.65;
            const gateMaxX = bgRenderW * 0.74;
            const isNearArchiveGate = (playerWorldX >= gateMinX && playerWorldX <= gateMaxX);
            if (isNearArchiveGate) {
                updateQuest("Gate reached! Press [E] or click 'Enter NASA Archive' to proceed.");
                showPopup({
                    title: "NASA ARCHIVE",
                    desc: "Central Records Facility Entrance",
                    btnText: "Enter NASA Archive",
                    iconName: "landmark",
                    onAction: () => transitionToScene("archive")
                });
            } else {
                updateQuest("Walk right towards the NASA Archive Gate to begin recovery.");
                hidePopup();
            }
        } else if (currentScene === "archive") {
            // Door B-3 Exit Zone (far left)
            const exitMaxX = bgRenderW * 0.16;
            const isNearArchiveExit = (playerWorldX <= exitMaxX);
            if (isNearArchiveExit) {
                showPopup({
                    title: "EXIT ARCHIVE",
                    desc: "Door B-3 to Launch Site",
                    btnText: "Exit to Outside",
                    iconName: "log-out",
                    onAction: () => transitionToScene("outside")
                });
            } else {
                hidePopup();
            }

            // Computer Desk Proximity Check
            const deskWorldX = bgRenderW * 0.50;
            const deskW = 116 * unit;
            const deskCenter = deskWorldX + (deskW / 2);
            const isNearComputer = Math.abs(playerWorldX - deskCenter) < (110 * unit);
            if (isNearComputer) {
                updateQuest("Terminal ready! Click [START MISSION 01] to investigate Pioneer 10 in 3D.");
                showChatBubble();
            } else {
                updateQuest("Approach the glowing TULIP Computer Workstation in the archive center.");
                hideChatBubble();
            }
        }
    }

    // 5. Camera Scrolling Calculation (Clamped so background NEVER shows black edges)
    const screenCenterX = canvas.width / 2;
    const idealBgX = screenCenterX - playerWorldX;
    const minBgX = canvas.width - bgRenderW; // <= 0
    const maxBgX = 0;
    const bgX = Math.min(maxBgX, Math.max(minBgX, idealBgX));

    // Player position on screen
    const playerScreenX = playerWorldX + bgX - (playerW / 2);

    // 6. Draw Active Scene Background
    if (activeBg.complete && activeBg.naturalWidth > 0) {
        ctx.drawImage(
            activeBg,
            bgX,
            bgY,
            bgRenderW,
            bgRenderH
        );
    }

    // 7. Draw Computer Desk in Scene 2 (archive)
    if (currentScene === "archive") {
        const deskWorldX = bgRenderW * 0.50;
        const deskW = 116 * unit;
        const deskH = 92 * unit;
        const deskScreenX = deskWorldX + bgX;
        const deskScreenY = floorY - deskH;

        ctx.save();
        // Soft contact shadow under desk feet on floor
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.beginPath();
        ctx.ellipse(deskScreenX + (deskW / 2), floorY + (2 * unit), deskW * 0.48, 6 * unit, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw exact Computer Desk sprite
        if (deskImg.complete && deskImg.naturalWidth > 0) {
            ctx.drawImage(
                deskImg,
                deskScreenX,
                deskScreenY,
                deskW,
                deskH
            );
        }

        // Ambient CRT monitor screen glow on the desk
        const glow = ctx.createRadialGradient(
            deskScreenX + (38 * unit), deskScreenY + (30 * unit), 4 * unit,
            deskScreenX + (38 * unit), deskScreenY + (45 * unit), 52 * unit
        );
        glow.addColorStop(0, "rgba(34, 197, 94, 0.35)");
        glow.addColorStop(0.6, "rgba(34, 197, 94, 0.08)");
        glow.addColorStop(1, "rgba(34, 197, 94, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(deskScreenX - (10 * unit), deskScreenY - (10 * unit), deskW + (20 * unit), deskH + (20 * unit));

        // Floating label indicator (clean text, no emojis)
        const deskCenter = deskWorldX + (deskW / 2);
        const isNearComp = Math.abs(playerWorldX - deskCenter) < (110 * unit);
        if (isNearComp) {
            ctx.fillStyle = "#22c55e";
            ctx.font = `600 ${Math.max(10, Math.round(11 * (unit / 1.5)))}px monospace`;
            ctx.textAlign = "center";
            const bounce = Math.sin(Date.now() / 200) * (3 * unit);
            ctx.fillText("> TULIP TERMINAL ACTIVE", deskScreenX + (deskW / 2), deskScreenY - (10 * unit) + bounce);
        }

        // Anchor chat bubble directly over the computer monitor
        if (isChatOpen && chatBubble) {
            const bubbleW = chatBubble.offsetWidth || 380;
            const targetLeft = Math.max(16, Math.min(canvas.width - bubbleW - 16, deskScreenX + (deskW / 2) - (bubbleW / 2)));
            const targetBottom = Math.max(60, canvas.height - deskScreenY + (12 * unit));
            chatBubble.style.left = `${targetLeft}px`;
            chatBubble.style.bottom = `${targetBottom}px`;
            chatBubble.style.top = 'auto';
            chatBubble.style.right = 'auto';
        }

        ctx.restore();
    }

    // 8. Draw Player Character
    if (player.complete && player.naturalWidth > 0) {
        ctx.save();

        if (facingRight) {
            ctx.drawImage(
                player,
                i * 138,
                0,
                140,
                330,
                playerScreenX,
                playerY,
                playerW,
                playerH
            );
        } else {
            // Flipped horizontally
            ctx.translate(playerScreenX + playerW, playerY);
            ctx.scale(-1, 1);
            ctx.drawImage(
                player,
                i * 138,
                0,
                140,
                330,
                0,
                0,
                playerW,
                playerH
            );
        }

        ctx.restore();
    }

    requestAnimationFrame(AnimationLoop);
}

AnimationLoop();

// -------------------------
// FULLSCREEN SUPPORT
// -------------------------
function toggleFullscreen() {
    AudioSynth.playClick();
    const container = document.getElementById("game-container") || canvas;
    if (!document.fullscreenElement) {
        if (container.requestFullscreen) {
            container.requestFullscreen().catch(() => {});
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        }
    }
}

const fullscreenBtn = document.getElementById("fullscreen-btn");
if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", toggleFullscreen);
}

canvas.addEventListener("dblclick", toggleFullscreen);
