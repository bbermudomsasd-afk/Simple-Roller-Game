/* =====================================================================
   level.js  --  BUILDING THE WORLD OUT OF PIECES.

   A level is a list of piece names. A piece is a little 8-wide,
   10-tall picture. This file glues the pictures together, left to
   right, into one big grid.

   The pictures live in data/pieces.json.
   The lists of names live in data/levels.json.
   ===================================================================== */

var Level = {
  pieces: null,     // every piece picture, loaded from pieces.json
  levels: null,     // every level list, loaded from levels.json
  grid: [],         // the finished world. grid[row][col] is one character
  cols: 0,          // how many columns wide the finished world is
  name: "",
  startX: 0,        // where the player begins, in pixels
  startY: 0,
  crumbling: {}     // tracks blocks that are collapsing, keyed by "col:row"
};

// --- STEP 1: read the two data files ----------------------------------
Level.loadData = function (whenDone) {
  fetch("data/pieces.json")
    .then(function (r) { return r.json(); })
    .then(function (piecesFile) {
      Level.pieces = piecesFile;
      return fetch("data/levels.json");
    })
    .then(function (r) { return r.json(); })
    .then(function (levelsFile) {
      Level.levels = levelsFile.levels;
      whenDone();
    })
    .catch(function (error) {
      document.getElementById("message").textContent =
        "Could not load the level files. Check data/pieces.json and data/levels.json.";
      console.error(error);
    });
};

// --- STEP 2: glue the pieces together ---------------------------------
Level.build = function (levelNumber) {
  var level = Level.levels[levelNumber];
  Level.name = level.name;
  Level.grid = [];
  Level.cols = level.pieces.length * CONFIG.PIECE_COLS;
  Level.crumbling = {};

  // start with 10 empty rows
  for (var row = 0; row < CONFIG.ROWS; row++) {
    Level.grid.push("");
  }

  // add each piece onto the end of every row
  for (var p = 0; p < level.pieces.length; p++) {
    var pieceName = level.pieces[p];
    var piece = Level.pieces[pieceName];

    if (!piece) {
      console.error("No piece named '" + pieceName + "' in data/pieces.json");
      piece = Level.pieces["flat"];
    }

    for (var row = 0; row < CONFIG.ROWS; row++) {
      Level.grid[row] = Level.grid[row] + piece[row];
    }
  }

  Level.findStart();
};

// --- STEP 3: find the S and remember where it is ----------------------
Level.findStart = function () {
  for (var row = 0; row < CONFIG.ROWS; row++) {
    for (var col = 0; col < Level.cols; col++) {
      if (Level.charAt(col, row) === "S") {
        Level.startX = col * CONFIG.TILE;
        Level.startY = row * CONFIG.TILE;
        return;
      }
    }
  }
  // no S found anywhere, so just start at the top left
  Level.startX = 0;
  Level.startY = 0;
};

// --- CRUMBLING BLOCK LOGIC ---------------------------------------------
Level.triggerCrumble = function (col, row) {
  var tile = Level.charAt(col, row);
  if (tile !== "C") { return; }

  var key = col + ":" + row;
  if (Level.crumbling[key]) { return; }

  Level.crumbling[key] = 10;  // about 0.17 seconds at 60fps
};

Level.update = function () {
  var keys = Object.keys(Level.crumbling);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var parts = key.split(":");
    var col = Number(parts[0]);
    var row = Number(parts[1]);

    Level.crumbling[key] = Level.crumbling[key] - 1;
    if (Level.crumbling[key] <= 0) {
      var chars = Level.grid[row].split("");
      chars[col] = ".";
      Level.grid[row] = chars.join("");
      delete Level.crumbling[key];
    }
  }
};

// --- ASKING THE WORLD QUESTIONS ---------------------------------------
// What character is at this grid square?
Level.charAt = function (col, row) {
  if (row < 0 || row >= CONFIG.ROWS) { return "."; }
  if (col < 0 || col >= Level.cols)  { return "."; }
  return Level.grid[row].charAt(col);
};

Level.isSolid  = function (col, row) {
  var tile = Level.charAt(col, row);
  return tile === "#" || tile === "C";
};
Level.isSpike  = function (col, row) { return Level.charAt(col, row) === "^"; };
Level.isFinish = function (col, row) { return Level.charAt(col, row) === "F"; };

// How wide is the whole world, in pixels?
Level.pixelWidth = function () { return Level.cols * CONFIG.TILE; };
