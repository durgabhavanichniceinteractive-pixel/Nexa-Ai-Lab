/**
 * NEXA AI LAB - Core Interactive Engine
 * Production-ready Vanilla JavaScript
 */

(function () {
  'use strict';

  // State
  const state = {
    audioEnabled: false,
    audioCtx: null
  };

  // Safe Web Audio Synth for subtle sci-fi interaction feedback
  function playBeep(freq = 440, type = 'sine', duration = 0.08) {
    if (!state.audioEnabled) return;
    try {
      if (!state.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        state.audioCtx = new AudioContext();
      }
      if (state.audioCtx.state === 'suspended') {
        state.audioCtx.resume();
      }
      const osc = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, state.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, state.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, state.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(state.audioCtx.destination);
      osc.start();
      osc.stop(state.audioCtx.currentTime + duration);
    } catch (e) {
      // Audio fallback
    }
  }

  // ==========================================
  // 1. CUSTOM CURSOR
  // ==========================================
  function initCustomCursor() {
    // Only init on non-touch devices with fine pointers
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let dot = document.querySelector('.cursor-dot');
    let ring = document.querySelector('.cursor-ring');

    if (!dot || !ring) {
      dot = document.createElement('div');
      dot.className = 'cursor-dot';
      ring = document.createElement('div');
      ring.className = 'cursor-ring';
      document.body.appendChild(dot);
      document.body.appendChild(ring);
    }

    let mouseX = -100, mouseY = -100;
    let ringX = -100, ringY = -100;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = `${mouseX}px`;
      dot.style.top = `${mouseY}px`;
    });

    function renderCursor() {
      // Lerp ring towards mouse
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;
      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);

    // Expand on hoverable elements
    const hoverTargets = 'a, button, input, textarea, select, .glass-card, .lab-panel, .project-card, .filter-btn, .insight-card';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverTargets)) {
        ring.classList.add('active');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverTargets)) {
        ring.classList.remove('active');
      }
    });
  }

  // ==========================================
  // 2. HEADER & NAVIGATION
  // ==========================================
  function initHeader() {
    const header = document.querySelector('.header');
    if (!header) return;

    const onScroll = () => {
      if (window.scrollY > 40) {
        header.classList.add('header-scrolled');
      } else {
        header.classList.remove('header-scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mark current active link
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link, .mobile-links a');
    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href === currentPath || (currentPath === '' && href === 'index.html')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Mobile Hamburger & Drawer
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.mobile-nav');
    const backdrop = document.querySelector('.mobile-nav-backdrop');
    const closeBtns = document.querySelectorAll('.mobile-nav-close, #mobileNavClose');
    const mobileLinks = document.querySelectorAll('.mobile-links a');

    if (mobileNav) {
      const openMenu = () => {
        if (hamburger) hamburger.classList.add('open');
        mobileNav.classList.add('open');
        if (backdrop) backdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
        playBeep(700, 'sine', 0.05);
      };

      const closeMenu = () => {
        if (hamburger) hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
        if (backdrop) backdrop.classList.remove('open');
        document.body.style.overflow = '';
        playBeep(450, 'sine', 0.04);
      };

      const toggleMenu = () => {
        if (mobileNav.classList.contains('open')) {
          closeMenu();
        } else {
          openMenu();
        }
      };

      if (hamburger) hamburger.addEventListener('click', toggleMenu);
      if (backdrop) backdrop.addEventListener('click', closeMenu);

      closeBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          closeMenu();
        });
      });

      mobileLinks.forEach((link) => {
        link.addEventListener('click', () => {
          closeMenu();
        });
      });

      // Close on escape
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
          closeMenu();
        }
      });
    }
  }

  // ==========================================
  // 3. NEURAL NETWORK CANVAS (HERO VISUAL)
  // ==========================================
  function initHeroCanvas() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = canvas.parentElement.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight || window.innerHeight);

    let mouse = { x: null, y: null, radius: 140 };

    window.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    window.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });

    const particles = [];
    const particleCount = Math.min(width > 768 ? 65 : 30, 80);

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        this.radius = Math.random() * 2 + 1.2;
        this.baseAlpha = Math.random() * 0.5 + 0.3;
        this.color = Math.random() > 0.3 ? '#00f0ff' : '#8b5cf6';
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx = -this.vx;
        if (this.y < 0 || this.y > height) this.vy = -this.vy;

        // Interaction with mouse
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            this.x -= (dx / dist) * force * 3;
            this.y -= (dy / dist) * force * 3;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let isVisible = true;
    const observer = new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
    });
    observer.observe(canvas);

    function animate() {
      if (isVisible) {
        ctx.clearRect(0, 0, width, height);

        // Connect lines
        for (let i = 0; i < particles.length; i++) {
          particles[i].update();
          particles[i].draw();

          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 130) {
              const alpha = (1 - dist / 130) * 0.35;
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
              ctx.lineWidth = 0.9;
              ctx.stroke();
            }
          }

          // Line to mouse if close
          if (mouse.x !== null && mouse.y !== null) {
            const dx = particles[i].x - mouse.x;
            const dy = particles[i].y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 140) {
              const alpha = (1 - dist / 140) * 0.5;
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
              ctx.lineWidth = 1.2;
              ctx.stroke();
            }
          }
        }
      }
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    // Resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        width = canvas.width = canvas.parentElement.offsetWidth || window.innerWidth;
        height = canvas.height = canvas.parentElement.offsetHeight || window.innerHeight;
      }, 200);
    });
  }

  // ==========================================
  // 3B. 3D ROTATING NEURAL CORE SPHERE
  // ==========================================
  function initHeroNeuralSphere() {
    const canvas = document.getElementById('heroNeuralCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }
    resize();

    // 3D Fibonacci Sphere Nodes
    const NODE_COUNT = 96;
    const SPHERE_RADIUS = Math.min(width, height) * 0.38;
    const nodes = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    for (let i = 0; i < NODE_COUNT; i++) {
      const y = 1 - (i / (NODE_COUNT - 1)) * 2; // y goes from 1 to -1
      const radiusAtY = Math.sqrt(1 - y * y); // radius at y
      const theta = phi * i; // golden angle increment

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      nodes.push({
        origX: x * SPHERE_RADIUS,
        origY: y * SPHERE_RADIUS,
        origZ: z * SPHERE_RADIUS,
        x: 0, y: 0, z: 0,
        screenX: 0, screenY: 0, scale: 1,
        color: i % 4 === 0 ? '#c084fc' : (i % 3 === 0 ? '#38bdf8' : '#00f0ff'),
        size: (Math.random() * 1.5 + 2)
      });
    }

    // Dynamic signal impulses traveling on lines
    const pulses = [];
    for (let i = 0; i < 8; i++) {
      pulses.push({
        nodeA: Math.floor(Math.random() * NODE_COUNT),
        nodeB: Math.floor(Math.random() * NODE_COUNT),
        progress: Math.random(),
        speed: 0.008 + Math.random() * 0.012
      });
    }

    // Mouse and Rotation state
    let rotX = 0.2;
    let rotY = 0;
    let targetRotX = 0.2;
    let targetRotY = 0;
    let mouseX = width / 2;
    let mouseY = height / 2;
    let isHovering = false;

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      const ndcX = (mouseX - width / 2) / (width / 2);
      const ndcY = (mouseY - height / 2) / (height / 2);
      targetRotY = ndcX * 0.8;
      targetRotX = -ndcY * 0.8;
      isHovering = true;
    });

    canvas.addEventListener('mouseleave', () => {
      isHovering = false;
      targetRotX = 0.2;
      targetRotY = 0;
    });

    let isVisible = true;
    const observer = new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
    });
    observer.observe(canvas);

    let angleAuto = 0;

    function render(time) {
      if (isVisible) {
        ctx.clearRect(0, 0, width, height);

        // Smooth rotation damping
        rotX += (targetRotX - rotX) * 0.05;
        rotY += (targetRotY - rotY) * 0.05;
        angleAuto += 0.005; // Ambient slow rotation

        const totalAngleY = angleAuto + rotY;
        const totalAngleX = rotX;

        const cosY = Math.cos(totalAngleY);
        const sinY = Math.sin(totalAngleY);
        const cosX = Math.cos(totalAngleX);
        const sinX = Math.sin(totalAngleX);

        const centerX = width / 2;
        const centerY = height / 2;
        const fov = 420;

        // 1. Draw central glowing core
        const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, SPHERE_RADIUS * 0.7);
        coreGrad.addColorStop(0, 'rgba(0, 240, 255, 0.22)');
        coreGrad.addColorStop(0.4, 'rgba(139, 92, 246, 0.12)');
        coreGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, SPHERE_RADIUS * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // 2. Rotate & Project 3D nodes
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];

          // Rotate around Y
          let x1 = n.origX * cosY - n.origZ * sinY;
          let z1 = n.origZ * cosY + n.origX * sinY;

          // Rotate around X
          let y2 = n.origY * cosX - z1 * sinX;
          let z2 = z1 * cosX + n.origY * sinX;

          n.x = x1;
          n.y = y2;
          n.z = z2;

          const scale = fov / (fov + z2);
          n.scale = scale;
          n.screenX = centerX + x1 * scale;
          n.screenY = centerY + y2 * scale;
        }

        // Sort nodes by depth for correct 3D rendering
        const sortedIndices = nodes.map((_, i) => i).sort((a, b) => nodes[a].z - nodes[b].z);

        // 3. Draw connecting neural network lines
        ctx.lineWidth = 0.8;
        const maxDist = SPHERE_RADIUS * 0.65;

        for (let i = 0; i < nodes.length; i++) {
          const na = nodes[i];
          if (na.z < -SPHERE_RADIUS * 0.7) continue; // Skip far backside for clean aesthetics

          for (let j = i + 1; j < nodes.length; j++) {
            const nb = nodes[j];
            const dx = na.x - nb.x;
            const dy = na.y - nb.y;
            const dz = na.z - nb.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < maxDist) {
              const depthFactor = (na.z + nb.z + SPHERE_RADIUS * 2) / (SPHERE_RADIUS * 4);
              const alpha = Math.max(0.04, (1 - dist / maxDist) * 0.38 * depthFactor);

              ctx.strokeStyle = na.z > 0 ? `rgba(0, 240, 255, ${alpha})` : `rgba(139, 92, 246, ${alpha * 0.8})`;
              ctx.beginPath();
              ctx.moveTo(na.screenX, na.screenY);
              ctx.lineTo(nb.screenX, nb.screenY);
              ctx.stroke();
            }
          }
        }

        // 4. Draw orbital rings
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(totalAngleY * 0.5);

        // Ring 1
        ctx.beginPath();
        ctx.ellipse(0, 0, SPHERE_RADIUS * 1.25, SPHERE_RADIUS * 0.42, 0.45, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.setLineDash([4, 12]);
        ctx.lineWidth = 1;
        ctx.stroke();

        // Ring 2 (counter-rotating)
        ctx.beginPath();
        ctx.ellipse(0, 0, SPHERE_RADIUS * 1.4, SPHERE_RADIUS * 0.35, -0.6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.18)';
        ctx.setLineDash([6, 16]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // 5. Draw impulse signals traveling along lines
        for (let p of pulses) {
          p.progress += p.speed;
          if (p.progress > 1) {
            p.progress = 0;
            p.nodeA = Math.floor(Math.random() * NODE_COUNT);
            p.nodeB = Math.floor(Math.random() * NODE_COUNT);
          }
          const na = nodes[p.nodeA];
          const nb = nodes[p.nodeB];
          const px = na.screenX + (nb.screenX - na.screenX) * p.progress;
          const py = na.screenY + (nb.screenY - na.screenY) * p.progress;
          const pz = na.z + (nb.z - na.z) * p.progress;

          if (pz > -SPHERE_RADIUS * 0.4) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#00f0ff';
            ctx.beginPath();
            ctx.arc(px, py, 2.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }

        // 6. Draw 3D nodes
        for (let idx of sortedIndices) {
          const n = nodes[idx];
          const depthAlpha = Math.max(0.2, (n.z + SPHERE_RADIUS) / (SPHERE_RADIUS * 2));
          const nodeRadius = n.size * n.scale;

          ctx.fillStyle = n.color;
          ctx.globalAlpha = depthAlpha;
          ctx.beginPath();
          ctx.arc(n.screenX, n.screenY, nodeRadius, 0, Math.PI * 2);
          ctx.fill();

          if (n.z > SPHERE_RADIUS * 0.2) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = n.color;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(n.screenX, n.screenY, nodeRadius * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
          ctx.globalAlpha = 1;
        }

        // 7. Interactive node highlight on mouse proximity
        if (isHovering) {
          let closestNode = null;
          let minDist = 35;
          for (let n of nodes) {
            const dx = n.screenX - mouseX;
            const dy = n.screenY - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist && n.z > 0) {
              minDist = dist;
              closestNode = n;
            }
          }
          if (closestNode) {
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(closestNode.screenX, closestNode.screenY, 12, 0, Math.PI * 2);
            ctx.stroke();

            ctx.font = '10px monospace';
            ctx.fillStyle = '#00f0ff';
            ctx.fillText(`SYNAPSE_NODE // ACTIVE`, closestNode.screenX + 16, closestNode.screenY + 4);
          }
        }
      }
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    window.addEventListener('resize', () => {
      resize();
    });
  }

  // ==========================================
  // 4. ANIMATED COUNT-UP STATISTICS
  // ==========================================
  function initCountUp() {
    const statElements = document.querySelectorAll('.stat-number');
    if (!statElements.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const targetStr = el.getAttribute('data-target') || el.innerText;
          const hasPlus = targetStr.includes('+');
          const isPadded = targetStr.startsWith('0') && targetStr.length > 1;
          const targetNum = parseInt(targetStr.replace(/\D/g, ''), 10);

          if (isNaN(targetNum)) return;

          let start = 0;
          const duration = 1600;
          const startTime = performance.now();

          function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentVal = Math.floor(easeProgress * targetNum);

            let displayVal = currentVal.toString();
            if (isPadded && currentVal < 10) displayVal = '0' + displayVal;
            if (hasPlus) displayVal += '+';

            el.innerText = displayVal;

            if (progress < 1) {
              requestAnimationFrame(update);
            } else {
              el.innerText = targetStr;
            }
          }
          requestAnimationFrame(update);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.3 });

    statElements.forEach((el) => observer.observe(el));
  }

  // ==========================================
  // 5. FUTURE LAB INTERACTIVE PANELS & SIGNAL MONITOR
  // ==========================================
  function initFutureLab() {
    const items = document.querySelectorAll('.future-lab-item, .lab-panel');
    const signalTitle = document.getElementById('signalMonitorTitle');
    const signalMetric1 = document.getElementById('signalMetric1');
    const signalMetric2 = document.getElementById('signalMetric2');
    const signalStatus = document.getElementById('signalStatus');

    const labData = {
      '01': {
        title: 'SENSOR // SPATIAL VISION MATRIX',
        mode: 'VISION',
        metric1: '60 FPS / 8K FOV',
        metric2: '0.04mm RESOLUTION',
        status: 'STEREO OPTIC ONLINE'
      },
      '02': {
        title: 'SENSOR // NEURAL AUDIO CODEC',
        mode: 'VOICE',
        metric1: '88ms LATENCY',
        metric2: '48 kHz PROSODY',
        status: 'STREAMING ACTIVE'
      },
      '03': {
        title: 'SENSOR // SLAM VECTOR GUIDANCE',
        mode: 'AUTONOMOUS',
        metric1: '1,000 Hz SERVO',
        metric2: 'SUB-CENTIMETER ACC.',
        status: 'DYNAMIC TRAJECTORY'
      },
      '04': {
        title: 'SENSOR // COGNITIVE CO-REASONING',
        mode: 'HUMAN_AI',
        metric1: '99.4% INTENT SYNC',
        metric2: 'BI-DIRECTIONAL',
        status: 'HARMONIC LOCKED'
      }
    };

    let currentMode = '01';

    items.forEach((item) => {
      const activate = () => {
        items.forEach((i) => i.classList.remove('active'));
        item.classList.add('active');
        playBeep(640, 'sine', 0.04);

        const id = item.getAttribute('data-lab-id') || '01';
        currentMode = id;
        const data = labData[id] || labData['01'];

        if (signalTitle) signalTitle.innerText = data.title;
        if (signalMetric1) signalMetric1.innerText = data.metric1;
        if (signalMetric2) signalMetric2.innerText = data.metric2;
        if (signalStatus) signalStatus.innerText = data.status;

        if (window.updateSignalVisualizerMode) {
          window.updateSignalVisualizerMode(data.mode);
        }
      };

      item.addEventListener('mouseenter', activate);
      item.addEventListener('click', activate);
    });

    // Initialize the canvas visualizer inside the telemetry viewport
    initSignalCanvas();
  }

  function initSignalCanvas() {
    const canvas = document.getElementById('futureLabSignalCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = canvas.parentElement.offsetWidth || 400);
    let height = (canvas.height = 180);
    let currentMode = 'VISION';
    let tick = 0;

    window.updateSignalVisualizerMode = function (mode) {
      currentMode = mode;
    };

    function draw() {
      ctx.clearRect(0, 0, width, height);
      tick += 0.04;

      // Draw subtle grid lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (currentMode === 'VISION') {
        // Spatial radar circles & scanning beam
        const cx = width / 2;
        const cy = height / 2;
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
        ctx.beginPath();
        ctx.arc(cx, cy, 60, 0, Math.PI * 2);
        ctx.arc(cx, cy, 30, 0, Math.PI * 2);
        ctx.stroke();

        // Sweeping beam
        const beamAngle = tick * 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(beamAngle) * 75, cy + Math.sin(beamAngle) * 75);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Detected target blips
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(cx + Math.cos(tick) * 45, cy + Math.sin(tick * 0.7) * 35, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '10px monospace';
        ctx.fillStyle = '#00f0ff';
        ctx.fillText('TARGET_01 // TRACKED [99.8%]', 12, height - 12);

      } else if (currentMode === 'VOICE') {
        // Audio frequency spectrum bars + vocal envelope
        const barCount = 36;
        const barWidth = (width - 24) / barCount;
        for (let i = 0; i < barCount; i++) {
          const h = (Math.sin(tick * 2 + i * 0.4) * 0.5 + 0.5) * 65 + (Math.cos(tick + i * 0.2) * 20);
          const x = 12 + i * barWidth;
          const y = height - 20 - Math.max(4, h);
          ctx.fillStyle = i % 2 === 0 ? '#00f0ff' : '#8b5cf6';
          ctx.fillRect(x, y, barWidth - 2, Math.max(4, h));
        }

        // Voice formant curve
        ctx.beginPath();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        for (let x = 0; x < width; x += 5) {
          const y = height / 2 + Math.sin(x * 0.05 + tick * 3) * 25 * Math.sin(x * 0.015);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.font = '10px monospace';
        ctx.fillStyle = '#c4b5fd';
        ctx.fillText('SPECTROGRAM // 48kHz NEURAL TOKENS', 12, height - 8);

      } else if (currentMode === 'AUTONOMOUS') {
        // Vector trajectory path and lidar nodes
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(20, height - 30);
        ctx.quadraticCurveTo(width * 0.4, 25, width - 30, height / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated waypoint cursor
        const t = (Math.sin(tick) * 0.5 + 0.5);
        const px = 20 * (1-t)*(1-t) + 2 * (1-t) * t * (width * 0.4) + t * t * (width - 30);
        const py = (height - 30) * (1-t)*(1-t) + 2 * (1-t) * t * 25 + t * t * (height / 2);

        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '10px monospace';
        ctx.fillStyle = '#00f0ff';
        ctx.fillText(`WAYPOINT_ALPHA // SERVO 1,000Hz LOCKED`, 12, height - 10);

      } else if (currentMode === 'HUMAN_AI') {
        // Dual entwined harmonic waves
        ctx.lineWidth = 2;

        // Wave 1: Human intent (purple)
        ctx.strokeStyle = '#a855f7';
        ctx.beginPath();
        for (let x = 0; x < width; x += 4) {
          const y = height / 2 + Math.sin(x * 0.03 + tick) * 35;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Wave 2: Machine cognition (cyan)
        ctx.strokeStyle = '#00f0ff';
        ctx.beginPath();
        for (let x = 0; x < width; x += 4) {
          const y = height / 2 + Math.sin(x * 0.03 + tick + 0.8) * 35;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.font = '10px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('DUAL RESONANCE // COUPLING INDEX: 0.994', 12, height - 10);
      }

      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  // ==========================================
  // 6. AI CONSOLE & STATUS PANEL SIMULATOR
  // ==========================================
  function initAIConsole() {
    const consoleOutputs = document.querySelectorAll('#consoleOutput, #terminalResponseText');
    const runBtns = document.querySelectorAll('#runAnalysisBtn, #terminalRunBtn');
    const statusLine = document.getElementById('consoleStatusLine');
    const capMetric = document.getElementById('metricProcCap');
    const latMetric = document.getElementById('metricLatency');

    // Real-time micro-fluctuations in live metrics for realism
    setInterval(() => {
      if (capMetric) {
        const randCap = (98.2 + Math.random() * 0.6).toFixed(1);
        capMetric.innerText = `${randCap}%`;
      }
      if (latMetric) {
        const randLat = (1.0 + Math.random() * 0.2).toFixed(1);
        latMetric.innerText = `${randLat}ms`;
      }
    }, 2400);

    if (!consoleOutputs.length && !runBtns.length) return;

    const messages = [
      'Future scenario identified: Human-AI collaboration is becoming a fundamental layer of digital work and scientific discovery.',
      'Autonomous trajectory model: Multi-agent consensus reduces edge synchronization latency by 76% in distributed clusters.',
      'Embodied perception benchmark: High-torque compliant bipedal locomotion achieves dynamic balance over irregular terrain at 1,000 Hz.',
      'Multimodal reasoning frontier: Cross-attention between acoustic neural tokens and spatial point clouds enables zero-shot robotics manipulation.',
      'Verifiable AI safety theorem: Formal mathematical bounding guarantees deterministic fail-safe recovery in autonomous edge deployments.',
      'Quantum-neural simulation: Tensor network contraction compresses billion-parameter chemical phase spaces with 99.8% preservation.'
    ];

    let msgIndex = 0;

    runBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        playBeep(880, 'sine', 0.08);
        btn.disabled = true;
        const originalLabel = btn.innerText;
        btn.innerText = 'ANALYZING...';
        if (statusLine) statusLine.innerText = 'QUANTUM COGNITION ACTIVE // RUNNING PARALLEL SYNAPSE PASS...';

        consoleOutputs.forEach((out) => {
          out.innerHTML = '<span class="text-cyan">Executing quantum tensor analysis across 4.8B neural parameters...</span>';
        });

        setTimeout(() => {
          const text = messages[msgIndex % messages.length];
          msgIndex++;

          consoleOutputs.forEach((out) => {
            typeWriter(out, text, () => {
              btn.disabled = false;
              btn.innerText = originalLabel;
              if (statusLine) statusLine.innerText = 'AI CORE ONLINE — LIVE ANALYSIS COMPLETE';
              playBeep(1040, 'triangle', 0.05);
            });
          });
        }, 550);
      });
    });

    function typeWriter(element, text, callback) {
      element.innerHTML = '';
      let i = 0;
      function tick() {
        if (i < text.length) {
          element.innerHTML += text.charAt(i);
          i++;
          setTimeout(tick, 16);
        } else {
          element.innerHTML += '<span class="cursor-blink"></span>';
          if (callback) callback();
        }
      }
      tick();
    }
  }

  // ==========================================
  // 7. PROJECT FILTERING & SPECS MODAL
  // ==========================================
  function initProjectFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    if (!filterBtns.length || !projectCards.length) return;

    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        playBeep(520, 'sine', 0.04);
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const filterValue = btn.getAttribute('data-filter');

        projectCards.forEach((card) => {
          const category = card.getAttribute('data-category');
          if (filterValue === 'all' || category === filterValue || (filterValue === 'ai' && (category === 'ai' || category === 'gen-ai'))) {
            card.style.display = 'flex';
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }, 50);
          } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
              card.style.display = 'none';
            }, 300);
          }
        });
      });
    });
  }

  // Generic Modal Engine
  function initModals() {
    const backdrop = document.getElementById('appModalBackdrop');
    const container = document.getElementById('appModalContent');
    const closeBtn = document.getElementById('appModalClose');

    if (!backdrop || !container) return;

    const closeModal = () => {
      backdrop.classList.remove('open');
      document.body.style.overflow = '';
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop.classList.contains('open')) {
        closeModal();
      }
    });

    // View Specs Modal triggers
    document.querySelectorAll('.btn-inspect-specs').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        playBeep(700, 'sine', 0.05);
        const card = btn.closest('.project-card');
        if (!card) return;

        const title = card.querySelector('h3')?.innerText || 'Project Architecture';
        const badge = card.querySelector('.project-badge-overlay')?.innerHTML || '';
        const challenge = card.getAttribute('data-challenge') || 'High computational complexity in edge deployments.';
        const solution = card.getAttribute('data-solution') || 'Custom tensor quantization and low-latency inference model.';
        const results = card.getAttribute('data-results') || '99.4% accuracy with 78% reduction in latency.';
        const status = card.getAttribute('data-status') || 'PHASE 3 TRIAL';

        container.innerHTML = `
          <div style="margin-bottom: 16px;">${badge}</div>
          <h2 style="font-size: 1.8rem; margin-bottom: 12px; color: #fff;">${title}</h2>
          <div class="tech-tag" style="margin-bottom: 24px;">STATUS: ${status}</div>
          
          <div style="display: flex; flex-direction: column; gap: 18px; font-size: 0.95rem; line-height: 1.7; color: var(--text-secondary);">
            <div>
              <strong style="color: var(--cyan); display: block; margin-bottom: 4px; font-family: var(--font-mono);">01 // CHALLENGE</strong>
              <p>${challenge}</p>
            </div>
            <div>
              <strong style="color: var(--cyan); display: block; margin-bottom: 4px; font-family: var(--font-mono);">02 // LAB SOLUTION</strong>
              <p>${solution}</p>
            </div>
            <div>
              <strong style="color: var(--cyan); display: block; margin-bottom: 4px; font-family: var(--font-mono);">03 // MEASURED RESULTS</strong>
              <p>${results}</p>
            </div>
          </div>
          
          <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: flex-end;">
            <button class="btn btn-primary btn-sm" onclick="document.getElementById('appModalBackdrop').classList.remove('open');">Close Technical Specs</button>
          </div>
        `;

        backdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });

    // View Article Modal triggers
    document.querySelectorAll('.btn-read-insight').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        playBeep(700, 'sine', 0.05);
        const card = btn.closest('.insight-card');
        if (!card) return;

        const title = card.querySelector('h3')?.innerText || 'Laboratory Insight';
        const meta = card.querySelector('.insight-meta')?.innerHTML || '';
        const excerpt = card.querySelector('p')?.innerText || '';
        const fullArticle = card.getAttribute('data-full-text') || excerpt;

        container.innerHTML = `
          <div class="insight-meta" style="margin-bottom: 14px;">${meta}</div>
          <h2 style="font-size: 1.8rem; margin-bottom: 20px; color: #fff; line-height: 1.25;">${title}</h2>
          
          <div style="font-size: 1rem; line-height: 1.8; color: var(--text-secondary); display: flex; flex-direction: column; gap: 16px;">
            <p style="font-weight: 500; color: #f1f5f9; font-size: 1.05rem;">${excerpt}</p>
            <p>${fullArticle}</p>
            <div style="padding: 16px; background: rgba(0, 240, 255, 0.05); border-left: 3px solid var(--cyan); border-radius: 4px; margin-top: 12px; font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-primary);">
              "The convergence of cognitive autonomy and physical embodiment represents the highest leverage technological threshold of the 21st century."
            </div>
          </div>
          
          <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: flex-end;">
            <button class="btn btn-primary btn-sm" onclick="document.getElementById('appModalBackdrop').classList.remove('open');">Close Article</button>
          </div>
        `;

        backdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });
  }

  // ==========================================
  // 8. ROBOTICS HUD TELEMETRY CONTROLS
  // ==========================================
  function initRoboticsHUD() {
    const modeBtns = document.querySelectorAll('.robot-mode-btn');
    const hudValVision = document.getElementById('hudValVision');
    const hudValMotion = document.getElementById('hudValMotion');
    const hudValCore = document.getElementById('hudValCore');
    const hudValAutonomy = document.getElementById('hudValAutonomy');
    const feedImg = document.getElementById('roboticsFeedImg');
    const camModeLabel = document.getElementById('camModeLabel');

    const telemetryModes = {
      optical: {
        vision: 'SPECTRAL RGB 8K',
        motion: '98.4%',
        core: 'ONLINE (0.8ms)',
        autonomy: 'LEVEL 5 ACTIVE',
        label: 'MODE: 4K HIGH-SPEED OPTICAL RGB (60 FPS)',
        src: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
        filter: 'contrast(1.1)'
      },
      depth: {
        vision: 'STEREO DEPTH 3D',
        motion: '99.3%',
        core: 'TOF CALIBRATED',
        autonomy: 'OCCLUSION AVOID',
        label: 'MODE: STEREO DEPTH TOF HEATMAP [0.02 - 12.0m]',
        src: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=1200&q=80',
        filter: 'hue-rotate(180deg) saturate(1.8) contrast(1.3)'
      },
      lidar: {
        vision: '3D CLOUD 250M PTS',
        motion: '99.1%',
        core: 'MAPPING (0.4ms)',
        autonomy: 'OBSTACLE AVOID',
        label: 'MODE: 3D LIDAR POINT CLOUD (250,000 PTS/SEC)',
        src: 'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?auto=format&fit=crop&w=1200&q=80',
        filter: 'hue-rotate(90deg) invert(0.8) contrast(1.4)'
      },
      thermal: {
        vision: 'LONG-WAVE INFRARED',
        motion: '97.8%',
        core: 'TEMP STABLE 38°C',
        autonomy: 'TARGET TRACKING',
        label: 'MODE: FLIR LONG-WAVE INFRARED (38.2°C PEAK)',
        src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        filter: 'hue-rotate(270deg) contrast(1.6)'
      },
      kinematics: {
        vision: 'TORQUE VECTORING',
        motion: '100% CALIBRATED',
        core: 'NEURAL GAIT SYNC',
        autonomy: 'TERRAIN ADAPTIVE',
        label: 'MODE: 1,000Hz HIGH-TORQUE KINEMATICS MATRIX',
        src: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
        filter: 'contrast(1.2) brightness(1.1)'
      }
    };

    window.switchRoboticsCam = function(modeKey) {
      playBeep(800, 'sine', 0.05);

      const targetKey = modeKey === 'rgb' ? 'optical' : modeKey;
      const data = telemetryModes[targetKey] || telemetryModes.optical;

      // Update buttons active state
      document.querySelectorAll('#btnCamRgb, #btnCamDepth, #btnCamLidar, #btnCamThermal, .robot-mode-btn').forEach((btn) => {
        btn.classList.remove('active');
        const m = btn.getAttribute('data-mode') || (btn.id ? btn.id.replace('btnCam', '').toLowerCase() : '');
        if (m === modeKey || (modeKey === 'rgb' && m === 'optical')) {
          btn.classList.add('active');
        }
      });

      if (feedImg) {
        feedImg.style.filter = data.filter;
        feedImg.src = data.src;
      }
      if (camModeLabel) camModeLabel.innerText = data.label;
      if (hudValVision) hudValVision.innerText = data.vision;
      if (hudValMotion) hudValMotion.innerText = data.motion;
      if (hudValCore) hudValCore.innerText = data.core;
      if (hudValAutonomy) hudValAutonomy.innerText = data.autonomy;
    };

    modeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        window.switchRoboticsCam(mode);
      });
    });
  }

  // ==========================================
  // 9. SCROLL REVEAL OBSERVER
  // ==========================================
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal-on-scroll');
    if (!reveals.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach((el) => observer.observe(el));
  }

  // ==========================================
  // 10. CONTACT FORM VALIDATION & TRANSMISSION
  // ==========================================
  function initContactForm() {
    const forms = document.querySelectorAll('#contactForm, #labTransmissionForm');
    if (!forms.length) return;

    forms.forEach((form) => {
      const statusBox = form.parentElement.querySelector('#formStatusBox, #transmissionFeedback');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        playBeep(650, 'triangle', 0.06);

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>ENCRYPTING & SENDING...</span>';

        setTimeout(() => {
          playBeep(1200, 'sine', 0.1);
          submitBtn.innerHTML = '<span>TRANSMISSION CONFIRMED ✓</span>';
          submitBtn.style.background = 'var(--emerald)';

          if (statusBox) {
            statusBox.style.display = 'block';
            statusBox.innerHTML = `
              <div style="padding: 16px; background: rgba(16, 185, 129, 0.1); border: 1px solid var(--emerald); border-radius: 6px; color: #6ee7b7; font-family: var(--font-mono); font-size: 0.9rem;">
                <strong>DISPATCH RECEIVED:</strong> Your transmission has been queued into NEXA AI LAB quantum intake. A research coordinator will reach out within 24 hours.
              </div>
            `;
          }

          form.reset();

          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            submitBtn.style.background = '';
          }, 5000);
        }, 1200);
      });
    });
  }

  // ==========================================
  // 11. AUDIO TOGGLE (HEADER ACCENT)
  // ==========================================
  function initAudioToggle() {
    const toggleBtn = document.getElementById('audioToggleBtn');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
      state.audioEnabled = !state.audioEnabled;
      toggleBtn.classList.toggle('active', state.audioEnabled);
      toggleBtn.setAttribute('aria-pressed', state.audioEnabled);
      toggleBtn.innerText = state.audioEnabled ? 'SFX: ON' : 'SFX: OFF';
      if (state.audioEnabled) {
        playBeep(880, 'sine', 0.08);
      }
    });
  }

  // ==========================================
  // 12. 3D CARD TILT & HOVER DEPTH
  // ==========================================
  function initCard3DTilt() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const cards = document.querySelectorAll('.capability-card, .future-lab-item, .project-card, .lab-panel');
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -4.5;
        const rotateY = ((x - centerX) / centerX) * 4.5;

        card.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-3px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ==========================================
  // 13. HORIZONTAL RESEARCH PIPELINE ANIMATOR
  // ==========================================
  function initHorizontalPipeline() {
    const pipeline = document.querySelector('.research-horizontal-pipeline');
    if (!pipeline) return;

    const steps = pipeline.querySelectorAll('.pipeline-stage-node');
    if (!steps.length) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        steps.forEach((step, idx) => {
          setTimeout(() => {
            step.classList.add('active');
            playBeep(520 + idx * 80, 'sine', 0.03);
          }, idx * 280);
        });
        observer.unobserve(pipeline);
      }
    }, { threshold: 0.25 });

    observer.observe(pipeline);
  }

  // ==========================================
  // INITIALIZE ALL ON DOM READY
  // ==========================================
  document.addEventListener('DOMContentLoaded', () => {
    initCustomCursor();
    initHeader();
    initHeroCanvas();
    initHeroNeuralSphere();
    initCountUp();
    initFutureLab();
    initAIConsole();
    initProjectFilters();
    initModals();
    initRoboticsHUD();
    initScrollReveal();
    initContactForm();
    initAudioToggle();
    initCard3DTilt();
    initHorizontalPipeline();
  });
})();
