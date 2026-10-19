#!/usr/bin/env bash
set -euo pipefail

dist="${1:-dist}"

if [[ ! -d "$dist" ]]; then
  echo "Build output '$dist' not found." >&2
  exit 1
fi

patterns=(
  'discord(app)?\.com/api(/v[0-9]+)?/webhooks/[0-9]+/[A-Za-z0-9_-]{20,}'
  'hooks\.slack\.com/services/T[A-Z0-9]+/'
  '[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,}'
  'gsk_[A-Za-z0-9]{20,}'
  'postgres(ql)?://[^"'"'"' ]+:[^"'"'"' ]+@'
  '-----BEGIN [A-Z ]*PRIVATE KEY-----'
  '(DISCORD_BOT_TOKEN|DISCORD_PUBLIC_KEY|SESSION_SECRET|ENCRYPTION_KEY|CRON_SECRET|GROQ_API_KEY|DATABASE_URL)'
)

found=0
for pattern in "${patterns[@]}"; do
  if grep -rEIl -- "$pattern" "$dist" >/dev/null 2>&1; then
    echo "Bundle check failed: content matching '$pattern' found in:" >&2
    grep -rEIl -- "$pattern" "$dist" >&2
    found=1
  fi
done

if find "$dist" -name '*.map' | grep -q .; then
  echo "Bundle check failed: source maps are present in $dist." >&2
  found=1
fi

if [[ $found -ne 0 ]]; then
  exit 1
fi

echo "Bundle check passed: no secrets or source maps in $dist."
