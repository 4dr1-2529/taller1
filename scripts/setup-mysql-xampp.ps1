# Configura la base de datos en XAMPP (MySQL)
$mysql = @(
  "C:\xampp\mysql\bin\mysql.exe",
  "C:\Program Files\xampp\mysql\bin\mysql.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $mysql) {
  Write-Host "No se encontro mysql.exe de XAMPP. Inicie MySQL desde el panel de control de XAMPP."
  exit 1
}

Write-Host "Usando: $mysql"
& $mysql -u root -e "CREATE DATABASE IF NOT EXISTS tesis_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if ($LASTEXITCODE -eq 0) {
  Write-Host "Base 'tesis_dashboard' lista."
  Write-Host "Ejecute: npm run db:push && npm run db:seed && npm run db:bootstrap"
} else {
  Write-Host "Error. Verifique que MySQL este iniciado en XAMPP (boton Start en MySQL)."
}
