# Local Install Verification Commands

Recorded during Phase 6 verification on `2026-11-24`. All executed checks used isolated scratch directories under gitignored `.cache/` so global user settings were untouched.

## Claude Code (`untested` — `claude` CLI not on `PATH`)

```bash
# Validate catalog and plugin
claude plugin validate ./

# Add local marketplace and install example plugin
claude plugin marketplace add ./
claude plugin install build-an-agent-plugin@agent-plugin-marketplace --scope local

# Confirm plugin and skill are listed
claude plugin list
# Inside a session, type `/` to verify `/build-an-agent-plugin:build-an-agent-plugin`

# Session-only test without installing
claude --plugin-dir ./plugins/build-an-agent-plugin
```

## Google Antigravity (`passed` in scratch `HOME`)

```bash
# Validate plugin (passes with expected warning on shadowed portable root plugin.json)
agy plugin validate ./plugins/build-an-agent-plugin

# Strict validation (exits 1 as documented in multi-tool repos due to shadowed root plugin.json)
agy plugin validate --strict ./plugins/build-an-agent-plugin

# Isolated local install & list check
HOME="$PWD/.cache/scratch-agy" agy plugin install ./plugins/build-an-agent-plugin
HOME="$PWD/.cache/scratch-agy" agy plugin list --json
```

## GitHub Copilot CLI (`passed` in scratch `COPILOT_HOME`)

```bash
# Isolated marketplace add, plugin install, and list check
COPILOT_HOME="$PWD/.cache/scratch-copilot" COPILOT_CACHE_HOME="$PWD/.cache/scratch-copilot-cache" \
  copilot plugin marketplace add "$PWD"
COPILOT_HOME="$PWD/.cache/scratch-copilot" COPILOT_CACHE_HOME="$PWD/.cache/scratch-copilot-cache" \
  copilot plugin install build-an-agent-plugin@agent-plugin-marketplace
COPILOT_HOME="$PWD/.cache/scratch-copilot" COPILOT_CACHE_HOME="$PWD/.cache/scratch-copilot-cache" \
  copilot plugin list --json
```
