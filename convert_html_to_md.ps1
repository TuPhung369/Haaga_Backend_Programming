# PowerShell script to convert HTML files to Markdown and move them to the TuPhung_Docs directory

# Function to convert HTML to Markdown
function Convert-HtmlToMarkdown {
    param (
        [string]$htmlFilePath,
        [string]$outputDir,
        [string]$relativePath
    )
    
    # Create the output directory if it doesn't exist
    $outputDirPath = Join-Path $outputDir $relativePath
    if (-not (Test-Path $outputDirPath)) {
        New-Item -ItemType Directory -Path $outputDirPath -Force | Out-Null
    }
    
    # Get the filename without extension
    $fileName = [System.IO.Path]::GetFileNameWithoutExtension($htmlFilePath)
    
    # Create the output file path
    $outputFilePath = Join-Path $outputDirPath "$fileName.md"
    
    try {
        # Extract the main content from the HTML file
        $htmlContent = Get-Content -Path $htmlFilePath -Raw
        
        # Extract title from the HTML
        $titleMatch = [regex]::Match($htmlContent, '<title>(.*?)</title>')
        $title = if ($titleMatch.Success) { 
            $titleMatch.Groups[1].Value -replace ' - TuPhung Project Documentation', '' 
        }
        else { 
            $fileName 
        }
        
        # Extract main content
        $mainContentMatch = [regex]::Match($htmlContent, '<main class="main-content">(.*?)</main>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
        $mainContent = if ($mainContentMatch.Success) { $mainContentMatch.Groups[1].Value } else { $htmlContent }
        
        # Extract h1 heading
        $h1Match = [regex]::Match($mainContent, '<h1>(.*?)</h1>')
        $h1 = if ($h1Match.Success) { $h1Match.Groups[1].Value } else { $title }
        
        # Simple HTML to Markdown conversion
        # Remove HTML tags and convert to Markdown
        $mdContent = $mainContent
        
        # Replace headers
        $mdContent = $mdContent -replace '<h1>(.*?)</h1>', '# $1'
        $mdContent = $mdContent -replace '<h2>(.*?)</h2>', '## $1'
        $mdContent = $mdContent -replace '<h3>(.*?)</h3>', '### $1'
        $mdContent = $mdContent -replace '<h4>(.*?)</h4>', '#### $1'
        $mdContent = $mdContent -replace '<h5>(.*?)</h5>', '##### $1'
        $mdContent = $mdContent -replace '<h6>(.*?)</h6>', '###### $1'
        
        # Replace paragraphs
        $mdContent = $mdContent -replace '<p>(.*?)</p>', '$1`n`n'
        
        # Replace links
        $mdContent = $mdContent -replace '<a href="(.*?)">(.*?)</a>', '[$2]($1)'
        
        # Replace lists
        $mdContent = $mdContent -replace '<ul>', ''
        $mdContent = $mdContent -replace '</ul>', ''
        $mdContent = $mdContent -replace '<ol>', ''
        $mdContent = $mdContent -replace '</ol>', ''
        $mdContent = $mdContent -replace '<li>(.*?)</li>', '- $1'
        
        # Replace code blocks
        $mdContent = $mdContent -replace '<pre><code>(.*?)</code></pre>', '```$1```'
        
        # Replace emphasis
        $mdContent = $mdContent -replace '<strong>(.*?)</strong>', '**$1**'
        $mdContent = $mdContent -replace '<em>(.*?)</em>', '*$1*'
        
        # Replace images
        $mdContent = $mdContent -replace '<img src="(.*?)" alt="(.*?)".*?>', '![$2]($1)'
        
        # Remove other HTML tags
        $mdContent = $mdContent -replace '<[^>]+>', ''
        
        # Remove header content
        $mdContent = $mdContent -replace 'Comprehensive overview of the TuPhung Project.*?\.', ''
        
        # Clean up extra whitespace
        $mdContent = $mdContent -replace '\n\s*\n\s*\n', '`n`n'
        
        # Add frontmatter
        $frontMatter = @"
---
sidebar_position: 1
---

# $h1

"@
        
        # Combine frontmatter and content
        $finalContent = $frontMatter + $mdContent
        
        # Write to file
        $finalContent | Out-File -FilePath $outputFilePath -Encoding utf8
        
        Write-Host "Converted $htmlFilePath to $outputFilePath"
        return $true
    }
    catch {
        Write-Host "Error converting $htmlFilePath: $($_.Exception.Message)"
        return $false
    }
}

# Source and destination directories
$sourceDir = "e:/IT/Haaga_Backend_Programming/TuPhung_Project/pages"
$destDir = "e:/IT/Haaga_Backend_Programming/TuPhung_Docs/docs"

# Get all HTML files in the source directory
$htmlFiles = Get-ChildItem -Path $sourceDir -Filter "*.html" -Recurse

# Convert each HTML file to Markdown
foreach ($htmlFile in $htmlFiles) {
    # Get the relative path from the source directory
    $relativePath = $htmlFile.DirectoryName.Substring($sourceDir.Length)
    if ($relativePath.StartsWith("\")) {
        $relativePath = $relativePath.Substring(1)
    }
    
    # Convert the file
    Convert-HtmlToMarkdown -htmlFilePath $htmlFile.FullName -outputDir $destDir -relativePath $relativePath
}

Write-Host "Conversion complete!"