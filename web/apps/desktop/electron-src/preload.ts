import { contextBridge, ipcRenderer } from 'electron';

// Expose safe APIs to the renderer process (Next.js web app)
// nodeIntegration is disabled — all native access goes through this bridge
contextBridge.exposeInMainWorld('electronAPI', {
  // Save a file via native dialog
  saveFile: (filename: string, buffer: ArrayBuffer): Promise<string | null> =>
    ipcRenderer.invoke('save-file', filename, buffer),

  // Show native save dialog and return chosen path
  showSaveDialog: (options: {
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
  }): Promise<string | null> =>
    ipcRenderer.invoke('show-save-dialog', options),

  // Open a file via native dialog
  openFile: (options: {
    filters?: { name: string; extensions: string[] }[];
  }): Promise<{ path: string; buffer: ArrayBuffer } | null> =>
    ipcRenderer.invoke('open-file', options),

  // App info
  getVersion: (): Promise<string> => ipcRenderer.invoke('get-version'),

  // Check for updates
  checkForUpdates: (): Promise<void> => ipcRenderer.invoke('check-for-updates'),

  // Platform detection
  platform: process.platform,
  isElectron: true,
});
