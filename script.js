/* ==========================================================================
1. GLOBAL JARVIS STATE & THEME
   ========================================================================== */
window.jarvisState = 'IDLE'; // IDLE, LISTENING, THINKING, SPEAKING

function toggleTheme() {
    const htmlTag = document.documentElement;
    const isDark = htmlTag.getAttribute('data-theme') === 'dark';
    htmlTag.setAttribute('data-theme', isDark ? 'light' : 'dark');
}

/* ==========================================================================
2. THREE.JS PHYSICS ENGINE (The Avatar)
   ========================================================================== */
let scene, camera, renderer, particles, particleMaterial;
let isUnlocked = false;

function init3D() {
    const container = document.getElementById('webgl-container');
    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Create the JARVIS Sphere
    const particleCount = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const radius = 15;

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);     
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta); 
        positions[i * 3 + 2] = radius * Math.cos(phi);                   
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    particleMaterial = new THREE.PointsMaterial({
        color: 0x3b82f6, // Default Blue
        size: 0.3,
        transparent: true,
        opacity: 0.8
    });

    particles = new THREE.Points(geometry, particleMaterial);
    scene.add(particles);

    window.addEventListener('resize', onWindowResize);
    container.addEventListener('click', unlockPortfolio);
    
    animate();
}

function unlockPortfolio() {
    if (isUnlocked) return;
    isUnlocked = true;
    sessionStorage.setItem('portfolioUnlocked', 'true');

    // Reveal HTML over the globe
    document.getElementById('portfolio-content').classList.add('active');
    document.body.style.overflow = 'auto';
    
    // Push globe to background opacity but keep it alive
    particleMaterial.opacity = 0.3;
    document.getElementById('webgl-container').style.pointerEvents = 'none'; 
}

function animate() {
    requestAnimationFrame(animate);
    const time = Date.now() * 0.001; // Get continuous time for sine wave math

    // JARVIS VISUAL STATE MACHINE
    if (window.jarvisState === 'IDLE') {
        particles.rotation.x += 0.002;
        particles.rotation.y += 0.002;
        particles.scale.set(1, 1, 1);
        particleMaterial.color.setHex(0x3b82f6); // Base Blue
    } 
    else if (window.jarvisState === 'LISTENING') {
        particles.rotation.y += 0.005; // Spin slightly faster
        const pulse = 1 + Math.sin(time * 8) * 0.03; // Gentle vibration
        particles.scale.set(pulse, pulse, pulse);
        particleMaterial.color.setHex(0x00f2fe); // Bright Cyan
        particleMaterial.opacity = 0.8; // Brighten up
    } 
    else if (window.jarvisState === 'THINKING') {
        particles.rotation.x += 0.05; // Spin rapidly
        particles.rotation.y += 0.05;
        particles.scale.set(0.85, 0.85, 0.85); // Contract core
        particleMaterial.color.setHex(0x9d4edd); // Processing Purple
    } 
    else if (window.jarvisState === 'SPEAKING') {
        particles.rotation.y += 0.005;
        const talkPulse = 1 + Math.sin(time * 15) * 0.08; // High frequency audio waves
        particles.scale.set(talkPulse, talkPulse, talkPulse);
        particleMaterial.color.setHex(0x00f2fe); // Bright Cyan
    }

    // Return to faint background if idle and portfolio is open
    if (isUnlocked && window.jarvisState === 'IDLE') {
        particleMaterial.opacity = 0.3;
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('webgl-container')) {
        init3D();
        if (sessionStorage.getItem('portfolioUnlocked') === 'true') {
            unlockPortfolio();
        }
    }
});

/* ==========================================================================
3. AI PIPELINE & NLP (Web Speech API -> Gemini)
   ========================================================================== */
const micBtn = document.getElementById('ai-mic-btn'); 

async function handleUserQuery(query) {
    if (!query.trim()) {
        window.jarvisState = 'IDLE';
        return;
    }
    
    window.jarvisState = 'THINKING'; // Triggers Three.js rapid spin
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query })
        });

        const data = await response.json();

        if (response.ok && data.reply) {
            speakText(data.reply);
        } else {
            speakText("System anomaly detected.");
        }
    } catch (error) {
        speakText("Connection to host severed.");
    }
}

function speakText(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha')) || voices[0];
    if (selectedVoice) utterance.voice = selectedVoice;
    
    utterance.rate = 1.05; 
    utterance.pitch = 0.95; 

    // Hook state to Three.js
    utterance.onstart = () => window.jarvisState = 'SPEAKING';
    utterance.onend = () => window.jarvisState = 'IDLE';
    utterance.onerror = () => window.jarvisState = 'IDLE';

    window.speechSynthesis.speak(utterance);
}

// Hook Microphone
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    
    recognition.onstart = () => window.jarvisState = 'LISTENING';
    recognition.onerror = () => window.jarvisState = 'IDLE';
    recognition.onend = () => {
        if (window.jarvisState !== 'THINKING' && window.jarvisState !== 'SPEAKING') {
            window.jarvisState = 'IDLE';
        }
    };
    recognition.onresult = (event) => handleUserQuery(event.results[0][0].transcript);

    if (micBtn) micBtn.addEventListener('click', () => recognition.start());
}