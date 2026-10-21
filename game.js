import levelData from "./levels.json";

const assetModules = import.meta.glob("./Assets/*", {
    import: "default",
    query: "?url"
});

const ASSETS = Object.fromEntries(
    Object.entries(assetModules).map(([path, url]) => [path.split("/").pop(), url])
);

export function mountGame(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Unable to create a 2D canvas context");
    }

    canvas.height = 300;
    canvas.width = 800;

// show hitboxes (set from levels.json "debug", toggle with the H key)
let debug = false;

// ---------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------
function loadImage(src) {
    if (typeof src !== "function") {
        return Promise.reject(new Error("Game image asset was not found"));
    }

    return src().then((assetUrl) => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load image: " + assetUrl));
        img.src = assetUrl;
    }));
}

// Hitbox = a rectangle inside the drawn image, measured from the image's
// top-left corner. Missing values fall back to the full drawn size.
//   { xMin, xMax, yMin, yMax }
function normalizeHitbox(hb, w, h) {
    hb = hb || {};
    return {
        xMin: hb.xMin ?? 0,
        xMax: hb.xMax ?? w,
        yMin: hb.yMin ?? 0,
        yMax: hb.yMax ?? h
    };
}

// rects are { x1, y1, x2, y2 } in screen coordinates
function overlaps(a, b) {
    return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
}

function strokeRect(r, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x1 + 0.5, r.y1 + 0.5, r.x2 - r.x1, r.y2 - r.y1);
}


// ---------------------------------------------------------------
// INPUT
// ---------------------------------------------------------------
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

const handleKeyDown = (e) => {
    if (e.key in keys) keys[e.key] = true;
    if (e.key === "h" || e.key === "H") debug = !debug;
};

const handleKeyUp = (e) => {
    if (e.key in keys) keys[e.key] = false;
};

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);


// ---------------------------------------------------------------
// BACKGROUND (parallax)
// new Background("bg.jpeg", 0.5)
//   imageName : file inside ./Assets/
//   widthCoef : drawn width = image width * widthCoef
// ---------------------------------------------------------------
class Background {
    constructor(imageName, widthCoef = 1) {
        this.img = null;
        this.widthCoef = widthCoef;
        this.scrollX = 0;   // how far the background has moved (0 or negative)
        this.ready = loadImage(ASSETS[imageName]).then((img) => {
            this.img = img;
        });
    }

    get drawWidth() {
        return this.img.width * this.widthCoef;
    }

    get maxScroll() {
        return Math.max(0, this.drawWidth - canvas.width);
    }

    canScrollRight() {
        return -this.scrollX < this.maxScroll;
    }

    canScrollLeft() {
        return this.scrollX < 0;
    }

    scrollRight(amount = 1) {
        if (this.canScrollRight()) {
            this.scrollX = Math.max(-this.maxScroll, this.scrollX - amount);
        }
    }

    scrollLeft(amount = 1) {
        if (this.canScrollLeft()) {
            this.scrollX = Math.min(0, this.scrollX + amount);
        }
    }

    draw() {
        ctx.drawImage(this.img, this.scrollX, 0, this.drawWidth, canvas.height);
    }
}


// ---------------------------------------------------------------
// ENEMY (all values come from the level JSON)
// {
//   image, frameW, frameH, worldX, y, drawW, drawH, frames, animSpeed,
//   hitbox: { xMin, xMax, yMin, yMax }   (optional)
// }
//   worldX : x position in the level (not on the screen); the enemy
//            moves with the background parallax
// ---------------------------------------------------------------
class Enemy {
    constructor(cfg) {
        this.img = null;
        this.frameW = cfg.frameW;
        this.frameH = cfg.frameH;
        this.worldX = cfg.worldX ?? 0;
        this.y = cfg.y ?? 0;
        this.drawW = cfg.drawW;
        this.drawH = cfg.drawH;
        this.totalFrames = cfg.frames ?? 1;
        this.animSpeed = cfg.animSpeed ?? 10;   // game frames per animation frame
        this.hb = normalizeHitbox(cfg.hitbox, this.drawW, this.drawH);

        this.frame = 0;
        this.timer = 0;

        this.ready = loadImage(ASSETS[cfg.image]).then((img) => {
            this.img = img;
        });
    }

