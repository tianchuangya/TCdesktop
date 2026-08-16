const { app, BrowserWindow, ipcMain, shell, clipboard, dialog, screen, Tray, Menu, nativeImage, globalShortcut, desktopCapturer, session } = require('electron');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { pathToFileURL } = require('url');
const { FullDesktopModeRuntime } = require('./desktop-runtime/full-desktop-mode-runtime');
let neteaseApi = null;
try { neteaseApi = require('NeteaseCloudMusicApi'); } catch (error) { console.warn('[OrbitDesk] NeteaseCloudMusicApi unavailable:', error.message); }

const SETTINGS_FILE = 'tcdesktop-settings.json';
const NETEASE_AUTH_FILE = 'netease-auth.json';
const NETEASE_LIBRARY_CACHE_FILE = 'netease-library-cache.json';
const DEFAULT_WALLPAPER_DIR = path.join(__dirname, 'src', 'assets', 'wallpapers');
const SMOKE_TEST = process.env.ORBITDESK_SMOKE_TEST === '1';
const SMOKE_EMBEDDED = SMOKE_TEST && process.env.ORBITDESK_SMOKE_EMBEDDED === '1';
const SMOKE_SHOW_SETTINGS = process.env.ORBITDESK_SMOKE_SETTINGS !== '0';
const SMOKE_SHOW_SHELF = process.env.ORBITDESK_SMOKE_SHELF !== '0';
let smokeUserDataPath = '';
if (SMOKE_TEST) {
  smokeUserDataPath = fs.mkdtempSync(path.join(os.tmpdir(), 'OrbitDeskSmoke-'));
  app.setPath('userData', smokeUserDataPath);
}
const WALLPAPER_IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
const WALLPAPER_VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.mkv']);
let mainWindow;
let desktopRuntime;
let tray;
let quitting = false;
let exitInFlight = null;
let desktopSurfaceRestoreTimer = null;
let desktopSurfaceRestoreFollowupTimer = null;
let desktopSurfaceRestoreInFlight = false;
let suppressShowDesktopHideUntil = 0;
let lastDesktopSurfaceRestoreAt = 0;
const fileIconCache = new Map();
const FILE_ICON_CACHE_LIMIT = 128;
const WALLPAPER_CAPTURE_SIZE = { width: 960, height: 540 };
const WALLPAPER_CAPTURE_MIN_INTERVAL = 125;
let lastCaptureAt = 0;
let lastCaptureFrame = null;
let preferredCaptureSourceId = '';
let lastCaptureSourcesKey = '';
let lyricMatchCache = { key: '', at: 0, value: null };
let lastGoodMediaState = { at: 0, value: null };
let embeddedNeteaseState = { song: null, matched: null, startedAt: 0, pausedAt: 0, playing: false, url: '', updatedAt: 0 };
let neteaseAuthCache = null;
let captureFrameSequence = 0;
let settingsWriteQueue = Promise.resolve();
let wallpaperEngineInstallCache = { path: '', checkedAt: 0 };
let wallpaperEngineSteamRoots = [];
let wallpaperEngineProjectCache = { items: [], checkedAt: 0 };
let wallpaperThumbnailSources = new Map();
const wallpaperThumbnailCache = new Map();
const wallpaperPackageVideoCache = new Map();
const processStatusCache = new Map();
let systemMetricsCache = { at: 0, value: null };
let cpuSample = null;
let networkSample = null;
const WALLPAPER_THUMBNAIL_CACHE_LIMIT = 10;
const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) app.quit();
app.on('second-instance', () => mainWindow?.showInactive());
app.on('quit', () => {
  const tempRoot = path.resolve(os.tmpdir());
  const target = smokeUserDataPath ? path.resolve(smokeUserDataPath) : '';
  if (target && target.startsWith(`${tempRoot}${path.sep}`) && path.basename(target).startsWith('OrbitDeskSmoke-')) {
    try { fs.rmSync(target, { recursive: true, force: true }); } catch {}
  }
});

