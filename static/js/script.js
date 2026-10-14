// --- 0. INTRO SCREEN (Text Scramble Effect) ---
class TextScramble {
    constructor(el) {
        this.el = el;
        // Karakter acak (sengaja tanpa < > & supaya aman dipakai di innerHTML)
        this.chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^*+=?/|{}[]-_';
        this.frameRequest = null;
        this.update = this.update.bind(this);
    }

    randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
    }

    escapeHTML(ch) {
        return ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch;
    }

    // Morph teks yang sedang tampil -> newText. Mengembalikan Promise yang resolve saat selesai.
    setText(newText) {
        const oldText = this.el.textContent;
        const length = Math.max(oldText.length, newText.length);

        return new Promise(resolve => {
            this.resolve = resolve;
            this.queue = [];
            for (let i = 0; i < length; i++) {
                const start = Math.floor(Math.random() * 4);        // kapan mulai diacak (frame)
                const end = start + 12 + Math.floor(Math.random() * 4); // kapan jadi huruf asli
                this.queue.push({ from: oldText[i] || '', to: newText[i] || '', start, end, char: '' });
            }
            cancelAnimationFrame(this.frameRequest);
            this.t0 = null;
            this.frameRequest = requestAnimationFrame(this.update);
        });
    }

    update(now) {
        if (this.t0 === null) this.t0 = now;
        // Berbasis waktu (setara 60 fps) supaya kecepatan sama di layar 60Hz maupun 120Hz
        const frame = (now - this.t0) / 16.67;

        let html = '';
        let complete = 0;
        for (const item of this.queue) {
            if (frame >= item.end) {
                complete++;
                html += this.escapeHTML(item.to);
            } else if (frame >= item.start) {
                if (!item.char || Math.random() < 0.8) item.char = this.randomChar();
                html += `<span class="dud">${this.escapeHTML(item.char)}</span>`;
            } else {
                html += this.escapeHTML(item.from);
            }
        }
        this.el.innerHTML = html;

        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(this.update);
        }
    }

    stop() {
        cancelAnimationFrame(this.frameRequest);
    }
}

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

    // Urutan teks: tiap item di-scramble dari teks sebelumnya.
    // Mudah dikustomisasi: ubah text / hold (ms jeda setelah teks terbentuk).
    const START_TEXT = 'INITIALIZING SYSTEM...', hold = 50000;
    const sequence = [
        { text: 'M4LW4R3 4N4LY1S'},
        { text: 'N3TW0RK S3CUR1TY'},
        { text: 'BUG HUNT1NG'},
        { text: 'C4PTUR3 TH3 FL4G'},
        { text: 'CYB3R SECUR1TY'},
        { text: 'P3N3TRATI0N TEST1NG'},
        { text: 'VULNERABILITY ASS3SM3NT'},
        { text: 'LOADING PORTFOLIO'},
        { text: 'WELCOME TO MY PORTFOLIO', hold: 900 },
        { text: 'M4RKU5 K4P1T4N D3 0RN4Y', hold: 1100 }
    ];

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let finished = false;
    let timers = [];
    const fx = new TextScramble(introText);

    function finishIntro() {
        if (finished) return;
        finished = true;
        timers.forEach(t => clearTimeout(t));
        fx.stop();
        sessionStorage.setItem('bite_intro_shown', '1');
        introScreen.classList.add('intro-hidden');
        document.body.classList.remove('intro-active');
        setTimeout(() => introScreen.remove(), 900);
    }

    const sleep = ms => new Promise(resolve => timers.push(setTimeout(resolve, ms)));

    async function run() {
        await sleep(400);
        for (const step of sequence) {
            if (finished) return;
            await fx.setText(step.text);
            if (finished) return;
            await sleep(step.hold);
        }
        finishIntro();
    }

    // Fade-in sekali saja (animasi + garis trail dari CSS lama), lalu teks diacak oleh JS
    introText.textContent = START_TEXT;
    introText.classList.add('intro-in');

    if (reduceMotion) {
        // Aksesibilitas: tanpa animasi acak, langsung tampilkan teks akhir
        introText.textContent = sequence[sequence.length - 1].text;
        timers.push(setTimeout(finishIntro, 1200));
    } else {
        run();
    }

    if (skipBtn) skipBtn.addEventListener('click', finishIntro);
})();

