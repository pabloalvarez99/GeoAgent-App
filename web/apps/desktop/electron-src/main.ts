import {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  dialog,
  shell,
  protocol,
  net,
  type MenuItemConstructorOptions,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as fs from 'fs';

// Must be called before app.whenReady() — registers app:// as a standard, secure origin
// so Firebase Auth / fetch / localStorage work identically to a real https:// page.
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true } },
]);

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const WEB_URL = isDev ? 'http://localhost:3000' : null;

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'GeoAgent',
    backgroundColor: '#09090b', // zinc-950 (dark theme)
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false, // show after ready-to-show for smoother startup
  });

  // Load the Next.js app
  if (WEB_URL) {
    mainWindow.loadURL(WEB_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Production: serve static Next.js export via custom app:// protocol
    // so that SPA client-side routing and Firebase Auth work correctly.
    mainWindow.loadURL('app://./index.html');
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ── Menu nativo Windows ──────────────────────────────────────────────────────
function buildMenu() {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Nuevo Proyecto',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.executeJavaScript(
            `window.location.href = '/projects'`,
          ),
        },
        { type: 'separator' },
        {
          label: 'Exportar',
          accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow?.webContents.executeJavaScript(
            `window.location.href = window.location.pathname.replace(/\\/(stations|drillholes|map|photos|import|export).*$/, '') + '/export'`,
          ),
        },
        { type: 'separator' },
        { label: 'Salir', role: 'quit' },
      ],
    },
    {
      label: 'Ver',
      submenu: [
        { label: 'Inicio', accelerator: 'CmdOrCtrl+Shift+H', click: () => mainWindow?.webContents.executeJavaScript(`window.location.href = '/home'`) },
        { label: 'Proyectos', accelerator: 'CmdOrCtrl+Shift+P', click: () => mainWindow?.webContents.executeJavaScript(`window.location.href = '/projects'`) },
        { label: 'Ajustes', click: () => mainWindow?.webContents.executeJavaScript(`window.location.href = '/settings'`) },
        { type: 'separator' },
        { label: 'Recargar', role: 'reload' },
        { label: 'Forzar Recarga', role: 'forceReload' },
        { type: 'separator' },
        { label: 'Pantalla Completa', role: 'togglefullscreen' },
        { label: 'Zoom +', role: 'zoomIn' },
        { label: 'Zoom -', role: 'zoomOut' },
        { label: 'Zoom Normal', role: 'resetZoom' },
        ...(isDev ? [{ type: 'separator' as const }, { label: 'DevTools', role: 'toggleDevTools' as const }] : []),
      ],
    },
    {
      label: 'Editar',
      submenu: [
        { label: 'Deshacer', role: 'undo' },
        { label: 'Rehacer', role: 'redo' },
        { type: 'separator' },
        { label: 'Cortar', role: 'cut' },
        { label: 'Copiar', role: 'copy' },
        { label: 'Pegar', role: 'paste' },
        { label: 'Seleccionar todo', role: 'selectAll' },
      ],
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Buscar actualizaciones',
          click: () => { autoUpdater.checkForUpdatesAndNotify(); },
        },
        { type: 'separator' },
        {
          label: 'Acerca de GeoAgent',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              title: 'GeoAgent',
              message: 'GeoAgent Desktop',
              detail: `Versión ${app.getVersion()}\nApp de geología de campo — datos sincronizados con Firebase`,
              buttons: ['Cerrar'],
            });
          },
        },
        {
          label: 'Ver en GitHub',
          click: () => shell.openExternal('https://github.com/pabloalvarez99/GeoAgent-App'),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── IPC handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('save-file', async (_event, filename: string, buffer: ArrayBuffer) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: filename,
    filters: getFiltersFromExt(filename),
  });
  if (!filePath) return null;
  fs.writeFileSync(filePath, Buffer.from(buffer));
  return filePath;
});

ipcMain.handle('show-save-dialog', async (_event, options: any) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow!, options);
  return filePath ?? null;
});

ipcMain.handle('open-file', async (_event, options: any) => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    ...options,
  });
  if (!filePaths[0]) return null;
  const buffer = fs.readFileSync(filePaths[0]).buffer;
  return { path: filePaths[0], buffer };
});

ipcMain.handle('get-version', () => app.getVersion());

ipcMain.handle('check-for-updates', () => {
  autoUpdater.checkForUpdatesAndNotify();
});

function getFiltersFromExt(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx') return [{ name: 'Excel', extensions: ['xlsx'] }];
  if (ext === 'pdf') return [{ name: 'PDF', extensions: ['pdf'] }];
  if (ext === 'csv') return [{ name: 'CSV', extensions: ['csv'] }];
  if (ext === 'json' || ext === 'geojson') return [{ name: 'GeoJSON', extensions: ['json', 'geojson'] }];
  if (ext === 'zip') return [{ name: 'ZIP', extensions: ['zip'] }];
  return [{ name: 'Todos los archivos', extensions: ['*'] }];
}

// ── Auto-updater ─────────────────────────────────────────────────────────────
function setupAutoUpdater() {
  if (isDev) return;

  autoUpdater.autoDownload = false;

  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: 'Actualización disponible',
      message: `GeoAgent ${info.version} está disponible.`,
      detail: 'La nueva versión se descargará en segundo plano.',
      buttons: ['Descargar', 'Más tarde'],
    }).then(({ response }) => {
      if (response === 0) autoUpdater.downloadUpdate();
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: 'Actualización lista',
      message: 'Reinicia GeoAgent para instalar la nueva versión.',
      buttons: ['Reiniciar ahora', 'Más tarde'],
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.checkForUpdatesAndNotify();
}

// ── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // Windows taskbar grouping
  if (process.platform === 'win32') app.setAppUserModelId('com.geoagent.app');

  // Serve the static Next.js export from resources/web-out via app://
  // Resolution order for a request like app://./projects:
  //   1. web-out/projects           (exact file — e.g. app://./favicon.ico)
  //   2. web-out/projects/index.html (trailingSlash route folder — e.g. app://./projects/)
  //   3. web-out/index.html          (fallback for client-side deep links)
  const webOutDir = path.join(process.resourcesPath, 'web-out');
  protocol.handle('app', (request) => {
    const { pathname } = new URL(request.url);
    // Strip leading slash and resolve safely (no path traversal)
    const relative = pathname.replace(/^\//, '').split('/').filter(s => s !== '..').join('/');
    const candidates = [
      path.join(webOutDir, relative),
      path.join(webOutDir, relative, 'index.html'),
      path.join(webOutDir, 'index.html'),
    ];
    const filePath = candidates.find(p => fs.existsSync(p) && fs.statSync(p).isFile());
    return net.fetch('file://' + (filePath ?? candidates[candidates.length - 1]));
  });

  buildMenu();
  createWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
