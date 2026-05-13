const { app, BrowserWindow, ipcMain, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow;

function parseEnvFile(content) {
    const result = {};
    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;

        const eqIndex = line.indexOf('=');
        if (eqIndex === -1) continue;

        const key = line.slice(0, eqIndex).trim();
        let value = line.slice(eqIndex + 1).trim();

        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        if (key) result[key] = value;
    }
    return result;
}

function loadDotEnv() {
    const candidates = [
        path.join(process.cwd(), '.env'),
        path.join(__dirname, '.env'),
        path.join(path.dirname(process.execPath), '.env'),
        path.join(process.resourcesPath || '', '.env')
    ];

    for (const filePath of candidates) {
        try {
            if (filePath && fs.existsSync(filePath)) {
                return parseEnvFile(fs.readFileSync(filePath, 'utf8'));
            }
        } catch (error) {
            console.warn('Failed to read .env:', error.message);
        }
    }

    return {};
}

const envConfig = { ...loadDotEnv(), ...process.env };

function getRequiredEnv(name) {
    const value = envConfig[name];
    if (typeof value !== 'string' || !value.trim()) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value.trim();
}

function getPublicAppConfig() {
    return {
        firebase: {
            apiKey: getRequiredEnv('FIREBASE_API_KEY'),
            authDomain: getRequiredEnv('FIREBASE_AUTH_DOMAIN'),
            projectId: getRequiredEnv('FIREBASE_PROJECT_ID'),
            messagingSenderId: getRequiredEnv('FIREBASE_MESSAGING_SENDER_ID'),
            appId: getRequiredEnv('FIREBASE_APP_ID'),
            measurementId: envConfig.FIREBASE_MEASUREMENT_ID || ''
        }
    };
}


const ALLOWED_EXTERNAL_HOSTS = new Set([
    'discord.gg',
    'discord.com',
    'www.youtube.com',
    'youtube.com',
    'youtu.be',
    'ollama.com'
]);

function isAllowedExternalUrl(rawUrl) {
    if (typeof rawUrl !== 'string' || rawUrl.length > 2048) return false;

    try {
        const parsed = new URL(rawUrl);
        if (parsed.protocol !== 'https:') return false;

        const host = parsed.hostname.toLowerCase();
        return ALLOWED_EXTERNAL_HOSTS.has(host) || host.endsWith('.youtube.com');
    } catch (_) {
        return false;
    }
}

function isTrustedSender(event) {
    try {
        const senderUrl = event.senderFrame?.url || '';
        return senderUrl.startsWith('file://');
    } catch (_) {
        return false;
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        minWidth: 1100,
        minHeight: 720,
        show: false,
        frame: false,
        autoHideMenuBar: true,
        backgroundColor: '#09090b',
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            webviewTag: false,
            devTools: !app.isPackaged
        }
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (isAllowedExternalUrl(url)) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        const currentUrl = mainWindow.webContents.getURL();
        if (url !== currentUrl) {
            event.preventDefault();
            if (isAllowedExternalUrl(url)) {
                shell.openExternal(url);
            }
        }
    });

    mainWindow.loadFile('index.html');

    mainWindow.once('ready-to-show', () => {
        mainWindow.maximize();
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
// ==================== АВТО-ОБНОВЛЕНИЕ ====================
function setupAutoUpdater() {
  autoUpdater.autoDownload = false;           // не скачивать автоматически
  autoUpdater.autoInstallOnAppQuit = true;    // установить при выходе

  autoUpdater.on('checking-for-update', () => {
    console.log('Проверка обновлений...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Доступно обновление:', info.version);
    // Можно показать красивое окно с вопросом "Обновить?"
    const { dialog } = require('electron');
    dialog.showMessageBox({
      type: 'info',
      title: 'Доступно обновление',
      message: `Доступна новая версия ${info.version}`,
      detail: 'Хотите скачать и установить обновление?',
      buttons: ['Да', 'Позже'],
      defaultId: 0
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  });

  autoUpdater.on('update-downloaded', () => {
    const { dialog } = require('electron');
    dialog.showMessageBox({
      type: 'info',
      title: 'Обновление готово',
      message: 'Обновление загружено. Приложение будет перезапущено.',
      buttons: ['Перезапустить сейчас']
    }).then(() => {
      autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.on('error', (err) => {
    console.error('Ошибка автообновления:', err);
  });

  // Проверяем обновления при запуске
  setTimeout(() => {
    autoUpdater.checkForUpdates();
  }, 3000);
}

// Запускаем автообновление только в собранном приложении
if (app.isPackaged) {
  setupAutoUpdater();
}

app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
        callback(false);
    });

    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});


ipcMain.handle('get-app-config', async (event) => {
    if (!isTrustedSender(event)) return { ok: false, reason: 'Untrusted sender' };

    try {
        return { ok: true, config: getPublicAppConfig() };
    } catch (error) {
        return { ok: false, reason: error.message };
    }
});

ipcMain.on('minimize-window', (event) => {
    if (!isTrustedSender(event)) return;
    if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', (event) => {
    if (!isTrustedSender(event)) return;
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.on('close-window', (event) => {
    if (!isTrustedSender(event)) return;
    if (mainWindow) mainWindow.close();
});

ipcMain.handle('open-external-link', async (event, url) => {
    if (!isTrustedSender(event)) return { ok: false, reason: 'Untrusted sender' };
    if (!isAllowedExternalUrl(url)) return { ok: false, reason: 'Blocked external URL' };

    await shell.openExternal(url);
    return { ok: true };
});
