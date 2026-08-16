const browserDemoItems = [
  ['Mineradio-main', 'projects', true], ['Nebula API', 'projects', true], ['Visual Lab', 'projects', true],
  ['Visual Studio Code', 'apps', false, 'LNK'], ['Figma', 'apps', false, 'LNK'], ['Terminal', 'apps', false, 'LNK'],
  ['Product Roadmap.pdf', 'documents', false, 'PDF'], ['Ideas.md', 'documents', false, 'MD'],
  ['Cover Concept.png', 'media', false, 'PNG'], ['Archive', 'folders', true]
].map(([name, kind, isDirectory, extension], index) => ({ id: `demo-${index}`, name, rawName: name, path: `C:\\Users\\ASUS\\Desktop\\${name}`, kind, isDirectory, extension: extension || '', modifiedAt: Date.now() - index * 86400000, size: isDirectory ? 0 : (index + 2) * 182400 }));
const browserFallback = {
  window: { minimize(){}, maximize(){}, close(){} },
  scanDesktop: async () => ({ roots: ['C:\\Users\\ASUS\\Desktop'], groups: [
    {id:'projects',label:'项目星系'},{id:'apps',label:'应用程序'},{id:'documents',label:'文档资料'},{id:'media',label:'视觉素材'},{id:'archives',label:'压缩归档'},{id:'folders',label:'文件夹'},{id:'other',label:'其他'}
  ], items: browserDemoItems }),
  listComputer: async () => ({ path: '此电脑', parent: '', items: ['C:\\', 'D:\\'].map((drive, index) => ({ id: `drive-${index}`, name: drive, path: drive, kind: 'folders', isDirectory: true, extension: 'DRIVE', modifiedAt: Date.now(), size: 0 })) }),
  getFileIcons: async () => ({}),
  listDirectory: async (targetPath) => ({ path: targetPath, parent: 'C:\\Users\\ASUS\\Desktop', items: browserDemoItems.slice(3) }),
  openPath: async () => ({ok:true}), revealPath: async () => ({ok:true}), copyText: async (value) => { try { await navigator.clipboard.writeText(value); } catch {} return {ok:true}; }, toggleDesktopIcons: async () => ({ok:false}),
  chooseDirectory: async () => ({ok:false,canceled:true}), createFile: async (payload) => ({ok:true,item:{id:`created-${Date.now()}`,name:payload?.name||'新建文件.txt',path:`${payload?.directory||'C:\\Users\\ASUS\\Desktop'}\\${payload?.name||'新建文件.txt'}`,kind:'documents',isDirectory:false,extension:'TXT',modifiedAt:Date.now(),size:0}}),
  getCurrentWallpaper: async () => ({ok:true,url:'assets/wallpapers/default-blue-nebula.jpg',kind:'image',source:'orbitdesk-default',path:'assets/wallpapers/default-blue-nebula.jpg'}), captureWallpaperFrame: async () => ({ok:false}), chooseBackground: async () => ({ok:false,canceled:true}),
  blocks: { chooseAsset: async () => ({ok:false,canceled:true}) },
  system: { metrics: async () => ({ok:true,cpuPercent:12,memory:{percent:36,used:6*1024**3,total:16*1024**3},network:{rxPerSec:524288,txPerSec:65536}}) },
  wallpapers: { list: async () => ({ok:true,wallpapers:[
    {ok:true,id:'default:default-blue-nebula.jpg',name:'blue nebula',path:'assets/wallpapers/default-blue-nebula.jpg',url:'assets/wallpapers/default-blue-nebula.jpg',kind:'image',source:'orbitdesk-default',readonly:true},
    {ok:true,id:'default:default-purple-planet.jpg',name:'purple planet',path:'assets/wallpapers/default-purple-planet.jpg',url:'assets/wallpapers/default-purple-planet.jpg',kind:'image',source:'orbitdesk-default',readonly:true}
  ]}), import: async () => ({ok:false,canceled:true}), delete: async () => ({ok:false}) },
  lyrics: { neteaseStatus: async () => ({ ok:true, provider:'netease', running:false, connected:false, reason:'浏览器预览模式' }), mediaControl: async () => ({ok:false}), neteaseLoginState: async () => ({ok:true,loggedIn:false}), neteaseQrCreate: async () => ({ok:false}), neteaseQrCheck: async () => ({ok:false}), neteaseLogout: async () => ({ok:true}), neteasePlaylists: async () => ({ok:false,playlists:[]}), neteasePlaylistTracks: async () => ({ok:false,songs:[]}), neteaseSyncLibrary: async () => ({ok:false}), neteasePlaySong: async () => ({ok:false}), embeddedPlaybackState: async () => ({ok:true}) },
  getDesktopModeStatus: async () => ({enabled:false}), onDesktopModeStatus: () => () => {},
  requestKeyboardFocus: async () => ({ok:true,embedded:false}),
  reportRendererReady: async () => ({}),
  settings: { load: async () => JSON.parse(localStorage.getItem('orbitdesk-demo') || 'null'), save: async (data) => { localStorage.setItem('orbitdesk-demo', JSON.stringify(data)); return {ok:true}; }, export: async () => ({ok:false}), import: async () => ({ok:false}) }
};
const api = window.orbitDesk || browserFallback;

const state = {
  payload: { roots: [], groups: [], items: [] },
  activeGroup: 'projects',
  cloudGroupTouched: false,
  currentPath: '',
  currentParent: '',
  currentItems: null,
  selectedId: '',
  motion: 52,
  density: 64,
  particleFps: 60,
  inactiveFps: '10',
  loadSpeed: 80,
  loadGap: 450,
  flow: 'wave',
  wallpaperParticleMode: 'center',
  pathSpeed: 115,
  wallpaperOpacity: 100,
  wallpaperBrightness: 116,
  wallpaperSaturation: 118,
  particleOpacity: 94,
  wallpaperBlur: 3,
  panelBlur: 18,
  perspective: 72,
  shelfScale: 82,
  themeHue: 185,
  themeSat: 72,
  themeAlpha: 46,
  themeRgb: '159,233,239',
  themeMode: 'light',
  cloudGlassAlpha: 0,
  cloudBorderAlpha: 56,
  cloudGlassBlur: 12,
  cloudFontScale: 100,
  cloudTextRgb: '255,255,255',
  cloudBorderRgb: '255,255,255',
  cloudPanelImageEnabled: false,
  cloudHollow: false,
  lyricEnabled: true,
  lyricEmptyMode: 'image',
  lyricX: 0,
  lyricY: 0,
  lyricTilt: -8,
  lyricScale: 100,
  lyricTextRgb: '255,255,255',
  lyricBgAlpha: 0,
  lyricHollow: true,
  lyricOnly: false,
  lyricLayoutIndependent: false,
  lyricLayout: {
    prev: { x: -34, y: -36, scale: 82, opacity: 48, tilt: -4 },
    current: { x: 0, y: 0, scale: 120, opacity: 100, tilt: 0 },
    next: { x: 36, y: 38, scale: 86, opacity: 58, tilt: 4 }
  },
  lyricFloat: true,
  lyricEffect: 'float',
  lyricEffects: { float: true, glow: false, cinema: false },
  lyricGlowRgb: '159,233,239',
  lyricFreeMove: false,
  lyricVolume: 80,
  aiX: 0,
  aiY: 0,
  aiMode: 'full',
  blockStyles: {},
  customBlocks: [],
  cloudPathX: 0,
  cloudPathY: 0,
  cloudClockX: 0,
  cloudClockY: 0,
  cloudClockFont: '',
  cloudClockScale: 100,
  skin: 'xinghui',
  wallpaperLibrary: [],
  wallpaperEngineCount: 0,
  preset: 'polar',
  assignments: {},
  background: { ok: true, url: 'assets/wallpapers/default-mingmo-qianli.mp4', kind: 'video', source: 'orbitdesk-default', path: 'assets/wallpapers/default-mingmo-qianli.mp4', name: '饿殍·明末千里行', readonly: true },
  wallpaperSourceMode: 'library',
  focusDisplay: 'detailed',
  focusX: 50,
  focusY: 50,
  thumbnailX: 50,
  thumbnailY: 54,
  thumbnailCenterX: 50,
  thumbnailCenterY: 54,
  thumbnailEdgeX: 50,
  thumbnailEdgeY: 50,
  thumbnailEnabled: true,
  thumbnailShape: 'rect',
  thumbnailRegion: null,
  favorites: [],
  commandCwd: '',
  newFileDirectory: ''
};
let wallpaperParticles = null;
let spatialShelf = null;
let spatialShelfUnavailable = false;
let activeBackgroundSource = null;
let wallpaperCaptureBlockedUntil = 0;
let orbitRaf = 0;
let orbitStart = performance.now();
let orbitLastFrame = 0;
let orbitNodeCache = [];
let wallpaperWatchTimer = 0;
let wallpaperLibraryLoadedAt = 0;
let wallpaperThumbnailObserver = null;
let wallpaperThumbnailRequest = 0;
let pathRibbonRaf = 0;
let pathRibbonStart = performance.now();
let pathRibbonLastFrame = 0;
let pathRibbonNodes = [];
let lyricRuntime = { key:'', startedAt:0, status:null, lineIndex:-1, elapsedMs:0 };
let embeddedNeteaseAudio = null;
let embeddedNeteaseQueue = { playlistId:'', songs:[], index:-1 };
let embeddedPlaybackSyncAt = 0;
let playlistPanelCloseTimer = 0;
let lastLyricVolume = 80;
let activePlaylistDirection = 'left';
let neteasePlaylistCache = { at: 0, loading: null, result: null };
const neteaseTrackCache = new Map();
let performanceMetrics = null;
let orbitPaused = false;
let orbitPausedAt = 0;
let orbitFrozenId = '';
const orbitFrozenState = new Map();
let activeRegionPicker = null;
let activeParticlePositionPicker = null;
let pointerUiRaf = 0;
let latestPointerUi = null;
let appActive = true;
let foregroundFullscreen = false;
let galaxyYaw = 0;
let galaxyPitch = 0;
let galaxyZoom = 1;
let galaxyCenterX = 50;
let galaxyCenterY = 50;
let dragState = null;
let rightDragState = null;
const iconCache = new Map();
const ICON_CACHE_LIMIT = 128;
const MEMORY_SAFE_BASELINE = true;
let appliedThemeSignature = '';
let iconRequestPromise = null;
let settingsSavePending = null;
let settingsSaveInFlight = null;
function ensureSpatialShelf() {
  if (!spatialShelf && !spatialShelfUnavailable && window.SpatialShelf3D) {
    try {
      spatialShelf = new window.SpatialShelf3D($('#shelf3d'), {
        onSelect: (item,index) => item && selectItem(item,index,{tone:true}),
        onActivate: (item) => item && activateItem(item)
      });
      spatialShelf.setPerspective(state.perspective/100);
      spatialShelf.setScale?.(state.shelfScale/100);
      spatialShelf.setItems(groupItems(state.activeGroup));
    } catch (error) {
      spatialShelf = null;
      spatialShelfUnavailable = true;
      document.body.classList.remove('spatial-shelf-active');
      console.warn('[OrbitDesk] 3D shelf unavailable; using the DOM fallback.', error);
    }
  }
  return spatialShelf;
}
function ensureWallpaperParticles() {
  if (!wallpaperParticles && window.WallpaperParticleStage && state.thumbnailEnabled !== false) {
    try {
      wallpaperParticles = new window.WallpaperParticleStage($('#wallpaper3d'));
      wallpaperParticles.setMotion(state.motion/100);
      wallpaperParticles.setDensity(state.density);
      wallpaperParticles.setFlow(state.flow);
      wallpaperParticles.setParticleMode(state.wallpaperParticleMode);
      wallpaperParticles.setFrameRate?.(state.particleFps,state.inactiveFps);
      wallpaperParticles.setActive?.(appActive);
      wallpaperParticles.setThumbnailPosition?.(state.thumbnailX,state.thumbnailY,state.thumbnailEnabled);
      wallpaperParticles.setThumbnailRegion?.(state.thumbnailRegion ? {...state.thumbnailRegion,shape:state.thumbnailShape} : null);
    } catch (error) {
      wallpaperParticles = null;
      console.warn('[OrbitDesk] wallpaper particle stage unavailable', error);
    }
  }
  return wallpaperParticles;
}
function releaseWallpaperParticles() {
  wallpaperParticles?.dispose?.();
  wallpaperParticles = null;
  $('#wallpaperSpace')?.classList.remove('particle-ready');
}
function setParticleLayerEnabled(enabled, { reloadSource = false } = {}) {
  state.thumbnailEnabled = enabled !== false;
  syncPerformanceClasses();
  const space = $('#wallpaperSpace');
  if (!state.thumbnailEnabled) {
    wallpaperParticles?.setEnabled?.(false);
    wallpaperParticles?.setThumbnailPosition?.(state.thumbnailX, state.thumbnailY, false);
    space?.classList.remove('particle-ready');
    releaseAmbientCanvas(true);
    return true;
  }
  resizeCanvas();
  const stage = ensureWallpaperParticles();
  if (!stage) {
    state.thumbnailEnabled = false;
    syncPerformanceClasses();
    space?.classList.remove('particle-ready');
    return false;
  }
  stage.setEnabled?.(true);
  stage.setThumbnailPosition?.(state.thumbnailX, state.thumbnailY, true);
  space?.classList.add('particle-ready');
  if (reloadSource && activeBackgroundSource) {
    stage.setSource(activeBackgroundSource, activeBackgroundSource.kind === 'video' ? $('#wallpaperVideo') : null);
  }
  return true;
}
function syncPerformanceClasses() {
  document.body.classList.toggle('memory-safe', MEMORY_SAFE_BASELINE);
  document.body.classList.toggle('thumbnail-active', state.thumbnailEnabled !== false);
}

const presets = {
  polar: { name: '极昼', accent: '#9fe9ef', rgb: '159, 233, 239', warm: '#ddc4a0', bg: '#070a0e', swatch: 'linear-gradient(145deg,#17282d,#07090b)' },
  ember: { name: '余烬', accent: '#ffb07a', rgb: '255, 176, 122', warm: '#d45d63', bg: '#0c0808', swatch: 'linear-gradient(145deg,#3b1716,#0b0808)' },
  violet: { name: '引力紫', accent: '#c3b4ff', rgb: '195, 180, 255', warm: '#6ca6d9', bg: '#080811', swatch: 'linear-gradient(145deg,#211d3e,#090912)' }
};
const defaultGroups = [
  {id:'projects',label:'项目星系'},
  {id:'apps',label:'应用程序'},
  {id:'documents',label:'文档资料'},
  {id:'media',label:'视觉素材'},
  {id:'archives',label:'压缩归档'},
  {id:'folders',label:'文件夹'},
  {id:'other',label:'其他'}
];
function displayGroupLabel(groupOrId) {
  const id = typeof groupOrId === 'string' ? groupOrId : groupOrId?.id;
  const fallback = typeof groupOrId === 'string' ? groupOrId : groupOrId?.label;
  if (state.skin !== 'xinghui') return fallback || '全部对象';
  return ({
    projects: '项目集合',
    apps: '应用快捷方式',
    documents: '文档资料',
    media: '视觉素材',
    archives: '压缩归档',
    folders: '文件夹',
    other: '其他对象',
    favorites: '常用',
    all: '全部对象'
  })[id] || fallback || '全部对象';
}

const $ = (selector) => document.querySelector(selector);
const els = {
  groupList: $('#groupList'), primaryOrbitDock: $('#primaryOrbitDock'), desktopMiniGalaxy: $('#desktopMiniGalaxy'), favoriteGalaxyTray: $('#favoriteGalaxyTray'), miniVectorState: $('#miniVectorState'), miniPathLabel: $('#miniPathLabel'), miniObjectCount: $('#miniObjectCount'), miniRouteState: $('#miniRouteState'), itemList: $('#itemList'), orbitNodes: $('#orbitNodes'), stage: $('.stage'),
  stageTitle: $('#stageTitle'), stageEyebrow: $('#stageEyebrow'), stageCaption: $('#stageCaption'),
  shelfTitle: $('#shelfTitle'), shelfCount: $('#shelfCount'), coreTitle: $('#coreTitle'), coreMeta: $('#coreMeta'), coreGlyph: $('#coreGlyph'),
  pathText: $('#pathText'), totalCount: $('#totalCount'), desktopRoot: $('#desktopRoot'), toast: $('#toast'),
  pathRibbonText: $('#pathRibbonText'), pathRibbon: $('#pathRibbon'), coreBackButton: $('#coreBackButton'),
  commandPalette: $('#commandPalette'), commandInput: $('#commandInput'), commandOutput: $('#commandOutput'), styleDrawer: $('#styleDrawer'), wallpaperGrid: $('#wallpaperGrid'), wallpaperSearch: $('#wallpaperSearch'), wallpaperLibraryTitle: $('#wallpaperLibraryTitle'),
  regionPicker: $('#regionPicker'), regionBox: $('#regionBox'),
  particlePositionPicker: $('#particlePositionPicker'), particlePositionTarget: $('#particlePositionTarget'), particlePositionAnchor: $('#particlePositionAnchor'), particlePositionState: $('#particlePositionState'),
  newFileDialog: $('#newFileDialog'), newFileName: $('#newFileName'), newFilePath: $('#newFilePath'),
  cloudDesk: $('#cloudDesk'), cloudGroupList: $('#cloudGroupList'), cloudFileList: $('#cloudFileList'), cloudRootPath: $('#cloudRootPath'), cloudTotalCount: $('#cloudTotalCount'), cloudKicker: $('#cloudKicker'), cloudTitle: $('#cloudTitle'), cloudCaption: $('#cloudCaption'), cloudPathButton: $('#cloudPathButton'), cloudPathText: $('#cloudPathText'), cloudListTitle: $('#cloudListTitle'), cloudCountBadge: $('#cloudCountBadge'), cloudFocusTitle: $('#cloudFocusTitle'), cloudFocusMeta: $('#cloudFocusMeta'), cloudOpenButton: $('#cloudOpenButton'), cloudRevealButton: $('#cloudRevealButton'), cloudCopyButton: $('#cloudCopyButton'), cloudContextMenu: $('#cloudContextMenu'), cloudClockTime: $('#cloudClockTime'), cloudClockDate: $('#cloudClockDate'), cloudBlockSettings: $('#cloudBlockSettings'), cloudBlockSettingsTitle: $('#cloudBlockSettingsTitle'), lyricWidget: $('#lyricWidget'), lyricLinePrev: $('#lyricLinePrev'), lyricLineA: $('#lyricLineA'), lyricLineB: $('#lyricLineB'), lyricStatus: $('#lyricStatus'), lyricCover: $('#lyricCover'), lyricSongTitle: $('#lyricSongTitle'), lyricSongArtist: $('#lyricSongArtist')
};

const canvas = $('#space');
const ctx = canvas?.getContext('2d', { alpha: true, desynchronized: true }) || null;
let particles = [];
let raf = 0;
let ambientIdleTimer = 0;
let lastCanvasDraw = 0;
let time = 0;

function shouldDrawAmbientParticles() {
  return !!(canvas && ctx && !wallpaperParticles && state.thumbnailEnabled !== false && appActive && !document.hidden && state.motion > 0);
}

function releaseAmbientCanvas(compact = false) {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  if (ctx && canvas) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    if (compact && (canvas.width !== 1 || canvas.height !== 1)) {
      canvas.width = 1;
      canvas.height = 1;
    }
  }
}

function resizeCanvas() {
  if (!canvas || !ctx) return;
  const cssWidth = Math.max(1, innerWidth);
  const cssHeight = Math.max(1, innerHeight);
  const desiredRatio = Math.min(1.25, Math.max(1, window.devicePixelRatio || 1));
  const pixelBudgetRatio = Math.sqrt(1800000 / Math.max(1, cssWidth * cssHeight));
  const ratio = Math.max(.65, Math.min(desiredRatio, pixelBudgetRatio));
  const nextWidth = Math.round(cssWidth * ratio);
  const nextHeight = Math.round(cssHeight * ratio);
  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawParticles();
  }
}

function upgradePathRibbon() {
  if (!els.pathRibbon || els.pathRibbon.tagName.toLowerCase() === 'svg') return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'path-ribbon');
  svg.setAttribute('id', 'pathRibbon');
  svg.setAttribute('title', '点击复制路径，双击返回上一级');
  svg.setAttribute('viewBox', '0 0 320 320');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', '当前路径');
  svg.innerHTML = '<defs><path id="pathRibbonCurve" d="M 286 160 a 126 48 0 1 0 -252 0 a 126 48 0 1 0 252 0"></path><radialGradient id="pathRibbonSeam" cx="89.5%" cy="50%" r="16%"><stop offset="0%" stop-color="black"></stop><stop offset="52%" stop-color="black"></stop><stop offset="100%" stop-color="white"></stop></radialGradient><mask id="pathRibbonMask" maskUnits="userSpaceOnUse" x="0" y="0" width="320" height="320"><rect width="320" height="320" fill="white"></rect><rect x="232" y="96" width="86" height="128" fill="url(#pathRibbonSeam)"></rect></mask></defs><g id="pathRibbonTextGroup" mask="url(#pathRibbonMask)"><text><textPath id="pathRibbonText" href="#pathRibbonCurve" startOffset="115%">DESKTOP ·</textPath></text><text><textPath class="pathRibbonTextClone" href="#pathRibbonCurve" startOffset="65%">DESKTOP ·</textPath></text><text><textPath class="pathRibbonTextClone" href="#pathRibbonCurve" startOffset="15%">DESKTOP ·</textPath></text><text><textPath class="pathRibbonTextClone" href="#pathRibbonCurve" startOffset="-35%">DESKTOP ·</textPath></text></g>';
  els.pathRibbon.replaceWith(svg);
  els.pathRibbon = svg;
  els.pathRibbonText = svg.querySelector('#pathRibbonText');
  pathRibbonNodes = [els.pathRibbonText, ...svg.querySelectorAll('.pathRibbonTextClone')];
}

function setPathRibbonText(value) {
  if (!els.pathRibbonText) return;
  const clean = String(value || 'DESKTOP').trim() || 'DESKTOP';
  const label = `${clean}  ·  `;
  if (!pathRibbonNodes.length) pathRibbonNodes = [els.pathRibbonText,...els.pathRibbon.querySelectorAll('.pathRibbonTextClone')];
  pathRibbonNodes.forEach((node)=>{node.textContent=label});
}
function animatePathRibbon(now=performance.now()) {
  if (!els.pathRibbonText || !els.pathRibbon?.isConnected) { pathRibbonRaf=requestAnimationFrame(animatePathRibbon); return; }
  const visible = document.body.classList.contains('peek-top') || document.body.classList.contains('ui-pinned');
  const fps = appActive && visible ? 30 : 5;
  if (now - pathRibbonLastFrame < 1000 / fps) { pathRibbonRaf=requestAnimationFrame(animatePathRibbon); return; }
  pathRibbonLastFrame = now;
  const speed=Math.max(50,Number(state.pathSpeed)||115)/100;
  const duration=26000/speed;
  const travel=150;
  const phase=((now-pathRibbonStart)%duration)/duration*travel;
  if (!pathRibbonNodes.length) pathRibbonNodes = [els.pathRibbonText,...els.pathRibbon.querySelectorAll('.pathRibbonTextClone')];
  pathRibbonNodes.forEach((node,index)=>{
    node.setAttribute('startOffset', `${(115 - ((phase + index * 37.5) % travel)).toFixed(2)}%`);
  });
  pathRibbonRaf=requestAnimationFrame(animatePathRibbon);
}

function effectiveKind(item) { return state.assignments[item.path] || item.kind || (item.isDirectory ? 'folders' : 'other'); }
function shortType(item) { return item.isDirectory ? (effectiveKind(item) === 'projects' ? 'PROJECT' : 'DIR') : (item.extension || 'FILE'); }
function initials(name) {
  const clean = String(name).replace(/\.[^.]+$/, '').trim();
  if (/^[\u4e00-\u9fa5]/.test(clean)) return clean.slice(0, 2);
  return clean.split(/[\s_-]+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'OD';
}
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char])); }
const categoryIcons = {
  favorites: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.6l2.98 6.04 6.67.97-4.82 4.7 1.14 6.64L12 17.72l-5.96 3.13 1.13-6.64-4.82-4.7 6.67-.97z"/></svg>`,
  projects: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>`,
  apps: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="7" height="7" x="3" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="14" rx="1.5"/><rect width="7" height="7" x="3" y="14" rx="1.5"/></svg>`,
  documents: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`,
  media: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
  archives: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>`,
  folders: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`,
  other: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>`
};
function categoryIcon(id) { return `<span class="category-icon ${escapeHtml(id || 'other')}">${categoryIcons[id] || categoryIcons.other}</span>`; }
function formatSize(bytes) { if (!bytes) return '—'; const units=['B','KB','MB','GB']; const i=Math.min(3,Math.floor(Math.log(bytes)/Math.log(1024))); return `${(bytes/1024**i).toFixed(i?1:0)} ${units[i]}`; }
function parentOfPath(value) {
  const input = String(value || '').replace(/[\\/]+$/, '');
  if (!input || input === '此电脑') return '';
  if (/^[A-Za-z]:$/.test(input)) return '此电脑';
  const index = Math.max(input.lastIndexOf('\\'), input.lastIndexOf('/'));
  if (index <= 2 && /^[A-Za-z]:/.test(input)) return `${input.slice(0, 2)}\\`;
  return index > 0 ? input.slice(0, index) : '';
}
function toast(message, options = {}) {
  els.toast.textContent = message;
  els.toast.classList.toggle('pointer-toast', options.pointer === true);
  if (options.pointer && latestPointerUi) {
    els.toast.style.left = `${latestPointerUi.clientX}px`;
    els.toast.style.top = `${latestPointerUi.clientY - 38}px`;
    els.toast.style.bottom = 'auto';
  } else {
    els.toast.style.left = '50%';
    els.toast.style.top = 'auto';
    els.toast.style.bottom = '22px';
  }
  els.toast.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>els.toast.classList.remove('show','pointer-toast'),1500);
}
function currentPathName() {
  const value = String(state.currentPath || '').replace(/[\\/]+$/, '');
  if (!value) return 'DESKTOP';
  if (value === '此电脑') return '此电脑';
  if (/^[A-Za-z]:$/.test(value)) return `${value}\\`;
  return value.split(/[\\/]/).filter(Boolean).pop() || value;
}
function setCoreToCurrentPath(items = []) {
  const title = currentPathName();
  els.coreTitle.textContent = title;
  els.coreMeta.textContent = `${items.length} 个对象`;
  els.coreGlyph.textContent = initials(title);
}
function isDesktopPath() {
  return !!state.payload.roots[0] && state.currentPath === state.payload.roots[0] && !state.currentItems;
}
function syncDesktopMiniGalaxy(items = groupItems(state.activeGroup)) {
  const atHome = isDesktopPath();
  document.body.classList.toggle('away-from-desktop', !atHome);
  if (els.miniVectorState) els.miniVectorState.textContent = atHome ? 'HOME' : 'RETURN';
  if (els.miniPathLabel) els.miniPathLabel.textContent = atHome ? 'Desktop' : currentPathName();
  if (els.miniObjectCount) els.miniObjectCount.textContent = String(items.length || 0).padStart(2, '0');
  if (els.miniRouteState) els.miniRouteState.textContent = atHome ? 'READY' : 'OPEN';
  els.desktopMiniGalaxy?.setAttribute('aria-label', atHome ? '桌面根目录，当前已到达' : `从 ${currentPathName()} 返回桌面根目录`);
}
function sourceKey(source) {
  return [source?.source || '', source?.kind || '', source?.packagePath || source?.path || source?.url || source?.preview || ''].join('|');
}
function isWallpaperEngineSource(source) {
  return /^wallpaper-engine/.test(String(source?.source || ''));
}
function builtInWallpaperFallback() {
  return {
    ok: true,
    url: 'assets/wallpapers/default-mingmo-qianli.mp4',
    kind: 'video',
    source: 'orbitdesk-default',
    path: 'assets/wallpapers/default-mingmo-qianli.mp4',
    name: '饿殍·明末千里行',
    readonly: true
  };
}
function uiTone(type = 'select', index = 0) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  uiTone.ctx ||= new AudioCtx();
  const ctx=uiTone.ctx; ctx.resume?.();
  const now=ctx.currentTime;
  const master=ctx.createGain();
  const filter=ctx.createBiquadFilter();
  const compressor=ctx.createDynamicsCompressor();
  filter.type='lowpass';
  filter.frequency.value=type==='hover'?4200:5200;
  filter.Q.value=.72;
  master.gain.setValueAtTime(.0001,now);
  master.gain.exponentialRampToValueAtTime(type==='hover' ? .010 : type==='tap' ? .016 : .020,now+.008);
  master.gain.exponentialRampToValueAtTime(.0001,now+(type==='hover' ? .052 : .115));
  filter.connect(compressor).connect(master).connect(ctx.destination);
  const bank = type==='hover'
    ? [{ f: 720 + (index % 5) * 22, to: 880, wave: 'sine', gain: .18, end: .050 }]
    : type==='tap'
      ? [{ f: 380, to: 520, wave: 'sine', gain: .16, end: .070 }, { f: 1280, to: 960, wave: 'triangle', gain: .10, end: .056 }]
      : [{ f: 520 + index * 6, to: 700, wave: 'sine', gain: .16, end: .095 }, { f: 1040 + index * 9, to: 1320, wave: 'triangle', gain: .10, end: .082 }];
  bank.forEach((layer)=>{const oscillator=ctx.createOscillator();const gain=ctx.createGain();oscillator.type=layer.wave;oscillator.frequency.setValueAtTime(layer.f,now);oscillator.frequency.exponentialRampToValueAtTime(layer.to,now+layer.end*.72);gain.gain.setValueAtTime(layer.gain,now);gain.gain.exponentialRampToValueAtTime(.0001,now+layer.end);oscillator.connect(gain).connect(filter);oscillator.start(now);oscillator.stop(now+layer.end+.015)});
}
function clickTone(index = 0) {
  uiTone('select', index);
}

