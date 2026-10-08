import playerUrl from '../Assets/avatar.png';
import bgUrl from '../Assets/bg.jpeg';
import secondBgUrl from '../Assets/2nd.png';

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

canvas.height = 300;
canvas.width = 800;
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";

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
        triggerPopupAction();
    }
    if (event.key === "f" || event.key === "F") {
        toggleFullscreen();
    }
});

window.addEventListener("keyup", (event) => {
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

// -------------------------
// SCENE & POPUP MANAGEMENT
// -------------------------
let currentScene = "outside"; // "outside" | "archive"
let isTransitioning = false;
let currentPopupAction = null;

const gatePopup = document.getElementById("gate-popup");
const popupTitle = document.getElementById("popup-title");
const popupDesc = document.getElementById("popup-desc");
const popupBtnLabel = document.getElementById("popup-btn-label");
const popupIcon = document.getElementById("popup-icon");
const popupActionBtn = document.getElementById("popup-action-btn");
const fadeOverlay = document.getElementById("fade-overlay");

function showPopup({ title, desc, btnText, icon, onAction }) {
    if (!gatePopup || isTransitioning) return;
    if (popupTitle) popupTitle.textContent = title;
    if (popupDesc) popupDesc.textContent = desc;
    if (popupBtnLabel) popupBtnLabel.textContent = btnText;
    if (popupIcon && icon) popupIcon.textContent = icon;
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
        currentPopupAction();
    }
}

if (popupActionBtn) {
    popupActionBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        triggerPopupAction();
    });
}

function transitionToScene(targetScene) {
    if (isTransitioning) return;
    isTransitioning = true;
    hidePopup();

    if (fadeOverlay) fadeOverlay.classList.add("fade-active");

    setTimeout(() => {
        if (targetScene === "archive") {
            currentScene = "archive";
            pos = 120;
            pos1 = 0;
            vx = 0;
            vy = 0;
            playerY = GROUND_Y;
            isGrounded = true;
            facingRight = true;
        } else {
            currentScene = "outside";
            pos = CENTER_X;
            pos1 = -1540; // Spawns directly outside NASA Archive Gate
            vx = 0;
            vy = 0;
            playerY = GROUND_Y;
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
const GROUND_Y = 190;
let playerY = GROUND_Y;
let vy = 0;
const GRAVITY = 0.35;
const JUMP_FORCE = -6.8;
let isGrounded = true;

const WALK_SPEED = 2.8;
const RUN_SPEED = 4.6;
let vx = 0;
const ACCEL = 0.35;
const FRICTION = 0.22;

let pos = 80;        // Player X on canvas
let pos1 = 0;        // Background parallax scroll
const CENTER_X = 400;

// Animation variables
let i = 0;           // Animation frame (0-3)
let cnt = 0;         // Step counter
let facingRight = true;

// -------------------------
// MAIN GAME LOOP
// -------------------------
function AnimationLoop() {
    const activeBg = (currentScene === "outside") ? outsideBgImg : archiveBgImg;
    const bgRenderWidth = (activeBg.complete && activeBg.naturalWidth > 0)
        ? (activeBg.width / 2)
        : (currentScene === "outside" ? 2768 : 1086);
    const maxBgScroll = -(Math.max(0, bgRenderWidth - canvas.width));

    // 1. Calculate Target Horizontal Velocity
    if (!isTransitioning) {
        const maxSpeed = input.sprint ? RUN_SPEED : WALK_SPEED;
        let targetVx = 0;

        if (input.right) {
            targetVx += maxSpeed;
            facingRight = true;
        }
        if (input.left) {
            targetVx -= maxSpeed;
            facingRight = false;
        }

        // Smooth Acceleration & Friction
        if (targetVx !== 0) {
            vx += (targetVx - vx) * ACCEL;
        } else {
            vx *= (1 - FRICTION);
            if (Math.abs(vx) < 0.05) vx = 0;
        }

        // 2. Jump Physics
        if (input.jump && isGrounded) {
            vy = input.sprint ? JUMP_FORCE * 1.1 : JUMP_FORCE;
            isGrounded = false;
        }

        if (!isGrounded) {
            playerY += vy;
            vy += GRAVITY;
            if (playerY >= GROUND_Y) {
                playerY = GROUND_Y;
                vy = 0;
                isGrounded = true;
            }
        }

        // 3. Movement & Camera Scrolling
        if (vx > 0) {
            if (pos < CENTER_X) {
                pos += vx;
                if (pos > CENTER_X) {
                    const overflow = pos - CENTER_X;
                    pos = CENTER_X;
                    if (pos1 > maxBgScroll) {
                        pos1 -= overflow;
                    } else {
                        pos += overflow;
                    }
                }
            } else if (pos1 > maxBgScroll) {
                pos1 -= vx;
                if (pos1 < maxBgScroll) {
                    const overflow = maxBgScroll - pos1;
                    pos1 = maxBgScroll;
                    pos += overflow;
                }
            } else {
                pos = Math.min(canvas.width - 60, pos + vx);
            }
        } else if (vx < 0) {
            const speed = -vx;
            if (pos > CENTER_X) {
                pos -= speed;
                if (pos < CENTER_X) {
                    const overflow = CENTER_X - pos;
                    pos = CENTER_X;
                    if (pos1 < 0) {
                        pos1 += overflow;
                    } else {
                        pos -= overflow;
                    }
                }
            } else if (pos1 < 0) {
                pos1 += speed;
                if (pos1 > 0) {
                    const overflow = pos1;
                    pos1 = 0;
                    pos -= overflow;
                }
            } else {
                pos = Math.max(10, pos - speed);
            }
        }

        // 4. Sprite Animation Logic
        const isMoving = Math.abs(vx) > 0.2;
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

        // 5. Zone / Gate Detection
        const worldX = pos - pos1;

        if (currentScene === "outside") {
            // NASA Archive Gate Zone (around the building doors under "NASA ARCHIVE")
            const isNearArchiveGate = (worldX >= 1830 && worldX <= 2040);
            if (isNearArchiveGate) {
                showPopup({
                    title: "NASA ARCHIVE",
                    desc: "Central Records Facility Entrance",
                    btnText: "Enter NASA Archive",
                    icon: "🏛️",
                    onAction: () => transitionToScene("archive")
                });
            } else {
                hidePopup();
            }
        } else if (currentScene === "archive") {
            // Door B-3 Exit Zone (far left exit door)
            const isNearArchiveExit = (worldX <= 160);
            if (isNearArchiveExit) {
                showPopup({
                    title: "EXIT ARCHIVE",
                    desc: "Door B-3 to Launch Site",
                    btnText: "Exit to Outside",
                    icon: "🚪",
                    onAction: () => transitionToScene("outside")
                });
            } else {
                hidePopup();
            }
        }
    }

    // 6. Render
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Active Scene Background
    if (activeBg.complete && activeBg.naturalWidth > 0) {
        ctx.drawImage(
            activeBg,
            pos1,
            0,
            bgRenderWidth,
            300
        );
    }

    // Draw Player Character
    if (player.complete && player.naturalWidth > 0) {
        ctx.save();

        if (facingRight) {
            ctx.drawImage(
                player,
                i * 138,
                0,
                140,
                330,
                pos,
                playerY,
                50,
                80
            );
        } else {
            // Flipped horizontally
            ctx.translate(pos + 50, playerY);
            ctx.scale(-1, 1);
            ctx.drawImage(
                player,
                i * 138,
                0,
                140,
                330,
                0,
                0,
                50,
                80
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