const GROUPS = [
  { id: 'projects', label: '项目星系', extensions: [] },
  { id: 'apps', label: '应用程序', extensions: ['.lnk', '.exe', '.url', '.appref-ms'] },
  { id: 'documents', label: '文档资料', extensions: ['.md', '.txt', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.csv'] },
  { id: 'media', label: '视觉素材', extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.mp4', '.mov', '.mkv', '.mp3', '.wav', '.flac'] },
  { id: 'archives', label: '压缩与归档', extensions: ['.zip', '.7z', '.rar', '.tar', '.gz'] },
  { id: 'folders', label: '文件夹', extensions: [] },
  { id: 'other', label: '其他', extensions: [] }
];

function settingsPath() {
  return path.join(app.getPath('userData'), SETTINGS_FILE);
}

function neteaseAuthPath() {
  return path.join(app.getPath('userData'), NETEASE_AUTH_FILE);
}

function neteaseLibraryCachePath() {
  return path.join(app.getPath('userData'), NETEASE_LIBRARY_CACHE_FILE);
}

function userWallpaperDir() {
  return path.join(app.getPath('userData'), 'wallpapers');
}

function userBlockAssetDir() {
  return path.join(app.getPath('userData'), 'block-assets');
}

async function focusNativeWindow() {
  if (process.platform !== 'win32' || !mainWindow || mainWindow.isDestroyed()) return false;
  const handle = mainWindow.getNativeWindowHandle();
  if (!handle) return false;
  const hwnd = process.arch === 'x64' ? handle.readBigUInt64LE(0).toString() : String(handle.readUInt32LE(0));
  const script = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class ODKeyboardFocus {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern IntPtr SetFocus(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool SetActiveWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern IntPtr GetFocus();
}
"@
$h = [IntPtr]::new(${hwnd})
[ODKeyboardFocus]::SetForegroundWindow($h) | Out-Null
[ODKeyboardFocus]::SetActiveWindow($h) | Out-Null
[ODKeyboardFocus]::SetFocus($h) | Out-Null
`;
  try {
    await new Promise((resolve) => {
      execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], { windowsHide: true, timeout: 2500 }, () => resolve());
    });
    return true;
  } catch {
    return false;
  }
}

function aiConfigPath() {
  return path.join(app.getPath('userData'), 'ai-config.json');
}

async function readAiConfig() {
  try {
    const parsed = JSON.parse(await fsp.readFile(aiConfigPath(), 'utf8'));
    return { key: String(parsed?.key || ''), baseUrl: String(parsed?.baseUrl || ''), model: String(parsed?.model || '') };
  } catch {
    return { key: '', baseUrl: '', model: '' };
  }
}

async function writeAiConfig(next) {
  const config = {
    key: String(next?.key || ''),
    baseUrl: String(next?.baseUrl || ''),
    model: String(next?.model || '')
  };
  if (!config.key) {
    await fsp.rm(aiConfigPath(), { force: true }).catch(() => null);
    return config;
  }
  await fsp.writeFile(aiConfigPath(), JSON.stringify(config, null, 2), 'utf8');
  return config;
}

async function aiChat(messages) {
  const config = await readAiConfig();
  if (!config.key) return { ok: false, error: 'AI_NOT_CONFIGURED', message: '请先在 AI 助手里配置 API Key' };
  const baseUrl = String(config.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const url = `${baseUrl}/chat/completions`;
  const list = Array.isArray(messages) ? messages.slice(-30) : [];
  const body = {
    model: config.model || 'gpt-4o-mini',
    messages: list,
    temperature: 0.7,
    stream: false
  };
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.key}` },
      body: JSON.stringify(body)
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) return { ok: false, error: 'AI_ERROR', message: data?.error?.message || `HTTP ${resp.status}` };
    const content = String(data?.choices?.[0]?.message?.content || '');
    return { ok: true, content };
  } catch (error) {
    return { ok: false, error: 'AI_REQUEST_FAILED', message: error?.message || String(error) };
  }
}

async function aiChatStream(messages, sender) {
  const config = await readAiConfig();
  if (!config.key) { sender?.send?.('ai:error', { error: 'AI_NOT_CONFIGURED', message: '请先配置 API Key' }); return; }
  const baseUrl = String(config.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const url = `${baseUrl}/chat/completions`;
  const list = Array.isArray(messages) ? messages.slice(-30) : [];
  const body = {
    model: config.model || 'gpt-4o-mini',
    messages: list,
    temperature: 0.7,
    stream: true
  };
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.key}` },
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      sender?.send?.('ai:error', { error: 'AI_ERROR', message: data?.error?.message || `HTTP ${resp.status}` });
      return;
    }
    const reader = resp.body?.getReader?.();
    if (!reader) { sender?.send?.('ai:error', { error: 'AI_NO_STREAM', message: '当前服务不支持流式输出' }); return; }
    const decoder = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        const s = line.trim();
        if (!s.startsWith('data:')) continue;
        const data = s.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const json = JSON.parse(data);
          const delta = String(json?.choices?.[0]?.delta?.content || '');
          if (delta) sender?.send?.('ai:chunk', { content: delta });
        } catch {}
      }
    }
    sender?.send?.('ai:done', {});
  } catch (error) {
    sender?.send?.('ai:error', { error: 'AI_REQUEST_FAILED', message: error?.message || String(error) });
  }
}

function cpuTimesSnapshot() {
  const cpus = os.cpus() || [];
  const totals = cpus.reduce((acc, cpu) => {
    const times = cpu.times || {};
    acc.idle += Number(times.idle || 0);
    acc.total += Object.values(times).reduce((sum, value) => sum + Number(value || 0), 0);
    return acc;
  }, { idle: 0, total: 0 });
  return { ...totals, at: Date.now() };
}

async function networkBytesSnapshot() {
  if (process.platform !== 'win32') return { rx: 0, tx: 0, at: Date.now() };
  const script = "Get-NetAdapterStatistics | Select-Object -Property ReceivedBytes,SentBytes | ConvertTo-Json -Compress";
  const text = await new Promise((resolve) => {
    execFile('powershell.exe', ['-NoProfile', '-Command', script], { windowsHide: true, timeout: 2200 }, (error, stdout) => {
      resolve(error ? '' : String(stdout || ''));
    });
  });
  try {
    const raw = JSON.parse(text || '[]');
    const rows = Array.isArray(raw) ? raw : [raw];
    return rows.reduce((acc, row) => {
      acc.rx += Number(row?.ReceivedBytes || 0);
      acc.tx += Number(row?.SentBytes || 0);
      return acc;
    }, { rx: 0, tx: 0, at: Date.now() });
  } catch {
    return { rx: 0, tx: 0, at: Date.now() };
  }
}

async function systemMetrics() {
  const now = Date.now();
  if (systemMetricsCache.value && now - systemMetricsCache.at < 1200) return systemMetricsCache.value;
  const currentCpu = cpuTimesSnapshot();
  const previousCpu = cpuSample;
  cpuSample = currentCpu;
  const cpuDelta = previousCpu ? Math.max(1, currentCpu.total - previousCpu.total) : 1;
  const cpuIdleDelta = previousCpu ? Math.max(0, currentCpu.idle - previousCpu.idle) : 0;
  const cpuPercent = previousCpu ? Math.max(0, Math.min(100, (1 - cpuIdleDelta / cpuDelta) * 100)) : 0;
  const currentNet = await networkBytesSnapshot();
  const previousNet = networkSample;
  networkSample = currentNet;
  const seconds = previousNet ? Math.max(.25, (currentNet.at - previousNet.at) / 1000) : 1;
  const value = {
    ok: true,
    at: now,
    cpuPercent,
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: Math.max(0, os.totalmem() - os.freemem()),
      percent: Math.max(0, Math.min(100, (1 - os.freemem() / Math.max(1, os.totalmem())) * 100))
    },
    network: {
      rxPerSec: previousNet ? Math.max(0, (currentNet.rx - previousNet.rx) / seconds) : 0,
      txPerSec: previousNet ? Math.max(0, (currentNet.tx - previousNet.tx) / seconds) : 0
    }
  };
  systemMetricsCache = { at: now, value };
  return value;
}

function isProjectDirectory(dirPath) {
  const markers = ['package.json', '.git', 'Cargo.toml', 'pyproject.toml', 'requirements.txt', 'go.mod', '*.sln'];
  try {
    const names = fs.readdirSync(dirPath, { withFileTypes: true }).map((entry) => entry.name.toLowerCase());
    return markers.some((marker) => marker === '*.sln'
      ? names.some((name) => name.endsWith('.sln'))
      : names.includes(marker.toLowerCase()));
  } catch {
    return false;
  }
}

function classifyItem(fullPath, dirent) {
  if (dirent.isDirectory()) return isProjectDirectory(fullPath) ? 'projects' : 'folders';
  const ext = path.extname(dirent.name).toLowerCase();
  return GROUPS.find((group) => group.extensions.includes(ext))?.id || 'other';
}

async function directoryChildSummary(fullPath, dirent) {
  if (!dirent.isDirectory()) return { childCount: 0, childPreview: [] };
  try {
    const entries = await fsp.readdir(fullPath, { withFileTypes: true });
    const visible = entries.filter((entry) => !entry.name.startsWith('desktop.ini') && !entry.name.startsWith('.'));
    return {
      childCount: visible.length,
      childPreview: visible.slice(0, 4).map((entry) => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        extension: path.extname(entry.name).slice(1).toUpperCase()
      }))
    };
  } catch {
    return { childCount: 0, childPreview: [] };
  }
}

async function readDesktopItems() {
  const roots = [app.getPath('desktop')];
  const publicDesktop = path.join(process.env.PUBLIC || 'C:\\Users\\Public', 'Desktop');
  if (!roots.includes(publicDesktop)) roots.push(publicDesktop);
  const seen = new Set();
  const items = [];
  for (const root of roots) {
    let entries = [];
    try { entries = await fsp.readdir(root, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      if (entry.name.startsWith('desktop.ini')) continue;
      const fullPath = path.join(root, entry.name);
      const key = fullPath.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      let stat;
      try { stat = await fsp.stat(fullPath); } catch { continue; }
      const childSummary = await directoryChildSummary(fullPath, entry);
      items.push({
        id: Buffer.from(fullPath).toString('base64url'),
        name: entry.name.replace(/\.lnk$/i, ''),
        rawName: entry.name,
        path: fullPath,
        kind: classifyItem(fullPath, entry),
        isDirectory: entry.isDirectory(),
        extension: path.extname(entry.name).slice(1).toUpperCase(),
        modifiedAt: stat.mtimeMs,
        size: stat.size,
        childCount: childSummary.childCount,
        childPreview: childSummary.childPreview
      });
    }
  }
  return { roots, groups: GROUPS, items };
}

async function listDirectory(targetPath) {
  const resolved = path.resolve(String(targetPath || app.getPath('desktop')));
  const entries = await fsp.readdir(resolved, { withFileTypes: true });
  const items = await Promise.all(entries.slice(0, 180).map(async (entry) => {
    const fullPath = path.join(resolved, entry.name);
    let stat = null;
    try { stat = await fsp.stat(fullPath); } catch {}
    const childSummary = await directoryChildSummary(fullPath, entry);
    return {
      id: Buffer.from(fullPath).toString('base64url'),
      name: entry.name,
      path: fullPath,
      isDirectory: entry.isDirectory(),
      extension: path.extname(entry.name).slice(1).toUpperCase(),
      size: stat?.size || 0,
      modifiedAt: stat?.mtimeMs || 0,
      childCount: childSummary.childCount,
      childPreview: childSummary.childPreview
    };
  }));
  return { path: resolved, parent: path.dirname(resolved), items };
}

function sanitizeCreatedFileName(input) {
  const cleaned = String(input || '').trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '').replace(/[. ]+$/g, '');
  return cleaned || '新建文件.txt';
}

async function chooseDirectory(defaultPath) {
  const fallback = app.getPath('desktop');
  const resolvedDefault = path.resolve(String(defaultPath || fallback));
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择新建文件位置',
    defaultPath: resolvedDefault,
    properties: ['openDirectory', 'createDirectory']
  });
  if (result.canceled || !result.filePaths[0]) return { ok: false, canceled: true };
  return { ok: true, path: result.filePaths[0] };
}

async function createFileFromRenderer(payload) {
  const fallback = app.getPath('desktop');
  const directory = path.resolve(String(payload?.directory || fallback));
  const fileName = sanitizeCreatedFileName(payload?.name);
  const target = path.join(directory, fileName);
  const relative = path.relative(directory, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    return { ok: false, error: 'INVALID_FILE_NAME' };
  }
  await fsp.mkdir(directory, { recursive: true });
  try {
    const handle = await fsp.open(target, 'wx');
    await handle.close();
  } catch (error) {
    if (error?.code === 'EEXIST') return { ok: false, error: 'FILE_EXISTS', path: target };
    throw error;
  }
  let stat = null;
  try { stat = await fsp.stat(target); } catch {}
  return {
    ok: true,
    item: {
      id: Buffer.from(target).toString('base64url'),
      name: fileName,
      rawName: fileName,
      path: target,
      kind: classifyItem(target, { isDirectory: () => false }),
      isDirectory: false,
      extension: path.extname(fileName).slice(1).toUpperCase(),
      modifiedAt: stat?.mtimeMs || Date.now(),
      size: stat?.size || 0,
      childCount: 0,
      childPreview: []
    }
  };
}

async function listComputerRoots() {
  const candidates = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => `${letter}:\\`);
  const items = [];
  for (const drivePath of candidates) {
    try {
      await fsp.access(drivePath, fs.constants.R_OK);
      let stat = null;
      try { stat = await fsp.stat(drivePath); } catch {}
      items.push({
        id: Buffer.from(drivePath).toString('base64url'),
        name: drivePath,
        path: drivePath,
        kind: 'folders',
        isDirectory: true,
        extension: 'DRIVE',
        size: 0,
        modifiedAt: stat?.mtimeMs || Date.now()
      });
    } catch {}
  }
  return { path: '此电脑', parent: '', items };
}

function createWindow() {
  const display = screen.getPrimaryDisplay();
  const bounds = display.bounds;
  mainWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    thickFrame: false,
    fullscreenable: false,
    roundedCorners: false,
    hasShadow: false,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    useContentSize: false,
    backgroundColor: '#06080b',
    title: 'TCdesktop',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false
    }
  });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setBounds(bounds, false);
  mainWindow.setContentBounds(bounds);
  if (SMOKE_TEST) {
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.setOpacity(0);
      mainWindow.showInactive();
      setTimeout(async () => {
        try {
          await mainWindow.webContents.executeJavaScript(`(() => { const drawer = document.querySelector('#styleDrawer'); if (drawer) drawer.scrollTop = 0; const grid = document.querySelector('#wallpaperGrid'); if (grid) grid.scrollTop = grid.scrollHeight; })()`);
          await new Promise((resolve) => setTimeout(resolve, 500));
          const status = await mainWindow.webContents.executeJavaScript(`({
            body: document.body.className,
            wallpaper: window.__orbitWallpaperStatus || null,
            wallpaperCanvas: [document.querySelector('#wallpaper3d')?.width || 0, document.querySelector('#wallpaper3d')?.height || 0],
            shelfCanvas: [document.querySelector('#shelf3d')?.width || 0, document.querySelector('#shelf3d')?.height || 0],
            video: { readyState: document.querySelector('#wallpaperVideo')?.readyState || 0, width: document.querySelector('#wallpaperVideo')?.videoWidth || 0, height: document.querySelector('#wallpaperVideo')?.videoHeight || 0 },
            wallpaperLibrary: {
              cards: document.querySelectorAll('#wallpaperGrid .wallpaper-card').length,
              videos: document.querySelectorAll('#wallpaperGrid video').length,
              loadedImages: document.querySelectorAll('#wallpaperGrid img.loaded').length,
              title: document.querySelector('#wallpaperLibraryTitle')?.textContent || ''
            },
            particlePlacement: typeof wallpaperParticles !== 'undefined' ? wallpaperParticles?.getPlacementStatus?.() || null : null,
            particleControls: {
              picker: !!document.querySelector('#pickParticlePosition'),
              reset: !!document.querySelector('#resetParticlePosition'),
              clearRegion: !!document.querySelector('#clearParticleRegion'),
              status: document.querySelector('#particlePositionState')?.textContent || ''
            },
            toast: document.querySelector('#toast')?.textContent || ''
          })`);
          const buttonInteractionTest = await mainWindow.webContents.executeJavaScript(`(() => {
            const consoleButton = document.querySelector('#consoleButton');
            const command = document.querySelector('#commandPalette');
            consoleButton?.click();
            const consoleOpened = command?.hidden === false;
            document.querySelector('#closeCommandPalette')?.click();
            const consoleClosedByButton = command?.hidden === true;
            consoleButton?.click();
            document.querySelector('#commandInput')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            const consoleClosedByEscape = command?.hidden === true;
            document.querySelector('#pickThumbnailRegion')?.click();
            const region = document.querySelector('#regionPicker');
            const regionOpened = region?.hidden === false;
            document.querySelector('#cancelThumbnailRegion')?.click();
            const regionClosedByButton = region?.hidden === true;
            document.querySelector('#pickThumbnailRegion')?.click();
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            const regionClosedByEscape = region?.hidden === true;
            setStyleDrawerOpen(true);
            return { ok: consoleOpened && consoleClosedByButton && consoleClosedByEscape && regionOpened && regionClosedByButton && regionClosedByEscape, consoleOpened, consoleClosedByButton, consoleClosedByEscape, regionOpened, regionClosedByButton, regionClosedByEscape };
          })()`);
          let nativeKeyboardFocusTest = { ok: true, skipped: true };
          if (SMOKE_EMBEDDED) {
            await mainWindow.webContents.executeJavaScript(`(() => { togglePalette(true); const input = document.querySelector('#commandInput'); if (input) { input.value = ''; input.focus(); } })()`);
            await new Promise((resolve) => setTimeout(resolve, 120));
            const paletteFocus = desktopRuntime.requestKeyboardFocus('orbitdesk-embedded-smoke-palette');
            mainWindow.webContents.sendInputEvent({ type: 'char', keyCode: 'x' });
            await new Promise((resolve) => setTimeout(resolve, 80));
            const typedValue = await mainWindow.webContents.executeJavaScript(`document.querySelector('#commandInput')?.value || ''`);
            mainWindow.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
            mainWindow.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
            await new Promise((resolve) => setTimeout(resolve, 80));
            const paletteClosed = await mainWindow.webContents.executeJavaScript(`document.querySelector('#commandPalette')?.hidden === true`);
            await mainWindow.webContents.executeJavaScript(`document.querySelector('#pickThumbnailRegion')?.click()`);
            await new Promise((resolve) => setTimeout(resolve, 80));
            const pickerFocus = desktopRuntime.requestKeyboardFocus('orbitdesk-embedded-smoke-picker');
            mainWindow.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
            mainWindow.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
            await new Promise((resolve) => setTimeout(resolve, 80));
            const pickerClosed = await mainWindow.webContents.executeJavaScript(`document.querySelector('#regionPicker')?.hidden === true`);
            nativeKeyboardFocusTest = { ok: paletteFocus?.ok === true && paletteFocus?.focused !== false && typedValue === 'x' && paletteClosed && pickerFocus?.ok === true && pickerFocus?.focused !== false && pickerClosed, skipped: false, paletteFocus: { ok: paletteFocus?.ok === true, focused: paletteFocus?.focused !== false, error: paletteFocus?.error || '' }, typedValue, paletteClosed, pickerFocus: { ok: pickerFocus?.ok === true, focused: pickerFocus?.focused !== false, error: pickerFocus?.error || '' }, pickerClosed };
          }
          const particleControlStressTest = await mainWindow.webContents.executeJavaScript(`(async () => {
            if (typeof wallpaperParticles === 'undefined' || !wallpaperParticles) return { ok: false, error: 'NO_PARTICLE_STAGE' };
            const originalStage = wallpaperParticles;
            const snapshot = { flow: state.flow, mode: state.wallpaperParticleMode, enabled: state.thumbnailEnabled };
            const flowButtons = [...document.querySelectorAll('[data-flow]')];
            const modeButtons = [...document.querySelectorAll('[data-particle-mode]')];
            const enableButton = document.querySelector('[data-thumbnail-enabled="true"]');
            const disableButton = document.querySelector('[data-thumbnail-enabled="false"]');
            const sourceGenerationBefore = Number(originalStage.sourceGeneration || 0);
            for (let index = 0; index < 30; index += 1) {
              flowButtons[index % Math.max(1, flowButtons.length)]?.click();
              modeButtons[index % Math.max(1, modeButtons.length)]?.click();
              if (index % 5 === 0) { disableButton?.click(); enableButton?.click(); }
            }
            state.flow = snapshot.flow;
            state.wallpaperParticleMode = snapshot.mode;
            setParticleLayerEnabled(snapshot.enabled, { reloadSource: snapshot.enabled });
            wallpaperParticles?.setFlow?.(snapshot.flow);
            wallpaperParticles?.setParticleMode?.(snapshot.mode);
            syncControls();
            await saveSettings();
            await new Promise((resolve) => setTimeout(resolve, 350));
            const saved = await api.settings.load();
            const canvas = document.querySelector('#wallpaper3d');
            const contextLost = !!(wallpaperParticles?.contextLost || wallpaperParticles?.renderer?.getContext?.().isContextLost?.());
            const sourceGenerationAfter = Number(wallpaperParticles?.sourceGeneration || 0);
            const buttonsResponsive = !document.querySelector('[data-flow]:disabled,[data-particle-mode]:disabled,[data-thumbnail-enabled]:disabled');
            const sameStage = wallpaperParticles === originalStage;
            const persistedLatest = saved?.flow === snapshot.flow && saved?.wallpaperParticleMode === snapshot.mode && saved?.thumbnailEnabled === snapshot.enabled;
            return {
              ok: sameStage && !contextLost && buttonsResponsive && persistedLatest && (!snapshot.enabled || ((canvas?.width || 0) > 1 && (canvas?.height || 0) > 1)),
              sameStage, contextLost, buttonsResponsive, persistedLatest,
              sourceGenerationBefore, sourceGenerationAfter,
              canvas: [canvas?.width || 0, canvas?.height || 0]
            };
          })()`);
          const processMemory = typeof process.getProcessMemoryInfo === 'function'
            ? await process.getProcessMemoryInfo().catch(() => null)
            : null;
          const appProcesses = app.getAppMetrics().map((metric) => ({
            type: metric.type,
            memory: metric.memory
          }));
          const image = await mainWindow.webContents.capturePage();
          const smokeBitmap = image.toBitmap();
          let sampledPixels = 0;
          let nearWhitePixels = 0;
          for (let offset = 0; offset + 3 < smokeBitmap.length; offset += 64) {
            sampledPixels += 1;
            if (smokeBitmap[offset] > 245 && smokeBitmap[offset + 1] > 245 && smokeBitmap[offset + 2] > 245) nearWhitePixels += 1;
          }
          particleControlStressTest.nearWhiteRatio = sampledPixels ? nearWhitePixels / sampledPixels : 0;
          particleControlStressTest.ok = particleControlStressTest.ok && particleControlStressTest.nearWhiteRatio < .6;
          await fsp.writeFile(path.join(__dirname, 'preview-smoke.png'), image.toPNG());
          await mainWindow.webContents.executeJavaScript(`(() => { const drawer = document.querySelector('#styleDrawer'); if (drawer) drawer.scrollTop = drawer.scrollHeight; })()`);
          await new Promise((resolve) => setTimeout(resolve, 300));
          const placementImage = await mainWindow.webContents.capturePage();
          await fsp.writeFile(path.join(__dirname, 'preview-particle-position.png'), placementImage.toPNG());
          await mainWindow.webContents.executeJavaScript(`document.querySelector('#pickParticlePosition')?.click()`);
          await new Promise((resolve) => setTimeout(resolve, 250));
          const particlePickerOpen = await mainWindow.webContents.executeJavaScript(`({ hidden: document.querySelector('#particlePositionPicker')?.hidden, body: document.body.className, active: typeof activeParticlePositionPicker !== 'undefined' && !!activeParticlePositionPicker, display: getComputedStyle(document.querySelector('#particlePositionPicker')).display })`);
          const pickerImage = await mainWindow.webContents.capturePage();
          await fsp.writeFile(path.join(__dirname, 'preview-particle-picker.png'), pickerImage.toPNG());
          await mainWindow.webContents.executeJavaScript(`document.querySelector('#cancelParticlePosition')?.click()`);
          const particlePickerClosed = await mainWindow.webContents.executeJavaScript(`document.querySelector('#particlePositionPicker')?.hidden === true && !document.body.classList.contains('particle-position-picking')`);
          const particlePlacementTest = await mainWindow.webContents.executeJavaScript(`(() => {
            if (typeof wallpaperParticles === 'undefined' || !wallpaperParticles) return { ok: false, error: 'NO_PARTICLE_STAGE' };
            const stage = wallpaperParticles;
            const snapshot = { mode: stage.particleMode, region: stage.thumbnailRegion ? { ...stage.thumbnailRegion } : null, position: { x: stage.thumbnailPosition.x, y: stage.thumbnailPosition.y }, enabled: stage.thumbnailEnabled };
            stage.setParticleMode('edge');
            stage.setThumbnailRegion({ x: .1, y: .2, w: .3, h: .4, shape: 'rect' });
            stage.setThumbnailPosition(80, 70, true, true);
            const custom = stage.getPlacementStatus();
            const buildsBeforeDrag = custom.geometryBuildCount;
            for (let index = 0; index < 200; index += 1) stage.setThumbnailPosition(index % 101, (index * 7) % 101, true, true);
            const buildsAfterDrag = stage.getPlacementStatus().geometryBuildCount;
            const anchor = stage.sourceAnchor();
            stage.resetPosition(anchor.x, anchor.y);
            const reset = stage.getPlacementStatus();
            stage.setParticleMode(snapshot.mode);
            stage.setThumbnailRegion(snapshot.region);
            stage.setThumbnailPosition(snapshot.position.x, snapshot.position.y, snapshot.enabled, true);
            return { ok: custom.statePercent.x === 80 && custom.statePercent.y === 70 && reset.alignedToSource && reset.settleErrorPx < .1 && buildsBeforeDrag === buildsAfterDrag, custom, reset, buildsBeforeDrag, buildsAfterDrag };
          })()`);
          const captureSources = await getCaptureSources({ width: 1, height: 1 });
          preferredCaptureSourceId = captureSources.find((source) => String(source.id).startsWith('screen:'))?.id || '';
          const wallpaperCaptureTest = await mainWindow.webContents.executeJavaScript(`(async () => {
            if (typeof wallpaperParticles === 'undefined' || !wallpaperParticles || typeof activeBackgroundSource === 'undefined') return { ok: false, error: 'NO_PARTICLE_STAGE' };
            const original = activeBackgroundSource;
            wallpaperParticles.setSource({ ok: true, kind: 'capture', captureMode: 'stream', source: 'smoke-capture' });
            const deadline = Date.now() + 5000;
            let streamStatus = { ...(window.__orbitWallpaperStatus || {}) };
            while (Date.now() < deadline && !(streamStatus.kind === 'capture' && streamStatus.active && streamStatus.width >= 1280 && streamStatus.height >= 720)) {
              await new Promise((resolve) => setTimeout(resolve, 250));
              streamStatus = { ...(window.__orbitWallpaperStatus || {}) };
            }
            wallpaperParticles.setSource(original, original?.kind === 'video' ? document.querySelector('#wallpaperVideo') : null);
            await new Promise((resolve) => setTimeout(resolve, 350));
            return { ok: streamStatus.kind === 'capture' && streamStatus.active === true && streamStatus.width >= 1280 && streamStatus.height >= 720, streamStatus, restored: { ...(window.__orbitWallpaperStatus || {}) } };
          })()`);
          preferredCaptureSourceId = '';
          await mainWindow.webContents.executeJavaScript(`(() => {
            document.body.classList.remove('peek-right', 'ui-pinned');
            document.querySelector('#closeStyle')?.click();
            window.__smokeShelfClose = typeof spatialShelf !== 'undefined';
            if (window.__smokeShelfClose) spatialShelf?.setReveal?.(false);
            document.dispatchEvent(new PointerEvent('pointermove', { clientX: 1, clientY: 1, bubbles: true }));
          })()`);
          await new Promise((resolve) => setTimeout(resolve, 2200));
          const afterClose = await mainWindow.webContents.executeJavaScript(`({
            settingsOpen: document.body.classList.contains('settings-open'),
            shelfVisible: document.querySelector('#shelf3d')?.classList.contains('visible') || false,
            shelfCanvas: [document.querySelector('#shelf3d')?.width || 0, document.querySelector('#shelf3d')?.height || 0],
            shelfCloseReached: window.__smokeShelfClose || false,
            shelfState: typeof spatialShelf !== 'undefined' && spatialShelf ? { reveal: spatialShelf.reveal, target: spatialShelf.revealTarget, compacted: spatialShelf.compacted } : null,
            loadedWallpaperThumbnails: document.querySelectorAll('#wallpaperGrid img.loaded').length
          })`);
          afterClose.processMemory = typeof process.getProcessMemoryInfo === 'function'
            ? await process.getProcessMemoryInfo().catch(() => null)
            : null;
          afterClose.appProcesses = app.getAppMetrics().map((metric) => ({
            type: metric.type,
            memory: metric.memory
          }));
          await fsp.writeFile(path.join(__dirname, 'smoke-status.json'), JSON.stringify({ ...status, buttonInteractionTest, nativeKeyboardFocusTest, particleControlStressTest, particlePickerTest: { ok: particlePickerOpen.hidden === false && particlePickerOpen.active && particlePickerOpen.display !== 'none' && particlePickerClosed, open: particlePickerOpen, closed: particlePickerClosed }, particlePlacementTest, wallpaperCaptureTest, processMemory, appProcesses, afterClose }, null, 2), 'utf8');
        } catch (error) {
          await fsp.writeFile(path.join(__dirname, 'smoke-status.json'), JSON.stringify({ error: error.message || String(error) }, null, 2), 'utf8').catch(() => null);
        } finally {
          quitting = true;
          if (SMOKE_EMBEDDED && desktopRuntime?.getStatus?.('embedded-smoke-exit')?.enabled) {
            try { await desktopRuntime.disable('embedded-smoke-exit'); } catch {}
          }
          mainWindow?.hide();
          app.quit();
        }
      }, 6500);
    });
  }
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'), SMOKE_TEST
    ? { query: { ...(SMOKE_SHOW_SHELF ? { showShelf: '1' } : {}), ...(SMOKE_SHOW_SETTINGS ? { showSettings: '1' } : {}) } }
    : undefined);
  mainWindow.once('ready-to-show', async () => {
    if (SMOKE_TEST && !SMOKE_EMBEDDED) return;
    mainWindow.setBounds(bounds, false);
    mainWindow.setContentBounds(bounds);
    mainWindow.show();
    try {
      const result = await desktopRuntime.enable(mainWindow, { interactive: true, reason: 'orbitdesk-startup' });
      mainWindow.setBounds(bounds, false);
      mainWindow.setContentBounds(bounds);
      if (result && result.ok && !SMOKE_TEST) await desktopRuntime.setDesktopIconsVisible(false, 'orbitdesk-replaces-icons');
      mainWindow.webContents.send('desktop:mode-status', desktopRuntime.getStatus('startup-settled'));
    } catch (error) {
      mainWindow.setBounds(bounds, false);
      mainWindow.setContentBounds(bounds);
      mainWindow.show();
      mainWindow.webContents.send('desktop:mode-status', { ok: false, enabled: false, error: error.message });
    }
  });
  mainWindow.on('close', (event) => {
    if (quitting) return;
    event.preventDefault();
    requestExit();
  });
  mainWindow.on('minimize', (event) => {
    if (quitting || !desktopRuntime?.getStatus?.('minimize-guard')?.enabled) return;
    if (Date.now() < suppressShowDesktopHideUntil) return;
    event.preventDefault();
    scheduleDesktopSurfaceRestore('window-minimize');
  });
  mainWindow.on('hide', () => {
    if (quitting || !desktopRuntime?.getStatus?.('hide-guard')?.enabled) return;
    if (Date.now() < suppressShowDesktopHideUntil) return;
    scheduleDesktopSurfaceRestore('window-hide');
  });
  mainWindow.webContents.on('render-process-gone', () => requestExit());
}

function scheduleDesktopSurfaceRestore(reason = 'show-desktop', options = {}) {
  if (quitting || !mainWindow || mainWindow.isDestroyed?.()) return;
  const now = Date.now();
  const fromWinD = reason === 'win-d';
  if (fromWinD) suppressShowDesktopHideUntil = now + 1600;
  if (!fromWinD && !options.forceReconcile && now - lastDesktopSurfaceRestoreAt < 900) return;
  lastDesktopSurfaceRestoreAt = now;
  if (!desktopRuntime?.getStatus?.(`${reason}-status`)?.enabled) return;
  const restore = async (phase) => {
    if (quitting || !mainWindow || mainWindow.isDestroyed?.()) return;
    if (desktopSurfaceRestoreInFlight) return;
    desktopSurfaceRestoreInFlight = true;
    const status = desktopRuntime?.getStatus?.(`${reason}-${phase}-before`);
    try {
      const bounds = screen.getPrimaryDisplay().bounds;
      if (mainWindow.isMinimized?.()) mainWindow.restore();
      mainWindow.setBounds(bounds, false);
      mainWindow.setContentBounds(bounds);
      mainWindow.showInactive();
      const result = options.forceReconcile || !status?.enabled
        ? await desktopRuntime.reconcile(`${reason}-${phase}`)
        : { ok: true, status };
      mainWindow.setBounds(bounds, false);
      mainWindow.setContentBounds(bounds);
      mainWindow.showInactive();
      mainWindow.webContents?.send?.('desktop:mode-status', result?.status || desktopRuntime.getStatus(`${reason}-${phase}-after`));
    } catch (error) {
      mainWindow.webContents?.send?.('desktop:mode-status', { ok: false, enabled: false, error: error?.message || String(error), reason });
    } finally {
      desktopSurfaceRestoreInFlight = false;
    }
  };
  clearTimeout(desktopSurfaceRestoreTimer);
  clearTimeout(desktopSurfaceRestoreFollowupTimer);
  desktopSurfaceRestoreTimer = setTimeout(() => { void restore('primary'); }, fromWinD ? 80 : 120);
  if (options.forceReconcile) desktopSurfaceRestoreFollowupTimer = setTimeout(() => { void restore('followup'); }, 700);
}

async function requestExit() {
  if (quitting) return;
  if (exitInFlight) return exitInFlight;
  exitInFlight = (async () => {
    try {
      if (desktopRuntime) {
        await desktopRuntime.setDesktopIconsVisible(true, 'orbitdesk-exit-restore-icons').catch((error) => {
          console.warn('[OrbitDesk] Desktop icon runtime restore failed:', error && error.message || error);
        });
        await desktopRuntime.disable('orbitdesk-exit').catch((error) => {
          console.warn('[OrbitDesk] Desktop runtime disable failed:', error && error.message || error);
        });
      }
      await forceWindowsDesktopIconsVisible('orbitdesk-exit');
    } finally {
      quitting = true;
      app.quit();
    }
  })();
  return exitInFlight;
}

function runDetached(file, args = []) {
  try {
    const child = execFile(file, args, { windowsHide: true, timeout: 2500 }, () => {});
    child.unref?.();
  } catch {}
}

async function forceWindowsDesktopIconsVisible(reason = 'restore') {
  if (process.platform !== 'win32') return { ok: false, skipped: true };
  const script = `
$ErrorActionPreference = 'SilentlyContinue'
Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced' -Name 'HideIcons' -Type DWord -Value 0
$sig = @'
using System;
using System.Runtime.InteropServices;
public static class ODDesk {
  [DllImport("user32.dll", SetLastError=true)] public static extern IntPtr FindWindow(string cls, string name);
  [DllImport("user32.dll", SetLastError=true)] public static extern IntPtr FindWindowEx(IntPtr parent, IntPtr child, string cls, string name);
  [DllImport("user32.dll", SetLastError=true)] public static extern bool ShowWindow(IntPtr hwnd, int cmd);
  [DllImport("user32.dll", SetLastError=true)] public static extern bool RedrawWindow(IntPtr hwnd, IntPtr rc, IntPtr region, uint flags);
  [DllImport("shell32.dll")] public static extern void SHChangeNotify(int eventId, uint flags, IntPtr item1, IntPtr item2);
}
'@
Add-Type -TypeDefinition $sig
function Show-List($parent) {
  $def = [ODDesk]::FindWindowEx($parent, [IntPtr]::Zero, 'SHELLDLL_DefView', $null)
  if ($def -ne [IntPtr]::Zero) {
    $list = [ODDesk]::FindWindowEx($def, [IntPtr]::Zero, 'SysListView32', $null)
    if ($list -ne [IntPtr]::Zero) {
      [ODDesk]::ShowWindow($list, 5) | Out-Null
      [ODDesk]::RedrawWindow($list, [IntPtr]::Zero, [IntPtr]::Zero, 0x0400 -bor 0x0100 -bor 0x0001 -bor 0x0080) | Out-Null
    }
  }
}
$progman = [ODDesk]::FindWindow('Progman', $null)
Show-List $progman
$worker = [IntPtr]::Zero
do {
  $worker = [ODDesk]::FindWindowEx([IntPtr]::Zero, $worker, 'WorkerW', $null)
  if ($worker -ne [IntPtr]::Zero) { Show-List $worker }
} while ($worker -ne [IntPtr]::Zero)
[ODDesk]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)
`;
  await new Promise((resolve) => {
    execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], { windowsHide: true, timeout: 3500 }, (error) => {
      if (error) console.warn(`[OrbitDesk] Forced desktop icon refresh failed (${reason}):`, error.message);
      resolve();
    });
  });
  runDetached('ie4uinit.exe', ['-show']);
  runDetached('rundll32.exe', ['user32.dll,UpdatePerUserSystemParameters']);
  return { ok: true };
}

function createTray() {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" rx="9" fill="#10181d"/><circle cx="16" cy="16" r="7" fill="none" stroke="#9fe9ef" stroke-width="2"/><ellipse cx="16" cy="16" rx="14" ry="5" fill="none" stroke="#9fe9ef"/></svg>';
  tray = new Tray(nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`));
  tray.setToolTip('TCdesktop 桌面层');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '显示 TCdesktop', click: () => mainWindow?.showInactive() },
    { label: '重新嵌入桌面', click: () => desktopRuntime?.reconcile('tray-reconcile') },
    { type: 'separator' },
    { label: '恢复 Windows 桌面并退出', click: requestExit }
  ]));
}

