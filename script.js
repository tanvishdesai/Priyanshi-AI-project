// Constants
const ROWS = 20;
const COLS = 40;

// Grid State
let grid = [];
let startNode = { r: 10, c: 5 };
let endNode = { r: 10, c: 34 };
let isMousePressed = false;
let isVisualizing = false;

// DOM Elements
const gridElement = document.getElementById('grid');
const startBtn = document.getElementById('btn-start');
const clearPathBtn = document.getElementById('btn-clear-path');
const clearBoardBtn = document.getElementById('btn-clear-board');
const mazeBtn = document.getElementById('btn-generate-maze');

// Initialize application
function init() {
    setupGridUI();
    
    // Add event listeners
    startBtn.addEventListener('click', visualizeAStar);
    clearBoardBtn.addEventListener('click', clearBoard);
    clearPathBtn.addEventListener('click', clearPath);
    mazeBtn.addEventListener('click', generateRandomMaze);
}

function setupGridUI() {
    gridElement.innerHTML = '';
    // CSS Grid setup
    gridElement.style.gridTemplateColumns = `repeat(${COLS}, var(--node-size))`;
    gridElement.style.gridTemplateRows = `repeat(${ROWS}, var(--node-size))`;
    
    // Create Nodes
    for (let r = 0; r < ROWS; r++) {
        const rowArray = [];
        for (let c = 0; c < COLS; c++) {
            const node = document.createElement('div');
            node.id = `node-${r}-${c}`;
            node.className = 'node';
            
            if (r === startNode.r && c === startNode.c) {
                node.classList.add('node-start');
            } else if (r === endNode.r && c === endNode.c) {
                node.classList.add('node-end');
            }
            
            // Mouse events for drawing walls
            node.addEventListener('mousedown', () => handleMouseDown(r, c));
            node.addEventListener('mouseenter', () => handleMouseEnter(r, c));
            node.addEventListener('mouseup', handleMouseUp);
            
            gridElement.appendChild(node);
            rowArray.push({ r, c, isWall: false, isVisited: false, previousNode: null });
        }
        grid.push(rowArray);
    }
}

// Mouse Handlers (stub for now)
function handleMouseDown(r, c) {
    if (isVisualizing) return;
    isMousePressed = true;
    toggleWall(r, c);
}

function handleMouseEnter(r, c) {
    if (isVisualizing) return;
    if (!isMousePressed) return;
    toggleWall(r, c);
}

function handleMouseUp() {
    isMousePressed = false;
}

function toggleWall(r, c) {
    if (isStartOrEnd(r, c)) return;
    const nodeObj = grid[r][c];
    nodeObj.isWall = !nodeObj.isWall;
    
    const nodeEl = document.getElementById(`node-${r}-${c}`);
    if (nodeObj.isWall) {
        nodeEl.classList.add('node-wall');
    } else {
        nodeEl.classList.remove('node-wall');
    }
}

function isStartOrEnd(r, c) {
    return (r === startNode.r && c === startNode.c) || (r === endNode.r && c === endNode.c);
}

// Boot up
document.addEventListener('DOMContentLoaded', init);
// Allow mouseup outside grid
document.addEventListener('mouseup', handleMouseUp);

// --- UTILITIES ---
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function manhattanDistance(nodeA, nodeB) {
    return Math.abs(nodeA.r - nodeB.r) + Math.abs(nodeA.c - nodeB.c);
}

function getNeighbors(node) {
    const neighbors = [];
    const { r, c } = node;
    
    // Up, Right, Down, Left
    if (r > 0) neighbors.push(grid[r - 1][c]);
    if (c < COLS - 1) neighbors.push(grid[r][c + 1]);
    if (r < ROWS - 1) neighbors.push(grid[r + 1][c]);
    if (c > 0) neighbors.push(grid[r][c - 1]);
    
    return neighbors.filter(neighbor => !neighbor.isWall);
}

