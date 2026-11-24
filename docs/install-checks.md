# Local Install Verification Commands

All executed checks use isolated scratch directories under gitignored `.cache/` so global user settings remain untouched.

## Claude Code (`untested` — `claude` CLI not on `PATH`)

```bash
# Validate catalog and plugin
claude plugin validate ./

# Add local marketplace and install plugin
claude plugin marketplace add ./
claude plugin install prompt-engineering@agent-plugin-marketplace --scope local

# Confirm plugin and skills are listed
claude plugin list

# Session-only test without installing
claude --plugin-dir ./plugins/prompt-engineering
```

## Google Antigravity (`passed` in scratch `HOME`)

```bash
# Validate installable plugin and educational example (passes with expected warning on shadowed portable root plugin.json)
agy plugin validate ./plugins/prompt-engineering
agy plugin validate ./examples/build-an-agent-plugin

# Strict validation (exits 1 as documented in multi-tool repos due to shadowed root plugin.json)
agy plugin validate --strict ./plugins/prompt-engineering

# Isolated local bulk marketplace install & list check (installs plugins/ only; excludes examples/)
HOME="$PWD/.cache/scratch-agy" agy plugin install .
HOME="$PWD/.cache/scratch-agy" agy plugin list --json
```

## GitHub Copilot CLI

```bash
# Isolated marketplace add, plugin install, and list check
COPILOT_HOME="$PWD/.cache/scratch-copilot" COPILOT_CACHE_HOME="$PWD/.cache/scratch-copilot-cache" \
  copilot plugin marketplace add "$PWD"
COPILOT_HOME="$PWD/.cache/scratch-copilot" COPILOT_CACHE_HOME="$PWD/.cache/scratch-copilot-cache" \
  copilot plugin install prompt-engineering@agent-plugin-marketplace
COPILOT_HOME="$PWD/.cache/scratch-copilot" COPILOT_CACHE_HOME="$PWD/.cache/scratch-copilot-cache" \
  copilot plugin list --json
```
