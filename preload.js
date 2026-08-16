const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('orbitDesk', {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close')
  },
  scanDesktop: () => ipcRenderer.invoke('desktop:scan'),
  listComputer: () => ipcRenderer.invoke('computer:list'),
  getFileIcons: (paths) => ipcRenderer.invoke('desktop:file-icons', paths),
  listDirectory: (targetPath) => ipcRenderer.invoke('fs:list', targetPath),
  openPath: (targetPath) => ipcRenderer.invoke('fs:open', targetPath),
  revealPath: (targetPath) => ipcRenderer.invoke('fs:reveal', targetPath),
  chooseDirectory: (defaultPath) => ipcRenderer.invoke('fs:choose-directory', defaultPath),
  createFile: (payload) => ipcRenderer.invoke('fs:create-file', payload || {}),
  copyText: (value) => ipcRenderer.invoke('clipboard:write', value),
  getCurrentWallpaper: () => ipcRenderer.invoke('desktop:wallpaper'),
  captureWallpaperFrame: () => ipcRenderer.invoke('desktop:capture-frame'),
  chooseBackground: () => ipcRenderer.invoke('desktop:choose-background'),
  blocks: {
    chooseAsset: (kindHint) => ipcRenderer.invoke('blocks:choose-asset', kindHint)
  },
  system: {
    metrics: () => ipcRenderer.invoke('system:metrics')
  },
  autoStart: {
    get: () => ipcRenderer.invoke('autostart:get'),
    set: (enabled) => ipcRenderer.invoke('autostart:set', !!enabled)
  },
  wallpapers: {
    list: () => ipcRenderer.invoke('wallpapers:list'),
    thumbnail: (key) => ipcRenderer.invoke('wallpapers:thumbnail', key),
    releaseThumbnails: () => ipcRenderer.invoke('wallpapers:release-thumbnails'),
    import: () => ipcRenderer.invoke('wallpapers:import'),
    delete: (targetPath) => ipcRenderer.invoke('wallpapers:delete', targetPath)
  },
  lyrics: {
    neteaseStatus: () => ipcRenderer.invoke('lyrics:netease-status'),
    mediaControl: (action) => ipcRenderer.invoke('lyrics:media-control', action),
    neteaseLoginState: () => ipcRenderer.invoke('lyrics:netease-login-state'),
    neteaseQrCreate: () => ipcRenderer.invoke('lyrics:netease-qr-create'),
    neteaseQrCheck: (key) => ipcRenderer.invoke('lyrics:netease-qr-check', key),
    neteaseLogout: () => ipcRenderer.invoke('lyrics:netease-logout'),
    neteasePlaylists: () => ipcRenderer.invoke('lyrics:netease-playlists'),
    neteasePlaylistTracks: (payload) => ipcRenderer.invoke('lyrics:netease-playlist-tracks', payload || {}),
    neteaseSyncLibrary: () => ipcRenderer.invoke('lyrics:netease-sync-library'),
    neteasePlaySong: (payload) => ipcRenderer.invoke('lyrics:netease-play-song', payload || {}),
    embeddedPlaybackState: (payload) => ipcRenderer.invoke('lyrics:embedded-playback-state', payload || {})
  },
  getDesktopModeStatus: () => ipcRenderer.invoke('desktop:mode-status'),
  requestKeyboardFocus: (reason) => ipcRenderer.invoke(
    'desktop:request-keyboard-focus',
    String(reason || 'renderer-pointer').slice(0, 80)
  ),
  onDesktopModeStatus: (callback) => {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on('desktop:mode-status', listener);
    return () => ipcRenderer.removeListener('desktop:mode-status', listener);
  },
  onForegroundFullscreen: (callback) => {
    const listener = (_event, full) => callback(!!full);
    ipcRenderer.on('activity:foreground-fullscreen', listener);
    return () => ipcRenderer.removeListener('activity:foreground-fullscreen', listener);
  },
  reportRendererReady: (payload) => ipcRenderer.invoke('diagnostics:renderer-ready', payload || {}),
  toggleDesktopIcons: () => ipcRenderer.invoke('desktop:toggle-icons'),
  settings: {
    load: () => ipcRenderer.invoke('settings:load'),
    save: (data) => ipcRenderer.invoke('settings:save', data),
    export: (data) => ipcRenderer.invoke('settings:export', data),
    import: () => ipcRenderer.invoke('settings:import')
  },
  ai: {
    configLoad: () => ipcRenderer.invoke('ai:config-load'),
    configSave: (payload) => ipcRenderer.invoke('ai:config-save', payload || {}),
    chat: (messages) => ipcRenderer.invoke('ai:chat', { messages }),
    chatStream: (messages) => ipcRenderer.invoke('ai:chat', { messages, stream: true }),
    onChunk: (callback) => { const l = (_e, data) => callback(data); ipcRenderer.on('ai:chunk', l); return () => ipcRenderer.removeListener('ai:chunk', l); },
    onDone: (callback) => { const l = () => callback(); ipcRenderer.on('ai:done', l); return () => ipcRenderer.removeListener('ai:done', l); },
    onError: (callback) => { const l = (_e, data) => callback(data); ipcRenderer.on('ai:error', l); return () => ipcRenderer.removeListener('ai:error', l); }
  }
});
