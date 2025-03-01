const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size to fit screen, optimized for mobile
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game variables
const boundary = { x: 50, y: 50, width: canvas.width - 100, height: canvas.height - 100 };
const target = { x: 0, y: 0, width: 40, height: 40 };
const crosshairSize = 30;
const sensitivity = 0.05;
let activeTouchId = null; // Track the first touch

// Animation loop
function gameLoop() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'green';
    ctx.lineWidth = 2;
    ctx.strokeRect(boundary.x, boundary.y, boundary.width, boundary.height);

    const targetScreenX = canvas.width / 2 + target.x - target.width / 2;
    const targetScreenY = canvas.height / 2 + target.y - target.height / 2;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(targetScreenX, targetScreenY, target.width, target.height);
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('target', targetScreenX + target.width / 2, targetScreenY + 20);
    ctx.fillText('object', targetScreenX + target.width / 2, targetScreenY + 32);

    ctx.strokeStyle = 'green';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - crosshairSize, canvas.height / 2);
    ctx.lineTo(canvas.width / 2 + crosshairSize, canvas.height / 2);
    ctx.moveTo(canvas.width / 2, canvas.height / 2 - crosshairSize);
    ctx.lineTo(canvas.width / 2, canvas.height / 2 + crosshairSize);
    ctx.stroke();

    ctx.fillStyle = 'rgba(153, 153, 153, 1)';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    const textX = canvas.width / 2;
    const textY = canvas.height / 2 - crosshairSize - 60;
    ctx.fillText(`Target: (${Math.round(target.x)}, ${Math.round(target.y)})`, textX, textY);
    ctx.fillText(target.x > 0 ? 'Yaw Right' : target.x < 0 ? 'Yaw Left' : 'Yaw Locked', textX, textY + 20);
    ctx.fillText(target.y > 0 ? 'Pitch Down' : target.y < 0 ? 'Pitch Up' : 'Pitch Locked', textX, textY + 40);

    if (target.x !== 0 || target.y !== 0) {
        target.x -= target.x * sensitivity;
        target.y -= target.y * sensitivity;
        if (Math.abs(target.x) < 0.1) target.x = 0;
        if (Math.abs(target.y) < 0.1) target.y = 0;
    }

    requestAnimationFrame(gameLoop);
}

// Handle touch input
function handleTouchStart(event) {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();

    // If no active touch, set the first one
    if (activeTouchId === null && event.touches.length > 0) {
        const touch = event.touches[0];
        activeTouchId = touch.identifier;
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        if (x >= boundary.x && x <= boundary.x + boundary.width &&
            y >= boundary.y && y <= boundary.y + boundary.height) {
            target.x = x - canvas.width / 2;
            target.y = y - canvas.height / 2;
        }
    }
}

// Clear active touch on release
function handleTouchEnd(event) {
    event.preventDefault();
    const touches = event.changedTouches;
    for (let i = 0; i < touches.length; i++) {
        if (touches[i].identifier === activeTouchId) {
            activeTouchId = null;
            break;
        }
    }
}

// Add event listeners
canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

// Also support mouse for desktop
canvas.addEventListener('mousedown', (event) => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (x >= boundary.x && x <= boundary.x + boundary.width &&
        y >= boundary.y && y <= boundary.y + boundary.height) {
        target.x = x - canvas.width / 2;
        target.y = y - canvas.height / 2;
    }
});

// Start the game
gameLoop();
