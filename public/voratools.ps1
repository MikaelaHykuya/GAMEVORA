# ============================================================================
# VoraTools Installer — GAMEVORA
# Automated game plugin installer for Steam (Millennium framework)
# ============================================================================
# Usage (from website):
#   $env:VT_DOWNLOAD_LINK="https://..."; $env:VT_PLUGIN_NAME="game-name"; irm "https://yoursite.com/voratools.ps1" | iex
# ============================================================================

# ---------------------------------------------------------------------------
# Configuration — set via environment variables from website command
# ---------------------------------------------------------------------------
$Script:DownloadLink = $env:VT_DOWNLOAD_LINK
$Script:PluginName   = $env:VT_PLUGIN_NAME
$Script:AppId        = $env:VT_APP_ID

$Script:ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$null = chcp 65001
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Net.Http

# ---------------------------------------------------------------------------
# Locale — Indonesian
# ---------------------------------------------------------------------------
$L = @{
    Title                 = "VoraTools Installer | GAMEVORA"
    SteamRegNotFound      = "Steam tidak ditemukan di registry. Apakah Steam sudah terinstall?"
    SteamKilling          = "Menghentikan Steam..."
    SteamKilled           = "Steam dihentikan"
    SteamtoolsFound       = "Steamtools sudah terinstall"
    SteamtoolsNotFound    = "Steamtools belum terinstall"
    SteamtoolsInstalling  = "Menginstall Steamtools..."
    SteamtoolsInstalled   = "Steamtools berhasil diinstall"
    SteamtoolsRetrying    = "Gagal install Steamtools, mencoba ulang..."
    SteamtoolsFailed      = "Gagal install Steamtools setelah 5 percobaan"
    MillenniumNotFound    = "Millennium tidak ditemukan"
    MillenniumInstalling  = "Menginstall Millennium..."
    MillenniumInstalled   = "Millennium berhasil diinstall"
    MillenniumAlready     = "Millennium sudah terinstall"
    MillenniumFirstBoot   = "Steam mungkin agak lambat saat pertama kali dibuka — tunggu sebentar."
    PluginUpdating        = "Plugin sudah ada, memperbarui..."
    PluginDownloading     = "Mendownload {0}..."
    PluginDownloadFailed  = "Gagal mendownload {0}"
    PluginExtracting      = "Mengekstrak {0}..."
    PluginExtractFailed   = "Gagal ekstrak, mencoba metode alternatif..."
    PluginInstalled       = "{0} berhasil diinstall!"
    PluginEnabled         = "Plugin diaktifkan"
    RemovingBeta          = "Membersihkan flag beta"
    RemovingCfg           = "Membersihkan steam.cfg"
    RemovingForceX86      = "Membersihkan flag registry ForceX86 (32 bit)"
    StartingSteam         = "Membuka Steam..."
    MissingParams         = "Error: Parameter tidak lengkap. Pastikan kamu menjalankan command yang benar dari website GAMEVORA."
    ErrorTitle            = "VoraTools Installer - ERROR"
    ErrorHeader           = "TERJADI KESALAHAN"
    ErrorBody             = "VoraTools installer menemukan masalah. Hal ini biasanya disebabkan oleh ISP yang memblokir server download."
    ErrorFaq              = "Kunjungi website GAMEVORA atau hubungi admin untuk bantuan."
    ErrorExit             = "Tekan tombol apapun untuk keluar."
    WelcomeBanner         = "GAMEVORA — VoraTools Installer"
}

# ---------------------------------------------------------------------------
# Global error trap
# ---------------------------------------------------------------------------
$Script:OriginalErrorAction = $ErrorActionPreference
$ErrorActionPreference = "Stop"