function settingsSnapshot() {
  return { version: 9, preset: state.preset, skin: state.skin, motion: state.motion, density: state.density, particleFps: state.particleFps, inactiveFps: state.inactiveFps, loadSpeed: state.loadSpeed, loadGap: state.loadGap, flow: state.flow, wallpaperParticleMode: state.wallpaperParticleMode, wallpaperSourceMode: state.wallpaperSourceMode, focusDisplay: state.focusDisplay, focusX: state.focusX, focusY: state.focusY, thumbnailX: state.thumbnailX, thumbnailY: state.thumbnailY, thumbnailCenterX: state.thumbnailCenterX, thumbnailCenterY: state.thumbnailCenterY, thumbnailEdgeX: state.thumbnailEdgeX, thumbnailEdgeY: state.thumbnailEdgeY, thumbnailEnabled: state.thumbnailEnabled, thumbnailShape: state.thumbnailShape, thumbnailRegion: state.thumbnailRegion, favorites: state.favorites, pathSpeed: state.pathSpeed, wallpaperOpacity: state.wallpaperOpacity, wallpaperBrightness: state.wallpaperBrightness, wallpaperSaturation: state.wallpaperSaturation, particleOpacity: state.particleOpacity, wallpaperBlur: state.wallpaperBlur, panelBlur: state.panelBlur, perspective: state.perspective, shelfScale: state.shelfScale, themeHue: state.themeHue, themeSat: state.themeSat, themeAlpha: state.themeAlpha, themeRgb: state.themeRgb, themeMode: state.themeMode, cloudGlassAlpha: state.cloudGlassAlpha, cloudBorderAlpha: state.cloudBorderAlpha, cloudGlassBlur: state.cloudGlassBlur, cloudFontScale: state.cloudFontScale, cloudTextRgb: state.cloudTextRgb, cloudBorderRgb: state.cloudBorderRgb, cloudPanelImageEnabled: state.cloudPanelImageEnabled, cloudHollow: state.cloudHollow, lyricEnabled: state.lyricEnabled, lyricEmptyMode: state.lyricEmptyMode, lyricX: state.lyricX, lyricY: state.lyricY, lyricTilt: state.lyricTilt, lyricScale: state.lyricScale, lyricTextRgb: state.lyricTextRgb, lyricBgAlpha: state.lyricBgAlpha, lyricHollow: state.lyricHollow, lyricOnly: state.lyricOnly, lyricLayoutIndependent: state.lyricLayoutIndependent, lyricLayout: state.lyricLayout, lyricFloat: state.lyricFloat, lyricEffect: state.lyricEffect, lyricEffects: state.lyricEffects, lyricGlowRgb: state.lyricGlowRgb, lyricFreeMove: state.lyricFreeMove, lyricVolume: state.lyricVolume, aiX: state.aiX, aiY: state.aiY, aiMode: aiMode, blockStyles: state.blockStyles, customBlocks: state.customBlocks, cloudPathX: state.cloudPathX, cloudPathY: state.cloudPathY, cloudClockX: state.cloudClockX, cloudClockY: state.cloudClockY, cloudClockFont: state.cloudClockFont, cloudClockScale: state.cloudClockScale, assignments: state.assignments, background: state.background, newFileDirectory: state.newFileDirectory };
}
async function flushSettingsSaveQueue() {
  while (settingsSavePending) {
    const snapshot = settingsSavePending;
    settingsSavePending = null;
    await api.settings.save(snapshot);
  }
}
function saveSettings() {
  settingsSavePending = settingsSnapshot();
  if (!settingsSaveInFlight) {
    settingsSaveInFlight = flushSettingsSaveQueue().finally(() => {
      settingsSaveInFlight = null;
      if (settingsSavePending) persistSettings();
    });
  }
  return settingsSaveInFlight;
}
function persistSettings() {
  void saveSettings().catch((error) => console.warn('[OrbitDesk] settings save failed', error));
}
function requestKeyboardFocus(reason = 'renderer-interaction') {
  if (typeof api.requestKeyboardFocus !== 'function') return Promise.resolve({ ok: false, unavailable: true });
  return Promise.resolve(api.requestKeyboardFocus(reason)).catch((error) => {
    console.warn('[OrbitDesk] native keyboard focus request failed', error);
    return { ok: false, error: error?.message || String(error) };
  });
}
function parseRgb(value){const match=String(value||'').match(/\d+(\.\d+)?/g);if(!match||match.length<3)return null;return match.slice(0,3).map((part)=>Math.max(0,Math.min(255,Math.round(Number(part)||0))))}
function rgbToHex(value){const rgb=parseRgb(value)||[255,255,255];return `#${rgb.map((part)=>part.toString(16).padStart(2,'0')).join('')}`}
function hexToRgb(value){const clean=String(value||'').trim().replace(/^#/,'');if(!/^[0-9a-f]{6}$/i.test(clean))return null;return [0,2,4].map((index)=>parseInt(clean.slice(index,index+2),16))}
function normalizeLyricEffects(){
  const legacy = ['float','glow','cinema','none'].includes(state.lyricEffect) ? state.lyricEffect : 'float';
  const source = state.lyricEffects && typeof state.lyricEffects === 'object' ? state.lyricEffects : {};
  const hasExplicit = ['float','glow','cinema'].some((key)=>Object.prototype.hasOwnProperty.call(source,key));
  state.lyricEffects = {
    float: hasExplicit ? source.float === true : legacy !== 'none' && state.lyricFloat !== false,
    glow: hasExplicit ? source.glow === true : legacy === 'glow',
    cinema: hasExplicit ? source.cinema === true : legacy === 'cinema'
  };
  state.lyricFloat = state.lyricEffects.float;
  state.lyricEffect = state.lyricEffects.glow ? 'glow' : state.lyricEffects.cinema ? 'cinema' : state.lyricEffects.float ? 'float' : 'none';
  state.lyricGlowRgb = (parseRgb(state.lyricGlowRgb) || parseRgb(state.themeRgb) || [159,233,239]).join(',');
}
function defaultLyricLineLayout(role){
  if(role === 'prev') return { x:-34, y:-36, scale:82, opacity:48, tilt:-4 };
  if(role === 'next') return { x:36, y:38, scale:86, opacity:58, tilt:4 };
  return { x:0, y:0, scale:120, opacity:100, tilt:0 };
}
function normalizeLyricLayout(){
  const source = state.lyricLayout && typeof state.lyricLayout === 'object' && !Array.isArray(state.lyricLayout) ? state.lyricLayout : {};
  state.lyricLayout = {};
  ['prev','current','next'].forEach((role)=>{
    const defaults = defaultLyricLineLayout(role);
    const row = source[role] && typeof source[role] === 'object' ? source[role] : {};
    state.lyricLayout[role] = {
      x: clampNumber(row.x, -260, 260, defaults.x),
      y: clampNumber(row.y, -180, 180, defaults.y),
      scale: clampNumber(row.scale, 40, 220, defaults.scale),
      opacity: clampNumber(row.opacity, 0, 100, defaults.opacity),
      tilt: clampNumber(row.tilt, -35, 35, defaults.tilt)
    };
  });
}
function applyLyricLineLayout(){
  normalizeLyricLayout();
  const pairs = [
    [els.lyricLinePrev, state.lyricLayout.prev],
    [els.lyricLineA, state.lyricLayout.current],
    [els.lyricLineB, state.lyricLayout.next]
  ];
  pairs.forEach(([node, layout])=>{
    if(!node || !layout) return;
    node.style.setProperty('--line-x', `${layout.x}px`);
    node.style.setProperty('--line-y', `${layout.y}px`);
    node.style.setProperty('--line-scale', String(layout.scale / 100));
    node.style.setProperty('--line-opacity', String(layout.opacity / 100));
    node.style.setProperty('--line-tilt', `${layout.tilt}deg`);
  });
}
function blockStyleKey(target){return String(target || 'block').replace(/[^\w-]/g,'-') || 'block'}
function blockStyle(target){
  const key = blockStyleKey(target);
  if(!state.blockStyles || typeof state.blockStyles !== 'object' || Array.isArray(state.blockStyles)) state.blockStyles = {};
  if(!state.blockStyles[key] || typeof state.blockStyles[key] !== 'object') state.blockStyles[key] = {};
  return state.blockStyles[key];
}
function cssEscape(value){return window.CSS?.escape ? CSS.escape(value) : String(value).replace(/["\\]/g,'\\$&')}
function findCloudBlockByTarget(target){
  const key = blockStyleKey(target);
  return document.querySelector(`[data-cloud-block="${cssEscape(key)}"]`)
    || document.querySelector(`[data-cloud-block="${cssEscape(target)}"]`)
    || document.getElementById(key)
    || document.querySelector(`.${cssEscape(key)}`)
    || (key === 'lyric-widget' ? els.lyricWidget : null);
}
function sourcePreviewUrl(source){return source?.dataUrl || source?.url || source?.preview || source?.thumbnailUrl || ''}
function sourceDisplayName(source){return source?.name || source?.sourceLabel || source?.source || source?.path || '自定义背景'}
function ensureCustomBlockLayer(){
  let layer = $('#customBlockLayer');
  if(!layer){
    layer = document.createElement('div');
    layer.id = 'customBlockLayer';
    layer.className = 'custom-block-layer';
    document.body.appendChild(layer);
  }
  return layer;
}
function customBlockTarget(id){return `custom-block-${String(id || '').replace(/[^\w-]/g,'-')}`}
function customBlockByTarget(target){
  const key = blockStyleKey(target);
  const id = key.startsWith('custom-block-') ? key.slice('custom-block-'.length) : '';
  return state.customBlocks?.find?.((block)=>block.id===id) || null;
}
function visualAssetFromSource(source){
  const url = sourcePreviewUrl(source);
  if(!url) return null;
  const kind = source?.kind === 'video' ? 'video' : source?.kind === 'animated-image' ? 'animated-image' : 'image';
  return { path:source.path || '', url, kind, name:sourceDisplayName(source), width:source.width, height:source.height };
}
function customBlockAspect(block){
  const width = Number(block?.asset?.width);
  const height = Number(block?.asset?.height);
  return width > 0 && height > 0 ? width / height : 0;
}
function customAssetGeometry(block, frameW, frameH, aspect){
  const fit = block.fit === 'contain' ? 'contain' : 'cover';
  const nx = clampNumber(block.assetX, 0, 100, 50) / 100 - 0.5;
  const ny = clampNumber(block.assetY, 0, 100, 50) / 100 - 0.5;
  let w = frameW, h = frameH, maxX = 0, maxY = 0;
  if(aspect && aspect > 0 && frameW > 0 && frameH > 0){
    const frameAspect = frameW / frameH;
    if(fit === 'cover'){
      // 裁剪铺满：以“铺满帧”的尺寸为基准放大，元素本身撑到 cw×zoom、ch×zoom，
      // 再按溢出量钳制平移，保证放大后仍铺满块、不露白。
      const scale = clampNumber(block.assetScale, 100, 260, 100) / 100;
      let cw, ch;
      if(aspect > frameAspect){ cw = aspect * frameH; ch = frameH; }
      else { cw = frameW; ch = frameW / aspect; }
      w = cw * scale; h = ch * scale;
      maxX = Math.max(0, (w - frameW) / 2);
      maxY = Math.max(0, (h - frameH) / 2);
    } else {
      // 等比例完整：整图完整显示，保持在块内可平移（不裁切、不缩水）。
      let iw, ih;
      if(aspect > frameAspect){ iw = frameW; ih = frameW / aspect; }
      else { iw = aspect * frameH; ih = frameH; }
      w = iw; h = ih;
      maxX = Math.max(0, (frameW - iw) / 2);
      maxY = Math.max(0, (frameH - ih) / 2);
    }
  }
  return { w, h, x: nx * 2 * maxX, y: ny * 2 * maxY, maxX, maxY };
}
function customAssetAspect(block, media){
  const base = customBlockAspect(block);
  if(base > 0) return base;
  if(media){
    const w = media.naturalWidth || media.videoWidth || 0;
    const h = media.naturalHeight || media.videoHeight || 0;
    if(w > 0 && h > 0) return w / h;
  }
  return 0;
}
function applyCustomAssetTransform(media, block){
  const bodyNode = media.parentElement;
  const frameW = bodyNode ? bodyNode.offsetWidth : 0;
  const frameH = bodyNode ? bodyNode.offsetHeight : 0;
  if(frameW < 1 || frameH < 1) return;
  const geo = customAssetGeometry(block, frameW, frameH, customAssetAspect(block, media));
  media.style.setProperty('--custom-asset-w', `${geo.w.toFixed(1)}px`);
  media.style.setProperty('--custom-asset-h', `${geo.h.toFixed(1)}px`);
  media.style.setProperty('--custom-asset-x', `${geo.x.toFixed(1)}px`);
  media.style.setProperty('--custom-asset-y', `${geo.y.toFixed(1)}px`);
}
function syncVisualBlockAsset(target, source){
  const block = customBlockByTarget(target);
  if(!block || !['image','media'].includes(block.type)) return;
  const asset = visualAssetFromSource(source);
  if(!asset) return;
  block.asset = asset;
  renderCustomBlocks();
}
function setBlockBackgroundSource(target, source){
  const style = blockStyle(target);
  if(source) style.background = {...source};
  else delete style.background;
  syncVisualBlockAsset(target, source);
  applyBlockStyles();
  persistSettings();
}
function formatBytesPerSecond(value){
  const bytes = Math.max(0, Number(value) || 0);
  const units = ['B/s','KB/s','MB/s','GB/s'];
  let size = bytes;
  let index = 0;
  while(size >= 1024 && index < units.length - 1){size /= 1024; index += 1;}
  return `${size >= 100 ? size.toFixed(0) : size >= 10 ? size.toFixed(1) : size.toFixed(2)} ${units[index]}`;
}
function renderPerformanceBlockContent(){
  const metric = performanceMetrics;
  const cpu = Math.round(Number(metric?.cpuPercent || 0));
  const mem = Math.round(Number(metric?.memory?.percent || 0));
  const rx = formatBytesPerSecond(metric?.network?.rxPerSec || 0);
  const tx = formatBytesPerSecond(metric?.network?.txPerSec || 0);
  return `<div class="performance-widget">
    <div class="perf-orb" style="--cpu:${cpu}%;--mem:${mem}%">
      <span>${cpu}<small>%</small></span>
      <em>CPU</em>
    </div>
    <div class="perf-lines">
      <label><span>MEM</span><b>${mem}%</b><i style="--value:${mem}%"></i></label>
      <label><span>DOWN</span><b>${rx}</b><i style="--value:${Math.min(100,Math.max(4,(Number(metric?.network?.rxPerSec||0)/1048576)*24))}%"></i></label>
      <label><span>UP</span><b>${tx}</b><i style="--value:${Math.min(100,Math.max(4,(Number(metric?.network?.txPerSec||0)/1048576)*24))}%"></i></label>
    </div>
  </div>`;
}
function customBlockDefaults(type){
  const base = { id:`block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`, type, title:'新建块', x: Math.round(innerWidth * .58), y: Math.round(innerHeight * .26), width: 320, height: 190, blockScale:100, radius:18, text:'双击或进入块设置修改内容', asset:null, fit:'cover', padding:12, hollow:false, hideChrome:false, createdAt:Date.now() };
  if(type==='media') return {...base,title:'媒体播放器',text:'',width:360,height:220,fit:'contain',padding:0,hideChrome:false};
  if(type==='image') return {...base,title:'图片加载器',text:'',width:260,height:260,fit:'contain',padding:0,hideChrome:false};
  if(type==='music') return {...base,title:'音乐播放器',width:360,height:160};
  if(type==='performance') return {...base,title:'性能监控',width:330,height:180,text:'',hideChrome:true,hollow:true};
  if(type==='launcher') return {...base,title:'快捷方式启动器',width:280,height:140};
  if(type==='text') return {...base,title:'文本播放器',width:320,height:180};
  if(type==='ai') return {...base,title:'AI 调用器',width:360,height:190,text:'输入 API 后可接入对话 / 摘要 / 指令。'};
  return base;
}
function renderCustomBlocks(){
  const layer = ensureCustomBlockLayer();
  state.customBlocks = Array.isArray(state.customBlocks) ? state.customBlocks : [];
  layer.innerHTML = state.customBlocks.map((block)=>{
    const target = customBlockTarget(block.id);
    const style = blockStyle(target);
    const x = finiteNumber(style.x, block.x ?? innerWidth * .58);
    const y = finiteNumber(style.y, block.y ?? innerHeight * .26);
    const blockScale = clampNumber(block.blockScale, 50, 220, 100) / 100;
    const width = Math.round(clampNumber(block.width, 120, 900, 320) * blockScale);
    const height = Math.round(clampNumber(block.height, 80, 720, 180) * blockScale);
    const asset = block.asset || {};
    const fit = block.fit === 'contain' ? 'contain' : 'cover';
    const padding = clampNumber(block.padding, 0, 96, ['media','image'].includes(block.type) ? 0 : 12);
    const radius = clampNumber(block.radius, 0, 80, 18);
    const hasVisualAsset = !!(asset.url && ['video','animated-image','image'].includes(asset.kind));
    const contentOnly = block.hideChrome === true || block.hollow === true;
    const hollow = block.hollow === true;
    const media = asset.url && ['video','animated-image','image'].includes(asset.kind)
      ? asset.kind === 'video'
        ? `<video src="${escapeHtml(asset.url)}" autoplay loop muted playsinline style="--custom-asset-w:100%;--custom-asset-h:100%;--custom-asset-x:0px;--custom-asset-y:0px"></video>`
        : `<img src="${escapeHtml(asset.url)}" alt="" style="--custom-asset-w:100%;--custom-asset-h:100%;--custom-asset-x:0px;--custom-asset-y:0px">`
      : '';
    const text = block.type === 'text' || block.type === 'ai' || block.type === 'launcher' ? `<p>${escapeHtml(block.text || '')}</p>` : '';
    const music = block.type === 'music' ? `<div class="custom-block-music"><span>网易云内置播放器</span><small>歌单 / 点播接口预留</small></div>` : '';
    const performance = block.type === 'performance' ? renderPerformanceBlockContent() : '';
    const fallback = ['media','image'].includes(block.type) ? '' : `<small>${escapeHtml(block.title || '自定义块')}</small>`;
    return `<section class="custom-desk-block ${contentOnly?'custom-block-content-only':''} ${hollow?'custom-block-hollow':''} ${hasVisualAsset?'custom-block-visual':''}" data-cloud-block="${escapeHtml(target)}" data-custom-block-id="${escapeHtml(block.id)}" style="left:${x}px;top:${y}px;width:${width}px;height:${height}px;--custom-block-fit:${fit};--custom-block-padding:${padding}px;--custom-block-radius:${radius}px">
      <header><b>${escapeHtml(block.title || '自定义块')}</b><button type="button" data-custom-remove="${escapeHtml(block.id)}">×</button></header>
      <div class="custom-block-body">${media || performance || music || text || fallback}</div>
    </section>`;
  }).join('');
  layer.querySelectorAll('[data-custom-remove]').forEach((button)=>button.addEventListener('click',(event)=>{
    event.stopPropagation();
    state.customBlocks = state.customBlocks.filter((block)=>block.id !== button.dataset.customRemove);
    renderCustomBlocks();
    persistSettings();
  }));
  bindCustomBlockContentAdjustments(layer);
  applyBlockStyles();
}
async function refreshPerformanceMetrics(){
  const hasBlock = Array.isArray(state.customBlocks) && state.customBlocks.some((block)=>block.type === 'performance');
  if(!hasBlock) return;
  const result = await api.system?.metrics?.().catch(()=>null);
  if(!result?.ok) return;
  performanceMetrics = result;
  document.querySelectorAll('.custom-desk-block[data-custom-block-id]').forEach((node)=>{
    const block = state.customBlocks.find((entry)=>entry.id === node.dataset.customBlockId);
    if(block?.type !== 'performance') return;
    const body = node.querySelector('.custom-block-body');
    if(body) body.innerHTML = renderPerformanceBlockContent();
  });
}
function bindCustomBlockContentAdjustments(layer){
  layer.querySelectorAll('.custom-desk-block img,.custom-desk-block video').forEach((media)=>{
    const blockNode = media.closest('.custom-desk-block');
    const block = state.customBlocks.find((entry)=>entry.id===blockNode?.dataset.customBlockId);
    if(!block || !['image','media'].includes(block.type)) return;
    const frameRect = ()=>{
      const bodyNode = media.parentElement;
      return (bodyNode && bodyNode.offsetWidth >= 1 && bodyNode.offsetHeight >= 1)
        ? { width: bodyNode.offsetWidth, height: bodyNode.offsetHeight }
        : null;
    };
    // 初次渲染后按真实尺寸回填位移（图片加载完成后再校正一次，拿到真实宽高比）。
    applyCustomAssetTransform(media, block);
    media.addEventListener('load', ()=>applyCustomAssetTransform(media, block));
    media.addEventListener('loadeddata', ()=>applyCustomAssetTransform(media, block));
    media.addEventListener('pointerdown',(event)=>{
      if(event.button!==0 || event.ctrlKey || event.altKey || event.shiftKey) return;
      event.preventDefault();
      event.stopPropagation();
      const frame = frameRect();
      if(!frame) return;
      const geo = customAssetGeometry(block, frame.width, frame.height, customAssetAspect(block, media));
      const start = { id:event.pointerId, x:event.clientX, y:event.clientY, tx:geo.x, ty:geo.y, maxX:geo.maxX, maxY:geo.maxY };
      media.classList.add('custom-asset-dragging');
      media.setPointerCapture?.(event.pointerId);
      const move=(moveEvent)=>{
        if(moveEvent.pointerId!==start.id) return;
        moveEvent.preventDefault();
        const tx = start.maxX > 0 ? Math.max(-start.maxX, Math.min(start.maxX, start.tx + (moveEvent.clientX - start.x))) : 0;
        const ty = start.maxY > 0 ? Math.max(-start.maxY, Math.min(start.maxY, start.ty + (moveEvent.clientY - start.y))) : 0;
        block.assetX = start.maxX > 0 ? ((tx / start.maxX) / 2 + 0.5) * 100 : 50;
        block.assetY = start.maxY > 0 ? ((ty / start.maxY) / 2 + 0.5) * 100 : 50;
        media.style.setProperty('--custom-asset-x', `${tx.toFixed(1)}px`);
        media.style.setProperty('--custom-asset-y', `${ty.toFixed(1)}px`);
      };
      const stop=(stopEvent)=>{
        if(stopEvent.pointerId!==start.id) return;
        media.classList.remove('custom-asset-dragging');
        media.removeEventListener('pointermove',move);
        media.removeEventListener('pointerup',stop);
        media.removeEventListener('pointercancel',stop);
        persistSettings();
      };
      media.addEventListener('pointermove',move);
      media.addEventListener('pointerup',stop);
      media.addEventListener('pointercancel',stop);
    });
    // 等比例完整（contain）不缩放；裁剪铺满（cover）需按住 Ctrl 再滚轮缩放，
    // 避免拖动时触控板/滚轮误触发把图片缩水。
    if(block.fit !== 'contain'){
      media.addEventListener('wheel',(event)=>{
        if(!event.ctrlKey) return;
        event.preventDefault();
        event.stopPropagation();
        const next = clampNumber((Number(block.assetScale) || 100) + (event.deltaY < 0 ? 8 : -8), 100, 260, 100);
        block.assetScale = next;
        applyCustomAssetTransform(media, block);
        persistSettings();
      },{passive:false});
    }
  });
}
function showCreateBlockPanel(anchor){
  const types = [
    ['media','媒体播放器','播放视频 / GIF / 动图'],
    ['image','图片加载器','展示图片、照片、头像'],
    ['music','音乐播放器','网易云内置播放器入口'],
    ['performance','性能监控','CPU / 内存 / 网络流速'],
    ['launcher','快捷方式启动器','放常用程序或项目入口'],
    ['text','文本播放器','固定显示文本内容'],
    ['ai','AI 调用器','API 配置入口预留']
  ];
  const panel = showSidePanel(anchor, 'create-block-side-panel', `<b>新建块</b>${types.map(([type,title,desc])=>`<button type="button" data-create-block="${type}"><strong>${title}</strong><small>${desc}</small></button>`).join('')}`);
  panel.querySelectorAll('[data-create-block]').forEach((button)=>button.addEventListener('click',()=>{
    const block = customBlockDefaults(button.dataset.createBlock);
    state.customBlocks = [block, ...(Array.isArray(state.customBlocks)?state.customBlocks:[])].slice(0, 24);
    const style = blockStyle(customBlockTarget(block.id));
    style.x = block.x; style.y = block.y; style.tilt = 0;
    renderCustomBlocks();
    persistSettings();
    closeCloudSidePanels();
  }));
}
function updateNeteaseProfile(profile){
  const avatar = document.querySelector('.cloud-avatar');
  const url = profile?.avatarUrl || profile?.avatarDetail?.identityIconUrl || '';
  const name = profile?.nickname || profile?.userName || '';
  if(avatar){
    avatar.textContent = '';
    avatar.style.backgroundImage = url ? `url("${String(url).replace(/"/g,'%22')}")` : '';
    avatar.classList.toggle('has-netease-avatar', !!url);
  }
  const profileTitle = document.querySelector('.cloud-profile strong');
  if(profileTitle) profileTitle.textContent = name;
  updateNeteaseLoginButton(profile);
}
function updateNeteaseLoginButton(profile){
  const button = $('#neteaseLoginButton');
  if(!button) return;
  const url = profile?.avatarUrl || profile?.avatarDetail?.identityIconUrl || '';
  const name = profile?.nickname || profile?.userName || '网易云账号';
  button.classList.toggle('has-netease-profile', !!profile);
  button.innerHTML = profile
    ? `<span class="netease-login-avatar" style="${url?`background-image:url('${String(url).replace(/'/g,'%27')}')`:''}"></span><span>${escapeHtml(name)}</span><em>已登录</em>`
    : '<span class="netease-login-avatar"></span><span>网易云账号登录</span><em>未登录</em>';
}
async function refreshNeteaseLoginButton(){
  const result = await api.lyrics?.neteaseLoginState?.().catch(()=>null);
  updateNeteaseProfile(result?.loggedIn ? result.profile : null);
}
function applyBlockStyles(){
  if(!state.blockStyles || typeof state.blockStyles !== 'object') return;
  Object.entries(state.blockStyles).forEach(([target, style])=>{
    const node = findCloudBlockByTarget(target);
    if(!node || !style || typeof style !== 'object') return;
    const source = style.background;
    const url = sourcePreviewUrl(source);
    node.classList.toggle('custom-block-bg', !!url);
    if(url) node.style.setProperty('--custom-block-bg', `url("${url.replace(/"/g,'%22')}")`);
    else node.style.removeProperty('--custom-block-bg');
    node.style.setProperty('--cloud-block-tilt', `${clampNumber(style.tilt, -45, 45, 0)}deg`);
    const isLayoutBlock = node.classList.contains('cloud-sidebar') || node.classList.contains('cloud-feed-card') || node.classList.contains('cloud-top-actions');
    const isTransformPositioned = node.classList.contains('cloud-path-float') || node.classList.contains('cloud-clock-widget');
    if(Number.isFinite(Number(style.x)) && Number.isFinite(Number(style.y)) && !isLayoutBlock && !isTransformPositioned){
      node.style.position = 'fixed';
      node.style.left = `${Number(style.x)}px`;
      node.style.top = `${Number(style.y)}px`;
      node.style.right = 'auto';
      node.style.bottom = 'auto';
    }
  });
}
function hslToRgb(h,s,l=68){h=((Number(h)||0)%360+360)%360;s=Math.max(0,Math.min(100,Number(s)||0))/100;l=Math.max(0,Math.min(100,Number(l)||0))/100;const c=(1-Math.abs(2*l-1))*s;const x=c*(1-Math.abs((h/60)%2-1));const m=l-c/2;let r=0,g=0,b=0;if(h<60){r=c;g=x}else if(h<120){r=x;g=c}else if(h<180){g=c;b=x}else if(h<240){g=x;b=c}else if(h<300){r=x;b=c}else{r=c;b=x}return [r,g,b].map((v)=>Math.round((v+m)*255))}
function rgbToHsl(rgb){let [r,g,b]=rgb.map((v)=>v/255);const max=Math.max(r,g,b),min=Math.min(r,g,b);let h=0,s=0,l=(max+min)/2;if(max!==min){const d=max-min;s=l>.5?d/(2-max-min):d/(max+min);if(max===r)h=(g-b)/d+(g<b?6:0);else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60}return {h:Math.round(h),s:Math.round(s*100),l:Math.round(l*100)}}
function applyThemeColor(){let rgb=parseRgb(state.themeRgb);if(!rgb){rgb=hslToRgb(state.themeHue,state.themeSat);state.themeRgb=rgb.join(',')}const alpha=(Math.max(18,Math.min(86,Number(state.themeAlpha)||46))/100).toFixed(2);const light=state.themeMode==='light';const signature=`${rgb.join(',')}|${alpha}|${light}`;if(signature===appliedThemeSignature)return;appliedThemeSignature=signature;const root=document.documentElement;root.style.setProperty('--accent',`rgb(${rgb.join(',')})`);root.style.setProperty('--accent-rgb',rgb.join(', '));root.style.setProperty('--ui-alpha',alpha);document.body.classList.toggle('light-mode',light);spatialShelf?.refresh?.()}
function applySkin(){
  document.body.classList.toggle('skin-xinghui',state.skin==='xinghui');
  document.body.classList.toggle('skin-orbit',state.skin!=='xinghui');
  const brandTitle = document.querySelector('.brand strong');
  const brandSub = document.querySelector('.brand>div>span');
  const searchLabel = document.querySelector('#searchLabel');
  if (brandTitle) brandTitle.textContent = state.skin === 'xinghui' ? '云屿' : 'ORBIT';
  if (brandSub) brandSub.textContent = state.skin === 'xinghui' ? 'DESK / 文件管理' : 'DESK / 本地轨道';
  if (searchLabel) searchLabel.textContent = state.skin === 'xinghui' ? '搜索文件、应用，或输入命令' : '搜索文件、应用或输入命令';
  if (state.skin === 'xinghui') {
    document.body.classList.remove('peek-right','peek-bottom');
    spatialShelf?.setReveal?.(false);
    if (orbitRaf) cancelAnimationFrame(orbitRaf);
    orbitRaf = 0;
    wallpaperParticles?.setEnabled?.(false);
    $('#wallpaperSpace')?.classList.remove('particle-ready');
  } else if (state.thumbnailEnabled !== false) {
    wallpaperParticles?.setEnabled?.(true);
  }
}
function applyPreset(id) {
  const preset=presets[id] || presets.polar; state.preset=id in presets?id:'polar';
  state.themeRgb=preset.rgb; const hsl=rgbToHsl(parseRgb(preset.rgb)); state.themeHue=hsl.h; state.themeSat=hsl.s;
  const root=document.documentElement; root.style.setProperty('--accent',preset.accent); root.style.setProperty('--accent-rgb',preset.rgb); root.style.setProperty('--warm',preset.warm); root.style.setProperty('--bg',preset.bg);
  applyThemeColor();
  document.querySelectorAll('.preset').forEach((node)=>node.classList.toggle('active',node.dataset.id===state.preset));
  drawParticles();
}

async function loadDesktop() {
  try {
    state.payload=await api.scanDesktop(); state.currentPath=state.payload.roots[0] || ''; state.currentParent=parentOfPath(state.currentPath); state.commandCwd=state.currentPath;
    els.totalCount.textContent=state.payload.items.length; els.desktopRoot.textContent=state.currentPath || 'Desktop';
    renderGroups(); selectGroup(state.activeGroup);
  } catch (error) { toast(`读取桌面失败：${error.message}`); }
}

async function enterComputerLayer() {
  try {
    const result = await api.listComputer();
    await cameraTransition('back', () => {
      state.currentItems = result.items.map((entry) => ({ ...entry, kind: 'folders' }));
      state.currentPath = result.path;
      state.currentParent = result.parent || '';
      state.commandCwd = result.path;
      document.body.classList.add('computer-layer');
      selectGroup('all');
    });
  } catch (error) {
    toast(`无法读取此电脑：${error.message}`);
  }
}

function enterDesktopLayer() {
  state.currentItems = null;
  state.currentPath = state.payload.roots[0] || '';
  state.currentParent = parentOfPath(state.currentPath);
  state.commandCwd = state.currentPath;
  document.body.classList.remove('computer-layer','favorite-layer');
  galaxyZoom = Math.max(galaxyZoom, 1);
  selectGroup(state.activeGroup === 'all' ? 'projects' : state.activeGroup);
  applyGalaxyView();
}
async function enterFavoriteLayer() {
  const items=(Array.isArray(state.favorites)?state.favorites:[]).map((entry,index)=>({...entry,id:entry.id||`favorite-${index}`,kind:entry.kind||'apps'}));
  await cameraTransition('forward',()=>{
    state.currentItems=items;
    state.currentPath='常用';
    state.currentParent=state.payload.roots[0] || '';
    state.commandCwd=state.currentParent;
    document.body.classList.remove('computer-layer');
    document.body.classList.add('favorite-layer');
    selectGroup('favorites');
  });
}

function groupItems(groupId) {
  if(groupId==='favorites') return (Array.isArray(state.favorites)?state.favorites:[]).map((entry,index)=>({...entry,id:entry.id||`favorite-${index}`,kind:entry.kind||'apps'}));
  const source=state.currentItems || state.payload.items;
  if(groupId==='all') return source;
  const filtered=source.filter((item)=>effectiveKind(item)===groupId || (state.currentItems && groupId==='folders' && item.isDirectory));
  return filtered.length ? filtered : source;
}
function renderGroups() {
  const groups=(Array.isArray(state.payload.groups)&&state.payload.groups.length?state.payload.groups:defaultGroups);
  if(!groups.some((group)=>group.id===state.activeGroup)) state.activeGroup=groups[0]?.id || 'projects';
  const counts={}; groups.forEach((group)=>counts[group.id]=0);
  state.payload.items.forEach((item)=>counts[effectiveKind(item)]=(counts[effectiveKind(item)]||0)+1);
  els.groupList.innerHTML=groups.map((group)=>`<button class="group-button ${state.activeGroup===group.id?'active':''}" data-group="${group.id}">${categoryIcon(group.id)}<b>${escapeHtml(displayGroupLabel(group))}</b><em>${String(counts[group.id]||0).padStart(2,'0')}</em></button>`).join('');
  els.groupList.querySelectorAll('button').forEach((button)=>button.addEventListener('click',()=>{state.currentItems=null;state.currentPath=state.payload.roots[0];state.currentParent=parentOfPath(state.currentPath);document.body.classList.remove('computer-layer');selectGroup(button.dataset.group)}));
  if(els.primaryOrbitDock){const primary=groups;els.primaryOrbitDock.innerHTML=primary.map((group,index)=>`<button class="primary-orbit-button ${state.activeGroup===group.id?'active':''}" data-group="${group.id}" style="--dock-index:${index}">${categoryIcon(group.id)}<b>${escapeHtml(displayGroupLabel(group))}</b><em>${String(counts[group.id]||0).padStart(2,'0')}</em></button>`).join('');els.primaryOrbitDock.querySelectorAll('button').forEach((button)=>button.addEventListener('click',()=>{state.currentItems=null;state.currentPath=state.payload.roots[0];state.currentParent=parentOfPath(state.currentPath);document.body.classList.remove('computer-layer');selectGroup(button.dataset.group)}));}
  renderCloudGroups(groups, counts);
}

function renderCloudGroups(groups, counts = {}) {
  if (!els.cloudGroupList) return;
  const favoriteCount = Array.isArray(state.favorites) ? state.favorites.length : 0;
  const totalCount = Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0);
  const visibleGroups = [{ id:'favorites', label:'常用', virtual:true }, ...groups, { id:'all', label:'全部对象', virtual:true }];
  els.cloudGroupList.innerHTML = visibleGroups.map((group, index) => `
    <button class="cloud-nav-item ${state.cloudGroupTouched&&state.activeGroup===group.id?'active':''}" data-group="${group.id}" type="button" style="--item-index:${index}">
      ${categoryIcon(group.id)}
      <span>${escapeHtml(displayGroupLabel(group))}</span>
      <em>${String(group.id==='favorites'?favoriteCount:group.id==='all'?totalCount:(counts[group.id]||0)).padStart(2,'0')}</em>
    </button>`).join('');
  els.cloudGroupList.querySelectorAll('button').forEach((button)=>{
    const showGroup = async (pin=false) => {
      state.cloudGroupTouched = true;
      if(button.dataset.group==='favorites'){
        if(pin) document.body.classList.add('cloud-projection-pinned');
        document.body.classList.add('peek-left','peek-right');
        state.currentItems=groupItems('favorites');
        state.currentPath='常用';
        state.currentParent=state.payload.roots[0] || '';
        state.commandCwd=state.currentParent;
        document.body.classList.remove('computer-layer');
        document.body.classList.add('favorite-layer');
        selectGroup('favorites');
        updateCloudNavActive('favorites');
        return;
      }
      if(pin) document.body.classList.add('cloud-projection-pinned');
      document.body.classList.add('peek-left','peek-right');
      state.currentItems=null;
      state.currentPath=state.payload.roots[0];
      state.currentParent=parentOfPath(state.currentPath);
      document.body.classList.remove('computer-layer','favorite-layer');
      selectGroup(button.dataset.group);
      updateCloudNavActive(button.dataset.group);
    };
    button.addEventListener('pointerenter',()=>{ if(state.skin==='xinghui'&&!document.body.classList.contains('cloud-projection-pinned')) void showGroup(false); });
    button.addEventListener('click',()=>void showGroup(true));
  });
}

function updateCloudNavActive(groupId = state.activeGroup) {
  if (!els.cloudGroupList) return;
  els.cloudGroupList.querySelectorAll('.cloud-nav-item').forEach((button)=>{
    button.classList.toggle('active', !!state.cloudGroupTouched && button.dataset.group === groupId);
  });
}


function selectGroup(groupId) {
  state.activeGroup=groupId; state.selectedId='';
  document.querySelectorAll('.group-button').forEach((button)=>button.classList.toggle('active',button.dataset.group===groupId));
  document.querySelectorAll('.primary-orbit-button').forEach((button)=>button.classList.toggle('active',button.dataset.group===groupId));
  const groups=(Array.isArray(state.payload.groups)&&state.payload.groups.length?state.payload.groups:defaultGroups);
  const group=groups.find((entry)=>entry.id===groupId) || {id:groupId,label:displayGroupLabel(groupId)};
  const groupLabel = displayGroupLabel(group);
  const items=groupItems(groupId);
  els.stageTitle.textContent=groupLabel; els.stageEyebrow.textContent=state.skin==='xinghui'?`DESK LIBRARY · ${String(items.length).padStart(2,'0')}`:`ORBIT INDEX · ${String(items.length).padStart(2,'0')}`; els.stageCaption.textContent=state.skin==='xinghui'?(groupId==='projects'?'项目、文件夹与快捷方式按卡片索引展开。':'当前桌面对象已整理为可搜索、可进入、可新建的文件管理视图。'):(groupId==='projects'?'一个项目，一座星系；沿目录逐层抵达。':'桌面对象已整理到清晰、可搜索的轨道。');
  els.shelfTitle.textContent=groupLabel; els.shelfCount.textContent=items.length; setCoreToCurrentPath(items);
  els.pathText.textContent=state.currentPath || 'DESKTOP';
  setPathRibbonText(state.currentPath || 'DESKTOP');
  document.body.classList.toggle('has-parent-path',!!state.currentParent && state.currentPath!=='此电脑');
  syncDesktopMiniGalaxy(items);
  renderCloudDesk(items); renderItems(items); renderOrbit(items); clickTone(1);
}

function renderItems(items) {
  spatialShelf?.setItems(items);
  if (!items.length) { els.itemList.innerHTML='<div style="padding:40px 18px;color:#5d6a70;font-size:11px;line-height:1.8">这条轨道还是空的。<br>桌面新增内容后点击左上角刷新。</div>'; return; }
  els.itemList.innerHTML=items.map(fileRowHtml).join('');
  els.itemList.querySelectorAll('.file-row').forEach((row,index)=>bindFileRow(row,items[index],index));
  els.itemList.onscroll=()=>{cancelAnimationFrame(renderItems.raf);renderItems.raf=requestAnimationFrame(()=>updateShelfDepth(items,true));};
  hydrateIcons(items);
  updateShelfDepth(items,false);
}
function fileRowHtml(item,index){
  const favorited=state.favorites.some((entry)=>entry.path===item.path);
  const preview=Array.isArray(item.childPreview)?item.childPreview.slice(0,3).map((entry)=>entry.name).filter(Boolean):[];
  const childLine=item.isDirectory&&Number(item.childCount||0)>0?`<span class="file-children">包含 ${Number(item.childCount)} 项${preview.length?` · ${escapeHtml(preview.join(' / '))}`:''}</span>`:'';
  return `<div class="file-row" data-id="${item.id}" title="${escapeHtml(item.path)}" role="button" tabindex="0" style="--row-index:${index}"><span class="file-icon">${escapeHtml(initials(item.name))}</span><span class="file-copy"><b>${escapeHtml(item.name)}</b><span>${escapeHtml(item.isDirectory?'目录':formatSize(item.size))} · ${new Date(item.modifiedAt).toLocaleDateString('zh-CN')}</span>${childLine}</span><span class="file-kind">${shortType(item)}</span><span class="file-actions"><button data-action="favorite" title="${favorited?'移出常用':'加入常用'}">${favorited?'★':'☆'}</button><button data-action="copy" title="复制路径">⧉</button><button data-action="reveal" title="文件位置">⌖</button><button data-action="open">${item.isDirectory?'进入':'打开'} ↗</button></span></div>`
}
function bindFileRow(row,item,index){row.addEventListener('click',()=>selectItem(item,index));row.addEventListener('dblclick',()=>activateItem(item));row.addEventListener('keydown',(event)=>{if(event.key==='Enter')activateItem(item)});row.addEventListener('contextmenu',(event)=>{event.preventDefault();api.revealPath(item.path);toast('已在资源管理器定位')});row.querySelectorAll('[data-action]').forEach((button)=>button.addEventListener('click',async(event)=>{event.stopPropagation();const action=button.dataset.action;if(action==='favorite'){await toggleFavorite(item);renderItems(groupItems(state.activeGroup))}else if(action==='copy'){await api.copyText(item.path);toast('路径已复制')}else if(action==='reveal'){await api.revealPath(item.path);toast('已在资源管理器定位')}else activateItem(item)}))}
function renderCloudDesk(items) {
  if (!els.cloudDesk) return;
  const groups=(Array.isArray(state.payload.groups)&&state.payload.groups.length?state.payload.groups:defaultGroups);
  const group=state.activeGroup==='favorites' ? { id:'favorites', label:'常用' } : (groups.find((entry)=>entry.id===state.activeGroup) || { id:'all', label:'全部对象' });
  const label=displayGroupLabel(group);
  const current=state.currentPath || state.payload.roots[0] || 'Desktop';
  if (els.cloudRootPath) els.cloudRootPath.textContent = state.payload.roots[0] || 'Desktop';
  if (els.cloudTotalCount) els.cloudTotalCount.textContent = String((state.currentItems || state.payload.items || []).length || 0);
  if (els.cloudKicker) els.cloudKicker.textContent = `DESKTOP LIBRARY · ${String(items.length).padStart(2,'0')}`;
  if (els.cloudTitle) els.cloudTitle.textContent = document.body.classList.contains('favorite-layer') ? '常用合集' : label;
  if (els.cloudCaption) els.cloudCaption.textContent = state.currentItems ? '当前目录已展开，可以继续进入子目录、打开文件或复制路径。' : '桌面内容按分类归档，保持 Wallpaper 或导入壁纸作为背景。';
  if (els.cloudPathText) els.cloudPathText.textContent = current;
  if (els.cloudListTitle) els.cloudListTitle.textContent = label;
  if (els.cloudCountBadge) els.cloudCountBadge.textContent = String(items.length);
  if (!items.length) {
    els.cloudFileList.innerHTML = '<div class="cloud-empty">当前分类暂无对象。可以切换分类，或使用“新建文件”。</div>';
  } else {
    els.cloudFileList.innerHTML = items.map(cloudFileRowHtml).join('');
    els.cloudFileList.querySelectorAll('.cloud-file-row').forEach((row,index)=>bindCloudFileRow(row,items[index],index));
    observeCloudRows();
    hydrateIcons(items);
  }
  els.cloudFileList.oncontextmenu = (event) => {
    if (event.target.closest('.cloud-file-row')) return;
    event.preventDefault();
    showCloudBlankContextMenu(event);
  };
  renderCloudFocus(items.find((item)=>item.id===state.selectedId));
}
function cloudFileRowHtml(item,index) {
  const preview=Array.isArray(item.childPreview)?item.childPreview.slice(0,4).map((entry)=>entry.name).filter(Boolean):[];
  const date=new Date(item.modifiedAt).toLocaleDateString('zh-CN');
  return `<article class="cloud-file-row ${state.selectedId===item.id?'active':''}" data-id="${item.id}" role="button" tabindex="0" title="${escapeHtml(item.path)}" style="--item-index:${index}">
    <span class="cloud-file-icon">${escapeHtml(initials(item.name))}</span>
    <span class="cloud-file-body">
      <b>${escapeHtml(item.name)}</b>
      <small>${escapeHtml(shortType(item))} · ${date}${item.isDirectory&&item.childCount?` · ${Number(item.childCount)} 项`:''}</small>
      ${preview.length?`<em>${escapeHtml(preview.join(' / '))}</em>`:''}
    </span>
    <span class="cloud-file-open">${item.isDirectory?'进入':'打开'} ↗</span>
  </article>`;
}
function bindCloudFileRow(row,item,index) {
  row.addEventListener('click',()=>selectItem(item,index));
  row.addEventListener('dblclick',()=>activateItem(item));
  row.addEventListener('keydown',(event)=>{if(event.key==='Enter')activateItem(item)});
  row.addEventListener('contextmenu',(event)=>{event.preventDefault();selectItem(item,index,{tone:false});showCloudContextMenu(event,item)});
}
function renderCloudFocus(item) {
  if (!els.cloudFocusTitle) return;
  const hasItem = !!item;
  els.cloudFocusTitle.textContent = hasItem ? item.name : '未选择对象';
  els.cloudFocusMeta.textContent = hasItem ? `${item.isDirectory?'文件夹':'文件'} · ${item.path}` : '从文件流选择一个文件或文件夹查看详情。';
  [els.cloudOpenButton, els.cloudRevealButton, els.cloudCopyButton].forEach((button)=>{ if(button) button.disabled = !hasItem; });
}
function showCloudContextMenu(event,item) {
  if (!els.cloudContextMenu || !item) return;
  const entries = [
    ['open', item.isDirectory ? '进入文件夹' : '打开'],
    ['reveal', '在资源管理器中显示'],
    ['copyPath', '复制路径'],
    ['favorite', state.favorites.some((entry)=>entry.path===item.path) ? '移出常用' : '加入常用'],
    ['parent', '返回上一级'],
    ['refresh', '刷新桌面']
  ];
  els.cloudContextMenu.innerHTML = entries.map(([action,label])=>`<button type="button" data-action="${action}">${escapeHtml(label)}</button>`).join('');
  els.cloudContextMenu.hidden = false;
  const width = 220;
  const height = Math.min(320, entries.length * 42 + 18);
  const left = Math.max(10, Math.min(innerWidth - width - 10, event.clientX));
  const top = Math.max(10, Math.min(innerHeight - height - 10, event.clientY));
  els.cloudContextMenu.style.left = `${left}px`;
  els.cloudContextMenu.style.top = `${top}px`;
  els.cloudContextMenu.querySelectorAll('button').forEach((button)=>button.addEventListener('click',async()=>{
    const action = button.dataset.action;
    hideCloudContextMenu();
    if (action === 'open') await activateItem(item);
    else if (action === 'reveal') { await api.revealPath(item.path); toast('已在资源管理器定位'); }
    else if (action === 'copyPath') { await api.copyText(item.path); toast('路径已复制'); }
    else if (action === 'favorite') { await toggleFavorite(item); renderCloudDesk(groupItems(state.activeGroup)); }
    else if (action === 'parent') await goParent();
    else if (action === 'refresh') await loadDesktop();
  }));
}
function hideCloudContextMenu() {
  if (els.cloudContextMenu) els.cloudContextMenu.hidden = true;
}
function closeCloudSidePanels(){document.querySelectorAll('.cloud-side-panel').forEach((node)=>node.remove())}
function positionSidePanel(panel, anchor, preferred = 'horizontal'){
  const rect = anchor.getBoundingClientRect();
  const width = Math.min(320, Math.max(260, panel.offsetWidth || 300));
  const height = Math.min(innerHeight - 24, panel.offsetHeight || 420);
  let left;
  let top;
  if(preferred === 'vertical'){
    top = rect.top > innerHeight / 2 ? rect.top - height - 12 : rect.bottom + 12;
    left = rect.left + rect.width / 2 - width / 2;
  } else {
    left = rect.left + rect.width / 2 > innerWidth / 2 ? rect.left - width - 12 : rect.right + 12;
    top = rect.top - 8;
  }
  panel.style.left = `${Math.max(10, Math.min(innerWidth - width - 10, left))}px`;
  panel.style.top = `${Math.max(10, Math.min(innerHeight - height - 10, top))}px`;
}
function showSidePanel(anchor, className, html, preferred){
  closeCloudSidePanels();
  const panel = document.createElement('div');
  panel.className = `cloud-side-panel ${className || ''}`;
  panel.innerHTML = html;
  document.body.appendChild(panel);
  positionSidePanel(panel, anchor, preferred);
  return panel;
}
async function loadPanelWallpaperThumbnails(panel){
  const images = [...panel.querySelectorAll('img[data-thumbnail-key]')];
  await Promise.all(images.map(async(image)=>{
    const key = image.dataset.thumbnailKey;
    if(!key) return;
    const result = await api.wallpapers?.thumbnail?.(key).catch(()=>null);
    if(result?.ok && result.dataUrl && image.isConnected){
      image.src = result.dataUrl;
      image.classList.add('loaded');
    } else if(image.isConnected) {
      image.classList.add('failed');
    }
  }));
}
function showLyricEffectPanel(anchor){
  normalizeLyricEffects();
  const panel = showSidePanel(anchor, 'lyric-side-panel', `<b>歌词展示效果</b>
    <label><input type="checkbox" data-lyric-effect-check="float" ${state.lyricEffects.float?'checked':''}> 三行歌词上下浮动</label>
    <label><input type="checkbox" data-lyric-effect-check="glow" ${state.lyricEffects.glow?'checked':''}> 文字描边荧光</label>
    <label><input type="checkbox" data-lyric-effect-check="cinema" ${state.lyricEffects.cinema?'checked':''}> 影院式进出场</label>
    <label>泛光颜色 <input type="color" value="${rgbToHex(state.lyricGlowRgb)}" data-lyric-glow-color><input type="text" value="${escapeHtml(state.lyricGlowRgb)}" data-lyric-glow-rgb></label>`);
  panel.querySelectorAll('[data-lyric-effect-check]').forEach((input)=>input.addEventListener('change',()=>{
    state.lyricEffects[input.dataset.lyricEffectCheck] = input.checked;
    syncControls();
    persistSettings();
  }));
  panel.querySelector('[data-lyric-glow-color]')?.addEventListener('input',(event)=>{
    const rgb = hexToRgb(event.target.value);
    if(!rgb)return;
    state.lyricGlowRgb = rgb.join(',');
    const pair = panel.querySelector('[data-lyric-glow-rgb]');
    if(pair) pair.value = state.lyricGlowRgb;
    syncControls();
    persistSettings();
  });
  panel.querySelector('[data-lyric-glow-rgb]')?.addEventListener('change',(event)=>{
    const rgb = parseRgb(event.target.value);
    if(!rgb){event.target.value=state.lyricGlowRgb;return}
    state.lyricGlowRgb = rgb.join(',');
    const pair = panel.querySelector('[data-lyric-glow-color]');
    if(pair) pair.value = rgbToHex(state.lyricGlowRgb);
    syncControls();
    persistSettings();
  });
}
function showLyricLayoutPanel(anchor){
  normalizeLyricLayout();
  const names = { prev:'上一句', current:'当前句', next:'下一句' };
  const shared = state.lyricLayout.current || defaultLyricLineLayout('current');
  const independent = state.lyricLayoutIndependent === true;
  const panel = showSidePanel(anchor, 'lyric-side-panel lyric-layout-panel', `<b>歌词三行布局</b>
    <div class="lyric-layout-presets">
      <button type="button" data-lyric-layout-preset="right-stair">右楼梯</button>
      <button type="button" data-lyric-layout-preset="left-stair">左楼梯</button>
      <button type="button" data-lyric-layout-preset="center">居中突出</button>
    </div>
    <section class="lyric-layout-row lyric-layout-master">
      <header>整体控制</header>
      <label>独立控制 <input type="checkbox" ${independent?'checked':''} data-lyric-layout-independent></label>
      <label>X <input type="range" min="-260" max="260" value="${shared.x}" data-lyric-layout-all="x"></label>
      <label>Y <input type="range" min="-180" max="180" value="${shared.y}" data-lyric-layout-all="y"></label>
      <label>大小 <input type="range" min="40" max="220" value="${shared.scale}" data-lyric-layout-all="scale"></label>
      <label>透明度 <input type="range" min="0" max="100" value="${shared.opacity}" data-lyric-layout-all="opacity"></label>
      <label>倾斜 <input type="range" min="-35" max="35" value="${shared.tilt}" data-lyric-layout-all="tilt"></label>
    </section>
    <div class="lyric-layout-grid ${independent?'':'is-locked'}">${['prev','current','next'].map((role)=>`
      <section class="lyric-layout-row" data-lyric-layout-role="${role}" ${independent?'':'aria-disabled="true"'}>
        <header>${names[role]}</header>
        <label>X <input type="range" min="-260" max="260" value="${state.lyricLayout[role].x}" data-lyric-layout="${role}:x" ${independent?'':'disabled'}></label>
        <label>Y <input type="range" min="-180" max="180" value="${state.lyricLayout[role].y}" data-lyric-layout="${role}:y" ${independent?'':'disabled'}></label>
        <label>大小 <input type="range" min="40" max="220" value="${state.lyricLayout[role].scale}" data-lyric-layout="${role}:scale" ${independent?'':'disabled'}></label>
        <label>透明度 <input type="range" min="0" max="100" value="${state.lyricLayout[role].opacity}" data-lyric-layout="${role}:opacity" ${independent?'':'disabled'}></label>
        <label>倾斜 <input type="range" min="-35" max="35" value="${state.lyricLayout[role].tilt}" data-lyric-layout="${role}:tilt" ${independent?'':'disabled'}></label>
      </section>`).join('')}</div>
    <small class="lyric-layout-note">${independent?'当前为三行独立调节。':'未开启独立控制时，下面三行参数锁定，用整体控制统一调。'}</small>`);
  const applyShared = (key, value) => {
    const offsets = { prev:{ x:0, y:-42 }, current:{ x:0, y:0 }, next:{ x:0, y:42 } };
    ['prev','current','next'].forEach((role)=>{
      const offset = offsets[role];
      state.lyricLayout[role][key] = Number(value) + (key === 'x' || key === 'y' ? offset[key] : 0);
    });
  };
  panel.querySelector('[data-lyric-layout-independent]')?.addEventListener('change',(event)=>{
    state.lyricLayoutIndependent = event.target.checked;
    persistSettings();
    showLyricLayoutPanel(anchor);
  });
  panel.querySelectorAll('[data-lyric-layout-all]').forEach((input)=>input.addEventListener('input',()=>{
    normalizeLyricLayout();
    applyShared(input.dataset.lyricLayoutAll, input.value);
    applyLyricLineLayout();
    persistSettings();
  }));
  panel.querySelectorAll('[data-lyric-layout]').forEach((input)=>input.addEventListener('input',()=>{
    const [role,key] = input.dataset.lyricLayout.split(':');
    normalizeLyricLayout();
    state.lyricLayout[role][key] = Number(input.value);
    applyLyricLineLayout();
    persistSettings();
  }));
  const applyPreset = (preset) => {
    if(preset === 'left-stair') state.lyricLayout = {
      prev:{x:42,y:-42,scale:82,opacity:45,tilt:-4},
      current:{x:0,y:0,scale:122,opacity:100,tilt:-4},
      next:{x:-42,y:42,scale:86,opacity:58,tilt:-4}
    };
    else if(preset === 'center') state.lyricLayout = {
      prev:{x:0,y:-46,scale:78,opacity:38,tilt:0},
      current:{x:0,y:0,scale:124,opacity:100,tilt:0},
      next:{x:0,y:46,scale:82,opacity:48,tilt:0}
    };
    else state.lyricLayout = {
      prev:{x:-42,y:-42,scale:82,opacity:45,tilt:4},
      current:{x:0,y:0,scale:122,opacity:100,tilt:4},
      next:{x:42,y:42,scale:86,opacity:58,tilt:4}
    };
    applyLyricLineLayout();
    persistSettings();
    showLyricLayoutPanel(anchor);
  };
  panel.querySelectorAll('[data-lyric-layout-preset]').forEach((button)=>button.addEventListener('click',()=>applyPreset(button.dataset.lyricLayoutPreset)));
}
async function showPlaylistPanel(anchor){
  clearTimeout(playlistPanelCloseTimer);
  const existing = document.querySelector('.playlist-side-panel.full-playlist-panel');
  if(existing && existing.isConnected) return existing;
  closeCloudSidePanels();
  const login = await api.lyrics?.neteaseLoginState?.().catch(()=>null);
  const direction = playlistDirectionForWidget();
  activePlaylistDirection = direction;
  document.body.classList.toggle('playlist-edge-right', direction === 'right');
  document.body.classList.toggle('playlist-edge-left', direction !== 'right');
  const panel = document.createElement('div');
  panel.className = `cloud-side-panel playlist-side-panel full-playlist-panel playlist-${direction}`;
  panel.innerHTML = `<header class="full-playlist-head">
      <button class="full-playlist-back" type="button" data-playlist-back hidden title="返回歌单列表" aria-label="返回">←</button>
      <div class="full-playlist-title-wrap"><b data-playlist-title>歌单 / 队列</b><small data-playlist-sub>PLAYLIST</small></div>
      <div class="full-playlist-head-actions">
        ${login?.loggedIn ? '<button type="button" data-playlist-refresh title="刷新歌单">↻</button>' : '<button type="button" data-playlist-login>登录网易云</button>'}
      </div>
    </header>
    ${login?.loggedIn
      ? `<div class="full-playlist-body" data-playlist-body><small class="full-playlist-hint">正在读取歌单…</small></div>`
      : `<div class="full-playlist-body" data-playlist-body><div class="full-playlist-login"><p>登录网易云账号后可查看并播放你的歌单。</p><button type="button" data-playlist-login-main>扫码登录</button></div></div>`}`;
  document.body.appendChild(panel);
  positionFullPlaylistPanel(panel);
  panel.querySelector('[data-playlist-login]')?.addEventListener('click',showNeteaseLoginPanel);
  panel.querySelector('[data-playlist-login-main]')?.addEventListener('click',showNeteaseLoginPanel);
  panel.addEventListener('click',(event)=>{
    if(event.target.closest('[data-playlist-back]')){
      void renderFullPlaylists(panel);
    }
  });
  panel.querySelector('[data-playlist-refresh]')?.addEventListener('click',async()=>{
    const result = await refreshNeteasePlaylistCache(true);
    if(result?.ok && panel.isConnected) renderFullPlaylists(panel, result.playlists || []);
  });
  panel.addEventListener('mouseenter',()=>clearTimeout(playlistPanelCloseTimer));
  panel.addEventListener('mouseleave',()=>schedulePlaylistPanelClose());
  if(login?.loggedIn) void renderFullPlaylists(panel);
  return panel;
}
function positionFullPlaylistPanel(panel){
  const rect = els.lyricWidget?.getBoundingClientRect?.();
  const width = Math.min(420, Math.max(320, Math.round(innerWidth * .26)));
  const height = Math.min(innerHeight - 120, 520);
  let left;
  if(rect){
    left = activePlaylistDirection === 'right' ? rect.right + 16 : rect.left - width - 16;
    if(activePlaylistDirection === 'right' && left + width > innerWidth - 12) left = innerWidth - width - 12;
    if(activePlaylistDirection === 'left' && left < 12) left = 12;
  } else {
    left = Math.max(12, innerWidth - width - 12);
  }
  const top = Math.max(64, Math.min(innerHeight - height - 20, (rect?.top || 120) - 24));
  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
  panel.style.width = `${width}px`;
  panel.style.height = `${height}px`;
}
function playlistDirectionForWidget(){
  const rect = els.lyricWidget?.getBoundingClientRect?.();
  if(!rect) return 'left';
  return rect.left + rect.width / 2 < innerWidth / 2 ? 'right' : 'left';
}
function schedulePlaylistPanelClose(delay=360){
  clearTimeout(playlistPanelCloseTimer);
  playlistPanelCloseTimer = setTimeout(()=>{
    document.querySelectorAll('.playlist-side-panel,.netease-song-flyout').forEach((panel)=>panel.remove());
  }, delay);
}
async function refreshNeteasePlaylistCache(force=false){
  const fresh = neteasePlaylistCache.result && Date.now() - neteasePlaylistCache.at < 5000;
  if(!force && fresh) return neteasePlaylistCache.result;
  if(neteasePlaylistCache.loading) return neteasePlaylistCache.loading;
  neteasePlaylistCache.loading = api.lyrics?.neteasePlaylists?.()
    .then((result)=>{
      if(result?.ok) neteasePlaylistCache = { at: Date.now(), loading:null, result };
      else neteasePlaylistCache.loading = null;
      return result;
    })
    .catch((error)=>{
      neteasePlaylistCache.loading = null;
      return {ok:false,error:error?.message||'PLAYLIST_FAILED'};
    });
  return neteasePlaylistCache.loading;
}
async function refreshNeteaseTrackCache(playlistId, force=false){
  const key = String(playlistId || '');
  const cached = neteaseTrackCache.get(key);
  if(!force && cached?.result && Date.now() - cached.at < 300000) return cached.result;
  if(cached?.loading) return cached.loading;
  const loading = api.lyrics?.neteasePlaylistTracks?.({id:key,offset:0,limit:80})
    .then((result)=>{
      if(result?.ok) neteaseTrackCache.set(key,{at:Date.now(),loading:null,result});
      else neteaseTrackCache.set(key,{...(cached||{}),loading:null});
      return result;
    })
    .catch((error)=>{
      neteaseTrackCache.set(key,{...(cached||{}),loading:null});
      return {ok:false,error:error?.message||'TRACKS_FAILED'};
    });
  neteaseTrackCache.set(key,{...(cached||{}),loading});
  return loading;
}
async function renderFullPlaylists(panel, playlists){
  const body = panel.querySelector('[data-playlist-body]');
  if(!body) return;
  const back = panel.querySelector('[data-playlist-back]');
  if(back) back.hidden = true;
  const title = panel.querySelector('[data-playlist-title]');
  if(title) title.textContent = '歌单 / 队列';
  const sub = panel.querySelector('[data-playlist-sub]');
  if(sub) sub.textContent = 'PLAYLIST';
  const result = playlists ? {ok:true,playlists} : (neteasePlaylistCache.result || await refreshNeteasePlaylistCache(false));
  if(!result?.ok){ body.innerHTML = `<small class="full-playlist-hint">歌单读取失败：${escapeHtml(result?.message || result?.error || '未知错误')}</small>`; return; }
  const rows = result.playlists || [];
  body.innerHTML = `<div class="netease-playlist-list">${rows.map((item,index)=>`
    <button type="button" class="netease-playlist-row" data-playlist-id="${escapeHtml(item.id)}" style="--row-index:${index}">
      <span class="netease-playlist-cover" style="${item.coverUrl?`background-image:url('${String(item.coverUrl).replace(/'/g,'%27')}')`:''}"></span>
      <span class="netease-playlist-copy"><b>${escapeHtml(item.name)}</b><em>${Number(item.trackCount||0)} 首${item.creator?` · ${escapeHtml(item.creator)}`:''}</em></span>
      <span class="netease-playlist-arrow" aria-hidden="true">›</span>
    </button>`).join('') || '<small class="full-playlist-hint">这个账号没有可读取的歌单。</small>'}</div>`;
  body.querySelectorAll('[data-playlist-id]').forEach((button)=>button.addEventListener('click',async()=>{
    await renderFullPlaylistDetail(panel, button.dataset.playlistId, button.querySelector('b')?.textContent || '歌单');
  }));
}
async function renderFullPlaylistDetail(panel, playlistId, playlistName){
  const body = panel.querySelector('[data-playlist-body]');
  if(!body) return;
  const back = panel.querySelector('[data-playlist-back]');
  if(back) back.hidden = false;
  const title = panel.querySelector('[data-playlist-title]');
  if(title) title.textContent = playlistName;
  const sub = panel.querySelector('[data-playlist-sub]');
  if(sub) sub.textContent = 'PLAYLIST · 点击歌曲播放';
  body.innerHTML = `<small class="full-playlist-hint">正在展开「${escapeHtml(playlistName)}」…</small>`;
  const cached = neteaseTrackCache.get(String(playlistId||''))?.result;
  const result = cached?.ok ? cached : await refreshNeteaseTrackCache(playlistId, !cached);
  if(!result?.ok){ body.innerHTML = `<small class="full-playlist-hint">歌曲读取失败：${escapeHtml(result?.message || result?.error || '未知错误')}</small>`; return; }
  renderFullSongRows(panel, body, playlistId, playlistName, result.songs || []);
}
function renderFullSongRows(panel, body, playlistId, playlistName, songs){
  embeddedNeteaseQueue = { playlistId, songs, index: embeddedNeteaseQueue.playlistId === playlistId ? embeddedNeteaseQueue.index : -1 };
  body.innerHTML = `<div class="netease-song-heading"><b>${escapeHtml(playlistName)}</b><span>${songs.length} 首</span></div>
    <div class="netease-song-list-rows">${songs.map((song,index)=>{
      const isCurrent = embeddedNeteaseQueue.playlistId === playlistId && embeddedNeteaseQueue.index === index;
      return `<button type="button" class="netease-song-row ${isCurrent?'now':''}" data-song-index="${index}" style="--row-index:${index}">
        <span class="netease-song-cover" style="${song.coverUrl?`background-image:url('${String(song.coverUrl).replace(/'/g,'%27')}')`:''}"></span>
        <span class="netease-song-copy"><b>${escapeHtml(song.name)}</b><em>${escapeHtml(song.artists || song.album || '未知歌手')}</em></span>
        ${isCurrent?'<i class="netease-song-eq" aria-hidden="true"></i>':''}
      </button>`;}).join('') || '<small class="full-playlist-hint">这个歌单没有歌曲。</small>'}</div>`;
  body.querySelectorAll('[data-song-index]').forEach((button)=>button.addEventListener('click',async()=>{
    const index = Number(button.dataset.songIndex);
    await playEmbeddedNeteaseSong(index);
    renderFullSongRows(panel, body, playlistId, playlistName, songs);
  }));
}
function ensureEmbeddedNeteaseAudio(){
  if(embeddedNeteaseAudio) return embeddedNeteaseAudio;
  embeddedNeteaseAudio = new Audio();
  embeddedNeteaseAudio.preload = 'auto';
  embeddedNeteaseAudio.crossOrigin = 'anonymous';
  const syncEmbeddedAudioState = (action)=>{
    const positionMs = embeddedNeteaseAudio.currentTime * 1000;
    lyricRuntime.elapsedMs = positionMs;
    lyricRuntime.startedAt = performance.now() - positionMs;
    api.lyrics?.embeddedPlaybackState?.({action,positionMs});
    updateLyricMediaIcons(!embeddedNeteaseAudio.paused);
    if(lyricRuntime.status) renderLyricStatus(Object.assign({}, lyricRuntime.status, { source:'embedded', positionMs, playing:!embeddedNeteaseAudio.paused }));
  };
  embeddedNeteaseAudio.addEventListener('play',()=>syncEmbeddedAudioState('play'));
  embeddedNeteaseAudio.addEventListener('pause',()=>syncEmbeddedAudioState('pause'));
  embeddedNeteaseAudio.addEventListener('seeking',()=>syncEmbeddedAudioState(embeddedNeteaseAudio.paused?'pause':'play'));
  embeddedNeteaseAudio.addEventListener('seeked',()=>syncEmbeddedAudioState(embeddedNeteaseAudio.paused?'pause':'play'));
  embeddedNeteaseAudio.addEventListener('loadedmetadata',()=>syncEmbeddedAudioState(embeddedNeteaseAudio.paused?'pause':'play'));
  embeddedNeteaseAudio.addEventListener('timeupdate',()=>{
    if(performance.now() - embeddedPlaybackSyncAt < 250) return;
    embeddedPlaybackSyncAt = performance.now();
    syncEmbeddedAudioState(embeddedNeteaseAudio.paused?'pause':'play');
  });
  embeddedNeteaseAudio.addEventListener('ended',()=>void playEmbeddedNeteaseSong(embeddedNeteaseQueue.index + 1));
  return embeddedNeteaseAudio;
}
async function playEmbeddedNeteaseSong(index){
  const song = embeddedNeteaseQueue.songs[index];
  if(!song){toast('歌单已经播放完');return}
  embeddedNeteaseQueue.index = index;
  toast(`正在加载：${song.name}`);
  const result = await api.lyrics?.neteasePlaySong?.(song).catch((error)=>({ok:false,error:error?.message||'PLAY_FAILED'}));
  if(!result?.ok){toast(result?.message || `播放失败：${result?.error || '未知错误'}`);return}
  const coverUrl = result.song?.coverUrl || song.coverUrl || result.matched?.coverUrl || '';
  setLyricCover(coverUrl);
  const audio = ensureEmbeddedNeteaseAudio();
  audio.src = result.url;
  await audio.play().catch((error)=>toast(`播放被系统拦截：${error.message}`));
  lyricRuntime = { key:'', startedAt:performance.now(), status:null, lineIndex:-1 };
  toast(`切换到：${result.song?.name || song.name}`);
}
async function showBlockBackgroundPanel(anchor, target){
  if(!state.wallpaperLibrary.length) await refreshWallpaperLibrary(true);
  const style = blockStyle(target);
  const wallpapers = state.wallpaperLibrary.slice(0, 12);
  const cards = wallpapers.map((wallpaper,index)=>{
    const preview = sourcePreviewUrl(wallpaper);
    const active = style.background?.path && style.background.path === wallpaper.path;
    const thumb = wallpaper.thumbnailKey
      ? `<img data-thumbnail-key="${escapeHtml(wallpaper.thumbnailKey)}" alt="" decoding="async">`
      : `<span style="${preview?`background-image:url('${preview.replace(/'/g,'%27')}')`:''}"></span>`;
    const sourceLabel = wallpaper.sourceLabel || (wallpaper.readonly ? '内置壁纸' : `用户导入 · ${wallpaper.kind === 'video' ? '视频' : '图片'}`);
    return `<button class="block-bg-card ${active?'active':''}" type="button" data-bg-index="${index}">
      ${thumb}
      <em>${escapeHtml(sourceDisplayName(wallpaper))}</em>
      <small>${escapeHtml(sourceLabel)}</small>
    </button>`;
  }).join('');
  const panel = showSidePanel(anchor, 'block-bg-side-panel', `<b>块背景</b>
    <p>当前：${escapeHtml(style.background ? sourceDisplayName(style.background) : '未设置')}</p>
    <button type="button" data-bg-action="local">选择本地路径图片 / 视频</button>
    <button type="button" data-bg-action="clear">关闭块背景</button>
    <div class="block-bg-grid">${cards || '<small>壁纸库为空，可以先导入。</small>'}</div>
    <button type="button" data-bg-action="current">使用当前桌面壁纸 / Wallpaper</button>
    <small>上方为壁纸库 / 用户导入资源；图片加载器和媒体播放器会直接把所选资源作为块内容。</small>`);
  panel.querySelector('[data-bg-action="current"]')?.addEventListener('click',()=>setBlockBackgroundSource(target, activeBackgroundSource || state.background || null));
  panel.querySelector('[data-bg-action="clear"]')?.addEventListener('click',()=>setBlockBackgroundSource(target, null));
  panel.querySelector('[data-bg-action="local"]')?.addEventListener('click',async()=>{const source=await api.chooseBackground();if(source?.ok)setBlockBackgroundSource(target,{path:source.path,url:source.url,kind:source.kind,name:source.name||source.path,width:source.width,height:source.height});});
  panel.querySelectorAll('[data-bg-index]').forEach((button)=>button.addEventListener('click',()=>{const source=wallpapers[Number(button.dataset.bgIndex)];if(source)setBlockBackgroundSource(target, source);}));
  void loadPanelWallpaperThumbnails(panel);
}
function updateCloudClock() {
  if (!els.cloudClockTime) return;
  const now = new Date();
  els.cloudClockTime.textContent = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  if (els.cloudClockDate) els.cloudClockDate.textContent = now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
}
function ensureLyricLines() {
  if (!els.lyricWidget || els.lyricLinePrev || !els.lyricLineA) return;
  const wrap = document.createElement('div');
  wrap.className = 'lyric-lines';
  wrap.id = 'lyricLines';
  const prev = document.createElement('p');
  prev.id = 'lyricLinePrev';
  prev.className = 'lyric-line lyric-prev';
  prev.textContent = ' ';
  els.lyricLineA.classList.add('lyric-line','lyric-current');
  els.lyricLineB?.classList.add('lyric-line','lyric-next');
  els.lyricLineA.parentNode.insertBefore(wrap, els.lyricLineA);
  wrap.appendChild(prev);
  wrap.appendChild(els.lyricLineA);
  if (els.lyricLineB) wrap.appendChild(els.lyricLineB);
  els.lyricLinePrev = prev;
}
function ensurePlaylistButton(){
  if(!els.lyricWidget || els.lyricWidget.dataset.playlistHotzoneBound) return;
  els.lyricWidget.dataset.playlistHotzoneBound = '1';
  $('#lyricPlaylistButton')?.remove();
  const updateEdge = () => {
    const direction = playlistDirectionForWidget();
    els.lyricWidget.classList.toggle('playlist-edge-right', direction === 'right');
    els.lyricWidget.classList.toggle('playlist-edge-left', direction !== 'right');
  };
  const open = (event) => {
    if(document.body.classList.contains('cloud-block-dragging') || els.lyricWidget?.classList.contains('cloud-moving')) return;
    if(event?.target?.closest?.('#lyricVolumeButton,.lyric-volume-panel')) return;
    clearTimeout(playlistPanelCloseTimer);
    updateEdge();
    void showPlaylistPanel();
  };
  els.lyricWidget.addEventListener('mouseenter',(event)=>{event.stopPropagation();open(event);});
  els.lyricWidget.addEventListener('mouseleave',()=>schedulePlaylistPanelClose(460));
  updateEdge();
}
function updateLyricMediaIcons(playing){
  const button = document.querySelector('[data-media-action="playpause"]');
  if(!button) return;
  const play = button.querySelector('.lyric-icon-play');
  const pause = button.querySelector('.lyric-icon-pause');
  if(play){ play.style.display = playing ? 'none' : 'block'; play.hidden = !!playing; }
  if(pause){ pause.style.display = playing ? 'block' : 'none'; pause.hidden = !playing; }
}
function ensureLyricVolumeButton(){
  const button = $('#lyricVolumeButton');
  if(!button || !els.lyricWidget || button.dataset.volumeBound) return;
  button.dataset.volumeBound = '1';
  button.addEventListener('click',(event)=>{
    event.stopPropagation();
    showLyricVolumePanel(event.currentTarget);
  });
  button.addEventListener('mouseenter',(event)=>{
    event.stopPropagation();
    clearTimeout(playlistPanelCloseTimer);
  });
}
function showLyricVolumePanel(anchor){
  clearTimeout(playlistPanelCloseTimer);
  document.querySelectorAll('.lyric-volume-panel').forEach((node)=>node.remove());
  const panel = document.createElement('div');
  panel.className = 'cloud-side-panel lyric-volume-panel';
  panel.innerHTML = `<b>音量</b>
    <label><output>${clampNumber(state.lyricVolume,0,100,80)}%</output><input type="range" min="0" max="100" value="${clampNumber(state.lyricVolume,0,100,80)}" data-lyric-volume-range></label>
    <button class="cloud-block-toggle" type="button" data-lyric-volume-mute>${Number(state.lyricVolume)<=0?'取消静音':'静音'}</button>`;
  document.body.appendChild(panel);
  const rect = anchor.getBoundingClientRect();
  const width = Math.min(220, Math.max(170, panel.offsetWidth || 190));
  const height = panel.offsetHeight || 150;
  const left = Math.max(10, Math.min(innerWidth - width - 10, rect.left + rect.width/2 - width/2));
  const top = rect.top - height - 12 < 10 ? rect.bottom + 12 : rect.top - height - 12;
  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
  panel.addEventListener('mouseenter',()=>clearTimeout(playlistPanelCloseTimer));
  panel.addEventListener('mouseleave',()=>schedulePlaylistPanelClose());
  const output = panel.querySelector('output');
  panel.querySelector('[data-lyric-volume-range]')?.addEventListener('input',(event)=>{
    const value = Number(event.target.value);
    state.lyricVolume = value;
    if(embeddedNeteaseAudio) embeddedNeteaseAudio.volume = value/100;
    if(output) output.textContent = `${value}%`;
    syncControls();
    persistSettings();
    const mute = panel.querySelector('[data-lyric-volume-mute]');
    if(mute) mute.textContent = value<=0 ? '取消静音' : '静音';
  });
  panel.querySelector('[data-lyric-volume-mute]')?.addEventListener('click',()=>{
    if(Number(state.lyricVolume) > 0){
      lastLyricVolume = clampNumber(state.lyricVolume,1,100,80);
      state.lyricVolume = 0;
    } else {
      state.lyricVolume = clampNumber(lastLyricVolume,1,100,80);
    }
    if(embeddedNeteaseAudio) embeddedNeteaseAudio.volume = state.lyricVolume/100;
    const range = panel.querySelector('[data-lyric-volume-range]');
    if(range) range.value = state.lyricVolume;
    if(output) output.textContent = `${state.lyricVolume}%`;
    const mute = panel.querySelector('[data-lyric-volume-mute]');
    if(mute) mute.textContent = state.lyricVolume<=0 ? '取消静音' : '静音';
    syncControls();
    persistSettings();
  });
}
function formatPlaybackTime(ms){
  const total = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2,'0')}`;
}
function ensureLyricProgress(){
  if(!els.lyricWidget) return null;
  let progress = $('#lyricPlaybackProgress');
  if(progress) return progress;
  const controls = els.lyricWidget.querySelector('.lyric-controls');
  if(!controls) return null;
  progress = document.createElement('div');
  progress.id = 'lyricPlaybackProgress';
  progress.className = 'lyric-progress';
  progress.innerHTML = `<span data-lyric-current-time>0:00</span><input type="range" min="0" max="1000" value="0" step="1" data-lyric-seek><span data-lyric-total-time>--:--</span>`;
  controls.parentNode.insertBefore(progress, controls);
  const seek = progress.querySelector('[data-lyric-seek]');
  const syncSeek = async()=>{
    if(!embeddedNeteaseAudio) return;
    const duration = Number(embeddedNeteaseAudio.duration || 0);
    if(!Number.isFinite(duration) || duration <= 0) return;
    const nextMs = Number(seek.value || 0) / 1000 * duration * 1000;
    embeddedNeteaseAudio.currentTime = nextMs / 1000;
    lyricRuntime.elapsedMs = nextMs;
    lyricRuntime.startedAt = performance.now() - nextMs;
    await api.lyrics?.embeddedPlaybackState?.({action:embeddedNeteaseAudio.paused?'pause':'play',positionMs:nextMs}).catch(()=>null);
    if(lyricRuntime.status) renderLyricStatus(Object.assign({}, lyricRuntime.status, { source:'embedded', positionMs:nextMs, playing:!embeddedNeteaseAudio.paused }));
  };
  seek.addEventListener('input',()=>{
    const duration = Number(embeddedNeteaseAudio?.duration || 0);
    if(!Number.isFinite(duration) || duration <= 0) return;
    lyricRuntime.elapsedMs = Number(seek.value || 0) / 1000 * duration * 1000;
    if(lyricRuntime.status) renderLyricStatus(Object.assign({}, lyricRuntime.status, { source:'embedded', positionMs:lyricRuntime.elapsedMs, playing:!embeddedNeteaseAudio?.paused }));
  });
  seek.addEventListener('change',()=>void syncSeek());
  return progress;
}
function updateLyricProgress(status){
  const progress = ensureLyricProgress();
  if(!progress) return;
  const seek = progress.querySelector('[data-lyric-seek]');
  const currentNode = progress.querySelector('[data-lyric-current-time]');
  const totalNode = progress.querySelector('[data-lyric-total-time]');
  const audioDurationMs = embeddedNeteaseAudio && Number.isFinite(Number(embeddedNeteaseAudio.duration)) ? Number(embeddedNeteaseAudio.duration) * 1000 : 0;
  const durationMs = Math.max(0, Number(status?.durationMs || audioDurationMs || 0) || 0);
  const audioCurrentMs = embeddedNeteaseAudio ? Number(embeddedNeteaseAudio.currentTime || 0) * 1000 : 0;
  const currentMs = Math.max(0, Math.min(durationMs || Infinity, Number(status?.positionMs || lyricRuntime.elapsedMs || audioCurrentMs || 0) || 0));
  progress.classList.toggle('is-disabled', durationMs <= 0);
  if(seek && document.activeElement !== seek) seek.value = durationMs > 0 ? String(Math.round(currentMs / durationMs * 1000)) : '0';
  if(currentNode) currentNode.textContent = formatPlaybackTime(currentMs);
  if(totalNode) totalNode.textContent = durationMs > 0 ? formatPlaybackTime(durationMs) : '--:--';
}
async function refreshNeteaseLyrics() {
  if (!els.lyricWidget || state.skin !== 'xinghui') return;
  try {
    const status = await api.lyrics?.neteaseStatus?.();
    const running = status?.running === true;
    const key = `${status?.provider || ''}|${status?.title || ''}|${status?.artist || ''}|${status?.songId || ''}`;
    if (key !== lyricRuntime.key) lyricRuntime = { key, startedAt: performance.now() - Math.max(0, Number(status?.positionMs || 0)), status, lineIndex:-1, elapsedMs:Math.max(0, Number(status?.positionMs || 0)) };
    else lyricRuntime.status = status;
    renderLyricStatus(status);
    els.lyricWidget.classList.toggle('lyric-has-player', running);
    els.lyricWidget.classList.toggle('lyric-empty', !running);
  } catch {
    els.lyricStatus.textContent = '网易云歌词 · 检测失败';
    els.lyricWidget.classList.add('lyric-empty');
  }
}
function currentLyricTriplet(status) {
  const lines = Array.isArray(status?.lines) ? status.lines : [];
  if (!lines.length) return { index:-1, prev:'', current:status?.line || '', next:status?.nextLine || '' };
  const reported = Math.max(0, Number(status?.positionMs || 0));
  let elapsed = reported;
  if (status?.playing === false || status?.stale === true) {
    elapsed = lyricRuntime.elapsedMs || reported;
  } else if (status?.source === 'embedded') {
    elapsed = reported;
  } else {
    elapsed = Math.max(0, performance.now() - lyricRuntime.startedAt);
  }
  lyricRuntime.elapsedMs = elapsed;
  let index = 0;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].time <= elapsed) index = i;
    else break;
  }
  return {
    index,
    prev: lines[index - 1]?.text || '',
    current: lines[index]?.text || status?.line || '',
    next: lines[index + 1]?.text || ''
  };
}
function setLyricCover(url){
  if (!els.lyricCover) return;
  const value = String(url || '');
  els.lyricCover.style.backgroundImage = value ? `url("${value.replace(/"/g,'%22')}")` : '';
  els.lyricCover.classList.toggle('has-cover', !!value);
}
function renderLyricStatus(status) {
  if (!els.lyricWidget) return;
  ensureLyricLines();
  const running = status?.running === true;
  updateLyricMediaIcons(!!running && status?.playing !== false);
  const providerLabel = ({netease:'网易云',qqmusic:'QQ音乐',kugou:'酷狗',kuwo:'酷我',spotify:'Spotify'})[status?.provider] || '后台播放器';
  const detail = running ? (status?.reason || '已检测当前歌曲') : '未检测到后台播放器';
  els.lyricStatus.textContent = running ? providerLabel : '后台歌词';
  els.lyricStatus.dataset.detail = detail;
  els.lyricStatus.title = detail;
  if (els.lyricSongTitle) els.lyricSongTitle.textContent = status?.matchedTitle || status?.title || (running ? '识别当前歌曲中' : '音乐未播放');
  if (els.lyricSongArtist) els.lyricSongArtist.textContent = status?.matchedArtist || status?.artist || status?.rawTitle || '可检测网易云 / QQ音乐 / 酷狗等后台播放器';
  setLyricCover(status?.coverUrl || '');
  updateLyricProgress(status);
  const triplet = currentLyricTriplet(status);
  if (triplet.index !== lyricRuntime.lineIndex) {
    els.lyricWidget.classList.remove('lyric-line-shift');
    void els.lyricWidget.offsetWidth;
    els.lyricWidget.classList.add('lyric-line-shift');
    lyricRuntime.lineIndex = triplet.index;
  }
  if (els.lyricLinePrev) els.lyricLinePrev.textContent = triplet.prev || (running ? ' ' : ' ');
  els.lyricLineA.textContent = triplet.current || (running ? '未匹配到歌词' : '等待播放器状态');
  els.lyricLineB.textContent = triplet.next || (running ? '可用媒体键控制播放/暂停和切歌' : '可在块设置里选择未启动时隐藏或只显示背景图');
  applyLyricLineLayout();
}
async function showNeteaseLoginPanel() {
  if (!els.cloudBlockSettings) return;
  els.cloudBlockSettings.hidden = false;
  els.cloudBlockSettings.dataset.target = 'netease-login';
  els.cloudBlockSettings.style.left = `${Math.max(16, innerWidth - 360)}px`;
  els.cloudBlockSettings.style.top = '86px';
  els.cloudBlockSettings.innerHTML = `<div><b>网易云账号登录</b><button id="cloudBlockSettingsClose" type="button">×</button></div>
    <p class="netease-login-state">正在读取登录状态...</p>
    <div class="netease-login-qr"></div>
    <button class="cloud-block-toggle" id="neteaseStartLogin" type="button">生成二维码</button>
    <button class="cloud-block-toggle" id="neteaseLogout" type="button">退出登录</button>
    <p class="cloud-block-background-state">登录后歌词搜索 / 歌词接口会带上本地 cookie，请用网易云 App 扫码确认。</p>`;
  $('#cloudBlockSettingsClose')?.addEventListener('click',()=>{els.cloudBlockSettings.hidden=true});
  const stateNode = els.cloudBlockSettings.querySelector('.netease-login-state');
  const qrNode = els.cloudBlockSettings.querySelector('.netease-login-qr');
  const refreshState = async () => {
    const result = await api.lyrics?.neteaseLoginState?.();
    const name = result?.profile?.nickname || result?.profile?.userName || '';
    updateNeteaseProfile(result?.profile);
    stateNode.textContent = result?.loggedIn ? `已登录${name ? `：${name}` : ''}` : '未登录';
    const start = $('#neteaseStartLogin');
    if(start) start.textContent = result?.loggedIn ? '切换账号' : '生成二维码';
    if(result?.loggedIn) qrNode.innerHTML = '';
  };
  $('#neteaseLogout')?.addEventListener('click', async ()=>{
    await api.lyrics?.neteaseLogout?.();
    qrNode.innerHTML = '';
    await refreshState();
    toast('网易云登录已清除');
  });
  $('#neteaseStartLogin')?.addEventListener('click', async ()=>{
    const current = await api.lyrics?.neteaseLoginState?.();
    if(current?.loggedIn) await api.lyrics?.neteaseLogout?.();
    stateNode.textContent = current?.loggedIn ? '正在切换账号，生成新二维码...' : '正在生成二维码...';
    const qr = await api.lyrics?.neteaseQrCreate?.();
    if (!qr?.ok) { stateNode.textContent = '二维码生成失败'; return; }
    qrNode.innerHTML = qr.qrimg ? `<img src="${qr.qrimg}" alt="网易云登录二维码"><small>请用网易云 App 扫码</small>` : `<code>${escapeHtml(qr.qrurl || '')}</code>`;
    let attempts = 0;
    const timer = setInterval(async ()=>{
      attempts += 1;
      const checked = await api.lyrics?.neteaseQrCheck?.(qr.key);
      if (checked?.code === 801) stateNode.textContent = '等待扫码...';
      else if (checked?.code === 802) stateNode.textContent = '已扫码，等待确认...';
      else if (checked?.code === 803) {
        clearInterval(timer);
        stateNode.textContent = '登录成功，歌词请求将使用账户 cookie';
        qrNode.innerHTML = '';
        await refreshState();
        lyricRuntime.key = '';
        void refreshNeteaseLyrics();
        void api.lyrics?.neteaseSyncLibrary?.().catch(()=>null);
      } else if (checked?.code === 800 || attempts > 90) {
        clearInterval(timer);
        stateNode.textContent = '二维码已过期，请重新生成';
      }
    }, 1800);
  });
  await refreshState();
}
function showCloudBlankContextMenu(event) {
  if (!els.cloudContextMenu) return;
  const entries = [
    ['newFile', '新建文件'],
    ['console', '打开指令台'],
    ['copyCurrentPath', '复制当前位置'],
    ['parent', '返回上一级'],
    ['refresh', '刷新桌面']
  ];
  els.cloudContextMenu.innerHTML = entries.map(([action,label])=>`<button type="button" data-action="${action}">${escapeHtml(label)}</button>`).join('');
  els.cloudContextMenu.hidden = false;
  const width = 220;
  const height = Math.min(280, entries.length * 42 + 18);
  els.cloudContextMenu.style.left = `${Math.max(10, Math.min(innerWidth - width - 10, event.clientX))}px`;
  els.cloudContextMenu.style.top = `${Math.max(10, Math.min(innerHeight - height - 10, event.clientY))}px`;
  els.cloudContextMenu.querySelectorAll('button').forEach((button)=>button.addEventListener('click',async()=>{
    const action = button.dataset.action;
    hideCloudContextMenu();
    if (action === 'newFile') toggleNewFileDialog(true);
    else if (action === 'console') togglePalette(true);
    else if (action === 'copyCurrentPath') { await api.copyText(state.currentPath || state.payload.roots[0] || ''); toast('路径已复制'); }
    else if (action === 'parent') await goParent();
    else if (action === 'refresh') await loadDesktop();
  }));
}
function showCloudBlockSettings(event) {
  const block = event.target.closest('.cloud-sidebar,.cloud-feed-card,.cloud-path-float,.cloud-top-actions,.cloud-clock-widget,.lyric-widget,.new-file-dialog,.style-drawer,.command-palette,.custom-desk-block');
  if (!block || !els.cloudBlockSettings) return false;
  event.preventDefault();
  document.querySelectorAll('.cloud-settings-target').forEach((node)=>node.classList.remove('cloud-settings-target'));
  block.classList.add('cloud-settings-target');
  const currentTarget = block.dataset.cloudBlock || [...block.classList].find((name)=>name.startsWith('cloud-')) || block.id || 'block';
  const label = block.classList.contains('cloud-sidebar') ? '桌面块'
    : block.classList.contains('cloud-feed-card') ? '文件流投影块'
    : block.classList.contains('cloud-path-float') ? '当前位置块'
    : block.classList.contains('cloud-top-actions') ? '顶部操作块'
    : block.classList.contains('cloud-clock-widget') ? '时间块'
    : block.classList.contains('lyric-widget') ? '歌词块'
    : block.classList.contains('custom-desk-block') ? '自定义块'
    : block.classList.contains('new-file-dialog') ? '新建文件块'
    : block.classList.contains('style-drawer') ? '样式仓块'
    : '指令台块';
  if (els.cloudBlockSettingsTitle) els.cloudBlockSettingsTitle.textContent = label;
  els.cloudBlockSettings.dataset.target = currentTarget;
  const targetStyle = blockStyle(currentTarget);
  const blockBackgroundName = targetStyle.background ? sourceDisplayName(targetStyle.background) : '';
  els.cloudBlockSettings.innerHTML = `<div class="cloud-block-settings-head"><b id="cloudBlockSettingsTitle">${escapeHtml(label)}</b><button id="cloudBlockSettingsClose" type="button">×</button></div>
    <div class="cloud-block-settings-scroll">
    <section class="cloud-setting-section"><header>当前块</header>
    <p class="cloud-block-background-state">${blockBackgroundName?`当前块背景：${escapeHtml(blockBackgroundName)}`:'当前块未设置背景；全局外观（玻璃 / 颜色 / 镂空）请到“样式仓”调整。'}</p>
    <label>块倾斜 <input type="range" min="-45" max="45" value="${clampNumber(targetStyle.tilt, -45, 45, 0)}" data-block-style="tilt"></label>
    <button class="cloud-block-toggle" type="button" data-open-block-background>选择这个块的自定义背景</button>
    </section>
    ${block.classList.contains('custom-desk-block') ? `
    <section class="cloud-setting-section"><header>自定义块</header>
    <label>块大小 <input type="range" min="50" max="220" value="${clampNumber(state.customBlocks.find((entry)=>entry.id===block.dataset.customBlockId)?.blockScale,50,220,100)}" data-custom-block-size="blockScale"></label>
    <label>块宽度 <input type="range" min="120" max="900" value="${clampNumber(state.customBlocks.find((entry)=>entry.id===block.dataset.customBlockId)?.width,120,900,320)}" data-custom-block-size="width"></label>
    <label>块高度 <input type="range" min="80" max="720" value="${clampNumber(state.customBlocks.find((entry)=>entry.id===block.dataset.customBlockId)?.height,80,720,180)}" data-custom-block-size="height"></label>
    <label>边缘圆角 <input type="range" min="0" max="80" value="${clampNumber(state.customBlocks.find((entry)=>entry.id===block.dataset.customBlockId)?.radius,0,80,18)}" data-custom-block-size="radius"></label>
    <label>内容边距 <input type="range" min="0" max="96" value="${clampNumber(state.customBlocks.find((entry)=>entry.id===block.dataset.customBlockId)?.padding,0,96,12)}" data-custom-block-size="padding"></label>
    <label>图片 / 媒体适配 <select data-custom-block-select="fit"><option value="cover" ${state.customBlocks.find((entry)=>entry.id===block.dataset.customBlockId)?.fit==='cover'?'selected':''}>裁剪铺满（可缩放 / 取景）</option><option value="contain" ${state.customBlocks.find((entry)=>entry.id===block.dataset.customBlockId)?.fit!=='cover'?'selected':''}>等比例完整（整图 / 自由摆放）</option></select></label>
    <label>左上角标题 <input type="text" value="${escapeHtml(state.customBlocks.find((entry)=>entry.id===block.dataset.customBlockId)?.title || '')}" data-custom-block-text="title"></label>
    <label>中间文本 <textarea rows="3" data-custom-block-text="text">${escapeHtml(state.customBlocks.find((entry)=>entry.id===block.dataset.customBlockId)?.text || '')}</textarea></label>
    <button class="cloud-block-toggle" type="button" data-custom-block-toggle="hideChrome">${state.customBlocks.find((entry)=>entry.id===block.dataset.customBlockId)?.hideChrome?'显示标题栏':'隐藏标题 / 只留内容'}</button>
    <button class="cloud-block-toggle" type="button" data-custom-block-toggle="hollow">${state.customBlocks.find((entry)=>entry.id===block.dataset.customBlockId)?.hollow?'关闭边框镂空':'开启边框镂空'}</button>
    <p class="cloud-block-background-state">图片 / 媒体块请用“选择这个块的自定义背景”导入本地或壁纸库资源。</p></section>` : ''}
    ${block.classList.contains('lyric-widget') ? `
    <section class="cloud-setting-section"><header>歌词</header>
    <label>音量 <output>${clampNumber(state.lyricVolume,0,100,80)}%</output><input type="range" min="0" max="100" value="${clampNumber(state.lyricVolume,0,100,80)}" data-state-style="lyricVolume"></label>
    <label>歌词大小 <input type="range" min="70" max="180" value="${state.lyricScale}" data-state-style="lyricScale"></label>
    <label>歌词倾斜 <input type="range" min="-35" max="35" value="${state.lyricTilt}" data-state-style="lyricTilt"></label>
    <label>歌词颜色 <input type="color" value="${rgbToHex(state.lyricTextRgb)}" data-state-color="lyricTextRgb"><input type="text" value="${escapeHtml(state.lyricTextRgb)}" data-state-rgb="lyricTextRgb"></label>
    <label>歌词块底色不透明度 <input type="range" min="0" max="80" value="${state.lyricBgAlpha}" data-state-style="lyricBgAlpha"></label>
    <button class="cloud-block-toggle" type="button" data-state-toggle="lyricHollow">${state.lyricHollow?'关闭悬空镂空':'开启悬空镂空'}</button>
    <button class="cloud-block-toggle" type="button" data-state-toggle="lyricOnly">${state.lyricOnly?'关闭只显示歌词':'只显示歌词'}</button>
    <button class="cloud-block-toggle" type="button" data-state-toggle="lyricFreeMove">${state.lyricFreeMove?'关闭自由拖动':'开启自由拖动'}</button>
    <button class="cloud-block-toggle" type="button" data-open-lyric-layout>三行排版 / 楼梯式</button>
    <button class="cloud-block-toggle" type="button" data-open-lyric-effects>歌词展示效果 / 泛光</button>
    <button class="cloud-block-toggle" type="button" data-lyric-empty="image">未启动时：只显示背景图</button>
    <button class="cloud-block-toggle" type="button" data-lyric-empty="hidden">未启动时：不显示</button></section>` : ''}
    ${block.classList.contains('cloud-clock-widget') ? `
    <section class="cloud-setting-section"><header>时间块</header>
    <label>字体 <select data-cloud-clock-font>
      <option value="" ${state.cloudClockFont===''?'selected':''}>等宽数字</option>
      <option value="Georgia,'Noto Serif SC',serif" ${state.cloudClockFont==="Georgia,'Noto Serif SC',serif"?'selected':''}>衬线</option>
      <option value="Bahnschrift,'Microsoft YaHei UI',sans-serif" ${state.cloudClockFont==="Bahnschrift,'Microsoft YaHei UI',sans-serif"?'selected':''}>无衬线</option>
      <option value="'Microsoft YaHei UI',sans-serif" ${state.cloudClockFont==="'Microsoft YaHei UI',sans-serif"?'selected':''}>雅黑</option>
    </select></label>
    <label>整体大小 <input type="range" min="70" max="160" value="${clampNumber(state.cloudClockScale,70,160,100)}" data-state-style="cloudClockScale"></label>
    </section>` : ''}
    </div>`;
  els.cloudBlockSettings.hidden = false;
  const panelWidth = 300;
  const panelHeight = 390;
  const gap = 14;
  const nextLeft = event.clientX > innerWidth / 2 ? event.clientX - panelWidth - gap : event.clientX + gap;
  const nextTop = event.clientY > innerHeight / 2 ? event.clientY - panelHeight - gap : event.clientY + gap;
  els.cloudBlockSettings.style.left = `${Math.max(10, Math.min(innerWidth - panelWidth - 10, nextLeft))}px`;
  els.cloudBlockSettings.style.top = `${Math.max(10, Math.min(innerHeight - panelHeight - 10, nextTop))}px`;
  $('#cloudBlockSettingsClose')?.addEventListener('click',()=>{els.cloudBlockSettings.hidden=true;document.querySelectorAll('.cloud-settings-target').forEach((node)=>node.classList.remove('cloud-settings-target'));closeCloudSidePanels();});
  els.cloudBlockSettings.querySelector('[data-open-lyric-layout]')?.addEventListener('click',(event)=>showLyricLayoutPanel(event.currentTarget));
  els.cloudBlockSettings.querySelector('[data-open-lyric-effects]')?.addEventListener('click',(event)=>showLyricEffectPanel(event.currentTarget));
  els.cloudBlockSettings.querySelector('[data-open-block-background]')?.addEventListener('click',(event)=>{void showBlockBackgroundPanel(event.currentTarget,currentTarget)});
  els.cloudBlockSettings.querySelector('[data-cloud-clock-font]')?.addEventListener('change',(event)=>{
    state.cloudClockFont = event.target.value;
    syncControls();
    persistSettings();
  });
  const lyricVolumeOutput = els.cloudBlockSettings.querySelector('output');
  els.cloudBlockSettings.querySelectorAll('input[data-state-style="lyricVolume"]').forEach((input)=>input.addEventListener('input',()=>{
    if(lyricVolumeOutput) lyricVolumeOutput.textContent = `${input.value}%`;
  }));
  const customBlock = block.classList.contains('custom-desk-block') ? state.customBlocks.find((entry)=>entry.id===block.dataset.customBlockId) : null;
  els.cloudBlockSettings.querySelectorAll('[data-state-toggle]').forEach((button)=>button.addEventListener('click',()=>{
    const key = button.dataset.stateToggle;
    state[key] = !state[key];
    syncControls();
    saveSettings();
    button.textContent = key === 'lyricHollow'
      ? (state[key] ? '关闭悬空镂空' : '开启悬空镂空')
      : key === 'lyricOnly'
        ? (state[key] ? '关闭只显示歌词' : '只显示歌词')
        : key === 'lyricFreeMove'
          ? (state[key] ? '关闭自由拖动' : '开启自由拖动')
          : button.textContent;
  }));
  els.cloudBlockSettings.querySelectorAll('[data-lyric-empty]').forEach((button)=>button.addEventListener('click',()=>{
    state.lyricEmptyMode = button.dataset.lyricEmpty === 'hidden' ? 'hidden' : 'image';
    syncControls();
    persistSettings();
  }));
  els.cloudBlockSettings.querySelectorAll('[data-block-style]').forEach((input)=>input.addEventListener('input',()=>{const style=blockStyle(currentTarget);style[input.dataset.blockStyle]=Number(input.value);applyBlockStyles();persistSettings();}));
  els.cloudBlockSettings.querySelectorAll('[data-custom-block-size]').forEach((input)=>input.addEventListener('input',()=>{if(!customBlock)return;const key=input.dataset.customBlockSize;customBlock[key]=Number(input.value);renderCustomBlocks();persistSettings();}));
  els.cloudBlockSettings.querySelectorAll('[data-custom-block-select]').forEach((input)=>input.addEventListener('change',()=>{if(!customBlock)return;customBlock[input.dataset.customBlockSelect]=input.value;renderCustomBlocks();persistSettings();}));
  els.cloudBlockSettings.querySelectorAll('[data-custom-block-toggle]').forEach((button)=>button.addEventListener('click',()=>{if(!customBlock)return;const key=button.dataset.customBlockToggle;customBlock[key]=!customBlock[key];button.textContent=key==='hollow'?(customBlock[key]?'关闭边框镂空':'开启边框镂空'):(customBlock[key]?'显示标题栏':'隐藏标题 / 只留内容');renderCustomBlocks();persistSettings();}));
  els.cloudBlockSettings.querySelectorAll('[data-custom-block-text]').forEach((input)=>{
    const apply = ()=>{if(!customBlock)return;customBlock[input.dataset.customBlockText]=input.value;persistSettings();};
    input.addEventListener('input', apply);
    input.addEventListener('change',()=>{apply();renderCustomBlocks();});
  });
  els.cloudBlockSettings.querySelectorAll('input[type="range"]').forEach((input)=>input.addEventListener('input',()=>{
    if(input.dataset.cloudStyle){
      const scale=Number(input.dataset.scale)||1;
      const value=input.dataset.unit ? `${input.value}${input.dataset.unit}` : String(Number(input.value)/scale);
      document.documentElement.style.setProperty(input.dataset.cloudStyle,value);
      persistSettings();
    }
    if(input.dataset.stateStyle){
      state[input.dataset.stateStyle]=Number(input.value);
      syncControls();
      persistSettings();
    }
  }));
  els.cloudBlockSettings.querySelectorAll('input[type="checkbox"]').forEach((input)=>input.addEventListener('change',()=>{
    if(input.dataset.stateCheck){
      state[input.dataset.stateCheck]=input.checked;
      syncControls();
      persistSettings();
    }
  }));
  els.cloudBlockSettings.querySelectorAll('input[type="color"]').forEach((input)=>input.addEventListener('input',()=>{
    if(!input.dataset.stateColor)return;
    const rgb = hexToRgb(input.value);
    if(!rgb)return;
    state[input.dataset.stateColor] = rgb.join(',');
    const pair = els.cloudBlockSettings.querySelector(`input[data-state-rgb="${input.dataset.stateColor}"]`);
    if(pair) pair.value = state[input.dataset.stateColor];
    syncControls();
    persistSettings();
  }));
  els.cloudBlockSettings.querySelectorAll('input[data-state-rgb]').forEach((input)=>input.addEventListener('change',()=>{
    const rgb = parseRgb(input.value);
    if(!rgb){ input.value = state[input.dataset.stateRgb] || '255,255,255'; return; }
    state[input.dataset.stateRgb] = rgb.join(',');
    const pair = els.cloudBlockSettings.querySelector(`input[data-state-color="${input.dataset.stateRgb}"]`);
    if(pair) pair.value = rgbToHex(state[input.dataset.stateRgb]);
    syncControls();
    persistSettings();
  }));
  return true;
}
function organizeStyleDrawer() {
  if (!els.styleDrawer || els.styleDrawer.dataset.organized) return;
  els.styleDrawer.dataset.organized = '1';
  const blockSpecs = [
    ['style-skin', '皮肤 / 壁纸', ['#skinModes', '#wallpaperSourceModes', '.wallpaper-library', '#chooseBackground']],
    ['style-global', '全局外观 / 云屿', ['#cloudGlassAlphaRange', '#cloudBorderAlphaRange', '#cloudGlassBlurRange', '#cloudFontScaleRange', '#cloudTextRgbColor', '#cloudTextRgbInput', '#cloudBorderRgbColor', '#cloudBorderRgbInput', '#cloudHollowModes', '#cloudPanelImageModes']],
    ['style-theme', '主题配色', ['#themeModeModes', '#themeHueRange', '#themeSatRange', '#themeAlphaRange', '#themeRgbInput']],
    ['style-motion', '动效 / 加载', ['#motionRange', '#densityRange', '#particleFpsModes', '#inactiveFpsModes', '#loadSpeedRange', '#loadGapRange']],
    ['style-glass', '玻璃 / 透明', ['#wallpaperOpacityRange', '#wallpaperBrightnessRange', '#wallpaperSaturationRange', '#particleOpacityRange', '#wallpaperBlurRange', '#panelBlurRange']],
    ['style-orbit', '星系专属', ['#perspectiveRange', '#shelfScaleRange', '#pathSpeedRange', '#focusDisplayModes', '#focusXRange', '#focusYRange', '#flowModes', '.particle-position-settings', '.source-region-settings']]
  ];
  blockSpecs.forEach(([className, title, selectors]) => {
    const nodes = selectors.map((selector) => {
      const node = $(selector);
      return node?.closest?.('.visual-settings,.flow-control,.control-label,.drawer-actions,.wallpaper-library') || node;
    }).filter((node, index, arr) => node && arr.indexOf(node) === index && node.parentNode && !node.closest('.style-section'));
    if (!nodes.length) return;
    const section = document.createElement('section');
    section.className = `style-section ${className}`;
    section.innerHTML = `<header><b>${title}</b><span class="style-section-lock">锁定</span></header>`;
    nodes[0].parentNode.insertBefore(section, nodes[0]);
    nodes.forEach((node) => section.appendChild(node));
  });
  const loginButton = document.createElement('button');
  loginButton.id = 'neteaseLoginButton';
  loginButton.type = 'button';
  loginButton.className = 'style-login-button';
  loginButton.innerHTML = '<span class="netease-login-avatar"></span><span>网易云账号登录</span><em>未登录</em>';
  loginButton.addEventListener('click', showNeteaseLoginPanel);
  els.styleDrawer.querySelector('.drawer-head')?.after(loginButton);
  void refreshNeteaseLoginButton();
  const createButton = document.createElement('button');
  createButton.id = 'createBlockButton';
  createButton.type = 'button';
  createButton.className = 'style-login-button create-block-button';
  createButton.textContent = '新建块';
  createButton.addEventListener('click',(event)=>showCreateBlockPanel(event.currentTarget));
  loginButton.after(createButton);
  document.querySelectorAll('.preset').forEach((button)=>{
    const text = button.textContent || '';
    if(/极昼|急奏|余静|引粒子|粒子|脊皱|脊咒/.test(text)) button.remove();
  });
}
function bindCloudBlockSettingsDrag(){
  const panel = els.cloudBlockSettings;
  if (!panel || panel.dataset.dragBound) return;
  panel.dataset.dragBound = '1';
  let drag = null;
  panel.addEventListener('pointerdown',(event)=>{
    if(event.button!==0 || event.target.closest('input,button,textarea,select')) return;
    const box = panel.getBoundingClientRect();
    drag = { id:event.pointerId, dx:event.clientX-box.left, dy:event.clientY-box.top };
    panel.setPointerCapture?.(event.pointerId);
  });
  panel.addEventListener('pointermove',(event)=>{
    if(!drag || event.pointerId!==drag.id) return;
    event.preventDefault();
    const width = panel.offsetWidth || 300;
    const height = panel.offsetHeight || 340;
    panel.style.left = `${Math.max(8, Math.min(innerWidth - width - 8, event.clientX - drag.dx))}px`;
    panel.style.top = `${Math.max(8, Math.min(innerHeight - height - 8, event.clientY - drag.dy))}px`;
  });
  const stop = (event)=>{ if(drag && event.pointerId===drag.id) drag = null; };
  panel.addEventListener('pointerup', stop);
  panel.addEventListener('pointercancel', stop);
}
let cloudRowObserver = null;
function observeCloudRows() {
  if (!els.cloudFileList || !('IntersectionObserver' in window)) return;
  cloudRowObserver?.disconnect?.();
  cloudRowObserver = new IntersectionObserver((entries)=>{
    entries.forEach((entry)=>{
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('cloud-row-visible');
      void entry.target.offsetWidth;
      entry.target.classList.add('cloud-row-visible');
    });
  }, { root: els.cloudFileList, threshold: .22 });
  els.cloudFileList.querySelectorAll('.cloud-file-row').forEach((row)=>cloudRowObserver.observe(row));
}
async function toggleFavorite(item){const exists=state.favorites.some((entry)=>entry.path===item.path);state.favorites=exists?state.favorites.filter((entry)=>entry.path!==item.path):[{id:item.id,name:item.name,path:item.path,isDirectory:item.isDirectory,kind:effectiveKind(item),extension:item.extension||'',modifiedAt:item.modifiedAt,size:item.size},...state.favorites].slice(0,12);renderFavoriteTray();await saveSettings();toast(exists?'已移出常用星系':'已加入常用星系')}
function renderFavoriteTray(){if(!els.favoriteGalaxyTray)return;const items=(Array.isArray(state.favorites)?state.favorites:[]).slice(0,12);els.favoriteGalaxyTray.classList.toggle('empty',!items.length);els.favoriteGalaxyTray.innerHTML=`<span class="favorite-tray-title"><b>常用轨道</b><em>${items.length?`${items.length} 项已固定`:'尚未固定项目'}</em></span><button class="favorite-core" type="button" aria-label="${items.length?'打开常用轨道':'添加常用项目'}" title="${items.length?'打开常用轨道':'在右侧列表点击星标添加'}">${items.length||'+'}</button>${items.map((item,index)=>`<button class="favorite-orbit-item" type="button" data-path="${escapeHtml(item.path)}" aria-label="打开 ${escapeHtml(item.name)}" title="${escapeHtml(item.name)}" style="--fav-index:${index};--fav-angle:${Math.round(index*360/Math.max(1,items.length))}deg;--fav-radius:${index%2?50:36}px">${escapeHtml(initials(item.name))}</button>`).join('')}`;els.favoriteGalaxyTray.querySelector('.favorite-core')?.addEventListener('click',async()=>{if(items.length)await enterFavoriteLayer();else toast('在右侧列表点击 ☆ 加入常用')});els.favoriteGalaxyTray.querySelectorAll('[data-path]').forEach((button)=>button.addEventListener('click',async()=>{const item=items.find((entry)=>entry.path===button.dataset.path);if(item)await activateItem(item)}))}
function defaultNewFileDirectory(){
  if(state.newFileDirectory)return state.newFileDirectory;
  if(state.currentPath&&state.currentPath!=='此电脑'&&state.currentPath!=='常用应用'&&!/^搜索结果/.test(state.currentPath))return state.currentPath;
  return state.payload.roots[0] || '';
}
function toggleNewFileDialog(force){
  if(!els.newFileDialog)return;
  const show=force ?? els.newFileDialog.hidden;
  els.newFileDialog.hidden=!show;
  document.body.classList.toggle('new-file-open',show);
  if(show){
    els.newFilePath.value=defaultNewFileDirectory();
    if(!els.newFileName.value)els.newFileName.value='新建文件.txt';
    els.newFileName.focus();
    els.newFileName.select();
  }
}
async function chooseNewFileDirectory(){
  const result=await api.chooseDirectory?.(els.newFilePath?.value||defaultNewFileDirectory());
  if(result?.ok&&result.path){state.newFileDirectory=result.path;els.newFilePath.value=result.path;persistSettings()}
}
async function createNewFileFromDialog(){
  const directory=(els.newFilePath?.value||defaultNewFileDirectory()).trim();
  const name=(els.newFileName?.value||'').trim();
  if(!directory){toast('请选择目标路径');return}
  if(!name){toast('请输入文件名');return}
  const result=await api.createFile?.({directory,name});
  if(!result?.ok){toast(result?.error==='FILE_EXISTS'?'文件已存在':'新建文件失败');return}
  state.newFileDirectory=directory;
  toggleNewFileDialog(false);
  toast(`已新建 ${result.item?.name||name}`);
  if(state.currentPath===directory||(!state.currentItems&&directory===(state.payload.roots[0]||'')))await loadDesktop();
  else if(state.currentPath===directory){const listed=await api.listDirectory(directory);state.currentItems=listed.items;selectGroup('all')}
  persistSettings();
}
async function hydrateIcons(items){if(iconRequestPromise)await iconRequestPromise;const missing=items.filter((item)=>!iconCache.has(item.path)).slice(0,48);if(missing.length){iconRequestPromise=(async()=>{try{const icons=await api.getFileIcons(missing.map((item)=>item.path));Object.entries(icons||{}).forEach(([itemPath,dataUrl])=>{iconCache.set(itemPath,dataUrl||'');if(iconCache.size>ICON_CACHE_LIMIT)iconCache.delete(iconCache.keys().next().value)})}catch{}finally{iconRequestPromise=null}})();await iconRequestPromise}items.forEach((item)=>{const dataUrl=iconCache.get(item.path);if(!dataUrl)return;spatialShelf?.updateIcon(item.id,dataUrl);document.querySelectorAll(`[data-id="${CSS.escape(item.id)}"] .file-icon,[data-id="${CSS.escape(item.id)}"] .planet-face,[data-id="${CSS.escape(item.id)}"] .cloud-file-icon`).forEach((node)=>{node.innerHTML=`<img src="${dataUrl}" alt="">`});if(state.selectedId===item.id)els.coreGlyph.innerHTML=`<img src="${dataUrl}" alt="">`})}
function updateShelfDepth(items, fromScroll) {
  const listRect=els.itemList.getBoundingClientRect();const center=listRect.top+listRect.height/2;let nearest=null;let nearestDistance=Infinity;
  const measurements=[...els.itemList.querySelectorAll('.file-row')].map((row)=>{const rect=row.getBoundingClientRect();const distance=(rect.top+rect.height/2)-center;const normalized=Math.max(-1,Math.min(1,distance/(listRect.height*.48)));if(Math.abs(distance)<nearestDistance){nearestDistance=Math.abs(distance);nearest=row}return{row,normalized,abs:Math.abs(normalized)}});
  measurements.forEach(({row,normalized,abs})=>{row.style.setProperty('--scale',(1-abs*.16).toFixed(3));row.style.setProperty('--opacity',(1-abs*.68).toFixed(3));row.style.setProperty('--depth',Math.round((1-abs)*20));row.style.setProperty('--tilt',`${(-normalized*7).toFixed(2)}deg`)});
  if(fromScroll&&nearest&&nearest.dataset.id!==state.selectedId){const item=items.find((entry)=>entry.id===nearest.dataset.id);if(item)selectItem(item,items.indexOf(item),{tone:true});}
}
function stableNumber(value) {
  return String(value || '').split('').reduce((sum, char) => ((sum * 31) + char.charCodeAt(0)) >>> 0, 7);
}
function renderChildOrbit(item) {
  const preview = Array.isArray(item.childPreview) ? item.childPreview.slice(0, 5) : [];
  const total = Number(item.childCount || preview.length || 0);
  const count = Math.min(5, total);
  if (!item.isDirectory || count <= 0) return '';
  const seed = stableNumber(item.path || item.name);
  const direction = seed % 2 ? 1 : -1;
  if (total > 5) {
    const starTotal = Math.min(26, 12 + Math.round(Math.min(total, 40) * .35));
    const stars = Array.from({ length: starTotal }, (_, index) => `<i style="--star-index:${index};--star-total:${starTotal};--star-ring:${12 + (index % 5) * 6}px;--star-scale:${(.68 + (index % 4) * .15).toFixed(2)}"></i>`).join('');
    return `<span class="branch-system galaxy-branch" style="--moon-dir:${direction};--moon-speed:${14 + (seed % 10)}s"><span class="galaxy-disk">${stars}<em>${total}</em></span></span>`;
  }
  const moons = Array.from({ length: count }, (_, index) => {
    const child = preview[index] || { name: `${index + 1}`, isDirectory: false, extension: '' };
    const label = child.isDirectory ? child.name : (child.extension || child.name);
    const glyph = child.isDirectory ? '□' : (child.extension || '·').slice(0, 2).toUpperCase();
    return `<i class="moon-node ${child.isDirectory?'folder':'file'}" style="--moon-index:${index};--moon-total:${count}" title="${escapeHtml(child.name)}"><span>${escapeHtml(glyph)}</span><b>${escapeHtml(label)}</b></i>`;
  }).join('');
  const more = Number(item.childCount || 0) > count ? `<em class="moon-more">+${Number(item.childCount) - count}</em>` : '';
  return `<span class="branch-system" style="--moon-dir:${direction};--moon-speed:${10 + (seed % 10)}s"><span class="branch-line"></span><span class="moon-ring">${moons}${more}</span></span>`;
}
function renderOrbit(items) {
  if (state.skin === 'xinghui') {
    if (orbitRaf) cancelAnimationFrame(orbitRaf);
    orbitRaf = 0;
    orbitNodeCache = [];
    els.orbitNodes.innerHTML = '';
    return;
  }
  const shown=items.slice(0,14);
  els.orbitNodes.innerHTML=shown.map((item,index)=>orbitNodeHtml(item,index,shown.length)).join('');
  orbitNodeCache=[...els.orbitNodes.querySelectorAll('.orbit-node')];
  orbitNodeCache.forEach((node,index)=>bindOrbitNode(node,shown[index],index));
  orbitStart=performance.now();
  startOrbitAnimation();
  hydrateIcons(shown);
}
function orbitNodeHtml(item,index,total){return `<button class="orbit-node" data-id="${item.id}" data-orbit-index="${index}" data-dir="${stableNumber(item.path)%2?1:-1}" style="--x:50%;--y:50%;--scale:1;--depth:0;--fade:.8;--orbit-delay:${index};--node-total:${total};--node-spin:${stableNumber(item.name)%360}deg"><span class="planet"><span class="planet-face">${escapeHtml(initials(item.name))}</span>${renderChildOrbit(item)}</span><b>${escapeHtml(item.name)}</b><small>${shortType(item)}${item.childCount?` 路 ${item.childCount}`:''}</small></button>`}
function bindOrbitNode(node,item,index){node.addEventListener('pointerenter',()=>{orbitFrozenId=node.dataset.id;node.classList.add('node-frozen')});node.addEventListener('pointerleave',()=>{if(orbitFrozenId===node.dataset.id)orbitFrozenId='';node.classList.remove('node-frozen')});node.addEventListener('click',()=>selectItem(item,index));node.addEventListener('dblclick',()=>activateItem(item))}
function applyGalaxyView(){
  galaxyYaw=Math.max(-32,Math.min(32,galaxyYaw));
  galaxyPitch=Math.max(-18,Math.min(18,galaxyPitch));
  galaxyZoom=Math.max(.64,Math.min(1.82,galaxyZoom));
  state.focusX=galaxyCenterX;
  state.focusY=galaxyCenterY;
  document.documentElement.style.setProperty('--galaxy-yaw',`${galaxyYaw.toFixed(2)}deg`);
  document.documentElement.style.setProperty('--galaxy-pitch',`${galaxyPitch.toFixed(2)}deg`);
  document.documentElement.style.setProperty('--galaxy-zoom',galaxyZoom.toFixed(3));
  document.documentElement.style.setProperty('--galaxy-x',`${galaxyCenterX.toFixed(3)}%`);
  document.documentElement.style.setProperty('--galaxy-y',`${galaxyCenterY.toFixed(3)}%`);
  wallpaperParticles?.setViewAngles?.(galaxyYaw,galaxyPitch);
}
function startOrbitAnimation(){
  cancelAnimationFrame(orbitRaf);
  const tick=(now)=>{
    const orbitFps=appActive?(MEMORY_SAFE_BASELINE?30:45):5;
    if(now&&now-orbitLastFrame<1000/orbitFps){orbitRaf=requestAnimationFrame(tick);return}
    orbitLastFrame=now||performance.now();
    const nodes=orbitNodeCache.length?orbitNodeCache:[...els.orbitNodes.querySelectorAll('.orbit-node')];
    const count=Math.max(1,nodes.length);
    const t=(now-orbitStart)/1000;
    const coreX = galaxyCenterX;
    const coreY = galaxyCenterY;
    nodes.forEach((node,index)=>{
      if(node.dataset.id&&node.dataset.id===orbitFrozenId)return;
      const base=index/count*Math.PI*2;
      const dir=Number(node.dataset.dir)||1;
      const angle=base+dir*t*(0.155+state.motion/1650);
      const lane=1+(index%3)*.085;
      const x=coreX+Math.cos(angle)*31*galaxyZoom*lane+Math.sin(angle)*-1.8*galaxyZoom;
      const y=coreY+Math.sin(angle)*12.5*galaxyZoom*lane+Math.cos(angle)*3.2*galaxyZoom;
      const depth=(Math.sin(angle)+1)/2;
      const scale=.62+depth*.42+(node.classList.contains('active') ? .14 : 0);
      node.style.setProperty('--x',`${x.toFixed(3)}%`);
      node.style.setProperty('--y',`${y.toFixed(3)}%`);
      node.style.setProperty('--scale',scale.toFixed(3));
      node.style.setProperty('--depth',Math.round(depth*80));
      node.style.setProperty('--fade',(.42+depth*.58).toFixed(3));
      node.style.zIndex=String(4+Math.round(depth*8));
    });
    orbitRaf=requestAnimationFrame(tick);
  };
  orbitRaf=requestAnimationFrame(tick);
}
function selectItem(item,index=0,options={}) {
  state.selectedId=item.id; document.querySelectorAll('[data-id]').forEach((node)=>node.classList.toggle('active',node.dataset.id===item.id));
  if (document.activeElement?.classList?.contains('orbit-node')) document.activeElement.blur();
  els.coreTitle.textContent=item.name;
  const icon=iconCache.get(item.path);
  els.coreGlyph.innerHTML=icon?`<img src="${icon}" alt="">`:escapeHtml(initials(item.name));
  els.coreMeta.textContent=item.isDirectory?'双击进入轨道':shortType(item);
  renderCloudFocus(item);
  if(options.tone!==false)clickTone(index);
}
function clearSelection() {
  state.selectedId = '';
  document.querySelectorAll('[data-id].active').forEach((node) => node.classList.remove('active'));
  setCoreToCurrentPath(groupItems(state.activeGroup));
}
async function cameraTransition(direction, commit) {
  const leaving=direction==='back'?'camera-leaving':'camera-entering';const arriving=direction==='back'?'camera-returning':'camera-arriving';
  els.stage.classList.remove('camera-entering','camera-arriving','camera-leaving','camera-returning');els.stage.classList.add(leaving);await new Promise((resolve)=>setTimeout(resolve,direction==='back'?500:560));commit();els.stage.classList.remove(leaving);els.stage.classList.add(arriving);await new Promise((resolve)=>setTimeout(resolve,680));els.stage.classList.remove(arriving);
}
async function activateItem(item) {
  if (item.isDirectory) {
    try {
      const result = await api.listDirectory(item.path);
      await cameraTransition('forward', () => {
        state.currentItems = result.items.map((entry) => ({ ...entry, kind: entry.isDirectory ? 'folders' : 'other' }));
        state.currentPath = result.path;
        state.currentParent = result.parent || '';
        state.commandCwd = result.path;
        document.body.classList.remove('computer-layer');
        selectGroup('all');
      });
    } catch (error) {
      toast(`无法读取：${error.message}`);
    }
  } else {
    const result = await api.openPath(item.path);
    toast(result.ok ? '已打开' : '打开失败');
  }
}
async function goParent(){
  if(state.currentPath==='此电脑'){toast('已经在此电脑');return}
  if(document.body.classList.contains('favorite-layer')){enterDesktopLayer();return}
  const parentPath=state.currentParent || state.currentPath.replace(/[\/][^\/]+[\/]?$/,'');
  if(!parentPath || parentPath==='此电脑' || parentPath===state.currentPath){await enterComputerLayer();return}
  try{
    const result=await api.listDirectory(parentPath);
    await cameraTransition('back',()=>{state.currentItems=result.items.map((entry)=>({...entry,kind:entry.isDirectory?'folders':'other'}));state.currentPath=result.path;state.currentParent=result.parent || '';state.commandCwd=result.path;document.body.classList.remove('computer-layer');selectGroup('all')})
  }catch{await enterComputerLayer()}
}

