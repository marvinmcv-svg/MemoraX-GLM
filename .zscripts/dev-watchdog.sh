#!/bin/bash
# Dev server watchdog — restarts the Next.js dev server if it dies.
# The sandbox reaps idle background processes; this wrapper detects the exit
# and relaunches immediately so the preview panel stays reachable.
cd /home/z/my-project
while true; do
  echo "[watchdog] starting dev server..."
  ./node_modules/.bin/next dev -p 3000 2>&1 | tee dev.log
  echo "[watchdog] dev server exited (code $?), restarting in 2s..."
  sleep 2
done
