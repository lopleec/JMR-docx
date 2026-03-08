(() => {
  const THEME_KEY = 'jmr-docs-theme'; // system | light | dark

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
    btn.className = 'theme-toggle';
    btn.type = 'button';
    btn.addEventListener('click', () => {
      const current = getStoredTheme();
      setTheme(nextTheme(current));
    });
    document.body.appendChild(btn);
    updateThemeBtn(getStoredTheme());
  };

  // init theme
  setTheme(getStoredTheme());
  mountThemeButton();

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
      el.classList.add('copied');
      setTimeout(() => {
        el.textContent = old;
        el.classList.remove('copied');
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
