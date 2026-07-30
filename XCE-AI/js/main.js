(function () {
  const body = document.body;
  const header = document.querySelector('.site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelectorAll('.nav-link, .footer-links a[href^="#"], .header-actions a[href^="#"], .product-tile[href^="#"], .btn[href^="#"], .market-card--link[href^="#"]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('img').forEach((img) => {
    img.addEventListener('error', () => {
      img.classList.add('is-missing');
      img.setAttribute('aria-hidden', 'true');
    }, { once: true });
  });

  function closeMobileMenu() {
    body.classList.remove('menu-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
  }

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const isOpen = body.classList.toggle('menu-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  function getHeaderOffset() {
    return (header ? header.offsetHeight : 72) + 16;
  }

  function scrollToHash(hash, behavior) {
    const id = hash.replace(/^#/, '');
    const target = document.getElementById(id);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
    window.scrollTo({ top, behavior: behavior || (reduceMotion ? 'auto' : 'smooth') });
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      event.preventDefault();
      closeMobileMenu();
      scrollToHash(href);
      history.pushState(null, '', href);
    });
  });

  const spySections = Array.from(document.querySelectorAll('[data-section]'));
  const navBySection = {};
  document.querySelectorAll('.nav-link[data-nav]').forEach((link) => {
    navBySection[link.dataset.nav] = link;
  });

  const SECTION_ORDER = ['about', 'creator-os', 'why', 'products', 'xce-ai', 'ai-native-generator', 'markets', 'contact'];

  function setActiveSection(sectionId) {
    let navId = sectionId;
    if (!navBySection[navId]) {
      const idx = SECTION_ORDER.indexOf(sectionId);
      for (let i = idx; i >= 0; i -= 1) {
        if (navBySection[SECTION_ORDER[i]]) {
          navId = SECTION_ORDER[i];
          break;
        }
      }
    }

    document.querySelectorAll('.nav-link').forEach((link) => {
      const active = link.dataset.nav === navId;
      link.classList.toggle('is-active', active);
      if (link.closest('.main-nav')) {
        link.setAttribute('aria-current', active ? 'true' : 'false');
      }
    });
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  let themeMixFrame = 0;

  function updateThemeMix() {
    themeMixFrame = 0;
    const heroActEl = document.getElementById('about');
    const heroRunwayEl = document.getElementById('hero-runway');
    const vh = window.innerHeight;
    let mix = 0;

    if (heroActEl) {
      const runwayHeight = heroRunwayEl ? heroRunwayEl.offsetHeight : vh * 1.2;
      const heroEnd = heroActEl.offsetTop + runwayHeight;
      const lightStart = heroEnd - vh * 0.5;
      if (reduceMotion) {
        mix = window.scrollY > lightStart ? 1 : 0;
      } else {
        mix = clamp((window.scrollY - lightStart) / (vh * 0.45), 0, 1);
      }
    }

    document.documentElement.style.setProperty('--theme-mix', mix.toFixed(4));
    body.classList.toggle('theme-light', mix >= 0.5);
    body.classList.toggle('theme-dark', mix < 0.5);
    body.classList.toggle('is-at-top', window.scrollY < 24);
  }

  function scheduleThemeMix() {
    if (themeMixFrame) return;
    themeMixFrame = window.requestAnimationFrame(updateThemeMix);
  }

  window.addEventListener('scroll', scheduleThemeMix, { passive: true });
  window.addEventListener('resize', scheduleThemeMix, { passive: true });
  updateThemeMix();

  const heroVideo = document.querySelector('.hero-video');
  const heroFixed = document.getElementById('hero-fixed');
  const heroLaptop = document.getElementById('hero-laptop');
  const heroLaptopWrap = document.getElementById('hero-laptop-wrap');
  const heroAct = document.getElementById('about');
  const heroRunway = document.getElementById('hero-runway');
  const lightPanel = document.querySelector('.hero-details');

  const HERO_VIDEO_DESKTOP = 'video/XGE_AI720p.mp4';
  const HERO_VIDEO_MOBILE = 'video/XGE_AI_mobile.mp4';
  const isMobileViewport = () => window.matchMedia('(max-width: 768px)').matches;

  function configureVideoSource(videoEl, desktopSrc, mobileSrc, options) {
    if (!videoEl) return;
    const opts = options || {};
    const nextSrc = isMobileViewport() ? mobileSrc : desktopSrc;
    const current = videoEl.dataset.currentSrc || '';
    if (current === nextSrc) return;
    videoEl.dataset.currentSrc = nextSrc;
    if (opts.preloadMobileAuto) {
      videoEl.preload = isMobileViewport() ? 'auto' : 'metadata';
    } else {
      videoEl.preload = opts.preload || 'metadata';
    }
    const source = videoEl.querySelector('source');
    if (source) source.src = nextSrc;
    else videoEl.src = nextSrc;
    videoEl.load();
  }

  function configureHeroVideoSource() {
    if (!heroVideo) return;
    const desktop = heroVideo.dataset.srcDesktop || HERO_VIDEO_DESKTOP;
    const mobile = heroVideo.dataset.srcMobile || HERO_VIDEO_MOBILE;
    configureVideoSource(heroVideo, desktop, mobile, { preloadMobileAuto: true });
  }

  function fallbackHeroVideoSource() {
    if (!heroVideo) return;
    const desktop = heroVideo.dataset.srcDesktop || HERO_VIDEO_DESKTOP;
    heroVideo.dataset.currentSrc = desktop;
    heroVideo.preload = 'metadata';
    const source = heroVideo.querySelector('source');
    if (source) source.src = desktop;
    else heroVideo.src = desktop;
    heroVideo.load();
    playHeroVideo();
  }

  function playHeroVideo() {
    if (!heroVideo || reduceMotion) return;
    heroVideo.play().catch(() => {});
  }

  function initHeroVideoPlayback() {
    if (!heroVideo || reduceMotion) return;

    configureHeroVideoSource();

    let touchRetried = false;
    const retryPlay = () => playHeroVideo();

    heroVideo.addEventListener('canplay', retryPlay);
    heroVideo.addEventListener('loadeddata', retryPlay);
    heroVideo.addEventListener('error', () => {
      if (heroVideo.dataset.currentSrc !== HERO_VIDEO_DESKTOP) fallbackHeroVideoSource();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') retryPlay();
    });

    document.addEventListener('pointerdown', () => {
      if (touchRetried) return;
      touchRetried = true;
      retryPlay();
    }, { once: true, passive: true });

    if (heroFixed && 'IntersectionObserver' in window) {
      const heroVideoObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) retryPlay();
          else heroVideo.pause();
        });
      }, { threshold: 0.15 });
      heroVideoObserver.observe(heroFixed);
    }

    window.addEventListener('resize', () => {
      configureHeroVideoSource();
      retryPlay();
    }, { passive: true });

    retryPlay();
  }

  function initDemoVideo() {
    const demoVideo = document.querySelector('.demo-video');
    if (!demoVideo) return;
    const desktop = demoVideo.dataset.srcDesktop;
    const mobile = demoVideo.dataset.srcMobile;
    if (!desktop || !mobile) return;

    const applySource = () => configureVideoSource(demoVideo, desktop, mobile);
    applySource();
    window.addEventListener('resize', applySource, { passive: true });
  }

  function initHeroScroll() {
    if (!heroFixed || !heroAct) return;

    if (heroLaptop) {
      if (reduceMotion) {
        heroLaptop.classList.add('is-intro-done');
      } else {
        requestAnimationFrame(() => {
          heroLaptop.classList.add('is-intro-done');
        });
      }
    }

    initHeroVideoPlayback();

    let heroFrame = 0;

    function updateHeroScroll() {
      heroFrame = 0;
      const vh = window.innerHeight;
      const actTop = heroAct.offsetTop;
      const scrollInAct = window.scrollY - actTop;
      const runwayHeight = heroRunway ? heroRunway.offsetHeight : vh * 1.2;
      const heroProgress = clamp(scrollInAct / runwayHeight, 0, 1);
      const panelTop = lightPanel ? lightPanel.getBoundingClientRect().top : Infinity;
      const covered = lightPanel ? panelTop <= vh * 0.05 : false;
      const pinned = !covered && scrollInAct > 0;

      if (heroLaptop) {
        heroLaptop.style.setProperty('--scroll-scale', (1 + heroProgress * 0.12).toFixed(4));
      }

      if (heroLaptopWrap && !reduceMotion) {
        heroLaptopWrap.classList.toggle('is-idle', scrollInAct <= 0 && !covered);
      }

      body.classList.toggle('is-scrolling', scrollInAct > 0);

      heroFixed.classList.toggle('is-pinned', pinned);
      heroFixed.classList.toggle('is-covered', covered);

      document.documentElement.style.setProperty('--hero-progress', heroProgress.toFixed(4));

      if (heroVideo) {
        if (covered || reduceMotion) {
          heroVideo.pause();
        } else if (!covered) {
          playHeroVideo();
        }
      }
    }

    function scheduleHeroScroll() {
      if (heroFrame) return;
      heroFrame = window.requestAnimationFrame(updateHeroScroll);
    }

    window.addEventListener('scroll', scheduleHeroScroll, { passive: true });
    window.addEventListener('resize', scheduleHeroScroll, { passive: true });
    updateHeroScroll();
  }

  initHeroScroll();
  initDemoVideo();

  if (spySections.length) {
    const spyObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length) {
        setActiveSection(visible[0].target.dataset.section);
      }
    }, {
      rootMargin: '-20% 0px -55% 0px',
      threshold: [0, 0.1, 0.25, 0.5],
    });

    spySections.forEach((section) => spyObserver.observe(section));
    setActiveSection(spySections[0].dataset.section);
  }

  if (window.location.hash) {
    window.requestAnimationFrame(() => {
      scrollToHash(window.location.hash, 'auto');
      scheduleThemeMix();
    });
  }

  const animated = document.querySelectorAll('[data-animate]');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  animated.forEach((el) => revealObserver.observe(el));

  document.querySelectorAll('[data-tabs]').forEach((tabs) => {
    const buttons = tabs.querySelectorAll('[data-tab]');
    const panels = tabs.querySelectorAll('[data-panel]');
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const target = button.dataset.tab;
        buttons.forEach((item) => item.classList.toggle('is-active', item === button));
        panels.forEach((panel) => panel.classList.toggle('is-active', panel.dataset.panel === target));
      });
    });
  });

  const counters = document.querySelectorAll('[data-count]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.count || 0);
      const duration = 950;
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased).toLocaleString('en-US');
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach((counter) => counterObserver.observe(counter));

  // --- i18n translation system ---
  const i18n = {
    en: {
      'site.title': 'Arkx \u2014 Imagination, Made Real',
      'site.description': 'Arkx by Arks Creative is building a Creator OS for the AI-native generation of playable, interactive digital works.',
      'site.title.pd': 'Arkx Products \u2014 XCE AI &amp; AI Native Generator',
      'site.description.pd': 'Explore Xrafts Contents Editor / XCE AI and AI Native Generator, Arkx products for prompt-to-playable game projects and interactive AI short dramas.',
      'brand.name': 'Arkx',
      'brand.tagline': 'Arks Creative',
      'nav.about': 'About',
      'nav.products': 'Products',
      'nav.xce': 'XCE AI',
      'nav.ang': 'AI Native Generator',
      'nav.creatorOS': 'Creator OS',
      'nav.markets': 'Markets',
      'nav.vision': 'Vision',
      'nav.contact': 'Contact',
      'nav.explore': 'Explore XCE AI',
      'hero.eyebrow': 'AI-Native Creation Technology \u00B7 Founded 2025',
      'hero.title': 'Imagination, Made Real',
      'hero.scrollHint': 'Scroll to explore',
      'hero.lede': 'Arkx is building a Creator OS for individual creators, small teams, university AI teaching and enterprise production \u2014 a lighter, faster way to turn stories, characters, scenes, gameplay and emotions into playable, interactive digital works.',
      'hero.cta.primary': 'Enter the Creator OS',
      'hero.cta.secondary': 'See the thesis',
      'metric.1.value': '2025',
      'metric.1.label': 'Founded for the AI creation era',
      'metric.2.label': '4\u00D7 Input modes: text, image, voice, context',
      'metric.3.label': '1 Path from prompt to playable project',
      'floating.prompt.label': 'Prompt',
      'floating.prompt.text': 'Build a playable mystery drama in 3 acts.',
      'floating.output.label': 'Output',
      'floating.output.text': 'Scenes \u00B7 Assets \u00B7 Logic \u00B7 Tests \u00B7 Publish',
      'timeline.label': 'New Entertainment Economy',
      'creatorOS.kicker': 'Creator OS',
      'creatorOS.title': 'Past creators published content. Future creators build experiences.',
      'creatorOS.text': 'Game and drama creation faces three long-standing barriers: high art asset thresholds, high logic engineering thresholds, and high testing and tuning thresholds. AI changes the route \u2014 generation, composition, interaction and publishing can become lighter, faster and more open.',
      'creatorOS.card1.title': 'Ideas become systems',
      'creatorOS.card1.text': 'A story no longer has to stop at text. A character no longer has to stay inside an image. Emotion, relationship and inspiration can become interactive works.',
      'creatorOS.card2.title': 'Creation becomes iterative',
      'creatorOS.card2.text': 'Creators can prototype fast, publish into real ecosystems, read feedback, then continue growing the work instead of starting over.',
      'creatorOS.card3.title': 'Tools follow imagination',
      'creatorOS.card3.text': 'Arkx does not decide what creators should make. It helps them cross the first gap from idea to playable, editable, publishable project.',
      'products.kicker': 'Products',
      'products.title': 'Two entrances into AI-native creation.',
      'products.text': 'XCE AI gives creators a lightweight interactive creation workspace. AI Native Generator extends it into interactive AI short dramas and playable narrative content.',
      'products.xce.label': 'Xrafts Contents Editor',
      'products.xce.title': 'XCE AI',
      'products.xce.text': 'Prompt to playable game project \u2014 assets, scenes, logic, testing and publishing in one editable production chain.',
      'products.ang.label': 'Interactive AI Drama',
      'products.ang.title': 'AI Native Generator',
      'products.ang.text': 'Generate characters, scenes, video, voice, choices, relationship states and multi-ending interactive stories.',
      'demo.kicker': 'Product Demo',
      'demo.title': 'See XCE AI in action',
      'demo.text': 'From map to playable scene \u2014 watch the creation flow.',
      'showcase.kicker': 'Inside the workspace',
      'showcase.title': 'Editor interface highlights',
      'showcase.s4.title': 'Scene viewport',
      'showcase.s4.text': 'Compose large-scale environments in the live editor \u2014 navigate scenes, place objects and iterate layouts in real time.',
      'showcase.s5.title': 'Map &amp; placement',
      'showcase.s5.text': 'Top-down editing for terrain, buildings and scene layout with precise placement tools and instant visual feedback.',
      'showcase.s6.title': 'Stylized worlds',
      'showcase.s6.text': 'Build colorful, character-driven scenes across 2D and 3D styles from a unified workspace.',
      'showcase.s7.title': 'Interactive sequences',
      'showcase.s7.text': 'Author action flows, combat beats and narrative triggers inside playable scenes.',
      'showcase.s8.title': 'Lighting &amp; atmosphere',
      'showcase.s8.text': 'Tune mood, lighting and environment details for immersive nighttime worlds.',
      'why.kicker': 'Why Arkx',
      'why.title': 'Lightweight, open, composable.',
      'why.text': 'AI-native creation tools should not build higher walls. They should make more capabilities usable by more creators.',
      'why.tab.speed': 'Speed',
      'why.tab.access': 'Access',
      'why.tab.context': 'Context',
      'why.tab.publish': 'Publish',
      'why.speed.title': 'Start fast. Build fast. Validate fast.',
      'why.speed.text': 'Creators struggle to turn ideas into demos that can keep growing. XCE AI shortens paths from idea to vertical slice, shareable build and playable project \u2014 without restarting from scattered files.',
      'why.access.title': 'Lower art and production thresholds.',
      'why.access.text': 'Icons, UI, scenes, characters, effects, music and voice no longer require specialist teams. AI generates and organizes assets while the editor keeps everything editable.',
      'why.context.title': 'AI understands the project, not just the prompt.',
      'why.context.text': 'Users often cannot write stable prompts or describe gameplay clearly. Natural language, voice and automatic project context reduce repeated explanation and scattered tool switching.',
      'why.publish.title': 'One chain, not scattered tools.',
      'why.publish.text': 'Scripts, storyboards, images, video, voice and editing often live in different tools. XCE AI unifies creative input, generation, engineering, testing and publishing in one production chain.',
      'global.kicker': 'Global View',
      'global.title': 'Born in China\u2019s innovation ecosystem, built for global creators.',
      'global.text': 'Arkx connects China\u2019s high-density content innovation and mobile internet experience with a worldwide market of individual creators, small teams, communities and digital natives looking for freer creation workflows.',
      'vision.kicker': 'Vision',
      'vision.title': 'Let imagination have its own way to run.',
      'vision.text': 'Arkx believes AI-era creation should go beyond content generation and move toward freer organization, experience and growth. The goal is not to force creators to adapt to tools, but to make tools keep up with imagination.',
      'vision.cta': 'Discover the products',
      'vision.quote': '\u201CNot Prompt to Image. Not Prompt to Video. Prompt to Playable Game Project.\u201D',
      'vision.quoteAuthor': 'Arkx product thesis',
      'contact.kicker': 'Contact',
      'contact.title': 'Build the next interactive work with Arkx.',
      'contact.text': 'Reach out for partnerships, early access, university curriculum collaboration, AI practice lab co-building, education licensing or enterprise interactive content projects.',
      'contact.cta': 'Explore education &amp; partnerships',
      'footer.tagline': 'Arks Creative \u00B7 所象 \u2014 Imagination, Made Real.',
      'footer.about': 'About',
      'footer.products': 'Products',
      'footer.contact': 'Contact',
      'phero.eyebrow': 'Arkx Product System',
      'phero.title': 'Prompt to playable, editable, publishable projects.',
      'phero.lede': 'XCE AI is an AI-native creation system that deeply embeds AI into the core production chain of games and interactive short dramas \u2014 serving individual creators, small teams, university AI teaching and enterprise content production with a zero-threshold path from prompt to playable project.',
      'phero.cta.primary': 'View product core',
      'phero.cta.secondary': 'Business outlook',
      'console.title': 'XCE AI / Build Console',
      'console.line1': '\u201CCreate an interactive cyber-school mystery with 3 endings.\u201D',
      'console.line2': 'assets \u2192 scenes \u2192 dialogue \u2192 events \u2192 tests \u2192 publish',
      'console.line3': 'playable project generated \u00B7 editable in workspace',
      'xce.kicker': 'Xrafts Contents Editor',
      'xce.title': 'XCE AI \u2014 the AI-native workspace for playable content.',
      'xce.text': 'It is not a traditional game editor, not a single-format generation tool, and not another traffic-heavy closed platform. It is a playable content generation platform for individual creators, small teams, university AI teaching and enterprise production \u2014 turning stories, characters, scenes, gameplay and expression into editable, runnable, testable and publishable works.',
      'xce.panel': 'Public baseline',
      'xce.panelText': 'C++ editor \u00B7 Steam \u00B7 Windows / Linux / Android \u00B7 no-code \u00B7 visual events \u00B7 TypeScript API \u00B7 Workshop',
      'xce.subtitle': 'AI is not bolted on. It is inside the creation chain.',
      'xce.subtext': 'XCE AI uses AI to generate and organize 2D/3D assets, characters, actions, CG animation, effects, music, voice, game logic, automated tests, tuning suggestions and feedback analysis.',
      'xce.list1': 'Generate editable assets into the project asset system.',
      'xce.list2': 'Transform natural language into XCE AI DSL, events and components.',
      'xce.list3': 'Use AI player agents to test flows, interactions and balance.',
      'xce.list4': 'Ship playable works instead of disconnected generated files.',
      'xce.list5': 'Product operations AI and feedback analytics \u2014 in active development.',
      'core.kicker': 'Product Core',
      'core.title': 'One connected loop: express, generate, organize, test, modify, publish.',
      'pipeline.1.title': 'Creative Input',
      'pipeline.1.text': 'Text, reference images, voice and project context are transformed into clear production tasks.',
      'pipeline.2.title': 'Asset Generation',
      'pipeline.2.text': '2D/3D assets, UI, characters, scenes, actions, effects, music, sound and voice enter the project asset system.',
      'pipeline.3.title': 'Logic Engineering',
      'pipeline.3.text': 'AI generates XCE AI DSL, visual events, components, dialogue nodes, conditions, variables and endings.',
      'pipeline.4.title': 'AI Testing',
      'pipeline.4.text': 'AI player agents check branches, reachability, interaction flows and numeric balance, then return practical fixes.',
      'pipeline.5.title': 'Publish &amp; Iterate',
      'pipeline.5.text': 'Playable projects can be exported, tested with users and improved through feedback-driven iteration.',
      'ang.kicker': 'AI Native Generator',
      'ang.title': 'From watching stories to participating in stories.',
      'ang.text': 'Interactive AI short drama is the natural extension of XCE AI\u2019s game creation capability. Scripts, characters, scenes, video, voice and music become content foundations; dialogue editing, event systems, state variables and publishing become the interaction carrier.',
      'ang.card1.title': 'Interactive formats',
      'ang.card1.text': 'Story choices, clue exploration, relationship states, QTE moments, puzzles, resources, simple battles and AI character dialogue can all affect the following story state.',
      'ang.card2.title': 'Story Generation',
      'ang.card2.text': 'World settings, characters, chapters, conflict, dialogue and endings enter dialogue editing and narrative projects.',
      'ang.card3.title': 'Character &amp; Scene',
      'ang.card3.text': 'Characters, outfits, expressions, props, scenes and style references become reusable assets across shots and branches.',
      'ang.card4.title': 'Storyboard &amp; Audio',
      'ang.card4.text': 'Keyframes, clips, voice, music and sound effects are generated and bound to scenes and story nodes.',
      'ang.card5.title': 'Logic &amp; Multi-Endings',
      'ang.card5.text': 'Choices, conditions, variables, affection levels, items, clues and endings are configured through dialogue, events and components.',
      'diff.kicker': 'Difference',
      'diff.title': 'Not more isolated generation buttons. A real production chain.',
      'diff.col1': 'Tool type',
      'diff.col2': 'Typical output',
      'diff.col3': 'Common problem',
      'diff.col4': 'XCE AI difference',
      'diff.row1.1': 'AI Image',
      'diff.row1.2': 'Images',
      'diff.row1.3': 'Cannot become a game project directly',
      'diff.row1.4': 'Generated assets enter the asset and logic system',
      'diff.row2.1': 'AI Video',
      'diff.row2.2': 'Videos',
      'diff.row2.3': 'Watchable but not playable',
      'diff.row2.4': 'Clips bind with CG, cutscenes and interactive drama logic',
      'diff.row3.1': 'AI 3D',
      'diff.row3.2': 'Models',
      'diff.row3.3': 'Need cleanup, reduction, rigging and import',
      'diff.row3.4': 'Engineering processing and Asset Cards organize usage',
      'diff.row4.1': 'AI Code',
      'diff.row4.2': 'Code',
      'diff.row4.3': 'Hard to connect with game projects',
      'diff.row4.4': 'Generates XCE AI DSL, events and components',
      'diff.row5.1': 'Game Engines',
      'diff.row5.2': 'Powerful projects',
      'diff.row5.3': 'High learning cost',
      'diff.row5.4': 'No-code + AI + visual creation',
      'diff.row6.1': 'No-Code Game Tools',
      'diff.row6.2': 'Easy to start',
      'diff.row6.3': 'Assets and logic still manual',
      'diff.row6.4': 'AI generates assets, logic, tests and optimization',
      'markets.kicker': 'Commercialization',
      'markets.title': 'From creator subscriptions to university AI education, UGC markets and enterprise production.',
      'markets.text': 'XCE AI lowers creation thresholds with AI, carries playable works in editable projects, scales supply through UGC and sustains commercialization through publishing and market mechanisms.',
      'markets.card1.title': 'Creator Subscription',
      'markets.card1.text': 'Free/Lite, Pro and Studio tiers \u2014 subscriptions, AI cloud rendering credits, advanced templates, asset packs and publishing tools for individuals, students and indie creators.',
      'markets.card2.title': 'UGC Template &amp; Asset Market',
      'markets.card2.text': 'Game templates, character models, UI kits, effects, scripts, AI prompts, workflows and tutorial projects \u2014 with platform revenue share.',
      'markets.card3.title': 'University AI Education',
      'markets.card3.text': 'An AI playable content creation and practice platform for higher education \u2014 from model calls and agents to interactive apps and publishing.',
      'markets.card4.title': 'Enterprise Interactive Content',
      'markets.card4.text': 'Brand mini-games, interactive dramas, event experiences, launch demos, training simulations, sales drills and IP collaboration \u2014 weeks instead of months.',
      'markets.card5.title': 'Small Studio Productivity',
      'markets.card5.text': 'Vertical slices, pitch demos, Steam page materials, concept assets, whitebox levels, balance tests and entertainment MVPs \u2014 filling team gaps, not replacing teams.',
      'audiences.kicker': 'Who It\u2019s For',
      'audiences.title': 'Built for creators, teams, universities and enterprises.',
      'audiences.text': 'XCE AI is a playable content generation platform for individual creators, UGC makers, small teams, university AI programs and enterprise marketing teams.',
      'audiences.card1.title': 'Individual Game Creators',
      'audiences.card1.text': 'No full team, no art or 3D skills, no coding \u2014 use AI to generate assets, logic, levels and test results fast.',
      'audiences.card2.title': 'UGC Content Creators',
      'audiences.card2.text': 'Want shareable, interactive content without complex tools \u2014 go from text or voice ideas to playable works and interactive dramas.',
      'audiences.card3.title': 'Small Indie Teams',
      'audiences.card3.text': 'Few people, slow prototype validation \u2014 shorten demo, vertical slice and promotional asset production cycles.',
      'audiences.card4.title': 'University AI Programs',
      'audiences.card4.text': 'Teaching often stops at theory or single-model labs \u2014 XCE AI connects model calls, agents, knowledge bases, interaction design and publishing in one practice environment.',
      'audiences.card5.title': 'Enterprise Brand Teams',
      'audiences.card5.text': 'Need interactive content but traditional development is costly \u2014 quickly generate brand mini-games, event experiences and launch demos.',
      'baseline.kicker': 'XCE Foundation',
      'baseline.title': 'Built on a proven no-code editor, ready for AI.',
      'baseline.card1.title': 'No-Code Creation',
      'baseline.card1.text': 'AI output lands in a visual, editable, runnable project \u2014 not a pile of uncontrollable files.',
      'baseline.card2.title': 'Asset Library &amp; Templates',
      'baseline.card2.text': 'AI generation + built-in assets + parametric composition \u2014 more stable than pure AIGC, easier to ship playable content.',
      'baseline.card3.title': 'Visual Engineering',
      'baseline.card3.text': 'WYSIWYG editing \u2014 AI doesn\u2019t just advise, it operates inside the project while you keep full control.',
      'baseline.card4.title': 'Publish &amp; UGC',
      'baseline.card4.text': 'One-click publishing on Steam, Windows, Linux/SteamOS and Android \u2014 the foundation for templates, assets and AI creation ecosystems.',
      'ang.scenarios.kicker': 'Use Cases',
      'ang.scenarios.title': 'Where interactive AI drama fits.',
      'ang.scenario1': 'Interactive comics and AVG-style video games',
      'ang.scenario2': 'Brand IP interactive spin-offs',
      'ang.scenario3': 'Cultural tourism interactive narratives',
      'ang.scenario4': 'University AI practice teaching projects',
      'ang.scenario5': 'Enterprise training and sales simulations',
      'ang.scenario6': 'Exhibition and offline interactive content',
      'problems.kicker': 'User Research',
      'problems.title': 'Real feedback. Connected solutions.',
      'problems.text': 'Market research from game and AI drama creators reveals recurring pain points \u2014 XCE AI connects expression, generation, organization, testing, modification and publishing into one chain.',
      'problems.col1': 'User feedback',
      'problems.col2': 'XCE AI capability',
      'problems.col3': 'Product advantage',
      'problems.row1.1': 'Hard to write prompts or describe needs',
      'problems.row1.2': 'Natural language, voice and project context',
      'problems.row1.3': 'Describe intent directly; AI breaks it into assets, scenes, logic and tests',
      'problems.row2.1': 'AI code doesn\u2019t understand the full game',
      'problems.row2.2': 'Main Agent, RAG, Tool Calling, editor API',
      'problems.row2.3': 'Generates project content, not isolated code snippets',
      'problems.row3.1': 'Scattered tools, inconsistent style',
      'problems.row3.2': 'Unified orchestration + asset library',
      'problems.row3.3': 'One production chain from creative input to testing',
      'problems.row4.1': 'Repeated generation wastes cost',
      'problems.row4.2': 'Local models, built-in assets, editable projects',
      'problems.row4.3': 'Reuse assets and edit results instead of starting over',
      'problems.row5.1': 'Demos are hard to grow into full works',
      'problems.row5.2': 'Visual engineering, logic generation, auto-testing',
      'problems.row5.3': 'AI output enters a runnable project ready for iteration',
      'problems.row6.1': 'AI drama is watch-only, not interactive',
      'problems.row6.2': 'Dialogue, events, variables and branches',
      'problems.row6.3': 'Video binds with choice nodes, story states and multi-endings',
      'arch.kicker': 'Architecture',
      'arch.title': 'Local-first, cloud-enhanced, models replaceable.',
      'arch.text': 'A seven-layer stack connects user intent to published playable projects.',
      'arch.layer1.title': 'User Input',
      'arch.layer1.text': 'Text, voice, image/video references, project context and operation logs.',
      'arch.layer2.title': 'AI Orchestration',
      'arch.layer2.text': 'Main Agent, RAG, Tool Calling, model routing and safety controls.',
      'arch.layer3.title': 'Generation Models',
      'arch.layer3.text': '2D, 3D, video/animation, TTS, STT, music and sound effects.',
      'arch.layer4.title': 'Logic &amp; Content',
      'arch.layer4.text': 'XCE DSL, event components, dialogue graphs, branches, variables and balance systems.',
      'arch.layer5.title': 'Editor &amp; Assets',
      'arch.layer5.text': 'Asset library, scenes, scripts, components, Asset Cards and version management.',
      'arch.layer6.title': 'Automated Testing',
      'arch.layer6.text': 'AI players, interaction tests, branch tests, balance checks and optimization suggestions.',
      'arch.layer7.title': 'Run &amp; Publish',
      'arch.layer7.text': 'Windows, Linux/SteamOS, Android, Steam Workshop and UGC ecosystems.',
      'arch.summary': 'The orchestration layer plans and schedules; multimodal models generate; XCE carries and lands projects; test agents verify.',
      'deploy.kicker': 'Deployment',
      'deploy.title': 'Why local-first matters.',
      'deploy.reason1': 'Large project context \u2014 assets, scenes, scripts, textures, audio and logs',
      'deploy.reason2': 'High-frequency iteration \u2014 every tweak shouldn\u2019t require costly cloud calls',
      'deploy.reason3': 'Privacy and commercial IP \u2014 unreleased scripts and brand assets stay local',
      'deploy.reason4': 'Offline creation \u2014 Steam users, university labs and small-team workstations',
      'deploy.lite.title': 'Lite Local',
      'deploy.lite.audience': 'Creators &amp; university teaching',
      'deploy.lite.text': 'Small models, quantized models, local STT/TTS and lightweight image generation.',
      'deploy.pro.title': 'Pro Workstation',
      'deploy.pro.audience': 'Indie teams &amp; professional creators',
      'deploy.pro.text': 'RTX 4090/5090 or multi-GPU setups running full LLM, image, video and 3D generation.',
      'deploy.studio.title': 'Studio / Enterprise',
      'deploy.studio.audience': 'Enterprises, universities &amp; studios',
      'deploy.studio.text': 'Private GPU servers, multi-user queues, permissions, asset libraries and audit trails.',
      'edu.kicker': 'Higher Education',
      'edu.title': 'AI playable content creation &amp; practice platform.',
      'edu.lede': 'XCE AI targets AI, computer science, digital media, game design and educational technology programs \u2014 integrating model calls, agent design, knowledge bases, interactive logic, digital content and multi-platform publishing into one practice environment.',
      'edu.disc1': 'Artificial Intelligence',
      'edu.disc2': 'Computer Science',
      'edu.disc3': 'Digital Media Technology',
      'edu.disc4': 'Game Design',
      'edu.disc5': 'Educational Technology',
      'edu.value.title': 'What students build',
      'edu.value1': 'Design AI agents, knowledge bases and interactive scenarios through natural language',
      'edu.value2': 'Understand LLMs, RAG, knowledge graphs, Tool Calling and multimodal generation in real projects',
      'edu.value3': 'Ship runnable, editable, testable and publishable AI applications \u2014 not just lab reports',
      'edu.value4': 'Develop engineering practice, cross-disciplinary collaboration and innovation skills',
      'edu.teacher.title': 'For educators &amp; researchers',
      'edu.teacher1': 'Build course case libraries, experiment project banks and reusable teaching templates',
      'edu.teacher2': 'Track learning data across content creation, logic design, model calls and debugging',
      'edu.teacher3': 'Support learning analytics and knowledge-graph-based diagnosis and assessment',
      'edu.partner.title': 'Partnership models',
      'edu.partner1': 'Education licensing',
      'edu.partner2': 'Lab co-building',
      'edu.partner3': 'Joint curriculum',
      'edu.partner4': 'Faculty training',
      'edu.partner5': 'Research collaboration',
      'edu.partner6': 'Private deployment',
      'cta.kicker': 'Core Selling Point',
      'cta.title': 'Prompt to Playable Game Project.',
      'cta.text': 'From an idea to an editable, runnable, testable and publishable interactive work.',
      'cta.button': 'Start a conversation'
    },
    zh: {
      'site.title': 'Arkx \u2014 想象，从此具象',
      'site.description': 'Arkx（所象）正在构建面向 AI 原生世代可玩互动数字作品的 Creator OS。',
      'site.title.pd': 'Arkx 产品 \u2014 XCE AI 与 AI Native Generator',
      'site.description.pd': '探索 Xrafts Contents Editor（XCE AI）与 AI Native Generator，Arkx 推出的提示词到可玩游戏项目及互动 AI 短剧产品。',
      'brand.name': 'Arkx',
      'brand.tagline': 'Arks Creative',
      'nav.about': '关于',
      'nav.products': '产品',
      'nav.xce': 'XCE AI',
      'nav.ang': 'AI Native Generator',
      'nav.creatorOS': 'Creator OS',
      'nav.markets': '商业化',
      'nav.vision': '愿景',
      'nav.contact': '联系',
      'nav.explore': '探索 XCE AI',
      'hero.eyebrow': 'AI 原生创作科技 \u00B7 成立于 2025',
      'hero.title': '<span class="hero-title-line">想象，从此具象</span>',
      'hero.scrollHint': '向下滚动探索',
      'hero.lede': 'Arkx（所象）正在构建面向个人创作者、小型团队、高校人工智能教学与实践、企业内容生产等场景的 Creator OS——一种更轻、更快的方式，将故事、角色、场景、玩法和情感转化为可互动的数字作品。',
      'hero.cta.primary': '进入 Creator OS',
      'hero.cta.secondary': '了解我们的判断',
      'metric.1.value': '2025',
      'metric.1.label': '为 AI 创作时代而生',
      'metric.2.label': '4 种输入方式：文本、图像、语音、上下文',
      'metric.3.label': '从提示到可玩项目的单一路径',
      'floating.prompt.label': '输入',
      'floating.prompt.text': '构建一个包含 3 个结局的可互动校园悬疑剧。',
      'floating.output.label': '输出',
      'floating.output.text': '场景 \u00B7 资产 \u00B7 逻辑 \u00B7 测试 \u00B7 发布',
      'timeline.label': '新娱乐经济',
      'creatorOS.kicker': 'Creator OS',
      'creatorOS.title': '过去，创作者发布内容。未来，创作者创造体验',
      'creatorOS.text': '游戏与短剧创作长期面临三大障碍：美术资产门槛高、逻辑工程门槛高、测试与调优门槛高。AI 正在改变这一切——生成、组合、交互和发布正变得更轻、更快、更开放。',
      'creatorOS.card1.title': '想法成为系统',
      'creatorOS.card1.text': '一个故事可以不只停留在文本里。一个角色可以不只存在于画面中。情感、关系和灵感都可以被构建成可互动的作品。',
      'creatorOS.card2.title': '创作变得可迭代',
      'creatorOS.card2.text': '创作者可以快速原型、发布到真实生态、获取反馈，然后继续迭代作品，而不是从头开始。',
      'creatorOS.card3.title': '工具跟随想象',
      'creatorOS.card3.text': 'Arkx 不决定创作者应该做什么，而是帮助他们完成从想法到可玩、可编辑、可发布项目的第一次跨越。',
      'products.kicker': '产品',
      'products.title': '进入 AI 原生创作的两个入口',
      'products.text': 'XCE AI 为创作者提供轻量级互动创作工作台。AI Native Generator 将其延伸至互动 AI 短剧和可玩叙事内容。',
      'products.xce.label': 'Xrafts Contents Editor',
      'products.xce.title': 'XCE AI',
      'products.xce.text': '从提示到可玩游戏项目\u2014\u2014资产、场景、逻辑、测试和发布，一条可编辑的生产链。',
      'products.ang.label': '互动 AI 短剧',
      'products.ang.title': 'AI Native Generator',
      'products.ang.text': '生成角色、场景、视频、语音、选择、关系状态和多结局互动故事。',
      'demo.kicker': '产品演示',
      'demo.title': '看 XCE AI 如何工作',
      'demo.text': '从地图到可玩场景——观看完整创作流程。',
      'showcase.kicker': '编辑器界面一览',
      'showcase.title': '工作区界面亮点',
      'showcase.s4.title': '场景视口',
      'showcase.s4.text': '在实时编辑器中搭建大规模场景——导航、摆放物体并即时迭代布局。',
      'showcase.s5.title': '地图与摆放',
      'showcase.s5.text': '俯视编辑地形、建筑与场景布局，配合精准摆放工具与即时视觉反馈。',
      'showcase.s6.title': '风格化世界',
      'showcase.s6.text': '在同一工作区中构建色彩鲜明、角色驱动的 2D/3D 场景。',
      'showcase.s7.title': '互动序列',
      'showcase.s7.text': '在可玩场景中编排动作流程、战斗节拍与叙事触发器。',
      'showcase.s8.title': '光照与氛围',
      'showcase.s8.text': '调节情绪、光照与环境细节，打造沉浸式夜景世界。',
      'why.kicker': '为什么选择 Arkx',
      'why.title': '轻量、开放、可组合',
      'why.text': 'AI 原生创作工具不应建造更高的围墙，而应让更多能力为更多创作者所用。',
      'why.tab.speed': '速度',
      'why.tab.access': '门槛',
      'why.tab.context': '上下文',
      'why.tab.publish': '发布',
      'why.speed.title': '快速开始。快速构建。快速验证',
      'why.speed.text': '创作者难以把想法做成可持续迭代的 Demo。XCE AI 缩短从想法到垂直切片、可分享构建和可玩项目的路径，而不是停留在零散文件。',
      'why.access.title': '降低美术与生产门槛',
      'why.access.text': '图标、UI、场景、角色、特效、音乐和配音不再需要专业团队。AI 生成并组织资产，同时编辑器保持一切可编辑。',
      'why.context.title': 'AI 理解项目，而不仅仅是提示词',
      'why.context.text': '用户往往写不出稳定有效的提示词，也难以清晰描述玩法。自然语言、语音输入和工程自动上下文，减少反复说明和工具切换。',
      'why.publish.title': '一条链路，而非分散工具',
      'why.publish.text': '剧本、分镜、图片、视频、配音和剪辑往往分散在不同工具中。XCE AI 将创意输入、生成、工程、测试和发布统一在同一条生产链路里。',
      'global.kicker': '全球视野',
      'global.title': '诞生于中国创新生态，面向全球创作者',
      'global.text': 'Arkx 将中国高密度内容创新和移动互联网经验，与全球个人创作者、小团队、社群和数字原住民对更自由创作工作流的需求连接起来。',
      'vision.kicker': '愿景',
      'vision.title': '让想象拥有自己的运行方式',
      'vision.text': 'Arkx 相信 AI 时代的创作不应止步于内容生成，而应走向更自由的组织、体验与生长。目标不是让创作者适应工具，而是让工具跟上想象。',
      'vision.cta': '探索产品',
      'vision.quote': '\u201C不是 Prompt to Image，不是 Prompt to Video，而是 Prompt to Playable Game Project。\u201D',
      'vision.quoteAuthor': 'Arkx 产品主张',
      'contact.kicker': '联系',
      'contact.title': '与 Arkx 一起构建下一个互动作品',
      'contact.text': '欢迎联系我们，探讨合作、早期体验、高校课程共建、人工智能实践实验室共建、教育版授权或企业互动内容项目。',
      'contact.cta': '了解教育与合作伙伴',
      'footer.tagline': 'Arks Creative \u00B7 所象 \u2014 想象，从此具象。',
      'footer.about': '关于',
      'footer.products': '产品',
      'footer.contact': '联系',
      'phero.eyebrow': 'Arkx 产品体系',
      'phero.title': '从提示到可玩、可编辑、可发布的项目',
      'phero.lede': 'XCE AI 是一个 AI 原生创作系统，将 AI 深度嵌入游戏及短剧制作的核心链路，面向个人创作者、小型团队、高校人工智能教学与实践、企业内容生产等场景，实现从零门槛到可玩内容生成。',
      'phero.cta.primary': '查看产品核心',
      'phero.cta.secondary': '商业展望',
      'console.title': 'XCE AI / 构建控制台',
      'console.line1': '\u201C创建一个包含 3 个结局的互动校园悬疑故事。\u201D',
      'console.line2': '资产 \u2192 场景 \u2192 对话 \u2192 事件 \u2192 测试 \u2192 发布',
      'console.line3': '可玩项目已生成 \u00B7 可在工作区中编辑',
      'xce.kicker': 'Xrafts Contents Editor',
      'xce.title': 'XCE AI\u2014\u2014面向可玩内容的 AI 原生 工作台',
      'xce.text': '它不是传统的游戏编辑器，不是单一格式的生成工具，也不是另一个依赖巨大流量的封闭平台。它是面向个人创作者、小型团队、高校人工智能教学与实践、企业内容生产的可玩内容生成平台，将故事、角色、场景、玩法和表达转化为可编辑、可运行、可测试、可发布的作品。',
      'xce.panel': '公开基线',
      'xce.panelText': 'C++ 编辑器 · Steam · Windows / Linux / Android · 无代码 · 可视化事件 · TypeScript API · Workshop',
      'xce.subtitle': 'AI 不是外挂，而是嵌入创作链。',
      'xce.subtext': 'XCE AI 使用 AI 生成和组织 2D/3D 资产、角色、动作、CG 动画、特效、音乐、配音、游戏逻辑、自动化测试、调优建议和反馈分析。',
      'xce.list1': '将可编辑资产生成到项目资产系统中。',
      'xce.list2': '将自然语言转换为 XCE AI DSL、事件和组件。',
      'xce.list3': '使用 AI 玩家 Agent 测试流程、交互和平衡性。',
      'xce.list4': '发布可玩作品，而非零散生成的文件。',
      'xce.list5': '产品运营 AI 与用户反馈分析——正在开发中。',
      'core.kicker': '产品核心',
      'core.title': '一个连接闭环：表达、生成、组织、测试、修改、发布',
      'pipeline.1.title': '创意输入',
      'pipeline.1.text': '文本、参考图、语音和项目上下文被转化为清晰的生产任务。',
      'pipeline.2.title': '资产生成',
      'pipeline.2.text': '2D/3D 资产、UI、角色、场景、动作、特效、音乐、音效和配音进入项目资产系统。',
      'pipeline.3.title': '逻辑工程',
      'pipeline.3.text': 'AI 生成 XCE AI DSL、可视化事件、组件、对话节点、条件、变量和结局。',
      'pipeline.4.title': 'AI 测试',
      'pipeline.4.text': 'AI 玩家 Agent 检查分支、可达性、交互流程和数值平衡，并给出实用修复建议。',
      'pipeline.5.title': '发布与迭代',
      'pipeline.5.text': '可玩项目可以导出、在用户中测试，并通过反馈驱动迭代改进。',
      'ang.kicker': 'AI Native Generator',
      'ang.title': '从观看故事到参与故事',
      'ang.text': '互动 AI 短剧是 XCE AI 游戏创作能力的自然延伸。剧本、角色、场景、视频、配音和音乐成为内容基础；对话编辑、事件系统、状态变量和发布成为互动载体。',
      'ang.card1.title': '互动形式',
      'ang.card1.text': '剧情选择、线索探索、关系状态、QTE 时刻、解谜、资源、简单战斗和 AI 角色对话都能影响后续故事走向。',
      'ang.card2.title': '剧情生成',
      'ang.card2.text': '世界观、人物设定、章节、冲突、对白和结局进入对话编辑与剧情工程。',
      'ang.card3.title': '角色与场景',
      'ang.card3.text': '角色、服装、表情、道具、场景和风格参考成为可在不同镜头和分支中复用的资产。',
      'ang.card4.title': '分镜与视听',
      'ang.card4.text': '关键帧、片段、配音、音乐和音效被生成并与场景和剧情节点绑定。',
      'ang.card5.title': '逻辑与多结局',
      'ang.card5.text': '选择、条件、变量、好感度、道具、线索和结局通过对话、事件和组件系统配置。',
      'diff.kicker': '差异',
      'diff.title': '不是更多独立的生成按钮，而是一条真实的生产链',
      'diff.col1': '工具类型',
      'diff.col2': '典型输出',
      'diff.col3': '常见问题',
      'diff.col4': 'XCE AI 差异',
      'diff.row1.1': 'AI 绘图',
      'diff.row1.2': '图片',
      'diff.row1.3': '不能直接变成游戏工程',
      'diff.row1.4': '生成后直接进入资产库和逻辑系统',
      'diff.row2.1': 'AI 视频',
      'diff.row2.2': '视频',
      'diff.row2.3': '只能看，不能玩',
      'diff.row2.4': '片段与 CG、过场和互动短剧逻辑绑定',
      'diff.row3.1': 'AI 3D',
      'diff.row3.2': '模型',
      'diff.row3.3': '需要清理、减面、绑定和导入',
      'diff.row3.4': '自动工程化处理并生成 Asset Card',
      'diff.row4.1': 'AI 代码',
      'diff.row4.2': '代码',
      'diff.row4.3': '难以接入游戏工程',
      'diff.row4.4': '生成 XCE AI DSL、事件和组件',
      'diff.row5.1': '传统游戏引擎',
      'diff.row5.2': '功能强大',
      'diff.row5.3': '学习成本高',
      'diff.row5.4': '无代码 + AI + 可视化',
      'diff.row6.1': '无代码游戏工具',
      'diff.row6.2': '上手快',
      'diff.row6.3': '资产和逻辑仍需人做',
      'diff.row6.4': 'AI 生成资产、逻辑、测试和优化',
      'markets.kicker': '商业化',
      'markets.title': '从创作者订阅到高校人工智能教育、UGC 市场和企业生产',
      'markets.text': 'XCE AI 用 AI 降低创作门槛，用可编辑工程承载可玩作品，用 UGC 扩大内容供给，用发布和市场机制实现持续商业化。',
      'markets.card1.title': '创作者订阅',
      'markets.card1.text': 'Free/Lite、Pro、Studio 等版本——面向个人、学生和独立开发者的订阅、AI 云端渲染点数、高级模板包、资产包和发布工具。',
      'markets.card2.title': 'UGC 模板与资产市场',
      'markets.card2.text': '游戏模板、角色模型、UI 套件、特效、脚本、AI 提示词、工作流和教程项目，平台参与分成。',
      'markets.card3.title': '高校人工智能教育',
      'markets.card3.text': '建设 AI 可玩内容创作与实践教学平台——从模型调用、智能体设计到交互应用开发与多平台发布。',
      'markets.card4.title': '企业互动内容',
      'markets.card4.text': '品牌小游戏、互动短剧、活动体验、发布演示、培训模拟、销售话术训练和 IP 联名——将数周开发压缩为数天到数周。',
      'markets.card5.title': '小型工作室生产力',
      'markets.card5.text': '垂直切片、Pitch 演示、Steam 页面素材、概念资产、白盒关卡、平衡测试和泛娱乐 MVP——补足团队短板，而非替代团队。',
      'audiences.kicker': '面向谁',
      'audiences.title': '为创作者、团队、高校和企业而生',
      'audiences.text': 'XCE AI 是面向个人创作者、UGC 创作者、小型团队、高校人工智能院系与企业品牌团队的可玩内容生成平台。',
      'audiences.card1.title': '个人游戏创作者',
      'audiences.card1.text': '没有完整团队，不会画、不懂 3D、不懂代码——用 AI 快速生成资产、逻辑、关卡和测试结果。',
      'audiences.card2.title': 'UGC 内容创作者',
      'audiences.card2.text': '想做可分享、可互动的内容，但工具复杂——从图文或语音创意直接生成可玩作品和互动短剧。',
      'audiences.card3.title': '小型独立团队',
      'audiences.card3.text': '人手少，前期原型验证慢——缩短 Demo、垂直切片和宣传素材制作周期。',
      'audiences.card4.title': '高校人工智能院系与实验室',
      'audiences.card4.text': '教学偏重理论或单一模型实验——用自然语言和可视化方式完成模型调用、智能体设计、交互开发与成果发布。',
      'audiences.card5.title': '企业品牌/营销团队',
      'audiences.card5.text': '需要互动内容，但传统开发成本高——快速生成品牌互动小游戏、活动页和展会互动内容。',
      'baseline.kicker': 'XCE 基线',
      'baseline.title': '建立在成熟无代码编辑器之上，为 AI 而生',
      'baseline.card1.title': '无代码与低门槛创作',
      'baseline.card1.text': 'AI 生成结果落入可视化、可编辑、可运行的工程环境，而不是一堆不可控文件。',
      'baseline.card2.title': '资产库与模板系统',
      'baseline.card2.text': 'AI 生成 + 内置资产库 + 参数化组合——比纯 AIGC 更稳定，更容易生成真正可玩的内容。',
      'baseline.card3.title': '可视化工程能力',
      'baseline.card3.text': '所见即所得的操作——AI 不只给建议，还能在工程里直接完成操作，生成内容仍可由用户继续调整。',
      'baseline.card4.title': '发布与 UGC 扩展',
      'baseline.card4.text': '支持 Steam、Windows、Linux/SteamOS、Android 一键发布——成为模板市场、资产市场和 AI 创作生态的基础。',
      'ang.scenarios.kicker': '适用场景',
      'ang.scenarios.title': '可互动 AI 短剧的应用方向',
      'ang.scenario1': '互动漫剧和 AVG 类视频游戏',
      'ang.scenario2': '品牌 IP 互动番外',
      'ang.scenario3': '文旅互动剧情',
      'ang.scenario4': '高校人工智能实践教学作品',
      'ang.scenario5': '企业培训与销售模拟',
      'ang.scenario6': '展会和线下互动内容',
      'problems.kicker': '用户调研',
      'problems.title': '真实反馈，贯通解法',
      'problems.text': '游戏创作与 AI 短剧用户调研揭示了共性痛点——XCE AI 将表达、生成、组织、测试、修改和发布连接成一条完整链路。',
      'problems.col1': '用户反馈',
      'problems.col2': 'XCE AI 对应能力',
      'problems.col3': '产品优势',
      'problems.row1.1': '不知道如何描述需求或编写提示词',
      'problems.row1.2': '自然语言输入、语音输入、工程自动上下文',
      'problems.row1.3': '直接描述创作意图，AI 结合工程拆解资产、场景、逻辑和测试任务',
      'problems.row2.1': 'AI 生成代码，但不理解完整游戏',
      'problems.row2.2': '主 Agent、RAG、Tool Calling、编辑器 API',
      'problems.row2.3': '结合项目结构生成工程内容，而非独立代码片段',
      'problems.row3.1': '多个工具来回切换，画风难以统一',
      'problems.row3.2': 'AI 编排层统一调用 + 资产库组织',
      'problems.row3.3': '从创意、生成到工程装配和测试都在同一条生产链路中完成',
      'problems.row4.1': '反复抽卡带来成本浪费',
      'problems.row4.2': '本地模型、内置资产库、可编辑工程',
      'problems.row4.3': '复用已有资产，对生成结果继续编辑，不必每次从头生成',
      'problems.row5.1': 'Demo 很难继续做成完整作品',
      'problems.row5.2': '可视化工程、逻辑生成、自动测试',
      'problems.row5.3': 'AI 生成结果直接进入可运行工程，支持继续迭代和发布',
      'problems.row6.1': 'AI 短剧只能看，不能互动',
      'problems.row6.2': '对话编辑、可视化事件、变量和分支逻辑',
      'problems.row6.3': '视频素材与选择节点、剧情状态和多结局结合，形成可互动短剧',
      'arch.kicker': '技术架构',
      'arch.title': '本地优先、云端增强、模型可替换',
      'arch.text': '七层架构将用户意图连接到可发布的可玩项目。',
      'arch.layer1.title': '用户输入层',
      'arch.layer1.text': '文本、语音、图片/视频参考、工程上下文和操作反馈日志。',
      'arch.layer2.title': 'AI 编排层',
      'arch.layer2.text': '主 Agent、RAG、Tool Calling、模型路由和安全与权限控制。',
      'arch.layer3.title': '生成模型层',
      'arch.layer3.text': '2D、3D、视频/动画、TTS、STT、音乐和音效。',
      'arch.layer4.title': '逻辑与内容工程层',
      'arch.layer4.text': 'XCE DSL、事件组件、对话图、分支剧情、状态变量和数值系统。',
      'arch.layer5.title': '编辑器与资产层',
      'arch.layer5.text': '资产库、场景、脚本、组件、Asset Card 和版本管理。',
      'arch.layer6.title': '自动化测试层',
      'arch.layer6.text': 'AI 玩家、交互测试、分支测试、数值平衡和优化建议。',
      'arch.layer7.title': '运行与发布层',
      'arch.layer7.text': 'Windows、Linux/SteamOS、Android、Steam Workshop 和 UGC 生态。',
      'arch.summary': '编排层负责思考和调度，多模态模型负责生成，XCE 负责承载和落地，测试 Agent 负责验证。',
      'deploy.kicker': '部署形态',
      'deploy.title': '为什么本地优先',
      'deploy.reason1': '游戏工程文件较大——资产、场景、脚本、贴图、音频和日志涉及大量上下文',
      'deploy.reason2': '创作过程高频迭代——每次改图、改脚本、改数值都调用云端，成本不可控',
      'deploy.reason3': '用户隐私与商业 IP——角色设定、品牌资产、剧情脚本和未发布内容不适合默认上传',
      'deploy.reason4': '离线创作场景——Steam 用户、高校人工智能实验室和小团队工作站都需要可离线运行',
      'deploy.lite.title': 'Lite 本地版',
      'deploy.lite.audience': '普通创作者、高校教学用户',
      'deploy.lite.text': '小模型、量化模型、本地 STT/TTS 和轻量图像生成。',
      'deploy.pro.title': 'Pro 工作站版',
      'deploy.pro.audience': '独立团队、专业创作者',
      'deploy.pro.text': 'RTX 4090/5090 或多卡，运行完整 LLM、图像、视频和 3D 生成。',
      'deploy.studio.title': 'Studio / Enterprise 版',
      'deploy.studio.audience': '企业、高校、内容工作室',
      'deploy.studio.text': '私有 GPU 服务器、多用户队列、权限、资产库和审计。',
      'edu.kicker': '高校教育',
      'edu.title': 'AI 可玩内容创作与实践教学平台',
      'edu.lede': 'XCE AI 面向人工智能、计算机科学、数字媒体技术、游戏设计及教育技术等专业，将模型调用、智能体设计、知识库构建、交互逻辑生成、数字内容制作和多平台发布整合到同一实践环境中。',
      'edu.disc1': '人工智能',
      'edu.disc2': '计算机科学',
      'edu.disc3': '数字媒体技术',
      'edu.disc4': '游戏设计',
      'edu.disc5': '教育技术',
      'edu.value.title': '学生能做什么',
      'edu.value1': '通过自然语言和可视化方式设计 AI 智能体、知识库和交互场景',
      'edu.value2': '在真实项目中理解大模型、RAG、知识图谱、Tool Calling 和多模态生成',
      'edu.value3': '形成可运行、可修改、可测试和可发布的人工智能应用作品，而非实验报告',
      'edu.value4': '提升工程实践、跨学科协作与创新应用能力',
      'edu.teacher.title': '面向教师与研究者',
      'edu.teacher1': '建设人工智能课程案例库、实验项目库和可复用教学模板',
      'edu.teacher2': '记录学生在内容创作、逻辑设计、模型调用和任务调试过程中的学习数据',
      'edu.teacher3': '通过学习分析与知识图谱技术开展学习过程诊断和教学效果评估',
      'edu.partner.title': '合作模式',
      'edu.partner1': '教育版授权',
      'edu.partner2': '实验室共建',
      'edu.partner3': '课程共建',
      'edu.partner4': '师资培训',
      'edu.partner5': '科研合作',
      'edu.partner6': '私有化部署',
      'cta.kicker': '核心卖点',
      'cta.title': '从提示到可玩游戏项目',
      'cta.text': '从一个想法到可编辑、可运行、可测试、可发布的互动作品。',
      'cta.button': '开始对话'
    },
    'zh-hant': {
      'site.title': 'Arkx \u2014 想象，從此具象',
      'site.description': 'Arkx（所象）正在構建面向 AI 原生世代可玩互動數字作品的 Creator OS。',
      'site.title.pd': 'Arkx 產品 \u2014 XCE AI 與 AI Native Generator',
      'site.description.pd': '探索 Xrafts Contents Editor（XCE AI）與 AI Native Generator，Arkx 推出的提示詞到可玩遊戲項目及互動 AI 短劇產品。',
      'brand.name': 'Arkx',
      'brand.tagline': 'Arks Creative',
      'nav.about': '關於',
      'nav.products': '產品',
      'nav.xce': 'XCE AI',
      'nav.ang': 'AI Native Generator',
      'nav.creatorOS': 'Creator OS',
      'nav.markets': '商業化',
      'nav.vision': '願景',
      'nav.contact': '聯繫',
      'nav.explore': '探索 XCE AI',
      'hero.eyebrow': 'AI 原生創作科技 \u00B7 成立於 2025',
      'hero.title': '<span class="hero-title-line">想象，從此具象</span>',
      'hero.scrollHint': '向下滾動探索',
      'hero.lede': 'Arkx（所象）正在構建面向個人創作者、小型團隊、高校人工智能教學與實踐、企業內容生產等場景的 Creator OS——一種更輕、更快的方式，將故事、角色、場景、玩法和情感轉化爲可互動的數字作品。',
      'hero.cta.primary': '進入 Creator OS',
      'hero.cta.secondary': '瞭解我們的判斷',
      'metric.1.value': '2025',
      'metric.1.label': '爲 AI 創作時代而生',
      'metric.2.label': '4 種輸入方式：文本、圖像、語音、上下文',
      'metric.3.label': '從提示到可玩項目的單一路徑',
      'floating.prompt.label': '輸入',
      'floating.prompt.text': '構建一個包含 3 個結局的可互動校園懸疑劇。',
      'floating.output.label': '輸出',
      'floating.output.text': '場景 \u00B7 資產 \u00B7 邏輯 \u00B7 測試 \u00B7 發佈',
      'timeline.label': '新娛樂經濟',
      'creatorOS.kicker': 'Creator OS',
      'creatorOS.title': '過去，創作者發佈內容。未來，創作者創造體驗',
      'creatorOS.text': '遊戲與短劇創作長期面臨三大障礙：美術資產門檻高、邏輯工程門檻高、測試與調優門檻高。AI 正在改變這一切——生成、組合、交互和發佈正變得更輕、更快、更開放。',
      'creatorOS.card1.title': '想法成爲系統',
      'creatorOS.card1.text': '一個故事可以不只停留在文本里。一個角色可以不只存在於畫面中。情感、關係和靈感都可以被構建成可互動的作品。',
      'creatorOS.card2.title': '創作變得可迭代',
      'creatorOS.card2.text': '創作者可以快速原型、發佈到真實生態、獲取反饋，然後繼續迭代作品，而不是從頭開始。',
      'creatorOS.card3.title': '工具跟隨想象',
      'creatorOS.card3.text': 'Arkx 不決定創作者應該做什麼，而是幫助他們完成從想法到可玩、可編輯、可發佈項目的第一次跨越。',
      'products.kicker': '產品',
      'products.title': '進入 AI 原生創作的兩個入口',
      'products.text': 'XCE AI 爲創作者提供輕量級互動創作工作臺。AI Native Generator 將其延伸至互動 AI 短劇和可玩敘事內容。',
      'products.xce.label': 'Xrafts Contents Editor',
      'products.xce.title': 'XCE AI',
      'products.xce.text': '從提示到可玩遊戲項目\u2014\u2014資產、場景、邏輯、測試和發佈，一條可編輯的生產鏈。',
      'products.ang.label': '互動 AI 短劇',
      'products.ang.title': 'AI Native Generator',
      'products.ang.text': '生成角色、場景、視頻、語音、選擇、關係狀態和多結局互動故事。',
      'demo.kicker': '產品演示',
      'demo.title': '看 XCE AI 如何工作',
      'demo.text': '從地圖到可玩場景——觀看完整創作流程。',
      'showcase.kicker': '編輯器界面一覽',
      'showcase.title': '工作區界面亮點',
      'showcase.s4.title': '場景視口',
      'showcase.s4.text': '在實時編輯器中搭建大規模場景——導航、擺放物體並即時迭代佈局。',
      'showcase.s5.title': '地圖與擺放',
      'showcase.s5.text': '俯視編輯地形、建築與場景佈局，配合精準擺放工具與即時視覺反饋。',
      'showcase.s6.title': '風格化世界',
      'showcase.s6.text': '在同一工作區中構建色彩鮮明、角色驅動的 2D/3D 場景。',
      'showcase.s7.title': '互動序列',
      'showcase.s7.text': '在可玩場景中編排動作流程、戰鬥節拍與敘事觸發器。',
      'showcase.s8.title': '光照與氛圍',
      'showcase.s8.text': '調節情緒、光照與環境細節，打造沉浸式夜景世界。',
      'why.kicker': '爲什麼選擇 Arkx',
      'why.title': '輕量、開放、可組合',
      'why.text': 'AI 原生創作工具不應建造更高的圍牆，而應讓更多能力爲更多創作者所用。',
      'why.tab.speed': '速度',
      'why.tab.access': '門檻',
      'why.tab.context': '上下文',
      'why.tab.publish': '發佈',
      'why.speed.title': '快速開始。快速構建。快速驗證',
      'why.speed.text': '創作者難以把想法做成可持續迭代的 Demo。XCE AI 縮短從想法到垂直切片、可分享構建和可玩項目的路徑，而不是停留在零散文件。',
      'why.access.title': '降低美術與生產門檻',
      'why.access.text': '圖標、UI、場景、角色、特效、音樂和配音不再需要專業團隊。AI 生成並組織資產，同時編輯器保持一切可編輯。',
      'why.context.title': 'AI 理解項目，而不僅僅是提示詞',
      'why.context.text': '用戶往往寫不出穩定有效的提示詞，也難以清晰描述玩法。自然語言、語音輸入和工程自動上下文，減少反覆說明和工具切換。',
      'why.publish.title': '一條鏈路，而非分散工具',
      'why.publish.text': '劇本、分鏡、圖片、視頻、配音和剪輯往往分散在不同工具中。XCE AI 將創意輸入、生成、工程、測試和發佈統一在同一條生產鏈路裏。',
      'global.kicker': '全球視野',
      'global.title': '誕生於中國創新生態，面向全球創作者',
      'global.text': 'Arkx 將中國高密度內容創新和移動互聯網經驗，與全球個人創作者、小團隊、社羣和數字原住民對更自由創作工作流的需求連接起來。',
      'vision.kicker': '願景',
      'vision.title': '讓想象擁有自己的運行方式',
      'vision.text': 'Arkx 相信 AI 時代的創作不應止步於內容生成，而應走向更自由的組織、體驗與生長。目標不是讓創作者適應工具，而是讓工具跟上想象。',
      'vision.cta': '探索產品',
      'vision.quote': '\u201C不是 Prompt to Image，不是 Prompt to Video，而是 Prompt to Playable Game Project。\u201D',
      'vision.quoteAuthor': 'Arkx 產品主張',
      'contact.kicker': '聯繫',
      'contact.title': '與 Arkx 一起構建下一個互動作品',
      'contact.text': '歡迎聯繫我們，探討合作、早期體驗、高校課程共建、人工智能實踐實驗室共建、教育版授權或企業互動內容項目。',
      'contact.cta': '瞭解教育與合作夥伴',
      'footer.tagline': 'Arks Creative \u00B7 所象 \u2014 想象，從此具象。',
      'footer.about': '關於',
      'footer.products': '產品',
      'footer.contact': '聯繫',
      'phero.eyebrow': 'Arkx 產品體系',
      'phero.title': '從提示到可玩、可編輯、可發佈的項目',
      'phero.lede': 'XCE AI 是一個 AI 原生創作系統，將 AI 深度嵌入遊戲及短劇製作的核心鏈路，面向個人創作者、小型團隊、高校人工智能教學與實踐、企業內容生產等場景，實現從零門檻到可玩內容生成。',
      'phero.cta.primary': '查看產品核心',
      'phero.cta.secondary': '商業展望',
      'console.title': 'XCE AI / 構建控制檯',
      'console.line1': '\u201C創建一個包含 3 個結局的互動校園懸疑故事。\u201D',
      'console.line2': '資產 \u2192 場景 \u2192 對話 \u2192 事件 \u2192 測試 \u2192 發佈',
      'console.line3': '可玩項目已生成 \u00B7 可在工作區中編輯',
      'xce.kicker': 'Xrafts Contents Editor',
      'xce.title': 'XCE AI\u2014\u2014面向可玩內容的 AI 原生 工作臺',
      'xce.text': '它不是傳統的遊戲編輯器，不是單一格式的生成工具，也不是另一個依賴巨大流量的封閉平臺。它是面向個人創作者、小型團隊、高校人工智能教學與實踐、企業內容生產的可玩內容生成平臺，將故事、角色、場景、玩法和表達轉化爲可編輯、可運行、可測試、可發佈的作品。',
      'xce.panel': '公開基線',
      'xce.panelText': 'C++ 編輯器 · Steam · Windows / Linux / Android · 無代碼 · 可視化事件 · TypeScript API · Workshop',
      'xce.subtitle': 'AI 不是外掛，而是嵌入創作鏈。',
      'xce.subtext': 'XCE AI 使用 AI 生成和組織 2D/3D 資產、角色、動作、CG 動畫、特效、音樂、配音、遊戲邏輯、自動化測試、調優建議和反饋分析。',
      'xce.list1': '將可編輯資產生成到項目資產系統中。',
      'xce.list2': '將自然語言轉換爲 XCE AI DSL、事件和組件。',
      'xce.list3': '使用 AI 玩家 Agent 測試流程、交互和平衡性。',
      'xce.list4': '發佈可玩作品，而非零散生成的文件。',
      'xce.list5': '產品運營 AI 與用戶反饋分析——正在開發中。',
      'core.kicker': '產品核心',
      'core.title': '一個連接閉環：表達、生成、組織、測試、修改、發佈',
      'pipeline.1.title': '創意輸入',
      'pipeline.1.text': '文本、參考圖、語音和項目上下文被轉化爲清晰的生產任務。',
      'pipeline.2.title': '資產生成',
      'pipeline.2.text': '2D/3D 資產、UI、角色、場景、動作、特效、音樂、音效和配音進入項目資產系統。',
      'pipeline.3.title': '邏輯工程',
      'pipeline.3.text': 'AI 生成 XCE AI DSL、可視化事件、組件、對話節點、條件、變量和結局。',
      'pipeline.4.title': 'AI 測試',
      'pipeline.4.text': 'AI 玩家 Agent 檢查分支、可達性、交互流程和數值平衡，並給出實用修復建議。',
      'pipeline.5.title': '發佈與迭代',
      'pipeline.5.text': '可玩項目可以導出、在用戶中測試，並通過反饋驅動迭代改進。',
      'ang.kicker': 'AI Native Generator',
      'ang.title': '從觀看故事到參與故事',
      'ang.text': '互動 AI 短劇是 XCE AI 遊戲創作能力的自然延伸。劇本、角色、場景、視頻、配音和音樂成爲內容基礎；對話編輯、事件系統、狀態變量和發佈成爲互動載體。',
      'ang.card1.title': '互動形式',
      'ang.card1.text': '劇情選擇、線索探索、關係狀態、QTE 時刻、解謎、資源、簡單戰鬥和 AI 角色對話都能影響後續故事走向。',
      'ang.card2.title': '劇情生成',
      'ang.card2.text': '世界觀、人物設定、章節、衝突、對白和結局進入對話編輯與劇情工程。',
      'ang.card3.title': '角色與場景',
      'ang.card3.text': '角色、服裝、表情、道具、場景和風格參考成爲可在不同鏡頭和分支中複用的資產。',
      'ang.card4.title': '分鏡與視聽',
      'ang.card4.text': '關鍵幀、片段、配音、音樂和音效被生成並與場景和劇情節點綁定。',
      'ang.card5.title': '邏輯與多結局',
      'ang.card5.text': '選擇、條件、變量、好感度、道具、線索和結局通過對話、事件和組件系統配置。',
      'diff.kicker': '差異',
      'diff.title': '不是更多獨立的生成按鈕，而是一條真實的生產鏈',
      'diff.col1': '工具類型',
      'diff.col2': '典型輸出',
      'diff.col3': '常見問題',
      'diff.col4': 'XCE AI 差異',
      'diff.row1.1': 'AI 繪圖',
      'diff.row1.2': '圖片',
      'diff.row1.3': '不能直接變成遊戲工程',
      'diff.row1.4': '生成後直接進入資產庫和邏輯系統',
      'diff.row2.1': 'AI 視頻',
      'diff.row2.2': '視頻',
      'diff.row2.3': '只能看，不能玩',
      'diff.row2.4': '片段與 CG、過場和互動短劇邏輯綁定',
      'diff.row3.1': 'AI 3D',
      'diff.row3.2': '模型',
      'diff.row3.3': '需要清理、減面、綁定和導入',
      'diff.row3.4': '自動工程化處理並生成 Asset Card',
      'diff.row4.1': 'AI 代碼',
      'diff.row4.2': '代碼',
      'diff.row4.3': '難以接入遊戲工程',
      'diff.row4.4': '生成 XCE AI DSL、事件和組件',
      'diff.row5.1': '傳統遊戲引擎',
      'diff.row5.2': '功能強大',
      'diff.row5.3': '學習成本高',
      'diff.row5.4': '無代碼 + AI + 可視化',
      'diff.row6.1': '無代碼遊戲工具',
      'diff.row6.2': '上手快',
      'diff.row6.3': '資產和邏輯仍需人做',
      'diff.row6.4': 'AI 生成資產、邏輯、測試和優化',
      'markets.kicker': '商業化',
      'markets.title': '從創作者訂閱到高校人工智能教育、UGC 市場和企業生產',
      'markets.text': 'XCE AI 用 AI 降低創作門檻，用可編輯工程承載可玩作品，用 UGC 擴大內容供給，用發佈和市場機制實現持續商業化。',
      'markets.card1.title': '創作者訂閱',
      'markets.card1.text': 'Free/Lite、Pro、Studio 等版本——面向個人、學生和獨立開發者的訂閱、AI 雲端渲染點數、高級模板包、資產包和發佈工具。',
      'markets.card2.title': 'UGC 模板與資產市場',
      'markets.card2.text': '遊戲模板、角色模型、UI 套件、特效、腳本、AI 提示詞、工作流和教程項目，平臺參與分成。',
      'markets.card3.title': '高校人工智能教育',
      'markets.card3.text': '建設 AI 可玩內容創作與實踐教學平臺——從模型調用、智能體設計到交互應用開發與多平臺發佈。',
      'markets.card4.title': '企業互動內容',
      'markets.card4.text': '品牌小遊戲、互動短劇、活動體驗、發佈演示、培訓模擬、銷售話術訓練和 IP 聯名——將數週開發壓縮爲數天到數週。',
      'markets.card5.title': '小型工作室生產力',
      'markets.card5.text': '垂直切片、Pitch 演示、Steam 頁面素材、概念資產、白盒關卡、平衡測試和泛娛樂 MVP——補足團隊短板，而非替代團隊。',
      'audiences.kicker': '面向誰',
      'audiences.title': '爲創作者、團隊、高校和企業而生',
      'audiences.text': 'XCE AI 是面向個人創作者、UGC 創作者、小型團隊、高校人工智能院系與企業品牌團隊的可玩內容生成平臺。',
      'audiences.card1.title': '個人遊戲創作者',
      'audiences.card1.text': '沒有完整團隊，不會畫、不懂 3D、不懂代碼——用 AI 快速生成資產、邏輯、關卡和測試結果。',
      'audiences.card2.title': 'UGC 內容創作者',
      'audiences.card2.text': '想做可分享、可互動的內容，但工具複雜——從圖文或語音創意直接生成可玩作品和互動短劇。',
      'audiences.card3.title': '小型獨立團隊',
      'audiences.card3.text': '人手少，前期原型驗證慢——縮短 Demo、垂直切片和宣傳素材製作週期。',
      'audiences.card4.title': '高校人工智能院系與實驗室',
      'audiences.card4.text': '教學偏重理論或單一模型實驗——用自然語言和可視化方式完成模型調用、智能體設計、交互開發與成果發佈。',
      'audiences.card5.title': '企業品牌/營銷團隊',
      'audiences.card5.text': '需要互動內容，但傳統開發成本高——快速生成品牌互動小遊戲、活動頁和展會互動內容。',
      'baseline.kicker': 'XCE 基線',
      'baseline.title': '建立在成熟無代碼編輯器之上，爲 AI 而生',
      'baseline.card1.title': '無代碼與低門檻創作',
      'baseline.card1.text': 'AI 生成結果落入可視化、可編輯、可運行的工程環境，而不是一堆不可控文件。',
      'baseline.card2.title': '資產庫與模板系統',
      'baseline.card2.text': 'AI 生成 + 內置資產庫 + 參數化組合——比純 AIGC 更穩定，更容易生成真正可玩的內容。',
      'baseline.card3.title': '可視化工程能力',
      'baseline.card3.text': '所見即所得的操作——AI 不只給建議，還能在工程裏直接完成操作，生成內容仍可由用戶繼續調整。',
      'baseline.card4.title': '發佈與 UGC 擴展',
      'baseline.card4.text': '支持 Steam、Windows、Linux/SteamOS、Android 一鍵發佈——成爲模板市場、資產市場和 AI 創作生態的基礎。',
      'ang.scenarios.kicker': '適用場景',
      'ang.scenarios.title': '可互動 AI 短劇的應用方向',
      'ang.scenario1': '互動漫劇和 AVG 類視頻遊戲',
      'ang.scenario2': '品牌 IP 互動番外',
      'ang.scenario3': '文旅互動劇情',
      'ang.scenario4': '高校人工智能實踐教學作品',
      'ang.scenario5': '企業培訓與銷售模擬',
      'ang.scenario6': '展會和線下互動內容',
      'problems.kicker': '用戶調研',
      'problems.title': '真實反饋，貫通解法',
      'problems.text': '遊戲創作與 AI 短劇用戶調研揭示了共性痛點——XCE AI 將表達、生成、組織、測試、修改和發佈連接成一條完整鏈路。',
      'problems.col1': '用戶反饋',
      'problems.col2': 'XCE AI 對應能力',
      'problems.col3': '產品優勢',
      'problems.row1.1': '不知道如何描述需求或編寫提示詞',
      'problems.row1.2': '自然語言輸入、語音輸入、工程自動上下文',
      'problems.row1.3': '直接描述創作意圖，AI 結合工程拆解資產、場景、邏輯和測試任務',
      'problems.row2.1': 'AI 生成代碼，但不理解完整遊戲',
      'problems.row2.2': '主 Agent、RAG、Tool Calling、編輯器 API',
      'problems.row2.3': '結合項目結構生成工程內容，而非獨立代碼片段',
      'problems.row3.1': '多個工具來回切換，畫風難以統一',
      'problems.row3.2': 'AI 編排層統一調用 + 資產庫組織',
      'problems.row3.3': '從創意、生成到工程裝配和測試都在同一條生產鏈路中完成',
      'problems.row4.1': '反覆抽卡帶來成本浪費',
      'problems.row4.2': '本地模型、內置資產庫、可編輯工程',
      'problems.row4.3': '複用已有資產，對生成結果繼續編輯，不必每次從頭生成',
      'problems.row5.1': 'Demo 很難繼續做成完整作品',
      'problems.row5.2': '可視化工程、邏輯生成、自動測試',
      'problems.row5.3': 'AI 生成結果直接進入可運行工程，支持繼續迭代和發佈',
      'problems.row6.1': 'AI 短劇只能看，不能互動',
      'problems.row6.2': '對話編輯、可視化事件、變量和分支邏輯',
      'problems.row6.3': '視頻素材與選擇節點、劇情狀態和多結局結合，形成可互動短劇',
      'arch.kicker': '技術架構',
      'arch.title': '本地優先、雲端增強、模型可替換',
      'arch.text': '七層架構將用戶意圖連接到可發佈的可玩項目。',
      'arch.layer1.title': '用戶輸入層',
      'arch.layer1.text': '文本、語音、圖片/視頻參考、工程上下文和操作反饋日誌。',
      'arch.layer2.title': 'AI 編排層',
      'arch.layer2.text': '主 Agent、RAG、Tool Calling、模型路由和安全與權限控制。',
      'arch.layer3.title': '生成模型層',
      'arch.layer3.text': '2D、3D、視頻/動畫、TTS、STT、音樂和音效。',
      'arch.layer4.title': '邏輯與內容工程層',
      'arch.layer4.text': 'XCE DSL、事件組件、對話圖、分支劇情、狀態變量和數值系統。',
      'arch.layer5.title': '編輯器與資產層',
      'arch.layer5.text': '資產庫、場景、腳本、組件、Asset Card 和版本管理。',
      'arch.layer6.title': '自動化測試層',
      'arch.layer6.text': 'AI 玩家、交互測試、分支測試、數值平衡和優化建議。',
      'arch.layer7.title': '運行與發佈層',
      'arch.layer7.text': 'Windows、Linux/SteamOS、Android、Steam Workshop 和 UGC 生態。',
      'arch.summary': '編排層負責思考和調度，多模態模型負責生成，XCE 負責承載和落地，測試 Agent 負責驗證。',
      'deploy.kicker': '部署形態',
      'deploy.title': '爲什麼本地優先',
      'deploy.reason1': '遊戲工程文件較大——資產、場景、腳本、貼圖、音頻和日誌涉及大量上下文',
      'deploy.reason2': '創作過程高頻迭代——每次改圖、改腳本、改數值都調用雲端，成本不可控',
      'deploy.reason3': '用戶隱私與商業 IP——角色設定、品牌資產、劇情腳本和未發佈內容不適合默認上傳',
      'deploy.reason4': '離線創作場景——Steam 用戶、高校人工智能實驗室和小團隊工作站都需要可離線運行',
      'deploy.lite.title': 'Lite 本地版',
      'deploy.lite.audience': '普通創作者、高校教學用戶',
      'deploy.lite.text': '小模型、量化模型、本地 STT/TTS 和輕量圖像生成。',
      'deploy.pro.title': 'Pro 工作站版',
      'deploy.pro.audience': '獨立團隊、專業創作者',
      'deploy.pro.text': 'RTX 4090/5090 或多卡，運行完整 LLM、圖像、視頻和 3D 生成。',
      'deploy.studio.title': 'Studio / Enterprise 版',
      'deploy.studio.audience': '企業、高校、內容工作室',
      'deploy.studio.text': '私有 GPU 服務器、多用戶隊列、權限、資產庫和審計。',
      'edu.kicker': '高校教育',
      'edu.title': 'AI 可玩內容創作與實踐教學平臺',
      'edu.lede': 'XCE AI 面向人工智能、計算機科學、數字媒體技術、遊戲設計及教育技術等專業，將模型調用、智能體設計、知識庫構建、交互邏輯生成、數字內容製作和多平臺發佈整合到同一實踐環境中。',
      'edu.disc1': '人工智能',
      'edu.disc2': '計算機科學',
      'edu.disc3': '數字媒體技術',
      'edu.disc4': '遊戲設計',
      'edu.disc5': '教育技術',
      'edu.value.title': '學生能做什麼',
      'edu.value1': '通過自然語言和可視化方式設計 AI 智能體、知識庫和交互場景',
      'edu.value2': '在真實項目中理解大模型、RAG、知識圖譜、Tool Calling 和多模態生成',
      'edu.value3': '形成可運行、可修改、可測試和可發佈的人工智能應用作品，而非實驗報告',
      'edu.value4': '提升工程實踐、跨學科協作與創新應用能力',
      'edu.teacher.title': '面向教師與研究者',
      'edu.teacher1': '建設人工智能課程案例庫、實驗項目庫和可複用教學模板',
      'edu.teacher2': '記錄學生在內容創作、邏輯設計、模型調用和任務調試過程中的學習數據',
      'edu.teacher3': '通過學習分析與知識圖譜技術開展學習過程診斷和教學效果評估',
      'edu.partner.title': '合作模式',
      'edu.partner1': '教育版授權',
      'edu.partner2': '實驗室共建',
      'edu.partner3': '課程共建',
      'edu.partner4': '師資培訓',
      'edu.partner5': '科研合作',
      'edu.partner6': '私有化部署',
      'cta.kicker': '核心賣點',
      'cta.title': '從提示到可玩遊戲項目',
      'cta.text': '從一個想法到可編輯、可運行、可測試、可發佈的互動作品。',
      'cta.button': '開始對話'
    },
  };

  function translate(lang) {
    const dict = i18n[lang] || i18n.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (dict[key] !== undefined) {
        el.innerHTML = dict[key];
      }
    });
    const titleEl = document.querySelector('title[data-i18n]');
    if (titleEl && dict[titleEl.dataset.i18n] !== undefined) {
      document.title = dict[titleEl.dataset.i18n];
    }
    const metaDesc = document.querySelector('meta[name="description"][data-i18n]');
    if (metaDesc && dict[metaDesc.dataset.i18n] !== undefined) {
      metaDesc.setAttribute('content', dict[metaDesc.dataset.i18n]);
    }
  }

  const langMap = { en: 'en', zh: 'zh-CN', 'zh-hant': 'zh-Hant' };
  const savedLang = localStorage.getItem('arkx-lang') || document.documentElement.dataset.locale || 'en';
  document.documentElement.dataset.locale = savedLang;
  document.documentElement.lang = langMap[savedLang] || 'en';

  const langState = { current: savedLang };
  document.querySelectorAll('[data-lang]').forEach((button) => {
    if (button.dataset.lang === savedLang) button.classList.add('is-active');
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-lang]').forEach((item) => item.classList.remove('is-active'));
      button.classList.add('is-active');
      langState.current = button.dataset.lang;
      document.documentElement.dataset.locale = langState.current;
      document.documentElement.lang = langMap[langState.current] || 'en';
      localStorage.setItem('arkx-lang', langState.current);
      translate(langState.current);
      closeMobileMenu();
    });
  });

  if (savedLang !== 'en') translate(savedLang);
})();
