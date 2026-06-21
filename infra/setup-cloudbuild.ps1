# infra/setup-cloudbuild.ps1
# One-time Cloud Build CI/CD setup for aws-exam-site
# Run AFTER pushing the repo to GitHub
#
# Usage: .\infra\setup-cloudbuild.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$PROJECT_ID   = "gen-lang-client-0543160602"
$REGION       = "us-central1"    # Cloud Build connection region
$GITHUB_OWNER = "cyohei9907"
$GITHUB_REPO  = "aws-exam-site"
$CONN_NAME    = "aws-exam-github"
$REPO_NAME    = "aws-exam-site-repo"
$TRIGGER_NAME = "aws-exam-deploy"

# ─── 1. Enable APIs ────────────────────────────────────────────────────────────
Write-Host "`n[1/5] Enabling Cloud Build API..." -ForegroundColor Cyan
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID --quiet
gcloud services enable compute.googleapis.com    --project=$PROJECT_ID --quiet

# ─── 2. Grant IAM to Cloud Build SA ───────────────────────────────────────────
Write-Host "`n[2/5] Granting IAM roles to Cloud Build service account..." -ForegroundColor Cyan
$PROJECT_NUMBER = gcloud projects describe $PROJECT_ID --format="value(projectNumber)"
$CB_SA = "${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
Write-Host "      SA: $CB_SA" -ForegroundColor Gray

# Needed for gcloud compute ssh/scp from Cloud Build to the VM
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:${CB_SA}" `
  --role="roles/compute.instanceAdmin.v1" `
  --quiet | Out-Null

Write-Host "      roles/compute.instanceAdmin.v1 granted" -ForegroundColor Green

# ─── 3. Create GitHub App connection ──────────────────────────────────────────
Write-Host "`n[3/5] Creating Cloud Build GitHub connection..." -ForegroundColor Cyan
Write-Host "      A URL will appear below. Open it in your browser and" -ForegroundColor Yellow
Write-Host "      install/authorize the Cloud Build GitHub App, then press Enter." -ForegroundColor Yellow

gcloud builds connections create github $CONN_NAME `
  --region=$REGION `
  --project=$PROJECT_ID

Write-Host "`n>>> After authorizing the GitHub App in your browser, press Enter to continue..." -ForegroundColor Magenta
[void][System.Console]::ReadLine()

# ─── 4. Link the GitHub repository ────────────────────────────────────────────
Write-Host "`n[4/5] Linking GitHub repository $GITHUB_OWNER/$GITHUB_REPO..." -ForegroundColor Cyan
gcloud builds repositories create $REPO_NAME `
  --remote-uri="https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}" `
  --connection=$CONN_NAME `
  --region=$REGION `
  --project=$PROJECT_ID

# ─── 5. Create trigger ────────────────────────────────────────────────────────
Write-Host "`n[5/5] Creating Cloud Build trigger (push to main)..." -ForegroundColor Cyan
$REPO_RESOURCE = "projects/${PROJECT_ID}/locations/${REGION}/connections/${CONN_NAME}/repositories/${REPO_NAME}"

gcloud builds triggers create github `
  --name=$TRIGGER_NAME `
  --region=$REGION `
  --project=$PROJECT_ID `
  --repository=$REPO_RESOURCE `
  --branch-pattern="^main$" `
  --build-config=cloudbuild.yaml

Write-Host "`n=== Cloud Build CI/CD setup complete ===" -ForegroundColor Green
Write-Host "Every push to 'main' will now:" -ForegroundColor White
Write-Host "  1. Build API (TypeScript) + Web (Vue 3) on Cloud Build" -ForegroundColor Gray
Write-Host "  2. Deploy to /var/www/aws-exam-site on acggs-prod" -ForegroundColor Gray
Write-Host "  3. Restart aws-exam.service (acggs service untouched)" -ForegroundColor Gray
Write-Host "`nView builds: https://console.cloud.google.com/cloud-build/builds?project=$PROJECT_ID" -ForegroundColor Cyan