function togglePalette(force) {
  const show = force ?? els.commandPalette.hidden;
  els.commandPalette.hidden = !show;
  if (show) {
    if (state.skin === 'xinghui' && !els.commandPalette.dataset.cloudPositioned) {
      els.commandPalette.style.left = '50%';
      els.commandPalette.style.top = '84px';
      els.commandPalette.style.transform = 'translateX(-50%)';
    }
    const focusInput = () => {
      if (els.commandPalette.hidden) return;
      els.commandInput.focus({ preventScroll: true });
      els.commandInput.select();
    };
    focusInput();
    void requestKeyboardFocus('command-palette').then(() => requestAnimationFrame(focusInput));
  } else {
    els.commandInput.blur();
  }
}
function bindCommandPaletteDrag(){
  const panel=els.commandPalette, handle=panel?.querySelector('.command-input-row');
  if(!panel||!handle||handle.dataset.dragBound)return;
  handle.dataset.dragBound='1';
  let drag=null;
  handle.addEventListener('pointerdown',(event)=>{
    if(event.button!==0||event.target===els.commandInput||event.target.closest('button,a,kbd,[role="button"]'))return;
    const box=panel.getBoundingClientRect();
    drag={id:event.pointerId,dx:event.clientX-box.left,dy:event.clientY-box.top};
    handle.setPointerCapture?.(event.pointerId);
  });
  handle.addEventListener('pointermove',(event)=>{
    if(!drag||event.pointerId!==drag.id)return;
    event.preventDefault();
    const width=panel.offsetWidth||520,height=panel.offsetHeight||220;
    const left=Math.max(8,Math.min(innerWidth-width-8,event.clientX-drag.dx));
    const top=Math.max(8,Math.min(innerHeight-height-8,event.clientY-drag.dy));
    panel.style.left=`${left}px`;
    panel.style.top=`${top}px`;
    panel.style.transform='none';
    panel.dataset.cloudPositioned='1';
  });
  const stop=(event)=>{if(drag&&event.pointerId===drag.id)drag=null};
  handle.addEventListener('pointerup',stop);
  handle.addEventListener('pointercancel',stop);
}
function bindCloudMovableBlocks(){
  const targets=[
    {node:els.cloudPathButton,x:'cloudPathX',y:'cloudPathY',kind:'path'},
    {node:document.querySelector('#cloudClockWidget'),x:'cloudClockX',y:'cloudClockY',kind:'clock'},
    {node:els.lyricWidget,x:'lyricX',y:'lyricY',kind:'lyric'}
  ];
  targets.forEach(({node,x,y,kind})=>{
    if(!node||node.dataset.cloudMoveBound)return;
    node.dataset.cloudMoveBound='1';
    let drag=null;
    node.addEventListener('pointerdown',(event)=>{
      const freeLyricMove = node === els.lyricWidget && state.lyricFreeMove === true;
      const hitFormControl = event.target.closest('input,select,textarea,[contenteditable]');
      const hitOtherButton = event.target.closest('button') && event.target.closest('button') !== node;
      if((!freeLyricMove && !event.altKey)||event.button!==0||hitFormControl||hitOtherButton)return;
      event.preventDefault();
      drag={id:event.pointerId,startX:event.clientX,startY:event.clientY,baseX:Number(state[x])||0,baseY:Number(state[y])||0};
      node.setPointerCapture?.(event.pointerId);
      node.classList.add('cloud-moving');
    });
    node.addEventListener('pointermove',(event)=>{
      if(!drag||event.pointerId!==drag.id)return;
      event.preventDefault();
      state[x]=drag.baseX+event.clientX-drag.startX;
      state[y]=drag.baseY+event.clientY-drag.startY;
      applyPositionOnly(kind);
    });
    const stop=(event)=>{
      if(!drag||event.pointerId!==drag.id)return;
      drag=null;
      node.classList.remove('cloud-moving');
      persistSettings();
    };
    node.addEventListener('pointerup',stop);
    node.addEventListener('pointercancel',stop);
  });
}
function bindCtrlRightDragBlocks(){
  const selector='.cloud-sidebar,.cloud-feed-card,.cloud-path-float,.cloud-top-actions,.cloud-clock-widget,.lyric-widget,.new-file-dialog,.style-drawer,.command-palette,.custom-desk-block,.ai-grokbot-trigger';
  let drag=null;
  const deleteZoneHeight = 118;
  const ensureDeleteZone=()=>{
    let zone = $('#cloudDeleteZone');
    if(!zone){
      zone = document.createElement('div');
      zone.id = 'cloudDeleteZone';
      zone.className = 'cloud-delete-zone';
      zone.innerHTML = '<span>删除</span><small>丢到回收站</small>';
      document.body.appendChild(zone);
    }
    return zone;
  };
  const setDeleteZoneActive=(active)=>{
    const zone = ensureDeleteZone();
    zone.classList.toggle('active', !!active);
  };
  const clearDragUi=()=>{
    document.body.classList.remove('cloud-block-dragging','cloud-delete-ready','peek-left','peek-right','peek-top','peek-bottom');
    $('#cloudDeleteZone')?.classList.remove('active');
  };
  document.addEventListener('pointerdown',(event)=>{
    if(state.skin!=='xinghui'||!event.ctrlKey||event.button!==2)return;
    const node=event.target.closest?.(selector);
    if(!node)return;
    event.preventDefault();
    event.stopPropagation();
    hideCloudContextMenu();
    closeCloudSidePanels();
    const target=blockStyleKey(node.dataset.cloudBlock || [...node.classList].find((name)=>name.startsWith('cloud-')) || node.id || 'block');
    const rect=node.getBoundingClientRect();
    const isAiTrigger = node.id === 'aiGrokbotTrigger';
    const isTransformDrag = node.classList.contains('cloud-path-float') || node.classList.contains('cloud-clock-widget') || isAiTrigger;
    const transformKey = node.classList.contains('cloud-path-float') ? ['cloudPathX','cloudPathY'] : node.classList.contains('cloud-clock-widget') ? ['cloudClockX','cloudClockY'] : isAiTrigger ? ['aiX','aiY'] : null;
    if(!isTransformDrag){
      const style=blockStyle(target);
      style.x=rect.left;
      style.y=rect.top;
    }
    const customId = node.classList.contains('custom-desk-block') ? node.dataset.customBlockId : '';
    drag={id:event.pointerId,node,target,customId,startX:event.clientX,startY:event.clientY,baseX:isTransformDrag?(Number(state[transformKey[0]])||0):rect.left,baseY:isTransformDrag?(Number(state[transformKey[1]])||0):rect.top,transformDrag:isTransformDrag,transformKey,deleteReady:false};
    node.classList.add('cloud-grabbed');
    document.body.classList.add('cloud-block-dragging');
    document.body.classList.remove('peek-left','peek-right','peek-top','peek-bottom');
    setDeleteZoneActive(false);
    node.setPointerCapture?.(event.pointerId);
    applyBlockStyles();
  },true);
  document.addEventListener('pointermove',(event)=>{
    if(!drag||event.pointerId!==drag.id)return;
    event.preventDefault();
    if(drag.transformDrag){
      state[drag.transformKey[0]]=drag.baseX+event.clientX-drag.startX;
      state[drag.transformKey[1]]=drag.baseY+event.clientY-drag.startY;
      const kind = drag.transformKey[0] === 'cloudPathX' ? 'path' : drag.transformKey[0] === 'cloudClockX' ? 'clock' : 'ai';
      applyPositionOnly(kind);
    } else {
      const style=blockStyle(drag.target);
      style.x=Math.max(0,Math.min(innerWidth-40,drag.baseX+event.clientX-drag.startX));
      style.y=Math.max(0,Math.min(innerHeight-40,drag.baseY+event.clientY-drag.startY));
      applyBlockStyles();
    }
    drag.deleteReady = !!drag.customId && event.clientY <= deleteZoneHeight;
    document.body.classList.toggle('cloud-delete-ready', drag.deleteReady);
    setDeleteZoneActive(drag.deleteReady);
    if(drag.node===els.lyricWidget)lyricAutoTiltRefresh();
  },true);
  const stop=(event)=>{
    if(!drag||event.pointerId!==drag.id)return;
    event.preventDefault();
    const shouldDelete = drag.deleteReady && !!drag.customId;
    const deletedTitle = drag.node.querySelector('header b')?.textContent || '自定义块';
    drag.node.classList.remove('cloud-grabbed');
    if(shouldDelete){
      state.customBlocks = state.customBlocks.filter((block)=>block.id !== drag.customId);
      delete state.blockStyles?.[drag.target];
      renderCustomBlocks();
      toast(`已删除：${deletedTitle}`);
    }
    drag=null;
    clearDragUi();
    persistSettings();
  };
  document.addEventListener('pointerup',stop,true);
  document.addEventListener('pointercancel',(event)=>{if(drag&&event.pointerId===drag.id){drag.node.classList.remove('cloud-grabbed');drag=null;clearDragUi();}},true);
  document.addEventListener('contextmenu',(event)=>{if(drag||event.ctrlKey)event.preventDefault()},true);
}
function printCommand(html){els.commandOutput.insertAdjacentHTML('beforeend',`<p>${html}</p>`);els.commandOutput.scrollTop=els.commandOutput.scrollHeight;}
async function runCommand(raw) {
  const input=raw.trim(); if(!input)return; printCommand(`<b>${escapeHtml(state.commandCwd)} ›</b> ${escapeHtml(input)}`);
  const [command,...parts]=input.match(/(?:[^\s"]+|"[^"]*")+/g)||[]; const arg=parts.join(' ').replace(/^"|"$/g,''); const cmd=(command||'').toLowerCase();
  if(cmd==='help')printCommand('命令：cd [路径] · dir/ls · open [路径] · copy [路径] · pwd · cls · theme [polar|ember|violet]');
  else if(cmd==='pwd')printCommand(escapeHtml(state.commandCwd));
  else if(cmd==='cls'){els.commandOutput.innerHTML='';}
  else if(cmd==='cd'){try{const target=arg==='..'?(state.currentParent||state.commandCwd.replace(/[\/][^\/]+[\/]?$/,'')):arg||state.payload.roots[0];const result=await api.listDirectory(target);state.commandCwd=result.path;state.currentPath=result.path;state.currentParent=result.parent || '';state.currentItems=result.items.map((entry)=>({...entry,kind:entry.isDirectory?'folders':'other'}));document.body.classList.remove('computer-layer');selectGroup('all');printCommand(`已进入 ${escapeHtml(result.path)}`)}catch(error){printCommand(`<span style="color:#ff8a91">路径不可用：${escapeHtml(error.message)}</span>`)}}
  else if(cmd==='dir'||cmd==='ls'){try{const result=await api.listDirectory(state.commandCwd);printCommand(result.items.slice(0,30).map((entry)=>`${entry.isDirectory?'[DIR]':'     '} ${escapeHtml(entry.name)}`).join('<br>'))}catch(error){printCommand(escapeHtml(error.message))}}
  else if(cmd==='open'){const target=arg||state.commandCwd;const result=await api.openPath(target);printCommand(result.ok?'已打开':escapeHtml(result.error));}
  else if(cmd==='copy'){await api.copyText(arg||state.commandCwd);printCommand('路径已复制');}
  else if(cmd==='theme'&&presets[arg]){applyPreset(arg);await saveSettings();printCommand(`已切换为 ${presets[arg].name}`)}
  else { const query=input.toLowerCase(); const matches=state.payload.items.filter((item)=>item.name.toLowerCase().includes(query)); if(matches.length){state.currentItems=matches;state.currentPath='搜索结果';selectGroup('all');printCommand(`找到 ${matches.length} 个对象`)}else printCommand('没有匹配项，输入 help 查看命令。'); }
}

function drawParticles(){const count=Math.round(22+state.density*.92);particles=Array.from({length:count},()=>{const z=Math.random();const kind=z>.90?'flare':z>.56?'star':z>.26?'dust':'mist';const corner=Math.floor(Math.random()*4);const marginX=innerWidth*.28,marginY=innerHeight*.28;const x=corner%2?innerWidth-Math.random()*marginX:Math.random()*marginX;const y=corner>1?innerHeight-Math.random()*marginY:Math.random()*marginY;return{x,y,z:.10+z*.50,r:kind==='mist'?22+Math.random()*48:.22+Math.random()*(kind==='flare'?1.55:.9),phase:Math.random()*6.28,kind,twinkle:.45+Math.random()*1.2,trail:kind==='flare'&&Math.random()>.7}});}
function effectiveParticleFps(){return appActive?Math.min(30,Number(state.particleFps)||30):(state.inactiveFps==='pause'?0:Math.min(5,Number(state.inactiveFps)||5))}
function frameIntervalFromFps(fps){return fps>0?1000/fps:Infinity}
function animate(now=0){if(!shouldDrawAmbientParticles()){releaseAmbientCanvas(!!wallpaperParticles||state.thumbnailEnabled===false);if(!wallpaperParticles&&!ambientIdleTimer)ambientIdleTimer=setTimeout(()=>{ambientIdleTimer=0;animate(performance.now())},1000);return;}if(ambientIdleTimer){clearTimeout(ambientIdleTimer);ambientIdleTimer=0;}const fps=effectiveParticleFps();if(!fps){raf=requestAnimationFrame(animate);return;}if(now&&now-lastCanvasDraw<frameIntervalFromFps(fps)){raf=requestAnimationFrame(animate);return;}lastCanvasDraw=now||performance.now();ctx.clearRect(0,0,innerWidth,innerHeight);const speed=state.motion/100;const rgb=getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb')||'143,232,238';time+=.0048*speed;ctx.globalCompositeOperation='lighter';for(const p of particles){const pulse=.62+Math.sin(time*(5.2+p.twinkle)+p.phase)*.38;const x=p.x;const y=p.y;if(p.kind==='mist'){const g=ctx.createRadialGradient(x,y,0,x,y,p.r*(1.1+p.z));g.addColorStop(0,`rgba(${rgb},${.010*pulse})`);g.addColorStop(.42,`rgba(142,94,255,${.007*pulse})`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,p.r,0,Math.PI*2);ctx.fill();}else{const radius=p.r*(.6+p.z*.75)*pulse;const alpha=(p.kind==='flare'?.36:p.kind==='star'?.22:.10)*(p.z+.22);ctx.fillStyle=`rgba(232,255,255,${alpha})`;ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();ctx.fillStyle=`rgba(${rgb},${alpha*.42})`;ctx.beginPath();ctx.arc(x,y,radius*2.2,0,Math.PI*2);ctx.fill();if(p.trail){ctx.strokeStyle=`rgba(${rgb},${alpha*.30})`;ctx.lineWidth=Math.max(.3,radius*.32);ctx.beginPath();ctx.moveTo(x-12*p.z,y+3*p.z);ctx.lineTo(x+16*p.z,y-5*p.z);ctx.stroke();}}}ctx.globalCompositeOperation='source-over';raf=requestAnimationFrame(animate)}

function visiblePresetEntries(){
  return Object.entries(presets).filter(([id,preset])=>{
    if(state.skin !== 'xinghui') return true;
    return !/极昼|余烬|引力|粒子|脊皱|脊咒|polar/i.test(`${id} ${preset?.name || ''}`);
  });
}
function renderPresets(){ $('#presetGrid').innerHTML=visiblePresetEntries().map(([id,preset])=>`<button class="preset ${id===state.preset?'active':''}" data-id="${id}" data-name="${preset.name}" style="--swatch:${preset.swatch}"></button>`).join('');document.querySelectorAll('.preset').forEach((button)=>button.addEventListener('click',async()=>{applyPreset(button.dataset.id);await saveSettings();})); }

function isSameWallpaper(a, b) {
  if (!a || !b) return false;
  return (a.path && b.path && a.path === b.path) || (a.url && b.url && a.url === b.url);
}

function releaseWallpaperThumbnails(clearSources = false) {
  wallpaperThumbnailObserver?.disconnect?.();
  wallpaperThumbnailObserver = null;
  if (clearSources) {
    els.wallpaperGrid?.querySelectorAll('img.wallpaper-thumb').forEach((image) => {
      image.onload = null;
      image.onerror = null;
      image.dataset.request = String(++wallpaperThumbnailRequest);
      image.removeAttribute('src');
      image.dataset.loaded = 'false';
      image.classList.remove('loaded', 'failed');
    });
  }
}

async function loadWallpaperThumbnail(image) {
  const key = image?.dataset?.thumbnailKey;
  if (!key || image.dataset.loaded === 'true' || image.dataset.loaded === 'loading') return;
  const request = String(++wallpaperThumbnailRequest);
  image.dataset.request = request;
  image.dataset.loaded = 'loading';
  const result = await api.wallpapers?.thumbnail?.(key);
  if (!image.isConnected || image.dataset.request !== request || image.dataset.loaded !== 'loading') return;
  if (!result?.ok || !result.dataUrl) {
    image.dataset.loaded = 'failed';
    image.classList.add('failed');
    return;
  }
  image.onload = () => image.classList.add('loaded');
  image.onerror = () => image.classList.add('failed');
  image.dataset.loaded = 'true';
  image.src = result.dataUrl;
}

function unloadWallpaperThumbnail(image) {
  if (!image || !image.dataset.loaded || image.dataset.loaded === 'false') return;
  image.onload = null;
  image.onerror = null;
  image.dataset.request = String(++wallpaperThumbnailRequest);
  image.removeAttribute('src');
  image.dataset.loaded = 'false';
  image.classList.remove('loaded', 'failed');
}

function observeWallpaperThumbnails() {
  releaseWallpaperThumbnails(false);
  const images = [...els.wallpaperGrid.querySelectorAll('img.wallpaper-thumb[data-thumbnail-key]')];
  if (!images.length) return;
  if (!window.IntersectionObserver) { images.slice(0, 8).forEach(loadWallpaperThumbnail); return; }
  wallpaperThumbnailObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) loadWallpaperThumbnail(entry.target);
      else unloadWallpaperThumbnail(entry.target);
    });
  }, { root: els.wallpaperGrid, rootMargin: '110px 0px', threshold: .01 });
  images.forEach((image) => wallpaperThumbnailObserver.observe(image));
}

