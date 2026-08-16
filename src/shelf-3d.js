(function createSpatialShelf(global) {
  const THREE = global.THREE;
  if (!THREE) { global.SpatialShelf3D = null; return; }

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const ease = (value) => value * value * (3 - 2 * value);
  const ICON_CACHE_LIMIT = 128;
  const CARD_WIDTH = 3.88;
  const CARD_HEIGHT = 1.0;
  const CARD_TEXTURE_SCALE = 1.25;
  const CARD_TEXTURE_WIDTH = 1100;
  const CARD_TEXTURE_HEIGHT = 284;

  class SpatialShelf3D {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.options = options;
      this.items = [];
      this.icons = new Map();
      this.centerTarget = 0;
      this.centerSmooth = 0;
      this.reveal = 0;
      this.revealTarget = 0;
      this.compacted = true;
      this.rightInset = 0;
      this.perspective = .72;
      this.scale = .82;
      this.pointer = new THREE.Vector2();
      this.pointerTarget = new THREE.Vector2();
      this.viewportWidth = 1;
      this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' });
      this.renderer.setClearColor(0, 0);
      this.renderer.setPixelRatio(1);
      this.renderer.setSize(1, 1, false);
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(38, 1, .1, 40);
      this.camera.position.z = 8.2;
      this.group = new THREE.Group();
      this.scene.add(this.group);
      this.raycaster = new THREE.Raycaster();
      this.clock = new THREE.Clock();
      this.slots = [];
      this.hoveredSlot = null;
      this.activateTimer = 0;
      this.frame = 0;
      this.compactTimer = 0;
      this.lastRenderAt = 0;
      this.pointerFrame = 0;
      this.pendingPointer = null;
      this.lastWheelAt = 0;
      this.wheelDelta = 0;
      this.disposed = false;
      canvas.tabIndex = 0;
      canvas.setAttribute('role', 'region');
      this.buildSlots();
      document.body?.classList.add('spatial-shelf-active');
      this.emptyState = document.createElement('div');
      this.emptyState.className = 'spatial-shelf-empty';
      this.emptyState.setAttribute('role', 'status');
      this.emptyState.innerHTML = '<span>EMPTY ORBIT</span><strong>此分类暂无项目</strong><small>切换分类，或重新扫描桌面</small>';
      this.emptyState.hidden = true;
      document.body?.appendChild(this.emptyState);
      canvas.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        this.setReveal(false);
        document.body?.classList.remove('spatial-shelf-active');
      }, false);
      canvas.addEventListener('webglcontextrestored', () => {
        document.body?.classList.add('spatial-shelf-active');
        this.resize();
        this.refresh();
      }, false);
      this.resize = this.resize.bind(this);
      this.render = this.render.bind(this);
      global.addEventListener('resize', this.resize);
      if (global.ResizeObserver) {
        this.resizeObserver = new global.ResizeObserver(() => this.resize());
        this.resizeObserver.observe(canvas);
      }
      document.addEventListener('pointermove', (event) => {
        this.pendingPointer = { clientX: event.clientX, clientY: event.clientY, target: event.target };
        if (this.pointerFrame) return;
        this.pointerFrame = global.requestAnimationFrame(() => {
          this.pointerFrame = 0;
          const pending = this.pendingPointer;
          this.pendingPointer = null;
          if (pending) this.handlePointer(pending);
        });
      }, { passive: true });
      document.addEventListener('pointerdown', (event) => this.handlePointerDown(event), true);
      document.addEventListener('wheel', (event) => this.handleWheel(event), { passive: false, capture: true });
      document.addEventListener('click', (event) => this.handleClick(event), true);
      document.addEventListener('dblclick', (event) => this.handleDoubleClick(event), true);
      this.resize();
      this.requestRender();
    }
    buildSlots() {
      for (let offset = -4; offset <= 4; offset += 1) {
        const surface = document.createElement('canvas'); surface.width = 1; surface.height = 1;
        const context = surface.getContext('2d');
        const texture = new THREE.CanvasTexture(surface); texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter; texture.generateMipmaps = false;
        if (THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide, opacity: 0 });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT), material);
        mesh.userData.slotOffset = offset; mesh.renderOrder = 80 - Math.abs(offset);
        this.group.add(mesh);
        this.slots.push({ offset, surface, context, texture, material, mesh, itemIndex: -1, drawKey: '' });
      }
    }
    setItems(items) {
      this.items = Array.isArray(items) ? items : [];
      this.centerTarget = clamp(this.centerTarget, 0, Math.max(0, this.items.length - 1));
      this.centerSmooth = this.centerTarget;
      this.syncSlots(true);
      this.emptyState.hidden = this.items.length > 0;
      this.updateAccessibility();
      this.requestRender();
    }
    updateIcon(itemId, dataUrl) {
      if (!itemId || !dataUrl) return;
      this.icons.set(itemId, dataUrl);
      this.trimIconCache();
      const image = new Image();
      image.onload = () => { this.icons.set(`${itemId}:image`, image); this.trimIconCache(); this.slots.filter((slot) => this.items[slot.itemIndex]?.id === itemId).forEach((slot) => this.drawSlot(slot, true)); this.requestRender(); };
      image.src = dataUrl;
    }
    trimIconCache() {
      while (this.icons.size > ICON_CACHE_LIMIT) this.icons.delete(this.icons.keys().next().value);
    }
    setPerspective(value) { const next = clamp(Number(value) || .72, .2, 1); if (Math.abs(next - this.perspective) < .0001) return; this.perspective = next; this.requestRender(); }
    setScale(value) { const next = clamp(Number(value) || .82, .45, 1.1); if (Math.abs(next - this.scale) < .0001) return; this.scale = next; this.requestRender(); }
    setRightInset(value) { const next = Math.max(0, Number(value) || 0); if (Math.abs(next - this.rightInset) < .5) return; this.rightInset = next; this.requestRender(); }
    refresh() { this.slots.filter((slot) => slot.itemIndex >= 0).forEach((slot) => this.drawSlot(slot, true)); this.requestRender(); }
    requestRender() {
      if (this.compacted && this.revealTarget <= 0) return;
      if (!this.frame && !this.disposed) this.frame = global.requestAnimationFrame(this.render);
    }
    getActiveBounds() {
      const canvasRect = this.canvas.getBoundingClientRect();
      const drawer = document.getElementById('styleDrawer');
      const drawerOpen = drawer && !drawer.hidden;
      const left = Math.max(0, canvasRect.left);
      const right = drawerOpen
        ? Math.max(left, Math.min(canvasRect.right, drawer.getBoundingClientRect().left - 18))
        : Math.min(global.innerWidth, canvasRect.right);
      const expanded = this.revealTarget > .01 || this.reveal > .08
        || document.body.classList.contains('peek-right') || document.body.classList.contains('ui-pinned');
      const hotEdgeWidth = clamp(global.innerWidth * .035, 48, 68);
      return {
        left: expanded ? left : Math.max(left, right - hotEdgeWidth),
        right,
        top: Math.max(64, canvasRect.top),
        bottom: Math.min(global.innerHeight - 56, canvasRect.bottom)
      };
    }
    containsPoint(bounds, event) {
      return event.clientX > bounds.left && event.clientX < bounds.right
        && event.clientY > bounds.top && event.clientY < bounds.bottom;
    }
    isUiTarget(event) {
      return !!event.target?.closest?.('button,input,textarea,select,a,[contenteditable],#styleDrawer,#commandPalette,.region-picker,.particle-position-picker,.topbar,.rail,.primary-orbit-dock,.view-controls,.path-ring,.path-ribbon,.desktop-mini-galaxy,.shelf');
    }
    setReveal(value) {
      const next = value ? 1 : 0;
      const changed = next !== this.revealTarget;
      this.revealTarget = next;
      if (value && this.compacted) {
        clearTimeout(this.compactTimer);
        this.compactTimer = 0;
        this.compacted = false;
        this.lastRenderAt = 0;
        this.resize();
        this.syncSlots(true);
      }
      if (changed) this.requestRender();
      if (!value) {
        this.hoveredSlot = null;
        document.body.classList.remove('shelf-card-hover');
        if (!this.compactTimer) {
          this.compactTimer = global.setTimeout(() => {
            this.compactTimer = 0;
            if (this.revealTarget > 0 || this.disposed) return;
            this.reveal = 0;
            this.canvas.classList.remove('visible');
            this.compact();
          }, 900);
        }
      } else if (this.compactTimer) {
        clearTimeout(this.compactTimer);
        this.compactTimer = 0;
      }
    }
    setCenter(index, notify = true) {
      const next = clamp(Math.round(index), 0, Math.max(0, this.items.length - 1));
      if (next === this.centerTarget) return;
      this.centerTarget = next;
      this.syncSlots(true);
      this.updateAccessibility();
      this.requestRender();
      if (notify && this.options.onSelect) this.options.onSelect(this.items[next], next);
    }
    updateAccessibility() {
      const current = this.items[Math.round(this.centerTarget)];
      const detail = current ? `当前 ${current.name}，第 ${Math.round(this.centerTarget) + 1} 项，共 ${this.items.length} 项。` : '当前分类为空。';
      this.canvas.setAttribute('aria-label', `3D 文件星架。${detail}使用上下方向键选择，按回车打开。`);
    }
    activateCurrent() {
      const item = this.items[Math.round(this.centerTarget)];
      if (item && this.options.onActivate) this.options.onActivate(item);
    }
    syncSlots(force) {
      const center = Math.round(this.centerTarget);
      this.slots.forEach((slot) => {
        const itemIndex = center + slot.offset;
        if (itemIndex < 0 || itemIndex >= this.items.length) {
          slot.itemIndex = -1;
          slot.mesh.visible = false;
          slot.drawKey = '';
          if (slot.surface.width !== 1 || slot.surface.height !== 1) {
            slot.surface.width = 1;
            slot.surface.height = 1;
            slot.texture.needsUpdate = true;
          }
          return;
        }
        slot.mesh.visible = true;
        if (force || slot.itemIndex !== itemIndex) { slot.itemIndex = itemIndex; if (!this.compacted) this.drawSlot(slot, true); }
      });
    }
    roundedRect(ctx, x, y, width, height, radius) {
      ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.arcTo(x + width, y, x + width, y + height, radius); ctx.arcTo(x + width, y + height, x, y + height, radius); ctx.arcTo(x, y + height, x, y, radius); ctx.arcTo(x, y, x + width, y, radius); ctx.closePath();
    }
    fitText(ctx, value, maxWidth) {
      const text = String(value || '');
      if (!text || ctx.measureText(text).width <= maxWidth) return text;
      const ellipsis = '…';
      let low = 0, high = text.length;
      while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        if (ctx.measureText(`${text.slice(0, middle)}${ellipsis}`).width <= maxWidth) low = middle;
        else high = middle - 1;
      }
      return `${text.slice(0, low)}${ellipsis}`;
    }
    drawSlot(slot, force) {
      if (this.compacted) return;
      const item = this.items[slot.itemIndex]; if (!item) return;
      const selected = slot.offset === 0;
      const key = `${item.id}:${selected}:${this.icons.has(`${item.id}:image`)}`; if (!force && slot.drawKey === key) return; slot.drawKey = key;
      const ctx = slot.context;
      if (slot.surface.width !== CARD_TEXTURE_WIDTH || slot.surface.height !== CARD_TEXTURE_HEIGHT) {
        slot.surface.width = CARD_TEXTURE_WIDTH;
        slot.surface.height = CARD_TEXTURE_HEIGHT;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, slot.surface.width, slot.surface.height);
      ctx.setTransform(CARD_TEXTURE_SCALE, 0, 0, CARD_TEXTURE_SCALE, 0, 0);
      const width = slot.surface.width / CARD_TEXTURE_SCALE;
      const height = slot.surface.height / CARD_TEXTURE_SCALE;
      const accent = (getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb') || '159,233,239').trim();
      const cardX = 34, cardY = 24, cardWidth = width - 68, cardHeight = height - 48;
      const gradient = ctx.createLinearGradient(cardX, cardY, width - cardX, height - cardY);
      gradient.addColorStop(0, selected ? 'rgba(4,10,14,.94)' : 'rgba(5,10,14,.56)');
      gradient.addColorStop(.58, selected ? 'rgba(7,16,21,.84)' : 'rgba(7,12,16,.34)');
      gradient.addColorStop(1, selected ? `rgba(${accent},.10)` : `rgba(${accent},.025)`);
      this.roundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 32); ctx.fillStyle = gradient; ctx.fill();
      ctx.lineWidth = selected ? 2.5 : 1.25;
      ctx.strokeStyle = selected ? `rgba(${accent},.86)` : `rgba(${accent},.20)`;
      ctx.shadowBlur = selected ? 22 : 8;
      ctx.shadowColor = selected ? `rgba(${accent},.42)` : `rgba(${accent},.10)`;
      ctx.stroke(); ctx.shadowBlur = 0;
      const highlight = ctx.createLinearGradient(cardX + 24, 0, width - cardX - 24, 0);
      highlight.addColorStop(0, 'rgba(255,255,255,.18)'); highlight.addColorStop(.55, 'rgba(255,255,255,.035)'); highlight.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath(); ctx.moveTo(cardX + 30, cardY + 1); ctx.lineTo(width - cardX - 30, cardY + 1); ctx.strokeStyle = highlight; ctx.lineWidth = 1; ctx.stroke();
      if (selected) {
        this.roundedRect(ctx, cardX + 8, cardY + 26, 4, cardHeight - 52, 2); ctx.fillStyle = `rgba(${accent},.95)`; ctx.shadowBlur = 14; ctx.shadowColor = `rgba(${accent},.65)`; ctx.fill(); ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(cardX + 24, cardY + 23, 4, 0, Math.PI * 2); ctx.fillStyle = `rgba(${accent},.96)`; ctx.fill();
      }
      this.roundedRect(ctx, 60, 48, 136, 132, 28);
      ctx.fillStyle = selected ? 'rgba(5,14,19,.90)' : 'rgba(6,14,19,.68)'; ctx.fill();
      ctx.strokeStyle = selected ? `rgba(${accent},.30)` : `rgba(${accent},.16)`; ctx.lineWidth = 1.5; ctx.stroke();
      const icon = this.icons.get(`${item.id}:image`);
      if (icon) {
        try {
          ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
          ctx.drawImage(icon, 72, 58, 112, 112);
          ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        } catch {}
      } else {
        ctx.fillStyle = `rgb(${accent})`; ctx.font = '700 36px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(String(item.name || '•').slice(0, 2), 128, 130); ctx.textAlign = 'left';
      }
      const textX = 220;
      ctx.fillStyle = selected ? '#f4f9fa' : 'rgba(225,236,237,.72)';
      ctx.font = selected ? '700 35px "Microsoft YaHei UI", Segoe UI' : '650 29px "Microsoft YaHei UI", Segoe UI';
      ctx.fillText(this.fitText(ctx, item.name, width - textX - 112), textX, selected ? 100 : 108);
      ctx.fillStyle = selected ? `rgba(${accent},.78)` : 'rgba(140,155,161,.52)'; ctx.font = '500 18px Consolas';
      const meta = `${item.isDirectory ? 'PROJECT / DIRECTORY' : (item.extension || 'FILE')}  ·  ${new Date(item.modifiedAt || Date.now()).toLocaleDateString('zh-CN')}`;
      ctx.fillText(this.fitText(ctx, meta, selected ? width - textX - 264 : width - textX - 94), textX, selected ? 143 : 151);
      ctx.textAlign = 'right'; ctx.fillStyle = selected ? `rgba(${accent},.92)` : 'rgba(140,155,161,.40)'; ctx.font = '700 16px Consolas'; ctx.fillText(`ITEM ${String(slot.itemIndex + 1).padStart(2, '0')}`, width - 70, 66); ctx.textAlign = 'left';
      if (selected) {
        this.roundedRect(ctx, width - 244, 148, 174, 42, 20); ctx.fillStyle = 'rgba(234,244,245,.94)'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.34)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = '#091116'; ctx.font = '700 19px "Microsoft YaHei UI"'; ctx.textAlign = 'center'; ctx.fillText(item.isDirectory ? '进入星系  ↗' : '打开  ↗', width - 157, 176); ctx.textAlign = 'left';
      }
      slot.texture.needsUpdate = true;
    }
    updateRaycast(clientX, clientY) {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.set(((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1, -((clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObjects(this.slots.filter((slot) => slot.mesh.visible).map((slot) => slot.mesh), false);
      this.hoveredSlot = hits.length ? this.slots.find((slot) => slot.mesh === hits[0].object) : null;
      return this.hoveredSlot;
    }
    handlePointer(event) {
      if (document.body.classList.contains('region-picking') || document.body.classList.contains('particle-position-picking')) { this.setReveal(false); return; }
      if (this.isUiTarget(event)) { this.setReveal(false); return; }
      this.pointerTarget.set((event.clientX / global.innerWidth - .5) * 2, -((event.clientY / global.innerHeight - .5) * 2));
      const bounds = this.getActiveBounds();
      const inHotZone = this.containsPoint(bounds, event);
      this.setReveal(inHotZone || document.body.classList.contains('peek-right') || document.body.classList.contains('ui-pinned'));
      if (this.reveal > .12 && inHotZone) {
        const hit = this.updateRaycast(event.clientX, event.clientY);
        document.body.classList.toggle('shelf-card-hover', !!hit);
      } else document.body.classList.remove('shelf-card-hover');
      if (inHotZone || this.reveal > .01 || this.revealTarget > .01) this.requestRender();
    }
    handlePointerDown(event) {
      if (document.body.classList.contains('region-picking') || document.body.classList.contains('particle-position-picking')) return;
      if (this.isUiTarget(event)) return;
      const bounds = this.getActiveBounds();
      if (this.reveal < .3 || !this.containsPoint(bounds, event)) return;
      const slot = this.updateRaycast(event.clientX, event.clientY); if (!slot || slot.itemIndex < 0) return;
      event.stopImmediatePropagation();
      this.canvas.focus({ preventScroll: true });
    }
    handleWheel(event) {
      if (document.body.classList.contains('region-picking') || document.body.classList.contains('particle-position-picking')) return;
      if (this.isUiTarget(event)) return;
      const bounds = this.getActiveBounds();
      if (this.reveal < .12 || !this.containsPoint(bounds, event)) return;
      const slot = this.updateRaycast(event.clientX, event.clientY); if (!slot || slot.itemIndex < 0) return;
      event.preventDefault(); event.stopImmediatePropagation();
      this.wheelDelta += event.deltaY;
      const now = performance.now();
      if (Math.abs(this.wheelDelta) < 18 || now - this.lastWheelAt < 75) return;
      const direction = this.wheelDelta > 0 ? 1 : -1;
      this.wheelDelta = 0;
      this.lastWheelAt = now;
      this.setCenter(this.centerTarget + direction);
    }
    handleClick(event) {
      if (document.body.classList.contains('region-picking') || document.body.classList.contains('particle-position-picking')) return;
      if (this.isUiTarget(event)) return;
      const bounds = this.getActiveBounds(); if (!this.containsPoint(bounds, event)) return;
      if (this.reveal < .3) return; const slot = this.updateRaycast(event.clientX, event.clientY); if (!slot || slot.itemIndex < 0) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (slot.offset !== 0) { clearTimeout(this.activateTimer); this.setCenter(slot.itemIndex); return; }
      clearTimeout(this.activateTimer);
      this.activateTimer = global.setTimeout(() => { this.activateTimer = 0; this.activateCurrent(); }, 180);
    }
    handleDoubleClick(event) {
      if (document.body.classList.contains('region-picking') || document.body.classList.contains('particle-position-picking')) return;
      if (this.isUiTarget(event)) return;
      const bounds = this.getActiveBounds(); if (!this.containsPoint(bounds, event)) return;
      if (this.reveal < .3) return;
      const slot = this.updateRaycast(event.clientX, event.clientY); if (!slot || slot.itemIndex < 0) return;
      event.preventDefault(); event.stopImmediatePropagation();
      clearTimeout(this.activateTimer); this.activateTimer = 0;
      if (slot.offset !== 0) this.setCenter(slot.itemIndex);
      else this.activateCurrent();
    }
    resize() {
      if (this.compacted && this.revealTarget <= 0) return;
      const rect = this.canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width || Math.min(1240, global.innerWidth * .64)));
      const height = Math.max(1, Math.round(rect.height || global.innerHeight));
      const desiredRatio = Math.min(1.75, Math.max(1, global.devicePixelRatio || 1));
      const budgetRatio = Math.sqrt(3200000 / Math.max(1, width * height));
      const pixelRatio = Math.max(1, Math.min(desiredRatio, budgetRatio));
      if (pixelRatio !== this.pixelRatio) {
        this.pixelRatio = pixelRatio;
        this.renderer.setPixelRatio(pixelRatio);
      }
      this.viewportWidth = width;
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / Math.max(1, height);
      this.camera.updateProjectionMatrix();
      this.requestRender();
    }
    compact() {
      if (this.compacted || this.revealTarget > 0 || this.disposed) return;
      this.compacted = true;
      this.reveal = 0;
      this.pixelRatio = 1;
      this.renderer.setPixelRatio(1);
      this.renderer.setSize(1, 1, false);
      this.slots.forEach((slot) => {
        slot.drawKey = '';
        if (slot.surface.width !== 1 || slot.surface.height !== 1) {
          slot.surface.width = 1;
          slot.surface.height = 1;
          slot.texture.needsUpdate = true;
          slot.texture.dispose();
        }
      });
    }
    render(now = performance.now()) {
      this.frame = 0;
      if (this.disposed) return;
      if (this.compacted && this.revealTarget <= 0) return;
      if (this.lastRenderAt && now - this.lastRenderAt < 1000 / 60) { this.requestRender(); return; }
      this.lastRenderAt = now;
      const dt = Math.min(.05, this.clock.getDelta()); const openRate = this.revealTarget > this.reveal ? 8.5 : 5.4; this.reveal += (this.revealTarget - this.reveal) * (1 - Math.exp(-dt * openRate));
      this.centerSmooth += (this.centerTarget - this.centerSmooth) * (1 - Math.exp(-dt * 10));
      const aspect = this.camera.aspect, viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov * .5)) * this.camera.position.z, viewWidth = viewHeight * aspect;
      // Keep the focused card fully inside the viewport. The shelf still lives on
      // the right, but its selected item has enough breathing room for the glow.
      const strength = this.perspective;
      const selectedZ = .72 + .28 * strength;
      const selectedDepthRatio = clamp((this.camera.position.z - selectedZ) / this.camera.position.z, .5, 1);
      const shelfViewWidth = viewWidth * selectedDepthRatio;
      const shelfViewHeight = viewHeight * selectedDepthRatio;
      const insetWorld = (this.rightInset / Math.max(1, this.viewportWidth)) * shelfViewWidth;
      const safeWorld = clamp(shelfViewWidth * .09, .24, .62);
      const leftEdge = -shelfViewWidth * .5 + safeWorld;
      const rightEdge = Math.max(leftEdge + .18, shelfViewWidth * .5 - safeWorld - insetWorld);
      const preferredSelectedScale = (.97 + strength * .055) * this.scale;
      const availableWidth = Math.max(.18, rightEdge - leftEdge);
      const selectedScale = Math.min(preferredSelectedScale, availableWidth / (CARD_WIDTH + .12));
      const selectedHalfWidth = CARD_WIDTH * selectedScale * .5;
      const baseX = clamp(rightEdge - selectedHalfWidth, leftEdge + selectedHalfWidth, rightEdge - selectedHalfWidth);
      const scaleFit = Math.min(1, selectedScale / Math.max(.001, preferredSelectedScale));
      const verticalStep = Math.min(.72 + strength * .10, Math.max(.46, (shelfViewHeight * .5 - .38) / 4));
      this.slots.forEach((slot) => {
        if (slot.itemIndex < 0) return; const delta = slot.itemIndex - this.centerSmooth, abs = Math.abs(delta), selected = slot.offset === 0, revealEase = ease(this.reveal);
        const slotOrder = Math.max(0, slot.offset + 4);
        const slotDelay = Math.min(.54, slotOrder * .055);
        const localReveal = ease(clamp((revealEase - slotDelay) / Math.max(.2, 1 - slotDelay), 0, 1));
        const hovered = this.hoveredSlot === slot;
        const rawScale = (selected ? .97 + strength * .055 : Math.max(.55, .88 - abs * .095)) * (.90 + localReveal * .10) * this.scale * scaleFit * (hovered ? 1.022 : 1);
        const halfWidth = CARD_WIDTH * rawScale * .5;
        const halfHeight = CARD_HEIGHT * rawScale * .5;
        const openX = clamp(baseX + abs * .028 * strength, leftEdge + halfWidth, rightEdge - halfWidth);
        slot.mesh.position.x = openX + (1 - localReveal) * (2.15 + abs * .11);
        slot.mesh.position.y = clamp(-delta * verticalStep, -shelfViewHeight * .5 + .24 + halfHeight, shelfViewHeight * .5 - .24 - halfHeight);
        slot.mesh.position.z = .72 - abs * (.20 + strength * .16) + (selected ? .28 * strength : 0) + (hovered ? .06 : 0);
        slot.mesh.rotation.y = -.10 - strength * .20 + (1 - localReveal) * .16;
        slot.mesh.rotation.x = -delta * (.018 + strength * .030) - this.pointerTarget.y * .012 * (1 - abs * .12);
        slot.mesh.scale.setScalar(rawScale);
        slot.material.opacity = Math.min(1, localReveal * (selected ? 1 : Math.max(hovered ? .42 : .16, .88 - abs * .20)));
        slot.mesh.renderOrder = selected ? 180 : 100 - Math.round(abs * 7);
      });
      this.group.rotation.y += (this.pointerTarget.x * .018 - this.group.rotation.y) * .035;
      this.group.rotation.x += (-this.pointerTarget.y * .010 - this.group.rotation.x) * .035;
      this.canvas.classList.toggle('visible', this.reveal > .02);
      this.renderer.render(this.scene, this.camera);
      const stillAnimating = Math.abs(this.revealTarget - this.reveal) > .001
        || Math.abs(this.centerTarget - this.centerSmooth) > .001
        || Math.abs(this.pointerTarget.x * .018 - this.group.rotation.y) > .0002
        || Math.abs(-this.pointerTarget.y * .010 - this.group.rotation.x) > .0002;
      if (this.revealTarget <= 0 && this.reveal < .003) this.compact();
      else if (stillAnimating) this.requestRender();
    }
  }
  global.SpatialShelf3D = SpatialShelf3D;
})(window);