trap {
    $errMsg = $_.Exception.Message
    $host.UI.RawUI.CursorPosition = @{ X=0; Y=0 }
    $host.UI.RawUI.WindowTitle = $L["ErrorTitle"]
    Clear-Host

    $width = $host.UI.RawUI.WindowSize.Width

    Write-Host ("=" * $width) -ForegroundColor Red
    Write-Host ""

    $header = $L["ErrorHeader"]
    $pad = [Math]::Max(0, [int](($width - $header.Length) / 2))
    Write-Host (" " * $pad) -NoNewline
    Write-Host $header -ForegroundColor Red -BackgroundColor Black
    Write-Host ""

    Write-Host $L["ErrorBody"] -ForegroundColor White
    Write-Host ""

    Write-Host ">>> " -NoNewline -ForegroundColor Yellow
    Write-Host $errMsg -ForegroundColor Gray
    Write-Host $_.InvocationInfo.PositionMessage -ForegroundColor Gray
    Write-Host $_.Exception.StackTrace -ForegroundColor Gray
    Write-Host ""

    Write-Host $L["ErrorFaq"] -ForegroundColor Cyan
    Write-Host ""

    Write-Host ("=" * $width) -ForegroundColor Red
    Write-Host ""

    Write-Host $L["ErrorExit"] -ForegroundColor Yellow
    try { $null = [System.Console]::ReadKey($true) } catch {}

    $ErrorActionPreference = $Script:OriginalErrorAction
    break
}

# ---------------------------------------------------------------------------
# Console helpers
# ---------------------------------------------------------------------------
$Host.UI.RawUI.WindowTitle = $L["Title"]

$LogColors = @{
    "OK"   = "Green"
    "INFO" = "Cyan"
    "ERR"  = "Red"
    "WARN" = "Yellow"
    "LOG"  = "Magenta"
    "AUX"  = "DarkGray"
}

function Write-Log {
    param(
        [ValidateSet("OK","INFO","ERR","WARN","LOG","AUX")]
        [string]$Type,
        [string]$Message,
        [switch]$NoNewline
    )
    $color = $LogColors[$Type]
    $ts = Get-Date -Format "HH:mm:ss"
    if ($NoNewline) {
        Write-Host "`r[$ts] " -ForegroundColor Cyan -NoNewline
        Write-Host "[$Type] $Message" -ForegroundColor $color -NoNewline
    } else {
        Write-Host "[$ts] " -ForegroundColor Cyan -NoNewline
        Write-Host "[$Type] $Message" -ForegroundColor $color
    }
}

function Write-Typing {
    param([string]$Text, [string]$Color = "White", [int]$DelayMs = 15)
    foreach ($char in $Text.ToCharArray()) {
        Write-Host $char -NoNewline -ForegroundColor $Color
        Start-Sleep -Milliseconds $DelayMs
    }
    Write-Host ""
}