function renderWallpaperLibrary() {
  if (!els.wallpaperGrid) return;
  releaseWallpaperThumbnails(true);
  const query = String(els.wallpaperSearch?.value || '').trim().toLowerCase();
  const filtered = query ? state.wallpaperLibrary.filter((wallpaper)=>`${wallpaper.name || ''} ${wallpaper.sourceLabel || ''} ${wallpaper.path || ''}`.toLowerCase().includes(query)) : state.wallpaperLibrary;
  if (els.wallpaperLibraryTitle) els.wallpaperLibraryTitle.textContent = `${state.wallpaperSourceMode === 'wallpaper-engine' ? '当前 Wallpaper' : '壁纸库'} · ${filtered.length}/${state.wallpaperLibrary.length} · WE ${state.wallpaperEngineCount}`;
  if (!filtered.length) {
    els.wallpaperGrid.innerHTML = '<div class="wallpaper-empty">壁纸库为空，点击导入壁纸。</div>';
    return;
  }
  els.wallpaperGrid.innerHTML = filtered.map((wallpaper) => {
    const active = state.wallpaperSourceMode === 'library' && isSameWallpaper(wallpaper, state.background || activeBackgroundSource);
    const thumbnailKey = wallpaper.thumbnailKey || '';
    const preview = thumbnailKey
      ? `<img class="wallpaper-thumb" data-thumbnail-key="${escapeHtml(thumbnailKey)}" alt="" decoding="async">`
      : '<span class="wallpaper-thumb wallpaper-placeholder" aria-hidden="true"></span>';
    const sourceLabel = wallpaper.sourceLabel || (wallpaper.readonly ? '内置' : `导入 · ${wallpaper.kind === 'video' ? '视频' : '图片'}`);
    const degraded = wallpaper.degraded === true;
    return `<button class="wallpaper-card ${active?'active':''} ${degraded?'degraded':''}" data-path="${escapeHtml(wallpaper.path)}" title="${escapeHtml(wallpaper.name || wallpaper.path)}">${preview}<b>${escapeHtml(wallpaper.name || 'wallpaper')}</b><em>${escapeHtml(degraded ? `${sourceLabel} · 仅预览` : sourceLabel)}</em>${wallpaper.readonly?'':`<i data-delete="${escapeHtml(wallpaper.path)}">×</i>`}</button>`;
  }).join('');
  observeWallpaperThumbnails();
  els.wallpaperGrid.querySelectorAll('.wallpaper-card').forEach((card) => {
    card.addEventListener('click', async (event) => {
      const deletePath = event.target?.dataset?.delete;
      if (deletePath) {
        event.preventDefault(); event.stopPropagation();
        const result = await api.wallpapers?.delete?.(deletePath);
        if (result?.ok) {
          state.wallpaperLibrary = state.wallpaperLibrary.filter((item) => item.path !== deletePath);
          if (state.background?.path === deletePath) {
            const fallback = state.wallpaperLibrary[0];
            state.background = fallback ? { ...fallback } : null;
            if (fallback) applyBackgroundSource(fallback);
            await saveSettings();
          }
          renderWallpaperLibrary();
          toast('壁纸已删除');
        } else toast('只能删除导入壁纸');
        return;
      }
      const wallpaper = state.wallpaperLibrary.find((item) => item.path === card.dataset.path);
      if (!wallpaper) return;
      state.background = { ...wallpaper };
      state.wallpaperSourceMode = 'library';
      applyBackgroundSource(wallpaper);
      syncControls();
      renderWallpaperLibrary();
      await saveSettings();
      toast(wallpaper.degraded ? '已切换为 Wallpaper 项目预览' : '壁纸已切换');
    });
  });
}