// --- 0.2 MATRIX TEXT RAIN BACKGROUND (Canvas) ---
(function initMatrixRain() {
    const canvas = document.getElementById('matrixCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ====== KONFIGURASI (silakan diutak-atik) ======
    const CFG = {
        chars: 'abcdefghijklmnopqrstuvwxyz0123456789', // huruf + angka
        fontSize: 18,         // ukuran huruf (desktop)
        fontSizeMobile: 14,   // ukuran huruf (layar < 768px)
        fps: 30,              // frame per detik animasi hujan
        fade: 0.08,           // 0.03 = ekor panjang | 0.15 = ekor pendek
        respawn: 0.975,       // makin kecil = aliran baru muncul makin sering
        minSpeed: 0.45,       // kecepatan jatuh minimum (baris/frame)
        maxSpeed: 1.0,        // kecepatan jatuh maksimum (baris/frame)
        color: '#00d836',     // warna huruf (ekor)
        headColor: '#d9ffe2', // warna huruf paling depan (kepala aliran)
        bg: '#070707'         // harus sama dengan --bg di CSS
    };

    const fadeColor = `rgba(7, 7, 7, ${CFG.fade})`;
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0, h = 0, fontSize = CFG.fontSize, cols = 0, maxRows = 0;
    let rows = [], lastRow = [], lastChar = [], speeds = [];
    let rafId = null, lastTime = 0;
    const interval = 1000 / CFG.fps;

    const randChar = () => CFG.chars[Math.floor(Math.random() * CFG.chars.length)];
    const randSpeed = () => CFG.minSpeed + Math.random() * (CFG.maxSpeed - CFG.minSpeed);

    function setup() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = window.innerWidth;
        h = window.innerHeight;
        fontSize = w < 768 ? CFG.fontSizeMobile : CFG.fontSize;

        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.font = `${fontSize}px "Courier New", Consolas, monospace`;
        ctx.textBaseline = 'top';
        ctx.fillStyle = CFG.bg;
        ctx.fillRect(0, 0, w, h);

        cols = Math.ceil(w / fontSize);
        maxRows = Math.ceil(h / fontSize);
        rows = []; lastRow = []; lastChar = []; speeds = [];
        for (let i = 0; i < cols; i++) {
            rows[i] = -Math.random() * maxRows; // posisi awal acak di atas layar -> aliran tidak serempak
            lastRow[i] = -1;
            lastChar[i] = '';
            speeds[i] = randSpeed();
        }
    }

    function tick() {
        // Pudarkan frame sebelumnya -> menghasilkan efek ekor yang memudar
        ctx.fillStyle = fadeColor;
        ctx.fillRect(0, 0, w, h);

        for (let i = 0; i < cols; i++) {
            rows[i] += speeds[i];
            const row = Math.floor(rows[i]);

            if (row !== lastRow[i] && row >= 0 && row <= maxRows) {
                const x = i * fontSize;

                // Kepala sebelumnya (putih kehijauan) diubah jadi hijau biasa
                if (lastRow[i] >= 0) {
                    const py = lastRow[i] * fontSize;
                    ctx.fillStyle = CFG.bg;
                    ctx.fillRect(x, py, fontSize, fontSize);
                    ctx.fillStyle = CFG.color;
                    ctx.fillText(lastChar[i], x, py);
                }

                // Kepala baru
                const ch = randChar();
                ctx.fillStyle = CFG.headColor;
                ctx.fillText(ch, x, row * fontSize);
                lastChar[i] = ch;
                lastRow[i] = row;
            }

            // Sudah lewat bawah layar -> peluang untuk mulai lagi dari atas
            if (rows[i] > maxRows && Math.random() > CFG.respawn) {
                rows[i] = -Math.random() * 10;
                lastRow[i] = -1;
                speeds[i] = randSpeed();
            }
        }
    }

    function loop(t) {
        rafId = requestAnimationFrame(loop);
        if (t - lastTime < interval) return;
        lastTime = t - ((t - lastTime) % interval);
        tick();
    }

    // Untuk prefers-reduced-motion: gambar satu "foto" statis, tanpa animasi
    function snapshot() {
        for (let i = 0; i < 120; i++) tick();
    }

    setup();
    if (reduceMotion) snapshot();
    else rafId = requestAnimationFrame(loop);

    // Resize: abaikan perubahan tinggi kecil (address bar mobile naik-turun) supaya hujan tidak reset
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth !== w || window.innerHeight > h) {
                setup();
                if (reduceMotion) snapshot();
            }
        }, 150);
    });
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