async function currentWallpaper() {
  const wallpaperEngine = await currentWallpaperEngineSource();
  if (wallpaperEngine?.ok) return wallpaperEngine;
  const libraryWallpaper = await fallbackLibraryWallpaper();
  if (libraryWallpaper?.ok) return libraryWallpaper;
  const fallback = path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Themes', 'TranscodedWallpaper');
  const registryPath = await new Promise((resolve) => {
    execFile('reg.exe', ['query', 'HKCU\\Control Panel\\Desktop', '/v', 'WallPaper'], { windowsHide: true, timeout: 3000 }, (error, stdout) => {
      if (error) return resolve('');
      const match = String(stdout).match(/WallPaper\s+REG_SZ\s+(.+)$/im);
      resolve(match ? match[1].trim() : '');
    });
  });
  const selected = registryPath && fs.existsSync(registryPath) ? registryPath : fallback;
  if (!fs.existsSync(selected)) return { ok: false, path: '', url: '' };
  return { ok: true, path: selected, url: pathToFileURL(selected).href, dataUrl: '', kind: 'image' };
}

async function isProcessRunning(name) {
  const cacheKey = String(name || '').toLowerCase();
  const cached = processStatusCache.get(cacheKey);
  if (cached && Date.now() - cached.checkedAt < 12000) return cached.running;
  const processName = path.basename(String(name || ''), path.extname(String(name || '')));
  const processId = await execText('powershell.exe', ['-NoProfile', '-Command', `(Get-Process -Name '${processName.replace(/'/g, "''")}' -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Id)`], 2500);
  if (processId) {
    processStatusCache.set(cacheKey, { running: true, checkedAt: Date.now() });
    return true;
  }
  const running = await new Promise((resolve) => {
    execFile('tasklist.exe', ['/FI', `IMAGENAME eq ${name}`], { windowsHide: true, timeout: 2500 }, (error, stdout) => {
      if (error) return resolve(false);
      resolve(String(stdout).toLowerCase().includes(String(name).toLowerCase()));
    });
  });
  processStatusCache.set(cacheKey, { running, checkedAt: Date.now() });
  return running;
}

