/* OrbitDesk GrokBot 表情组件
   数据来源：LaoA-GrokBot（MIT License，作者 老A玩AI）
   移植核心：SVG 身体 + 双眼睛表情 morph + 视线跟随 + 眨眼 + 动作动画 */
(function createGrokBot(global) {
  const DATA = global.GROKBOT_ORIGINAL;
  if (!DATA) { global.GrokBot = null; return; }

  const BODY_PATH = 'M228.541 114.228C228.541 130.133 225.184 145.994 218.738 160.534C212.674 174.217 203.904 186.669 193.065 196.988C155.933 232.34 99.497 238.596 55.5255 212.24C45.097 205.99 35.6851 198.072 27.7451 188.866C19.1926 178.953 12.3686 167.569 7.65781 155.351C2.60712 142.264 0 128.257 0 114.228C0 98.3219 3.35751 82.4611 9.80315 67.9215C15.8672 54.2382 24.6377 41.7862 35.4767 31.4668C72.6081 -3.88483 129.044 -10.1413 173.016 16.2153C183.444 22.4653 192.856 30.3829 200.796 39.5896C209.349 49.5018 216.173 60.8859 220.883 73.1037C225.934 86.1906 228.541 100.198 228.541 114.228Z';
  const STATE_NAMES = {
    sleeping:'睡眠', waking:'唤醒', idle:'待机', listening:'倾听', thinking:'思考', searching:'搜索', working:'工作中',
    excited:'兴奋', surprised:'惊讶', suspicious:'怀疑', angry:'生气', drowsy:'困倦', happy:'开心', curious:'好奇',
    confused:'困惑', bored:'无聊', proud:'得意', shy:'害羞', sad:'难过', laughing:'大笑', scared:'害怕',
    playful:'调皮', celebrate:'庆祝', orbit:'轨道', radar:'雷达', progress:'进度', spawning:'生成', humming:'哼唱',
    loading:'加载', dictating:'听写', writing:'书写', sending:'发送', receiving:'接收', uploading:'上传',
    notifying:'通知', alerting:'警报', dragging:'拖拽', bouncing:'弹跳', 'powering-down':'关机'
  };
  /* AI 情绪标签 → GrokBot 状态 */
  const EMOTION_STATES = {
    happy:'happy', joy:'happy', excited:'excited', sad:'sad', cry:'sad', angry:'angry', mad:'angry',
    surprised:'surprised', shocked:'surprised', thinking:'thinking', ponder:'thinking', confused:'confused',
    curious:'curious', bored:'bored', proud:'proud', shy:'shy', laughing:'laughing', funny:'laughing',
    scared:'scared', afraid:'scared', playful:'playful', celebrate:'celebrate', listening:'listening',
    working:'working', searching:'searching', writing:'writing', idle:'idle', neutral:'idle', sleepy:'drowsy',
    suspicious:'suspicious'
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const centroid = (ring) => ring.reduce((a, p) => [a[0] + p[0] / ring.length, a[1] + p[1] / ring.length], [0, 0]);
  const ringPath = (ring) => 'M' + ring.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('L') + 'Z';

  let instanceSeq = 0;
  class GrokBot {
    constructor(container, options = {}) {
      this.container = container;
      this.options = options;
      const clipId = `gb-head-clip-${++instanceSeq}`;
      container.innerHTML = `<svg class="grokbot-svg" viewBox="-28 -28 285 285" aria-hidden="true">
        <defs><clipPath id="${clipId}"><path d="${BODY_PATH}"/></clipPath></defs>
        <path class="gb-body" d="${BODY_PATH}"/>
        <g class="gb-eyes" clip-path="url(#${clipId})"><path class="gb-eye"/><path class="gb-eye"/></g>
      </svg>`;
      this.svg = container.querySelector('.grokbot-svg');
      this.eyeEls = container.querySelectorAll('.gb-eye');
      this.current = DATA.EXPRESSIONS[0].map((r) => r.map((p) => [...p]));
      this.target = DATA.EXPRESSIONS[0];
      this.expression = 0;
      this.activeState = 'idle';
      this.morph = 1;
      this.velocity = 0;
      this.last = performance.now();
      this.blinkStart = 0;
      this.gazeX = 0;
      this.gazeY = 0;
      this.turn = 0;
      this.stateTimer = 0;
      this.raf = 0;
      this.disposed = false;
      this.bindPointer();
      this.raf = requestAnimationFrame((t) => this.frame(t));
    }
    bindPointer() {
      /* 视线跟随全局鼠标：无论鼠标在屏幕何处，GrokBot 眼睛都看向鼠标 */
      document.addEventListener('pointermove', (e) => {
        if(this.disposed) return;
        const box = this.container.getBoundingClientRect();
        const cx = box.left + box.width / 2;
        const cy = box.top + box.height / 2;
        this.gazeX = clamp((e.clientX - cx) / (global.innerWidth / 2), -1, 1) * 22;
        this.gazeY = clamp((e.clientY - cy) / (global.innerHeight / 2), -1, 1) * 14;
        /* 轻微转头面向鼠标水平方向 */
        this.turn = clamp((e.clientX - cx) / (global.innerWidth / 2), -1, 1) * 8;
      });
      this.container.addEventListener('pointerdown', () => this.blink());
    }
    rings() {
      return this.current.map((ring, e) => ring.map((p, i) => [
        p[0] + (this.target[e][i][0] - p[0]) * clamp(this.morph, 0, 1),
        p[1] + (this.target[e][i][1] - p[1]) * clamp(this.morph, 0, 1)
      ]));
    }
    blinkScale(now) {
      if (!this.blinkStart) return 1;
      const t = (now - this.blinkStart) / 320;
      if (t >= 1) { this.blinkStart = 0; return 1; }
      return Math.max(t < .42 ? 1 - t / .42 : (t - .42) / .58, .04);
    }
    blink() { this.blinkStart = performance.now(); }
    frame(now) {
      this.raf = requestAnimationFrame((t) => this.frame(t));
      if (this.disposed) return;
      const dt = Math.min((now - this.last) / 1000, .1);
      this.last = now;
      this.velocity += (-14 * this.velocity - 49 * (this.morph - 1)) * dt;
      this.morph += this.velocity * dt;
      if (!Number.isFinite(this.morph)) { this.morph = 1; this.velocity = 0; }
      const shown = this.rings();
      const bs = this.blinkScale(now);
      const rad = this.turn * Math.PI / 180;
      shown.forEach((ring, i) => {
        const c = centroid(ring);
        const base = Math.asin(clamp((c[0] - 114.2705) / 105, -1, 1));
        const longitude = base + rad;
        const depth = Math.cos(longitude);
        const perspective = Math.max(depth, .02) / Math.max(Math.cos(base), .02);
        const x = 114.2705 + 105 * Math.sin(longitude) + this.gazeX;
        const y = c[1] + this.gazeY;
        this.eyeEls[i].setAttribute('d', ringPath(ring));
        this.eyeEls[i].setAttribute('transform', `translate(${x} ${y}) scale(${clamp(perspective, .02, 2.4)} ${bs}) translate(${-c[0]} ${-c[1]})`);
        this.eyeEls[i].style.opacity = depth > .02 ? '1' : '0';
      });
    }
    chooseExpression(index) {
      const next = clamp(Math.round(index), 0, DATA.EXPRESSIONS.length - 1);
      if (next === this.expression && this.morph === 1) return;
      this.current = this.rings();
      this.target = DATA.EXPRESSIONS[next];
      this.expression = next;
      this.morph = 0;
      this.velocity = 0;
    }
    playMotion(name) {
      this.svg.classList.remove('gb-bounce', 'gb-tilt', 'gb-scan', 'gb-turn', 'gb-pulse', 'gb-glitch');
      const bounce = ['excited', 'happy', 'laughing', 'playful', 'celebrate', 'bouncing'];
      const tilt = ['listening', 'thinking', 'curious', 'confused', 'shy', 'dragging'];
      const scan = ['searching', 'working', 'radar', 'dictating', 'writing', 'uploading'];
      const turning = ['orbit', 'spawning', 'sending', 'receiving'];
      const pulse = ['sleeping', 'drowsy', 'bored', 'humming', 'loading', 'progress', 'powering-down'];
      let cls = 'gb-glitch';
      if (bounce.includes(name)) cls = 'gb-bounce';
      else if (tilt.includes(name)) cls = 'gb-tilt';
      else if (scan.includes(name)) cls = 'gb-scan';
      else if (turning.includes(name)) cls = 'gb-turn';
      else if (pulse.includes(name)) cls = 'gb-pulse';
      this.svg.classList.add(cls);
      setTimeout(() => { if (!this.disposed) this.svg.classList.remove(cls); }, 1100);
    }
    setState(name) {
      const key = String(name || 'idle');
      if (!DATA.POOLS[key]) { this.setEmotion(key); return; }
      this.activeState = key;
      clearTimeout(this.stateTimer);
      const pool = DATA.POOLS[key] || [0];
      const current = this.expression;
      const next = pool.find((i) => i !== current) ?? pool[0];
      this.chooseExpression(next);
      this.playMotion(key);
      if (this.options.onState) this.options.onState(key, STATE_NAMES[key] || key);
      const cadence = DATA.EXPR_CADENCE[key];
      if (cadence && DATA.BLINK[key] !== null) {
        const delay = cadence[0] + Math.random() * Math.max(1, cadence[1] - cadence[0]);
        this.stateTimer = setTimeout(() => {
          const choice = pool[Math.floor(Math.random() * pool.length)];
          this.chooseExpression(choice);
        }, delay);
      }
    }
    setEmotion(mood) {
      const key = EMOTION_STATES[String(mood || '').toLowerCase()] || 'idle';
      this.setState(key);
    }
    dispose() {
      this.disposed = true;
      cancelAnimationFrame(this.raf);
      clearTimeout(this.stateTimer);
      this.container.innerHTML = '';
    }
  }

  global.GrokBot = GrokBot;
  global.GROKBOT_STATE_NAMES = STATE_NAMES;
})(window);
