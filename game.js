let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    scene: { preload, create, update }
};

let game, grid, tiles, cursor, tileSize = 48, gridWidth = 6, gridHeight = 12;
let score = 0, timer = 0, speed = 1, comboMultiplier = 0;
let playerName, character;
let risingRow = gridHeight, gameOver = false, pendingGarbage = 0;

function startSinglePlayer() {
    playerName = document.getElementById('player-name').value || 'Player';
    character = document.getElementById('character-select').value;
    document.getElementById('lobby').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    game = new Phaser.Game(config);
}

function startMultiplayer() {
    alert('Multiplayer coming soon!');
}

function preload() {
    this.load.image('background', 'assets/background.png');
    this.load.image('tile1', 'assets/tile1.png');
    this.load.image('tile2', 'assets/tile2.png');
    this.load.image('tile3', 'assets/tile3.png');
    this.load.image('tile4', 'assets/tile4.png');
    this.load.image('tile5', 'assets/tile5.png');
    this.load.image('bonus1', 'assets/bonusTile1.png');
    this.load.image('bonus2', 'assets/bonusTile2.png');
    this.load.image('gridFrame', `assets/gridFrame_${character}.png`);
    this.load.image('column', `assets/column_${character}.png`);
    this.load.image('garbage', `assets/garbage_${character}.png`);
    this.load.image('cursor', 'assets/cursor.tiff');
}

function create() {
    this.add.image(400, 300, 'background').setDisplaySize(800, 600);
    this.add.image(300, 300, 'gridFrame').setDisplaySize(tileSize * gridWidth + 20, tileSize * gridHeight + 20);

    grid = Array(gridHeight).fill().map(() => Array(gridWidth).fill(null));
    tiles = this.add.group();

    spawnRisingRow();

    cursor = this.add.image(0, 0, 'cursor').setDisplaySize(tileSize * 2, tileSize);
    cursor.xPos = 1;
    cursor.yPos = 0;
    updateCursorPosition();

    this.input.keyboard.on('keydown', (event) => {
        if (gameOver) return;
        switch (event.key) {
            case 'ArrowLeft':
                if (cursor.xPos > 1) cursor.xPos--;
                break;
            case 'ArrowRight':
                if (cursor.xPos < 5) cursor.xPos++;
                break;
            case 'ArrowUp':
                if (cursor.yPos > 0) cursor.yPos--;
                break;
            case 'ArrowDown':
                if (cursor.yPos < gridHeight - 1) cursor.yPos++;
                break;
            case ' ':
                swapTiles(cursor.xPos, cursor.yPos, cursor.xPos + 1, cursor.yPos);
                break;
        }
        updateCursorPosition();
    });

    this.add.text(500, 50, 'Score: 0', { fontSize: '20px', color: '#fff' }).setName('scoreText');
    this.add.text(500, 80, 'Time: 0s', { fontSize: '20px', color: '#fff' }).setName('timeText');
    this.add.text(500, 110, 'Garbage: 0', { fontSize: '20px', color: '#fff' }).setName('garbageText');
}

function update(time, delta) {
    if (gameOver) return;

    timer += delta / 1000;
    speed = 1 + Math.floor(timer / 30) * 0.1;
    this.children.getByName('timeText').setText(`Time: ${Math.floor(timer)}s`);
    this.children.getByName('garbageText').setText(`Garbage: ${pendingGarbage}`);

    let riseSpeed = tileSize * speed * delta / 1000;
    tiles.getChildren().forEach(tile => {
        tile.y -= riseSpeed;
        if (tile.y <= 60) {
            gameOver = true;
            endGame(this);
        }
    });

    risingRow -= riseSpeed / tileSize;
    if (risingRow <= gridHeight - 1 && !grid[gridHeight - 1].every(t => t)) {
        solidifyRow();
        spawnRisingRow();
    }
}

function spawnRisingRow() {
    for (let x = 0; x < gridWidth; x++) {
        let tileType = timer < 60 ? Phaser.Math.RND.pick(['tile1', 'tile2', 'tile3', 'tile4', 'tile5']) :
                       timer < 120 ? Phaser.Math.RND.pick(['tile1', 'tile2', 'tile3', 'tile4', 'tile5']) :
                       Phaser.Math.RND.pick(['tile1', 'tile2', 'tile3', 'tile4', 'tile5', 'bonus1', 'bonus2']);
        let tile = tiles.create(200 + x * tileSize + tileSize / 2, 60 + gridHeight * tileSize + tileSize / 2, tileType);
        tile.setDisplaySize(tileSize, tileSize);
        tile.setAlpha(0.5);
        tile.gridX = x;
        tile.gridY = gridHeight;
    }
    risingRow = gridHeight;
}

function solidifyRow() {
    tiles.getChildren().forEach(tile => {
        if (tile.gridY === gridHeight) {
            tile.gridY = gridHeight - 1;
            tile.setAlpha(1);
            grid[tile.gridY][tile.gridX] = tile;
        }
    });
}

