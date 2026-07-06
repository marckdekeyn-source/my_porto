// --- 0. INTRO SCREEN (Typewriter) ---
(function initIntro() {
    const introScreen = document.getElementById('introScreen');
    if (!introScreen) return;

    // Sudah pernah tampil di sesi ini -> langsung skip, tidak ada flicker
    if (sessionStorage.getItem('bite_intro_shown')) {
        introScreen.remove();
        document.body.classList.remove('intro-active');
        return;
    }

    document.body.classList.add('intro-active');

    const introText = document.getElementById('introText');
    const skipBtn = document.getElementById('introSkip');

    const phrases = [
        "Initializing Portofolio...",
        "Loading Projects...",
        "Loading Certifications...",
        "Cybersecurity Student",
        "Welcome to My Portfolio"
    ];

    const TYPE_SPEED = 40;
    const DELETE_SPEED = 30;
    const HOLD_TIME = 500;
    const GAP_TIME = 150;

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let finished = false;
    let timers = [];

    function finishIntro() {
        if (finished) return;
        finished = true;
        timers.forEach(t => clearTimeout(t));
        sessionStorage.setItem('bite_intro_shown', '1');
        introScreen.classList.add('intro-hidden');
        document.body.classList.remove('intro-active');
        setTimeout(() => introScreen.remove(), 900);
    }

   function tick() {
        if (finished) return;
        const currentPhrase = phrases[phraseIndex];
        const isLastPhrase = phraseIndex === phrases.length - 1;

        if (!isDeleting) {
            charIndex++;
            introText.textContent = currentPhrase.substring(0, charIndex);

            if (charIndex === currentPhrase.length) {
                if (isLastPhrase) {
                    timers.push(setTimeout(finishIntro, 900));
                    return;
                }
                isDeleting = true;
                timers.push(setTimeout(tick, HOLD_TIME));
                return;
            }
            timers.push(setTimeout(tick, TYPE_SPEED));
        } else {
            charIndex--;
            introText.textContent = currentPhrase.substring(0, charIndex);

            if (charIndex === 0) {
                isDeleting = false;
                phraseIndex++;
                timers.push(setTimeout(tick, GAP_TIME));
                return;
            }
            timers.push(setTimeout(tick, DELETE_SPEED));
        }
    }

    timers.push(setTimeout(tick, 400));

    if (skipBtn) skipBtn.addEventListener('click', finishIntro);
})();

// --- 0.5 HERO ROLE TYPEWRITER (Loop tanpa henti) ---
(function initHeroTypewriter() {
    const el = document.getElementById('heroTypewriter');
    if (!el) return;

    // Mudah dikustomisasi: cukup ubah array string di bawah ini
    const roles = [
        "Cybersecurity Student",
        "Web Pentester",
        "Bug Hunter",
        "Digital Forensics Enthusiast",
        "Network Security",
        "Malware Analyst"
    ];

    const TYPE_SPEED = 60;
    const DELETE_SPEED = 35;
    const HOLD_TIME = 1500;
    const GAP_TIME = 300;

    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function loop() {
        const currentRole = roles[roleIndex];

        if (!isDeleting) {
            charIndex++;
            el.textContent = currentRole.substring(0, charIndex);

            if (charIndex === currentRole.length) {
                isDeleting = true;
                setTimeout(loop, HOLD_TIME);
                return;
            }
            setTimeout(loop, TYPE_SPEED);
        } else {
            charIndex--;
            el.textContent = currentRole.substring(0, charIndex);

            if (charIndex === 0) {
                isDeleting = false;
                roleIndex = (roleIndex + 1) % roles.length; // loop tanpa henti
                setTimeout(loop, GAP_TIME);
                return;
            }
            setTimeout(loop, DELETE_SPEED);
        }
    }

    loop();
})();

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
                        item.classList.remove('is-hidden');
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        }, 50);
                    } else {
                        item.classList.add('is-hidden');
                    }
                }, 300);
            });
        });
    });
}

// --- 5. LIGHTBOX (Generic: profile photo & certificates) ---
(function initLightbox() {
    const overlay = document.getElementById('lightboxOverlay');
    const imgEl = document.getElementById('lightboxImg');
    const captionEl = document.getElementById('lightboxCaption');
    const closeBtn = document.getElementById('lightboxClose');
    if (!overlay || !imgEl) return;

    const triggers = document.querySelectorAll('.lightbox-trigger');

    function openLightbox(src, caption) {
        imgEl.src = src;
        imgEl.alt = caption || 'Preview';
        captionEl.textContent = caption || '';
        overlay.classList.add('active');
        document.body.classList.add('lightbox-open');
    }

    function closeLightbox() {
        overlay.classList.remove('active');
        document.body.classList.remove('lightbox-open');
        // Kosongkan src setelah transisi selesai supaya tidak ada flicker gambar lama
        setTimeout(() => { if (!overlay.classList.contains('active')) imgEl.src = ''; }, 350);
    }

    triggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const src = trigger.getAttribute('data-lightbox-src');
            const caption = trigger.getAttribute('data-lightbox-caption');
            if (src) openLightbox(src, caption);
        });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

    // Klik area luar (backdrop) untuk menutup
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeLightbox();
    });

    // ESC untuk menutup
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeLightbox();
    });
})();

// --- 5.5 SCROLL REVEAL (IntersectionObserver, vanilla JS) ---
(function initScrollReveal() {
    const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-zoom');
    if (revealEls.length === 0 || typeof IntersectionObserver === 'undefined') {
        // Fallback: browser lama tanpa IntersectionObserver -> langsung tampilkan semua
        revealEls.forEach(el => el.classList.add('is-visible'));
        return;
    }

    // Terapkan stagger delay dari atribut data-reveal-delay (menggantikan inline style Jinja)
    revealEls.forEach(el => {
        const delay = el.getAttribute('data-reveal-delay');
        if (delay) el.style.transitionDelay = `${delay}s`;
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // animasi sekali saja, tidak berulang
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    revealEls.forEach(el => observer.observe(el));
})();

// --- 6. DYNAMIC LOCAL TIME CLOCK ---
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