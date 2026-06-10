/* ==========================================================================
1. GLOBAL JARVIS/FRIDAY STATE & THEME
========================================================================== */
window.jarvisState = 'IDLE'; 
let jarvisActive = false;
let recognition; 

function toggleTheme() {
    const htmlTag = document.documentElement;
    const isDark = htmlTag.getAttribute('data-theme') === 'dark';
    htmlTag.setAttribute('data-theme', isDark ? 'light' : 'dark');
}

/* ==========================================================================
2. THREE.JS PHYSICS ENGINE (The 3D Sphere)
========================================================================== */
let scene, camera, renderer, particles, particleMaterial;

function init3D() {
    const container = document.getElementById('webgl-container');
    if (!container) return;
    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

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
        color: 0x3b82f6, size: 0.3, transparent: true, opacity: 0.8
    });

    particles = new THREE.Points(geometry, particleMaterial);
    scene.add(particles);

    window.addEventListener('resize', onWindowResize);
    animate();
}

function unlockPortfolio() {
    const portfolioContent = document.getElementById('portfolio-content');
    if (portfolioContent) portfolioContent.classList.add('active');
    document.body.style.overflow = 'auto';
    
    if (particleMaterial) particleMaterial.opacity = 0.2;
    
    const webglContainer = document.getElementById('webgl-container');
    if (webglContainer) webglContainer.style.pointerEvents = 'none'; 
}

function lockPortfolio() {
    const portfolioContent = document.getElementById('portfolio-content');
    if (portfolioContent) portfolioContent.classList.remove('active');
    document.body.style.overflow = 'hidden';
    
    const bootScreen = document.getElementById('boot-screen');
    if (bootScreen) bootScreen.style.display = 'flex';
    
    if (particleMaterial) particleMaterial.opacity = 0.8;
    
    const webglContainer = document.getElementById('webgl-container');
    if (webglContainer) webglContainer.style.pointerEvents = 'auto'; 
    
    // Stop listening when locked to save API quota
    jarvisActive = false; 
    window.jarvisState = 'IDLE';
    window.speechSynthesis.cancel();
    if (recognition) {
        try { recognition.stop(); } catch(e) {}
    }
}

function animate() {
    requestAnimationFrame(animate);
    const time = Date.now() * 0.001; 
    if (!particles || !particleMaterial) return;

    if (window.jarvisState === 'IDLE') {
        particles.rotation.x += 0.002;
        particles.rotation.y += 0.002;
        particles.scale.set(1, 1, 1);
        particleMaterial.color.setHex(0x3b82f6); 
    } 
    else if (window.jarvisState === 'LISTENING') {
        particles.rotation.y += 0.005; 
        const pulse = 1 + Math.sin(time * 8) * 0.04; 
        particles.scale.set(pulse, pulse, pulse);
        particleMaterial.color.setHex(0x00f2fe); 
        particleMaterial.opacity = 0.85; 
    } 
    else if (window.jarvisState === 'THINKING') {
        particles.rotation.x += 0.06; 
        particles.rotation.y += 0.06;
        particles.scale.set(0.8, 0.8, 0.8); 
        particleMaterial.color.setHex(0x9d4edd); 
    } 
    else if (window.jarvisState === 'SPEAKING') {
        particles.rotation.y += 0.004;
        const talkPulse = 1 + Math.sin(time * 16) * 0.07; 
        particles.scale.set(talkPulse, talkPulse, talkPulse);
        particleMaterial.color.setHex(0x00f2fe); 
        particleMaterial.opacity = 0.85;
    }
    renderer.render(scene, camera);
}

function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/* ==========================================================================
3. BOOT SEQUENCE & CONTINUOUS AI PIPELINE
========================================================================== */
window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
};