async function refreshWallpaperLibrary(force = false) {
  if (!force && state.wallpaperLibrary.length && Date.now() - wallpaperLibraryLoadedAt < 15000) {
    renderWallpaperLibrary();
    return state.wallpaperLibrary;
  }
  const result = await api.wallpapers?.list?.();
  state.wallpaperLibrary = result?.wallpapers || [];
  state.wallpaperEngineCount = Number(result?.engineCount) || 0;
  wallpaperLibraryLoadedAt = Date.now();
  renderWallpaperLibrary();
  return state.wallpaperLibrary;
}

function setStyleDrawerOpen(open) {
  els.styleDrawer.hidden = !open;
  document.body.classList.toggle('settings-open', open);
  const drawerWidth = open ? els.styleDrawer.getBoundingClientRect().width : 0;
  spatialShelf?.setRightInset?.(open ? drawerWidth + 34 : 0);
  if (open) {
    refreshWallpaperLibrary();
  } else {
    releaseWallpaperThumbnails(true);
    api.wallpapers?.releaseThumbnails?.();
  }
}

function bindUiSounds() {
  let lastHover = 0;
  document.addEventListener('pointerover', (event) => {
    if (isVisualPicking()) return;
    if (!event.target.closest('button,.file-row,.orbit-node,.wallpaper-card,.primary-orbit-button,.group-button')) return;
    const now = performance.now();
    if (now - lastHover < 42) return;
    lastHover = now;
    uiTone('hover');
  }, true);
  document.addEventListener('pointerdown', (event) => {
    if (isVisualPicking()) return;
    if (!event.target.closest('button,.file-row,.orbit-node,.wallpaper-card')) return;
    uiTone('tap');
  }, true);
}

