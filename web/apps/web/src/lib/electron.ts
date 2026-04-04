// Electron bridge — safe to call in browser, no-ops in plain browser/SSR

export const isElectron = (): boolean =>
  typeof window !== 'undefined' && (window as any).electronAPI?.isElectron === true;

/**
 * Save a file. In Electron, uses native save dialog.
 * In browser, triggers a download link.
 */
export async function saveFile(
  filename: string,
  data: Blob | ArrayBuffer | Uint8Array,
): Promise<void> {
  const buffer = data instanceof Blob ? await data.arrayBuffer() : data;

  if (isElectron()) {
    const api = (window as any).electronAPI;
    await api.saveFile(filename, buffer);
    return;
  }

  // Browser fallback: download link
  const blob = data instanceof Blob ? data : new Blob([buffer]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}
