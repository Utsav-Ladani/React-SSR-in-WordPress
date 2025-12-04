const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const buildDir = path.join(__dirname, '../build-server');

if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
}

const processed = new Set();
const queue = ['server.js']; // Start with server.js

while (queue.length > 0) {
    const file = queue.shift();
    if (processed.has(file)) continue;
    processed.add(file);

    const srcPath = path.join(srcDir, file);
    if (!fs.existsSync(srcPath)) {
        // Try with .js extension if missing
        if (fs.existsSync(srcPath + '.js')) {
            // file was passed without extension?
            // But our queue logic should handle extensions.
            // Let's assume queue has relative paths with extensions or we append them.
            // Actually, imports might be 'app' (no ext).
        } else {
            console.warn(`Source file not found: ${srcPath}`);
            continue;
        }
    }

    // Resolve full path with extension if needed
    let fullSrcPath = srcPath;
    if (!fs.existsSync(fullSrcPath) && fs.existsSync(fullSrcPath + '.js')) {
        fullSrcPath += '.js';
    }

    console.log(`Processing ${file}...`);
    const code = fs.readFileSync(fullSrcPath, 'utf8');

    try {
        const result = babel.transform(code, {
            plugins: [path.join(__dirname, './babel-plugin-js-to-php.js')]
        });

        const phpOutput = result.metadata.phpOutput;
        const dependencies = result.metadata.dependencies || [];

        if (phpOutput) {
            // For other files, keep the same structure but change extension to .php
            const phpFile = file.replace(/\.js$/, '.php');
            const outPath = path.join(buildDir, phpFile);

            // Create parent directory if needed
            const dir = path.dirname(outPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(outPath, phpOutput);
            console.log(`Generated ${outPath}`);

            // Add dependencies to queue
            dependencies.forEach(dep => {
                // dep is like 'app' or './app'
                // We need to resolve it relative to the current file
                // But for now, let's assume flat structure or simple relative
                // If dep starts with ., resolve it.
                // If it's a module (starts with @), ignore it (handled by require_once mapping in plugin).

                if (!dep.startsWith('@')) {
                    // Normalize dep
                    let depFile = dep;
                    if (depFile.startsWith('./')) depFile = depFile.substring(2);
                    // Add .js if missing?
                    // Let's check if we need to append .js
                    queue.push(depFile);
                }
            });
        }
    } catch (err) {
        console.error(`Error processing ${file}:`, err);
        process.exit(1);
    }
}