function Show-Spinner {
    param([string]$Message, [int]$DurationMs = 1500)
    $chars = @("|", "/", "-", "\")
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $i = 0
    Write-Host "`r[INFO] $Message " -NoNewline -ForegroundColor Cyan
    while ($sw.ElapsedMilliseconds -lt $DurationMs) {
        Write-Host "`b$($chars[$i % 4])" -NoNewline -ForegroundColor Magenta
        $i++
        Start-Sleep -Milliseconds 100
    }
    Write-Host "`b "
}

function Show-Banner {
    $width = $host.UI.RawUI.WindowSize.Width
    Clear-Host
    Write-Host ""
    Write-Host ("=" * $width) -ForegroundColor Magenta
    Write-Host ""

    $banner = $L["WelcomeBanner"]
    $padStr = " " * [Math]::Max(0, [int](($width - $banner.Length) / 2))
    Write-Host $padStr -NoNewline
    Write-Typing -Text $banner -Color "Magenta" -DelayMs 30

    Write-Host ""
    Write-Host ("=" * $width) -ForegroundColor Magenta
    Write-Host ""

    Show-Spinner -Message "Initializing VoraTools Subsystems..." -DurationMs 1200

    if ($Script:PluginName) {
        $pluginDisplay = $Script:PluginName.Substring(0,1).ToUpper() + $Script:PluginName.Substring(1)
        Write-Host "  Game    : " -NoNewline -ForegroundColor DarkGray
        Write-Host $pluginDisplay -ForegroundColor White
    }
    Write-Host "  Engine  : " -NoNewline -ForegroundColor DarkGray
    Write-Host "Millennium + Steamtools" -ForegroundColor White
    Write-Host ""
    Write-Host ("-" * $width) -ForegroundColor DarkGray
    Write-Host ""
}

# ---------------------------------------------------------------------------
# Steam path
# ---------------------------------------------------------------------------
function Get-SteamPath {
    $registries = @(
        "HKLM:\SOFTWARE\WOW6432Node\Valve\Steam",
        "HKLM:\SOFTWARE\Valve\Steam",
        "HKCU:\SOFTWARE\Valve\Steam"
    )

    foreach ($reg in $registries) {
        if (!(Test-Path $reg)) { continue }

        $path = (Get-ItemProperty -Path $reg -Name "InstallPath" -ErrorAction SilentlyContinue).InstallPath
        $potentialExe = Join-Path $path "steam.exe"
        if ((Test-Path $path) -and (Test-Path $potentialExe)) {
            return $path
        }
    }
    Write-Log -Type ERR -Message $L["SteamRegNotFound"]
    throw $L["SteamRegNotFound"]
}

# ---------------------------------------------------------------------------
# Steamtools
# ---------------------------------------------------------------------------
function Test-Steamtools {
    param([string]$SteamPath)
    $required = @("dwmapi.dll", "xinput1_4.dll", "OpenSteamTool.dll")
    $missing = @()
    foreach ($f in $required) {
        if (-not (Test-Path (Join-Path $SteamPath $f))) { $missing += $f }
    }
    if ($missing.Count -gt 0) {
        Write-Log -Type AUX -Message "Steamtools DLLs missing: $($missing -join ', ')"
        return $false
    }
    return $true
}

function Install-Steamtools {
    param([string]$SteamPath)

    Write-Log -Type WARN -Message $L["SteamtoolsInstalling"]

    $tempZip = Join-Path $env:TEMP "OpenSteamTool-Release.zip"
    $extractDir = Join-Path $env:TEMP "OpenSteamTool"

    $urls = @(
        "https://github.com/OpenSteam001/OpenSteamTool/releases/download/1.4.8/OpenSteamTool-1.4.8-Release.zip"
        "https://github.com/OpenSteam001/OpenSteamTool/releases/latest/download/OpenSteamTool-Release.zip"
        "https://ghproxy.net/https://github.com/OpenSteam001/OpenSteamTool/releases/download/1.4.8/OpenSteamTool-1.4.8-Release.zip"
        "https://ghproxy.net/https://github.com/OpenSteam001/OpenSteamTool/releases/latest/download/OpenSteamTool-Release.zip"
        "https://mirror.ghproxy.com/https://github.com/OpenSteam001/OpenSteamTool/releases/download/1.4.8/OpenSteamTool-1.4.8-Release.zip"
        "https://mirror.ghproxy.com/https://github.com/OpenSteam001/OpenSteamTool/releases/latest/download/OpenSteamTool-Release.zip"
    )

    $downloaded = $false
    foreach ($url in $urls) {
        try {
            Write-Log -Type AUX -Message "Downloading Steamtools dari: $url"
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri $url -OutFile $tempZip -UseBasicParsing -TimeoutSec 60
            if ((Test-Path $tempZip) -and ((Get-Item $tempZip).Length -gt 10000)) {
                $downloaded = $true
                break
            }
        } catch {
            Write-Log -Type WARN -Message "Gagal download dari $url, coba mirror lain..."
        }
    }

    if (-not $downloaded) {
        throw $L["SteamtoolsFailed"]
    }

    try {
        if (Test-Path $extractDir) { Remove-Item $extractDir -Recurse -Force -ErrorAction SilentlyContinue }
        $null = New-Item -Path $extractDir -ItemType Directory -Force

        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $zip = [System.IO.Compression.ZipFile]::OpenRead($tempZip)
        $dllFiles = @("dwmapi.dll", "xinput1_4.dll", "OpenSteamTool.dll")
        foreach ($entry in $zip.Entries) {
            $entryName = [System.IO.Path]::GetFileName($entry.FullName)
            if ($entryName -in $dllFiles) {
                $dest = Join-Path $extractDir $entryName
                [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $dest, $true)
                Write-Log -Type AUX -Message "Ekstrak: $entryName"
            }
        }
        $zip.Dispose()
    } catch {
        if ($zip) { $zip.Dispose() }
        try { Expand-Archive -Path $tempZip -DestinationPath $extractDir -Force } catch {}
    }

    foreach ($dll in @("dwmapi.dll", "xinput1_4.dll", "OpenSteamTool.dll")) {
        $src = Join-Path $extractDir $dll
        $dst = Join-Path $SteamPath $dll
        if (Test-Path $src) {
            Copy-Item -Path $src -Destination $dst -Force
            Write-Log -Type AUX -Message "Copy: $dll -> Steam directory"
        }
    }

    Remove-Item $tempZip -ErrorAction SilentlyContinue
    Remove-Item $extractDir -Recurse -Force -ErrorAction SilentlyContinue

    if (Test-Steamtools $SteamPath) {
        Write-Log -Type OK -Message $L["SteamtoolsInstalled"]
    } else {
        throw $L["SteamtoolsFailed"]
    }
}

# ---------------------------------------------------------------------------
# Millennium
# ---------------------------------------------------------------------------
function Test-Millennium {
    param([string]$SteamPath)
    foreach ($f in @("millennium.dll", "python311.dll")) {
        if (-not (Test-Path (Join-Path $SteamPath $f))) { return $false }
    }
    return $true
}

function Install-Millennium {
    param([string]$SteamPath)

    Write-Log -Type INFO -Message $L["MillenniumInstalling"]
    $msUrls = @(
        "https://clemdotla.github.io/millennium-installer-ps1/millennium.ps1"
    )
    $msCode = $null
    foreach ($url in $msUrls) {
        try {
            $msCode = Invoke-RestMethod $url -TimeoutSec 30
            if ($msCode) { break }
        } catch {}
    }
    if (-not $msCode) { throw $L["MillenniumNotFound"] }
    Invoke-Expression "& { $msCode } -NoLog -DontStart -SteamPath '$SteamPath'"

    if (Test-Millennium $SteamPath) {
        Write-Log -Type OK -Message $L["MillenniumInstalled"]
    }
}

# ---------------------------------------------------------------------------
# Plugin install / update
# ---------------------------------------------------------------------------
function Install-Plugin {
    param([string]$SteamPath, [string]$Name, [string]$Link)

    $targetDir = Join-Path $SteamPath "config\stplug-in"
    if (-not (Test-Path $targetDir)) {
        $null = New-Item -Path $targetDir -ItemType Directory -Force
    }

    $safeName = $Name -replace '[^\w\-\. ]', '_'
    $zipPath = Join-Path $env:TEMP "$safeName.zip"

    $ActualLink = $Link
    if ($ActualLink -match "pixeldrain\.com/u/([a-zA-Z0-9_-]+)") {
        $ActualLink = "https://pixeldrain.com/api/file/$($Matches[1])"
        Write-Log -Type AUX -Message "Auto-converting Pixeldrain link to direct download"
    }

    Write-Log -Type LOG -Message ($L["PluginDownloading"] -f $Name)
    Write-Log -Type AUX -Message "URL: $ActualLink"
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        Invoke-WebRequest -Uri $ActualLink -OutFile $zipPath -UseBasicParsing -TimeoutSec 120 -UserAgent $ua
    } catch {
        throw "Download Error dari server: $($_.Exception.Message)"
    }

    if (-not (Test-Path $zipPath)) {
        throw "File ZIP tidak ditemukan setelah didownload dari: $ActualLink"
    }

    Write-Log -Type LOG -Message ($L["PluginExtracting"] -f $Name)

    $hasLua = $false
    $hasManifest = $false
    $pluginAppId = $null
    $manifestCount = 0

    try {
        $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
        
        foreach ($entry in $zip.Entries) {
            if ($entry.FullName.EndsWith('/') -or $entry.FullName.EndsWith('\')) { continue }
            if ($entry.Name -match "\.lua$") {
                $hasLua = $true
                $pluginAppId = [System.IO.Path]::GetFileNameWithoutExtension($entry.Name)
            } elseif ($entry.Name -match "\.manifest$") {
                $hasManifest = $true
                $manifestCount++
            }
        }

        if (-not $hasLua) { throw "Plugin ZIP tidak mengandung file .lua — bukan format Steamtools plugin yang valid." }
        if (-not $hasManifest) { throw "Plugin ZIP tidak mengandung file .manifest — tidak bisa provide license." }

        if ($Script:AppId -and $pluginAppId -and $pluginAppId -ne $Script:AppId) {
            Write-Log -Type WARN -Message "AppId plugin ($pluginAppId) berbeda dengan AppId game ($($Script:AppId)) — mungkin ZIP salah."
        }

        $depotDir1 = Join-Path $SteamPath "config\depotcache"
        $depotDir2 = Join-Path $SteamPath "steamapps\depotcache"
        if (-not (Test-Path $depotDir1)) { New-Item -Path $depotDir1 -ItemType Directory -Force | Out-Null }
        if (-not (Test-Path $depotDir2)) { New-Item -Path $depotDir2 -ItemType Directory -Force | Out-Null }

        foreach ($entry in $zip.Entries) {
            if ($entry.FullName.EndsWith('/') -or $entry.FullName.EndsWith('\')) { continue }
            
            if ($entry.Name -match "\.lua$") {
                $dest = Join-Path $targetDir $entry.Name
                [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $dest, $true)
            } elseif ($entry.Name -match "\.manifest$") {
                $dest0 = Join-Path $targetDir $entry.Name
                $dest1 = Join-Path $depotDir1 $entry.Name
                $dest2 = Join-Path $depotDir2 $entry.Name
                [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $dest0, $true)
                [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $dest1, $true)
                [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $dest2, $true)
            }
        }
        $zip.Dispose()
    } catch {
        if ($zip) { $zip.Dispose() }
        Write-Log -Type WARN -Message $L["PluginExtractFailed"]
        Expand-Archive -Path $zipPath -DestinationPath $targetDir -Force
    }

    if (Test-Path $zipPath) { Remove-Item $zipPath -ErrorAction SilentlyContinue }

    $DisplayName = $Name.Substring(0,1).ToUpper() + $Name.Substring(1)
    Write-Log -Type OK -Message ($L["PluginInstalled"] -f $DisplayName)
    Write-Log -Type AUX -Message "AppId plugin: $pluginAppId | Manifests: $manifestCount file"
}

# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------
function Remove-BetaFlag {
    param([string]$SteamPath)
    $beta = Join-Path $SteamPath "package\beta"
    if (Test-Path $beta) {
        Write-Log -Type AUX -Message $L["RemovingBeta"]
        Remove-Item $beta -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function Remove-ForceX86Flags {
    Write-Log -Type AUX -Message $L["RemovingForceX86"]
    @("HKCU:\Software\Valve\Steam","HKLM:\SOFTWARE\Valve\Steam","HKLM:\SOFTWARE\WOW6432Node\Valve\Steam") | ForEach-Object {
        Remove-ItemProperty -Path $_ -Name "SteamCmdForceX86" -ErrorAction SilentlyContinue
    }
}

function Remove-SteamCfg {
    param([string]$SteamPath)
    $cfg = Join-Path $SteamPath "steam.cfg"
    if (Test-Path $cfg) {
        Write-Log -Type AUX -Message $L["RemovingCfg"]
        Remove-Item $cfg -Force -ErrorAction SilentlyContinue
    }
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
function Main {
    Show-Banner

    # Validate required parameters
    if (-not $Script:DownloadLink -or -not $Script:PluginName) {
        Write-Log -Type ERR -Message $L["MissingParams"]
        Write-Host ""
        Write-Host $L["ErrorExit"] -ForegroundColor Yellow
        try { $null = [System.Console]::ReadKey($true) } catch {}
        return
    }

    $steamPath = Get-SteamPath
    $script:millDir = Join-Path $steamPath "millennium"
    if (-not (Test-Path $millDir)) {
        $null = New-Item -Path $millDir -ItemType Directory -Force
    }

    # Stop Steam
    Write-Log -Type INFO -Message $L["SteamKilling"]
    while (Get-Process steam -ErrorAction SilentlyContinue) {
        Get-Process steam -ErrorAction SilentlyContinue | Stop-Process -Force
        Start-Sleep -Milliseconds 500
    }
    Write-Log -Type OK -Message $L["SteamKilled"]

    # Steamtools
    if (Test-Steamtools $steamPath) {
        Write-Log -Type INFO -Message $L["SteamtoolsFound"]
    } else {
        Write-Log -Type ERR -Message $L["SteamtoolsNotFound"]
        Install-Steamtools $steamPath
    }

    # Millennium
    Install-Millennium $steamPath

    # Plugin
    Install-Plugin $steamPath $Script:PluginName $Script:DownloadLink

    # Cleanup
    Remove-BetaFlag $steamPath
    Remove-SteamCfg $steamPath
    Remove-ForceX86Flags

    # Done
    Write-Host ""
    Write-Log -Type WARN -Message $L["MillenniumFirstBoot"]
    Write-Host ""

    Write-Host "  ============================================" -ForegroundColor Green
    Write-Host "   INSTALASI SELESAI! Game siap dimainkan." -ForegroundColor Green
    Write-Host "   Powered by GAMEVORA" -ForegroundColor DarkGray
    Write-Host "  ============================================" -ForegroundColor Green
    Write-Host ""

    Write-Log -Type INFO -Message $L["StartingSteam"]
    Start-Process -FilePath (Join-Path $steamPath "steam.exe") -WorkingDirectory $steamPath -ArgumentList "-clearbeta"

    if (-not $Script:AppId) {
        Write-Log -Type WARN -Message "VT_APP_ID tidak disertakan — game tidak otomatis ditambahkan ke library."
        Write-Log -Type AUX -Message "Hubungi admin untuk mendapatkan link command yang benar."
    } else {
        Write-Host ""
        Write-Log -Type INFO -Message "Verifikasi file Steamtools..."
        $stDlls = @("dwmapi.dll", "xinput1_4.dll", "OpenSteamTool.dll")
        $stMissing = @()
        foreach ($dll in $stDlls) {
            if (-not (Test-Path (Join-Path $steamPath $dll))) { $stMissing += $dll }
        }
        if ($stMissing.Count -gt 0) {
            Write-Log -Type WARN -Message "Steamtools tidak lengkap! Missing: $($stMissing -join ', ')"
            Write-Log -Type WARN -Message "Kemungkinan diblok antivirus/Windows Defender. Tambahkan folder Steam ke exclusion."
        } else {
            Write-Log -Type OK -Message "Steamtools DLLs lengkap."
        }

        Write-Log -Type INFO -Message "Verifikasi manifest di depotcache..."
        $manifestDir1 = Join-Path $steamPath "config\depotcache"
        $manifestDir2 = Join-Path $steamPath "steamapps\depotcache"
        $manifests = @((Get-ChildItem "$manifestDir1\*.manifest" -ErrorAction SilentlyContinue).Count,
                       (Get-ChildItem "$manifestDir2\*.manifest" -ErrorAction SilentlyContinue).Count)
        Write-Log -Type AUX -Message "Manifests di config\depotcache: $($manifests[0]) file"
        Write-Log -Type AUX -Message "Manifests di steamapps\depotcache: $($manifests[1]) file"

        Write-Log -Type INFO -Message "Menunggu Steam login sepenuhnya..."
        
        $steamReady = $false
        $timeout = 90
        while ($timeout -gt 0) {
            $steamProc = Get-Process steam -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -match "Steam" }
            if ($steamProc -and $steamProc.Responding) {
                $steamReady = $true
                break
            }
            Start-Sleep -Seconds 2
            $timeout -= 2
        }
        
        if (-not $steamReady) {
            Write-Log -Type WARN -Message "Steam tidak terdeteksi dalam 90 detik, mencoba install tetap dijalankan..."
        }
        
        # Ekstra 10 detik untuk memastikan Steamtools selesai hooking lisensi
        Write-Log -Type AUX -Message "Menunggu Steamtools melakukan hook lisensi..."
        Start-Sleep -Seconds 10
        
        Write-Log -Type INFO -Message "Menambahkan game (AppId: $($Script:AppId)) ke library..."
        Write-Log -Type AUX -Message "Jika muncul error 'No licenses' di Steam, kemungkinan:"
        Write-Log -Type AUX -Message "  1. Antivirus memblock Steamtools DLL — tambah exclusion folder Steam"
        Write-Log -Type AUX -Message "  2. Steamtools versi lama — coba update manual dari GitHub"
        Write-Log -Type AUX -Message "  3. Restart laptop lalu jalankan ulang VoraTools"
        for ($attempt = 1; $attempt -le 5; $attempt++) {
            try {
                Start-Process "steam://install/$($Script:AppId)"
                Write-Log -Type OK -Message "Perintah install game dikirim (percobaan $attempt)"
                break
            } catch {
                Write-Log -Type WARN -Message "Gagal mengirim perintah install (percobaan $attempt): $($_.Exception.Message)"
                if ($attempt -lt 5) { Start-Sleep -Seconds 3 }
            }
        }
    }
    
    $ErrorActionPreference = $Script:OriginalErrorAction
}

Main
