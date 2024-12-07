const { spawn } = require('child_process');

// Function to start the main.js script
function startScript() {
    console.log('Starting main.js...');

    // Spawn the child process to run main.js
    const process = spawn('node', ['main.js'], { stdio: 'inherit' });

    // Restart the script if it exits
    process.on('exit', (code, signal) => {
        if (code !== 0 || signal) {
            console.log(`main.js stopped unexpectedly (code: ${code}, signal: ${signal}). Restarting...`);
            startScript(); // Restart the script
        } else {
            console.log('main.js exited cleanly. No restart needed.');
        }
    });

    process.on('error', (err) => {
        console.error('Failed to start main.js:', err);
        setTimeout(startScript, 5000); // Retry after 5 seconds
    });
}

// Start monitoring
startScript();