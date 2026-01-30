#!/bin/bash

# apply-youtube-fix.sh
# Automates the fix for YouTube download errors by:
# 1. Updating yt-dlp to the latest version
# 2. Patching server.js to use Android client and Node.js runtime

echo "🚀 Starting YouTube Fix Update..."

# Stop the downloader if running
if [ -f "stop-batch-downloader.sh" ]; then
    echo "🛑 Stopping running services..."
    ./stop-batch-downloader.sh
fi

# Update yt-dlp binary
echo "📥 Updating yt-dlp binary..."
if [ -d "server" ]; then
    cd server
    
    # Back up current yt-dlp just in case
    if [ -f "yt-dlp" ]; then
        mv yt-dlp yt-dlp.bak
    fi
    
    # Download latest release
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp
    chmod a+x yt-dlp
    
    echo "✅ yt-dlp updated to latest version"
    
    # Check version
    ./yt-dlp --version
    
    cd ..
else
    echo "❌ Server directory not found!"
    exit 1
fi

# Patch server.js
echo "🔧 Patching server.js configuration..."
SERVER_JS="server/server.js"
if [ -f "$SERVER_JS" ]; then
    # Create backup
    cp "$SERVER_JS" "$SERVER_JS.bak"
    
    # We'll use a temporary Node.js script to perform the replacement safely
    # This avoids complex sed escaping issues with multi-line replacements
    node -e "
    const fs = require('fs');
    const path = '${SERVER_JS}';
    let content = fs.readFileSync(path, 'utf8');
    
    // Pattern to identify the old args array (or any previous version of it)
    // We look for the start of the args array definition
    const startMarker = 'const args = [';
    const endMarker = '];';
    
    const startIndex = content.indexOf(startMarker);
    if (startIndex !== -1) {
        // Find the closing bracket to replace the whole array content
        // This is a naive search, assuming the array doesn't contain nested arrays with ];
        // Given the known structure, we can look for the first ]; after startMarker
        const portionAfter = content.substring(startIndex);
        const endIndexRelative = portionAfter.indexOf(endMarker);
        
        if (endIndexRelative !== -1) {
            const endIndex = startIndex + endIndexRelative + endMarker.length;
            
            const newArgs = \`const args = [
    '--download-sections', \\\`*\\\${start}-\\\\${end}\\\`,
    '--extractor-args', 'youtube:player_client=android',
    '--js-runtimes', 'node', // Enable Node.js for n-sig calculations
    '--no-check-certificates', // Fix for [SSL: CERTIFICATE_VERIFY_FAILED]
    '-f', 'bv*[height>=1080]+ba/b',
    '--merge-output-format', 'mp4',
    '-o', outputPath,
    url
  ];\`;
            
            const newContent = content.substring(0, startIndex) + newArgs + content.substring(endIndex);
            fs.writeFileSync(path, newContent);
            console.log('✅ server.js patched successfully');
        } else {
            console.error('❌ Could not find end of args array in server.js');
            process.exit(1);
        }
    } else {
        console.error('❌ Could not find args array in server.js');
        process.exit(1);
    }
    "
    
    if [ $? -eq 0 ]; then
        echo "✨ Args array patched!"
        
        # Also fix common syntax error on console.log line
        echo "🔧 Fixing console.log syntax..."
        node -e "
        const fs = require('fs');
        const path = '${SERVER_JS}';
        let content = fs.readFileSync(path, 'utf8');
        
        // Fix missing backticks in console.log
        content = content.replace(
            /console\.log\(Using cookies from/g,
            'console.log(\`Using cookies from'
        );
        content = content.replace(
            /from \\\${cookiesFile\.path}\)/g,
            'from \${cookiesFile.path}\`)'
        );
        
        fs.writeFileSync(path, content);
        console.log('✅ Console.log syntax fixed');
        "
        
        echo "✨ All patches applied!"
    else
        echo "⚠️  Patch failed. Restoring from backup..."
        cp "$SERVER_JS.bak" "$SERVER_JS"
    fi
else
    echo "❌ $SERVER_JS not found!"
fi

echo ""
echo "🎉 Update Complete!"
echo "You can now run the downloader with:"
echo "./run-batch-downloader.sh"
