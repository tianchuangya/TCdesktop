(function createWallpaperParticleStage(global) {
  const THREE = global.THREE;
  if (!THREE) { global.WallpaperParticleStage = null; return; }

  const vertexShader = `
    uniform float uTime;
    uniform float uMotion;
    uniform float uPointSize;
    uniform float uFlowMode;
    uniform float uSwirlMode;
    uniform float uParticleMode;
    uniform vec2 uPointer;
    attribute float aSeed;
    varying vec2 vUv;
    varying float vDepth;
    varying float vSeed;
    void main() {
      vUv = uv;
      vSeed = aSeed;
      vec3 p = position;
      if (uParticleMode > .5) {
        p.xy *= .71;
      }
      float displacement = 0.0;
      if (uFlowMode < .5) {
        displacement = sin(p.x * .72 + uTime * 1.18) * .22 + cos(p.y * 1.12 - uTime * .84) * .13;
      } else if (uFlowMode < 1.5) {
        displacement = sin(p.x * .26 + p.y * .9 + uTime * 1.55) * .16;
        p.x += sin(p.y * .7 + uTime * 1.1) * .085 * uMotion;
      } else {
        float breath = sin(uTime * .48 + length(p.xy) * .22);
        displacement = breath * .28;
        p.xy *= 1.0 + breath * .004 * uMotion;
      }
      float pointerLift = 0.0;
      if (uParticleMode > .5) {
        float pointerDistance = distance(p.xy, vec2(uPointer.x * 7.5, uPointer.y * 4.2));
        pointerLift = exp(-pointerDistance * .58) * .72;
      }
      p.z += (displacement + pointerLift) * uMotion;
      if (uSwirlMode > .5) {
        float sourceX = p.x;
        float sourceY = p.y;
        float angle = sourceX * .38 + sin(sourceY * .16 + uTime * .34) * .18 + uTime * .052 * uMotion;
        float radius = 5.5 + abs(sourceY) * .16 + sin(sourceX * .72 + uTime * .5) * .22;
        float diskX = sin(angle) * radius;
        float diskY = sourceY * .22 + cos(angle) * radius * .18;
        float diskZ = cos(angle) * radius * .92 - 4.9 + p.z * 1.1;
        p.x = diskX;
        p.y = diskY;
        p.z = diskZ;
      }
      vDepth = p.z;
      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = uPointSize * (.68 + aSeed * .38) * (25.0 / max(2.0, -mvPosition.z)) * (1.0 + max(0.0, p.z) * .045);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;
  const fragmentShader = `
    uniform sampler2D uTexture;
    uniform float uOpacity;
    uniform float uVideoBoost;
    uniform float uParticleMode;
    uniform float uUseRegion;
    uniform float uRegionShape;
    uniform vec4 uRegion;
    uniform vec2 uTexelSize;
    uniform vec2 uEdgeTexelSize;
    varying vec2 vUv;
    varying float vDepth;
    varying float vSeed;
    void main() {
      vec2 point = gl_PointCoord - .5;
      float pointRadius = length(point);
      if (pointRadius > .5) discard;
      float circle = smoothstep(.5, .22, pointRadius);
      vec2 localUv = vUv;
      vec2 sourceUv = uUseRegion > .5 ? uRegion.xy + localUv * uRegion.zw : localUv;
      if (uUseRegion > .5) {
        vec2 centered = localUv - vec2(.5);
        float mask = 1.0;
        if (uRegionShape > .5 && uRegionShape < 1.5) mask = 1.0 - smoothstep(.48, .505, length(centered) * 2.0);
        else if (uRegionShape >= 1.5 && uRegionShape < 2.5) mask = 1.0 - smoothstep(.48, .505, length(centered / vec2(.86, .56)));
        else if (uRegionShape >= 2.5) mask = 1.0 - smoothstep(.92, .98, abs(centered.x) * 1.42 + abs(centered.y) * 1.18);
        if (mask < .02) discard;
      }
      vec2 centeredUv = (localUv - vec2(.5)) / vec2(.33, .46);
      float centerDistance = length(centeredUv);
      float subjectMask = 1.0 - smoothstep(.76, 1.08, centerDistance);
      if (uParticleMode > .5 && subjectMask < .10) discard;
      vec4 source = texture2D(uTexture, sourceUv);
      float luminance = dot(source.rgb, vec3(.299, .587, .114));
      float maxc = max(source.r, max(source.g, source.b));
      float minc = min(source.r, min(source.g, source.b));
      float saturation = maxc - minc;
      float center = 1.0 - smoothstep(.18, .72, distance(localUv, vec2(.5)));
      vec2 px = uEdgeTexelSize;
      float lumR = dot(texture2D(uTexture, sourceUv + vec2(px.x, 0.0)).rgb, vec3(.299, .587, .114));
      float lumL = dot(texture2D(uTexture, sourceUv - vec2(px.x, 0.0)).rgb, vec3(.299, .587, .114));
      float lumD = dot(texture2D(uTexture, sourceUv + vec2(0.0, px.y)).rgb, vec3(.299, .587, .114));
      float lumU = dot(texture2D(uTexture, sourceUv - vec2(0.0, px.y)).rgb, vec3(.299, .587, .114));
      float gradient = abs(lumR - lumL) + abs(lumD - lumU);
      float edge = smoothstep(.018, .125, gradient);
      float contour = smoothstep(.18, .66, edge * 1.18 + saturation * .52 + abs(luminance - .50) * .18);
      float interior = max(smoothstep(.38, .86, luminance), smoothstep(.14, .46, saturation)) * .26;
      float keep = clamp(edge * 1.18 + contour * .72 + interior * (.42 + center * .20), 0.0, 1.0);
      if (edge > .22 && vSeed > .36) discard;
      if (uParticleMode > .5) {
        keep *= subjectMask;
        if (edge < .16 && vSeed > keep * .68) discard;
        if (edge > .18 && vSeed > .24) discard;
      }
      if (keep < .07 || vSeed > keep + .36) discard;
      // Additive blending can turn a few overlapping bright particles into a
      // full-white frame. Keep both the contribution and its alpha bounded,
      // with the full-frame (edge) mode a little dimmer than center mode.
      float modeAlpha = uParticleMode > .5 ? .52 : .38;
      float alpha = circle * uOpacity * (.08 + keep * .52 + edge * .46) * source.a * (.78 + vSeed * .18) * modeAlpha;
      alpha = clamp(alpha, 0.0, .38);
      if (alpha < .012) discard;
      vec3 dominant = mix(vec3(maxc), source.rgb, .36 + saturation * 1.2);
      vec3 lifted = dominant * (1.08 + uVideoBoost * .72 + edge * .36) + vec3(.025 + max(0.0, vDepth) * .025);
      lifted = max(lifted, vec3(0.0));
      lifted = lifted / (vec3(1.0) + lifted * .72);
      lifted = clamp(lifted, 0.0, .92);
      gl_FragColor = vec4(lifted, alpha);
    }
  `;

  const contourVertexShader = `
    uniform float uTime;
    uniform float uMotion;
    uniform float uFlowMode;
    uniform float uSwirlMode;
    uniform float uParticleMode;
    uniform vec2 uPointer;
    attribute float aSeed;
    varying vec2 vUv;
    varying float vDepth;
    varying float vSeed;
    void main() {
      vUv = uv;
      vSeed = aSeed;
      vec3 p = position;
      if (uParticleMode > .5) {
        p.xy *= .71;
      }
      float waveA = sin(p.x * .72 + uTime * 1.18);
      float waveB = cos(p.y * 1.12 - uTime * .84);
      float displacement = waveA * .12 + waveB * .075;
      if (uFlowMode > .5 && uFlowMode < 1.5) {
        displacement = sin(p.x * .26 + p.y * .9 + uTime * 1.55) * .08;
        p.x += sin(p.y * .7 + uTime * 1.1) * .045 * uMotion;
      } else if (uFlowMode >= 1.5) {
        float breath = sin(uTime * .48 + length(p.xy) * .22);
        displacement = breath * .14;
        p.xy *= 1.0 + breath * .002 * uMotion;
      }
      float pointerDistance = distance(p.xy, vec2(uPointer.x * 7.5, uPointer.y * 4.2));
      p.z += (displacement + (uParticleMode > .5 ? exp(-pointerDistance * .58) * .28 : 0.0)) * uMotion;
      if (uSwirlMode > .5) {
        float sourceX = p.x;
        float sourceY = p.y;
        float angle = sourceX * .38 + sin(sourceY * .16 + uTime * .34) * .18 + uTime * .052 * uMotion;
        float radius = 5.5 + abs(sourceY) * .16 + sin(sourceX * .72 + uTime * .5) * .22;
        p.x = sin(angle) * radius;
        p.y = sourceY * .22 + cos(angle) * radius * .18;
        p.z = cos(angle) * radius * .92 - 4.9 + p.z * 1.1;
      }
      vDepth = p.z;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `;

  const contourFragmentShader = `
    uniform sampler2D uTexture;
    uniform float uOpacity;
    uniform float uVideoBoost;
    uniform float uParticleMode;
    uniform float uUseRegion;
    uniform float uRegionShape;
    uniform vec4 uRegion;
    uniform vec2 uTexelSize;
    uniform vec2 uEdgeTexelSize;
    varying vec2 vUv;
    varying float vDepth;
    varying float vSeed;
    void main() {
      vec2 localUv = vUv;
      vec2 sourceUv = uUseRegion > .5 ? uRegion.xy + localUv * uRegion.zw : localUv;
      if (uUseRegion > .5) {
        vec2 centered = localUv - vec2(.5);
        float mask = 1.0;
        if (uRegionShape > .5 && uRegionShape < 1.5) mask = 1.0 - smoothstep(.48, .505, length(centered) * 2.0);
        else if (uRegionShape >= 1.5 && uRegionShape < 2.5) mask = 1.0 - smoothstep(.48, .505, length(centered / vec2(.86, .56)));
        else if (uRegionShape >= 2.5) mask = 1.0 - smoothstep(.92, .98, abs(centered.x) * 1.42 + abs(centered.y) * 1.18);
        if (mask < .025) discard;
      }
      vec4 source = texture2D(uTexture, sourceUv);
      float lum = dot(source.rgb, vec3(.299, .587, .114));
      vec2 px = uEdgeTexelSize;
      float lumR = dot(texture2D(uTexture, sourceUv + vec2(px.x, 0.0)).rgb, vec3(.299, .587, .114));
      float lumL = dot(texture2D(uTexture, sourceUv - vec2(px.x, 0.0)).rgb, vec3(.299, .587, .114));
      float lumD = dot(texture2D(uTexture, sourceUv + vec2(0.0, px.y)).rgb, vec3(.299, .587, .114));
      float lumU = dot(texture2D(uTexture, sourceUv - vec2(0.0, px.y)).rgb, vec3(.299, .587, .114));
      float gradient = abs(lumR - lumL) + abs(lumD - lumU);
      float maxc = max(source.r, max(source.g, source.b));
      float minc = min(source.r, min(source.g, source.b));
      float saturation = maxc - minc;
      float edge = smoothstep(.030, .118, gradient + saturation * .032 + abs(lum - .50) * .014);
      if (uParticleMode > .5) {
        vec2 centeredUv = (localUv - vec2(.5)) / vec2(.33, .46);
        float centerDistance = length(centeredUv);
        float outerRim = 1.0 - smoothstep(.055, .16, abs(centerDistance - .78));
        edge = max(edge * .34, outerRim);
      }
      if (edge < .48) discard;
      vec3 ink = mix(vec3(maxc), source.rgb, .44 + saturation);
      ink = ink * (1.08 + uVideoBoost * .72 + edge * .34) + vec3(.025 + max(0.0, vDepth) * .022);
      ink = max(ink, vec3(0.0));
      ink = ink / (vec3(1.0) + ink * .72);
      ink = clamp(ink, 0.0, .92);
      float alpha = clamp(edge * uOpacity * (.20 + saturation * .22) * source.a * (.72 + vSeed * .10), 0.0, .30);
      if (alpha < .035) discard;
      gl_FragColor = vec4(ink, alpha);
    }
  `;

  class WallpaperParticles {
    constructor(canvas) {
      this.canvas = canvas;
      this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' });
      this.renderer.setPixelRatio(1);
      this.renderer.setClearColor(0x000000, 0);
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(40, 1, .1, 100);
      this.camera.position.z = 12.6;
      this.pointer = new THREE.Vector2();
      this.pointerTarget = new THREE.Vector2();
      this.density = 64;
      this.motion = .52;
      this.texture = null;
      this.fallbackTexture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1, THREE.RGBAFormat);
      this.fallbackTexture.needsUpdate = true;
      this.sourceKind = '';
      this.swirlMode = false;
      this.viewYaw = 0;
      this.viewPitch = 0;
      this.video = null;
      this.videoFrameTracker = null;
      this.videoFrameCount = 0;
      this.captureStream = null;
      this.captureTimer = 0;
      this.pullFrame = null;
      this.captureImage = null;
      this.captureMisses = 0;
      this.lastCaptureMissAt = 0;
      this.captureCanvas = null;
      this.captureContext = null;
      this.captureBusy = false;
      this.lastCaptureSequence = -1;
      this.animatedImage = null;
      this.ownsVideo = false;
      this.disposed = false;
      this.enabled = true;
      this.contextLost = false;
      this.sourceGeneration = 0;
      this.sourceKey = '';
      this.activeSourceKey = '';
      this.sourceLoading = false;
      this.densityFrame = 0;
      this.points = null;
      this.spiral = null;
      this.spiralGeometry = null;
      this.spiralMaterial = null;
      this.contourLines = null;
      this.contourMaterial = null;
      this.thumbnailPosition = new THREE.Vector2(50, 50);
      this.thumbnailEnabled = true;
      this.thumbnailRegion = null;
      this.regionKey = '';
      this.lastAspect = 16 / 9;
      this.sourceAspect = 16 / 9;
      this.particleMode = 'center';
      this.resizeGeometryFrame = 0;
      this.geometryBuildCount = 0;
      this.pixelBudget = 2600000;
      this.minPixelBudget = 1500000;
      this.maxPixelBudget = 2800000;
      this.measuredFps = 0;
      this.renderMsEma = 0;
      this.performanceSampleAt = performance.now();
      this.performanceFrames = 0;
      this.lastQualityChangeAt = 0;
      this.geometry = null;
      this.material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 }, uMotion: { value: this.motion }, uPointSize: { value: 1.48 }, uFlowMode: { value: 0 }, uSwirlMode: { value: 0 }, uParticleMode: { value: 1 }, uUseRegion: { value: 0 }, uRegionShape: { value: 0 }, uRegion: { value: new THREE.Vector4(0, 0, 1, 1) },
          uPointer: { value: this.pointer }, uTexture: { value: this.fallbackTexture },
          uOpacity: { value: .88 }, uVideoBoost: { value: .18 }, uTexelSize: { value: new THREE.Vector2(1 / 1024, 1 / 576) }, uEdgeTexelSize: { value: new THREE.Vector2(1 / 256, 1 / 144) }
        },
        vertexShader, fragmentShader, transparent: true, depthWrite: false, depthTest: false,
        blending: THREE.AdditiveBlending
      });
      this.clock = new THREE.Clock();
      this.frame = 0;
      this.idleTimer = 0;
      this.lastRenderAt = 0;
      this.targetFps = 45;
      this.inactiveFps = 10;
      this.isActive = true;
      this.resize = this.resize.bind(this);
      this.render = this.render.bind(this);
      this.handlePointerMove = (event) => {
        if (document.body?.classList.contains('particle-position-picking')) return;
        this.pointerTarget.set((event.clientX / global.innerWidth - .5) * 2, -((event.clientY / global.innerHeight - .5) * 2));
      };
      this.handleContextLost = (event) => {
        event.preventDefault();
        this.contextLost = true;
        if (this.frame) global.cancelAnimationFrame(this.frame);
        if (this.idleTimer) global.clearTimeout(this.idleTimer);
        this.frame = 0;
        this.idleTimer = 0;
        this.restartCaptureTimer();
      };
      this.handleContextRestored = () => {
        if (this.disposed) return;
        this.contextLost = false;
        if (this.texture) this.texture.needsUpdate = true;
        this.resize();
        this.restartCaptureTimer();
        if (this.enabled && !this.frame) this.frame = global.requestAnimationFrame(this.render);
      };
      global.addEventListener('resize', this.resize);
      global.addEventListener('pointermove', this.handlePointerMove, { passive: true });
      this.canvas.addEventListener('webglcontextlost', this.handleContextLost, false);
      this.canvas.addEventListener('webglcontextrestored', this.handleContextRestored, false);
      this.resize();
      this.buildSpiralField();
      this.render();
    }
    buildSpiralField() {
      const arms = 4, perArm = 260;
      const positions = new Float32Array(arms * perArm * 3);
      const colors = new Float32Array(arms * perArm * 3);
      let p = 0, c = 0;
      for (let arm = 0; arm < arms; arm += 1) {
        const offset = arm / arms * Math.PI * 2;
        for (let i = 0; i < perArm; i += 1) {
          const t = i / Math.max(1, perArm - 1);
          const angle = offset + t * Math.PI * 4.8;
          const radius = .55 + t * 7.2 + Math.sin(t * 18 + arm) * .16;
          const height = (t - .5) * 3.6 + Math.sin(angle * 1.8) * .18;
          positions[p++] = Math.cos(angle) * radius;
          positions[p++] = Math.sin(angle) * radius * .24 + height * .24;
          positions[p++] = Math.sin(angle) * radius * .92 - 4.2;
          const hot = .35 + (1 - t) * .45;
          colors[c++] = .36 + hot * .55;
          colors[c++] = .72 + hot * .25;
          colors[c++] = .82 + hot * .18;
        }
      }
      this.spiralGeometry = new THREE.BufferGeometry();
      this.spiralGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      this.spiralGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      this.spiralMaterial = new THREE.PointsMaterial({
        size: .034,
        transparent: true,
        opacity: 0,
        vertexColors: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending
      });
      this.spiral = new THREE.Points(this.spiralGeometry, this.spiralMaterial);
      this.spiral.rotation.x = -.08;
      this.spiral.rotation.z = -.08;
      this.scene.add(this.spiral);
    }
    getViewSize() {
      const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov * .5)) * this.camera.position.z;
      return { width: viewHeight * this.camera.aspect, height: viewHeight };
    }
    geometrySize(aspect) {
      const view = this.getViewSize();
      if (this.particleMode === 'edge' && this.thumbnailRegion) {
        return {
          width: view.width * Math.max(.02, Math.min(1, Number(this.thumbnailRegion.w) || 1)),
          height: view.height * Math.max(.02, Math.min(1, Number(this.thumbnailRegion.h) || 1))
        };
      }
      const frameScale = this.particleMode === 'edge' ? 1 : 1.08;
      const frameWidth = view.width * frameScale;
      const frameHeight = view.height * frameScale;
      return aspect >= this.camera.aspect
        ? { width: frameHeight * aspect, height: frameHeight }
        : { width: frameWidth, height: frameWidth / Math.max(.1, aspect) };
    }
    screenRegionToSource(region) {
      const viewportAspect = Math.max(.1, this.camera.aspect || global.innerWidth / Math.max(1, global.innerHeight));
      const sourceAspect = Math.max(.1, this.sourceAspect || 16 / 9);
      let originX = 0, originY = 0, visibleWidth = 1, visibleHeight = 1;
      if (sourceAspect > viewportAspect) {
        visibleWidth = viewportAspect / sourceAspect;
        originX = (1 - visibleWidth) * .5;
      } else if (sourceAspect < viewportAspect) {
        visibleHeight = sourceAspect / viewportAspect;
        originY = (1 - visibleHeight) * .5;
      }
      return {
        x: originX + region.x * visibleWidth,
        y: 1 - (originY + (region.y + region.h) * visibleHeight),
        w: region.w * visibleWidth,
        h: region.h * visibleHeight
      };
    }
    positionTarget() {
      const view = this.getViewSize();
      return {
        x: (this.thumbnailPosition.x / 100 - .5) * view.width,
        y: (.5 - this.thumbnailPosition.y / 100) * view.height
      };
    }
    sourceAnchor() {
      const region = this.thumbnailRegion;
      return region
        ? { x: (region.x + region.w * .5) * 100, y: (region.y + region.h * .5) * 100 }
        : { x: 50, y: 50 };
    }
    computeRegionKey() {
      const region = this.thumbnailRegion;
      const size = region ? `${region.w.toFixed(4)}|${region.h.toFixed(4)}` : 'full';
      return [size, this.sourceAspect.toFixed(4), this.camera.aspect.toFixed(4), this.particleMode, this.density.toFixed(2)].join('|');
    }
    applyRegionUniforms() {
      const shapeMap = { rect: 0, circle: 1, ellipse: 2, polygon: 3 };
      const region = this.thumbnailRegion;
      if (region) {
        const sourceRegion = this.screenRegionToSource(region);
        this.material.uniforms.uUseRegion.value = 1;
        this.material.uniforms.uRegion.value.set(sourceRegion.x, sourceRegion.y, sourceRegion.w, sourceRegion.h);
        this.material.uniforms.uRegionShape.value = shapeMap[region.shape] ?? 0;
      } else {
        this.material.uniforms.uUseRegion.value = 0;
        this.material.uniforms.uRegion.value.set(0, 0, 1, 1);
        this.material.uniforms.uRegionShape.value = 0;
      }
    }
    applyPosition(snap = false) {
      if (!this.points) return;
      const target = this.positionTarget();
      if (snap) {
        this.points.position.x = target.x;
        this.points.position.y = target.y;
      }
      return target;
    }
    rebuildGeometryForCurrentRegion() {
      const region = this.thumbnailRegion;
      this.applyRegionUniforms();
      if (region) {
        this.buildGeometry(Math.max(.1, (Math.max(.02, region.w) * this.camera.aspect) / Math.max(.02, region.h)));
      } else {
        this.buildGeometry(this.sourceAspect || 16 / 9);
      }
      this.regionKey = this.computeRegionKey();
    }
    setSourceAspect(aspect) {
      const next = Math.max(.1, Number(aspect) || 16 / 9);
      if (this.points && Math.abs(next - this.sourceAspect) < .0005) return;
      this.sourceAspect = next;
      this.rebuildGeometryForCurrentRegion();
    }
    buildGeometry(aspect = 16 / 9) {
      this.lastAspect = aspect;
      const baseColumns = Math.max(76, Math.round(88 + this.density * 1.08));
      const regionWidthScale = this.particleMode === 'edge' && this.thumbnailRegion ? Math.max(.04, this.thumbnailRegion.w) : 1;
      const columns = Math.max(24, Math.round(baseColumns * regionWidthScale));
      const maxPoints = 70000;
      const rows = Math.max(16, Math.min(420, Math.round(columns / Math.max(.1, aspect)), Math.floor(maxPoints / columns)));
      const sampledRegion = this.thumbnailRegion ? this.screenRegionToSource(this.thumbnailRegion) : { w: 1, h: 1 };
      this.material.uniforms.uEdgeTexelSize.value.set(
        Math.max(this.material.uniforms.uTexelSize.value.x, sampledRegion.w / Math.max(1, columns) * .62),
        Math.max(this.material.uniforms.uTexelSize.value.y, sampledRegion.h / Math.max(1, rows) * .62)
      );
      const positions = new Float32Array(columns * rows * 3);
      const uvs = new Float32Array(columns * rows * 2);
      const seeds = new Float32Array(columns * rows);
      let p = 0, t = 0;
      const { width, height } = this.geometrySize(aspect);
      this.geometryRect = { width, height };
      for (let y = 0; y < rows; y += 1) for (let x = 0; x < columns; x += 1) {
        const u = x / Math.max(1, columns - 1), v = y / Math.max(1, rows - 1);
        const seed = Math.random();
        positions[p++] = (u - .5) * width + (seed - .5) * width / columns * .52;
        positions[p++] = (.5 - v) * height + (Math.random() - .5) * height / rows * .52;
        positions[p++] = (Math.random() - .5) * .045;
        uvs[t++] = u; uvs[t++] = 1 - v; seeds[y * columns + x] = seed;
      }
      const next = new THREE.BufferGeometry();
      next.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      next.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      next.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
      if (this.points) { this.scene.remove(this.points); this.geometry?.dispose(); }
      this.geometry = next;
      this.geometryBuildCount += 1;
      this.points = new THREE.Points(next, this.material);
      this.points.rotation.x = this.particleMode === 'edge' ? 0 : this.swirlMode ? -.05 : -.035;
      this.points.rotation.z = this.swirlMode ? -.08 : 0;
      this.scene.add(this.points);
      this.applyPosition(true);
      // Contour lines are currently visually disabled. Avoid compiling and
      // rebuilding a second full geometry until that mode is actually used.
      if (this.contourLines) {
        this.scene.remove(this.contourLines);
        this.contourGeometry?.dispose?.();
        this.contourMaterial?.dispose?.();
        this.contourLines = null;
        this.contourGeometry = null;
        this.contourMaterial = null;
      }
    }
    buildContourLines(aspect = 16 / 9) {
      if (this.contourLines) { this.scene.remove(this.contourLines); this.contourGeometry?.dispose?.(); this.contourMaterial?.dispose?.(); }
      const baseColumns = Math.max(52, Math.round(48 + this.density * .62));
      const columns = Math.min(150, baseColumns);
      const rows = Math.max(24, Math.round(columns / aspect));
      const maxSegments = (columns - 1) * rows + columns * (rows - 1);
      const positions = new Float32Array(maxSegments * 2 * 3);
      const uvs = new Float32Array(maxSegments * 2 * 2);
      const seeds = new Float32Array(maxSegments * 2);
      const width = 17.6, height = width / aspect;
      let p = 0, t = 0, s = 0;
      const addVertex = (x, y) => {
        const u = x / Math.max(1, columns - 1);
        const v = y / Math.max(1, rows - 1);
        const wave = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        positions[p++] = (u - .5) * width;
        positions[p++] = (.5 - v) * height;
        positions[p++] = (Math.sin(x * .33) + Math.cos(y * .27)) * .026;
        uvs[t++] = u; uvs[t++] = 1 - v;
        seeds[s++] = wave - Math.floor(wave);
      };
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < columns - 1; x += 1) {
          if ((x + y) % 2 === 0 || y % 3 === 0) { addVertex(x, y); addVertex(x + 1, y); }
        }
      }
      for (let y = 0; y < rows - 1; y += 1) {
        for (let x = 0; x < columns; x += 1) {
          if ((x + y) % 2 === 1 || x % 4 === 0) { addVertex(x, y); addVertex(x, y + 1); }
        }
      }
      const usedVertices = p / 3;
      this.contourGeometry = new THREE.BufferGeometry();
      this.contourGeometry.setAttribute('position', new THREE.BufferAttribute(positions.subarray(0, usedVertices * 3), 3));
      this.contourGeometry.setAttribute('uv', new THREE.BufferAttribute(uvs.subarray(0, usedVertices * 2), 2));
      this.contourGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds.subarray(0, usedVertices), 1));
      this.contourMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uTime: this.material.uniforms.uTime,
          uMotion: this.material.uniforms.uMotion,
          uFlowMode: this.material.uniforms.uFlowMode,
          uSwirlMode: this.material.uniforms.uSwirlMode,
          uParticleMode: this.material.uniforms.uParticleMode,
          uPointer: this.material.uniforms.uPointer,
          uTexture: this.material.uniforms.uTexture,
          uOpacity: { value: 0 },
          uVideoBoost: this.material.uniforms.uVideoBoost,
          uUseRegion: this.material.uniforms.uUseRegion,
          uRegionShape: this.material.uniforms.uRegionShape,
          uRegion: this.material.uniforms.uRegion,
          uTexelSize: this.material.uniforms.uTexelSize,
          uEdgeTexelSize: this.material.uniforms.uEdgeTexelSize
        },
        vertexShader: contourVertexShader,
        fragmentShader: contourFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      this.contourLines = new THREE.LineSegments(this.contourGeometry, this.contourMaterial);
      this.contourLines.frustumCulled = false;
      this.scene.add(this.contourLines);
    }
    fitTextureSize(width, height, maxWidth = 960, maxHeight = 540) {
      const ratio = Math.min(1, maxWidth / Math.max(1, width), maxHeight / Math.max(1, height));
      return { width: Math.max(16, Math.round(width * ratio)), height: Math.max(16, Math.round(height * ratio)) };
    }
    sourceIdentity(source, sharedVideo = null) {
      const kind = source?.kind || 'image';
      const location = String(source?.dataUrl || source?.url || source?.path || source?.projectDir || source?.preview || source?.id || source?.title || source?.source || '');
      return [kind, source?.captureMode || '', sharedVideo ? 'shared' : 'owned', location].join('|');
    }
    activateTexture(texture, width, height, boost = .2, sourceKey = this.sourceKey) {
      if (!texture || this.disposed) { texture?.dispose?.(); return false; }
      const previousTexture = this.texture;
      this.texture = texture;
      this.material.uniforms.uTexture.value = texture;
      this.material.uniforms.uVideoBoost.value = boost;
      this.material.uniforms.uTexelSize.value.set(1 / Math.max(1, width), 1 / Math.max(1, height));
      this.activeSourceKey = sourceKey;
      this.sourceLoading = false;
      if (previousTexture && previousTexture !== texture) previousTexture.dispose?.();
      return true;
    }
    setCanvasTexture(width, height, boost = .2, activate = true) {
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d', { alpha: false });
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter; texture.generateMipmaps = false; texture.format = THREE.RGBAFormat;
      if (THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;
      this.captureCanvas = canvas;
      this.captureContext = context;
      if (activate) this.activateTexture(texture, width, height, boost);
      return texture;
    }
    releaseVideoFrameTracking() {
      const tracker = this.videoFrameTracker;
      if (!tracker) return;
      if (tracker.id && tracker.video?.cancelVideoFrameCallback) tracker.video.cancelVideoFrameCallback(tracker.id);
      if (tracker.listener) tracker.video?.removeEventListener?.('timeupdate', tracker.listener);
      this.videoFrameTracker = null;
    }
    createManagedVideoTexture(video) {
      this.releaseVideoFrameTracking();
      const originalWidth = video.videoWidth || 16;
      const originalHeight = video.videoHeight || 9;
      const size = this.fitTextureSize(originalWidth, originalHeight, 1280, 720);
      const canvas = document.createElement('canvas');
      canvas.width = size.width;
      canvas.height = size.height;
      const context = canvas.getContext('2d', { alpha: false, desynchronized: true });
      try {
        if (video.readyState >= 2) context.drawImage(video, 0, 0, size.width, size.height);
      } catch (_) {}
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.format = THREE.RGBAFormat;
      if (THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;
      const tracker = { video, texture, canvas, context, id: 0, listener: null, lastUploadAt: 0 };
      const uploadFrame = (timestamp = performance.now()) => {
        if (this.disposed || this.videoFrameTracker !== tracker || this.video !== video) return;
        if (!this.enabled || this.contextLost || document.hidden || video.readyState < 2) return;
        if (tracker.lastUploadAt && timestamp - tracker.lastUploadAt < 1000 / 30 - .5) return;
        try {
          context.drawImage(video, 0, 0, size.width, size.height);
          texture.needsUpdate = true;
          tracker.lastUploadAt = timestamp;
          this.videoFrameCount += 1;
        } catch (_) {}
      };
      const markFrame = (timestamp) => {
        if (this.disposed || this.videoFrameTracker !== tracker || this.video !== video) return;
        tracker.id = video.requestVideoFrameCallback(markFrame);
        uploadFrame(timestamp);
      };
      if (video.requestVideoFrameCallback) tracker.id = video.requestVideoFrameCallback(markFrame);
      else {
        tracker.listener = () => uploadFrame(performance.now());
        video.addEventListener('timeupdate', tracker.listener, { passive: true });
      }
      this.videoFrameTracker = tracker;
      texture.needsUpdate = true;
      return texture;
    }
    releaseSourceMedia() {
      this.releaseVideoFrameTracking();
      if (this.video && this.ownsVideo) {
        this.video.pause();
        this.video.srcObject = null;
        this.video.removeAttribute('src');
        this.video.load();
      }
      this.video = null;
      this.ownsVideo = false;
      this.animatedImage = null;
      this.captureImage = null;
      if (this.captureStream) { this.captureStream.getTracks().forEach((track) => track.stop()); this.captureStream = null; }
      if (this.captureTimer) { global.clearInterval(this.captureTimer); this.captureTimer = 0; }
      this.pullFrame = null;
      this.captureBusy = false;
      this.captureMisses = 0;
      this.lastCaptureMissAt = 0;
      this.lastCaptureSequence = -1;
      this.captureCanvas = null;
      this.captureContext = null;
    }
    setSource(source, sharedVideo = null) {
      if (!source || !source.url && !source.dataUrl && source.kind !== 'capture') return;
      const sourceKey = this.sourceIdentity(source, sharedVideo);
      if (sourceKey === this.sourceKey && (this.sourceLoading || this.activeSourceKey === sourceKey)) return;
      const generation = ++this.sourceGeneration;
      this.sourceKey = sourceKey;
      this.sourceLoading = true;
      this.sourceKind = source.kind || '';
      this.swirlMode = source.kind === 'animated-image';
      this.material.uniforms.uSwirlMode.value = this.swirlMode ? 1 : 0;
      this.material.uniforms.uPointSize.value = this.swirlMode ? 1.92 : 1.48;
      this.material.uniforms.uOpacity.value = this.swirlMode ? .82 : .76;
      this.material.uniforms.uVideoBoost.value = this.swirlMode ? .24 : .14;
      if (this.spiralMaterial) this.spiralMaterial.opacity = this.swirlMode ? .18 : .045;
      this.releaseSourceMedia();
      if (source.kind === 'capture') {
        if (source.captureMode === 'frame-poll') this.setFramePollSource(generation);
        else this.setCaptureSource(generation);
      } else if (source.kind === 'animated-image') {
        this.setAnimatedImageSource(source.dataUrl || source.url, generation);
      } else if (source.kind === 'video') {
        this.setVideoTextureSource(source.url, sharedVideo, generation);
      } else {
        this.setImageCanvasSource(source.dataUrl || source.url, generation);
      }
    }
    setImageCanvasSource(url, generation = this.sourceGeneration) {
      const image = new Image();
      if (/^https?:/i.test(url)) image.crossOrigin = 'anonymous';
      image.onload = () => {
        if (this.disposed || generation !== this.sourceGeneration) return;
        const originalWidth = image.naturalWidth || image.width || 16;
        const originalHeight = image.naturalHeight || image.height || 9;
        const size = this.fitTextureSize(originalWidth, originalHeight, 1600, 900);
        const texture = this.setCanvasTexture(size.width, size.height, .18, false);
        this.captureContext.drawImage(image, 0, 0, size.width, size.height);
        texture.needsUpdate = true;
        this.activateTexture(texture, size.width, size.height, .18);
        this.setSourceAspect(originalWidth / Math.max(1, originalHeight));
        global.__orbitWallpaperStatus = { kind: 'image', active: true, error: '', width: size.width, height: size.height };
      };
      image.onerror = () => {
        if (generation === this.sourceGeneration) {
          this.sourceLoading = false;
          global.__orbitWallpaperStatus = { kind: 'image', active: false, error: 'image-load-failed', width: 0, height: 0 };
        }
      };
      image.src = url;
    }
    setVideoTextureSource(url, sharedVideo = null, generation = this.sourceGeneration) {
      const canShare = sharedVideo && sharedVideo.tagName === 'VIDEO';
      const video = canShare ? sharedVideo : document.createElement('video');
      if (!canShare) {
        video.src = url;
        video.muted = true;
        video.loop = true;
        video.autoplay = true;
        video.playsInline = true;
        video.preload = 'metadata';
      }
      this.video = video;
      this.ownsVideo = !canShare;
      let activated = false;
      const activate = () => {
        if (this.disposed || generation !== this.sourceGeneration || this.video !== video || activated) return;
        if (video.readyState < 2) {
          video.addEventListener('loadeddata', activate, { once: true });
          video.play().catch(() => {});
          return;
        }
        activated = true;
        const originalWidth = video.videoWidth || 16;
        const originalHeight = video.videoHeight || 9;
        const size = this.fitTextureSize(originalWidth, originalHeight, 1280, 720);
        const texture = this.createManagedVideoTexture(video);
        this.activateTexture(texture, size.width, size.height, .20);
        this.setSourceAspect(originalWidth / Math.max(1, originalHeight));
        global.__orbitWallpaperStatus = { kind: 'video-texture', active: true, error: '', width: size.width, height: size.height, sourceWidth: originalWidth, sourceHeight: originalHeight, shared: canShare };
        video.play().catch(() => {});
      };
      if (video.readyState >= 2 && video.videoWidth) activate();
      else video.addEventListener('loadeddata', activate, { once: true });
      video.addEventListener('error', () => {
        if (generation === this.sourceGeneration) {
          this.sourceLoading = false;
          global.__orbitWallpaperStatus = { kind: 'video-texture', active: false, error: 'video-load-failed', width: 0, height: 0, shared: canShare };
        }
      }, { once: true });
      video.play().catch(() => {});
    }
    setAnimatedImageSource(url, generation = this.sourceGeneration) {
      const image = new Image();
      if (/^https?:/i.test(url)) image.crossOrigin = 'anonymous';
      global.__orbitWallpaperStatus = { kind: 'animated-image', active: false, error: '', width: 0, height: 0 };
      image.onload = () => {
        if (this.disposed || generation !== this.sourceGeneration) return;
        const originalWidth = image.naturalWidth || image.width || 16;
        const originalHeight = image.naturalHeight || image.height || 9;
        const size = this.fitTextureSize(originalWidth, originalHeight, 1280, 720);
        const texture = this.setCanvasTexture(size.width, size.height, .22, false);
        const context = this.captureContext;
        context.drawImage(image, 0, 0, size.width, size.height);
        texture.needsUpdate = true;
        this.activateTexture(texture, size.width, size.height, .22);
        this.setSourceAspect(originalWidth / Math.max(1, originalHeight));
        this.animatedImage = image;
        const draw = () => {
          if (this.disposed || generation !== this.sourceGeneration || !this.animatedImage || !this.enabled || this.contextLost) return;
          context.drawImage(image, 0, 0, size.width, size.height);
          texture.needsUpdate = true;
          global.__orbitWallpaperStatus = { kind: 'animated-image', active: true, error: '', width: size.width, height: size.height };
        };
        global.__orbitWallpaperStatus = { kind: 'animated-image', active: true, error: '', width: size.width, height: size.height };
        this.pullFrame = draw;
        this.restartCaptureTimer();
      };
      image.onerror = () => {
        if (generation === this.sourceGeneration) {
          this.sourceLoading = false;
          global.__orbitWallpaperStatus = { kind: 'animated-image', active: false, error: 'image-load-failed', width: 0, height: 0 };
        }
      };
      image.src = url;
    }
    setFramePollSource(generation = this.sourceGeneration) {
      const canvas = document.createElement('canvas');
      canvas.width = 960; canvas.height = 540;
      const context = canvas.getContext('2d', { alpha: false });
      this.captureCanvas = canvas;
      this.captureContext = context;
      this.captureImage = new Image();
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter; texture.generateMipmaps = false; texture.format = THREE.RGBAFormat;
      if (THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;
      this.setSourceAspect(16 / 9);
      global.__orbitWallpaperStatus = { kind: 'capture-frame', active: false, error: '', width: 0, height: 0, source: '' };
      const pullFrame = async () => {
        if (this.disposed || generation !== this.sourceGeneration || this.captureBusy || !this.enabled || this.contextLost || !global.orbitDesk?.captureWallpaperFrame) return;
        if (this.captureMisses > 5 && Date.now() - this.lastCaptureMissAt < 1100) return;
        this.captureBusy = true;
        try {
          const frame = await global.orbitDesk.captureWallpaperFrame();
          if (this.disposed || generation !== this.sourceGeneration) { this.captureBusy = false; return; }
          if (!frame?.ok || !frame.dataUrl) {
            this.captureMisses += 1;
            this.lastCaptureMissAt = Date.now();
            global.__orbitWallpaperStatus = { kind: 'capture-frame', active: false, error: frame?.error || 'NO_FRAME', width: 0, height: 0, source: frame?.name || '' };
            this.captureBusy = false;
            return;
          }
          if (frame.sequence != null && frame.sequence === this.lastCaptureSequence) { this.captureBusy = false; return; }
          this.lastCaptureSequence = frame.sequence ?? this.lastCaptureSequence + 1;
          this.captureMisses = 0;
          const image = this.captureImage || new Image();
          image.onload = () => {
            if (this.disposed || generation !== this.sourceGeneration) { this.captureBusy = false; return; }
            const originalWidth = image.naturalWidth || image.width || 16;
            const originalHeight = image.naturalHeight || image.height || 9;
            const size = this.fitTextureSize(originalWidth, originalHeight, 1280, 720);
            if (canvas.width !== size.width || canvas.height !== size.height) {
              canvas.width = size.width; canvas.height = size.height;
            }
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            texture.needsUpdate = true;
            if (this.texture !== texture) this.activateTexture(texture, canvas.width, canvas.height, .18);
            else this.material.uniforms.uTexelSize.value.set(1 / Math.max(1, canvas.width), 1 / Math.max(1, canvas.height));
            this.setSourceAspect(originalWidth / Math.max(1, originalHeight));
            global.__orbitWallpaperStatus = { kind: 'capture-frame', active: true, error: '', width: canvas.width, height: canvas.height, sourceWidth: originalWidth, sourceHeight: originalHeight, source: frame.name || '' };
            this.captureBusy = false;
          };
          image.onerror = () => {
            if (generation === this.sourceGeneration) global.__orbitWallpaperStatus = { kind: 'capture-frame', active: false, error: 'frame-decode-failed', width: 0, height: 0, source: frame.name || '' };
            this.captureBusy = false;
          };
          image.src = frame.dataUrl;
        } catch (error) {
          global.__orbitWallpaperStatus = { kind: 'capture-frame', active: false, error: error.message || String(error), width: 0, height: 0, source: '' };
          this.captureBusy = false;
        }
      };
      pullFrame();
      this.pullFrame = pullFrame;
      this.restartCaptureTimer();
    }
    async setCaptureSource(generation = this.sourceGeneration) {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        if (global.orbitDesk?.captureWallpaperFrame) this.setFramePollSource(generation);
        else if (generation === this.sourceGeneration) this.sourceLoading = false;
        return;
      }
      try {
        global.__orbitWallpaperStatus = { kind: 'capture', active: false, error: '' };
        const captureFps = Math.min(30, Math.max(10, Number(this.targetFps) || 30));
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: captureFps, max: captureFps }, width: { ideal: 1280, max: 1280 }, height: { ideal: 720, max: 720 } },
          audio: false
        });
        if (this.disposed || generation !== this.sourceGeneration) { stream.getTracks().forEach((track) => track.stop()); return; }
        const video = document.createElement('video');
        video.muted = true; video.autoplay = true; video.playsInline = true; video.srcObject = stream;
        this.captureStream = stream; this.video = video; this.ownsVideo = true;
        let activated = false;
        const activate = () => {
          if (this.disposed || generation !== this.sourceGeneration || this.video !== video || activated) return;
          if (video.readyState < 2) {
            video.addEventListener('loadeddata', activate, { once: true });
            video.play().catch(() => {});
            return;
          }
          activated = true;
          const originalWidth = video.videoWidth || 16;
          const originalHeight = video.videoHeight || 9;
          const size = this.fitTextureSize(originalWidth, originalHeight, 1280, 720);
          const texture = this.createManagedVideoTexture(video);
          this.activateTexture(texture, size.width, size.height, .16);
          this.setSourceAspect(originalWidth / Math.max(1, originalHeight));
          global.__orbitWallpaperStatus = { kind: 'capture', active: true, error: '', width: size.width, height: size.height, sourceWidth: originalWidth, sourceHeight: originalHeight };
          video.play().catch(() => {});
        };
        if (video.readyState >= 2 && video.videoWidth) activate();
        else video.addEventListener('loadeddata', activate, { once: true });
        stream.getVideoTracks()[0]?.addEventListener('ended', () => {
          if (this.disposed || generation !== this.sourceGeneration) return;
          global.__orbitWallpaperStatus = { kind: 'capture', active: false, error: 'stream-ended' };
          this.releaseSourceMedia();
          this.sourceLoading = true;
          if (global.orbitDesk?.captureWallpaperFrame) this.setFramePollSource(generation);
          else this.sourceLoading = false;
        });
        video.play().catch(() => {});
      } catch (error) {
        global.__orbitWallpaperStatus = { kind: 'capture', active: false, error: error.message || String(error) };
        console.warn('Wallpaper capture unavailable', error);
        if (!this.disposed && generation === this.sourceGeneration && global.orbitDesk?.captureWallpaperFrame) this.setFramePollSource(generation);
        else if (generation === this.sourceGeneration) this.sourceLoading = false;
      }
    }
    setMotion(value) { this.motion = Math.max(0, Math.min(1, Number(value) || 0)); this.material.uniforms.uMotion.value = this.motion * 1.32; }
    setFlow(mode) { this.material.uniforms.uFlowMode.value = mode === 'wind' ? 1 : mode === 'breath' ? 2 : 0; }
    setParticleMode(mode) {
      const next = mode === 'edge' ? 'edge' : 'center';
      this.material.uniforms.uParticleMode.value = next === 'edge' ? 0 : 1;
      if (next === this.particleMode) return;
      this.particleMode = next;
      if (this.texture && this.computeRegionKey() !== this.regionKey) this.rebuildGeometryForCurrentRegion();
    }
    effectiveFps() {
      if (!this.enabled || this.contextLost) return 0;
      return this.isActive ? this.targetFps : this.inactiveFps;
    }
    setEnabled(value) {
      const next = value !== false;
      const changed = next !== this.enabled;
      this.enabled = next;
      this.thumbnailEnabled = next;
      if (this.points) this.points.visible = next;
      if (!next) {
        if (this.frame) global.cancelAnimationFrame(this.frame);
        if (this.idleTimer) global.clearTimeout(this.idleTimer);
        if (this.captureTimer) global.clearInterval(this.captureTimer);
        this.frame = 0;
        this.idleTimer = 0;
        this.captureTimer = 0;
        if (this.ownsVideo) this.video?.pause?.();
        if (!this.contextLost) this.renderer.clear();
        return changed;
      }
      if (this.ownsVideo) this.video?.play?.().catch?.(() => {});
      if (this.texture) this.texture.needsUpdate = true;
      this.restartCaptureTimer();
      if (this.pullFrame) Promise.resolve().then(() => this.pullFrame?.());
      if (!this.contextLost && !this.frame && !this.disposed) this.frame = global.requestAnimationFrame(this.render);
      return changed;
    }
    setFrameRate(fps, inactiveFps = this.inactiveFps) {
      const next = Math.max(1, Math.min(120, Number(fps) || 45));
      const nextInactive = inactiveFps === 'pause' ? 0 : Math.max(0, Math.min(30, Number(inactiveFps) || 10));
      if (next === this.targetFps && nextInactive === this.inactiveFps) return;
      this.targetFps = next;
      this.inactiveFps = nextInactive;
      this.restartCaptureTimer();
      if (this.effectiveFps() && !this.frame && !this.disposed) this.frame = global.requestAnimationFrame(this.render);
    }
    setActive(value) {
      const next = value !== false;
      if (next === this.isActive) return;
      this.isActive = next;
      this.restartCaptureTimer();
      if (this.idleTimer) { global.clearTimeout(this.idleTimer); this.idleTimer = 0; }
      if (this.enabled && !this.contextLost && !this.frame && !this.disposed) this.frame = global.requestAnimationFrame(this.render);
    }
    restartCaptureTimer() {
      if (this.captureTimer) { global.clearInterval(this.captureTimer); this.captureTimer = 0; }
      if (!this.pullFrame) return;
      const fps = this.effectiveFps();
      if (!fps) return;
      const sourceLimit = this.sourceKind === 'capture' ? 8 : this.sourceKind === 'animated-image' ? 20 : 30;
      const captureFps = Math.min(sourceLimit, fps);
      this.captureTimer = global.setInterval(this.pullFrame, Math.max(16, Math.round(1000 / captureFps)));
    }
    setThumbnailPosition(x, y, enabled = true, snap = false) {
      const nx = Number(x), ny = Number(y);
      const nextX = Math.max(0, Math.min(100, Number.isFinite(nx) ? nx : 50));
      const nextY = Math.max(0, Math.min(100, Number.isFinite(ny) ? ny : 50));
      const nextEnabled = enabled !== false;
      const unchanged = Math.abs(nextX - this.thumbnailPosition.x) < .001
        && Math.abs(nextY - this.thumbnailPosition.y) < .001
        && nextEnabled === this.thumbnailEnabled;
      this.thumbnailPosition.set(nextX, nextY);
      this.thumbnailEnabled = nextEnabled;
      this.setEnabled(nextEnabled);
      if (unchanged && !snap) return;
      this.applyPosition(snap);
    }
    resetPosition(x = 50, y = 50) {
      this.setThumbnailPosition(x, y, this.thumbnailEnabled, true);
      if (this.points && this.particleMode === 'edge') this.points.rotation.set(0, 0, 0);
    }
    getPlacementStatus() {
      const target = this.positionTarget();
      const anchor = this.sourceAnchor();
      const view = this.getViewSize();
      const current = this.points ? { x: this.points.position.x, y: this.points.position.y } : { ...target };
      const errorWorld = Math.hypot(target.x - current.x, target.y - current.y);
      return {
        mode: this.particleMode,
        alignedToSource: this.particleMode === 'edge'
          && Math.abs(this.thumbnailPosition.x - anchor.x) < .05
          && Math.abs(this.thumbnailPosition.y - anchor.y) < .05,
        statePercent: { x: this.thumbnailPosition.x, y: this.thumbnailPosition.y },
        sourceAnchor: anchor,
        targetWorld: target,
        currentWorld: current,
        settleErrorPx: errorWorld / Math.max(.001, view.width) * global.innerWidth,
        sourceAspect: this.sourceAspect,
        viewportAspect: this.camera.aspect,
        geometryRect: this.geometryRect || null,
        pointCount: this.geometry?.getAttribute?.('position')?.count || 0,
        rendererMemory: { ...this.renderer.info.memory },
        canvasSize: [this.canvas.width, this.canvas.height],
        effectiveFps: this.effectiveFps(),
        actualFps: this.measuredFps,
        renderMsEma: this.renderMsEma,
        pixelBudget: this.pixelBudget,
        renderScale: this.renderWidth / Math.max(1, global.innerWidth),
        geometryBuildCount: this.geometryBuildCount,
        videoFrameCount: this.videoFrameCount,
        sourceGeneration: this.sourceGeneration,
        enabled: this.enabled,
        contextLost: this.contextLost,
        textureSize: [this.texture?.image?.width || 0, this.texture?.image?.height || 0]
      };
    }
    setThumbnailRegion(region) {
      const raw = region && Number(region.w) > .01 && Number(region.h) > .01 ? region : null;
      if (raw) {
        const x = Math.max(0, Math.min(.98, Number(raw.x) || 0));
        const y = Math.max(0, Math.min(.98, Number(raw.y) || 0));
        this.thumbnailRegion = {
          x,
          y,
          w: Math.max(.02, Math.min(1 - x, Number(raw.w) || 1)),
          h: Math.max(.02, Math.min(1 - y, Number(raw.h) || 1)),
          shape: ['rect', 'circle', 'ellipse', 'polygon'].includes(raw.shape) ? raw.shape : 'rect'
        };
      } else this.thumbnailRegion = null;
      this.applyRegionUniforms();
      const nextKey = this.computeRegionKey();
      if (nextKey === this.regionKey) return;
      if (this.texture) this.rebuildGeometryForCurrentRegion();
    }
    setViewAngles(yaw, pitch) { this.viewYaw = Math.max(-32, Math.min(32, Number(yaw) || 0)) * Math.PI / 180; this.viewPitch = Math.max(-18, Math.min(18, Number(pitch) || 0)) * Math.PI / 180; }
    setDensity(value) {
      const next = Math.max(20, Math.min(140, Number(value) || 64));
      if (Math.abs(next - this.density) < .01) return;
      this.density = next;
      if (this.densityFrame) global.clearTimeout(this.densityFrame);
      if (this.resizeGeometryFrame) global.cancelAnimationFrame(this.resizeGeometryFrame);
      this.densityFrame = global.setTimeout(() => {
        this.densityFrame = 0;
        if (this.disposed || !this.texture || this.computeRegionKey() === this.regionKey) return;
        this.rebuildGeometryForCurrentRegion();
      }, 90);
    }
    resize() {
      const width = global.innerWidth, height = global.innerHeight;
      const previousAspect = this.camera.aspect;
      const desiredRatio = Math.min(1.25, Math.max(1, global.devicePixelRatio || 1));
      const budgetRatio = Math.sqrt(this.pixelBudget / Math.max(1, width * height));
      const scale = Math.max(.55, Math.min(desiredRatio, budgetRatio));
      const renderWidth = Math.max(1, Math.round(width * scale));
      const renderHeight = Math.max(1, Math.round(height * scale));
      if (renderWidth !== this.renderWidth || renderHeight !== this.renderHeight) {
        this.renderWidth = renderWidth;
        this.renderHeight = renderHeight;
        this.renderer.setSize(renderWidth, renderHeight, false);
      }
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
      this.camera.aspect = width / Math.max(1, height);
      this.camera.updateProjectionMatrix();
      if (this.points && Math.abs(previousAspect - this.camera.aspect) > .001) {
        if (this.resizeGeometryFrame) global.cancelAnimationFrame(this.resizeGeometryFrame);
        this.resizeGeometryFrame = global.requestAnimationFrame(() => {
          this.resizeGeometryFrame = 0;
          if (!this.disposed && this.computeRegionKey() !== this.regionKey) this.rebuildGeometryForCurrentRegion();
        });
      }
    }
    recordPerformance(now, renderMs) {
      this.performanceFrames += 1;
      this.renderMsEma = this.renderMsEma ? this.renderMsEma * .90 + renderMs * .10 : renderMs;
      const elapsed = now - this.performanceSampleAt;
      if (elapsed < 2400) return;
      this.measuredFps = this.performanceFrames * 1000 / Math.max(1, elapsed);
      const desiredFps = Math.min(60, this.effectiveFps());
      let nextBudget = this.pixelBudget;
      if (this.isActive && !document.hidden && desiredFps >= 30 && this.measuredFps > desiredFps * .35 && now - this.lastQualityChangeAt > 2300) {
        const interval = 1000 / desiredFps;
        if (this.measuredFps < desiredFps * .84 || this.renderMsEma > interval * .72) nextBudget *= .82;
        else if (this.measuredFps > desiredFps * .965 && this.renderMsEma < interval * .42) nextBudget *= 1.08;
      }
      nextBudget = Math.round(Math.max(this.minPixelBudget, Math.min(this.maxPixelBudget, nextBudget)) / 50000) * 50000;
      if (Math.abs(nextBudget - this.pixelBudget) >= 50000) {
        this.pixelBudget = nextBudget;
        this.lastQualityChangeAt = now;
        this.resize();
      }
      this.performanceFrames = 0;
      this.performanceSampleAt = now;
    }
    render(now = 0) {
      this.frame = 0;
      if (this.disposed) return;
      const fps = this.effectiveFps();
      if (!fps) return;
      const currentTime = now || performance.now();
      const interval = Math.max(8, 1000 / fps);
      const sinceLast = currentTime - this.lastRenderAt;
      if (this.lastRenderAt && sinceLast < interval - .8) { this.frame = global.requestAnimationFrame(this.render); return; }
      if (this.lastRenderAt) {
        // Advance by at least one interval when an rAF lands just before the
        // target boundary. Leaving the timestamp unchanged here could render
        // two adjacent high-refresh callbacks and overshoot the selected FPS.
        this.lastRenderAt += Math.max(1, Math.floor(sinceLast / interval)) * interval;
        if (this.lastRenderAt > currentTime) this.lastRenderAt = currentTime;
      } else this.lastRenderAt = currentTime;
      const elapsed = this.clock.getElapsedTime(); this.material.uniforms.uTime.value = elapsed;
      const frameDt = Math.max(.001, Math.min(.1, sinceLast / 1000 || interval / 1000));
      const pointerEase = 1 - Math.exp(-frameDt * 10);
      const rotationEase = 1 - Math.exp(-frameDt * 6);
      this.pointer.lerp(this.pointerTarget, pointerEase);
      if (this.points) {
        const centerMode = this.particleMode !== 'edge';
        const targetY = centerMode ? (this.swirlMode ? this.viewYaw + this.pointer.x * .035 + Math.sin(elapsed * .06) * .025 : this.viewYaw + this.pointer.x * .042) : 0;
        const targetX = centerMode ? (this.swirlMode ? -.05 + this.viewPitch - this.pointer.y * .02 : -.035 + this.viewPitch - this.pointer.y * .028) : 0;
        const targetZ = centerMode && this.swirlMode ? -.08 + Math.sin(elapsed * .075) * .018 : 0;
        this.points.rotation.y += (targetY - this.points.rotation.y) * rotationEase;
        this.points.rotation.x += (targetX - this.points.rotation.x) * rotationEase;
        this.points.rotation.z += (targetZ - this.points.rotation.z) * rotationEase;
        const target = this.positionTarget();
        const placementEase = 1 - Math.exp(-frameDt * 12);
        this.points.position.x += (target.x - this.points.position.x) * placementEase;
        this.points.position.y += (target.y - this.points.position.y) * placementEase;
        this.points.visible = this.thumbnailEnabled;
      }
      if (this.contourLines) {
        this.contourLines.rotation.copy(this.points?.rotation || this.contourLines.rotation);
        this.contourLines.position.copy(this.points?.position || this.contourLines.position);
        const target = 0;
        const opacity = this.contourMaterial.uniforms.uOpacity.value;
        this.contourMaterial.uniforms.uOpacity.value += (target - opacity) * (1 - Math.exp(-frameDt * 9));
        this.contourLines.visible = this.contourMaterial.uniforms.uOpacity.value > .012;
      }
      if (this.spiral) {
        const targetOpacity = this.particleMode === 'edge' ? 0 : this.swirlMode ? .18 : .045;
        if (targetOpacity > 0) this.spiral.visible = true;
        this.spiralMaterial.opacity += (targetOpacity - this.spiralMaterial.opacity) * (1 - Math.exp(-frameDt * 6));
        this.spiral.rotation.y += frameDt * (.072 + this.motion * .072);
        this.spiral.rotation.x += (-.08 + this.viewPitch - this.pointer.y * .018 - this.spiral.rotation.x) * (1 - Math.exp(-frameDt * 4));
        this.spiral.rotation.z += (-.08 + this.viewYaw * .35 + this.pointer.x * .014 - this.spiral.rotation.z) * (1 - Math.exp(-frameDt * 4));
        if (targetOpacity === 0 && this.spiralMaterial.opacity < .001) this.spiral.visible = false;
      }
      if (this.video && global.__orbitWallpaperStatus?.kind === 'capture') {
        global.__orbitWallpaperStatus.sourceWidth = this.video.videoWidth || 0;
        global.__orbitWallpaperStatus.sourceHeight = this.video.videoHeight || 0;
      }
      const renderStartedAt = performance.now();
      this.renderer.render(this.scene, this.camera);
      this.recordPerformance(currentTime, performance.now() - renderStartedAt);
      if (this.enabled && !this.contextLost) this.frame = global.requestAnimationFrame(this.render);
    }
    dispose() {
      this.disposed = true;
      this.sourceGeneration += 1;
      if (this.frame) global.cancelAnimationFrame(this.frame);
      if (this.idleTimer) global.clearTimeout(this.idleTimer);
      if (this.densityFrame) global.clearTimeout(this.densityFrame);
      if (this.resizeGeometryFrame) global.cancelAnimationFrame(this.resizeGeometryFrame);
      global.removeEventListener('resize', this.resize);
      global.removeEventListener('pointermove', this.handlePointerMove);
      this.canvas.removeEventListener('webglcontextlost', this.handleContextLost, false);
      this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored, false);
      this.releaseSourceMedia();
      [this.points, this.spiral, this.contourLines].forEach((object) => { if (object) this.scene.remove(object); });
      [this.geometry, this.spiralGeometry, this.contourGeometry].forEach((geometry) => geometry?.dispose?.());
      [this.material, this.spiralMaterial, this.contourMaterial].forEach((material) => material?.dispose?.());
      this.texture?.dispose?.();
      this.fallbackTexture?.dispose?.();
      this.renderer.dispose();
      this.renderer.forceContextLoss?.();
      this.canvas.width = 1; this.canvas.height = 1;
      this.pullFrame = null; this.captureImage = null; this.captureCanvas = null; this.captureContext = null;
    }
  }

  global.WallpaperParticleStage = WallpaperParticles;
})(window);
