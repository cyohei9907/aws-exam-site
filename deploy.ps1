# deploy.ps1 — Deploy aws-exam-site to Compute Engine (acggs-prod)
#
# Usage:
#   .\deploy.ps1         # re-deploy (build + upload + restart)
#   .\deploy.ps1 -Setup  # first-time: create user, dirs, systemd, Caddy config
#                          (run once; subsequent deploys don't need -Setup)
#
# Prerequisites: gcloud CLI authenticated as cyohei9907@gmail.com

param([switch]$Setup)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$INSTANCE = "acggs-prod"
$ZONE     = "asia-northeast1-a"
$PROJECT  = "gen-lang-client-0543160602"
$REMOTE   = "/var/www/aws-exam-site"
$ROOT     = $PSScriptRoot

function SSH([string]$cmd) {
    gcloud compute ssh $INSTANCE --project=$PROJECT --zone=$ZONE --command=$cmd --quiet
    if ($LASTEXITCODE -ne 0) { throw "SSH failed" }
}
function SCP([string]$src, [string]$dst) {
    gcloud compute scp --recurse $src "${INSTANCE}:${dst}" --project=$PROJECT --zone=$ZONE --quiet
    if ($LASTEXITCODE -ne 0) { throw "SCP failed: $src" }
}

# ─── Build locally ────────────────────────────────────────────────────────────
Write-Host "`n==> Building API..." -ForegroundColor Cyan
Push-Location "$ROOT\api"
cmd /c "npm run build"
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "API build failed" }
Pop-Location

Write-Host "==> Building web..." -ForegroundColor Cyan
Push-Location "$ROOT\web"
cmd /c "npm run build"
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Web build failed" }
Pop-Location

# ─── First-time server setup ──────────────────────────────────────────────────
if ($Setup) {
    Write-Host "`n==> [SETUP] Configuring server..." -ForegroundColor Yellow

    SSH "sudo useradd -r -s /usr/sbin/nologin aws-exam 2>/dev/null; sudo mkdir -p $REMOTE/api/dist $REMOTE/web/dist /var/log/aws-exam-site; sudo chown -R aws-exam:aws-exam $REMOTE /var/log/aws-exam-site"

    SCP "$ROOT\infra\aws-exam.service" "/tmp/aws-exam.service"
    SSH "sudo mv /tmp/aws-exam.service /etc/systemd/system/aws-exam.service; sudo chmod 644 /etc/systemd/system/aws-exam.service; sudo systemctl daemon-reload; sudo systemctl enable aws-exam"

    # Append Caddy site block only if not already present, then restart
    SCP "$ROOT\infra\caddy-aws-exam.caddy" "/tmp/caddy-aws-exam.caddy"
    SSH "sudo grep -q '35.243.95.189' /etc/caddy/Caddyfile || (echo '' | sudo tee -a /etc/caddy/Caddyfile > /dev/null; sudo cat /tmp/caddy-aws-exam.caddy | sudo tee -a /etc/caddy/Caddyfile > /dev/null)"
    SSH "sudo touch /var/log/caddy/aws-exam.log; sudo chown caddy:caddy /var/log/caddy/aws-exam.log"
    SSH "sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl restart caddy"
    Write-Host "==> Server setup complete." -ForegroundColor Green
}

# ─── Upload compiled files ────────────────────────────────────────────────────
Write-Host "`n==> Uploading files..." -ForegroundColor Cyan
SSH "mkdir -p /tmp/aws-exam-deploy/api /tmp/aws-exam-deploy/web"

SCP "$ROOT\api\dist"         "/tmp/aws-exam-deploy/api/"
SCP "$ROOT\api\package.json" "/tmp/aws-exam-deploy/api/package.json"
SCP "$ROOT\web\dist"         "/tmp/aws-exam-deploy/web/"

# ─── Install & restart ────────────────────────────────────────────────────────
Write-Host "==> Installing on server & restarting..." -ForegroundColor Cyan

SSH "sudo rsync -a /tmp/aws-exam-deploy/api/dist/ $REMOTE/api/dist/"
SSH "sudo cp /tmp/aws-exam-deploy/api/package.json $REMOTE/api/package.json"
SSH "sudo rsync -a --delete /tmp/aws-exam-deploy/web/dist/ $REMOTE/web/dist/"

# Install production deps on server (generate lockfile there, avoids Windows/Linux mismatch)
SSH "cd $REMOTE/api && sudo npm install --omit=dev --silent"
SSH "sudo chown -R aws-exam:aws-exam $REMOTE; sudo rm -rf /tmp/aws-exam-deploy"
SSH "sudo systemctl restart aws-exam && sleep 2 && sudo systemctl status aws-exam --no-pager"

Write-Host "`nDone!  https://aws.cyohei.net" -ForegroundColor Green
