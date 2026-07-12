$p = Get-Process steam -ErrorAction SilentlyContinue
if ($p) {
    Write-Host "Steam is running"
    $modules = $p.Modules | Select-Object ModuleName, FileName
    $stModules = $modules | Where-Object { $_.ModuleName -match 'dwmapi|OpenSteam|version' }
    foreach ($m in $stModules) {
        Write-Host "Loaded: $($m.FileName)"
    }
} else {
    Write-Host "Steam is NOT running"
}