// --- CORE A* ALGORITHM ---
async function visualizeAStar() {
    if (isVisualizing) return;
    
    clearPath();
    isVisualizing = true;
    toggleButtons(true);
    
    const startObj = grid[startNode.r][startNode.c];
    const endObj = grid[endNode.r][endNode.c];
    
    let openSet = [startObj]; // Nodes to evaluate
    let closedSet = [];       // Evaluated nodes
    
    // gScore = distance from start
    // fScore = gScore + heuristic (estimated distance to end)
    startObj.gScore = 0;
    startObj.fScore = manhattanDistance(startObj, endObj);
    
    while (openSet.length > 0) {
        // Find node in openSet with lowest fScore
        let lowestIndex = 0;
        for (let i = 0; i < openSet.length; i++) {
            if (openSet[i].fScore < openSet[lowestIndex].fScore) {
                lowestIndex = i;
            }
        }
        
        const current = openSet[lowestIndex];
        
        // We reached the finish!
        if (current === endObj) {
            await reconstructPath(endObj);
            isVisualizing = false;
            toggleButtons(false);
            return;
        }
        
        // Move current from open to closed
        openSet.splice(lowestIndex, 1);
        closedSet.push(current);
        
        // Animate visited node (except start/end)
        if (!isStartOrEnd(current.r, current.c)) {
            const el = document.getElementById(`node-${current.r}-${current.c}`);
            el.classList.add('node-visited');
            await sleep(10); // Control speed
        }
        
        const neighbors = getNeighbors(current);
        for (const neighbor of neighbors) {
            // Skip if already evaluated
            if (closedSet.includes(neighbor)) continue;
            
            // tentative_gScore is distance from start to neighbor through current
            const tentative_gScore = (current.gScore !== undefined ? current.gScore : Infinity) + 1;
            
            let newPath = false;
            if (openSet.includes(neighbor)) {
                if (tentative_gScore < neighbor.gScore) {
                    neighbor.gScore = tentative_gScore;
                    newPath = true;
                }
            } else {
                neighbor.gScore = tentative_gScore;
                openSet.push(neighbor);
                newPath = true;
            }
            
            // If we found a better/new path to neighbor
            if (newPath) {
                neighbor.previousNode = current;
                neighbor.fScore = neighbor.gScore + manhattanDistance(neighbor, endObj);
            }
        }
    }
    
    // No path found
    console.log("No Path Found");
    isVisualizing = false;
    toggleButtons(false);
}

async function reconstructPath(endNodeObj) {
    let current = endNodeObj.previousNode; // Exclude end node itself
    let path = [];
    
    while (current.previousNode) { // Stop before start node
        path.push(current);
        current = current.previousNode;
    }
    
    path.reverse(); // Draw from start to end
    
    for (const node of path) {
        const el = document.getElementById(`node-${node.r}-${node.c}`);
        el.classList.remove('node-visited');
        el.classList.add('node-path');
        await sleep(50); // Path drawing speed
    }
}

// --- ACTIONS ---
function clearPath() {
    if (isVisualizing) return;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const node = grid[r][c];
            node.previousNode = null;
            node.gScore = undefined;
            node.fScore = undefined;
            
            const el = document.getElementById(`node-${r}-${c}`);
            el.classList.remove('node-visited', 'node-path');
        }
    }
}

function clearBoard() {
    if (isVisualizing) return;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const node = grid[r][c];
            node.isWall = false;
            node.previousNode = null;
            node.gScore = undefined;
            node.fScore = undefined;
            
            const el = document.getElementById(`node-${r}-${c}`);
            el.classList.remove('node-wall', 'node-visited', 'node-path');
        }
    }
}

function generateRandomMaze() {
    if (isVisualizing) return;
    clearBoard(); // Reset first
    
    const wallProbability = 0.3; // 30% chance for a wall
    
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (isStartOrEnd(r, c)) continue;
            
            if (Math.random() < wallProbability) {
                grid[r][c].isWall = true;
                const el = document.getElementById(`node-${r}-${c}`);
                el.classList.add('node-wall');
            }
        }
    }
}

function toggleButtons(disabled) {
    startBtn.disabled = disabled;
    clearBoardBtn.disabled = disabled;
    clearPathBtn.disabled = disabled;
    mazeBtn.disabled = disabled;
}
