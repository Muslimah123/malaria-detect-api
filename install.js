// test-opencv.js
const cv = require('opencv-wasm');
const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

// OpenCV-WASM is ready to use right away without explicit initialization
async function testOpencv() {
  try {
    console.log('Testing OpenCV WebAssembly installation...');
    console.log(`OpenCV Version: ${cv.version.major}.${cv.version.minor}.${cv.version.revision}`);
    
    // Create a test image
    const width = 400;
    const height = 400;
    const mat = new cv.Mat(height, width, cv.CV_8UC3, [0, 0, 0]);
    
    // Draw a red circle
    const center = new cv.Point(width/2, height/2);
    const radius = 100;
    const color = new cv.Scalar(0, 0, 255);
    const thickness = 5;
    cv.circle(mat, center, radius, color, thickness);
    
    // Add text
    const text = 'OpenCV WASM Works!';
    const fontFace = cv.FONT_HERSHEY_SIMPLEX;
    const fontScale = 1;
    const textColor = new cv.Scalar(255, 255, 255);
    const textThickness = 2;
    const textOrg = new cv.Point(50, 50);
    cv.putText(mat, text, textOrg, fontFace, fontScale, textColor, textThickness, cv.LINE_AA);
    
    // Save the image
    const outputDir = path.join(__dirname, 'test-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, 'opencv-test.png');
    
    // Convert Mat to Jimp and save
    const imgData = new Uint8Array(mat.data);
    
    // Create Jimp image - need to handle BGR to RGB conversion
    const jimpImage = new Jimp(width, height);
    
    // Manual BGR to RGB conversion
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 3;
        const b = imgData[idx];
        const g = imgData[idx + 1];
        const r = imgData[idx + 2];
        
        const hex = Jimp.rgbaToInt(r, g, b, 255);
        jimpImage.setPixelColor(hex, x, y);
      }
    }
    
    await jimpImage.writeAsync(outputPath);
    
    console.log(`Test successful! Image saved to: ${outputPath}`);
    
    // Clean up
    mat.delete();
  } catch (error) {
    console.error('Test failed:', error);
    console.error(error.stack);
  }
}

testOpencv();