#!/usr/bin/env bash
set -euo pipefail
incoming="${1:?Pass the private staging directory}"
release_id="${2:?Pass the release ID}"
[[ "$incoming" =~ ^/tmp/transport-frontend\.[a-zA-Z0-9]+$ && "$release_id" =~ ^[a-zA-Z0-9._-]{1,80}$ ]]
[[ "$EUID" -eq 0 ]] || { echo 'Frontend activation requires root' >&2; exit 1; }
# Also serialize direct operator releases, not only GitHub workflow runs.
exec 9>/var/lock/transport-platform-deploy.lock
flock -w 300 9 || { echo 'Another Transport deployment holds the host lock' >&2; exit 1; }
nginx -t
python3 - "$incoming/frontend.tar.gz" <<'PY'
import sys, tarfile
from pathlib import PurePosixPath
with tarfile.open(sys.argv[1]) as archive:
    for entry in archive:
        path = PurePosixPath(entry.name)
        if path.is_absolute() or '..' in path.parts or not (entry.isdir() or entry.isfile()):
            raise SystemExit('Unsafe frontend archive entry')
PY
releases=/var/www/transport-platform-releases
web=/var/www/transport-platform
release="$releases/$release_id"
[[ ! -e "$release" ]] || { echo 'Release ID already exists; choose a fresh deployment ID' >&2; exit 1; }
install -d -m 755 "$releases" "$release"
tar --no-same-owner --no-same-permissions -xzf "$incoming/frontend.tar.gz" -C "$release"
[[ -s "$release/index.html" && -s "$release/release.json" ]]
chown -R root:root "$release"
find "$release" -type d -exec chmod 755 {} +
find "$release" -type f -exec chmod 644 {} +
# Convert a legacy static directory once; all subsequent releases switch atomically.
if [[ -d "$web" && ! -L "$web" ]]; then
  mv "$web" "$releases/legacy-$release_id"
  ln -s "$releases/legacy-$release_id" "$web"
fi
previous=''
if [[ -e "$web" || -L "$web" ]]; then
  previous="$(readlink -f "$web")"
  [[ "$previous" == "$releases/"* && -s "$previous/index.html" ]] || { echo 'Unexpected previous web root' >&2; exit 1; }
  ln -sfn "$previous" "$web.previous.next"
  mv -Tf "$web.previous.next" "$web.previous"
fi
ln -s "$release" "$web.next"
mv -Tf "$web.next" "$web"
echo "Frontend release $release_id activated."
