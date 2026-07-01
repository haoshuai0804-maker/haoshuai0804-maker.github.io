(function () {
  const body = document.body;
  const header = document.querySelector('.site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelectorAll('.nav-link, .footer-links a[href^="#"], .header-actions a[href^="#"], .product-tile[href^="#"], .btn[href^="#"]');
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

  const HERO_VIDEO_DESKTOP = 'video/XGE_AI_mobile.mp4';
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
      'hero.lede': 'Arkx is building a Creator OS for a new generation of AI-era creators \u2014 a lighter, faster way to turn stories, characters, scenes, gameplay and emotions into interactive digital works.',
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
      'creatorOS.text': 'For years, turning an idea into a digital work required complex tools, specialist teams, asset budgets and long production cycles. AI changes the route. Generation, composition, interaction and publishing can now become lighter, faster and more open.',
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
      'why.speed.text': 'Creators do not need heavier workflows for early validation. XCE AI is designed for shorter paths from idea to demo, vertical slice and shareable build.',
      'why.access.title': 'Lower the production threshold.',
      'why.access.text': 'AI helps users generate and organize 2D/3D assets, scenes, UI, effects, voices and music, while the editor keeps everything editable.',
      'why.context.title': 'AI understands the project, not just the prompt.',
      'why.context.text': 'The system can read project structure, assets, scripts and scene objects, then continue generation or modification from the current context.',
      'why.publish.title': 'Build inside real ecosystems.',
      'why.publish.text': 'XCE AI supports visual editing, multi-platform export, independent publishing, community assets and ongoing iteration after user feedback.',
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
      'contact.text': 'Reach out to explore partnerships, early access, or enterprise interactive content projects.',
      'contact.cta': 'View commercialization paths',
      'footer.tagline': 'Arks Creative \u00B7 所象 \u2014 Imagination, Made Real.',
      'footer.about': 'About',
      'footer.products': 'Products',
      'footer.contact': 'Contact',
      'phero.eyebrow': 'Arkx Product System',
      'phero.title': 'Prompt to playable, editable, publishable projects.',
      'phero.lede': 'XCE AI is an AI-native creation system that embeds AI into the core production chain of games and interactive short dramas \u2014 from ideas, assets, logic and audiovisual content to testing, tuning, feedback and release.',
      'phero.cta.primary': 'View product core',
      'phero.cta.secondary': 'Business outlook',
      'console.title': 'XCE AI / Build Console',
      'console.line1': '\u201CCreate an interactive cyber-school mystery with 3 endings.\u201D',
      'console.line2': 'assets \u2192 scenes \u2192 dialogue \u2192 events \u2192 tests \u2192 publish',
      'console.line3': 'playable project generated \u00B7 editable in workspace',
      'xce.kicker': 'Xrafts Contents Editor',
      'xce.title': 'XCE AI \u2014 the AI-native workspace for playable content.',
      'xce.text': 'It is not a traditional game editor, not a single-format generation tool, and not another traffic-heavy closed platform. It is a lightweight interactive creation workbench for turning stories, characters, scenes, gameplay and expression into playable, publishable and continuously iterated digital works.',
      'xce.panel': 'Public baseline',
      'xce.panelText': 'C++ editor \u00B7 no-code \u00B7 visual events \u00B7 TypeScript API \u00B7 multi-platform publishing',
      'xce.subtitle': 'AI is not bolted on. It is inside the creation chain.',
      'xce.subtext': 'XCE AI uses AI to generate and organize 2D/3D assets, characters, actions, CG animation, effects, music, voice, game logic, automated tests, tuning suggestions and feedback analysis.',
      'xce.list1': 'Generate editable assets into the project asset system.',
      'xce.list2': 'Transform natural language into XCE AI DSL, events and components.',
      'xce.list3': 'Use AI player agents to test flows, interactions and balance.',
      'xce.list4': 'Ship playable works instead of disconnected generated files.',
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
      'markets.kicker': 'Commercialization',
      'markets.title': 'From creator subscriptions to education, UGC markets and enterprise production.',
      'markets.text': 'XCE AI uses AI to lower the creation threshold, an editable project environment to carry playable works, UGC to scale supply, and publishing mechanisms to support sustained commercialization.',
      'markets.card1.title': 'Creator Subscription',
      'markets.card1.text': 'Subscriptions, AI rendering credits, advanced templates, asset packs and publishing tools for individuals, students and indie creators.',
      'markets.card2.title': 'UGC Asset Market',
      'markets.card2.text': 'Templates, characters, UI kits, effects, scripts, prompts, workflows and tutorial projects with platform revenue share.',
      'markets.card3.title': 'Education',
      'markets.card3.text': 'STEAM, game design, vocational education, AI creation camps and digital media courses based on project-based learning.',
      'markets.card4.title': 'Enterprise Interactive Content',
      'markets.card4.text': 'Brand mini-games, interactive dramas, event experiences, launch demos, simulations, training games and IP collaboration content.',
      'markets.card5.title': 'Small Studio Productivity',
      'markets.card5.text': 'Vertical slices, pitch demos, Steam page materials, concept assets, whitebox levels, balance tests and entertainment MVPs.',
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
      'hero.lede': 'Arkx（所象）正在构建面向 AI 时代新创作者的 Creator OS\u2014\u2014一种更轻、更快的方式，将故事、角色、场景、玩法和情感转化为可互动的数字作品。',
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
      'creatorOS.text': '多年来，将一个想法变成数字作品需要复杂工具、专业团队、素材预算和漫长的开发周期。AI 正在改变这一切。生成、组合、交互和发布正变得更轻、更快、更开放。',
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
      'why.speed.text': '创作者不需要更重的工作流来验证早期想法。XCE AI 致力于缩短从想法到演示、垂直切片和可分享构建的路径。',
      'why.access.title': '降低创作门槛',
      'why.access.text': 'AI 帮助用户生成和组织 2D/3D 资产、场景、UI、特效、配音和音乐，同时编辑器保持一切可编辑。',
      'why.context.title': 'AI 理解项目，而不仅仅是提示词',
      'why.context.text': '系统可以读取项目结构、资产、脚本和场景对象，基于当前工程上下文继续生成或修改。',
      'why.publish.title': '在真实生态中构建',
      'why.publish.text': 'XCE AI 支持可视化编辑、多平台导出、独立发布、社区资产和基于用户反馈的持续迭代。',
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
      'contact.text': '欢迎联系我们，探讨合作、早期体验或企业互动内容项目。',
      'contact.cta': '查看商业化路径',
      'footer.tagline': 'Arks Creative \u00B7 所象 \u2014 想象，从此具象。',
      'footer.about': '关于',
      'footer.products': '产品',
      'footer.contact': '联系',
      'phero.eyebrow': 'Arkx 产品体系',
      'phero.title': '从提示到可玩、可编辑、可发布的项目',
      'phero.lede': 'XCE AI 是一个 AI 原生创作系统，将 AI 深度嵌入游戏和互动短剧的核心生产链路\u2014\u2014从创意、资产、逻辑和视听内容，到测试、调优、反馈和发布。',
      'phero.cta.primary': '查看产品核心',
      'phero.cta.secondary': '商业展望',
      'console.title': 'XCE AI / 构建控制台',
      'console.line1': '\u201C创建一个包含 3 个结局的互动校园悬疑故事。\u201D',
      'console.line2': '资产 \u2192 场景 \u2192 对话 \u2192 事件 \u2192 测试 \u2192 发布',
      'console.line3': '可玩项目已生成 \u00B7 可在工作区中编辑',
      'xce.kicker': 'Xrafts Contents Editor',
      'xce.title': 'XCE AI\u2014\u2014面向可玩内容的 AI 原生 工作台',
      'xce.text': '它不是传统的游戏编辑器，不是单一格式的生成工具，也不是另一个依赖巨大流量的封闭平台。它是一款轻量级互动创作工作台，将故事、角色、场景、玩法和表达转化为可体验、可发布、可持续迭代的数字作品。',
      'xce.panel': '公开基线',
      'xce.panelText': 'C++ 编辑器 \u00B7 无代码 \u00B7 可视化事件 \u00B7 TypeScript API \u00B7 多平台发布',
      'xce.subtitle': 'AI 不是外挂，而是嵌入创作链。',
      'xce.subtext': 'XCE AI 使用 AI 生成和组织 2D/3D 资产、角色、动作、CG 动画、特效、音乐、配音、游戏逻辑、自动化测试、调优建议和反馈分析。',
      'xce.list1': '将可编辑资产生成到项目资产系统中。',
      'xce.list2': '将自然语言转换为 XCE AI DSL、事件和组件。',
      'xce.list3': '使用 AI 玩家 Agent 测试流程、交互和平衡性。',
      'xce.list4': '发布可玩作品，而非零散生成的文件。',
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
      'markets.kicker': '商业化',
      'markets.title': '从创作者订阅到教育、UGC 市场和 企业生产',
      'markets.text': 'XCE AI 用 AI 降低创作门槛，用可编辑工程承载可玩作品，用 UGC 扩大内容供给，用发布机制实现持续商业化。',
      'markets.card1.title': '创作者订阅',
      'markets.card1.text': '面向个人、独立开发者、学生和爱好者的订阅、AI 渲染点数、高级模板包、资产包和发布工具。',
      'markets.card2.title': 'UGC 资产市场',
      'markets.card2.text': '模板、角色、UI 套件、特效、脚本、提示词、工作流和教程项目，平台参与分成。',
      'markets.card3.title': '教育',
      'markets.card3.text': '基于项目制学习的 STEAM、游戏设计、职业教育、AI 创作训练营和数字媒体课程。',
      'markets.card4.title': '企业互动内容',
      'markets.card4.text': '品牌小游戏、互动短剧、活动体验、发布演示、模拟、培训游戏和 IP 联名内容。',
      'markets.card5.title': '小型工作室生产力',
      'markets.card5.text': '垂直切片、Pitch 演示、Steam 页面素材、概念资产、白盒关卡、平衡测试和泛娱乐 MVP。',
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
      'hero.lede': 'Arkx（所象）正在構建面向 AI 時代新創作者的 Creator OS\u2014\u2014一種更輕、更快的方式，將故事、角色、場景、玩法和情感轉化爲可互動的數字作品。',
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
      'creatorOS.text': '多年來，將一個想法變成數字作品需要複雜工具、專業團隊、素材預算和漫長的開發週期。AI 正在改變這一切。生成、組合、交互和發佈正變得更輕、更快、更開放。',
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
      'why.speed.text': '創作者不需要更重的工作流來驗證早期想法。XCE AI 致力於縮短從想法到演示、垂直切片和可分享構建的路徑。',
      'why.access.title': '降低創作門檻',
      'why.access.text': 'AI 幫助用戶生成和組織 2D/3D 資產、場景、UI、特效、配音和音樂，同時編輯器保持一切可編輯。',
      'why.context.title': 'AI 理解項目，而不僅僅是提示詞',
      'why.context.text': '系統可以讀取項目結構、資產、腳本和場景對象，基於當前工程上下文繼續生成或修改。',
      'why.publish.title': '在真實生態中構建',
      'why.publish.text': 'XCE AI 支持可視化編輯、多平臺導出、獨立發佈、社區資產和基於用戶反饋的持續迭代。',
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
      'contact.text': '歡迎聯繫我們，探討合作、早期體驗或企業互動內容項目。',
      'contact.cta': '查看商業化路徑',
      'footer.tagline': 'Arks Creative \u00B7 所象 \u2014 想象，從此具象。',
      'footer.about': '關於',
      'footer.products': '產品',
      'footer.contact': '聯繫',
      'phero.eyebrow': 'Arkx 產品體系',
      'phero.title': '從提示到可玩、可編輯、可發佈的項目',
      'phero.lede': 'XCE AI 是一個 AI 原生創作系統，將 AI 深度嵌入遊戲和互動短劇的核心生產鏈路\u2014\u2014從創意、資產、邏輯和視聽內容，到測試、調優、反饋和發佈。',
      'phero.cta.primary': '查看產品核心',
      'phero.cta.secondary': '商業展望',
      'console.title': 'XCE AI / 構建控制檯',
      'console.line1': '\u201C創建一個包含 3 個結局的互動校園懸疑故事。\u201D',
      'console.line2': '資產 \u2192 場景 \u2192 對話 \u2192 事件 \u2192 測試 \u2192 發佈',
      'console.line3': '可玩項目已生成 \u00B7 可在工作區中編輯',
      'xce.kicker': 'Xrafts Contents Editor',
      'xce.title': 'XCE AI\u2014\u2014面向可玩內容的 AI 原生 工作臺',
      'xce.text': '它不是傳統的遊戲編輯器，不是單一格式的生成工具，也不是另一個依賴巨大流量的封閉平臺。它是一款輕量級互動創作工作臺，將故事、角色、場景、玩法和表達轉化爲可體驗、可發佈、可持續迭代的數字作品。',
      'xce.panel': '公開基線',
      'xce.panelText': 'C++ 編輯器 \u00B7 無代碼 \u00B7 可視化事件 \u00B7 TypeScript API \u00B7 多平臺發佈',
      'xce.subtitle': 'AI 不是外掛，而是嵌入創作鏈。',
      'xce.subtext': 'XCE AI 使用 AI 生成和組織 2D/3D 資產、角色、動作、CG 動畫、特效、音樂、配音、遊戲邏輯、自動化測試、調優建議和反饋分析。',
      'xce.list1': '將可編輯資產生成到項目資產系統中。',
      'xce.list2': '將自然語言轉換爲 XCE AI DSL、事件和組件。',
      'xce.list3': '使用 AI 玩家 Agent 測試流程、交互和平衡性。',
      'xce.list4': '發佈可玩作品，而非零散生成的文件。',
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
      'markets.kicker': '商業化',
      'markets.title': '從創作者訂閱到教育、UGC 市場和 企業生產',
      'markets.text': 'XCE AI 用 AI 降低創作門檻，用可編輯工程承載可玩作品，用 UGC 擴大內容供給，用發佈機制實現持續商業化。',
      'markets.card1.title': '創作者訂閱',
      'markets.card1.text': '面向個人、獨立開發者、學生和愛好者的訂閱、AI 渲染點數、高級模板包、資產包和發佈工具。',
      'markets.card2.title': 'UGC 資產市場',
      'markets.card2.text': '模板、角色、UI 套件、特效、腳本、提示詞、工作流和教程項目，平臺參與分成。',
      'markets.card3.title': '教育',
      'markets.card3.text': '基於項目制學習的 STEAM、遊戲設計、職業教育、AI 創作訓練營和數字媒體課程。',
      'markets.card4.title': '企業互動內容',
      'markets.card4.text': '品牌小遊戲、互動短劇、活動體驗、發佈演示、模擬、培訓遊戲和 IP 聯名內容。',
      'markets.card5.title': '小型工作室生產力',
      'markets.card5.text': '垂直切片、Pitch 演示、Steam 頁面素材、概念資產、白盒關卡、平衡測試和泛娛樂 MVP。',
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
