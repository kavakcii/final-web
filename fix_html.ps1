$files = @("kap-dump.html", "kap-page.html", "kap-search-debug.html")
foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $newContent = $content.Replace('&#x27;', "'")
        Set-Content $file $newContent
        Write-Host "Processed $file"
    }
}