function getRightShelfHotBounds() {
  if (state.skin === 'xinghui') {
    const panel = document.querySelector('.cloud-feed-card');
    const rect = panel?.getBoundingClientRect?.();
    if (document.body.classList.contains('peek-right') && rect && rect.width > 0) {
      return { left: Math.max(0, rect.left - 120), right: Math.min(innerWidth, rect.right + 120), top: 78, bottom: innerHeight - 16 };
    }
    return { left: 260, right: 620, top: 78, bottom: innerHeight - 16 };
  }
  const spatialBounds = document.body.classList.contains('spatial-shelf-active') ? spatialShelf?.getActiveBounds?.() : null;
  if (spatialBounds) return spatialBounds;
  const drawerOpen = els.styleDrawer && !els.styleDrawer.hidden;
  const right = drawerOpen ? Math.max(320, els.styleDrawer.getBoundingClientRect().left - 14) : innerWidth;
  const width = Math.min(430, Math.max(330, innerWidth * .30));
  return { left: right - width, right, top: 80, bottom: innerHeight - 70 };
}

function isRegionPicking() {
  return document.body.classList.contains('region-picking');
}

function isParticlePositionPicking() {
  return document.body.classList.contains('particle-position-picking');
}

function isVisualPicking() {
  return isRegionPicking() || isParticlePositionPicking();
}

function updateRegionBox(rect) {
  if (!els.regionBox) return;
  els.regionBox.style.left = `${rect.x}px`;
  els.regionBox.style.top = `${rect.y}px`;
  els.regionBox.style.width = `${rect.w}px`;
  els.regionBox.style.height = `${rect.h}px`;
  els.regionBox.dataset.shape = state.thumbnailShape;
}

function startThumbnailRegionPicker() {
  if (!els.regionPicker || !els.regionBox || activeRegionPicker) return;
  activeParticlePositionPicker?.close?.(false);
  void requestKeyboardFocus('particle-region-picker');
  document.activeElement?.blur?.();
  let start = null;
  let rect = null;
  const normalize = (a, b) => ({
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y)
  });
  const close = () => {
    els.regionPicker.hidden = true;
    document.body.classList.remove('region-picking');
    activeRegionPicker = null;
    els.regionPicker.removeEventListener('pointerdown', onDown);
    els.regionPicker.removeEventListener('pointermove', stopPickerEvent, true);
    els.regionPicker.removeEventListener('pointerup', stopPickerEvent, true);
    els.regionPicker.removeEventListener('click', stopPickerEvent, true);
    els.regionPicker.removeEventListener('wheel', stopPickerEvent, true);
    window.removeEventListener('pointermove', onMove, true);
    window.removeEventListener('pointerup', onUp, true);
    window.removeEventListener('pointercancel', onUp, true);
    window.removeEventListener('keydown', onKey, true);
  };
  function stopPickerEvent(event) {
    if (event.target?.closest?.('.region-picker-actions')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  const commit = async () => {
    if (!rect || rect.w < 24 || rect.h < 24) { close(); toast('选区太小，已取消'); return; }
    state.thumbnailRegion = {
      x: +(rect.x / innerWidth).toFixed(4),
      y: +(rect.y / innerHeight).toFixed(4),
      w: +(rect.w / innerWidth).toFixed(4),
      h: +(rect.h / innerHeight).toFixed(4),
      shape: state.thumbnailShape
    };
    const anchor = particleSourceAnchor();
    state.wallpaperParticleMode = 'edge';
    setActiveThumbnailPosition(anchor.x, anchor.y, true);
    wallpaperParticles?.setParticleMode?.('edge');
    wallpaperParticles?.setThumbnailRegion?.(state.thumbnailRegion);
    wallpaperParticles?.resetPosition?.(anchor.x, anchor.y);
    close();
    syncControls();
    await saveSettings();
    toast('粒子选区已按原图位置贴合');
  };
  function onDown(event) {
    if (event.target?.closest?.('.region-picker-actions')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.button !== 0) return;
    start = { x: event.clientX, y: event.clientY };
    rect = { x: start.x, y: start.y, w: 1, h: 1 };
    updateRegionBox(rect);
    els.regionPicker.setPointerCapture?.(event.pointerId);
  }
  function onMove(event) {
    if (event.target?.closest?.('.region-picker-actions') && !start) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!start) return;
    rect = normalize(start, { x: event.clientX, y: event.clientY });
    updateRegionBox(rect);
  }
  function onUp(event) { if (event.target?.closest?.('.region-picker-actions')) return; event?.preventDefault?.(); event?.stopImmediatePropagation?.(); start = null; }
  function onKey(event) {
    if (event.key !== 'Escape' && event.key !== 'Enter') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.type === 'keyup') return;
    if (event.repeat) return;
    if (event.key === 'Escape') close();
    if (event.key === 'Enter') commit();
  }
  els.regionPicker.hidden = false;
  document.body.classList.add('region-picking');
  activeRegionPicker = { close, commit };
  rect = state.thumbnailRegion ? {
    x: state.thumbnailRegion.x * innerWidth,
    y: state.thumbnailRegion.y * innerHeight,
    w: state.thumbnailRegion.w * innerWidth,
    h: state.thumbnailRegion.h * innerHeight
  } : { x: innerWidth * .32, y: innerHeight * .24, w: innerWidth * .36, h: innerHeight * .44 };
  updateRegionBox(rect);
  els.regionPicker.addEventListener('pointerdown', onDown);
  els.regionPicker.addEventListener('pointermove', stopPickerEvent, true);
  els.regionPicker.addEventListener('pointerup', stopPickerEvent, true);
  els.regionPicker.addEventListener('click', stopPickerEvent, true);
  els.regionPicker.addEventListener('wheel', stopPickerEvent, { capture: true, passive: false });
  window.addEventListener('pointermove', onMove, true);
  window.addEventListener('pointerup', onUp, true);
  window.addEventListener('pointercancel', onUp, true);
  window.addEventListener('keydown', onKey, true);
}

function updateParticlePositionMarker(position = activeThumbnailPosition()) {
  const anchor = particleSourceAnchor();
  if (els.particlePositionTarget) {
    els.particlePositionTarget.style.left = `${position.x}%`;
    els.particlePositionTarget.style.top = `${position.y}%`;
  }
  if (els.particlePositionAnchor) {
    els.particlePositionAnchor.style.left = `${anchor.x}%`;
    els.particlePositionAnchor.style.top = `${anchor.y}%`;
  }
  const xRange = $('#thumbnailXRange'), yRange = $('#thumbnailYRange');
  if (xRange) xRange.value = position.x;
  if (yRange) yRange.value = position.y;
  if ($('#thumbnailXValue')) $('#thumbnailXValue').value = `${position.x.toFixed(1)}%`;
  if ($('#thumbnailYValue')) $('#thumbnailYValue').value = `${position.y.toFixed(1)}%`;
}

function startParticlePositionPicker() {
  if (!els.particlePositionPicker || !els.particlePositionTarget || activeParticlePositionPicker) return;
  activeRegionPicker?.close?.();
  void requestKeyboardFocus('particle-position-picker');
  document.activeElement?.blur?.();
  const snapshot = { mode: state.wallpaperParticleMode, ...activeThumbnailPosition() };
  let dragging = false;
  let pointerId = null;
  let placementRaf = 0;
  let pendingPosition = null;
  const flushPosition = () => {
    placementRaf = 0;
    if (!pendingPosition) return;
    const position = pendingPosition;
    pendingPosition = null;
    setActiveThumbnailPosition(position.x, position.y, true);
    updateParticlePositionMarker(position);
  };
  const setFromPointer = (event) => {
    pendingPosition = {
      x: clampPercent(event.clientX / Math.max(1, innerWidth) * 100, 50),
      y: clampPercent(event.clientY / Math.max(1, innerHeight) * 100, 50)
    };
    if (!placementRaf) placementRaf = requestAnimationFrame(flushPosition);
  };
  const cleanup = () => {
    if (placementRaf) cancelAnimationFrame(placementRaf);
    placementRaf = 0;
    pendingPosition = null;
    dragging = false;
    pointerId = null;
    els.particlePositionPicker.hidden = true;
    document.body.classList.remove('particle-position-picking');
    els.particlePositionPicker.removeEventListener('pointerdown', onDown);
    els.particlePositionPicker.removeEventListener('lostpointercapture', onCancel);
    window.removeEventListener('pointermove', onMove, true);
    window.removeEventListener('pointerup', onUp, true);
    window.removeEventListener('pointercancel', onCancel, true);
    window.removeEventListener('keydown', onKey, true);
    $('#cancelParticlePosition').onclick = null;
    $('#confirmParticlePosition').onclick = null;
    activeParticlePositionPicker = null;
  };
  const close = (keep = false) => {
    if (!keep) {
      state.wallpaperParticleMode = snapshot.mode;
      setActiveThumbnailPosition(snapshot.x, snapshot.y, true);
    }
    cleanup();
    syncControls();
  };
  const commit = async () => {
    if (pendingPosition) flushPosition();
    cleanup();
    syncControls();
    await saveSettings();
    toast('粒子位置已保存');
  };
  function onDown(event) {
    if (event.button !== 0 || event.target.closest('.particle-position-picker-actions')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    dragging = true;
    pointerId = event.pointerId;
    els.particlePositionPicker.setPointerCapture?.(pointerId);
    setFromPointer(event);
  }
  function onMove(event) {
    if (!dragging || event.pointerId !== pointerId) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setFromPointer(event);
  }
  function onUp(event) {
    if (event.pointerId !== pointerId) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    dragging = false;
    els.particlePositionPicker.releasePointerCapture?.(pointerId);
    pointerId = null;
  }
  function onCancel(event) {
    if (pointerId === null || (event.pointerId != null && event.pointerId !== pointerId)) return;
    dragging = false;
    pointerId = null;
  }
  function onKey(event) {
    if (event.key !== 'Escape' && event.key !== 'Enter') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.repeat) return;
    if (event.key === 'Escape') close(false);
    else commit();
  }
  els.particlePositionPicker.hidden = false;
  document.body.classList.add('particle-position-picking');
  updateParticlePositionMarker(snapshot);
  activeParticlePositionPicker = { close, commit };
  els.particlePositionPicker.addEventListener('pointerdown', onDown);
  els.particlePositionPicker.addEventListener('lostpointercapture', onCancel);
  window.addEventListener('pointermove', onMove, true);
  window.addEventListener('pointerup', onUp, true);
  window.addEventListener('pointercancel', onCancel, true);
  window.addEventListener('keydown', onKey, true);
  $('#cancelParticlePosition').onclick = () => close(false);
  $('#confirmParticlePosition').onclick = commit;
}

async function resetParticlePosition() {
  const anchor = particleSourceAnchor();
  state.wallpaperParticleMode = 'edge';
  setActiveThumbnailPosition(anchor.x, anchor.y, true);
  wallpaperParticles?.setParticleMode?.('edge');
  wallpaperParticles?.setThumbnailRegion?.(state.thumbnailRegion ? { ...state.thumbnailRegion, shape: state.thumbnailShape } : null);
  wallpaperParticles?.resetPosition?.(anchor.x, anchor.y);
  syncControls();
  await saveSettings();
  toast(state.thumbnailRegion ? '粒子已回到选区的原图位置' : '粒子已与整张原图对齐');
}

async function clearParticleRegion() {
  state.thumbnailRegion = null;
  state.wallpaperParticleMode = 'edge';
  setActiveThumbnailPosition(50, 50, true);
  wallpaperParticles?.setParticleMode?.('edge');
  wallpaperParticles?.setThumbnailRegion?.(null);
  wallpaperParticles?.resetPosition?.(50, 50);
  syncControls();
  await saveSettings();
  toast('已恢复整张原图粒子');
}

function applyLyricAutoTilt(){
  if(state.skin!=='xinghui'||!els.lyricWidget)return;
  const rect=els.lyricWidget.getBoundingClientRect();
  if(rect.width<=0||rect.height<=0)return;
  const cx=rect.left+rect.width/2;
  const offset=(cx-innerWidth/2)/Math.max(1,innerWidth); /* -0.5..0.5：偏左为负 */
  const manualY=clampNumber(state.lyricTilt,-35,35,-8);
  /* 偏左：左大右小(rotateY 正向) + 左低右高(rotateZ 负向)；偏右相反 */
  const autoY=manualY+offset*-30;
  const autoZ=offset*9;
  document.documentElement.style.setProperty('--lyric-tilt',`${autoY.toFixed(2)}deg`);
  document.documentElement.style.setProperty('--lyric-tilt-z',`${autoZ.toFixed(2)}deg`);
}
function lyricAutoTiltRefresh(){applyLyricAutoTilt()}
/* 拖动时只更新定位变量，避免调用重量级 syncControls 造成卡顿 */
function applyPositionOnly(kind){
  const root = document.documentElement;
  if(kind === 'path'){
    root.style.setProperty('--cloud-path-x', `${state.cloudPathX}px`);
    root.style.setProperty('--cloud-path-y', `${state.cloudPathY}px`);
  } else if(kind === 'clock'){
    root.style.setProperty('--cloud-clock-x', `${state.cloudClockX}px`);
    root.style.setProperty('--cloud-clock-y', `${state.cloudClockY}px`);
  } else if(kind === 'lyric'){
    root.style.setProperty('--lyric-x', `${state.lyricX}px`);
    root.style.setProperty('--lyric-y', `${state.lyricY}px`);
    applyLyricAutoTilt();
  } else if(kind === 'ai'){
    root.style.setProperty('--ai-x', `${state.aiX}px`);
    root.style.setProperty('--ai-y', `${state.aiY}px`);
  }
}
function setAppActivity(active) {
  const next = active !== false && !document.hidden && !foregroundFullscreen;
  if (next === appActive) return;
  appActive = next;
  wallpaperParticles?.setActive?.(next);
  syncWallpaperVideoPlayback();
}
function syncWallpaperVideoPlayback() {
  const video = $('#wallpaperVideo');
  if (!video) return;
  const shouldPlay = appActive && document.body.classList.contains('has-video');
  if (shouldPlay) {
    if (video.paused) video.play().catch(() => {});
  } else if (!video.paused) {
    video.pause();
  }
}

function bindLiquidRipples(){
  const selector='.cloud-sidebar,.cloud-feed-card,.cloud-path-float,.cloud-clock-widget,.cloud-top-actions,.style-drawer';
  let rippleRaf=0;
  let pending=null;
  let lastRingAt=0;
  const update=(node,x,y)=>{
    const rect=node.getBoundingClientRect();
    if(rect.width<=0||rect.height<=0)return;
    const localX=Math.max(0,Math.min(rect.width,x-rect.left));
    const localY=Math.max(0,Math.min(rect.height,y-rect.top));
    let ripple=node.querySelector(':scope>.liquid-ripple');
    if(!ripple){
      ripple=document.createElement('span');
      ripple.className='liquid-ripple';
      node.appendChild(ripple);
    }
    ripple.style.setProperty('--ripple-x', `${localX}px`);
    ripple.style.setProperty('--ripple-y', `${localY}px`);
    node.classList.add('liquid-hover');
    /* 小块（路径/时钟/顶部操作块）只保留跟随光晕，不生成水波圈，避免视觉抽搐 */
    if(rect.height < 120) return;
    const now=performance.now();
    if(now-lastRingAt>260){
      lastRingAt=now;
      const ring=document.createElement('span');
      ring.className='liquid-ripple-ring';
      ring.style.left=`${localX}px`;
      ring.style.top=`${localY}px`;
      node.appendChild(ring);
      const rings=node.querySelectorAll('.liquid-ripple-ring');
      if(rings.length>5) rings[0].remove();
      ring.addEventListener('animationend',()=>ring.remove());
    }
  };
  document.addEventListener('pointermove',(event)=>{
    if(!document.body.classList.contains('skin-xinghui'))return;
    const node=event.target.closest?.(selector);
    if(!node)return;
    pending={node,x:event.clientX,y:event.clientY};
    if(rippleRaf)return;
    rippleRaf=requestAnimationFrame(()=>{
      rippleRaf=0;
      const p=pending;
      pending=null;
      if(p&&p.node.isConnected)update(p.node,p.x,p.y);
    });
  },{passive:true});
  document.addEventListener('pointerout',(event)=>{
    if(!document.body.classList.contains('skin-xinghui'))return;
    const node=event.target.closest?.(selector);
    if(!node)return;
    const related=event.relatedTarget;
    if(related&&related.nodeType===1&&node.contains(related))return;
    node.classList.remove('liquid-hover');
  },{passive:true});
}

/* ============================================================
   AI 助手 + GrokBot 表情组件
   ============================================================ */
let aiGrokbotFace = null;
let aiGrokbotPanel = null;
const aiChatHistory = [];
let aiMode = 'full'; /* 'full' 上下文对话 | 'simple' 单次气泡 */
let aiIdleTimer = 0;
let aiStreamingMsg = null;
const AI_IDLE_MOODS = ['curious', 'happy', 'thinking', 'confused', 'playful', 'idle'];
function aiIdleCycle(){
  clearTimeout(aiIdleTimer);
  const mood = AI_IDLE_MOODS[Math.floor(Math.random() * AI_IDLE_MOODS.length)];
  aiGrokbotFace?.setEmotion(mood);
  aiGrokbotPanel?.setEmotion(mood);
  aiIdleTimer = setTimeout(aiIdleCycle, 2600 + Math.random() * 3200);
}
function initAiAssistant(){
  if(!window.GrokBot) return;
  const faceEl = $('#aiGrokbotFace');
  const panelEl = $('#aiPanelGrokbot');
  if(faceEl && !aiGrokbotFace) aiGrokbotFace = new window.GrokBot(faceEl, { onState: (key, label) => { const s = $('#aiStateLabel'); if(s) s.textContent = label; } });
  if(panelEl && !aiGrokbotPanel) aiGrokbotPanel = new window.GrokBot(panelEl, { onState: (key, label) => { const s = $('#aiStateLabel'); if(s) s.textContent = label; } });
  aiGrokbotFace?.setState('idle');
  aiGrokbotPanel?.setState('idle');
  aiIdleCycle();
  /* 确保 AI 面板/简略条初始隐藏 */
  const p = $('#aiPanel'); if(p) p.hidden = true;
  const b = $('#aiSimpleBar'); if(b) b.hidden = true;
}
async function loadAiConfig(){
  const config = await api.ai?.configLoad?.().catch(() => null);
  if(!config) return;
  if($('#aiBaseUrl')) $('#aiBaseUrl').value = config.baseUrl || '';
  if($('#aiModel')) $('#aiModel').value = config.model || '';
  if($('#aiKey')) $('#aiKey').placeholder = config.hasKey ? '已配置（留空保持不变）' : 'sk-...';
  return config;
}
function appendAiMessage(role, text){
  const chat = $('#aiChat');
  if(!chat) return;
  const div = document.createElement('div');
  div.className = `ai-msg ai-msg-${role}`;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}
