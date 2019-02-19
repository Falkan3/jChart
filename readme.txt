required:
npm install browserify
npm install uglifyjs

Compile new code to bundle.js:
browserify src/js/app.js > dist/js/bundle.js
browserify src/js/app.js | uglifyjs > dist/js/bundle.min.js