    // hitbox on the screen right now
    getRect(bg) {
        const sx = this.worldX + bg.scrollX;
        return {
            x1: sx + this.hb.xMin,
            x2: sx + this.hb.xMax,
            y1: this.y + this.hb.yMin,
            y2: this.y + this.hb.yMax
        };
    }

    update() {
        this.timer++;
        if (this.timer >= this.animSpeed) {
            this.timer = 0;
            this.frame = (this.frame + 1) % this.totalFrames;
        }
    }

    draw(bg) {
        // screen position = world position + how far the background has scrolled
        const screenX = this.worldX + bg.scrollX;

        // skip drawing when completely off screen
        if (screenX + this.drawW < 0 || screenX > canvas.width) return;

        ctx.drawImage(
            this.img,
            this.frameW * this.frame, 0,
            this.frameW, this.frameH,
            screenX, this.y,
            this.drawW, this.drawH
        );
    }
}


// ---------------------------------------------------------------
// GAME OBJECT (a plain image, not a sprite sheet)
// {
//   image, worldX, y, drawW, drawH,
//   solid:  true (default) = blocks the avatar, false = walk through,
//   hitbox: { xMin, xMax, yMin, yMax }   (optional)
// }
//   worldX : x position in the level; moves with the background parallax
//   drawW / drawH are optional: if left out, the image's own size is used
//   (give only one of them to scale the image and keep its proportions)
// ---------------------------------------------------------------
class GameObject {
    constructor(cfg) {
        this.img = null;
        this.worldX = cfg.worldX ?? 0;
        this.y = cfg.y ?? 0;
        this.drawW = cfg.drawW;
        this.drawH = cfg.drawH;
        this.solid = cfg.solid ?? true;
        this.hb = null;

        this.ready = loadImage(ASSETS[cfg.image]).then((img) => {
            this.img = img;

            // fill in the size once the image is known
            if (this.drawW == null && this.drawH == null) {
                this.drawW = img.width;
                this.drawH = img.height;
            } else if (this.drawW == null) {
                this.drawW = img.width * (this.drawH / img.height);
            } else if (this.drawH == null) {
                this.drawH = img.height * (this.drawW / img.width);
            }

            this.hb = normalizeHitbox(cfg.hitbox, this.drawW, this.drawH);
        });
    }

    // hitbox on the screen right now
    getRect(bg) {
        const sx = this.worldX + bg.scrollX;
        return {
            x1: sx + this.hb.xMin,
            x2: sx + this.hb.xMax,
            y1: this.y + this.hb.yMin,
            y2: this.y + this.hb.yMax
        };
    }

    draw(bg) {
        const screenX = this.worldX + bg.scrollX;

        // skip drawing when completely off screen
        if (screenX + this.drawW < 0 || screenX > canvas.width) return;

        ctx.drawImage(this.img, screenX, this.y, this.drawW, this.drawH);
    }
}