function aiEmotionFallback(text){
  const t = String(text || '');
  if(/哈哈|笑|开心|太棒|恭喜|庆祝/.test(t)) return 'happy';
  if(/难过|伤心|抱歉|对不起|遗憾|哭/.test(t)) return 'sad';
  if(/生气|愤怒|可恶|气死/.test(t)) return 'angry';
  if(/惊讶|天哪|居然|震惊/.test(t)) return 'surprised';
  if(/思考|让我想|嗯|分析/.test(t)) return 'thinking';
  if(/不确定|困惑|不明白|？/.test(t)) return 'confused';
  return 'idle';
}
function parseAiEmotion(content){
  const parsed = String(content || '').match(/^\s*\[([a-zA-Z-]+)\]\s*([\s\S]*)$/);
  return { emotion: parsed ? parsed[1].toLowerCase() : aiEmotionFallback(content), body: parsed ? parsed[2].trim() : String(content || '').trim() };
}
async function callAi(text){
  clearTimeout(aiIdleTimer);
  const system = '你是一个桌面 AI 助手，配合一个 GrokBot 表情机器人。回复时第一行先输出情绪标签（用方括号），换行后再输出正文。可选情绪：happy, sad, angry, excited, surprised, thinking, confused, curious, bored, proud, shy, laughing, scared, playful, celebrate, working, idle。';
  const messages = [{ role: 'system', content: system }];
  if(aiMode === 'full'){
    for (const m of aiChatHistory.slice(-20)) messages.push({ role: m.role, content: m.content });
    aiChatHistory.push({ role: 'user', content: text });
  }
  messages.push({ role: 'user', content: text });
  aiGrokbotPanel?.setState('thinking');
  aiGrokbotFace?.setState('thinking');
  if(aiMode === 'simple'){
    const bubble = $('#aiSimpleBubble');
    if(bubble){ bubble.hidden = false; bubble.textContent = '…'; }
  } else {
    appendAiMessage('user', text);
    aiStreamingMsg = document.createElement('div');
    aiStreamingMsg.className = 'ai-msg ai-msg-assistant';
    aiStreamingMsg.textContent = '…';
    $('#aiChat')?.appendChild(aiStreamingMsg);
  }
  let acc = '';
  let settled = false;
  const offs = [];
  const setOutput = (value) => {
    if(aiMode === 'simple'){ const b = $('#aiSimpleBubble'); if(b) b.textContent = value; }
    else if(aiStreamingMsg){ aiStreamingMsg.textContent = value; const c = $('#aiChat'); if(c) c.scrollTop = c.scrollHeight; }
  };
  const finish = (fullText, forcedEmotion) => {
    if(settled) return;
    settled = true;
    offs.forEach((fn) => { try { fn(); } catch {} });
    const parsed = fullText != null ? parseAiEmotion(fullText) : { emotion: 'sad', body: '' };
    const emotion = forcedEmotion || parsed.emotion;
    const body = parsed.body;
    aiGrokbotPanel?.setEmotion(emotion);
    aiGrokbotFace?.setEmotion(emotion);
    setOutput(body || '（空回复）');
    if(aiMode === 'full' && body) aiChatHistory.push({ role: 'assistant', content: body });
    aiStreamingMsg = null;
    aiIdleCycle();
  };
  offs.push(api.ai?.onChunk?.((d) => { acc += d?.content || ''; setOutput(acc); }) || (() => {}));
  offs.push(api.ai?.onDone?.(() => finish(acc)) || (() => {}));
  offs.push(api.ai?.onError?.((d) => {
    if(d?.error === 'AI_NOT_CONFIGURED'){ const cfg = $('#aiConfig'); if(cfg) cfg.hidden = false; finish('请先配置 API Key。', 'confused'); }
    else finish(d?.message || 'AI 调用失败。', 'sad');
  }) || (() => {}));
  await api.ai?.chatStream?.(messages).catch(() => finish('AI 请求失败，请检查网络或配置。', 'sad'));
}
function bindAiDrag(){
  const trigger = $('#aiGrokbotTrigger');
  if(trigger && !trigger.dataset.aiDragBound){
    trigger.dataset.aiDragBound = '1';
    let drag = null;
    trigger.addEventListener('pointerdown', (e) => {
      if(e.button !== 0) return;
      drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, bx: Number(state.aiX) || 0, by: Number(state.aiY) || 0, moved: false };
      trigger.setPointerCapture?.(e.pointerId);
    });
    trigger.addEventListener('pointermove', (e) => {
      if(!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if(!drag.moved && Math.hypot(dx, dy) < 5) return;
      drag.moved = true;
      e.preventDefault();
      state.aiX = drag.bx + dx;
      state.aiY = drag.by + dy;
      applyPositionOnly('ai');
      positionAiSimpleBar();
      positionAiPanel();
    });
    const stop = (e) => {
      if(!drag || e.pointerId !== drag.id) return;
      const moved = drag.moved;
      drag = null;
      if(moved){
        persistSettings();
        const prevent = (ev) => { ev.stopPropagation(); ev.preventDefault(); trigger.removeEventListener('click', prevent, true); };
        trigger.addEventListener('click', prevent, true);
      }
    };
    trigger.addEventListener('pointerup', stop);
    trigger.addEventListener('pointercancel', stop);
  }
  const panel = $('#aiPanel');
  const head = panel?.querySelector('.ai-panel-head');
  if(panel && head && !head.dataset.aiPanelDragBound){
    head.dataset.aiPanelDragBound = '1';
    head.style.cursor = 'move';
    let drag = null;
    head.addEventListener('pointerdown', (e) => {
      if(e.button !== 0 || e.target.closest('button')) return;
      const r = panel.getBoundingClientRect();
      drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, l: r.left, t: r.top };
      head.setPointerCapture?.(e.pointerId);
    });
    head.addEventListener('pointermove', (e) => {
      if(!drag || e.pointerId !== drag.id) return;
      e.preventDefault();
      const left = drag.l + e.clientX - drag.sx;
      const top = drag.t + e.clientY - drag.sy;
      panel.style.left = `${Math.max(8, Math.min(innerWidth - panel.offsetWidth - 8, left))}px`;
      panel.style.top = `${Math.max(8, Math.min(innerHeight - 60, top))}px`;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
    });
    const stop = (e) => { if(drag && e.pointerId === drag.id) drag = null; };
    head.addEventListener('pointerup', stop);
    head.addEventListener('pointercancel', stop);
  }
}
function positionAiSimpleBar(){
  const trigger = $('#aiGrokbotTrigger');
  const assistant = $('#aiAssistant');
  const bar = $('#aiSimpleBar');
  if(!trigger || !assistant || !bar) return;
  const rect = trigger.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  /* 水平：脸在左半边 → 文本框在脸右侧；脸在右半边 → 文本框在脸左侧 */
  assistant.classList.toggle('ai-simple-left', centerX < innerWidth / 2);
  /* 垂直：脸在上半 → 文本框在脸下方；脸在下半 → 文本框在脸上方 */
  if(centerY < innerHeight / 2){
    bar.style.top = 'auto';
    bar.style.bottom = '-8px';
    bar.style.transformOrigin = 'top left';
  } else {
    bar.style.top = 'auto';
    bar.style.bottom = '0';
  }
}
function positionAiPanel(){
  const trigger = $('#aiGrokbotTrigger');
  const panel = $('#aiPanel');
  if(!trigger || !panel || panel.hidden) return;
  const rect = trigger.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const pw = panel.offsetWidth || 360;
  const ph = panel.offsetHeight || 400;
  let left, top;
  if(centerX < innerWidth / 2){ left = rect.right + 14; }
  else { left = rect.left - pw - 14; }
  if(centerY < innerHeight / 2){ top = rect.top; }
  else { top = rect.bottom - ph; }
  left = Math.max(8, Math.min(innerWidth - pw - 8, left));
  top = Math.max(8, Math.min(innerHeight - ph - 8, top));
  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
  panel.style.right = 'auto';
  panel.style.bottom = 'auto';
}
function bindAiAssistant(){
  bindAiDrag();
  const focusInput = (input) => {
    if(!input) return;
    const focus = () => { if(!input.hidden) input.focus({ preventScroll: true }); };
    focus();
    void requestKeyboardFocus('ai-assistant').then(() => {
      requestAnimationFrame(focus);
      setTimeout(focus, 80);
      setTimeout(focus, 220);
    });
  };
  $('#aiGrokbotTrigger')?.addEventListener('click', async () => {
    if(aiMode === 'simple'){
      const bar = $('#aiSimpleBar');
      const show = bar.hidden;
      bar.hidden = !show;
      if(show){ positionAiSimpleBar(); setTimeout(() => focusInput($('#aiSimpleInput')), 80); }
      return;
    }
    const panel = $('#aiPanel');
    const show = panel.hidden;
    panel.hidden = !show;
    if(show){
      positionAiPanel();
      const config = await loadAiConfig();
      const cfg = $('#aiConfig');
      if(cfg && !config?.hasKey) cfg.hidden = false;
      if(!aiChatHistory.length) appendAiMessage('assistant', '你好，我是你的 AI 助手。点右上角 ⚙ 配置 API Key，💬 切换简略/完整模式。');
      setTimeout(() => focusInput($('#aiInput')), 80);
    }
  });
  $('#aiConfigToggle')?.addEventListener('click', () => {
    const cfg = $('#aiConfig');
    if(cfg){ cfg.hidden = !cfg.hidden; if(!cfg.hidden) void loadAiConfig(); }
  });
  $('#aiModeToggle')?.addEventListener('click', () => {
    aiMode = aiMode === 'full' ? 'simple' : 'full';
    state.aiMode = aiMode;
    document.body.classList.toggle('ai-simple-mode', aiMode === 'simple');
    toast(aiMode === 'simple' ? '已切换简略模式（无框气泡 + 文本框）' : '已切换完整模式（上下文对话）');
    const panel = $('#aiPanel');
    const bar = $('#aiSimpleBar');
    if(aiMode === 'simple'){ if(panel) panel.hidden = true; if(bar) bar.hidden = false; positionAiSimpleBar(); setTimeout(() => focusInput($('#aiSimpleInput')), 60); }
    else { if(bar) bar.hidden = true; const chat = $('#aiChat'); if(chat) chat.innerHTML = ''; positionAiPanel(); }
    persistSettings();
  });
  $('#aiClose')?.addEventListener('click', () => { const p = $('#aiPanel'); if(p) p.hidden = true; });
  /* 点击面板/简略条/触发按钮之外的地方，关闭面板和简略条 */
  document.addEventListener('pointerdown', (event) => {
    if(state.skin !== 'xinghui') return;
    if(event.target.closest('#aiPanel,#aiSimpleBar,#aiGrokbotTrigger')) return;
    const panel = $('#aiPanel'); if(panel && !panel.hidden) panel.hidden = true;
    const bar = $('#aiSimpleBar'); if(bar && !bar.hidden) bar.hidden = true;
  });
  const sendAi = (input) => {
    const text = String(input?.value || '').trim();
    if(!text) return;
    if(input) input.value = '';
    void callAi(text);
  };
  $('#aiSend')?.addEventListener('click', () => sendAi($('#aiInput')));
  $('#aiInput')?.addEventListener('keydown', (event) => { if(event.key === 'Enter' && !event.ctrlKey && !event.shiftKey){ event.preventDefault(); sendAi($('#aiInput')); } });
  $('#aiInput')?.addEventListener('focus', () => focusInput($('#aiInput')));
  $('#aiSimpleInput')?.addEventListener('keydown', (event) => { if(event.key === 'Enter' && !event.ctrlKey && !event.shiftKey){ event.preventDefault(); sendAi($('#aiSimpleInput')); } });
  $('#aiSimpleInput')?.addEventListener('focus', () => focusInput($('#aiSimpleInput')));
  $('#aiSaveConfig')?.addEventListener('click', async () => {
    const key = String($('#aiKey')?.value || '').trim();
    const baseUrl = String($('#aiBaseUrl')?.value || '').trim();
    const model = String($('#aiModel')?.value || '').trim();
    const payload = { baseUrl, model };
    if(key) payload.key = key;
    const result = await api.ai?.configSave?.(payload).catch(() => null);
    if(result?.ok){ toast('AI 配置已保存'); const cfg = $('#aiConfig'); if(cfg) cfg.hidden = true; }
    else toast('AI 配置保存失败');
  });
}

function bindEvents(){
  bindCommandPaletteDrag();
  bindCloudMovableBlocks();
  bindCtrlRightDragBlocks();
  bindCloudBlockSettingsDrag();
  bindLiquidRipples();
  ensurePlaylistButton();
  ensureLyricVolumeButton();
  initAiAssistant();
  bindAiAssistant();
  document.addEventListener('pointerdown',(event)=>{if(event.isTrusted)void requestKeyboardFocus('trusted-pointer')},true);
  document.querySelectorAll('[data-win]').forEach((button)=>button.addEventListener('click',()=>api.window[button.dataset.win]()));
  $('#rescanButton').addEventListener('click',loadDesktop); $('#allItemsButton').addEventListener('click',()=>{galaxyZoom=1;galaxyCenterX=50;galaxyCenterY=50;enterDesktopLayer();selectGroup('all')});
  $('#newFileButton')?.addEventListener('click',()=>toggleNewFileDialog(true));
  $('#cloudNewFileButton')?.addEventListener('click',()=>toggleNewFileDialog(true));
  $('#cloudConsoleButton')?.addEventListener('click',()=>togglePalette(true));
  $('#cloudStyleButton')?.addEventListener('click',()=>setStyleDrawerOpen(true));
  $('#cloudAllButton')?.addEventListener('click',()=>{state.cloudGroupTouched=false;state.currentItems=null;state.currentPath=state.payload.roots[0];state.currentParent=parentOfPath(state.currentPath);document.body.classList.remove('computer-layer','favorite-layer');selectGroup('all');updateCloudNavActive('')});
  els.cloudPathButton?.addEventListener('click',async()=>{await api.copyText(state.currentPath || state.payload.roots[0] || '');toast('路径已复制')});
  els.cloudPathButton?.addEventListener('dblclick',goParent);
  els.cloudOpenButton?.addEventListener('click',()=>{const item=groupItems(state.activeGroup).find((entry)=>entry.id===state.selectedId);if(item)activateItem(item)});
  els.cloudRevealButton?.addEventListener('click',async()=>{const item=groupItems(state.activeGroup).find((entry)=>entry.id===state.selectedId);if(item){await api.revealPath(item.path);toast('已在资源管理器定位')}});
  els.cloudCopyButton?.addEventListener('click',async()=>{const item=groupItems(state.activeGroup).find((entry)=>entry.id===state.selectedId);if(item){await api.copyText(item.path);toast('路径已复制')}});
  document.addEventListener('contextmenu',(event)=>{if(state.skin==='xinghui'&&event.altKey&&showCloudBlockSettings(event))return;},true);
  $('#cloudBlockSettingsClose')?.addEventListener('click',()=>{if(els.cloudBlockSettings)els.cloudBlockSettings.hidden=true});
  document.addEventListener('pointerdown',(event)=>{
    if(!event.target.closest?.('#cloudContextMenu'))hideCloudContextMenu();
    if(!event.target.closest?.('.cloud-side-panel,[data-open-block-background],[data-open-lyric-effects],.create-block-side-panel,#createBlockButton')){
      closeCloudSidePanels();
    }
    if(state.skin==='xinghui'&&document.body.classList.contains('cloud-projection-pinned')&&!event.target.closest?.('.cloud-sidebar,.cloud-feed-card,.cloud-context-menu,.cloud-top-actions,.cloud-path-float,.style-drawer,.command-palette,.new-file-dialog')){
      document.body.classList.remove('cloud-projection-pinned','peek-right','peek-left');
    }
  });
  $('#closeNewFile')?.addEventListener('click',()=>toggleNewFileDialog(false));
  $('#chooseNewFilePath')?.addEventListener('click',chooseNewFileDirectory);
  $('#confirmNewFile')?.addEventListener('click',createNewFileFromDialog);
  els.newFileName?.addEventListener('keydown',(event)=>{if(event.key==='Enter')createNewFileFromDialog();if(event.key==='Escape')toggleNewFileDialog(false)});
  els.newFilePath?.addEventListener('keydown',(event)=>{if(event.key==='Enter')createNewFileFromDialog();if(event.key==='Escape')toggleNewFileDialog(false)});
  els.desktopMiniGalaxy?.addEventListener('click',()=>{galaxyZoom=1;galaxyCenterX=50;galaxyCenterY=50;enterDesktopLayer();toast('已切回桌面')});
  els.lyricWidget?.querySelectorAll('[data-media-action]').forEach((button)=>button.addEventListener('click',async(event)=>{
    event.stopPropagation();
    const action = button.dataset.mediaAction;
    let result = null;
    if(embeddedNeteaseAudio && embeddedNeteaseQueue.songs.length){
      if(action === 'playpause'){
        if(embeddedNeteaseAudio.paused) await embeddedNeteaseAudio.play().catch(()=>null);
        else embeddedNeteaseAudio.pause();
        result = {ok:true};
      } else if(action === 'next') {
        await playEmbeddedNeteaseSong(embeddedNeteaseQueue.index + 1);
        result = {ok:true};
      } else if(action === 'previous') {
        await playEmbeddedNeteaseSong(Math.max(0, embeddedNeteaseQueue.index - 1));
        result = {ok:true};
      }
    } else {
      const status = lyricRuntime.status;
      if(action === 'playpause' && status?.running !== true){
        await showPlaylistPanel(button);
        toast('先从网易云歌单选择一首歌启动内置播放器', { pointer:true });
        return;
      }
      result = await api.lyrics?.mediaControl?.(action);
    }
    const label = action === 'next' ? '已切换至下一首' : action === 'previous' ? '已切换至上一首' : '已播放 / 暂停';
    toast(result?.ok ? label : '媒体控制失败', { pointer:true });
    setTimeout(()=>void refreshNeteaseLyrics(), 220);
  }));
  $('#consoleButton').addEventListener('click',()=>togglePalette());
  $('#searchButton').addEventListener('click',()=>{
    if(state.skin==='xinghui'){
      toast('全盘搜索入口已预留：当前不会再打开指令台');
      return;
    }
    togglePalette(true);
  });
  $('#closeCommandPalette')?.addEventListener('click',()=>togglePalette(false));
  $('#consoleButton em').textContent='Ctrl Alt T';
  els.commandInput.addEventListener('keydown',(event)=>{if(event.key==='Enter'){runCommand(event.target.value);event.target.value=''}else if(event.key==='Escape'){event.preventDefault();togglePalette(false)}});
  $('#toggleIconsButton').addEventListener('click',async()=>{const result=await api.toggleDesktopIcons();toast(result.ok?'Windows 桌面图标已切换':'切换失败')});
  $('#pathRing').addEventListener('click',async()=>{await api.copyText(state.currentPath);toast('路径已复制')}); $('#pathRing').addEventListener('dblclick',goParent); $('#backButton').addEventListener('click',goParent);
  els.coreBackButton?.addEventListener('click',goParent);
  els.pathRibbon?.addEventListener('click',async()=>{await api.copyText(state.currentPath);toast('路径已复制')});
  els.pathRibbon?.addEventListener('dblclick',goParent);
  $('#motionButton').addEventListener('click',(event)=>{const paused=document.body.classList.toggle('motion-paused');event.currentTarget.classList.toggle('active',!paused);wallpaperParticles?.setMotion(paused?0:state.motion/100)});
  $('#densityButton').addEventListener('click',()=>{state.density=state.density>=90?35:state.density+20;$('#densityRange').value=state.density;$('#densityValue').value=`${state.density}%`;drawParticles();wallpaperParticles?.setDensity(state.density);saveSettings()});
  $('#focusButton').addEventListener('click',()=>els.stage.classList.toggle('focused'));
  $('#styleButton').addEventListener('click',()=>setStyleDrawerOpen(els.styleDrawer.hidden)); $('#closeStyle').addEventListener('click',()=>setStyleDrawerOpen(false));
  $('#motionRange').addEventListener('input',(event)=>{state.motion=+event.target.value;$('#motionValue').value=`${state.motion}%`;wallpaperParticles?.setMotion(state.motion/100)}); $('#motionRange').addEventListener('change',saveSettings);
  $('#densityRange').addEventListener('input',(event)=>{state.density=+event.target.value;$('#densityValue').value=`${state.density}%`;drawParticles();wallpaperParticles?.setDensity(state.density)}); $('#densityRange').addEventListener('change',saveSettings);
  const bindVisualRange=(id,key,suffix,apply)=>{$(id).addEventListener('input',(event)=>{state[key]=+event.target.value;syncControls();apply?.(state[key])});$(id).addEventListener('change',saveSettings)};
  bindVisualRange('#wallpaperOpacityRange','wallpaperOpacity','%');bindVisualRange('#wallpaperBrightnessRange','wallpaperBrightness','%');bindVisualRange('#wallpaperSaturationRange','wallpaperSaturation','%');bindVisualRange('#particleOpacityRange','particleOpacity','%');bindVisualRange('#wallpaperBlurRange','wallpaperBlur','px');bindVisualRange('#panelBlurRange','panelBlur','px');bindVisualRange('#perspectiveRange','perspective','%',(value)=>spatialShelf?.setPerspective(value/100));bindVisualRange('#shelfScaleRange','shelfScale','%',(value)=>spatialShelf?.setScale?.(value/100));bindVisualRange('#pathSpeedRange','pathSpeed','%');bindVisualRange('#loadSpeedRange','loadSpeed','%');bindVisualRange('#loadGapRange','loadGap','ms');
  const updateThemeFromHsl=()=>{state.themeRgb=hslToRgb(state.themeHue,state.themeSat).join(',');syncControls()};
  $('#themeHueRange')?.addEventListener('input',(event)=>{state.themeHue=+event.target.value;updateThemeFromHsl()});$('#themeHueRange')?.addEventListener('change',saveSettings);
  $('#themeSatRange')?.addEventListener('input',(event)=>{state.themeSat=+event.target.value;updateThemeFromHsl()});$('#themeSatRange')?.addEventListener('change',saveSettings);
  $('#themeAlphaRange')?.addEventListener('input',(event)=>{state.themeAlpha=+event.target.value;syncControls()});$('#themeAlphaRange')?.addEventListener('change',saveSettings);
  $('#themeRgbInput')?.addEventListener('change',async(event)=>{const rgb=parseRgb(event.target.value);if(rgb){state.themeRgb=rgb.join(',');const hsl=rgbToHsl(rgb);state.themeHue=hsl.h;state.themeSat=hsl.s;syncControls();await saveSettings()}else{event.target.value=state.themeRgb}});
  document.querySelectorAll('[data-theme-mode]').forEach((button)=>button.addEventListener('click',async()=>{state.themeMode=button.dataset.themeMode==='light'?'light':'dark';syncControls();await saveSettings()}));
  const bindCloudGlobalRange=(id,key,suffix)=>{$(id)?.addEventListener('input',(event)=>{state[key]=+event.target.value;syncControls()});$(id)?.addEventListener('change',saveSettings)};
  bindCloudGlobalRange('#cloudGlassAlphaRange','cloudGlassAlpha','%');
  bindCloudGlobalRange('#cloudBorderAlphaRange','cloudBorderAlpha','%');
  bindCloudGlobalRange('#cloudGlassBlurRange','cloudGlassBlur','px');
  bindCloudGlobalRange('#cloudFontScaleRange','cloudFontScale','%');
  const bindCloudGlobalColor=(colorId,rgbId,key)=>{$(colorId)?.addEventListener('input',(event)=>{const rgb=hexToRgb(event.target.value);if(!rgb)return;state[key]=rgb.join(',');syncControls();if($(rgbId))$(rgbId).value=state[key];});$(rgbId)?.addEventListener('change',(event)=>{const rgb=parseRgb(event.target.value);if(!rgb){event.target.value=state[key]||'255,255,255';return}state[key]=rgb.join(',');syncControls();if($(colorId))$(colorId).value=rgbToHex(state[key]);});};
  bindCloudGlobalColor('#cloudTextRgbColor','#cloudTextRgbInput','cloudTextRgb');
  bindCloudGlobalColor('#cloudBorderRgbColor','#cloudBorderRgbInput','cloudBorderRgb');
  document.querySelectorAll('[data-cloud-hollow]').forEach((button)=>button.addEventListener('click',async()=>{state.cloudHollow=button.dataset.cloudHollow==='on';syncControls();await saveSettings()}));
  document.querySelectorAll('[data-cloud-panel-image]').forEach((button)=>button.addEventListener('click',async()=>{state.cloudPanelImageEnabled=button.dataset.cloudPanelImage==='on';syncControls();await saveSettings()}));
  const autoStartToggle = $('#autoStartToggle');
  if (autoStartToggle) {
    api.autoStart?.get?.().then((result) => { if (result?.ok) autoStartToggle.checked = !!result.enabled; }).catch(() => {});
    autoStartToggle.addEventListener('change', async () => {
      const result = await api.autoStart?.set?.(autoStartToggle.checked).catch(() => null);
      if (result?.ok) toast(`开机自启已${result.enabled ? '开启' : '关闭'}`);
      else { autoStartToggle.checked = !autoStartToggle.checked; toast(result?.error ? `设置失败：${result.error}` : '开机自启设置失败'); }
    });
  }
  document.querySelectorAll('[data-skin]').forEach((button)=>button.addEventListener('click',async()=>{const nextSkin=button.dataset.skin==='xinghui'?'xinghui':'orbit';if(nextSkin!=='xinghui'){toast('星系皮肤正在开发当中，暂未开放');return;}state.skin='xinghui';state.themeMode='light';state.themeRgb='161,140,209';const hsl=rgbToHsl(parseRgb(state.themeRgb));state.themeHue=hsl.h;state.themeSat=hsl.s;state.themeAlpha=58;syncControls();renderPresets();renderGroups();selectGroup(state.activeGroup);await saveSettings()}));
  bindVisualRange('#focusXRange','focusX','%',(value)=>{galaxyCenterX=value;applyGalaxyView()});bindVisualRange('#focusYRange','focusY','%',(value)=>{galaxyCenterY=value;applyGalaxyView()});$('#thumbnailXRange').addEventListener('input',(event)=>{setActiveThumbnailPosition(+event.target.value,state.thumbnailY,true);syncControls()});$('#thumbnailXRange').addEventListener('change',saveSettings);$('#thumbnailYRange').addEventListener('input',(event)=>{setActiveThumbnailPosition(state.thumbnailX,+event.target.value,true);syncControls()});$('#thumbnailYRange').addEventListener('change',saveSettings);
  $('#importWallpaper')?.addEventListener('click',async()=>{const result=await api.wallpapers?.import?.();if(result?.ok){await refreshWallpaperLibrary(true);const selected=result.wallpapers?.[0];if(selected){state.background={...selected};state.wallpaperSourceMode='library';applyBackgroundSource(selected);syncControls();await saveSettings();}toast(`已导入 ${result.wallpapers?.length||0} 张壁纸`)}});
  els.wallpaperSearch?.addEventListener('input',()=>renderWallpaperLibrary());
  $('#chooseBackground').addEventListener('click',async()=>{const source=await api.chooseBackground();if(source?.ok){state.background={path:source.path,url:source.url,kind:source.kind};state.wallpaperSourceMode='library';applyBackgroundSource(source);syncControls();await saveSettings();toast(source.kind==='video'?'动态背景已映射到粒子空间':'图片已重建为粒子空间')}});
  document.querySelectorAll('[data-flow]').forEach((button)=>button.addEventListener('click',()=>{state.flow=button.dataset.flow;wallpaperParticles?.setFlow(state.flow);syncControls();persistSettings()}));
  document.querySelectorAll('[data-particle-fps]').forEach((button)=>button.addEventListener('click',async()=>{state.particleFps=Number(button.dataset.particleFps);syncControls();await saveSettings()}));
  document.querySelectorAll('[data-inactive-fps]').forEach((button)=>button.addEventListener('click',async()=>{state.inactiveFps=button.dataset.inactiveFps;syncControls();await saveSettings()}));
  document.querySelectorAll('[data-particle-mode]').forEach((button)=>button.addEventListener('click',()=>{state.wallpaperParticleMode=button.dataset.particleMode;wallpaperParticles?.setParticleMode(state.wallpaperParticleMode);syncControls();persistSettings()}));
  document.querySelectorAll('[data-wallpaper-source]').forEach((button)=>button.addEventListener('click',async()=>{state.wallpaperSourceMode=button.dataset.wallpaperSource;if(state.wallpaperSourceMode==='wallpaper-engine')state.thumbnailEnabled=true;syncControls();await refreshExternalWallpaper('source-mode');await saveSettings();toast(state.wallpaperSourceMode==='wallpaper-engine'?'已切换到 Wallpaper Engine':'已切换到默认 / 导入壁纸')}));
  document.querySelectorAll('[data-focus-display]').forEach((button)=>button.addEventListener('click',async()=>{state.focusDisplay=button.dataset.focusDisplay;syncControls();await saveSettings()}));
  document.querySelectorAll('[data-thumbnail-enabled]').forEach((button)=>button.addEventListener('click',()=>{const enabled=button.dataset.thumbnailEnabled==='true';const applied=setParticleLayerEnabled(enabled,{reloadSource:enabled});syncControls();if(enabled&&!applied)toast('粒子渲染器启动失败，请稍后重试');persistSettings()}));
  document.querySelectorAll('[data-thumbnail-shape]').forEach((button)=>button.addEventListener('click',async()=>{state.thumbnailShape=button.dataset.thumbnailShape;if(state.thumbnailRegion)state.thumbnailRegion.shape=state.thumbnailShape;syncControls();await saveSettings()}));
  $('#pickThumbnailRegion')?.addEventListener('click',startThumbnailRegionPicker);
  $('#cancelThumbnailRegion')?.addEventListener('click',()=>activeRegionPicker?.close?.());
  $('#confirmThumbnailRegion')?.addEventListener('click',()=>activeRegionPicker?.commit?.());
  $('#pickParticlePosition')?.addEventListener('click',startParticlePositionPicker);
  $('#resetParticlePosition')?.addEventListener('click',resetParticlePosition);
  $('#clearParticleRegion')?.addEventListener('click',clearParticleRegion);
  $('#exportStyle').addEventListener('click',async()=>{const result=await api.settings.export(settingsSnapshot());if(result.ok)toast('样式已导出')});
  $('#importStyle').addEventListener('click',async()=>{try{const result=await api.settings.import();if(result.ok){Object.assign(state,result.data);state.skin='xinghui';if(Number(result.data?.version||0)<5&&Number(result.data?.thumbnailEdgeX??50)===50&&Number(result.data?.thumbnailEdgeY??54)===54)state.thumbnailEdgeY=50;state.favorites=Array.isArray(state.favorites)?state.favorites:[];applyPreset(state.preset);syncControls();if(state.background)applyBackgroundSource(state.background);renderGroups();selectGroup(state.activeGroup);renderFavoriteTray();renderCustomBlocks();await saveSettings();toast('样式已导入')}}catch(error){toast(`导入失败：${error.message}`)}});
  document.addEventListener('keydown',(event)=>{
    if(isRegionPicking()){
      if(event.key==='Escape'||event.key==='Enter'){
        event.preventDefault();event.stopImmediatePropagation();
        if(!event.repeat){if(event.key==='Escape')activeRegionPicker?.close?.();else activeRegionPicker?.commit?.()}
      }
      return;
    }
    if(isVisualPicking())return;
    if(event.altKey&&event.key==='ArrowLeft'){event.preventDefault();goParent()}
    if(event.ctrlKey&&event.altKey&&event.key.toLowerCase()==='t'){event.preventDefault();togglePalette()}
    if(event.ctrlKey&&event.key.toLowerCase()==='n'){event.preventDefault();toggleNewFileDialog(true)}
    if(event.ctrlKey&&event.key.toLowerCase()==='k'){event.preventDefault();togglePalette(true)}
    if(event.ctrlKey&&event.key==='`'){event.preventDefault();togglePalette()}
    if(event.key==='F2'){
      event.preventDefault();
      const pinned=document.body.classList.toggle('ui-pinned');
      if(pinned)ensureSpatialShelf()?.setReveal(true);else spatialShelf?.setReveal(document.body.classList.contains('peek-right'));
    }
    if(event.key==='Enter'&&document.activeElement===$('#shelf3d')){
      event.preventDefault();spatialShelf?.activateCurrent?.();
    }
    if((event.key==='ArrowDown'||event.key==='ArrowUp')&&!event.altKey&&!event.ctrlKey&&!event.metaKey&&!event.target.closest('input,textarea,[contenteditable],#styleDrawer,#commandPalette')){
      event.preventDefault();ensureSpatialShelf()?.setCenter((spatialShelf?.centerTarget||0)+(event.key==='ArrowDown'?1:-1));spatialShelf?.setReveal(true);document.body.classList.add('peek-right');
    }
    if(event.key==='Escape'){
      event.preventDefault();toggleNewFileDialog(false);togglePalette(false);setStyleDrawerOpen(false);document.body.classList.remove('ui-pinned');
      if(!document.body.classList.contains('peek-right'))spatialShelf?.setReveal(false);
    }
  },true);
  document.addEventListener('auxclick',(event)=>{if(event.button===3&&!isVisualPicking()&&!event.target?.closest?.('button,a,input,textarea,select,[contenteditable],#styleDrawer,#commandPalette')){event.preventDefault();goParent()}});
  els.stage.addEventListener('pointerdown',(event)=>{if(event.button===2){rightDragState={x:event.clientX,y:event.clientY};return}if(event.button!==0||event.target.closest('button,.path-ring,.path-ribbon,.core-back'))return;dragState={x:event.clientX,y:event.clientY,yaw:galaxyYaw,pitch:galaxyPitch,cx:galaxyCenterX,cy:galaxyCenterY,move:event.shiftKey};els.stage.setPointerCapture?.(event.pointerId);document.body.classList.add('galaxy-dragging')});
  els.stage.addEventListener('click',(event)=>{if(event.target.closest('button,.orbit-node,.path-ring,.path-ribbon,.core-back'))return;clearSelection()});
  document.addEventListener('click',(event)=>{if(event.target.closest('button,.file-row,.orbit-node,.path-ring,.path-ribbon,.core-back,#shelf3d,#styleDrawer,#commandPalette,.region-picker,.particle-position-picker'))return;clearSelection()},true);
  els.stage.addEventListener('pointermove',(event)=>{if(!dragState)return;if(dragState.move){const rect=els.stage.getBoundingClientRect();galaxyCenterX=Math.max(0,Math.min(100,dragState.cx+(event.clientX-dragState.x)/rect.width*100));galaxyCenterY=Math.max(0,Math.min(100,dragState.cy+(event.clientY-dragState.y)/rect.height*100));}else{galaxyYaw=dragState.yaw+(event.clientX-dragState.x)*.08;galaxyPitch=dragState.pitch-(event.clientY-dragState.y)*.055;}applyGalaxyView()});
  els.stage.addEventListener('wheel',async(event)=>{if(!event.ctrlKey)return;event.preventDefault();galaxyZoom*=event.deltaY>0?.92:1.08;if(galaxyZoom<=.68&&state.currentPath!=='此电脑'){galaxyZoom=.72;await enterComputerLayer();return}if(galaxyZoom>=1.12&&state.currentPath==='此电脑'){enterDesktopLayer();return}applyGalaxyView()},{passive:false});
  els.stage.addEventListener('pointerup',(event)=>{if(rightDragState){const dx=event.clientX-rightDragState.x;const dy=Math.abs(event.clientY-rightDragState.y);rightDragState=null;if(dx<-75&&dy<70){event.preventDefault();goParent();return}}if(dragState){dragState=null;document.body.classList.remove('galaxy-dragging')}});
  els.stage.addEventListener('pointercancel',()=>{dragState=null;rightDragState=null;document.body.classList.remove('galaxy-dragging')});
  els.stage.addEventListener('contextmenu',(event)=>{if(rightDragState){event.preventDefault()}});
  document.addEventListener('pointermove',(event)=>{
    latestPointerUi={clientX:event.clientX,clientY:event.clientY};
    if(pointerUiRaf)return;
    pointerUiRaf=requestAnimationFrame(()=>{
      pointerUiRaf=0;
      const point=latestPointerUi;
      if(!point||isVisualPicking())return;
      if(document.body.classList.contains('cloud-block-dragging'))return;
      const x=(point.clientX/innerWidth-.5)*18;
      const y=(point.clientY/innerHeight-.5)*14;
      const space=$('#wallpaperSpace');
      space.style.setProperty('--parallax-x',`${x.toFixed(1)}px`);
      space.style.setProperty('--parallax-y',`${y.toFixed(1)}px`);
      space.style.setProperty('--tilt-x',`${(-y*.08).toFixed(2)}deg`);
      space.style.setProperty('--tilt-y',`${(x*.08).toFixed(2)}deg`);
      const body=document.body;
      const left=body.classList.contains('cloud-projection-pinned')||point.clientX<58||(body.classList.contains('peek-left')&&point.clientX<430);
      const shelfBounds=getRightShelfHotBounds();
      const shelfTop=shelfBounds.top??80;
      const shelfBottom=shelfBounds.bottom??innerHeight-70;
      const inShelfY=point.clientY>shelfTop&&point.clientY<shelfBottom;
      const inProjectionHold=body.classList.contains('cloud-projection-pinned')&&inShelfY&&point.clientX<shelfBounds.right&&point.clientX>0;
      const right=inProjectionHold
        ||(body.classList.contains('peek-left')&&inShelfY&&point.clientX>shelfBounds.left&&point.clientX<shelfBounds.right)
        ||(body.classList.contains('peek-right')&&point.clientY>shelfTop-24&&point.clientY<shelfBottom+24&&point.clientX>shelfBounds.left-80&&point.clientX<shelfBounds.right);
      if(body.classList.contains('cloud-projection-pinned')&&!inProjectionHold&&point.clientX>shelfBounds.right){
        body.classList.remove('cloud-projection-pinned');
      }
      const shelfPinned=body.classList.contains('ui-pinned');
      if(state.skin!=='xinghui'){if(right||shelfPinned)ensureSpatialShelf()?.setReveal(true);else spatialShelf?.setReveal(false);}
      const top=point.clientY<48||(body.classList.contains('peek-top')&&point.clientY<112)||body.classList.contains('settings-open');
      const dockRect=els.primaryOrbitDock?.getBoundingClientRect?.();
      const inDockZone=dockRect&&point.clientX>=dockRect.left-18&&point.clientX<=dockRect.right+18&&point.clientY>=dockRect.top-34&&point.clientY<=dockRect.bottom+28;
      const bottom=point.clientY>innerHeight-180||(body.classList.contains('peek-bottom')&&(point.clientY>innerHeight-340||inDockZone));
      body.classList.toggle('peek-left',left);
      body.classList.toggle('peek-right',right);
      body.classList.toggle('peek-top',top);
      body.classList.toggle('peek-bottom',bottom);
    });
  },{passive:true});
  window.addEventListener('focus',()=>setAppActivity(true));
  window.addEventListener('blur',()=>requestAnimationFrame(()=>setAppActivity(document.body.classList.contains('desktop-embedded'))));
  document.addEventListener('visibilitychange',()=>setAppActivity(!document.hidden&&(document.hasFocus()||document.body.classList.contains('desktop-embedded'))));
  api.onForegroundFullscreen?.((full) => {
    if (full === foregroundFullscreen) return;
    foregroundFullscreen = !!full;
    setAppActivity(true);
  });
  addEventListener('resize',resizeCanvas);
  updateCloudClock();
  setInterval(updateCloudClock, 1000);
  void refreshNeteaseLyrics();
  setInterval(()=>void refreshNeteaseLyrics(), 450);
  void api.lyrics?.neteaseSyncLibrary?.().catch(()=>null);
  setInterval(()=>void api.lyrics?.neteaseSyncLibrary?.().catch(()=>null), 300000);
  setInterval(()=>{
    if (state.skin === 'xinghui' && lyricRuntime.status && lyricRuntime.status.playing !== false && lyricRuntime.status.stale !== true) renderLyricStatus(lyricRuntime.status);
  }, 180);
  void refreshPerformanceMetrics();
  setInterval(()=>void refreshPerformanceMetrics(), 1800);
  bindUiSounds();
}
// syncControls is defined below after thumbnail position helpers.
function activeThumbnailPosition(){return state.wallpaperParticleMode==='edge'?{x:state.thumbnailEdgeX,y:state.thumbnailEdgeY}:{x:state.thumbnailCenterX,y:state.thumbnailCenterY}}
function setActiveThumbnailPosition(x,y,snap=false){x=clampPercent(x,50);y=clampPercent(y,50);if(state.wallpaperParticleMode==='edge'){state.thumbnailEdgeX=x;state.thumbnailEdgeY=y}else{state.thumbnailCenterX=x;state.thumbnailCenterY=y}state.thumbnailX=x;state.thumbnailY=y;wallpaperParticles?.setThumbnailPosition?.(x,y,state.thumbnailEnabled,snap)}
function particleSourceAnchor(){const region=state.thumbnailRegion;return region?{x:clampPercent((Number(region.x)+Number(region.w)*.5)*100,50),y:clampPercent((Number(region.y)+Number(region.h)*.5)*100,50)}:{x:50,y:50}}
function isParticleAlignedToSource(){const position=activeThumbnailPosition();const anchor=particleSourceAnchor();return state.wallpaperParticleMode==='edge'&&Math.abs(position.x-anchor.x)<.05&&Math.abs(position.y-anchor.y)<.05}
function clampPercent(value,fallback=50){const number=Number(value);return Math.max(0,Math.min(100,Number.isFinite(number)?number:fallback))}
function syncControls(){
  normalizeRuntimeSettings();syncPerformanceClasses();applyThemeColor();applySkin();
  organizeStyleDrawer();
  const root=document.documentElement;const thumb=activeThumbnailPosition();state.thumbnailX=thumb.x;state.thumbnailY=thumb.y;
  $('#motionRange').value=state.motion;$('#motionValue').value=`${state.motion}%`;
  $('#densityRange').value=state.density;$('#densityValue').value=`${state.density}%`;
  $('#loadSpeedRange').value=state.loadSpeed;$('#loadSpeedValue').value=`${state.loadSpeed}%`;
  $('#loadGapRange').value=state.loadGap;$('#loadGapValue').value=`${(state.loadGap/1000).toFixed(2)}s`;
  $('#wallpaperOpacityRange').value=state.wallpaperOpacity;$('#wallpaperOpacityValue').value=`${state.wallpaperOpacity}%`;
  $('#wallpaperBrightnessRange').value=state.wallpaperBrightness;$('#wallpaperBrightnessValue').value=`${state.wallpaperBrightness}%`;
  $('#wallpaperSaturationRange').value=state.wallpaperSaturation;$('#wallpaperSaturationValue').value=`${state.wallpaperSaturation}%`;
  $('#particleOpacityRange').value=state.particleOpacity;$('#particleOpacityValue').value=`${state.particleOpacity}%`;
  $('#wallpaperBlurRange').value=state.wallpaperBlur;$('#wallpaperBlurValue').value=`${state.wallpaperBlur}px`;
  $('#panelBlurRange').value=state.panelBlur;$('#panelBlurValue').value=`${state.panelBlur}px`;
  $('#perspectiveRange').value=state.perspective;$('#perspectiveValue').value=`${state.perspective}%`;
  $('#shelfScaleRange').value=state.shelfScale;$('#shelfScaleValue').value=`${state.shelfScale}%`;
  $('#pathSpeedRange').value=state.pathSpeed;$('#pathSpeedValue').value=`${state.pathSpeed}%`;
  $('#themeHueRange').value=state.themeHue;$('#themeHueValue').value=state.themeHue;
  $('#themeSatRange').value=state.themeSat;$('#themeSatValue').value=`${state.themeSat}%`;
  $('#themeAlphaRange').value=state.themeAlpha;$('#themeAlphaValue').value=`${state.themeAlpha}%`;
  $('#themeRgbInput').value=state.themeRgb;
  $('#focusXRange').value=state.focusX;$('#focusXValue').value=`${state.focusX}%`;
  $('#focusYRange').value=state.focusY;$('#focusYValue').value=`${state.focusY}%`;
  $('#thumbnailXRange').value=thumb.x;$('#thumbnailXValue').value=`${Number(thumb.x).toFixed(1)}%`;
  $('#thumbnailYRange').value=thumb.y;$('#thumbnailYValue').value=`${Number(thumb.y).toFixed(1)}%`;
  root.style.setProperty('--wallpaper-opacity',state.wallpaperOpacity/100);root.style.setProperty('--wallpaper-brightness',state.wallpaperBrightness/100);root.style.setProperty('--wallpaper-saturation',state.wallpaperSaturation/100);root.style.setProperty('--particle-opacity',state.particleOpacity/100);root.style.setProperty('--wallpaper-blur',`${state.wallpaperBlur}px`);root.style.setProperty('--panel-blur',`${state.panelBlur}px`);root.style.setProperty('--thumbnail-x',`${thumb.x}%`);root.style.setProperty('--thumbnail-y',`${thumb.y}%`);root.style.setProperty('--load-speed',state.loadSpeed);root.style.setProperty('--load-gap',`${state.loadGap}ms`);root.style.setProperty('--cloud-glass-alpha',state.cloudGlassAlpha/100);root.style.setProperty('--cloud-border-alpha',state.cloudBorderAlpha/100);root.style.setProperty('--cloud-glass-blur',`${state.cloudGlassBlur}px`);root.style.setProperty('--cloud-font-scale',state.cloudFontScale/100);root.style.setProperty('--cloud-text-rgb',state.cloudTextRgb);root.style.setProperty('--cloud-border-rgb',state.cloudBorderRgb);root.style.setProperty('--lyric-x',`${state.lyricX}px`);root.style.setProperty('--lyric-y',`${state.lyricY}px`);applyLyricAutoTilt();root.style.setProperty('--lyric-scale',state.lyricScale/100);root.style.setProperty('--lyric-text-rgb',state.lyricTextRgb);root.style.setProperty('--lyric-glow-rgb',state.lyricGlowRgb);root.style.setProperty('--lyric-bg-alpha',state.lyricBgAlpha/100);root.style.setProperty('--cloud-path-x',`${state.cloudPathX}px`);root.style.setProperty('--cloud-path-y',`${state.cloudPathY}px`);root.style.setProperty('--cloud-clock-x',`${state.cloudClockX}px`);root.style.setProperty('--cloud-clock-y',`${state.cloudClockY}px`);root.style.setProperty('--cloud-clock-scale',(clampNumber(state.cloudClockScale,70,160,100)/100).toFixed(3));root.style.setProperty('--cloud-clock-font',state.cloudClockFont||'"JetBrains Mono","Cascadia Code",monospace');root.style.setProperty('--ai-x',`${state.aiX}px`);root.style.setProperty('--ai-y',`${state.aiY}px`);
  document.body.classList.toggle('cloud-panel-image-enabled',state.cloudPanelImageEnabled===true);
  document.body.classList.toggle('cloud-hollow-enabled',state.cloudHollow===true);
  document.body.classList.toggle('lyric-float-enabled',state.lyricEffects?.float===true);
  document.body.classList.toggle('lyric-effect-glow-enabled',state.lyricEffects?.glow===true);
  document.body.classList.toggle('lyric-effect-cinema-enabled',state.lyricEffects?.cinema===true);
  document.body.classList.toggle('lyric-hollow-enabled',state.lyricHollow===true);
  document.body.classList.toggle('lyric-only-enabled',state.lyricOnly===true);
  document.body.classList.toggle('lyric-free-move-enabled',state.lyricFreeMove===true);
  document.body.dataset.lyricEffect = state.lyricEffect || 'float';
  document.body.classList.toggle('lyric-empty-hidden',state.lyricEmptyMode==='hidden');
  document.body.classList.toggle('focus-simple',state.focusDisplay==='simple');document.body.classList.toggle('thumbnail-disabled',!state.thumbnailEnabled);document.body.classList.toggle('particle-original-mode',state.wallpaperParticleMode==='edge');
  document.querySelectorAll('.particle-position-settings,.source-region-settings').forEach((node)=>{
    const locked=state.skin==='xinghui';
    node.classList.toggle('locked',locked);
    node.querySelectorAll('button,input').forEach((control)=>{control.disabled=locked});
  });
  document.querySelectorAll('#visualSettings3d,#perspectiveRange,#shelfScaleRange,#focusXRange,#focusYRange').forEach((node)=>{
    const wrap=node.closest?.('.flow-control,.control-label,.visual-settings')||node;
    const locked=state.skin==='xinghui';
    wrap.classList.toggle('locked',locked);
    if(node.matches?.('input,button'))node.disabled=locked;
    node.querySelectorAll?.('button,input').forEach((control)=>{control.disabled=locked});
  });
  document.querySelectorAll('.style-section.style-orbit').forEach((node)=>{
    const locked = state.skin === 'xinghui';
    node.classList.toggle('locked', locked);
    node.querySelectorAll('button,input').forEach((control)=>{ control.disabled = locked; });
  });
  const speed=Math.max(50,Number(state.pathSpeed)||115)/100;const orbitDuration=(26/speed).toFixed(2);const textDuration=(22/speed).toFixed(2);root.style.setProperty('--path-orbit-duration',`${orbitDuration}s`);root.style.setProperty('--path-text-duration',`${textDuration}s`);els.pathRibbonText?.querySelector('animate')?.setAttribute('dur',`${textDuration}s`);
  spatialShelf?.setPerspective(state.perspective/100);spatialShelf?.setScale?.(state.shelfScale/100);
  wallpaperParticles?.setParticleMode?.(state.wallpaperParticleMode);wallpaperParticles?.setFrameRate?.(state.particleFps,state.inactiveFps);wallpaperParticles?.setActive?.(appActive);wallpaperParticles?.setEnabled?.(state.thumbnailEnabled!==false);wallpaperParticles?.setThumbnailPosition?.(thumb.x,thumb.y,state.thumbnailEnabled);wallpaperParticles?.setThumbnailRegion?.(state.thumbnailRegion?{...state.thumbnailRegion,shape:state.thumbnailShape}:null);
  $('#wallpaperSpace')?.classList.toggle('particle-ready',state.skin!=='xinghui'&&state.thumbnailEnabled!==false&&!!wallpaperParticles);
  document.querySelectorAll('[data-flow]').forEach((button)=>button.classList.toggle('active',button.dataset.flow===state.flow));
  document.querySelectorAll('[data-particle-fps]').forEach((button)=>button.classList.toggle('active',Number(button.dataset.particleFps)===Number(state.particleFps)));
  document.querySelectorAll('[data-inactive-fps]').forEach((button)=>button.classList.toggle('active',String(state.inactiveFps)===button.dataset.inactiveFps));
  document.querySelectorAll('[data-theme-mode]').forEach((button)=>button.classList.toggle('active',button.dataset.themeMode===state.themeMode));
  if($('#cloudGlassAlphaRange'))$('#cloudGlassAlphaRange').value=state.cloudGlassAlpha;if($('#cloudGlassAlphaValue'))$('#cloudGlassAlphaValue').value=`${state.cloudGlassAlpha}%`;
  if($('#cloudBorderAlphaRange'))$('#cloudBorderAlphaRange').value=state.cloudBorderAlpha;if($('#cloudBorderAlphaValue'))$('#cloudBorderAlphaValue').value=`${state.cloudBorderAlpha}%`;
  if($('#cloudGlassBlurRange'))$('#cloudGlassBlurRange').value=state.cloudGlassBlur;if($('#cloudGlassBlurValue'))$('#cloudGlassBlurValue').value=`${state.cloudGlassBlur}px`;
  if($('#cloudFontScaleRange'))$('#cloudFontScaleRange').value=state.cloudFontScale;if($('#cloudFontScaleValue'))$('#cloudFontScaleValue').value=`${state.cloudFontScale}%`;
  if($('#cloudTextRgbColor'))$('#cloudTextRgbColor').value=rgbToHex(state.cloudTextRgb);if($('#cloudTextRgbInput'))$('#cloudTextRgbInput').value=state.cloudTextRgb;
  if($('#cloudBorderRgbColor'))$('#cloudBorderRgbColor').value=rgbToHex(state.cloudBorderRgb);if($('#cloudBorderRgbInput'))$('#cloudBorderRgbInput').value=state.cloudBorderRgb;
  document.querySelectorAll('[data-cloud-hollow]').forEach((button)=>button.classList.toggle('active',(button.dataset.cloudHollow==='on')===state.cloudHollow));
  document.querySelectorAll('[data-cloud-panel-image]').forEach((button)=>button.classList.toggle('active',(button.dataset.cloudPanelImage==='on')===state.cloudPanelImageEnabled));
  document.querySelectorAll('[data-skin]').forEach((button)=>button.classList.toggle('active',button.dataset.skin===state.skin));
  document.querySelectorAll('[data-particle-mode]').forEach((button)=>button.classList.toggle('active',button.dataset.particleMode===state.wallpaperParticleMode));
  document.querySelectorAll('[data-wallpaper-source]').forEach((button)=>button.classList.toggle('active',button.dataset.wallpaperSource===state.wallpaperSourceMode));
  document.querySelectorAll('[data-focus-display]').forEach((button)=>button.classList.toggle('active',button.dataset.focusDisplay===state.focusDisplay));
  document.querySelectorAll('[data-thumbnail-enabled]').forEach((button)=>button.classList.toggle('active',String(state.thumbnailEnabled)===button.dataset.thumbnailEnabled));
  document.querySelectorAll('[data-thumbnail-shape]').forEach((button)=>button.classList.toggle('active',button.dataset.thumbnailShape===state.thumbnailShape));
  const aligned=isParticleAlignedToSource();if(els.particlePositionState){els.particlePositionState.textContent=!state.thumbnailEnabled?'粒子已关闭':aligned?'已对齐原图':state.wallpaperParticleMode==='edge'?'原图比例 · 已偏移':'立体悬浮';els.particlePositionState.classList.toggle('aligned',aligned)}
  const resetButton=$('#resetParticlePosition');if(resetButton)resetButton.disabled=!state.thumbnailEnabled||aligned;
  const clearRegionButton=$('#clearParticleRegion');if(clearRegionButton)clearRegionButton.disabled=!state.thumbnailRegion;
  if(embeddedNeteaseAudio)embeddedNeteaseAudio.volume=clampNumber(state.lyricVolume,0,100,80)/100;
  applyBlockStyles();
}
function applyBackgroundSource(source) {
  if (!source?.url && !source?.dataUrl && source?.kind !== 'capture') return;
  const previousKey = sourceKey(activeBackgroundSource);
  activeBackgroundSource = source;
  const url = source.dataUrl || source.url || source.preview || '';
  const space = $('#wallpaperSpace');
  const video = $('#wallpaperVideo');
  if (url && source.kind !== 'video') {
    space.style.setProperty('--wallpaper', `url("${url.replace(/"/g, '%22')}")`);
    space.classList.add('has-wallpaper');
  } else if (url) space.classList.add('has-wallpaper');
  else space.classList.remove('has-wallpaper');
  if (video) {
    if (source.kind === 'video' && source.url) {
      if (video.src !== source.url) video.src = source.url;
      space.classList.add('has-video');
      syncWallpaperVideoPlayback();
    } else {
      video.pause();
      video.removeAttribute('src');
      video.load();
      space.classList.remove('has-video');
    }
  }
  space.classList.toggle('source-animated', ['animated-image', 'video', 'capture'].includes(source.kind));
  const stage = state.thumbnailEnabled !== false ? ensureWallpaperParticles() : wallpaperParticles;
  stage?.setEnabled?.(state.thumbnailEnabled !== false);
  space.classList.toggle('particle-ready', state.thumbnailEnabled !== false && !!stage);
  if (state.thumbnailEnabled !== false && (sourceKey(source) !== previousKey || !stage?.texture)) {
    stage?.setSource(source, source.kind === 'video' ? video : null);
  }
}