function updateCursorPosition() {
    cursor.setPosition(200 + cursor.xPos * tileSize + tileSize, 60 + cursor.yPos * tileSize + tileSize / 2);
}

function swapTiles(x1, y1, x2, y2) {
    if (x1 < 0 || x1 >= gridWidth - 1 || y1 < 0 || y1 >= gridHeight) return;
    let tile1 = grid[y1][x1], tile2 = grid[y1][x2];
    if (!tile1 || !tile2) return;
    grid[y1][x1] = tile2;
    grid[y1][x2] = tile1;
    tile1.setPosition(200 + x2 * tileSize + tileSize / 2, 60 + y1 * tileSize + tileSize / 2);
    tile2.setPosition(200 + x1 * tileSize + tileSize / 2, 60 + y1 * tileSize + tileSize / 2);
    checkMatches(this);
}

function checkMatches(scene) {
    let matches = [];
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth - 2; x++) {
            if (grid[y][x] && grid[y][x + 1] && grid[y][x + 2] &&
                grid[y][x].texture.key === grid[y][x + 1].texture.key &&
                grid[y][x].texture.key === grid[y][x + 2].texture.key) {
                matches.push({ x, y }, { x: x + 1, y }, { x: x + 2, y });
            }
        }
    }

    if (matches.length) {
        comboMultiplier++;
        let points = matches.length * 10 * comboMultiplier;
        score += points;
        scene.children.getByName('scoreText').setText(`Score: ${score}`);
        pendingGarbage++;

        matches.forEach(m => {
            grid[m.y][m.x].destroy();
            grid[m.y][m.x] = null;
        });

        checkGarbageAdjacency(scene, matches);

        scene.time.delayedCall(500, () => {
            settleGrid(scene);
        }, [], scene);
    } else if (comboMultiplier > 0) {
        dropGarbage(scene);
        comboMultiplier = 0;
    }
}

function settleGrid(scene) {
    let settled = false;
    for (let y = gridHeight - 1; y > 0; y--) {
        for (let x = 0; x < gridWidth; x++) {
            if (!grid[y][x] && grid[y - 1][x]) {
                grid[y][x] = grid[y - 1][x];
                grid[y - 1][x] = null;
                grid[y][x].setPosition(200 + x * tileSize + tileSize / 2, 60 + y * tileSize + tileSize / 2);
                grid[y][x].gridY = y;
                settled = true;
            }
        }
    }
    if (settled) {
        scene.time.delayedCall(500, () => checkMatches(scene), [], scene);
    } else {
        scene.time.delayedCall(1000, () => {}, [], scene);
    }
}

function dropGarbage(scene) {
    if (pendingGarbage > 0) {
        console.log(`Preparing to drop ${pendingGarbage} rows of garbage on opponent`);
        pendingGarbage = 0;
    }
}

function checkGarbageAdjacency(scene, matches) {
    matches.forEach(match => {
        let y = match.y;
        let x = match.x;
        if (y > 0 && grid[y - 1][x]?.isGarbage) breakGarbage(scene, y - 1);
        if (y < gridHeight - 1 && grid[y + 1][x]?.isGarbage) breakGarbage(scene, y + 1);
    });
}

function breakGarbage(scene, row) {
    let garbage = grid[row][0];
    if (!garbage || !garbage.isGarbage) return;

    garbage.destroy();
    for (let x = 0; x < gridWidth; x++) {
        grid[row][x] = null;
        let tileType = timer < 60 ? Phaser.Math.RND.pick(['tile1', 'tile2', 'tile3', 'tile4', 'tile5']) :
                       timer < 120 ? Phaser.Math.RND.pick(['tile1', 'tile2', 'tile3', 'tile4', 'tile5']) :
                       Phaser.Math.RND.pick(['tile1', 'tile2', 'tile3', 'tile4', 'tile5', 'bonus1', 'bonus2']);
        let tile = tiles.create(200 + x * tileSize + tileSize / 2, 60 + row * tileSize + tileSize / 2, tileType);
        tile.setDisplaySize(tileSize, tileSize);
        tile.gridX = x;
        tile.gridY = row;
        grid[row][x] = tile;
    }
    scene.time.delayedCall(500, () => settleGrid(scene), [], scene);
}

function endGame(scene) {
    scene.add.text(300, 300, 'Game Over', { fontSize: '40px', color: '#fff' }).setOrigin(0.5);

    let column = scene.add.image(300, 636, 'column')
        .setDisplaySize(tileSize * gridWidth, tileSize * gridHeight);
    column.setDepth(10);

    scene.tweens.add({
        targets: column,
        y: 60,
        duration: 1500,
        ease: 'Linear',
        onComplete: () => {
            scene.time.delayedCall(1000, () => {
                document.getElementById('game-container').style.display = 'none';
                document.getElementById('lobby').style.display = 'block';
                scene.scene.stop();
            });
        }
    });
}