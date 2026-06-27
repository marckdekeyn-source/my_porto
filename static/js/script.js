// --- 1. LENIS SMOOTH SCROLL ---
let lenis;
if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), direction: 'vertical', smooth: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    }
}

// --- 2. GSAP ANIMATIONS ---
if (typeof gsap !== 'undefined') {
    gsap.from(".anim-up", { y: 30, opacity: 0, duration: 1, stagger: 0.15, ease: "power3.out", delay: 0.2 });
    gsap.from(".anim-fade", { opacity: 0, duration: 1.5, ease: "power2.out", delay: 0.5 });

    const statsSection = document.getElementById('stats-section');
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statsSection && statNumbers.length > 0 && typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.create({
            trigger: statsSection, start: "top 85%", once: true,
            onEnter: () => {
                statNumbers.forEach(stat => {
                    const target = parseInt(stat.getAttribute('data-target'));
                    let zero = { val: 0 };
                    gsap.to(zero, {
                        val: target, duration: 2.5, ease: "power2.out",
                        onUpdate: function() {
                            let suffix = target >= 100 || target === 4 ? "+" : ""; 
                            stat.innerText = Math.floor(zero.val) + suffix;
                        }
                    });
                });
            }
        });
    }

    const ambientGlow = document.querySelector('.ambient-glow');
    if(ambientGlow) {
        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 100;
            const y = (e.clientY / window.innerHeight - 0.5) * 100;
            gsap.to(ambientGlow, { x: `${x}vw`, y: `${y}vh`, duration: 2, ease: 'power2.out' });
        });
    }
}

// --- 3. SCROLL PROGRESS & BACK TO TOP ---
const progressBar = document.getElementById('scrollProgress');
const backToTopBtn = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    const scrollTotal = document.documentElement.scrollTop;
    const heightTotal = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (progressBar) progressBar.style.width = `${(scrollTotal / heightTotal) * 100}%`;
    if (backToTopBtn) {
        if (scrollTotal > 300) backToTopBtn.classList.add('visible');
        else backToTopBtn.classList.remove('visible');
    }
});

if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
        if (typeof lenis !== 'undefined' && lenis) lenis.scrollTo(0, { duration: 1.5 });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// --- 4. WORKS FILTER LOGIC ---
const filterBtns = document.querySelectorAll('.filter-btn');
const workItems = document.querySelectorAll('.work-item');

if (filterBtns.length > 0 && workItems.length > 0) {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filterValue = btn.getAttribute('data-filter');
            
            workItems.forEach(item => {
                item.style.opacity = '0';
                item.style.transform = 'translateY(10px)';
                
                setTimeout(() => {
                    if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                        item.style.display = 'grid';
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        }, 50);
                    } else {
                        item.style.display = 'none';
                    }
                }, 300);
            });
        });
    });
}

// --- 5. DYNAMIC LOCAL TIME CLOCK ---
function updateLocalTime() {
    const timeDisplay = document.getElementById('localTime');
    if (timeDisplay) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        timeDisplay.textContent = timeString;
    }
}
setInterval(updateLocalTime, 1000);
updateLocalTime();