function previewWallpaperSource(source) {
  if (!source?.preview) return null;
  const extension = String(source.preview).split(/[?#]/, 1)[0].match(/\.([^.\/]+)$/)?.[1]?.toLowerCase() || '';
  return {
    ...source,
    ok: true,
    url: source.preview,
    kind: extension === 'gif' ? 'animated-image' : 'image',
    captureMode: '',
    source: 'wallpaper-engine-preview'
  };
}
async function resolvePreferredWallpaper(){
  if (state.background?.path?.includes('default-nebula-wallpaper')) state.background=null;
  if (state.wallpaperSourceMode === 'library') {
    if (!isWallpaperEngineSource(state.background) && (state.background?.url || state.background?.dataUrl)) return state.background;
    const fallback = state.wallpaperLibrary?.[0];
    if (fallback) { state.background = { ...fallback }; return state.background; }
    state.background = builtInWallpaperFallback();
    return state.background;
  }
  const detected = await api.getCurrentWallpaper();
  if (state.wallpaperSourceMode === 'wallpaper-engine') {
    if (isWallpaperEngineSource(detected)) {
      if (detected.kind !== 'capture' || Date.now() > wallpaperCaptureBlockedUntil) return detected;
      const preview = previewWallpaperSource(detected);
      if (preview) return preview;
    }
    if (detected?.url || detected?.dataUrl) return detected;
  }
  const fallback = state.wallpaperLibrary?.[0] || builtInWallpaperFallback();
  return fallback;
}
async function resolveRenderableWallpaper(){
  const source=await resolvePreferredWallpaper();
  if (source?.kind==='capture' && !(sourceKey(source)===sourceKey(activeBackgroundSource)&&window.__orbitWallpaperStatus?.kind==='capture'&&window.__orbitWallpaperStatus?.active)) {
    const frame=await api.captureWallpaperFrame?.();
    if (!frame?.ok || !frame.dataUrl) {
      wallpaperCaptureBlockedUntil=Date.now()+15000;
      const preview=previewWallpaperSource(source);
      if(preview)return preview;
      return state.wallpaperLibrary?.[0] || builtInWallpaperFallback();
    }
  }
  return source;
}
async function loadWallpaper(){
  const source = await resolveRenderableWallpaper();
  const fallback = state.wallpaperLibrary?.[0] || builtInWallpaperFallback();
  const next = (source && source.ok !== false && (source.url || source.dataUrl || source.kind === 'capture')) ? source : fallback;
  if (next) {
    if (state.wallpaperSourceMode === 'wallpaper-engine') state.background = isWallpaperEngineSource(next) ? { ...next } : null;
    else if (!state.background || state.wallpaperSourceMode === 'library') state.background = { ...next };
    applyBackgroundSource(next);
  }
  startWallpaperWatch();
}
async function refreshExternalWallpaper(reason='watch'){
  try {
    const next = await resolveRenderableWallpaper();
    if (!next || next.ok===false || (!next.url&&!next.dataUrl&&next.kind!=='capture')) return;
    if (sourceKey(next) !== sourceKey(activeBackgroundSource)) {
      applyBackgroundSource(next);
      if (isWallpaperEngineSource(next)) toast('检测到 Wallpaper Engine 壁纸');
      else if (reason === 'wallpaper-engine-stopped') toast('Wallpaper 已停止，切回默认壁纸');
    }
  } catch (error) {
    console.warn('Wallpaper refresh failed', error);
  }
}
function startWallpaperWatch(){
  clearInterval(wallpaperWatchTimer);
  wallpaperWatchTimer=setInterval(async()=>{
    if(state.wallpaperSourceMode!=='wallpaper-engine')return;
    if(state.skin==='xinghui' && isWallpaperEngineSource(activeBackgroundSource))return;
    const wasEngine=isWallpaperEngineSource(activeBackgroundSource);
    await refreshExternalWallpaper(wasEngine?'wallpaper-engine-active':'watch');
    if(wasEngine&&!isWallpaperEngineSource(activeBackgroundSource))await refreshExternalWallpaper('wallpaper-engine-stopped');
  },10000);
}
function syncDesktopMode(status){const active=status?.enabled===true;document.body.classList.toggle('desktop-embedded',active);$('#desktopModeBadge').innerHTML=`<i></i> ${active?'桌面已接管':'桌面未接管'}`;if(active&&!document.hidden)setAppActivity(true);if(!active&&status?.error)toast(`桌面接管失败：${status.error}`)}
async function init(){
  const saved=await api.settings.load();
  if(saved)Object.assign(state,saved);
  aiMode = state.aiMode === 'simple' ? 'simple' : 'full';
  if(saved&&Number(saved.version||0)<5&&Number(saved.thumbnailEdgeX??50)===50&&Number(saved.thumbnailEdgeY??54)===54)state.thumbnailEdgeY=50;
  if(saved&&Number(saved.version||0)<5&&Number(saved.particleFps)===45)state.particleFps=60;
  if(saved && Number(saved.version || 0) < 4 && saved.wallpaperSourceMode === 'library' && !saved.background)state.wallpaperSourceMode='wallpaper-engine';
  if(saved && Number(saved.version || 0) < 9) state.wallpaperOpacity = 100;
  state.wallpaperOpacity=Math.min(100,Math.max(0,Number.isFinite(Number(state.wallpaperOpacity))?Number(state.wallpaperOpacity):100));
  state.wallpaperBrightness=Math.min(180,Math.max(60,Number.isFinite(Number(state.wallpaperBrightness))?Number(state.wallpaperBrightness):116));
  state.wallpaperSaturation=Math.min(220,Math.max(40,Number.isFinite(Number(state.wallpaperSaturation))?Number(state.wallpaperSaturation):118));
  state.particleOpacity=Math.min(100,Math.max(10,Number(state.particleOpacity)||94));
  state.particleFps=[15,30,45,60,120].includes(Number(state.particleFps))?Number(state.particleFps):60;
  state.inactiveFps=['pause','5','10','15'].includes(String(state.inactiveFps))?String(state.inactiveFps):'10';
  state.loadSpeed=Math.max(35,Math.min(140,Number(state.loadSpeed)||80));
  state.loadGap=Math.max(100,Math.min(1200,Number(state.loadGap)||450));
  state.pathSpeed=Math.min(220,Math.max(50,Number(state.pathSpeed)||115));
  state.focusDisplay=state.focusDisplay==='simple'?'simple':'detailed';
  state.wallpaperSourceMode=state.wallpaperSourceMode==='wallpaper-engine'?'wallpaper-engine':'library';
  state.cloudGlassAlpha=Math.max(0,Math.min(24,Number(state.cloudGlassAlpha)||0));
  state.cloudBorderAlpha=Math.max(20,Math.min(90,Number(state.cloudBorderAlpha)||56));
  state.cloudGlassBlur=Math.max(0,Math.min(28,Number(state.cloudGlassBlur)||12));
  state.cloudFontScale=Math.max(80,Math.min(130,Number(state.cloudFontScale)||100));
  state.cloudPanelImageEnabled=state.cloudPanelImageEnabled===true;
  state.cloudPathX=Number(state.cloudPathX)||0;state.cloudPathY=Number(state.cloudPathY)||0;state.cloudClockX=Number(state.cloudClockX)||0;state.cloudClockY=Number(state.cloudClockY)||0;state.cloudClockFont=String(state.cloudClockFont||'');state.cloudClockScale=clampNumber(state.cloudClockScale,70,160,100);
  state.focusX=clampPercent(state.focusX,50);
  state.focusY=clampPercent(state.focusY,50);
  state.thumbnailCenterX=clampPercent(state.thumbnailCenterX ?? state.thumbnailX,50);
  state.thumbnailCenterY=clampPercent(state.thumbnailCenterY ?? state.thumbnailY,54);
  state.thumbnailEdgeX=clampPercent(state.thumbnailEdgeX ?? state.thumbnailX,50);
  state.thumbnailEdgeY=clampPercent(state.thumbnailEdgeY ?? state.thumbnailY,50);
  const initialThumb=activeThumbnailPosition();
  state.thumbnailX=initialThumb.x;
  state.thumbnailY=initialThumb.y;
  state.thumbnailEnabled=state.thumbnailEnabled!==false;
  state.thumbnailShape=['rect','circle','ellipse','polygon'].includes(state.thumbnailShape)?state.thumbnailShape:'rect';
  state.favorites=Array.isArray(state.favorites)?state.favorites.filter((item)=>item&&item.path&&item.name).slice(0,12):[];
  syncPerformanceClasses();
  galaxyCenterX=state.focusX;
  galaxyCenterY=state.focusY;
  applyGalaxyView();
  upgradePathRibbon();
  if(!pathRibbonRaf)animatePathRibbon();
  document.body.classList.add('cinema-ui','ui-hidden');
  applyPreset(state.preset);
  renderPresets();
  renderFavoriteTray();
  renderCustomBlocks();
  await loadDesktop();
  ensureSpatialShelf();
  applyGalaxyView();
  try { await saveSettings(); } catch (error) { console.warn('[OrbitDesk] early settings save failed', error); }
  try { bindEvents(); } catch (error) { console.warn('[OrbitDesk] bindEvents failed', error); }
  const previewParams=new URLSearchParams(location.search);
  if(previewParams.has('showShelf')){ensureSpatialShelf();document.body.classList.add('peek-right');spatialShelf?.setReveal(true)}
  if(previewParams.has('showUI'))document.body.classList.add('ui-pinned');
  syncControls();
  renderCustomBlocks();
  applyGalaxyView();
  resizeCanvas();
  animate();
  try { await refreshWallpaperLibrary(); } catch (error) { console.warn('[OrbitDesk] wallpaper library failed', error); }
  if(previewParams.has('showSettings'))setStyleDrawerOpen(true);
  try { await loadWallpaper(); } catch (error) { console.warn('[OrbitDesk] wallpaper load failed', error); }
  syncControls();
  applyGalaxyView();
  renderWallpaperLibrary();
  api.onDesktopModeStatus?.(syncDesktopMode);
  try { syncDesktopMode(await api.getDesktopModeStatus?.()); } catch (error) { console.warn('[OrbitDesk] desktop mode status failed', error); }
  applyGalaxyView();
  try { await saveSettings(); } catch (error) { console.warn('[OrbitDesk] settings save failed', error); }
  setTimeout(()=>api.reportRendererReady?.(rendererDiagnostics()),2200);
}
function rendererDiagnostics(){const debugRect=(sel)=>{const e=$(sel);if(!e)return null;const r=e.getBoundingClientRect();const c=getComputedStyle(e);return{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),pos:c.position,width:c.width,maxWidth:c.maxWidth,left:c.left,right:c.right,top:c.top,bottom:c.bottom,bg:c.background.slice(0,80),border:c.border}};return {particles:!!wallpaperParticles,ambientParticles:shouldDrawAmbientParticles(),memorySafe:document.body.classList.contains('memory-safe'),backgroundKind:`${activeBackgroundSource?.source||'system'}:${activeBackgroundSource?.kind||'wallpaper'}`,wallpaperStatus:window.__orbitWallpaperStatus||null,particlePlacement:wallpaperParticles?.getPlacementStatus?.()||null,itemCount:state.payload.items.length,wallpaperLibraryCount:state.wallpaperLibrary.length,wallpaperEngineCount:state.wallpaperEngineCount,webgl:wallpaperParticles?'three-r128+lazy-shelf':'fallback',heap:performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize,limit:performance.memory.jsHeapSizeLimit}:null,dom:{nodes:document.getElementsByTagName('*').length,groups:els.groupList?.children?.length||0,dock:els.primaryOrbitDock?.children?.length||0,orbit:els.orbitNodes?.children?.length||0,rows:els.itemList?.children?.length||0,shelfItems:spatialShelf?.items?.length||0,shelfVisible:$('#shelf3d')?.classList.contains('visible')||false,wallpaperCards:els.wallpaperGrid?.children?.length||0,wallpaperVideos:els.wallpaperGrid?.querySelectorAll('video').length||0,loadedWallpaperThumbnails:els.wallpaperGrid?.querySelectorAll('img.wallpaper-thumb.loaded').length||0,icons:iconCache.size,ambientCanvas:`${canvas.width}x${canvas.height}`,liquidDebug:{pathFloat:debugRect('.cloud-path-float'),topActions:debugRect('.cloud-top-actions'),clock:debugRect('.cloud-clock-widget'),sidebar:debugRect('.cloud-sidebar'),feedCard:debugRect('.cloud-feed-card'),skin:document.body.className}}}}
function finiteNumber(value,fallback){const number=Number(value);return Number.isFinite(number)?number:fallback}
function clampNumber(value,min,max,fallback){return Math.max(min,Math.min(max,finiteNumber(value,fallback)))}
function normalizeRuntimeSettings(){state.loadGap=clampNumber(state.loadGap,100,1200,450);state.shelfScale=clampNumber(state.shelfScale,45,110,82);state.wallpaperOpacity=clampNumber(state.wallpaperOpacity,0,100,100);state.wallpaperBrightness=clampNumber(state.wallpaperBrightness,60,180,116);state.wallpaperSaturation=clampNumber(state.wallpaperSaturation,40,220,118);state.particleOpacity=clampNumber(state.particleOpacity,10,100,94);state.themeHue=clampNumber(state.themeHue,0,360,185);state.themeSat=clampNumber(state.themeSat,0,100,72);state.themeAlpha=clampNumber(state.themeAlpha,18,86,46);state.themeRgb=(parseRgb(state.themeRgb)||[159,233,239]).join(',');state.themeMode=state.themeMode==='light'?'light':'dark';state.skin='xinghui';state.cloudGlassAlpha=clampNumber(state.cloudGlassAlpha,0,100,0);state.cloudBorderAlpha=clampNumber(state.cloudBorderAlpha,0,100,56);state.cloudGlassBlur=clampNumber(state.cloudGlassBlur,0,60,12);state.cloudFontScale=clampNumber(state.cloudFontScale,70,180,100);state.cloudTextRgb=(parseRgb(state.cloudTextRgb)||[255,255,255]).join(',');state.cloudBorderRgb=(parseRgb(state.cloudBorderRgb)||[255,255,255]).join(',');state.cloudPanelImageEnabled=state.cloudPanelImageEnabled===true;state.cloudHollow=state.cloudHollow===true;state.lyricEnabled=state.lyricEnabled!==false;state.lyricEmptyMode=state.lyricEmptyMode==='hidden'?'hidden':'image';state.lyricX=finiteNumber(state.lyricX,0);state.lyricY=finiteNumber(state.lyricY,0);state.lyricTilt=clampNumber(state.lyricTilt,-35,35,-8);state.lyricScale=clampNumber(state.lyricScale,70,180,100);state.lyricTextRgb=(parseRgb(state.lyricTextRgb)||[255,255,255]).join(',');state.lyricBgAlpha=clampNumber(state.lyricBgAlpha,0,80,0);state.lyricHollow=state.lyricHollow!==false;state.lyricEffect=['float','glow','cinema','none'].includes(state.lyricEffect)?state.lyricEffect:'float';normalizeLyricEffects();state.lyricFreeMove=state.lyricFreeMove===true;state.lyricVolume=clampNumber(state.lyricVolume,0,100,80);state.aiX=finiteNumber(state.aiX,0);state.aiY=finiteNumber(state.aiY,0);state.blockStyles=state.blockStyles&&typeof state.blockStyles==='object'&&!Array.isArray(state.blockStyles)?state.blockStyles:{};state.customBlocks=Array.isArray(state.customBlocks)?state.customBlocks.filter((block)=>block&&block.id&&block.type).slice(0,24):[];state.cloudPathX=finiteNumber(state.cloudPathX,0);state.cloudPathY=finiteNumber(state.cloudPathY,0);state.cloudClockX=finiteNumber(state.cloudClockX,0);state.cloudClockY=finiteNumber(state.cloudClockY,0);state.cloudClockFont=String(state.cloudClockFont||'');state.cloudClockScale=clampNumber(state.cloudClockScale,70,160,100);state.newFileDirectory=String(state.newFileDirectory||'');state.wallpaperParticleMode=state.wallpaperParticleMode==='edge'?'edge':'center';state.focusX=clampPercent(state.focusX,50);state.focusY=clampPercent(state.focusY,50);state.thumbnailCenterX=clampPercent(state.thumbnailCenterX ?? state.thumbnailX,50);state.thumbnailCenterY=clampPercent(state.thumbnailCenterY ?? state.thumbnailY,54);state.thumbnailEdgeX=clampPercent(state.thumbnailEdgeX ?? state.thumbnailX,50);state.thumbnailEdgeY=clampPercent(state.thumbnailEdgeY ?? state.thumbnailY,50);const thumb=activeThumbnailPosition();state.thumbnailX=thumb.x;state.thumbnailY=thumb.y;}
init().catch((error)=>{console.error('[OrbitDesk] init failed',error);toast(`初始化失败：${error.message}`);});


