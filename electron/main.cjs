
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const initSqlJs = require("sql.js");

let db;
let databasePath;
let saveQueue = Promise.resolve();
let isQuitting = false;

// Initialize SQLite database
async function initializeDatabase() {
  const SQL = await initSqlJs({
    locateFile: (file) => {
      if (app.isPackaged) {
        return path.join(
          process.resourcesPath,
          "app.asar.unpacked",
          "node_modules",
          "sql.js",
          "dist",
          file
        );
      }

      return path.join(path.dirname(require.resolve("sql.js")), file);
    },
  });

  const dataDirectory = app.getPath("userData");

  fs.mkdirSync(dataDirectory, { recursive: true });

  databasePath = path.join(dataDirectory, "chat.db");

  if (fs.existsSync(databasePath)) {
    const fileBuffer = fs.readFileSync(databasePath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT NOT NULL,
      userId TEXT NOT NULL,
      data TEXT NOT NULL,
      updatedAt INTEGER NOT NULL,
      PRIMARY KEY (userId, id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT NOT NULL,
      userId TEXT NOT NULL,
      conversationId TEXT NOT NULL,
      data TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      PRIMARY KEY (userId, conversationId, id)
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages (userId, conversationId, createdAt);
  `);

  await persistDatabase();

  console.log("pChats SQLite database:", databasePath);
}

// Persist database safely to local disk
function persistDatabase() {
  saveQueue = saveQueue.catch((error) => {
    console.error("Previous database save failed:", error);
  }).then(() => {
    if (!db || !databasePath) return;

    const exportedData = db.export();
    const tempPath = `${databasePath}.tmp`;

    try {
      fs.writeFileSync(tempPath, Buffer.from(exportedData));
      fs.renameSync(tempPath, databasePath);
    } catch (error) {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }

      throw error;
    }
  });

  return saveQueue;
}

// Get rows from SQLite
function getRows(sql, params = []) {
  const statement = db.prepare(sql);

  try {
    statement.bind(params);

    const rows = [];

    while (statement.step()) {
      rows.push(statement.getAsObject());
    }

    return rows;
  } finally {
    statement.free();
  }
}

// Create Electron window
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  } else {
    mainWindow.loadURL("http://127.0.0.1:5173");

    mainWindow.webContents.openDevTools({
      mode: "detach",
    });
  }
}

// Save conversations
ipcMain.handle(
  "chat:save-conversations",
  async (_event, userId, conversations) => {
    db.run("BEGIN TRANSACTION");

    try {
      for (const conversation of conversations) {
        db.run(
          `INSERT OR REPLACE INTO conversations
           (id, userId, data, updatedAt)
           VALUES (?, ?, ?, ?)`,
          [
            String(conversation.id),
            String(userId),
            JSON.stringify(conversation),
            Date.now(),
          ]
        );
      }

      db.run("COMMIT");
    } catch (error) {
      try {
        db.run("ROLLBACK");
      } catch {}

      throw error;
    }

    await persistDatabase();

    return true;
  }
);

// Load conversations
ipcMain.handle("chat:get-conversations", (_event, userId) => {
  const rows = getRows(
    `SELECT data FROM conversations
     WHERE userId = ?
     ORDER BY updatedAt DESC`,
    [String(userId)]
  );

  return rows.map((row) => JSON.parse(row.data));
});

// Load all messages for a user
ipcMain.handle("chat:get-all-messages", (_event, userId) => {
  const rows = getRows(
    `SELECT data FROM messages
     WHERE userId = ?
     ORDER BY createdAt ASC`,
    [String(userId)]
  );

  return rows.map((row) => JSON.parse(row.data));
});

// Save messages
ipcMain.handle(
  "chat:save-messages",
  async (_event, userId, messages) => {
    db.run("BEGIN TRANSACTION");

    try {
      for (const message of messages) {
        db.run(
          `INSERT OR REPLACE INTO messages
           (id, userId, conversationId, data, createdAt)
           VALUES (?, ?, ?, ?, ?)`,
          [
            String(message.id),
            String(userId),
            String(message.conversationId),
            JSON.stringify(message),
            Number(message.createdAt) || Date.now(),
          ]
        );
      }

      db.run("COMMIT");
    } catch (error) {
      try {
        db.run("ROLLBACK");
      } catch {}

      throw error;
    }

    await persistDatabase();

    return true;
  }
);

// Load messages for a conversation
ipcMain.handle(
  "chat:get-messages",
  (_event, userId, conversationId) => {
    const rows = getRows(
      `SELECT data FROM messages
       WHERE userId = ? AND conversationId = ?
       ORDER BY createdAt ASC`,
      [String(userId), String(conversationId)]
    );

    return rows.map((row) => JSON.parse(row.data));
  }
);

// Initialize application
app.whenReady().then(async () => {
  try {
    await initializeDatabase();

    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error("Failed to initialize pChats:", error);
    app.quit();
  }
});

// Close application windows
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Wait for pending database writes before closing SQLite
app.on("before-quit", (event) => {
  if (db && !isQuitting) {
    event.preventDefault();
    isQuitting = true;

    saveQueue
      .catch((error) => {
        console.error("Final database save failed:", error);
      })
      .then(() => {
        if (db) {
          db.close();
          db = null;
        }

        app.quit();
      });
  }
});
