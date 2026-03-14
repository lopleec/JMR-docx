(() => {
  const THEME_KEY = 'jmr-docs-theme';

  const getStoredTheme = () => localStorage.getItem(THEME_KEY) || 'system';
  const setTheme = (theme) => {
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    localStorage.setItem(THEME_KEY, theme);
    updateThemeBtn(theme);
  };

  const updateThemeBtn = (theme) => {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const map = {
      system: '跟随系统',
      light: '浅色模式',
      dark: '深色模式',
    };
    btn.textContent = `主题：${map[theme]}`;
  };

  const nextTheme = (theme) => (theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system');

  const mountThemeButton = () => {
    const btn = document.createElement('button');
    btn.id = 'themeToggle';
    btn.className = 'theme-toggle ui-anim';
    btn.type = 'button';
    btn.addEventListener('click', () => {
      const current = getStoredTheme();
      setTheme(nextTheme(current));
    });
    document.body.appendChild(btn);
    updateThemeBtn(getStoredTheme());
  };

  const currentPath = () => window.location.pathname;

  const mountNavAccordion = () => {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    [...nav.querySelectorAll('a')].forEach((a) => {
      const txt = (a.textContent || '').trim();
      if (txt === '快速开始' || txt === '错误修复') {
        a.classList.add('sub-link');
      }
    });
  };



  const normalizeText = (text) => (text || '').replace(/\s+/g, ' ').trim();

  const headingIdFromText = (text, fallbackIndex) => {
    const safe = normalizeText(text)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '');
    return safe ? `sec-${safe}-${fallbackIndex}` : `sec-${fallbackIndex}`;
  };

  const assignHeadingIds = (doc) => {
    [...doc.querySelectorAll('h1, h2, h3')].forEach((h, idx) => {
      if (h.id) return;
      h.id = headingIdFromText(h.textContent || '', idx + 1);
    });
  };

  const getRootPrefix = () => {
    const path = window.location.pathname;
    if (path.includes('/openclaw/') || path.includes('/models/') || path.includes('/opencode/')) return '../';
    return './';
  };

  const getDocPages = () => [
    'index.html',
    'openclaw/index.html',
    'openclaw/fixes.html',
    'models/index.html',
    'opencode/index.html',
  ];

  const mountSearchUI = () => {
    const wrap = document.createElement('div');
    wrap.className = 'search-wrap';
    wrap.innerHTML = `
      <input id="docSearchInput" class="doc-search" type="search" placeholder="搜索文档关键词" autocomplete="off" />
      <div id="docSearchResults" class="search-results" hidden></div>
    `;
    document.body.appendChild(wrap);

    return {
      input: wrap.querySelector('#docSearchInput'),
      results: wrap.querySelector('#docSearchResults'),
    };
  };

  const buildSearchIndex = async () => {
    const prebuilt = Array.isArray(window.__DOC_SEARCH_INDEX__) ? window.__DOC_SEARCH_INDEX__ : null;
    if (prebuilt && prebuilt.length) return prebuilt;

    const parser = new DOMParser();
    const pages = getDocPages();
    const index = [];

    await Promise.all(
      pages.map(async (rel) => {
        try {
          const href = `${getRootPrefix()}${rel}`;
          const res = await fetch(href);
          if (!res.ok) return;
          const html = await res.text();
          const doc = parser.parseFromString(html, 'text/html');
          assignHeadingIds(doc);

          const pageTitle = normalizeText(doc.querySelector('h1')?.textContent || doc.title || rel);
          let currentAnchor = doc.querySelector('h1, h2, h3')?.id || '';

          doc.querySelectorAll('h1, h2, h3, p, li, pre, td, textarea, label, strong, a').forEach((node) => {
            if (node.matches('h1, h2, h3')) currentAnchor = node.id || currentAnchor;
            const text = normalizeText(node.textContent || '');
            if (!text || text.length < 2) return;
            index.push({ href: rel, pageTitle, anchor: currentAnchor, text });
          });
        } catch {
          // ignore
        }
      })
    );

    return index;
  };

  const mountSearchFeature = async () => {
    const { input, results } = mountSearchUI();
    if (!input || !results) return;

    const index = await buildSearchIndex();

    const hideResults = () => {
      results.classList.remove('show');
      setTimeout(() => {
        results.hidden = true;
        results.innerHTML = '';
      }, 120);
    };

    const showResults = (items, keyword) => {
      if (!items.length) {
        results.innerHTML = `<div class="result-empty">没搜到：${keyword}</div>`;
        results.hidden = false;
        requestAnimationFrame(() => results.classList.add('show'));
        return;
      }

      results.innerHTML = items
        .map((item) => {
          const base = `${getRootPrefix()}${item.href}`;
          const target = item.anchor ? `${base}#${item.anchor}` : base;
          return `<a class="result-item" href="${target}"><span class="result-title">${item.pageTitle}</span><span class="result-snippet">${item.text}</span></a>`;
        })
        .join('');
      results.hidden = false;
      requestAnimationFrame(() => results.classList.add('show'));
    };

    input.addEventListener('input', () => {
      const keyword = normalizeText(input.value).toLowerCase();
      if (!keyword) {
        hideResults();
        return;
      }

      const matches = index
        .filter((item) => item.text.toLowerCase().includes(keyword))
        .sort((a, b) => a.text.length - b.text.length)
        .slice(0, 20);

      showResults(matches, keyword);
    });

    document.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest('.search-wrap')) return;
      hideResults();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hideResults();
    });
  };

  // init theme and heading anchors
  setTheme(getStoredTheme());
  mountThemeButton();
  assignHeadingIds(document);
  mountNavAccordion();
  mountSearchFeature();

  const sidebar = document.getElementById('sidebar');
  const btn = document.getElementById('menuBtn');
  if (sidebar && btn) {
    btn.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (window.innerWidth > 900) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (!sidebar.contains(target) && target.id !== 'menuBtn') sidebar.classList.remove('open');
    });
  }

  const copy = async (text, el) => {
    try {
      await navigator.clipboard.writeText(text);
      const old = el.textContent;
      el.textContent = '已复制';
      el.classList.add('copied', 'pulse');
      setTimeout(() => {
        el.textContent = old;
        el.classList.remove('copied', 'pulse');
      }, 1200);
    } catch {
      alert('复制失败，请手动复制');
    }
  };

  document.querySelectorAll('[data-copy-target]').forEach((b) => {
    b.addEventListener('click', () => {
      const id = b.getAttribute('data-copy-target');
      const target = document.getElementById(id);
      if (!target) return;
      const text = 'value' in target ? target.value : target.textContent || '';
      copy(text, b);
    });
  });

  const apiKeyInput = document.getElementById('apiKeyInput');
  const modelIdInput = document.getElementById('modelIdInput');
  const workspaceInput = document.getElementById('workspaceInput');
  const output = document.getElementById('generatedConfig');

  if (apiKeyInput && modelIdInput && workspaceInput && output) {
    const render = () => {
      const apiKey = (apiKeyInput.value || '⚠️此处填您的API密钥⚠️').trim();
      const modelId = (modelIdInput.value || '⚠️此处填您的模型ID⚠️').trim();
      const workspace = (workspaceInput.value || '⚠️此处填您的OpenClaw工作目录，可在原配置文件中查看⚠️').trim();
      output.value = `{
  "models": {
    "mode": "merge",
    "providers": {
      "jmr": {
        "baseUrl": "https://api.ai.org.kg/v1",
        "apiKey": "${apiKey}",
        "api": "openai-responses",
        "models": [
          {
            "id": "${modelId}",
            "name": "${modelId}",
            "reasoning": true,
            "contextWindow": 200000,
            "maxTokens": 32000
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "jmr/${modelId}"
      },
      "workspace": "${workspace}"
    }
  }
}`;
    };
    [apiKeyInput, modelIdInput, workspaceInput].forEach((i) => i.addEventListener('input', render));
    render();
  }
})();