document.addEventListener('DOMContentLoaded', () => {
    init3D();
    setupAudioEngine();

    document.getElementById('btn-standard').addEventListener('click', () => {
        document.getElementById('boot-screen').style.display = 'none';
        unlockPortfolio();
    });

    document.getElementById('btn-jarvis').addEventListener('click', () => {
        document.getElementById('boot-screen').style.display = 'none';
        jarvisActive = true;
        
        if (recognition) {
            try { recognition.start(); } catch (e) { console.log("Mic primed."); }
        }
        
        speakText("System initialized. Welcome back, Johnny. Listening for commands.");
    });
});

function setupAudioEngine() {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    recognition = new SpeechRecognitionAPI();
    recognition.continuous = false; 
    
    recognition.onstart = () => {
        if (window.speechSynthesis.speaking) {
            window.jarvisState = 'SPEAKING';
        } else {
            window.jarvisState = 'LISTENING';
        }
    };
    
    recognition.onend = () => {
        if (jarvisActive && window.jarvisState !== 'THINKING' && window.jarvisState !== 'SPEAKING') {
            window.jarvisState = 'IDLE';
            try { recognition.start(); } catch(e) {} 
        }
    };
    
    recognition.onerror = (e) => {
        if (window.jarvisState !== 'THINKING' && window.jarvisState !== 'SPEAKING') {
            window.jarvisState = 'IDLE';
        }
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("Captured speech:", transcript);
        handleUserQuery(transcript);
    };
}

/* ==========================================================================
4. NLP INTENT ROUTING (Connected to Gemini backend)
========================================================================== */
async function handleUserQuery(query) {
    if (!query.trim()) return;
    
    window.jarvisState = 'THINKING'; 
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query })
        });

        const data = await response.json();

        if (response.ok && data.reply) {
            speakText(data.reply, () => {
                const targetAction = data.action ? data.action.toUpperCase().trim() : 'NONE';
                console.log("NLP Action Triggered:", targetAction);
                
                if (targetAction === 'UNLOCK_PORTFOLIO') {
                    unlockPortfolio();
                } else if (targetAction === 'LOCK_PORTFOLIO') {
                    lockPortfolio();
                } else if (targetAction === 'OPEN_TECHNICAL_SKILLS') {
                    // Strictly scroll to the on-page summary
                    const skillsSection = document.getElementById('technical-skills');
                    if (skillsSection) {
                        skillsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                } else if (targetAction === 'OPEN_TIMELINE') {
                    // Redirects the browser to your timeline HTML file
                    window.location.href = 'timeline.html';
                } else if (targetAction === 'OPEN_PROJECT_0') {
                    // Smooth scrolls the viewport directly to the Two Sum project
                    const p0 = document.getElementById('project-0');
                    if (p0) p0.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else if (targetAction === 'OPEN_PROJECT_B') {
                    // Smooth scrolls the viewport directly to the Database project
                    const pB = document.getElementById('project-b');
                    if (pB) pB.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        } else {
            speakText("System anomaly detected during processing.");
        }
    } catch (error) {
        speakText("Network configuration conflict. Connection severed.");
    }
}

/* ==========================================================================
5. FEMALE VOICE SYNTHESIS ENGINE (F.R.I.D.A.Y.)
========================================================================== */
function speakText(text, callback = null) {
    window.speechSynthesis.cancel(); // Kills overlapping ghost voices
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    
    // Aggressively hunt for premium Female voices
    const selectedVoice = voices.find(v => 
        v.name.includes('Samantha') ||                 
        v.name.includes('Google UK English Female') || 
        v.name.includes('Victoria') ||                 
        v.name.includes('Karen') ||
        v.name.includes('Tessa')
    ) || voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman')) || voices[0];
    
    if (selectedVoice) utterance.voice = selectedVoice;
    
    utterance.rate = 1.05;  
    utterance.pitch = 1.15; // Higher pitch for a distinct feminine AI tone

    utterance.onstart = () => {
        window.jarvisState = 'SPEAKING';
    };
    
    utterance.onend = () => {
        window.jarvisState = 'IDLE';
        if (callback) callback();
        
        if (jarvisActive && recognition) {
            try { recognition.start(); } catch(e) {}
        }
    };

    window.speechSynthesis.speak(utterance);
}