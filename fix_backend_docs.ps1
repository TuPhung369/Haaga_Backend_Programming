# Script to fix backend files

$destDir = "e:/IT/Haaga_Backend_Programming/TuPhung_Docs/docs"

# Remove incorrect frontend files from backend directory
$incorrectFiles = @(
  "authentication-ui.md",
  "calendar-revised.md",
  "calendar-system.md",
  "chat-system.md",
  "frontend-structure.md",
  "kanban-revised.md",
  "kanban-system.md",
  "language-ai.md",
  "state-management.md",
  "user-interface.md"
)

foreach ($file in $incorrectFiles) {
  $filePath = "$destDir/backend/$file"
  if (Test-Path $filePath) {
    Remove-Item -Path $filePath -Force
    Write-Host "Removed $filePath"
  }
}

# Rename backend files to match the correct naming convention
$renames = @{
  "api-endpoints.md"           = "api.md"
  "authentication.md"          = "auth.md"
  "database-design.md"         = "database.md"
  "project-structure.md"       = "structure.md"
  "user-system.md"             = "user-management.md"
  "websocket-communication.md" = "websockets.md"
}

foreach ($oldName in $renames.Keys) {
  $oldPath = "$destDir/backend/$oldName"
  $newPath = "$destDir/backend/$($renames[$oldName])"
    
  if (Test-Path $oldPath) {
    if (Test-Path $newPath) {
      Remove-Item -Path $newPath -Force
    }
        
    Rename-Item -Path $oldPath -NewName $renames[$oldName]
    Write-Host "Renamed $oldPath to $newPath"
  }
}

Write-Host "Backend files fixed!"