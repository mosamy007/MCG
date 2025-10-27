<?php
// Debug script to test file scanning
header('Content-Type: text/html; charset=utf-8');

echo "<h2>Debug: File Structure Scanner</h2>";

// Test Gallery folder
$galleryPath = __DIR__ . '/Gallery';
echo "<h3>Gallery Path: " . $galleryPath . "</h3>";

if (!is_dir($galleryPath)) {
    echo "<p style='color:red'>❌ Gallery folder NOT FOUND!</p>";
    echo "<p>Create folder at: " . $galleryPath . "</p>";
} else {
    echo "<p style='color:green'>✅ Gallery folder exists</p>";
    
    $folders = scandir($galleryPath);
    echo "<h4>Folders in Gallery:</h4><ul>";
    
    foreach ($folders as $folder) {
        if ($folder === '.' || $folder === '..') continue;
        
        $folderPath = $galleryPath . '/' . $folder;
        if (is_dir($folderPath)) {
            echo "<li><strong>$folder/</strong><ul>";
            
            // List files in each folder
            $files = scandir($folderPath);
            foreach ($files as $file) {
                if ($file === '.' || $file === '..') continue;
                $filePath = $folderPath . '/' . $file;
                $size = is_file($filePath) ? filesize($filePath) : 0;
                $type = is_file($filePath) ? 'FILE' : 'DIR';
                echo "<li>$file ($type, " . number_format($size) . " bytes)</li>";
            }
            
            echo "</ul></li>";
        }
    }
    echo "</ul>";
}

// Test images folder
echo "<hr>";
$imagesPath = __DIR__ . '/images';
echo "<h3>Images Path: " . $imagesPath . "</h3>";

if (!is_dir($imagesPath)) {
    echo "<p style='color:red'>❌ Images folder NOT FOUND!</p>";
    echo "<p>Create folder at: " . $imagesPath . "</p>";
} else {
    echo "<p style='color:green'>✅ Images folder exists</p>";
    
    $files = scandir($imagesPath);
    echo "<h4>Files in images/:</h4><ul>";
    
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        $filePath = $imagesPath . '/' . $file;
        $size = is_file($filePath) ? filesize($filePath) : 0;
        $ext = pathinfo($file, PATHINFO_EXTENSION);
        echo "<li>$file (ext: $ext, " . number_format($size) . " bytes)</li>";
    }
    echo "</ul>";
}

// Test API endpoints
echo "<hr>";
echo "<h3>Test API Endpoints:</h3>";
echo "<p><a href='api/get-jobs.php' target='_blank'>Test get-jobs.php</a></p>";
echo "<p><a href='api/get-hero-images.php' target='_blank'>Test get-hero-images.php</a></p>";
?>