async function neteaseLyricStatus() {
  const current = await currentMediaState();
  return Object.assign({
    ok: true,
    provider: current.provider || 'unknown',
    running: current.running,
    connected: !!current.title,
  }, current);
}

function cleanMediaTitle(value) {
  return String(value || '')
    .replace(/\?+/g, '')
    .replace(/\s*[-—–]\s*(网易云音乐|QQ音乐|酷狗音乐|酷我音乐|KuGou|Netease Cloud Music|CloudMusic)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseMediaTitle(rawTitle) {
  const title = cleanMediaTitle(rawTitle);
  if (!title || /^(网易云音乐|QQ音乐|酷狗音乐|酷我音乐|KuGou|CloudMusic|Netease Cloud Music)$/i.test(title)) return null;
  const separators = [' - ', ' — ', ' – ', ' -', '- ', '—', '–', '　-　'];
  for (const sep of separators) {
    if (!title.includes(sep)) continue;
    const parts = title.split(sep).map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) return { title: parts[0], artist: parts.slice(1).join(sep), rawTitle: title };
  }
  return { title, artist: '', rawTitle: title };
}

async function runningMediaProcesses() {
  const script = `[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; $OutputEncoding=[System.Text.Encoding]::UTF8; Get-Process | Where-Object { $_.ProcessName -match 'cloudmusic|qqmusic|kugou|kwmusic|foobar|spotify|music' } | Select-Object ProcessName,Id,MainWindowTitle,Path | ConvertTo-Json -Compress`;
  const output = await execText('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], 4000);
  if (!output) return [];
  try {
    const parsed = JSON.parse(output);
    return (Array.isArray(parsed) ? parsed : [parsed]).filter(Boolean);
  } catch {
    return [];
  }
}

function mediaProviderFromProcess(name) {
  const lower = String(name || '').toLowerCase();
  if (lower.includes('cloudmusic') || lower.includes('netease')) return 'netease';
  if (lower.includes('qqmusic')) return 'qqmusic';
  if (lower.includes('kugou')) return 'kugou';
  if (lower.includes('kwmusic')) return 'kuwo';
  if (lower.includes('spotify')) return 'spotify';
  return 'unknown';
}

function scoreNeteaseSong(song, title, artist) {
  const clean = (value) => String(value || '').toLowerCase().replace(/\s+/g, '');
  const targetTitle = clean(title);
  const targetArtist = clean(artist);
  const songTitle = clean(song.name);
  const artists = (song.ar || song.artists || []).map((entry) => clean(entry.name)).join('/');
  let score = 0;
  if (songTitle === targetTitle) score += 80;
  else if (songTitle.includes(targetTitle) || targetTitle.includes(songTitle)) score += 45;
  if (targetArtist && artists) {
    for (const part of targetArtist.split(/[\/,&、，]/).filter(Boolean)) {
      if (artists.includes(part)) score += 18;
    }
  }
  return score;
}

function parseLrcLines(text) {
  const lines = [];
  String(text || '').split(/\r?\n/).forEach((row) => {
    const matches = [...row.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g)];
    const textPart = row.replace(/\[[^\]]+\]/g, '').trim();
    matches.forEach((match) => {
      const ms = Number(match[1]) * 60000 + Number(match[2]) * 1000 + Number(String(match[3] || '0').padEnd(3, '0'));
      if (Number.isFinite(ms)) lines.push({ time: ms, text: textPart });
    });
  });
  return lines.sort((a, b) => a.time - b.time);
}

function normalizeRemoteImageUrl(value) {
  return String(value || '').replace(/^http:\/\//i, 'https://');
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(label || 'timeout')), ms))
  ]);
}

function safeCookieSummary(cookie) {
  const value = String(cookie || '');
  return {
    hasCookie: !!value,
    hasMusicU: /(?:^|;\s*)MUSIC_U=/.test(value),
    hasMusicA: /(?:^|;\s*)MUSIC_A=/.test(value),
    length: value.length
  };
}

async function readNeteaseAuth() {
  if (neteaseAuthCache) return neteaseAuthCache;
  try {
    const parsed = JSON.parse(await fsp.readFile(neteaseAuthPath(), 'utf8'));
    neteaseAuthCache = {
      cookie: String(parsed?.cookie || ''),
      profile: parsed?.profile || null,
      updatedAt: parsed?.updatedAt || ''
    };
  } catch {
    neteaseAuthCache = { cookie: '', profile: null, updatedAt: '' };
  }
  return neteaseAuthCache;
}

async function writeNeteaseAuth(next) {
  neteaseAuthCache = {
    cookie: String(next?.cookie || ''),
    profile: next?.profile || null,
    updatedAt: new Date().toISOString()
  };
  if (!neteaseAuthCache.cookie) {
    await fsp.rm(neteaseAuthPath(), { force: true }).catch(() => null);
    return neteaseAuthCache;
  }
  await fsp.writeFile(neteaseAuthPath(), JSON.stringify(neteaseAuthCache, null, 2), 'utf8');
  return neteaseAuthCache;
}

async function neteaseCookie() {
  return (await readNeteaseAuth()).cookie || '';
}

async function neteaseLoginState() {
  const auth = await readNeteaseAuth();
  const summary = safeCookieSummary(auth.cookie);
  let profile = auth.profile || null;
  if (neteaseApi && auth.cookie) {
    try {
      const account = await withTimeout(neteaseApi.user_account({ cookie: auth.cookie, timestamp: Date.now() }), 4500, 'NETEASE_ACCOUNT_TIMEOUT');
      profile = account?.body?.profile || account?.body?.account || profile;
      if (profile) await writeNeteaseAuth({ cookie: auth.cookie, profile });
    } catch {}
  }
  return { ok: true, loggedIn: summary.hasMusicU || summary.hasMusicA || !!profile, profile, cookie: summary };
}

async function neteaseQrCreate() {
  if (!neteaseApi) return { ok: false, error: 'NETEASE_API_UNAVAILABLE' };
  const keyResult = await withTimeout(neteaseApi.login_qr_key({ timestamp: Date.now(), noCookie: true }), 5000, 'NETEASE_QR_KEY_TIMEOUT');
  const key = keyResult?.body?.data?.unikey || keyResult?.body?.unikey;
  if (!key) return { ok: false, error: 'NO_QR_KEY' };
  const qr = await withTimeout(neteaseApi.login_qr_create({ key, qrimg: true, timestamp: Date.now(), noCookie: true }), 5000, 'NETEASE_QR_CREATE_TIMEOUT');
  return { ok: true, key, qrurl: qr?.body?.data?.qrurl || '', qrimg: qr?.body?.data?.qrimg || '' };
}

async function neteaseQrCheck(key) {
  if (!neteaseApi) return { ok: false, error: 'NETEASE_API_UNAVAILABLE' };
  const result = await withTimeout(neteaseApi.login_qr_check({ key: String(key || ''), timestamp: Date.now(), noCookie: true }), 5000, 'NETEASE_QR_CHECK_TIMEOUT');
  const body = result?.body || {};
  const cookie = body.cookie || (Array.isArray(result?.cookie) ? result.cookie.join(';') : '');
  if (body.code === 803 && cookie) {
    lyricMatchCache = { key: '', at: 0, value: null };
    await writeNeteaseAuth({ cookie, profile: null });
  }
  return { ok: true, code: body.code, message: body.message || '', loggedIn: body.code === 803, cookie: safeCookieSummary(cookie) };
}

async function neteaseLogout() {
  lyricMatchCache = { key: '', at: 0, value: null };
  await writeNeteaseAuth({ cookie: '', profile: null });
  return { ok: true };
}

async function matchNeteaseLyrics(title, artist) {
  const key = `${title}|${artist}`.toLowerCase();
  if (lyricMatchCache.key === key && lyricMatchCache.value && Date.now() - lyricMatchCache.at < 180000) return lyricMatchCache.value;
  if (!neteaseApi || !title) return null;
  const authCookie = await neteaseCookie();
  const requestBase = authCookie ? { cookie: authCookie } : {};
  const search = await withTimeout(neteaseApi.cloudsearch({ ...requestBase, keywords: `${title} ${artist || ''}`.trim(), type: 1, limit: 12, timestamp: Date.now() }), 5500, 'NETEASE_SEARCH_TIMEOUT');
  const songs = search?.body?.result?.songs || search?.body?.result?.songCount && search.body.result.songs || [];
  const best = songs.slice().sort((a, b) => scoreNeteaseSong(b, title, artist) - scoreNeteaseSong(a, title, artist))[0];
  if (!best || scoreNeteaseSong(best, title, artist) < 45) return null;
  let detailSong = best;
  try {
    const detail = await withTimeout(neteaseApi.song_detail({ ...requestBase, ids: String(best.id), timestamp: Date.now() }), 3500, 'NETEASE_DETAIL_TIMEOUT');
    detailSong = detail?.body?.songs?.[0] || best;
  } catch {}
  let lyricBody = {};
  try {
    if (typeof neteaseApi.lyric_new === 'function') lyricBody = (await withTimeout(neteaseApi.lyric_new({ ...requestBase, id: best.id, timestamp: Date.now() }), 4500, 'NETEASE_LYRIC_NEW_TIMEOUT'))?.body || {};
  } catch {}
  if (!lyricBody?.lrc?.lyric && !lyricBody?.yrc?.lyric) {
    try { lyricBody = Object.assign({}, lyricBody, (await withTimeout(neteaseApi.lyric({ ...requestBase, id: best.id, timestamp: Date.now() }), 4500, 'NETEASE_LYRIC_TIMEOUT'))?.body || {}); } catch {}
  }
  const result = {
    songId: String(best.id),
    matchedTitle: detailSong.name || best.name || title,
    matchedArtist: (detailSong.ar || best.ar || best.artists || []).map((entry) => entry.name).filter(Boolean).join('/'),
    album: detailSong.al?.name || best.al?.name || '',
    coverUrl: normalizeRemoteImageUrl(detailSong.al?.picUrl || best.al?.picUrl || best.album?.picUrl || ''),
    durationMs: Number(detailSong.dt || best.dt || best.duration || 0) || 0,
    lyric: lyricBody?.lrc?.lyric || '',
    tlyric: lyricBody?.tlyric?.lyric || '',
    yrc: lyricBody?.yrc?.lyric || '',
    ytlrc: lyricBody?.ytlrc?.lyric || '',
    lines: parseLrcLines(lyricBody?.lrc?.lyric || lyricBody?.yrc?.lyric || '')
  };
  lyricMatchCache = { key, at: Date.now(), value: result };
  return result;
}

async function neteasePlaylistList() {
  if (!neteaseApi) return { ok: false, error: 'NETEASE_API_UNAVAILABLE' };
  const login = await neteaseLoginState();
  const userId = login?.profile?.userId || login?.profile?.account?.id || login?.profile?.id;
  if (!login.loggedIn || !userId) {
    const cached = await readNeteaseLibraryCache();
    return cached.ok && cached.playlists.length
      ? { ok: true, loggedIn: false, fromCache: true, updatedAt: cached.updatedAt, profile: cached.profile, playlists: cached.playlists }
      : { ok: false, error: 'NETEASE_NOT_LOGGED_IN', loggedIn: false };
  }
  const authCookie = await neteaseCookie();
  const result = await withTimeout(neteaseApi.user_playlist({
    cookie: authCookie,
    uid: userId,
    limit: 50,
    offset: 0,
    timestamp: Date.now()
  }), 6500, 'NETEASE_PLAYLIST_TIMEOUT');
  const playlists = (result?.body?.playlist || []).map((entry) => ({
    id: String(entry.id || ''),
    name: String(entry.name || '未命名歌单'),
    trackCount: Number(entry.trackCount || 0),
    coverUrl: normalizeRemoteImageUrl(entry.coverImgUrl || ''),
    creator: entry.creator?.nickname || '',
    subscribed: entry.subscribed === true
  })).filter((entry) => entry.id);
  await mergeNeteaseLibraryCache({ profile: login.profile || null, playlists }).catch(() => null);
  return { ok: true, loggedIn: true, profile: login.profile || null, playlists };
}

