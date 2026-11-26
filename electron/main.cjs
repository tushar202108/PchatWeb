
const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  dialog, nativeImage,
} = require("electron");
const path = require("path");
const fs = require("fs");
const initSqlJs = require("sql.js");
const { randomUUID } = require("crypto");
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
    // UPDATE SINGLE MESSAGE
  ipcMain.handle(
    "chat:update-message",
    async (_event, userId, conversationId, messageId, updates) => {
      console.log(
        "IPC received: chat:update-message",
        userId,
        conversationId,
        messageId
      );

      const rows = getRows(
        `
          SELECT data
          FROM messages
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

      if (!rows.length) {
        console.warn("Message not found:", messageId);
        return false;
      }

      const existingData = JSON.parse(rows[0].data);

      // Only allow these fields to be updated.
      const allowedFields = [
        "text",
        "attachments",
        "deleted",
        "deletedForEveryone",
        "deletedAt",
      ];

      const safeUpdates = {};

      for (const field of allowedFields) {
        if (
          Object.prototype.hasOwnProperty.call(
            updates || {},
            field
          )
        ) {
          safeUpdates[field] = updates[field];
        }
      }

      const updatedData = {
        ...existingData,
        ...safeUpdates,
      };

      db.run(
        `
          UPDATE messages
          SET data = ?
          WHERE userId = ?
            AND conversationId = ?
            AND id = ?
        `,
        [
          JSON.stringify(updatedData),
          String(userId),
          String(conversationId),
          String(messageId),
        ]
      );

      await persistDatabase();

      console.log("Message updated successfully:", messageId);

      return true;
    }
  );
  // CLEAR MESSAGES BUT KEEP CONVERSATION
ipcMain.handle(
  "chat:clear-messages",
  async (_event, userId, conversationId) => {
    const uid = String(userId);
    const cid = String(conversationId);

    db.run("BEGIN TRANSACTION");

    try {
      db.run(
        `
          DELETE FROM messages
          WHERE userId = ?
            AND conversationId = ?
        `,
        [uid, cid]
      );

      db.run("COMMIT");
    } catch (error) {
      db.run("ROLLBACK");
      throw error;
    }

    // Remove this user's local attachment files for this conversation.
    const attachmentFolder = path.join(
      attachmentRoot,
      safeFolderName(uid),
      safeFolderName(cid)
    );

    await fs.promises.rm(attachmentFolder, {
      recursive: true,
      force: true,
    });

    await persistDatabase();

    return true;
  }
);
}

// --------------------------------------------------
// CREATE ELECTRON WINDOW
// --------------------------------------------------
if (process.platform === "win32") {
    app.setAppUserModelId("com.pchats.desktop");
}
app.setName("pChats");
function createWindow() {
  const preloadPath = path.join(__dirname, "preload.cjs");
   const iconPath = path.resolve(
  __dirname,
  "../Assets/chatLogo.ico"
);

const appIcon = nativeImage.createFromPath(iconPath);

console.log("Icon exists:", fs.existsSync(iconPath));
console.log("Icon is empty:", appIcon.isEmpty());
console.log("Icon size:", appIcon.getSize());

mainWindow = new BrowserWindow({
  width: 900,
  height: 750,
  minWidth: 500,
  minHeight: 600,
  frame: false,
  icon: appIcon,
  autoHideMenuBar: true,
  webPreferences: {
    preload: preloadPath,
    contextIsolation: true,
    nodeIntegration: false,
  },
});

if (!appIcon.isEmpty()) {
  mainWindow.setIcon(appIcon);
}
//  mainWindow.maximize();
  if (app.isPackaged) {
    mainWindow.loadFile(
      path.join(__dirname, "../dist/index.html"),
       mainWindow.webContents.openDevTools(),   // Temporary added
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
    registerWallpaperIpcHandlers();
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

const attachmentRoot = path.join(
  app.getPath("userData"),
  "attachments"
);

function safeFolderName(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "_");
}

// Save an attachment permanently on the device
ipcMain.handle("attachment:save", async (_event, payload) => {
  const {
    userId,
    conversationId,
    name,
    type,
    bytes,
  } = payload;

  if (!userId || !conversationId || !name || !bytes) {
    throw new Error("Invalid attachment data");
  }

  const userFolder = safeFolderName(userId);
  const conversationFolder = safeFolderName(conversationId);

  const folder = path.join(
    attachmentRoot,
    userFolder,
    conversationFolder
  );

  await fs.promises.mkdir(folder, { recursive: true });

  const id = randomUUID();
  const extension = path.extname(name).replace(/[^a-zA-Z0-9.]/g, "");
  const storedName = `${id}${extension}`;

  const filePath = path.join(folder, storedName);

  await fs.promises.writeFile(
    filePath,
    Buffer.from(bytes)
  );

  return {
    id,
    name,
    type: type || "application/octet-stream",
    size: Buffer.byteLength(Buffer.from(bytes)),
    storageKey: path.relative(attachmentRoot, filePath),
  };
});

// Read a locally saved attachment for preview
ipcMain.handle("attachment:read", async (_event, storageKey) => {
  const filePath = path.resolve(attachmentRoot, storageKey);
  const relativePath = path.relative(attachmentRoot, filePath);

  if (
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("Invalid attachment path");
  }

  const buffer = await fs.promises.readFile(filePath);
  const extension = path.extname(filePath).toLowerCase();

const mimeTypes = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".txt": "text/plain",
};

  const mimeType = mimeTypes[extension] || "application/octet-stream";

  return `data:${mimeType};base64,${buffer.toString("base64")}`;
});

const DEFAULT_WALLPAPER_DIR = app.isPackaged
  ? path.join(
      process.resourcesPath,
      "Wallpapers",
      "Default Wallpaper"
    )
  : path.join(
      __dirname,
      "Wallpapers",
      "Default Wallpaper"
    );

const ALLOWED_WALLPAPER_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
];

function getCustomWallpaperDir() {
  return path.join(
    app.getPath("userData"),
    "Wallpapers",
    "Custom Wallpaper"
  );
}

function getWallpaperSettingsPath() {
  return path.join(
    app.getPath("userData"),
    "Wallpapers",
    "wallpaper-settings.json"
  );
}

function getDefaultWallpaperSettings() {
  return {
    applyToAll: true,
    all: "",
    conversations: {},
  };
}

function safeWallpaperName(value) {
  return path.basename(String(value)).replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getWallpaperMimeType(extension) {
  const types = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
  };

  return types[extension.toLowerCase()] || "application/octet-stream";
}

async function listWallpaperFiles(folder, source) {
  if (source === "default") {
    try {
      const files = await fs.promises.readdir(folder, {
        withFileTypes: true,
      });

      return files
        .filter((item) => item.isFile())
        .map((item) => item.name)
        .filter((name) =>
          ALLOWED_WALLPAPER_EXTENSIONS.includes(
            path.extname(name).toLowerCase()
          )
        )
        .map((name) => ({
          id: `default:${name}`,
          name,
          source: "default",
        }));
    } catch (error) {
      console.error("Failed to read default wallpapers:", folder, error);
      return [];
    }
  }

  // Custom wallpapers are stored in the writable userData directory.
  await fs.promises.mkdir(folder, { recursive: true });

  const files = await fs.promises.readdir(folder, {
    withFileTypes: true,
  });

  return files
    .filter((item) => item.isFile())
    .map((item) => item.name)
    .filter((name) =>
      ALLOWED_WALLPAPER_EXTENSIONS.includes(
        path.extname(name).toLowerCase()
      )
    )
    .map((name) => ({
      id: `custom:${name}`,
      name,
      source: "custom",
    }));
}

async function readWallpaperSettings() {
  const settingsPath = getWallpaperSettingsPath();

  try {
    const content = await fs.promises.readFile(settingsPath, "utf8");
    const parsed = JSON.parse(content);

    return {
      applyToAll: Boolean(parsed.applyToAll),
      all: typeof parsed.all === "string" ? parsed.all : "",
      conversations:
        parsed.conversations &&
        typeof parsed.conversations === "object"
          ? parsed.conversations
          : {},
    };
  } catch {
    return getDefaultWallpaperSettings();
  }
}

async function saveWallpaperSettings(settings) {
  const folder = path.dirname(getWallpaperSettingsPath());
  await fs.promises.mkdir(folder, { recursive: true });

  const safeSettings = {
    applyToAll: Boolean(settings?.applyToAll),
    all: typeof settings?.all === "string" ? settings.all : "",
    conversations:
      settings?.conversations &&
      typeof settings.conversations === "object"
        ? settings.conversations
        : {},
  };

  const settingsPath = getWallpaperSettingsPath();
  const tempPath = `${settingsPath}.tmp`;

  await fs.promises.writeFile(
    tempPath,
    JSON.stringify(safeSettings, null, 2),
    "utf8"
  );

  await fs.promises.rename(tempPath, settingsPath);

  return true;
}

function resolveWallpaperPath(id) {
  if (typeof id !== "string") {
    throw new Error("Invalid wallpaper ID");
  }

  const separatorIndex = id.indexOf(":");

  if (separatorIndex < 0) {
    throw new Error("Invalid wallpaper ID");
  }

  const source = id.slice(0, separatorIndex);
  const name = id.slice(separatorIndex + 1);
  const safeName = safeWallpaperName(name);

  if (!safeName || safeName !== name) {
    throw new Error("Invalid wallpaper filename");
  }

  const extension = path.extname(safeName).toLowerCase();

  if (!ALLOWED_WALLPAPER_EXTENSIONS.includes(extension)) {
    throw new Error("Unsupported wallpaper format");
  }

  if (source === "default") {
    return path.join(DEFAULT_WALLPAPER_DIR, safeName);
  }

  if (source === "custom") {
    return path.join(getCustomWallpaperDir(), safeName);
  }

  throw new Error("Unknown wallpaper source");
}

function registerWallpaperIpcHandlers() {
  ipcMain.handle("wallpaper:get-all", async () => {
    const [defaults, customs] = await Promise.all([
      listWallpaperFiles(DEFAULT_WALLPAPER_DIR, "default"),
      listWallpaperFiles(getCustomWallpaperDir(), "custom"),
    ]);

    return [...defaults, ...customs];
  });

  ipcMain.handle("wallpaper:read", async (_event, id) => {
    const filePath = resolveWallpaperPath(id);
    const buffer = await fs.promises.readFile(filePath);
    const mimeType = getWallpaperMimeType(path.extname(filePath));

    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  });

  ipcMain.handle("wallpaper:import", async (_event, payload) => {
    const name = safeWallpaperName(payload?.name || "");
    const extension = path.extname(name).toLowerCase();

    if (!name || !ALLOWED_WALLPAPER_EXTENSIONS.includes(extension)) {
      throw new Error("Unsupported wallpaper format");
    }

    if (!payload?.bytes) {
      throw new Error("Wallpaper data is missing");
    }

    const bytes = Buffer.from(payload.bytes);

    if (!bytes.length || bytes.length > 15 * 1024 * 1024) {
      throw new Error("Wallpaper must be smaller than 15 MB");
    }

    const folder = getCustomWallpaperDir();
    await fs.promises.mkdir(folder, { recursive: true });

    const storedName = `${randomUUID()}${extension}`;
    await fs.promises.writeFile(
      path.join(folder, storedName),
      bytes
    );

    return {
      id: `custom:${storedName}`,
      name,
      source: "custom",
    };
  });

  ipcMain.handle("wallpaper:delete", async (_event, id) => {
    if (typeof id !== "string" || !id.startsWith("custom:")) {
      throw new Error("Only custom wallpapers can be deleted");
    }

    const filePath = resolveWallpaperPath(id);
    await fs.promises.unlink(filePath);

    return true;
  });

  ipcMain.handle("wallpaper:get-settings", async () => {
    return readWallpaperSettings();
  });

  ipcMain.handle(
    "wallpaper:save-settings",
    async (_event, settings) => {
      return saveWallpaperSettings(settings);
    }
  );
}
