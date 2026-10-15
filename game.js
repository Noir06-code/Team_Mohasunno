
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

canvas.height = 300;
canvas.width = 800;

const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    "is_idle":false
};

window.addEventListener("keydown", (event) => {
    if (event.key in keys) {
        keys[event.key] = true;
    }
});

window.addEventListener("keyup", (event) => {
    if (event.key in keys) {
        keys[event.key] = false;
        keys["is_idle"]=true;
    }
});


// Images
const player = new Image();
player.src = "./Assests/avatar.png";

const bgimg = new Image();
bgimg.src = "./Assests/bg.jpeg";


// Variables
let x = 0;
let i = 0;
let j = 0;
let pos = 0;
let pos1 = 0;

let cnt = 0;

// Direction
let facingRight = true;
let height=100;

function AnimationLoop() {

    // Animation frame
    i = i % 4;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);


    // -------------------------
    // BACKGROUND / PARALLAX
    // -------------------------
    ctx.drawImage(
        bgimg,
        pos1,
        0,
        bgimg.width/2,
        300
    );


    // -------------------------
    // PLAYER MOVEMENT
    // -------------------------

    if (keys.ArrowRight) {
        facingRight = true;

        cnt++;

        if (cnt === 20) {
            i++;
            cnt = 0;
        }

        if (pos !== 400) {
            pos++;
        }

        // Parallax background
        if (pos === 400 && pos1 * -1 < 1500) {
            pos1--;
        }
    }


    if (keys.ArrowLeft) {
        previous=1;
        facingRight = false;

        cnt++;

        if (cnt === 20) {
            i++;
            cnt = 0;
        }

        if (pos > 0) {
            pos--;
        }

        // Move background back
        if (pos === 0 && pos1 < 0) {
            pos1++;
        }
    }

    if(keys.ArrowUp &&height===0){
        height=50;
    }
    if(height!==0){
        height--;
    }
    // -------------------------
    // DRAW PLAYER
    // -------------------------

    ctx.save();
    
    if (facingRight) {

        // Normal
        ctx.drawImage(
            player,
            i * 138,
            j * 330,
            140,
            330,
            pos,
            190-height,
            50,
            80
        );

    } else {

        // FLIPPED HORIZONTALLY
        ctx.translate(pos + 50, 190-height);
        ctx.scale(-1, 1);

        ctx.drawImage(
            player,
            i * 138,
            j * 330,
            140,
            330,
            0,
            0,
            50,
            80
        );
    }

    ctx.restore();

    
    // Next frame
    requestAnimationFrame(AnimationLoop);
}


AnimationLoop();