async function neteasePlaylistTracks(playlistId, offset = 0, limit = 80) {
  if (!neteaseApi) return { ok: false, error: 'NETEASE_API_UNAVAILABLE' };
  const authCookie = await neteaseCookie();
  if (!authCookie) return { ok: false, error: 'NETEASE_NOT_LOGGED_IN', loggedIn: false };
  const result = await withTimeout(neteaseApi.playlist_track_all({
    cookie: authCookie,
    id: String(playlistId || ''),
    limit: Math.max(1, Math.min(200, Number(limit) || 80)),
    offset: Math.max(0, Number(offset) || 0),
    timestamp: Date.now()
  }), 7500, 'NETEASE_PLAYLIST_TRACKS_TIMEOUT');
  const songs = (result?.body?.songs || []).map((song) => ({
    id: String(song.id || ''),
    name: String(song.name || '未命名歌曲'),
    artists: (song.ar || song.artists || []).map((entry) => entry.name).filter(Boolean).join('/'),
    album: song.al?.name || song.album?.name || '',
    coverUrl: normalizeRemoteImageUrl(song.al?.picUrl || song.album?.picUrl || ''),
    durationMs: Number(song.dt || song.duration || 0) || 0,
    fee: song.fee,
    privilege: song.privilege || null
  })).filter((song) => song.id);
  await mergeNeteaseLibraryCache({ tracks: { [String(playlistId || '')]: songs } }).catch(() => null);
  return { ok: true, playlistId: String(playlistId || ''), offset: Number(offset) || 0, songs };
}

async function neteasePlaylistTracksCached(playlistId, offset = 0, limit = 80) {
  const cacheKey = String(playlistId || '');
  try {
    return await neteasePlaylistTracks(cacheKey, offset, limit);
  } catch (error) {
    const cached = await readNeteaseLibraryCache();
    const songs = Array.isArray(cached.tracks?.[cacheKey]) ? cached.tracks[cacheKey] : [];
    if (songs.length) return { ok: true, fromCache: true, staleError: error?.message || String(error), playlistId: cacheKey, offset: Number(offset) || 0, songs };
    return { ok: false, error: error?.message || String(error), playlistId: cacheKey, offset: Number(offset) || 0, songs: [] };
  }
}

async function neteaseSyncLibrary() {
  const playlistsResult = await neteasePlaylistList();
  if (!playlistsResult?.ok) return playlistsResult;
  const tracks = {};
  const playlists = (playlistsResult.playlists || []).slice(0, 50);
  for (const playlist of playlists) {
    const result = await neteasePlaylistTracksCached(playlist.id, 0, Math.min(300, Number(playlist.trackCount || 160) || 160));
    if (result?.ok) tracks[String(playlist.id)] = result.songs || [];
  }
  const saved = await mergeNeteaseLibraryCache({ profile: playlistsResult.profile || null, playlists, tracks });
  return { ok: true, loggedIn: playlistsResult.loggedIn !== false, fromCache: playlistsResult.fromCache === true, updatedAt: saved.updatedAt, profile: saved.profile, playlists: saved.playlists, trackPlaylistCount: Object.keys(saved.tracks || {}).length };
}

async function neteaseSongPlayableUrl(songId) {
  const authCookie = await neteaseCookie();
  const requestBase = authCookie ? { cookie: authCookie } : {};
  let body = {};
  try {
    if (typeof neteaseApi.song_url_v1 === 'function') {
      body = (await withTimeout(neteaseApi.song_url_v1({ ...requestBase, id: String(songId), level: 'exhigh', timestamp: Date.now() }), 5500, 'NETEASE_SONG_URL_V1_TIMEOUT'))?.body || {};
    }
  } catch {}
  const first = (body?.data || [])[0];
  if (first?.url) return { url: first.url, br: first.br || 0, level: first.level || '', type: first.type || '' };
  try {
    body = (await withTimeout(neteaseApi.song_url({ ...requestBase, id: String(songId), br: 320000, timestamp: Date.now() }), 5500, 'NETEASE_SONG_URL_TIMEOUT'))?.body || {};
  } catch {}
  const fallback = (body?.data || [])[0];
  return fallback?.url ? { url: fallback.url, br: fallback.br || 0, level: fallback.level || '', type: fallback.type || '' } : null;
}

async function neteasePlaySong(songPayload) {
  if (!neteaseApi) return { ok: false, error: 'NETEASE_API_UNAVAILABLE' };
  const song = typeof songPayload === 'object' && songPayload ? songPayload : { id: String(songPayload || '') };
  const songId = String(song.id || '');
  if (!songId) return { ok: false, error: 'NO_SONG_ID' };
  const playable = await neteaseSongPlayableUrl(songId);
  if (!playable?.url) return { ok: false, error: 'NO_PLAYABLE_URL', message: '这首歌暂时没有返回可播放链接，可能是版权/VIP/地区限制。' };
  let detailSong = null;
  try {
    const authCookie = await neteaseCookie();
    const detail = await withTimeout(neteaseApi.song_detail({ ...(authCookie ? { cookie: authCookie } : {}), ids: songId, timestamp: Date.now() }), 3500, 'NETEASE_DETAIL_TIMEOUT');
    detailSong = detail?.body?.songs?.[0] || null;
  } catch {}
  const mergedSong = {
    id: songId,
    name: detailSong?.name || song.name || '网易云歌曲',
    artists: (detailSong?.ar || []).map((entry) => entry.name).filter(Boolean).join('/') || song.artists || '',
    album: detailSong?.al?.name || song.album || '',
    coverUrl: normalizeRemoteImageUrl(detailSong?.al?.picUrl || song.coverUrl || ''),
    durationMs: Number(detailSong?.dt || song.durationMs || 0) || 0
  };
  const matched = await matchNeteaseLyrics(mergedSong.name, mergedSong.artists).catch(() => null);
  embeddedNeteaseState = {
    song: mergedSong,
    matched,
    startedAt: Date.now(),
    pausedAt: 0,
    playing: true,
    url: playable.url,
    updatedAt: Date.now()
  };
  lyricMatchCache = { key: `${mergedSong.name}|${mergedSong.artists}`.toLowerCase(), at: Date.now(), value: matched };
  return { ok: true, song: mergedSong, matched, playback: playable, url: playable.url };
}

function neteaseEmbeddedPositionMs() {
  if (!embeddedNeteaseState.song) return 0;
  if (!embeddedNeteaseState.playing) return embeddedNeteaseState.pausedAt || 0;
  return Math.max(0, Date.now() - embeddedNeteaseState.startedAt);
}

function setEmbeddedPlaybackPosition(positionMs) {
  const safe = Math.max(0, Number(positionMs) || 0);
  if (!embeddedNeteaseState.song) return;
  if (embeddedNeteaseState.playing) embeddedNeteaseState.startedAt = Date.now() - safe;
  else embeddedNeteaseState.pausedAt = safe;
  embeddedNeteaseState.updatedAt = Date.now();
}

async function currentMediaState() {
  if (embeddedNeteaseState.song) {
    const matched = embeddedNeteaseState.matched || {};
    const song = embeddedNeteaseState.song;
    const lines = matched.lines || [];
    return {
      ok: true,
      running: true,
      provider: 'netease',
      source: 'embedded',
      processName: 'TCdesktop',
      processId: process.pid,
      rawTitle: `${song.name}${song.artists ? ` - ${song.artists}` : ''}`,
      title: song.name || '',
      artist: song.artists || '',
      playing: embeddedNeteaseState.playing,
      positionMs: neteaseEmbeddedPositionMs(),
      durationMs: song.durationMs || matched.durationMs || 0,
      songId: song.id,
      matchedTitle: matched.matchedTitle || song.name || '',
      matchedArtist: matched.matchedArtist || song.artists || '',
      album: matched.album || song.album || '',
      coverUrl: song.coverUrl || matched.coverUrl || '',
      lines,
      lyric: matched.lyric || '',
      tlyric: matched.tlyric || '',
      yrc: matched.yrc || '',
      ytlrc: matched.ytlrc || '',
      line: lines[0]?.text || '内置播放器已载入',
      nextLine: lines[1]?.text || '',
      reason: 'TCdesktop 内置网易云播放器'
    };
  }
  const processes = await runningMediaProcesses();
  const candidate = processes.find((process) => parseMediaTitle(process.MainWindowTitle))
    || processes.find((process) => ['netease','qqmusic','kugou','kuwo','spotify'].includes(mediaProviderFromProcess(process.ProcessName)));
  const parsed = parseMediaTitle(candidate?.MainWindowTitle || '');
  const base = {
    running: !!candidate,
    provider: mediaProviderFromProcess(candidate?.ProcessName),
    processName: candidate?.ProcessName || '',
    processId: candidate?.Id || 0,
    rawTitle: candidate?.MainWindowTitle || '',
    title: parsed?.title || '',
    artist: parsed?.artist || '',
    playing: !!parsed,
    positionMs: 0,
    durationMs: 0,
    line: '',
    nextLine: '',
    coverUrl: '',
    reason: parsed ? '已通过播放器窗口标题识别当前歌曲' : (candidate ? '已检测到播放器，但未识别当前歌曲标题' : '未检测到后台音乐播放器')
  };
  if (!parsed) {
    if (lastGoodMediaState.value && Date.now() - lastGoodMediaState.at < 6000) {
      return Object.assign({}, lastGoodMediaState.value, { stale: true, reason: base.reason || lastGoodMediaState.value.reason });
    }
    return base;
  }
  try {
    const matched = await matchNeteaseLyrics(parsed.title, parsed.artist);
    if (matched) {
      base.songId = matched.songId;
      base.matchedTitle = matched.matchedTitle;
      base.matchedArtist = matched.matchedArtist;
      base.album = matched.album;
      base.coverUrl = matched.coverUrl;
      base.durationMs = matched.durationMs;
      base.lines = matched.lines;
      base.lyric = matched.lyric;
      base.tlyric = matched.tlyric;
      base.yrc = matched.yrc;
      base.ytlrc = matched.ytlrc;
      base.line = matched.lines?.[0]?.text || '已匹配歌词';
      base.nextLine = matched.lines?.[1]?.text || '';
      base.reason = '已匹配网易云歌词与封面';
    }
  } catch (error) {
    base.reason = `歌词匹配失败：${error.message}`;
  }
  lastGoodMediaState = { at: Date.now(), value: base };
  return base;
}

function mediaVirtualKey(action) {
  if (action === 'playpause') return 0xB3;
  if (action === 'next') return 0xB0;
  if (action === 'previous') return 0xB1;
  if (action === 'stop') return 0xB2;
  return 0;
}

