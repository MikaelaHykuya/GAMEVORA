$ErrorActionPreference = "Stop"
Add-MpPreference -ExclusionPath 'C:\Program Files (x86)\Steam'
Add-MpPreference -ExclusionPath "$env:TEMP\OpenSteamTool-Release.zip"
Add-MpPreference -ExclusionPath "$env:TEMP\OpenSteamTool"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Berhasil memasukkan Steam ke Pengecualian (Exclusions)" -ForegroundColor Green
Write-Host "Windows Defender tidak akan menghapus Steamtools lagi." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Jendela ini akan tertutup otomatis dalam 5 detik..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