// ---------------------------------------------------------------
// AVATAR (configured from the level JSON, like an enemy)
// {
//   image, frameW, frameH, startX, y, drawW, drawH,
//   frames, animSpeed, idleFrame,
//   speed, stopX, jumpHeight,
//   hitbox: { xMin, xMax, yMin, yMax }
// }
//   startX     : where the avatar starts on the screen
//   y          : top of the avatar when standing on the ground
//   frames     : number of walk frames (0 to frames-1)
//   idleFrame  : frame shown when standing still
//   stopX      : the avatar stops here and the background starts scrolling
//   Anything missing falls back to the defaults below.
// ---------------------------------------------------------------
class Avatar {
    static defaults = {
        image: "avatar.png",

        // sprite sheet
        frameW: 345,
        frameH: 780,
        row: 0,
        frames: 5,          // frames 0-4 = walking
        idleFrame: 5,       // frame 5   = idle
        animSpeed: 20,      // game frames per walk frame

        // draw size
        drawW: 70,
        drawH: 100,

        // hitbox, measured from the top-left of the drawn image while
        // facing right (it is mirrored automatically when facing left)
        hitbox: { xMin: 10, xMax: 60, yMin: 5, yMax: 100 },

        // position and movement
        startX: 0,
        y: 175,
        stopX: 400,
        speed: 1,
        jumpHeight: 100
    };

    constructor(cfg = {}) {
        Object.assign(this, Avatar.defaults, cfg);

        this.hb = normalizeHitbox(this.hitbox, this.drawW, this.drawH);

        this.img = null;
        this.x = this.startX;
        this.frame = this.idleFrame;
        this.timer = 0;
        this.facingRight = true;
        this.jump = 0;      // current jump height (counts down)

        this.ready = loadImage(ASSETS[this.image]).then((img) => {
            this.img = img;
        });
    }

    // true when the player is at the far right of the screen
    get atLevelEnd() {
        return this.x >= canvas.width - this.drawW;
    }

    // hitbox on the screen, as if the avatar were dx pixels to the side
    getRect(dx = 0) {
        const left = this.x + dx;
        const top = this.y - this.jump;
        const hb = this.facingRight
            ? this.hb
            : {
                xMin: this.drawW - this.hb.xMax,
                xMax: this.drawW - this.hb.xMin
            };
        return {
            x1: left + hb.xMin,
            x2: left + hb.xMax,
            y1: top + this.hb.yMin,
            y2: top + this.hb.yMax
        };
    }

    // would moving dx pixels push the avatar into a solid object?
    wouldHitSolid(dx, bg, objects) {
        const solids = objects.filter((o) => o.solid).map((o) => o.getRect(bg));

        // already inside one (for example landed in it after a jump):
        // allow movement so the player can walk out
        const now = this.getRect(0);
        if (solids.some((r) => overlaps(now, r))) return false;

        const next = this.getRect(dx);
        return solids.some((r) => overlaps(next, r));
    }

    update(bg, objects) {
        const right = keys.ArrowRight && !keys.ArrowLeft;
        const left = keys.ArrowLeft && !keys.ArrowRight;
        const isMoving = right || left;

        // animation frame
        if (!isMoving) {
            this.frame = this.idleFrame;
            this.timer = 0;
        } else {
            if (this.frame >= this.frames) this.frame = 0;
            this.timer++;
            if (this.timer >= this.animSpeed) {
                this.timer = 0;
                this.frame = (this.frame + 1) % this.frames;
            }
        }

        // horizontal movement + parallax
        // (a blocked move cancels both the avatar's move and the background scroll)
        if (right) {
            this.facingRight = true;
            if (!this.wouldHitSolid(this.speed, bg, objects)) {
                if (this.x < this.stopX) {
                    this.x = Math.min(this.stopX, this.x + this.speed);
                } else if (bg.canScrollRight()) {
                    bg.scrollRight(this.speed);
                } else {
                    // background fully scrolled: walk to the right edge
                    this.x = Math.min(canvas.width - this.drawW, this.x + this.speed);
                }
            }
        }

        if (left) {
            this.facingRight = false;
            if (!this.wouldHitSolid(-this.speed, bg, objects)) {
                if (this.x > this.stopX || !bg.canScrollLeft()) {
                    this.x = Math.max(0, this.x - this.speed);
                } else {
                    bg.scrollLeft(this.speed);
                }
            }
        }

        // jump
        if (keys.ArrowUp && this.jump === 0) {
            this.jump = this.jumpHeight;
        }
        if (this.jump !== 0) {
            this.jump--;
        }
    }

