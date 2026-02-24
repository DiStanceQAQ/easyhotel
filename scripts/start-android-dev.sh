#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1"
    exit 1
  fi
}

require_command npm
require_command adb
require_command curl

RUNTIME="${ANDROID_RUNTIME:-auto}" # auto | genymotion | studio | connected
TARGET_DEVICE="${1:-${ANDROID_TARGET:-}}"
PREFERRED_SERIAL="${ANDROID_SERIAL:-}"

list_connected_devices() {
  adb devices | awk 'NR>1 && $2=="device" {print $1}'
}

connected_count() {
  list_connected_devices | wc -l | tr -d ' '
}

trim() {
  sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
}

genymotion_first_target() {
  gmtool admin list 2>/dev/null | awk -F'|' 'NR>2 {
    name=$4;
    gsub(/^[[:space:]]+|[[:space:]]+$/, "", name);
    if (name != "") { print name; exit }
  }'
}

genymotion_field_by_target() {
  local target="$1"
  local field="$2"
  gmtool admin list 2>/dev/null | awk -F'|' -v t="$target" -v f="$field" 'NR>2 {
    state=$1; serial=$2; uuid=$3; name=$4;
    gsub(/^[[:space:]]+|[[:space:]]+$/, "", state);
    gsub(/^[[:space:]]+|[[:space:]]+$/, "", serial);
    gsub(/^[[:space:]]+|[[:space:]]+$/, "", uuid);
    gsub(/^[[:space:]]+|[[:space:]]+$/, "", name);
    if (name == t || uuid == t) {
      if (f == "state") print tolower(state);
      if (f == "serial") print serial;
      exit;
    }
  }'
}

start_studio_emulator() {
  require_command emulator
  local avd_name="${TARGET_DEVICE:-${ANDROID_AVD:-}}"
  if [[ -z "$avd_name" ]]; then
    avd_name="$(emulator -list-avds | head -n 1)"
  fi
  if [[ -z "$avd_name" ]]; then
    echo "No Android Studio AVD found."
    exit 1
  fi

  echo "Starting Android Studio emulator: $avd_name"
  nohup emulator -avd "$avd_name" -netdelay none -netspeed full >/tmp/easyhotel-emulator.log 2>&1 &
}

start_genymotion_vm() {
  require_command gmtool
  local target="${TARGET_DEVICE:-}"
  if [[ -z "$target" ]]; then
    target="$(genymotion_first_target)"
  fi
  if [[ -z "$target" ]]; then
    echo "No Genymotion virtual device found. Please create one first."
    exit 1
  fi

  local state
  state="$(genymotion_field_by_target "$target" "state" | tr '[:upper:]' '[:lower:]' | trim || true)"
  if [[ "$state" == "on" ]]; then
    echo "Genymotion device already running: $target"
  else
    echo "Starting Genymotion device: $target"
    gmtool admin start "$target" >/tmp/easyhotel-genymotion.log 2>&1
  fi

  local serial
  serial="$(genymotion_field_by_target "$target" "serial" | trim || true)"
  if [[ -n "$serial" ]]; then
    PREFERRED_SERIAL="$serial"
  fi
}

wait_for_any_device() {
  for _ in $(seq 1 120); do
    if [[ "$(connected_count)" -gt 0 ]]; then
      return 0
    fi
    sleep 1
  done
  return 1
}

ensure_adb_serial() {
  if ! wait_for_any_device; then
    echo "No adb device found. Start your emulator first."
    exit 1
  fi

  if [[ -z "$PREFERRED_SERIAL" ]]; then
    if [[ "$(connected_count)" -gt 1 ]]; then
      echo "Multiple adb devices detected. Please set ANDROID_SERIAL and retry."
      adb devices
      exit 1
    fi
    PREFERRED_SERIAL="$(list_connected_devices | head -n 1 | trim)"
  fi

  if [[ -z "$PREFERRED_SERIAL" ]]; then
    echo "Failed to resolve adb serial."
    exit 1
  fi
}

adb_target() {
  adb -s "$PREFERRED_SERIAL" "$@"
}

wait_boot_completed() {
  local boot_status=""
  for _ in $(seq 1 120); do
    boot_status="$(adb_target shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' | trim || true)"
    if [[ "$boot_status" == "1" ]]; then
      return 0
    fi
    sleep 2
  done
  return 1
}

wait_package_service() {
  for _ in $(seq 1 60); do
    if adb_target shell cmd package list packages >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

if [[ "$(connected_count)" -eq 0 ]]; then
  case "$RUNTIME" in
    genymotion)
      start_genymotion_vm
      ;;
    studio)
      start_studio_emulator
      ;;
    connected)
      echo "No connected device. Please start Genymotion or Android device manually."
      exit 1
      ;;
    auto)
      if command -v gmtool >/dev/null 2>&1 && [[ -n "$(genymotion_first_target)" ]]; then
        start_genymotion_vm
      else
        start_studio_emulator
      fi
      ;;
    *)
      echo "Unsupported ANDROID_RUNTIME: $RUNTIME"
      echo "Allowed values: auto | genymotion | studio | connected"
      exit 1
      ;;
  esac
else
  echo "Android device already connected, skipping device launch."
fi

echo "Waiting for adb device..."
ensure_adb_serial
adb_target wait-for-device

echo "Waiting for Android boot completion on $PREFERRED_SERIAL..."
if ! wait_boot_completed; then
  echo "Android boot timeout for $PREFERRED_SERIAL."
  exit 1
fi

echo "Stabilizing adb connection..."
adb reconnect >/dev/null 2>&1 || true
if ! wait_package_service; then
  echo "Package service not ready, retrying adb reconnect..."
  adb reconnect >/dev/null 2>&1 || true
  if ! wait_package_service; then
    echo "Package service unavailable (possible Broken pipe)."
    exit 1
  fi
fi

echo "Configuring adb reverse on $PREFERRED_SERIAL..."
adb_target reverse tcp:8081 tcp:8081 >/dev/null 2>&1 || true
adb_target reverse tcp:3000 tcp:3000 >/dev/null 2>&1 || true

SERVICE_PID=""
STARTED_SERVICE=0

if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Backend port 3000 is already in use, reusing existing service."
else
  echo "Generating Prisma client..."
  npm run prisma:generate --workspace service >/tmp/easyhotel-prisma.log 2>&1

  echo "Starting backend service..."
  npm run start:dev --workspace service >/tmp/easyhotel-service.log 2>&1 &
  SERVICE_PID=$!
  STARTED_SERVICE=1
fi

cleanup() {
  if [[ "$STARTED_SERVICE" -eq 1 ]] && [[ -n "$SERVICE_PID" ]] && kill -0 "$SERVICE_PID" >/dev/null 2>&1; then
    kill "$SERVICE_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

echo "Waiting for backend health check..."
BACKEND_READY=0
for _ in $(seq 1 90); do
  if curl -fsS "http://127.0.0.1:3000/app/tags" >/dev/null 2>&1; then
    BACKEND_READY=1
    break
  fi
  sleep 1
done

if [[ "$BACKEND_READY" -ne 1 ]]; then
  echo "Backend failed to start. Recent logs:"
  tail -n 120 /tmp/easyhotel-service.log || true
  exit 1
fi

echo "Launching Android app (Expo Dev Client)..."
echo "Tip: keep this terminal open. Press Ctrl+C to stop backend + bundler."
(
  cd app
  npx expo run:android
)
