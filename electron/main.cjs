
const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const initSqlJs = require("sql.js");

let mainWindow = null;
let SQL;
let db;
let dbPath;

let saveQueue = Promise.resolve();
let isClosing = false;
Menu.setApplicationMenu(null);
// --------------------------------------------------
// DATABASE INITIALIZATION
// --------------------------------------------------

async function initializeDatabase() {
  SQL = await initSqlJs({
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

      return path.join(
        path.dirname(require.resolve("sql.js")),
        file
      );
    },
  });

  const userDataPath = app.getPath("userData");

  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  dbPath = path.join(userDataPath, "chat.db");

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  createTables();

  console.log("SQLite database initialized:", dbPath);
}

// --------------------------------------------------
// DATABASE TABLES
// --------------------------------------------------

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT NOT NULL,
      userId TEXT NOT NULL,
      data TEXT NOT NULL,
      updatedAt INTEGER,
      PRIMARY KEY (userId, id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT NOT NULL,
      userId TEXT NOT NULL,
      conversationId TEXT NOT NULL,
      data TEXT NOT NULL,
      createdAt INTEGER,
      PRIMARY KEY (userId, conversationId, id)
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_messages_user_conversation
    ON messages (userId, conversationId, createdAt)
  `);
}

// --------------------------------------------------
// DATABASE PERSISTENCE
// --------------------------------------------------

function persistDatabase() {
  if (!db || !dbPath) {
    return Promise.reject(
      new Error("Database is not initialized")
    );
  }

  saveQueue = saveQueue
    .catch((error) => {
      console.error("Previous database save failed:", error);
    })
    .then(async () => {
      const data = db.export();
      const tempPath = `${dbPath}.tmp`;

      await fs.promises.writeFile(
        tempPath,
        Buffer.from(data)
      );

      await fs.promises.rename(tempPath, dbPath);
    });

  return saveQueue;
}

// --------------------------------------------------
// DATABASE HELPERS
// --------------------------------------------------

function getRows(sql, params = []) {
  const statement = db.prepare(sql);
  const rows = [];

  try {
    statement.bind(params);

    while (statement.step()) {
      rows.push(statement.getAsObject());
    }
  } finally {
    statement.free();
  }

  return rows;
}

function parseData(rows) {
  return rows.map((row) => {
    try {
      return JSON.parse(row.data);
    } catch {
      return row.data;
    }
  });
}

// --------------------------------------------------
// REGISTER IPC HANDLERS
// --------------------------------------------------

function registerIpcHandlers() {
  console.log("Registering Electron IPC handlers...");

  // SAVE CONVERSATIONS
  ipcMain.handle(
    "chat:save-conversations",
    async (_event, userId, conversations) => {
      const uid = String(userId);

      db.run("BEGIN TRANSACTION");

      try {
        for (const conversation of conversations || []) {
          db.run(
            `
              INSERT INTO conversations (
                id,
                userId,
                data,
                updatedAt
              )
              VALUES (?, ?, ?, ?)
              ON CONFLICT(userId, id)
              DO UPDATE SET
                data = excluded.data,
                updatedAt = excluded.updatedAt
            `,
            [
              String(conversation.id),
              uid,
              JSON.stringify(conversation),
              Number(conversation.updatedAt || Date.now()),
            ]
          );
        }

        db.run("COMMIT");
      } catch (error) {
        db.run("ROLLBACK");
        throw error;
      }

      await persistDatabase();

      return true;
    }
  );

  // GET CONVERSATIONS
  ipcMain.handle(
    "chat:get-conversations",
    async (_event, userId) => {
      const rows = getRows(
        `
          SELECT data
          FROM conversations
          WHERE userId = ?
          ORDER BY updatedAt DESC
        `,
        [String(userId)]
      );

      return parseData(rows);
    }
  );

  // SAVE MESSAGES
  ipcMain.handle(
    "chat:save-messages",
    async (_event, userId, messages) => {
      const uid = String(userId);

      db.run("BEGIN TRANSACTION");

      try {
        for (const message of messages || []) {
          db.run(
            `
              INSERT INTO messages (
                id,
                userId,
                conversationId,
                data,
                createdAt
              )
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(userId, conversationId, id)
              DO UPDATE SET
                data = excluded.data,
                createdAt = excluded.createdAt
            `,
            [
              String(message.id),
              uid,
              String(message.conversationId),
              JSON.stringify(message),
              Number(message.createdAt || Date.now()),
            ]
          );
        }

        db.run("COMMIT");
      } catch (error) {
        db.run("ROLLBACK");
        throw error;
      }

      await persistDatabase();

      return true;
    }
  );

  // GET MESSAGES FOR ONE CONVERSATION
  ipcMain.handle(
    "chat:get-messages",
    async (_event, userId, conversationId) => {
      const rows = getRows(
        `
          SELECT data
          FROM messages
          WHERE userId = ?
            AND conversationId = ?
          ORDER BY createdAt ASC
        `,
        [
          String(userId),
          String(conversationId),
        ]
      );

      return parseData(rows);
    }
  );

  // GET ALL MESSAGES FOR A USER
  ipcMain.handle(
    "chat:get-all-messages",
    async (_event, userId) => {
      const rows = getRows(
        `
          SELECT data
          FROM messages
          WHERE userId = ?
          ORDER BY createdAt ASC
        `,
        [String(userId)]
      );

      return parseData(rows);
    }
  );

  // DELETE CONVERSATION AND ITS MESSAGES
  ipcMain.handle(
    "chat:delete-conversation",
    async (_event, userId, conversationId) => {
      console.log(
        "IPC received: chat:delete-conversation",
        userId,
        conversationId
      );

      db.run("BEGIN TRANSACTION");

      try {
        db.run(
          `
            DELETE FROM messages
            WHERE userId = ?
              AND conversationId = ?
          `,
          [
            String(userId),
            String(conversationId),
          ]
        );

        db.run(
          `
            DELETE FROM conversations
            WHERE userId = ?
              AND id = ?
          `,
          [
            String(userId),
            String(conversationId),
          ]
        );

        db.run("COMMIT");
      } catch (error) {
        db.run("ROLLBACK");
        throw error;
      }

      await persistDatabase();

      return true;
    }
  );

  // DELETE SINGLE MESSAGE
  ipcMain.handle(
    "chat:delete-message",
    async (_event, userId, conversationId, messageId) => {
      console.log(
        "IPC received: chat:delete-message",
        userId,
        conversationId,
        messageId
      );

      db.run(
        `
          DELETE FROM messages
          WHERE userId = ?
            AND conversationId = ?
            AND id = ?
        `,
        [
          String(userId),
          String(conversationId),
          String(messageId),
        ]
      );

      await persistDatabase();

      return true;
    }
  );

}

// --------------------------------------------------
// CREATE ELECTRON WINDOW
// --------------------------------------------------

function createWindow() {
  const preloadPath = path.join(__dirname, "preload.cjs");

  console.log("Preload path:", preloadPath);
  console.log("Preload exists:", fs.existsSync(preloadPath));

  mainWindow = new BrowserWindow({
    width: 900,
    height: 750,
    minWidth: 500,
    minHeight: 600,
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
//  mainWindow.maximize();
  if (app.isPackaged) {
    mainWindow.loadFile(
      path.join(__dirname, "../dist/index.html")
    );
  } else {
    mainWindow.loadURL("http://127.0.0.1:5173");
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.on("did-finish-load", async () => {
    try {
      const result =
        await mainWindow.webContents.executeJavaScript(`
          ({
            storage: typeof window.chatStorage,
            deleteConversation:
              typeof window.chatStorage?.deleteConversation,
            deleteMessage:
              typeof window.chatStorage?.deleteMessage
          })
        `);

      console.log("Preload API check:", result);
    } catch (error) {
      console.error("Preload API check failed:", error);
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
// --------------------------------------------------
// APP LIFECYCLE
// --------------------------------------------------
app.whenReady().then(async () => {
  try {
    await initializeDatabase();
    registerIpcHandlers();

    createWindow();
  } catch (error) {
    console.error("Electron initialization failed:", error);
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", (event) => {
  if (isClosing) {
    return;
  }

  event.preventDefault();
  isClosing = true;

  saveQueue
    .catch((error) => {
      console.error("Final database save failed:", error);
    })
    .finally(() => {
      if (db) {
        db.close();
        db = null;
      }

      app.quit();
    });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
// MINIMIZE WINDOW
ipcMain.on("window:minimize", () => {
  mainWindow?.minimize();
});

// MAXIMIZE / RESTORE WINDOW
ipcMain.on("window:maximize", () => {
  if (!mainWindow) return;

  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

// CLOSE WINDOW
ipcMain.on("window:close", () => {
  mainWindow?.close();
});