    draw() {
        const y = this.y - this.jump;
        const sx = this.frame * this.frameW;
        const sy = this.row * this.frameH;

        ctx.save();

        if (this.facingRight) {
            ctx.drawImage(
                this.img,
                sx, sy, this.frameW, this.frameH,
                this.x, y, this.drawW, this.drawH
            );
        } else {
            // flipped horizontally, still occupying x .. x + drawW
            ctx.translate(this.x + this.drawW, y);
            ctx.scale(-1, 1);
            ctx.drawImage(
                this.img,
                sx, sy, this.frameW, this.frameH,
                0, 0, this.drawW, this.drawH
            );
        }

        ctx.restore();
    }
}


// ---------------------------------------------------------------
// LEVEL LOADING (everything comes from levels.json)
// ---------------------------------------------------------------
let levels = [];
let currentLevel = 0;
let bg = null;
let avatar = null;
let enemies = [];
let objects = [];
let loading = true;
let errorMessage = "";
let stopped = false;
let animationFrameId = null;

function scheduleAnimationFrame() {
    if (!stopped) {
        animationFrameId = requestAnimationFrame(AnimationLoop);
    }
}

async function loadLevel(index) {
    loading = true;
    keys.ArrowLeft = keys.ArrowRight = keys.ArrowUp = keys.ArrowDown = false;

    const cfg = levels[index];

    const newBg = new Background(cfg.bg.image, cfg.bg.widthCoef ?? 1);
    const newAvatar = new Avatar(cfg.avatar);
    const newEnemies = (cfg.enemies ?? []).map((e) => new Enemy(e));
    const newObjects = (cfg.objects ?? []).map((o) => new GameObject(o));

    // wait until every image of this level is loaded
    await Promise.all([
        newBg.ready,
        newAvatar.ready,
        ...newEnemies.map((e) => e.ready),
        ...newObjects.map((o) => o.ready)
    ]);

    bg = newBg;
    avatar = newAvatar;
    enemies = newEnemies;
    objects = newObjects;
    currentLevel = index;
    loading = false;
}

function showError(err) {
    console.error(err);
    errorMessage = err.message;
}

async function init() {
    try {
        levels = levelData.levels;
        debug = levelData.debug ?? false;
        await loadLevel(0);
    } catch (err) {
        showError(err);
    }
    scheduleAnimationFrame();
}


// ---------------------------------------------------------------
// MAIN LOOP
// ---------------------------------------------------------------
function drawMessage(text) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "start";
}

function drawHitboxes() {
    objects.forEach((o) => strokeRect(o.getRect(bg), o.solid ? "#3b82f6" : "#9ca3af"));
    enemies.forEach((e) => strokeRect(e.getRect(bg), "#ef4444"));
    strokeRect(avatar.getRect(), "#22c55e");
}

function AnimationLoop() {
    if (errorMessage) {
        drawMessage("Error: " + errorMessage);
        return;
    }

    if (loading) {
        drawMessage("Loading...");
        scheduleAnimationFrame();
        return;
    }

    // update
    avatar.update(bg, objects);
    enemies.forEach((e) => e.update());

    // touching an enemy restarts the level
    const avatarRect = avatar.getRect();
    if (enemies.some((e) => overlaps(avatarRect, e.getRect(bg)))) {
        loadLevel(currentLevel).catch(showError);
        scheduleAnimationFrame();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw (back to front)
    bg.draw();
    objects.forEach((o) => o.draw(bg));
    enemies.forEach((e) => e.draw(bg));
    avatar.draw();

    if (debug) drawHitboxes();

    // reached the end of the level -> next level
    if (!bg.canScrollRight() && avatar.atLevelEnd && currentLevel + 1 < levels.length) {
        loadLevel(currentLevel + 1).catch(showError);
    }

    scheduleAnimationFrame();
}

init();

return () => {
    stopped = true;
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
    }
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
};
}
