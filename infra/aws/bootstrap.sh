#!/usr/bin/env bash
# Runs as root from EC2 cloud-init once. See docs/deploy-aws.md for safety rules.
set -euo pipefail
if [[ "$(id -u)" -ne 0 ]]; then
  echo "bootstrap.sh requires root (EC2 UserData)." >&2
  exit 1
fi

dnf install -y docker git curl openssl
systemctl enable --now docker

# Install a pinned Compose v2 plugin; validate its checksum from the release.
COMPOSE_VERSION="v2.40.3"
PLUGIN_DIR="/usr/local/lib/docker/cli-plugins"
mkdir -p "$PLUGIN_DIR"
mkdir -p /tmp/weatherwear-compose-install
cd /tmp/weatherwear-compose-install
curl -fSL --retry 4 "https://github.com/docker/compose/releases/download/$COMPOSE_VERSION/docker-compose-linux-x86_64" -o docker-compose-linux-x86_64
curl -fSL --retry 4 "https://github.com/docker/compose/releases/download/$COMPOSE_VERSION/docker-compose-linux-x86_64.sha256" -o docker-compose-linux-x86_64.sha256
sha256sum -c docker-compose-linux-x86_64.sha256
install -m 0755 docker-compose-linux-x86_64 "$PLUGIN_DIR/docker-compose"
docker compose version

# A free-tier micro EC2 host has little RAM. Swap prevents transient build OOM.
# Swap is on the encrypted gp3 root EBS volume; it is NOT free extra RAM.
if ! swapon --show=NAME --noheadings | grep -qx /swapfile; then
  if [[ ! -f /swapfile ]]; then
    dd if=/dev/zero of=/swapfile bs=1M count=3072 status=none
    chmod 600 /swapfile
    mkswap /swapfile
  fi
  swapon /swapfile
  if ! grep -q '^/swapfile ' /etc/fstab; then
    printf '/swapfile none swap sw 0 0\n' >> /etc/fstab
  fi
fi

cd /opt/weatherwear
umask 077
# DB password is generated on the instance, not inserted into CloudFormation
# parameters, GitHub, UserData, console output or a public repo.
if [[ ! -s .env ]]; then
  printf 'POSTGRES_PASSWORD=%s\nAPP_PORT=80\n' "$(openssl rand -hex 24)" > .env
  chmod 600 .env
fi

docker compose \
  -f docker-compose.yml \
  -f infra/aws/docker-compose.aws.yml \
  up --build -d

# Fail and leave a diagnostic log when the application cannot talk to Postgres.
healthy=false
for attempt in $(seq 1 90); do
  if curl -fsS --max-time 5 http://127.0.0.1/api/health >/dev/null; then
    healthy=true
    break
  fi
  sleep 5
done

docker compose -f docker-compose.yml -f infra/aws/docker-compose.aws.yml \
  ps > /var/log/weatherwear-compose-status.log || true
docker compose -f docker-compose.yml -f infra/aws/docker-compose.aws.yml \
  logs --no-color --tail=100 > /var/log/weatherwear-compose.log || true

if [[ "$healthy" != true ]]; then
  echo "WeatherWear failed /api/health. Check /var/log/weatherwear-compose.log" >&2
  exit 1
fi
echo "WeatherWear health check passed."
