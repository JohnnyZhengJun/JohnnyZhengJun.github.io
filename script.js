/* ==========================================================================
1. THEME LOGIC
   ========================================================================== */
function toggleTheme() {
    const htmlTag = document.documentElement;
    const isDark = htmlTag.getAttribute('data-theme') === 'dark';
    htmlTag.setAttribute('data-theme', isDark ? 'light' : 'dark');
    
    // Update Three.js particle colors based on theme
    if (particleMaterial) {
        particleMaterial.color.setHex(isDark ? 0x3b82f6 : 0x60a5fa);
    }
}

/* ==========================================================================
2. THREE.JS PHYSICS ENGINE
   ========================================================================== */
let scene, camera, renderer, particles, particleMaterial;
let isPopped = false;
let particleVelocities = [];

function init3D() {
    const container = document.getElementById('webgl-container');
    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Create the Bubble (Sphere of Particles)
    const particleCount = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        // Spherical math for bubble shape
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const radius = 15;

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);     // x
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta); // y
        positions[i * 3 + 2] = radius * Math.cos(phi);                   // z

        // Store random velocities for the explosion
        particleVelocities.push({
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2,
            z: (Math.random() - 0.5) * 2
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    particleMaterial = new THREE.PointsMaterial({
        color: 0x60a5fa,
        size: 0.3,
        transparent: true,
        opacity: 0.8
    });

    particles = new THREE.Points(geometry, particleMaterial);
    scene.add(particles);

    // Event Listeners for 3D interaction
    window.addEventListener('resize', onWindowResize);
    container.addEventListener('click', explodeBubble);
    
    animate();
}

function explodeBubble() {
    if (isPopped) return;
    isPopped = true;

    // Save to browser memory that the bubble has been popped
    sessionStorage.setItem('portfolioUnlocked', 'true');

    // Trigger HTML Reveal
    document.getElementById('portfolio-content').classList.add('active');
    document.body.style.overflow = 'auto'; // Allow scrolling
    document.getElementById('webgl-container').style.cursor = 'default';
    
    // Crucial: Stop the invisible canvas from blocking clicks
    document.getElementById('webgl-container').style.pointerEvents = 'none'; 
}

function animate() {
    requestAnimationFrame(animate);

    if (!isPopped) {
        // Ambient rotation for the bubble
        particles.rotation.x += 0.002;
        particles.rotation.y += 0.002;
    } else {
        // The Pop Physics (Scattering droplets)
        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length / 3; i++) {
            // Apply velocity
            positions[i * 3] += particleVelocities[i].x;
            positions[i * 3 + 1] += particleVelocities[i].y;
            positions[i * 3 + 2] += particleVelocities[i].z;
            
            // Add slight drag/gravity effect to particles over time
            particleVelocities[i].y -= 0.01; 
        }
        particles.geometry.attributes.position.needsUpdate = true;
        
        // Fade out particles slowly as they form the background
        if (particleMaterial.opacity > 0.1) {
            particleMaterial.opacity -= 0.005;
        }
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Boot up the engine when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('webgl-container');
    
    // Only initialize 3D if we are on index.html
    if (container) {
        init3D();
        
        // Check browser memory. If already unlocked, skip the bubble animation instantly.
        if (sessionStorage.getItem('portfolioUnlocked') === 'true') {
            isPopped = true;
            
            // Instantly reveal content
            document.getElementById('portfolio-content').classList.add('active');
            document.body.style.overflow = 'auto';
            container.style.cursor = 'default';
            container.style.pointerEvents = 'none';
            
            // Turn off the particles immediately
            if (particleMaterial) {
                particleMaterial.opacity = 0;
            }
        }
    }
});
/* ==========================================================================
3. SCROLL-TO-TOP CONTROLLER
   ========================================================================== */
const contentContainer = document.getElementById('portfolio-content');
const scrollBtn = document.getElementById('scrollToTopBtn');

// Listen for scrolling inside the active content div
contentContainer.addEventListener('scroll', () => {
    // Show button if scrolled down past 200 pixels
    if (contentContainer.scrollTop > 200) {
        scrollBtn.style.display = "block";
    } else {
        scrollBtn.style.display = "none";
    }
});

// Smooth scroll back to the top
function scrollToTop() {
    contentContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/* ==========================================================================
   AI ASSISTANT ENGINE (Web Speech API)
   ========================================================================== */
const aiWidget = document.getElementById('ai-widget');
const chatLog = document.getElementById('ai-chat-log');
const textInput = document.getElementById('ai-text-input');
const micBtn = document.getElementById('ai-mic-btn');
const sendBtn = document.getElementById('ai-send-btn');

// Initialize Web Speech APIs
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synthesis = window.speechSynthesis;
let recognition = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => micBtn.classList.add('recording');
    recognition.onend = () => micBtn.classList.remove('recording');
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleUserQuery(transcript);
    };
} else {
    micBtn.style.display = 'none'; // Hide mic if browser doesn't support it
}

// Event Listeners
micBtn.addEventListener('click', () => recognition && recognition.start());
sendBtn.addEventListener('click', () => {
    if (textInput.value.trim() !== '') {
        handleUserQuery(textInput.value);
        textInput.value = '';
    }
});
textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendBtn.click();
});

// Core Logic Functions
function appendMessage(sender, text, isUser) {
    const msgDiv = document.createElement('p');
    msgDiv.className = isUser ? 'user-msg' : 'ai-msg';
    msgDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function speakText(text) {
    if (synthesis.speaking) synthesis.cancel(); // Interrupt previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    // Optional: tweak pitch and rate for a more "AI" sound
    utterance.pitch = 1.1;
    utterance.rate = 1.0; 
    synthesis.speak(utterance);
}

async function handleUserQuery(query) {
    appendMessage('You', query, true);
    
    // Phase 1: Mock Response. 
    // Phase 2: This will be replaced with a fetch() call to your secure backend.
    const aiResponse = await mockAIResponse(query);
    
    appendMessage('System', aiResponse, false);
    speakText(aiResponse);
}

// Temporary Mock Engine
function mockAIResponse(query) {
    return new Promise(resolve => {
        setTimeout(() => {
            const lowerQuery = query.toLowerCase();
            if (lowerQuery.includes('skills') || lowerQuery.includes('c++')) {
                resolve("Johnny specializes in low-level systems programming, primarily using strictly-typed C++ and C.");
            } else if (lowerQuery.includes('timeline') || lowerQuery.includes('education')) {
                resolve("Johnny is currently in his Senior year of Computer Science Engineering at YZU.");
            } else {
                resolve("I am processing your request. My secure LLM connection is currently pending deployment.");
            }
        }, 800); // Simulate network latency
    });
}
