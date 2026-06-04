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

    // Trigger HTML Reveal
    document.getElementById('portfolio-content').classList.add('active');
    document.body.style.overflow = 'auto'; // Allow scrolling
    document.getElementById('webgl-container').style.cursor = 'default';
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
// Boot up the engine when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    init3D();
    
    // State Router: Bypass the 3D splash screen if returning from an internal page
    if (window.location.hash === '#portfolio') {
        isPopped = true; // Set state to popped
        
        // Trigger HTML Reveal instantly
        document.getElementById('portfolio-content').classList.add('active');
        document.body.style.overflow = 'auto'; 
        document.getElementById('webgl-container').style.cursor = 'default';
        document.getElementById('webgl-container').style.pointerEvents = 'none';
        
        // Instantly hide the 3D particles 
        if (particleMaterial) {
            particleMaterial.opacity = 0;
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