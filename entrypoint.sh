#!/bin/sh
if [ "$1" = "--auth" ]; then
  # Run auth command
  exec bun --use-system-ca run dist/main.js auth
else
  # Default command
  exec bun --use-system-ca run dist/main.js start --host 0.0.0.0 -g "$GH_TOKEN" "$@"
fi