async function sendMediaKey(action) {
  const vk = mediaVirtualKey(action);
  if (!vk) return { ok: false, error: 'Unsupported media action' };
  const script = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class K {
  [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
}
"@
[K]::keybd_event(${vk},0,0,[UIntPtr]::Zero)
Start-Sleep -Milliseconds 24
[K]::keybd_event(${vk},0,2,[UIntPtr]::Zero)
`;
  await execText('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], 3000);
  return { ok: true, action };
}

function normalizeWindowsPath(value) {
  return String(value || '').replace(/\//g, path.sep);
}

function readJson(filePath, maxBytes = 4 * 1024 * 1024) {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile() || stat.size > maxBytes) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
  } catch {
    return null;
  }
}

async function readNeteaseLibraryCache() {
  try {
    const data = await fsp.readFile(neteaseLibraryCachePath(), 'utf8');
    const parsed = JSON.parse(data);
    const playlists = Array.isArray(parsed?.playlists) ? parsed.playlists : [];
    const tracks = parsed?.tracks && typeof parsed.tracks === 'object' && !Array.isArray(parsed.tracks) ? parsed.tracks : {};
    return { ok: true, updatedAt: Number(parsed?.updatedAt || 0) || 0, profile: parsed?.profile || null, playlists, tracks };
  } catch {
    return { ok: false, updatedAt: 0, profile: null, playlists: [], tracks: {} };
  }
}

async function writeNeteaseLibraryCache(cache) {
  const safe = {
    updatedAt: Date.now(),
    profile: cache?.profile || null,
    playlists: Array.isArray(cache?.playlists) ? cache.playlists : [],
    tracks: cache?.tracks && typeof cache.tracks === 'object' && !Array.isArray(cache.tracks) ? cache.tracks : {}
  };
  await fsp.mkdir(path.dirname(neteaseLibraryCachePath()), { recursive: true }).catch(() => null);
  await fsp.writeFile(neteaseLibraryCachePath(), JSON.stringify(safe, null, 2), 'utf8');
  return safe;
}

async function mergeNeteaseLibraryCache(partial) {
  const current = await readNeteaseLibraryCache();
  return writeNeteaseLibraryCache({
    profile: partial?.profile || current.profile,
    playlists: Array.isArray(partial?.playlists) ? partial.playlists : current.playlists,
    tracks: { ...(current.tracks || {}), ...(partial?.tracks || {}) }
  });
}

function execText(file, args, timeout = 3500) {
  return new Promise((resolve) => {
    execFile(file, args, { windowsHide: true, timeout }, (error, stdout) => resolve(error ? '' : String(stdout || '').trim()));
  });
}

async function foregroundFullscreenState() {
  if (process.platform !== 'win32' || !mainWindow || mainWindow.isDestroyed()) return false;
  const handle = mainWindow.getNativeWindowHandle();
  if (!handle) return false;
  const hwnd = process.arch === 'x64' ? handle.readBigUInt64LE(0).toString() : String(handle.readUInt32LE(0));
  const script = `
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Windows.Forms
$sig = @'
using System;
using System.Runtime.InteropServices;
public static class ODFg {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern int GetClassName(IntPtr hWnd, System.Text.StringBuilder name, int max);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
}
'@
Add-Type -TypeDefinition $sig
$h = [ODFg]::GetForegroundWindow()
if ($h -eq [IntPtr]::Zero) { 'NORMAL'; exit }
if ($h -eq [IntPtr]::new(${hwnd})) { 'OWN'; exit }
$sb = New-Object System.Text.StringBuilder 256
[ODFg]::GetClassName($h, $sb, 256) | Out-Null
$cls = $sb.ToString()
if ($cls -match 'Progman|WorkerW') { 'DESKTOP'; exit }
$r = New-Object ODFg+RECT
[ODFg]::GetWindowRect($h, [ref]$r) | Out-Null
$w = $r.Right - $r.Left
$hh = $r.Bottom - $r.Top
$sw = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width
$sh = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height
if ($w -ge ($sw - 4) -and $hh -ge ($sh - 4)) { 'FULLSCREEN' } else { 'WINDOWED' }
`;
  const out = await execText('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], 2500);
  return out === 'FULLSCREEN';
}

let lastForegroundFullscreen = false;
function startForegroundFullscreenWatch() {
  if (process.platform !== 'win32') return;
  setInterval(async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    try {
      const full = await foregroundFullscreenState();
      if (full !== lastForegroundFullscreen) {
        lastForegroundFullscreen = full;
        mainWindow.webContents.send('activity:foreground-fullscreen', full);
      }
    } catch {}
  }, 4000);
}

function registryString(output, valueName) {
  const match = String(output || '').match(new RegExp(`${valueName}\\s+REG_\\w+\\s+(.+)$`, 'im'));
  return match ? match[1].trim() : '';
}

function steamLibrariesFromVdf(steamRoot) {
  const libraryFile = path.join(steamRoot, 'steamapps', 'libraryfolders.vdf');
  try {
    const text = fs.readFileSync(libraryFile, 'utf8');
    const modern = [...text.matchAll(/"path"\s+"([^"]+)"/gi)];
    const legacy = [...text.matchAll(/^\s*"\d+"\s+"([^"]+)"\s*$/gmi)];
    return [...modern, ...legacy]
      .map((match) => normalizeWindowsPath(match[1].replace(/\\\\/g, '\\')))
      .filter((item, index, list) => list.findIndex((other) => other.toLowerCase() === item.toLowerCase()) === index);
  } catch {
    return [];
  }
}

function steamRootFromEngineInstall(installPath) {
  if (!installPath) return '';
  const commonDir = path.dirname(path.resolve(installPath));
  const steamAppsDir = path.dirname(commonDir);
  return path.basename(commonDir).toLowerCase() === 'common' && path.basename(steamAppsDir).toLowerCase() === 'steamapps'
    ? path.dirname(steamAppsDir)
    : '';
}

async function findWallpaperEngineInstall() {
  const now = Date.now();
  if (wallpaperEngineInstallCache.path && now - wallpaperEngineInstallCache.checkedAt < 60000
    && fs.existsSync(path.join(wallpaperEngineInstallCache.path, 'config.json'))) {
    if (!wallpaperEngineSteamRoots.length) {
      const root = steamRootFromEngineInstall(wallpaperEngineInstallCache.path);
      if (root) wallpaperEngineSteamRoots = [root, ...steamLibrariesFromVdf(root)].filter((item, index, list) => list.findIndex((other) => other.toLowerCase() === item.toLowerCase()) === index);
    }
    return wallpaperEngineInstallCache.path;
  }

  const candidates = [];
  const steamRoots = [];
  const seenCandidates = new Set();
  const seenRoots = new Set();
  const addCandidate = (candidate) => {
    if (!candidate) return;
    const normalized = path.normalize(String(candidate).replace(/^"|"$/g, ''));
    const key = normalized.toLowerCase();
    if (!seenCandidates.has(key)) { seenCandidates.add(key); candidates.push(normalized); }
  };
  const addSteamRoot = (root) => {
    if (!root) return;
    const normalized = path.normalize(String(root).replace(/^"|"$/g, ''));
    const key = normalized.toLowerCase();
    if (!seenRoots.has(key)) { seenRoots.add(key); steamRoots.push(normalized); }
  };

  const fromProcess = await execText('powershell.exe', ['-NoProfile', '-Command', "(Get-Process -Name wallpaper64,wallpaper32 -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Path)"]);
  if (fromProcess) addCandidate(path.dirname(fromProcess.split(/\r?\n/)[0]));

  const [userSteam, machineSteam] = await Promise.all([
    execText('reg.exe', ['query', 'HKCU\\Software\\Valve\\Steam', '/v', 'SteamPath']),
    execText('reg.exe', ['query', 'HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam', '/v', 'InstallPath'])
  ]);
  addSteamRoot(registryString(userSteam, 'SteamPath'));
  addSteamRoot(registryString(machineSteam, 'InstallPath'));
  addSteamRoot(path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Steam'));
  addSteamRoot(path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Steam'));
  for (const drive of 'CDEFGHIJKLMNOPQRSTUVWXYZ') {
    const root = `${drive}:\\steam`;
    if (fs.existsSync(root)) addSteamRoot(root);
  }
  for (const root of [...steamRoots]) steamLibrariesFromVdf(root).forEach(addSteamRoot);
  steamRoots.forEach((root) => addCandidate(path.join(root, 'steamapps', 'common', 'wallpaper_engine')));

  const installPath = candidates.find((candidate) => fs.existsSync(path.join(candidate, 'config.json'))) || '';
  const installSteamRoot = steamRootFromEngineInstall(installPath);
  if (installSteamRoot) {
    addSteamRoot(installSteamRoot);
    steamLibrariesFromVdf(installSteamRoot).forEach(addSteamRoot);
  }
  wallpaperEngineSteamRoots = steamRoots.filter((root) => fs.existsSync(path.join(root, 'steamapps')));
  wallpaperEngineInstallCache = { path: installPath, checkedAt: now };
  return installPath;
}

function selectedWallpaperFromConfig(config) {
  if (!config || typeof config !== 'object') return '';
  const stack = [config];
  while (stack.length) {
    const current = stack.shift();
    if (!current || typeof current !== 'object') continue;
    if (current.selectedwallpapers && typeof current.selectedwallpapers === 'object') {
      const first = Object.values(current.selectedwallpapers).find((entry) => entry?.file);
      if (first?.file) return normalizeWindowsPath(first.file);
    }
    for (const value of Object.values(current)) {
      if (value && typeof value === 'object') stack.push(value);
    }
  }
  return '';
}

function imageSourceFromFile(filePath, kind) {
  return { ok: true, path: filePath, url: pathToFileURL(filePath).href, dataUrl: '', kind };
}

function wallpaperKindFromFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (WALLPAPER_VIDEO_EXTENSIONS.has(extension)) return 'video';
  if (extension === '.gif') return 'animated-image';
  if (WALLPAPER_IMAGE_EXTENSIONS.has(extension)) return 'image';
  return '';
}

function wallpaperEngineCaptureSource(selected, projectDir = path.dirname(selected), project = null) {
  preferredCaptureSourceId = '';
  const preview = project?.preview ? path.join(projectDir, normalizeWindowsPath(project.preview)) : '';
  return {
    ok: true,
    path: selected,
    projectDir,
    preview: preview && fs.existsSync(preview) ? pathToFileURL(preview).href : '',
    title: project?.title || 'Wallpaper Engine',
    kind: 'capture',
    captureMode: 'stream',
    source: 'wallpaper-engine'
  };
}

function wallpaperSourceFromFile(filePath, origin = 'user') {
  const kind = wallpaperKindFromFile(filePath);
  if (!kind) return null;
  const source = { ok: true, path: filePath, url: pathToFileURL(filePath).href, dataUrl: '', kind };
  const name = path.basename(filePath, path.extname(filePath)).replace(/^default[-_]/i, '').replace(/[-_]+/g, ' ');
  const id = `${origin}:${path.basename(filePath)}`;
  return {
    ...source,
    id,
    name,
    source: `orbitdesk-${origin}`,
    readonly: origin === 'default',
    thumbnailKey: kind === 'image' ? id : '',
    thumbnailPath: kind === 'image' ? filePath : ''
  };
}

async function listWallpaperDirectory(dirPath, origin) {
  try {
    const names = (await fsp.readdir(dirPath)).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
    return names
      .map((name) => wallpaperSourceFromFile(path.join(dirPath, name), origin))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function existingProjectFile(projectDir, value) {
  if (typeof value !== 'string' || !value) return '';
  const normalized = normalizeWindowsPath(value).trim();
  if (!normalized || normalized.includes('\0') || path.isAbsolute(normalized) || /^[a-z]:/i.test(normalized) || /^[\\/]{2}/.test(normalized)) return '';
  try {
    const projectRoot = fs.realpathSync(projectDir);
    const candidate = path.resolve(projectRoot, normalized);
    const candidateRelative = path.relative(projectRoot, candidate);
    if (!candidateRelative || candidateRelative === '..' || candidateRelative.startsWith(`..${path.sep}`) || path.isAbsolute(candidateRelative)) return '';
    const realCandidate = fs.realpathSync(candidate);
    const realRelative = path.relative(projectRoot, realCandidate);
    if (!realRelative || realRelative === '..' || realRelative.startsWith(`..${path.sep}`) || path.isAbsolute(realRelative)) return '';
    return fs.statSync(realCandidate).isFile() ? realCandidate : '';
  } catch {
    return '';
  }
}

function firstProjectFile(projectDir, predicate) {
  try {
    return fs.readdirSync(projectDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && predicate(entry.name))
      .map((entry) => path.join(projectDir, entry.name))[0] || '';
  } catch {
    return '';
  }
}

function wallpaperEngineProjectSource(projectDir, origin = 'workshop') {
  const project = readJson(path.join(projectDir, 'project.json'), 1024 * 1024);
  if (!project) return null;
  const projectType = String(project.type || '').toLowerCase();
  const declaredAsset = existingProjectFile(projectDir, project.file);
  let assetPath = '';
  if (projectType === 'video') {
    assetPath = WALLPAPER_VIDEO_EXTENSIONS.has(path.extname(declaredAsset).toLowerCase())
      ? declaredAsset
      : firstProjectFile(projectDir, (name) => WALLPAPER_VIDEO_EXTENSIONS.has(path.extname(name).toLowerCase()));
  } else if (projectType === 'image') {
    assetPath = WALLPAPER_IMAGE_EXTENSIONS.has(path.extname(declaredAsset).toLowerCase())
      ? declaredAsset
      : firstProjectFile(projectDir, (name) => WALLPAPER_IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()) && !/^preview\./i.test(name));
  } else if (!projectType && wallpaperKindFromFile(declaredAsset)) assetPath = declaredAsset;

  let previewPath = existingProjectFile(projectDir, project.preview);
  if (previewPath && !WALLPAPER_IMAGE_EXTENSIONS.has(path.extname(previewPath).toLowerCase())) previewPath = '';
  if (!previewPath) previewPath = firstProjectFile(projectDir, (name) => /^preview\.(png|jpe?g|webp|gif)$/i.test(name));
  const renderPath = assetPath || previewPath;
  const renderKind = wallpaperKindFromFile(renderPath);
  if (!renderPath || !renderKind) return null;

  const workshopId = origin === 'workshop' ? path.basename(projectDir) : '';
  const degraded = !assetPath;
  const id = `wallpaper-engine:${origin}:${workshopId || Buffer.from(projectDir).toString('base64url')}`;
  let modifiedAt = 0;
  try { modifiedAt = fs.statSync(path.join(projectDir, 'project.json')).mtimeMs; } catch {}
  return {
    ok: true,
    id,
    name: String(project.title || workshopId || path.basename(projectDir)),
    path: assetPath || projectDir,
    url: pathToFileURL(renderPath).href,
    dataUrl: '',
    kind: renderKind,
    source: 'orbitdesk-workshop',
    sourceLabel: degraded ? `WE · ${projectType === 'scene' ? '场景预览' : projectType === 'web' ? '网页预览' : '预览'}` : `WE · ${projectType === 'video' ? '视频' : '图片'}`,
    readonly: true,
    projectDir,
    projectType: projectType || 'unknown',
    workshopId,
    preview: previewPath ? pathToFileURL(previewPath).href : '',
    thumbnailKey: previewPath ? id : '',
    thumbnailPath: previewPath,
    degraded,
    modifiedAt
  };
}

async function listWallpaperEngineProjects() {
  const now = Date.now();
  if (wallpaperEngineProjectCache.checkedAt && now - wallpaperEngineProjectCache.checkedAt < 15000) return wallpaperEngineProjectCache.items;
  const installDir = await findWallpaperEngineInstall();
  const roots = [...wallpaperEngineSteamRoots];
  const installRoot = steamRootFromEngineInstall(installDir);
  if (installRoot && !roots.some((root) => root.toLowerCase() === installRoot.toLowerCase())) roots.push(installRoot);
  const projectDirectories = new Map();
  const addProjectDirectories = async (root, origin) => {
    try {
      const entries = await fsp.readdir(root, { withFileTypes: true });
      entries.filter((entry) => entry.isDirectory() && (origin !== 'workshop' || /^\d+$/.test(entry.name))).forEach((entry) => {
        const projectDir = path.join(root, entry.name);
        const manifestPath = path.join(projectDir, 'project.json');
        if (!fs.existsSync(manifestPath)) return;
        const identity = origin === 'workshop' ? `${origin}:${entry.name}` : `${origin}:${projectDir.toLowerCase()}`;
        let modifiedAt = 0;
        try { modifiedAt = fs.statSync(manifestPath).mtimeMs; } catch {}
        const previous = projectDirectories.get(identity);
        if (!previous || modifiedAt > previous.modifiedAt) projectDirectories.set(identity, { projectDir, origin, modifiedAt });
      });
    } catch {}
  };
  await Promise.all(roots.map((root) => addProjectDirectories(path.join(root, 'steamapps', 'workshop', 'content', '431960'), 'workshop')));
  if (installDir) await addProjectDirectories(path.join(installDir, 'projects', 'myprojects'), 'local');
  const items = [...projectDirectories.values()]
    .map(({ projectDir, origin }) => wallpaperEngineProjectSource(projectDir, origin))
    .filter(Boolean)
    .sort((a, b) => Number(a.degraded) - Number(b.degraded) || b.modifiedAt - a.modifiedAt || a.name.localeCompare(b.name, 'zh-Hans-CN'));
  wallpaperEngineProjectCache = { items, checkedAt: now };
  return items;
}

async function listWallpapers() {
  await fsp.mkdir(userWallpaperDir(), { recursive: true }).catch(() => null);
  const [defaults, user, engine] = await Promise.all([
    listWallpaperDirectory(DEFAULT_WALLPAPER_DIR, 'default'),
    listWallpaperDirectory(userWallpaperDir(), 'user'),
    listWallpaperEngineProjects().catch(() => [])
  ]);
  const combined = [...defaults, ...user, ...engine];
  wallpaperThumbnailSources = new Map(combined
    .filter((item) => item.thumbnailKey && item.thumbnailPath)
    .map((item) => [item.thumbnailKey, item.thumbnailPath]));
  const wallpapers = combined.map(({ thumbnailPath, ...item }) => item);
  return { ok: true, wallpapers, engineCount: engine.length, userDir: userWallpaperDir(), defaultDir: DEFAULT_WALLPAPER_DIR };
}

async function wallpaperThumbnail(key) {
  const sourcePath = wallpaperThumbnailSources.get(String(key || ''));
  if (!sourcePath) return { ok: false, error: 'THUMBNAIL_NOT_ALLOWED' };
  let modifiedAt = 0;
  try {
    const stat = await fsp.stat(sourcePath);
    if (!stat.isFile()) return { ok: false, error: 'THUMBNAIL_NOT_FOUND' };
    modifiedAt = stat.mtimeMs;
  } catch {
    return { ok: false, error: 'THUMBNAIL_NOT_FOUND' };
  }
  const cacheKey = `${sourcePath.toLowerCase()}|${modifiedAt}`;
  const cached = wallpaperThumbnailCache.get(cacheKey);
  if (cached) {
    wallpaperThumbnailCache.delete(cacheKey);
    wallpaperThumbnailCache.set(cacheKey, cached);
    return { ok: true, dataUrl: cached };
  }
  try {
    const image = await nativeImage.createThumbnailFromPath(sourcePath, { width: 320, height: 180 });
    if (image.isEmpty()) return { ok: false, error: 'THUMBNAIL_EMPTY' };
    const dataUrl = image.toDataURL();
    if (!dataUrl || dataUrl.length > 2 * 1024 * 1024) return { ok: false, error: 'THUMBNAIL_TOO_LARGE' };
    wallpaperThumbnailCache.set(cacheKey, dataUrl);
    while (wallpaperThumbnailCache.size > WALLPAPER_THUMBNAIL_CACHE_LIMIT) {
      wallpaperThumbnailCache.delete(wallpaperThumbnailCache.keys().next().value);
    }
    return { ok: true, dataUrl };
  } catch (error) {
    return { ok: false, error: error?.message || 'THUMBNAIL_FAILED' };
  }
}

async function fallbackLibraryWallpaper() {
  const library = await listWallpapers();
  const saved = await (async () => {
    try { return JSON.parse(await fsp.readFile(settingsPath(), 'utf8')); } catch { return null; }
  })();
  const savedPath = saved?.background?.path;
  const selected = savedPath ? library.wallpapers.find((item) => item.path === savedPath) : null;
  return selected || library.wallpapers[0] || null;
}

function uniqueImportPath(sourcePath) {
  const extension = path.extname(sourcePath).toLowerCase();
  const safeBase = path.basename(sourcePath, extension).replace(/[<>:"/\\|?*\x00-\x1F]+/g, '-').slice(0, 80) || 'wallpaper';
  let target = path.join(userWallpaperDir(), `${safeBase}${extension}`);
  let index = 2;
  while (fs.existsSync(target)) target = path.join(userWallpaperDir(), `${safeBase}-${index++}${extension}`);
  return target;
}

async function importWallpaper() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: '壁纸图片 / 动态壁纸', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'mp4', 'webm', 'mov', 'mkv'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });
  if (result.canceled || !result.filePaths.length) return { ok: false, canceled: true };
  await fsp.mkdir(userWallpaperDir(), { recursive: true });
  const imported = [];
  for (const filePath of result.filePaths) {
    if (!wallpaperKindFromFile(filePath)) continue;
    const target = uniqueImportPath(filePath);
    await fsp.copyFile(filePath, target);
    const wallpaper = wallpaperSourceFromFile(target, 'user');
    if (wallpaper) imported.push(wallpaper);
  }
  return { ok: imported.length > 0, wallpapers: imported };
}

async function deleteWallpaper(inputPath) {
  const target = path.resolve(String(inputPath || ''));
  const userDir = path.resolve(userWallpaperDir());
  if (!target.toLowerCase().startsWith(`${userDir.toLowerCase()}${path.sep}`)) return { ok: false, error: 'ONLY_IMPORTED_WALLPAPERS_CAN_BE_DELETED' };
  if (!fs.existsSync(target)) return { ok: false, error: 'WALLPAPER_NOT_FOUND' };
  await fsp.unlink(target);
  return { ok: true, path: target };
}

function parseWallpaperPackage(pkgPath) {
  const fd = fs.openSync(pkgPath, 'r');
  try {
    const header = Buffer.alloc(16);
    fs.readSync(fd, header, 0, header.length, 0);
    if (header.slice(4, 12).toString('ascii') !== 'PKGV0023') return null;
    let pos = 16;
    const entries = [];
    while (pos + 12 < fs.statSync(pkgPath).size) {
      const lenBuffer = Buffer.alloc(4);
      fs.readSync(fd, lenBuffer, 0, 4, pos);
      const nameLength = lenBuffer.readUInt32LE(0);
      if (nameLength <= 0 || nameLength > 400) break;
      const row = Buffer.alloc(nameLength + 8);
      fs.readSync(fd, row, 0, row.length, pos + 4);
      const name = row.slice(0, nameLength).toString('utf8');
      if (!name || !/[/.]/.test(name)) break;
      entries.push({
        name,
        offset: row.readUInt32LE(nameLength),
        size: row.readUInt32LE(nameLength + 4)
      });
      pos += 4 + nameLength + 8;
    }
    return { dataStart: pos, entries };
  } finally {
    fs.closeSync(fd);
  }
}

async function copyRange(source, target, start, size) {
  await fsp.mkdir(path.dirname(target), { recursive: true });
  await new Promise((resolve, reject) => {
    const input = fs.createReadStream(source, { start, end: start + size - 1 });
    const output = fs.createWriteStream(target);
    input.on('error', reject);
    output.on('error', reject);
    output.on('finish', resolve);
    input.pipe(output);
  });
}

async function extractWallpaperEngineSceneVideo(pkgPath) {
  const stat = await fsp.stat(pkgPath);
  const cacheKey = `${path.resolve(pkgPath)}|${stat.size}|${Math.floor(stat.mtimeMs)}`;
  const remembered = wallpaperPackageVideoCache.get(cacheKey);
  if (remembered && fs.existsSync(remembered)) return remembered;
  const cacheDir = path.join(app.getPath('userData'), 'wallpaper-cache');
  const cacheName = `${path.basename(path.dirname(pkgPath))}-${stat.size}-${Math.floor(stat.mtimeMs)}.mp4`;
  const cached = path.join(cacheDir, cacheName);
  if (fs.existsSync(cached)) {
    wallpaperPackageVideoCache.set(cacheKey, cached);
    return cached;
  }

  const parsed = parseWallpaperPackage(pkgPath);
  if (!parsed?.entries?.length) return null;
  const videoEntry = parsed.entries
    .filter((entry) => /\.tex$/i.test(entry.name))
    .sort((a, b) => b.size - a.size)[0];
  if (!videoEntry || videoEntry.size < 1024 * 1024) return null;

  const fd = fs.openSync(pkgPath, 'r');
  try {
    const head = Buffer.alloc(Math.min(4096, videoEntry.size));
    fs.readSync(fd, head, 0, head.length, parsed.dataStart + videoEntry.offset);
    const mp4OffsetInTex = head.indexOf(Buffer.from('ftyp'));
    if (mp4OffsetInTex < 4) return null;
    const mp4StartInTex = mp4OffsetInTex - 4;
    const declaredSizeOffset = Math.max(0, mp4StartInTex - 8);
    let mp4Size = videoEntry.size - mp4StartInTex;
    if (declaredSizeOffset + 4 <= head.length) {
      const possibleSize = head.readUInt32LE(declaredSizeOffset);
      if (possibleSize > 1024 * 1024 && possibleSize <= videoEntry.size) mp4Size = possibleSize;
    }
    await copyRange(pkgPath, cached, parsed.dataStart + videoEntry.offset + mp4StartInTex, mp4Size);
    wallpaperPackageVideoCache.set(cacheKey, cached);
    while (wallpaperPackageVideoCache.size > 32) wallpaperPackageVideoCache.delete(wallpaperPackageVideoCache.keys().next().value);
    return cached;
  } finally {
    fs.closeSync(fd);
  }
}

async function currentWallpaperEngineSource() {
  if (!(await isProcessRunning('wallpaper64.exe')) && !(await isProcessRunning('wallpaper32.exe'))) return null;
  const installDir = await findWallpaperEngineInstall();
  if (!installDir) return null;
  const config = readJson(path.join(installDir, 'config.json'));
  const selected = selectedWallpaperFromConfig(config);
  if (!selected || !fs.existsSync(selected)) return null;
  const extension = path.extname(selected).toLowerCase();
  if (['.mp4', '.webm', '.mov', '.mkv'].includes(extension)) {
    return { ...imageSourceFromFile(selected, 'video'), source: 'wallpaper-engine' };
  }
  if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(extension)) {
    return { ...imageSourceFromFile(selected, extension === '.gif' ? 'animated-image' : 'image'), source: 'wallpaper-engine' };
  }
  const projectDir = path.dirname(selected);
  const project = readJson(path.join(projectDir, 'project.json'));
  const preview = project?.preview ? path.join(projectDir, normalizeWindowsPath(project.preview)) : '';
  if (extension === '.pkg') {
    const extractedVideo = await extractWallpaperEngineSceneVideo(selected).catch(() => null);
    if (extractedVideo) {
      return {
        ...imageSourceFromFile(extractedVideo, 'video'),
        packagePath: selected,
        projectDir,
        title: project?.title || 'Wallpaper Engine',
        source: 'wallpaper-engine'
      };
    }
    if (preview && fs.existsSync(preview)) {
      const previewExtension = path.extname(preview).toLowerCase();
      return {
        ok: true,
        path: preview,
        packagePath: selected,
        projectDir,
        url: pathToFileURL(preview).href,
        title: project?.title || 'Wallpaper Engine',
        kind: previewExtension === '.gif' ? 'animated-image' : 'image',
        source: 'wallpaper-engine-preview'
      };
    }
    return wallpaperEngineCaptureSource(selected, projectDir, project);
  }
  if (preview && fs.existsSync(preview)) {
    const previewExtension = path.extname(preview).toLowerCase();
    return {
      ok: true,
      path: preview,
      packagePath: selected,
      projectDir,
      url: pathToFileURL(preview).href,
      title: project?.title || 'Wallpaper Engine',
      kind: previewExtension === '.gif' ? 'animated-image' : 'image',
      source: 'wallpaper-engine-preview'
    };
  }
  if (['.json', '.html', '.htm'].includes(extension)) {
    return wallpaperEngineCaptureSource(selected, projectDir, project);
  }
  return wallpaperEngineCaptureSource(selected, projectDir, project);
}

async function getCaptureSources(thumbnailSize = { width: 1, height: 1 }) {
  const sources = await desktopCapturer.getSources({ types: ['window', 'screen'], thumbnailSize });
  if (SMOKE_TEST) {
    const simplified = sources.map((source) => ({ id: source.id, name: source.name }));
    const sourcesKey = JSON.stringify(simplified);
    if (sourcesKey !== lastCaptureSourcesKey) {
      lastCaptureSourcesKey = sourcesKey;
      try { await fsp.writeFile(path.join(app.getPath('userData'), 'capture-sources.json'), JSON.stringify(simplified, null, 2), 'utf8'); } catch {}
    }
  }
  return sources;
}

function isExplicitWallpaperEngineCaptureSource(source) {
  const id = String(source?.id || '');
  const name = String(source?.name || '');
  if (!id || String(id).startsWith('screen:')) return false;
  if (/orbitdesk|workerw|program manager/i.test(name)) return false;
  return /\bwallpaper\s*engine\b|\bwallpaper(?:32|64)(?:\.exe)?\b/i.test(name);
}

function selectWallpaperCaptureSource(sources) {
  const available = Array.isArray(sources) ? sources : [];
  const preferred = preferredCaptureSourceId
    ? available.find((source) => source.id === preferredCaptureSourceId)
    : null;
  if (preferred && isExplicitWallpaperEngineCaptureSource(preferred)) return preferred;
  // The smoke test deliberately captures one exact screen id selected by the
  // test harness. Normal builds never accept screens or generic Explorer hosts.
  if (SMOKE_TEST && preferred && String(preferred.id).startsWith('screen:')) return preferred;
  return available.find(isExplicitWallpaperEngineCaptureSource) || null;
}

async function captureWallpaperFrame() {
  const now = Date.now();
  if (lastCaptureFrame && now - lastCaptureAt < WALLPAPER_CAPTURE_MIN_INTERVAL) return lastCaptureFrame;
  const sources = await getCaptureSources(WALLPAPER_CAPTURE_SIZE);
  const source = selectWallpaperCaptureSource(sources);
  if (!source || source.thumbnail.isEmpty()) return { ok: false, error: 'NO_WALLPAPER_CAPTURE_SOURCE' };
  preferredCaptureSourceId = source.id;
  lastCaptureAt = now;
  lastCaptureFrame = { ok: true, id: source.id, name: source.name, dataUrl: source.thumbnail.toDataURL(), kind: 'capture-frame', width: WALLPAPER_CAPTURE_SIZE.width, height: WALLPAPER_CAPTURE_SIZE.height, sequence: ++captureFrameSequence, capturedAt: now };
  return lastCaptureFrame;
}

function setupDisplayCaptureHandler() {
  session.defaultSession.setDisplayMediaRequestHandler(async (_request, callback) => {
    try {
      const sources = await getCaptureSources({ width: 1, height: 1 });
      const source = selectWallpaperCaptureSource(sources);
      if (SMOKE_TEST) console.log('[OrbitDesk] display capture source:', source?.id || 'none');
      callback(source ? { video: source } : {});
    } catch (error) {
      // Electron throws when a video request is intentionally declined. Keeping
      // the callback inside this try prevents that expected rejection from
      // becoming an unhandled main-process promise rejection.
      console.warn('[OrbitDesk] display capture unavailable:', error?.message || error);
    }
  }, { useSystemPicker: false });
  setTimeout(() => getCaptureSources().catch(() => null), 2500);
}

async function chooseBackground() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: '动态与静态背景', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'mp4', 'webm', 'mov', 'mkv'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });
  if (result.canceled || !result.filePaths[0]) return { ok: false, canceled: true };
  const selected = result.filePaths[0];
  const extension = path.extname(selected).toLowerCase();
  const videoExtensions = new Set(['.mp4', '.webm', '.mov', '.mkv']);
  const payload = { ok: true, path: selected, url: pathToFileURL(selected).href, dataUrl: '', kind: videoExtensions.has(extension) ? 'video' : 'image' };
  if (!videoExtensions.has(extension)) {
    const image = nativeImage.createFromPath(selected);
    if (image && !image.isEmpty()) {
      const size = image.getSize();
      payload.width = size.width;
      payload.height = size.height;
    }
  }
  return payload;
}

function blockAssetKindFromFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (WALLPAPER_IMAGE_EXTENSIONS.has(extension)) return extension === '.gif' ? 'animated-image' : 'image';
  if (WALLPAPER_VIDEO_EXTENSIONS.has(extension)) return 'video';
  if (['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac'].includes(extension)) return 'audio';
  if (['.txt', '.md', '.json', '.log'].includes(extension)) return 'text';
  return 'file';
}

function uniqueBlockAssetPath(sourcePath) {
  const extension = path.extname(sourcePath).toLowerCase();
  const safeBase = path.basename(sourcePath, extension).replace(/[<>:"/\\|?*\x00-\x1F]+/g, '-').slice(0, 80) || 'asset';
  let target = path.join(userBlockAssetDir(), `${safeBase}${extension}`);
  let index = 2;
  while (fs.existsSync(target)) target = path.join(userBlockAssetDir(), `${safeBase}-${index++}${extension}`);
  return target;
}

async function chooseBlockAsset(kindHint = '') {
  const hint = String(kindHint || '');
  const filters = hint === 'audio'
    ? [{ name: '音频', extensions: ['mp3','flac','wav','ogg','m4a','aac'] }, { name: '所有文件', extensions: ['*'] }]
    : hint === 'text'
      ? [{ name: '文本', extensions: ['txt','md','json','log'] }, { name: '所有文件', extensions: ['*'] }]
      : [{ name: '媒体 / 图片', extensions: ['png','jpg','jpeg','webp','gif','mp4','webm','mov','mkv'] }, { name: '所有文件', extensions: ['*'] }];
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'], filters });
  if (result.canceled || !result.filePaths[0]) return { ok: false, canceled: true };
  await fsp.mkdir(userBlockAssetDir(), { recursive: true });
  const selected = result.filePaths[0];
  const target = uniqueBlockAssetPath(selected);
  await fsp.copyFile(selected, target);
  const kind = blockAssetKindFromFile(target);
  const payload = { ok: true, path: target, url: pathToFileURL(target).href, kind, name: path.basename(target) };
  if (kind === 'image' || kind === 'animated-image') {
    const image = nativeImage.createFromPath(target);
    if (image && !image.isEmpty()) {
      const size = image.getSize();
      payload.width = size.width;
      payload.height = size.height;
    }
  }
  if (kind === 'text') payload.text = (await fsp.readFile(target, 'utf8').catch(() => '')).slice(0, 12000);
  return payload;
}

ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
ipcMain.handle('window:close', requestExit);
ipcMain.handle('desktop:scan', readDesktopItems);
ipcMain.handle('computer:list', listComputerRoots);
ipcMain.handle('desktop:file-icons', async (_event, inputPaths) => {
  const requested = Array.isArray(inputPaths) ? inputPaths.slice(0, 120).map(String) : [];
  const output = {};
  let cursor = 0;
  const workers = Array.from({ length: Math.min(8, requested.length) }, async () => {
    while (cursor < requested.length) {
      const targetPath = requested[cursor++];
      if (fileIconCache.has(targetPath)) { output[targetPath] = fileIconCache.get(targetPath); continue; }
      try {
        let icon = await app.getFileIcon(targetPath, { size: 'normal' });
        if (!icon || icon.isEmpty()) icon = await app.getFileIcon(targetPath, { size: 'large' });
        const dataUrl = icon && !icon.isEmpty() ? icon.toDataURL() : '';
        fileIconCache.set(targetPath, dataUrl);
        if (fileIconCache.size > FILE_ICON_CACHE_LIMIT) fileIconCache.delete(fileIconCache.keys().next().value);
        output[targetPath] = dataUrl;
      } catch { output[targetPath] = ''; }
    }
  });
  await Promise.all(workers);
  return output;
});
ipcMain.handle('fs:list', (_event, targetPath) => listDirectory(targetPath));
ipcMain.handle('fs:open', async (_event, targetPath) => {
  const result = await shell.openPath(path.resolve(String(targetPath)));
  return { ok: !result, error: result || '' };
});
ipcMain.handle('fs:reveal', (_event, targetPath) => shell.showItemInFolder(path.resolve(String(targetPath))));
ipcMain.handle('fs:choose-directory', (_event, defaultPath) => chooseDirectory(defaultPath));
ipcMain.handle('fs:create-file', (_event, payload) => createFileFromRenderer(payload));
ipcMain.handle('clipboard:write', (_event, value) => { clipboard.writeText(String(value || '')); return { ok: true }; });
ipcMain.handle('desktop:wallpaper', currentWallpaper);
ipcMain.handle('desktop:capture-frame', captureWallpaperFrame);
ipcMain.handle('desktop:choose-background', chooseBackground);
ipcMain.handle('blocks:choose-asset', (_event, kindHint) => chooseBlockAsset(kindHint));
ipcMain.handle('system:metrics', () => systemMetrics());
ipcMain.handle('autostart:get', () => {
  try {
    return { ok: true, enabled: !!app.getLoginItemSettings().openAtLogin };
  } catch (error) {
    return { ok: false, error: error?.message || 'AUTOSTART_GET_FAILED' };
  }
});
ipcMain.handle('autostart:set', (_event, enabled) => {
  try {
    const settings = { openAtLogin: !!enabled };
    if (!app.isPackaged) {
      // 开发模式：显式带上应用路径，否则开机只会启动 electron.exe 本体并弹帮助信息。
      settings.path = process.execPath;
      settings.args = [app.getAppPath()];
    }
    app.setLoginItemSettings(settings);
    return { ok: true, enabled: !!app.getLoginItemSettings().openAtLogin };
  } catch (error) {
    return { ok: false, error: error?.message || 'AUTOSTART_SET_FAILED' };
  }
});
ipcMain.handle('wallpapers:list', listWallpapers);
ipcMain.handle('wallpapers:thumbnail', (_event, key) => wallpaperThumbnail(key));
ipcMain.handle('wallpapers:release-thumbnails', () => {
  wallpaperThumbnailCache.clear();
  return { ok: true };
});
ipcMain.handle('wallpapers:import', importWallpaper);
ipcMain.handle('wallpapers:delete', (_event, targetPath) => deleteWallpaper(targetPath));
ipcMain.handle('lyrics:netease-status', () => neteaseLyricStatus());
ipcMain.handle('lyrics:media-control', (_event, action) => sendMediaKey(String(action || '')));
ipcMain.handle('lyrics:netease-login-state', () => neteaseLoginState());
ipcMain.handle('lyrics:netease-qr-create', () => neteaseQrCreate());
ipcMain.handle('lyrics:netease-qr-check', (_event, key) => neteaseQrCheck(key));
ipcMain.handle('lyrics:netease-logout', () => neteaseLogout());
ipcMain.handle('lyrics:netease-playlists', () => neteasePlaylistList());
ipcMain.handle('lyrics:netease-playlist-tracks', (_event, payload) => neteasePlaylistTracksCached(payload?.id, payload?.offset, payload?.limit));
ipcMain.handle('lyrics:netease-sync-library', () => neteaseSyncLibrary());
ipcMain.handle('lyrics:netease-play-song', (_event, payload) => neteasePlaySong(payload));
ipcMain.handle('lyrics:embedded-playback-state', (_event, payload) => {
  const action = String(payload?.action || '');
  if (action === 'pause') embeddedNeteaseState.playing = false;
  if (action === 'play') embeddedNeteaseState.playing = true;
  if (action === 'clear') embeddedNeteaseState = { song: null, matched: null, startedAt: 0, pausedAt: 0, playing: false, url: '', updatedAt: Date.now() };
  if (Number.isFinite(Number(payload?.positionMs))) setEmbeddedPlaybackPosition(Number(payload.positionMs));
  embeddedNeteaseState.updatedAt = Date.now();
  return { ok: true };
});
ipcMain.handle('desktop:mode-status', () => desktopRuntime?.getStatus('renderer-request') || { enabled: false });
ipcMain.handle('desktop:request-keyboard-focus', async (event, reason) => {
  const trustedSender = mainWindow && !mainWindow.isDestroyed()
    && event?.sender === mainWindow.webContents
    && !event.sender.isDestroyed();
  if (!trustedSender) return { ok: false, focused: false, error: 'UNTRUSTED_RENDERER' };
  if (!desktopRuntime || typeof desktopRuntime.requestKeyboardFocus !== 'function') {
    return { ok: false, focused: false, error: 'DESKTOP_RUNTIME_UNAVAILABLE' };
  }
  const safeReason = String(reason || 'renderer-pointer')
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'renderer-pointer';
  const result = desktopRuntime.requestKeyboardFocus(`orbitdesk-${safeReason}`);
  void focusNativeWindow();
  return result;
});
ipcMain.handle('diagnostics:renderer-ready', async (_event, payload) => {
  const status = {
    at: new Date().toISOString(),
    renderer: {
      particles: payload?.particles === true,
      ambientParticles: payload?.ambientParticles === true,
      memorySafe: payload?.memorySafe === true,
      backgroundKind: String(payload?.backgroundKind || ''),
      wallpaperStatus: payload?.wallpaperStatus || null,
      itemCount: Math.max(0, Number(payload?.itemCount) || 0),
      webgl: String(payload?.webgl || ''),
      heap: payload?.heap || null,
      dom: payload?.dom || null
    },
    desktop: desktopRuntime?.getStatus('renderer-ready') || { enabled: false }
  };
  try { await fsp.writeFile(path.join(app.getPath('userData'), 'runtime-status.json'), JSON.stringify(status, null, 2), 'utf8'); } catch {}
  if (process.env.ORBITDESK_CAPTURE_PREVIEW === '1') {
    try {
      const image = await mainWindow.webContents.capturePage();
      await fsp.writeFile(path.join(__dirname, 'preview-live.png'), image.toPNG());
    } catch {}
  }
  return status;
});
ipcMain.handle('settings:load', async () => {
  try { return JSON.parse(await fsp.readFile(settingsPath(), 'utf8')); } catch { return null; }
});
ipcMain.handle('settings:save', async (_event, data) => {
  const serialized = JSON.stringify(data || {}, null, 2);
  const write = settingsWriteQueue
    .catch(() => undefined)
    .then(() => fsp.writeFile(settingsPath(), serialized, 'utf8'));
  settingsWriteQueue = write;
  await write;
  return { ok: true };
});
ipcMain.handle('settings:export', async (_event, data) => {
  const result = await dialog.showSaveDialog(mainWindow, { defaultPath: 'TCdesktop-style.json', filters: [{ name: 'TCdesktop Style', extensions: ['json'] }] });
  if (result.canceled || !result.filePath) return { ok: false, canceled: true };
  await fsp.writeFile(result.filePath, JSON.stringify(data || {}, null, 2), 'utf8');
  return { ok: true, path: result.filePath };
});
ipcMain.handle('settings:import', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'], filters: [{ name: 'TCdesktop Style', extensions: ['json'] }] });
  if (result.canceled || !result.filePaths[0]) return { ok: false, canceled: true };
  return { ok: true, data: JSON.parse(await fsp.readFile(result.filePaths[0], 'utf8')) };
});
ipcMain.handle('ai:config-load', async () => {
  const config = await readAiConfig();
  return { baseUrl: config.baseUrl, model: config.model, hasKey: !!config.key };
});
ipcMain.handle('ai:config-save', async (_event, payload) => {
  const saved = await writeAiConfig(payload || {});
  return { ok: true, config: { baseUrl: saved.baseUrl, model: saved.model, hasKey: !!saved.key } };
});
ipcMain.handle('ai:chat', async (event, payload) => {
  if (payload?.stream) { await aiChatStream(payload?.messages || [], event.sender); return { ok: true, streamed: true }; }
  return aiChat(payload?.messages || []);
});
ipcMain.handle('desktop:toggle-icons', async () => {
  if (!desktopRuntime) return { ok: false, error: 'DESKTOP_RUNTIME_UNAVAILABLE' };
  const status = desktopRuntime.getStatus('toggle-icons-before');
  return desktopRuntime.setDesktopIconsVisible(status.desktopIconsVisible === false, 'renderer-toggle-icons');
});

if (hasSingleInstanceLock) app.whenReady().then(() => {
  const nativeTempPath = path.join(app.getPath('temp'), 'OrbitDeskNative');
  fs.mkdirSync(nativeTempPath, { recursive: true });
  setupDisplayCaptureHandler();
  desktopRuntime = new FullDesktopModeRuntime({
    screen,
    platform: process.platform,
    execFileImpl: execFile,
    nativeTempPath,
    requestReconcile: (reason = 'icon-host-changed') => {
      // The upstream runtime hides the BrowserWindow before every automatic
      // interactive reconcile. On a desktop-manager surface that looks like a
      // periodic flash back to Explorer. Keep explicit tray/hotkey reconcile,
      // but suppress watcher-triggered rebinds during normal use.
      const status = desktopRuntime?.getStatus?.(`auto-reconcile-suppressed:${reason}`) || { enabled: false };
      mainWindow?.webContents?.send?.('desktop:mode-status', status);
      return { ok: true, suppressed: true, reason, status };
    }
  });
  createTray();
  createWindow();
  startForegroundFullscreenWatch();
  globalShortcut.register('CommandOrControl+Alt+Shift+O', () => desktopRuntime?.reconcile('recovery-hotkey'));
  try {
    globalShortcut.register('Super+D', () => scheduleDesktopSurfaceRestore('win-d'));
  } catch (error) {
    console.warn('[OrbitDesk] Win+D restore shortcut unavailable:', error?.message || error);
  }
  screen.on('display-metrics-changed', () => desktopRuntime?.reconcile('display-metrics-changed'));
});
app.on('before-quit', (event) => {
  if (!quitting && desktopRuntime?.getStatus?.('before-quit')?.enabled) {
    event.preventDefault();
    requestExit();
  }
});
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (process.platform === 'win32') {
    runDetached('ie4uinit.exe', ['-show']);
    runDetached('rundll32.exe', ['user32.dll,UpdatePerUserSystemParameters']);
  }
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
