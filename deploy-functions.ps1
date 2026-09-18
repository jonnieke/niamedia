# Nia Media — Deploy all edge functions to Supabase
# Usage: .\deploy-functions.ps1
# Optional: .\deploy-functions.ps1 -Filter "pesapal"  (redeploy only matching functions)
#           .\deploy-functions.ps1 -DryRun             (list what would deploy without deploying)

param(
  [string]$Filter = "",
  [switch]$DryRun
)

$ErrorActionPreference = "Continue"

$functions = @(
  # AI & Campaign Generation
  "generate-campaign",
  "creative-assistant",
  "refine-section",
  "remix-campaign",
  "generate-concept",
  "generate-brief",
  "generate-poster",
  "generate-style-thumb",
  "generate-calendar",
  "generate-schedule",
  "generate-report",
  "generate-video-brief",
  "campaign-research",
  "parse-document",
  "research-url",
  # Nia AI Agent
  "chat-agent",
  "nia-wizard",
  "gemini-live-token",
  # Voice & Audio
  "voice-preview",
  "clone-voice",
  # Payments
  "buy-credits",
  "pesapal-checkout",
  "pesapal-ipn",
  "mpesa-payment",
  # Email & Notifications
  "send-client-email",
  "send-welcome-sequence",
  "process-email-queue",
  "send-weekly-reports",
  "notify-admin",
  "notify-video-request",
  "notify-video-status",
  "send-push-notification",
  "save-push-subscription",
  # WhatsApp & Social
  "whatsapp-webhook",
  "whatsapp-brief-bot",
  "send-broadcast",
  "capture-lead",
  "facebook-oauth",
  "publish-post",
  "schedule-posts",
  # Analytics & Reviews
  "track-share",
  "get-shared-campaign",
  "submit-review",
  "get-campaign-review",
  # Leads & Follow-ups
  "schedule-follow-ups",
  "process-follow-ups",
  # Retainer Billing (Cron)
  "bill-retainers"
)

$targets = if ($Filter) {
  $functions | Where-Object { $_ -like "*$Filter*" }
} else {
  $functions
}

$total   = $targets.Count
$success = 0
$failed  = @()

Write-Host ""
Write-Host "Nia Media - Edge Function Deploy" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Functions to deploy: $total"
if ($DryRun) {
  Write-Host "[DRY RUN - no deploys will happen]" -ForegroundColor Yellow
}
Write-Host ""

$i = 0
foreach ($fn in $targets) {
  $i++
  $pct = [math]::Round(($i / $total) * 100)
  Write-Host "[$i/$total] ($pct%) $fn ... " -NoNewline

  if ($DryRun) {
    Write-Host "SKIP (dry run)" -ForegroundColor Yellow
    $success++
    continue
  }

  npx supabase functions deploy $fn --no-verify-jwt 2>$null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "OK" -ForegroundColor Green
    $success++
  } else {
    Write-Host "FAILED (exit code $LASTEXITCODE)" -ForegroundColor Red
    $failed += $fn
  }
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Done. $success/$total succeeded." -ForegroundColor $(if ($failed.Count -eq 0) { "Green" } else { "Yellow" })

if ($failed.Count -gt 0) {
  Write-Host ""
  Write-Host "Failed functions:" -ForegroundColor Red
  $failed | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
  Write-Host ""
  Write-Host "Retry failed only:" -ForegroundColor Yellow
  Write-Host "  .\deploy-functions.ps1 -Filter `"$($failed[0])`"" -ForegroundColor Yellow
  exit 1
}
