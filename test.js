const fs = require('fs');
const html = fs.readFileSync('test_charts.html', 'utf8');
console.log(html.length);
const re = /"([a-zA-Z0-9_-]{11})"/g;
let count = 0;
while (re.exec(html) !== null) count++;
console.log('Video IDs:', count);

// let's also dump all script tags containing big JSON
const scripts = html.match(/<script.*?<\/script>/g) || [];
scripts.forEach((s, i) => {
  if (s.includes('JSON.parse')) {
    const match = s.match(/JSON\.parse\('(.*?)'\)/);
    if (match) {
        try {
            const data = match[1].replace(/\\x/g, '%').replace(/\\"/g, '"');
            console.log('Found JSON.parse data of length:', data.length);
        } catch (e) {}
    }
  }
  
  if (s.length > 1000) {
    console.log(`Script ${i} length: ${s.length}`);
  }
});
