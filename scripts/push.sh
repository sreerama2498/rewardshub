#!/usr/bin/env bash
# =============================================================================
# RewardsHub — Sanity Check + Git Push Script
# Usage: bash scripts/push.sh "commit message"
# Runs: backend tests → frontend lint → frontend build → git commit → git push
# =============================================================================
set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

MSG="${1:-chore: auto-commit after modifications}"
BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          RewardsHub — Sanity Check + Git Push                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📂 Repo   : $REPO_ROOT"
echo "🌿 Branch : $BRANCH"
echo "💬 Message: $MSG"
echo ""

# ─── 1. Backend Tests ──────────────────────────────────────────────────────────
echo "──────────────────────────────────────────────────"
echo "🧪 Step 1/4 — Running backend tests"
echo "──────────────────────────────────────────────────"
PYTHONPATH=backend python3 -m pytest backend/tests/ -q --tb=short
echo "✅ All backend tests passed."
echo ""

# ─── 2. Frontend Lint ─────────────────────────────────────────────────────────
echo "──────────────────────────────────────────────────"
echo "🔍 Step 2/4 — Running frontend lint"
echo "──────────────────────────────────────────────────"
(cd frontend && npm run lint -- --max-warnings 0)
echo "✅ Lint passed — 0 errors, 0 warnings."
echo ""

# ─── 3. Frontend Build ────────────────────────────────────────────────────────
echo "──────────────────────────────────────────────────"
echo "🏗️  Step 3/4 — Building frontend"
echo "──────────────────────────────────────────────────"
(cd frontend && npm run build)
echo "✅ Frontend build successful."
echo ""

# ─── 4. Git Commit & Push ─────────────────────────────────────────────────────
echo "──────────────────────────────────────────────────"
echo "🚀 Step 4/4 — Committing & pushing to origin/$BRANCH"
echo "──────────────────────────────────────────────────"

git add -A

# Only commit if there's something staged
if git diff --cached --quiet; then
  echo "⚠️  Nothing to commit — working tree clean. Push skipped."
else
  git commit -m "$MSG"
  git push origin "$BRANCH"
  COMMIT=$(git rev-parse --short HEAD)
  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║  ✅ PUSHED  commit $COMMIT → origin/$BRANCH"
  echo "╚══════════════════════════════════════════════════════════════╝"
fi
echo ""
