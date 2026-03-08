# 识图问题复盘（2026-03-08）

## 现象
- 你确认所用 API 本身支持图片识别。
- 但助手侧调用 `image` 工具时报错，表现为：
  - `Model does not support images: jmr/gpt-5.3-codex`
  - 或 fallback 到 `openai/gpt-5-mini` 超时。

## 根因
- OpenClaw 的模型注册里，`jmr/gpt-5.3-codex` 被声明成了“仅文本输入”。
- 因此在工具层会先被能力校验拦截（还没真正把图片送到模型）。
- 同时默认 `imageModel` 未正确指向当前可用 provider/model，导致尝试走 fallback。

## 排查过程（关键证据）
- `openclaw models list --json` 初始只显示文本能力（无 image）。
- 强制调用 `image(model='jmr/gpt-5.3-codex')` 返回不支持图片。
- 代码路径中存在能力校验：若 model input 不含 image，则直接拒绝。

## 修复动作
1. 修改 `~/.openclaw/openclaw.json` 中的模型能力声明：
   - 将 `jmr/gpt-5.3-codex` 的 `input` 改为包含 `image`（例如 `['text','image']`）。
2. 将默认图片模型指向该模型：
   - `agents.defaults.imageModel = 'jmr/gpt-5.3-codex'`
3. 重新加载/重启后复测。

## 复测结果
- `openclaw models list --json` 显示：`input: text+image`，并带 `image` 标签。
- 实测 `image` 工具对实际截图识别成功（可正确识别 Apple Mac 页面）。

## 当前状态
- 识图链路已恢复可用。
- 你后续可直接发图进行识别（注意：iMessage 当前有“只传占位符不传附件”的通道问题，这和模型识图能力是两件事）。

## 建议（避免复发）
- 每次升级/迁移后跑一次：
  - `openclaw models list --json`（确认目标模型有 image 输入能力）
  - 用 `image` 工具做一张样图冒烟测试。
- 若切 provider/model，同步检查 `agents.defaults.imageModel` 是否仍有效。
