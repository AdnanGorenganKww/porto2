/* ===== PART 1 — NAVIGATION, SCROLL SPY & ATMOSPHERE ENGINE ===== */

function initNavigationAndAtmosphere() {
    const header = document.getElementById('site-header');
    const progressBar = document.getElementById('scroll-progress-bar');
    const progressContainer = document.getElementById('scroll-progress-container');
    const cursorAura = document.getElementById('cursor-aura');
    const clockElement = document.getElementById('nocturnal-clock');
    const mobileToggle = document.getElementById('mobile-nav-toggle');
    const mobileOverlay = document.getElementById('mobile-nav-overlay');
    const mobileBackdrop = document.getElementById('mobile-nav-backdrop');
    const navLinks = document.querySelectorAll('.capsule-nav__link, .mobile-nav-link');

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;

    // 1. Live Nocturnal Clock (WIB / UTC+7)
    function updateNocturnalClock() {
        if (!clockElement) return;
        try {
            const now = new Date();
            const formatter = new Intl.DateTimeFormat('id-ID', {
                timeZone: 'Asia/Jakarta',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            clockElement.textContent = `${formatter.format(now)} WIB`;
        } catch (err) {
            const fallbackHours = String(new Date().getHours()).padStart(2, '0');
            const fallbackMinutes = String(new Date().getMinutes()).padStart(2, '0');
            clockElement.textContent = `${fallbackHours}:${fallbackMinutes} WIB`;
        }
    }
    updateNocturnalClock();
    setInterval(updateNocturnalClock, 30000);

    // 2. Scroll Progress Bar & Header Glass Elevation
    function handleScrollMetrics() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progressPercent = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;

        if (progressBar) {
            progressBar.style.width = `${progressPercent.toFixed(2)}%`;
        }
        if (progressContainer) {
            progressContainer.setAttribute('aria-valuenow', String(Math.round(progressPercent)));
        }

        if (header) {
            header.classList.toggle('is-scrolled', scrollTop > 36);
        }
    }

    window.addEventListener('scroll', handleScrollMetrics, { passive: true });
    handleScrollMetrics();

    // 3. Active Section Spy (otomatis mendeteksi section yang ada maupun yang ditambahkan di Part berikutnya)
    function updateActiveSectionOnScroll() {
        const sections = document.querySelectorAll('main section[id], footer[id]');
        if (!sections.length) return;

        const viewportTrigger = window.scrollY + window.innerHeight * 0.34;
        let currentSectionId = sections[0].getAttribute('id');

        sections.forEach((sec) => {
            if (sec.offsetTop <= viewportTrigger) {
                currentSectionId = sec.getAttribute('id');
            }
        });

        navLinks.forEach((link) => {
            const targetId = link.getAttribute('data-section');
            link.classList.toggle('is-active', targetId === currentSectionId);
        });
    }

    window.addEventListener('scroll', updateActiveSectionOnScroll, { passive: true });

    // 4. Mobile Glass Navigation Drawer Toggle
    function setMobileMenuState(isOpen) {
        if (!mobileToggle || !mobileOverlay) return;
        mobileToggle.setAttribute('aria-expanded', String(isOpen));
        mobileOverlay.classList.toggle('is-open', isOpen);
        mobileOverlay.setAttribute('aria-hidden', String(!isOpen));
        document.body.classList.toggle('nav-open', isOpen);
    }

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
            setMobileMenuState(!expanded);
        });
    }

    if (mobileBackdrop) {
        mobileBackdrop.addEventListener('click', () => setMobileMenuState(false));
    }

    // 5. Smooth Anchor Navigation & Auto-Close Mobile Menu
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (event) => {
            const targetSelector = anchor.getAttribute('href');
            if (!targetSelector || targetSelector === '#') return;

            const targetElement = document.querySelector(targetSelector);
            if (!targetElement) return;

            event.preventDefault();
            setMobileMenuState(false);

            const headerOffset = 92;
            const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
            const offsetPosition = targetSelector === '#hero' ? 0 : Math.max(0, elementPosition - headerOffset);

            window.scrollTo({
                top: offsetPosition,
                behavior: prefersReducedMotion ? 'auto' : 'smooth'
            });
        });
    });

    // Tutup menu mobile dengan tombol Escape
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && mobileOverlay && mobileOverlay.classList.contains('is-open')) {
            setMobileMenuState(false);
        }
    });

    // 6. Interactive Cursor Lantern (400px Smooth Lerp Aura)
    if (cursorAura && isFinePointer && !prefersReducedMotion) {
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let auraX = mouseX;
        let auraY = mouseY;
        let isCursorVisible = false;

        window.addEventListener('mousemove', (event) => {
            mouseX = event.clientX;
            mouseY = event.clientY;
            if (!isCursorVisible) {
                isCursorVisible = true;
                document.body.classList.add('cursor-active');
            }
        }, { passive: true });

        document.addEventListener('mouseleave', () => {
            isCursorVisible = false;
            document.body.classList.remove('cursor-active');
        });

        function renderCursorAura() {
            auraX += (mouseX - auraX) * 0.11;
            auraY += (mouseY - auraY) * 0.11;
            cursorAura.style.transform = `translate3d(${auraX.toFixed(1)}px, ${auraY.toFixed(1)}px, 0)`;
            requestAnimationFrame(renderCursorAura);
        }

        requestAnimationFrame(renderCursorAura);
    }
}

document.addEventListener('DOMContentLoaded', initNavigationAndAtmosphere);
/* ===== PART 2 — HERO WORD ROTATOR, SIDE-NOTE TOOLTIPS & SCROLL REVEAL ===== */

function initHeroAndIntro() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Glowing Word Rotator ("explore", "question", "unlearn", "build")
    const rotatorElement = document.getElementById('hero-word-rotator');
    const rotatingWords = ['explore', 'question', 'unlearn', 'build'];
    let currentWordIndex = 0;

    if (rotatorElement && !prefersReducedMotion) {
        setInterval(() => {
            rotatorElement.classList.add('is-switching');

            setTimeout(() => {
                currentWordIndex = (currentWordIndex + 1) % rotatingWords.length;
                rotatorElement.textContent = rotatingWords[currentWordIndex];
                rotatorElement.classList.remove('is-switching');
            }, 380);
        }, 3200);
    }

    // 2. Interactive Bilingual Side-Notes (Thought Triggers)
    const thoughtTriggers = document.querySelectorAll('.thought-trigger');
    const popover = document.getElementById('thought-tooltip-live');
    const popoverText = document.getElementById('thought-popover-text');
    let activeTrigger = null;

    function positionPopover(triggerEl) {
        if (!popover || !triggerEl) return;
        const rect = triggerEl.getBoundingClientRect();
        const popoverWidth = Math.min(320, window.innerWidth - 32);
        const spacing = 12;

        let left = rect.left + rect.width / 2 - popoverWidth / 2;
        left = Math.max(16, Math.min(left, window.innerWidth - popoverWidth - 16));

        let top = rect.top - popover.offsetHeight - spacing;
        if (top < 80) {
            top = rect.bottom + spacing;
        }

        popover.style.left = `${Math.round(left)}px`;
        popover.style.top = `${Math.round(top)}px`;
    }

    function showThoughtNote(triggerEl) {
        if (!popover || !popoverText) return;
        const noteContent = triggerEl.getAttribute('data-note');
        if (!noteContent) return;

        if (activeTrigger && activeTrigger !== triggerEl) {
            activeTrigger.classList.remove('is-active');
        }

        activeTrigger = triggerEl;
        triggerEl.classList.add('is-active');
        popoverText.textContent = noteContent;
        popover.setAttribute('aria-hidden', 'false');
        popover.classList.add('is-visible');
        positionPopover(triggerEl);
    }

    function hideThoughtNote() {
        if (!popover) return;
        if (activeTrigger) {
            activeTrigger.classList.remove('is-active');
            activeTrigger = null;
        }
        popover.classList.remove('is-visible');
        popover.setAttribute('aria-hidden', 'true');
    }

    thoughtTriggers.forEach((trigger) => {
        trigger.addEventListener('mouseenter', () => showThoughtNote(trigger));
        trigger.addEventListener('mouseleave', hideThoughtNote);
        trigger.addEventListener('focus', () => showThoughtNote(trigger));
        trigger.addEventListener('blur', hideThoughtNote);
        trigger.addEventListener('click', (event) => {
            event.stopPropagation();
            if (activeTrigger === trigger && popover.classList.contains('is-visible')) {
                hideThoughtNote();
            } else {
                showThoughtNote(trigger);
            }
        });
    });

    window.addEventListener('scroll', () => {
        if (activeTrigger) {
            positionPopover(activeTrigger);
        }
    }, { passive: true });

    document.addEventListener('click', (event) => {
        if (activeTrigger && !event.target.closest('.thought-trigger')) {
            hideThoughtNote();
        }
    });

    // 3. Global IntersectionObserver for .reveal-up Elements (mendukung elemen baru di Part berikutnya)
    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.14,
            rootMargin: '0px 0px -40px 0px'
        }
    );

    window.observeRevealElements = function (root = document) {
        root.querySelectorAll('.reveal-up:not(.is-visible)').forEach((el) => {
            revealObserver.observe(el);
        });
    };

    window.observeRevealElements(document);
}

document.addEventListener('DOMContentLoaded', initHeroAndIntro);
/* ===== PART 3 — CURIOSITY SPOTLIGHT & GLOWING RED THREAD TIMELINE ===== */

// Data Terstruktur (Sesuai Aturan 20: Mudah Diedit di Satu Tempat)
const CURIOSITY_PILLARS_DATA = [
    {
        id: 'creative-engineering',
        number: '01 // PILLAR',
        title: 'Creative Engineering',
        quote: 'Not just writing code, but crafting logic that feels alive and responds to human emotion.',
        description: 'Menjembatani presisi algoritma dengan kepekaan artistik. Saya senang mengeksplorasi bagaimana transisi mikro, fisika pegas, dan manipulasi DOM yang efisien mampu mengubah halaman statis menjadi ruang yang bernapas.',
        tags: ['Interactive Physics', 'Vanilla JS Architecture', 'Tactile Motion']
    },
    {
        id: 'interface-psychology',
        number: '02 // PILLAR',
        title: 'Interface Psychology',
        quote: 'Memahami mengapa sebuah tombol terasa nyaman ditekan dan bagaimana ruang gelap membangun fokus.',
        description: 'Setiap jeda waktu 200 milidetik, kontras tipografi di atas latar gelap, dan umpan balik visual membawa pesan bawah sadar. Saya meneliti bagaimana desain mampu menenangkan beban kognitif pembaca.',
        tags: ['Cognitive Flow', 'Nocturnal Ergonomics', 'Editorial Hierarchy']
    },
    {
        id: 'system-architecture',
        number: '03 // PILLAR',
        title: 'System & Architecture',
        quote: 'Membongkar kerumitan di balik layar agar pengalaman di depan layar terasa ringan dan mengalir.',
        description: 'Keindahan visual tidak berarti apa-apa jika fondasinya rapuh. Saya terobsesi menyusun token sistem desain yang disiplin, struktur kode modular, dan performa yang menghormati perangkat pengguna.',
        tags: ['Design Tokens', 'Zero-Bloat Code', 'Resilient State']
    }
];

const JOURNEY_TIMELINE_DATA = [
    {
        year: '2022',
        kind: 'milestone',
        badge: '✦ Awal Mula',
        title: 'Pertama Kali Mengenal AI',
        confession: '',
        body: 'Semuanya berawal dari rasa penasaran terhadap kecerdasan buatan. Awalnya saya hanya mencoba teknologi baru, tetapi perlahan mulai tertarik pada berbagai kemungkinan yang dapat diciptakan dengannya.',
        takeawayLabel: '',
        takeawayText: ''
    },
    {
        year: '2023',
        kind: 'spark',
        badge: '✦ Eksplorasi',
        title: 'Menjelajahi Dunia Digital',
        confession: '',
        body: 'Saya mulai mengenal lebih jauh dunia digital—dari desain dan kreativitas visual hingga pemrograman. Dengan mencoba berbagai hal baru, saya menemukan ketertarikan untuk menciptakan sesuatu melalui ide dan teknologi.',
        takeawayLabel: '',
        takeawayText: ''
    },
    {
        year: '2024',
        kind: 'milestone',
        badge: '✦ Eksperimen',
        title: 'Belajar Lewat Eksperimen',
        confession: '',
        body: 'Saya semakin banyak bereksperimen dan mengembangkan kemampuan. Saya mulai membangun berbagai proyek, mengeksplorasi desain, serta memahami bagaimana teknologi dapat membantu mewujudkan ide menjadi sesuatu yang nyata.',
        takeawayLabel: '',
        takeawayText: ''
    },
    {
        year: '2025',
        kind: 'spark',
        badge: '✦ Rasa Ingin Tahu',
        title: 'Melampaui Rasa Ingin Tahu',
        confession: '',
        body: 'Ketertarikan saya meluas ke berbagai bidang: teknologi komputer, sistem operasi, Linux, hingga ilustrasi digital. Saya menyadari selalu ada hal baru yang menarik untuk dipelajari di luar apa yang sudah saya kenal.',
        takeawayLabel: '',
        takeawayText: ''
    },
    {
        year: '2026',
        kind: 'milestone',
        badge: '✦ Menemukan Arah',
        title: 'Menemukan Arah di Informatika',
        confession: '',
        body: 'Kini saya semakin tertarik mendalami Informatika dan mulai mempersiapkan diri untuk melanjutkan pendidikan tinggi. Mengikuti OSN Informatika hingga tingkat provinsi menjadi salah satu pengalaman penting dalam perjalanan ini. Masih banyak hal yang ingin saya pelajari dan kembangkan.',
        takeawayLabel: '',
        takeawayText: ''
    },
    {
        year: 'Beyond',
        kind: 'spark',
        badge: '✦ Berikutnya',
        title: 'Masih Terus Bertumbuh',
        confession: '',
        body: 'Perjalanan ini masih panjang. Saya ingin terus mengeksplorasi berbagai bidang, mencoba hal baru, dan mengembangkan kemampuan tanpa membatasi diri pada satu ketertarikan. Bagi saya, rasa penasaran adalah salah satu alasan untuk terus berkembang.',
        takeawayLabel: '',
        takeawayText: ''
    }
];

function initCuriosityAndJourney() {
    // 1. Card Mouse-Spotlight Tracking pada Kartu Curiosity
    const curiosityCards = document.querySelectorAll('.curiosity-card');

    curiosityCards.forEach((card) => {
        card.addEventListener('mousemove', (event) => {
            const rect = card.getBoundingClientRect();
            const relX = event.clientX - rect.left;
            const relY = event.clientY - rect.top;
            card.style.setProperty('--spot-x', `${relX}px`);
            card.style.setProperty('--spot-y', `${relY}px`);
        }, { passive: true });
    });

    // 2. Glowing Red Thread Scroll Progression & Node Illumination
    const timelineContainer = document.getElementById('journey-timeline');
    const threadFill = document.getElementById('timeline-thread-fill');
    const timelineItems = document.querySelectorAll('.timeline-item');

    function updateTimelineProgress() {
        if (!timelineContainer || !threadFill) return;

        const rect = timelineContainer.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const triggerPoint = viewportHeight * 0.62;

        // Hitung persentase benang merah yang menyala berdasarkan posisi scroll
        const distancePassed = triggerPoint - rect.top;
        const totalHeight = rect.height;
        const fillPercentage = Math.min(100, Math.max(0, (distancePassed / totalHeight) * 100));

        threadFill.style.height = `${fillPercentage.toFixed(2)}%`;

        // Nyalakan titik tahun satu per satu saat terlewati garis baca
        timelineItems.forEach((item) => {
            const itemRect = item.getBoundingClientRect();
            const isPassed = itemRect.top <= triggerPoint;
            item.classList.toggle('is-lit', isPassed);
        });
    }

    window.addEventListener('scroll', updateTimelineProgress, { passive: true });
    window.addEventListener('resize', updateTimelineProgress, { passive: true });
    updateTimelineProgress();

    // Pastikan elemen .reveal-up di Part 3 teramati oleh observer global
    if (typeof window.observeRevealElements === 'function') {
        window.observeRevealElements(document);
    }
}

document.addEventListener('DOMContentLoaded', initCuriosityAndJourney);
/* ===== PART 4 — SELECTED WORKS FILTER & EXPANDABLE PROCESS DRAWER ===== */

// Data Terstruktur Karya & Proses (Sesuai Aturan 20)
const SELECTED_WORKS_DATA = [
    {
        id: 'bu-desty',
        index: 'KARYA 01',
        category: 'personal',
        categoryLabel: 'Proyek personal',
        subtitle: 'Website apresiasi dan kenangan',
        title: 'Website Ucapan Perpisahan untuk Bu Desty',
        summary: 'Website apresiasi dan kenangan untuk Ibu Desty, berisi pesan dari para siswa dalam sebuah halaman digital. Proyek ini menjadi cara saya menggabungkan teknologi dengan sesuatu yang personal.',
        stack: []
    },
    {
        id: 'jurnalistik-sman3-banjar',
        index: 'KARYA 02',
        category: 'organization',
        categoryLabel: 'Organisasi',
        subtitle: 'Media informasi dan publikasi',
        title: 'Website Jurnalistik SMAN 3 Banjar',
        summary: 'Mengembangkan dan mengelola website organisasi Jurnalistik SMAN 3 Banjar sebagai media informasi dan publikasi bagi kebutuhan organisasi.',
        stack: []
    },
    {
        id: 'jurnalistik-penerimaan-anggota',
        index: 'KARYA 03',
        category: 'organization',
        categoryLabel: 'Organisasi',
        subtitle: 'Pendaftaran anggota baru',
        title: 'Website Penerimaan Anggota Baru Jurnalistik',
        summary: 'Website untuk mendukung pendaftaran anggota baru organisasi Jurnalistik dengan proses berbasis web yang lebih praktis dan mudah diakses.',
        stack: []
    },
    {
        id: 'love-calculator',
        index: 'KARYA 04',
        category: 'experiment',
        categoryLabel: 'Eksperimen kecil',
        subtitle: 'Eksperimen interaktif',
        title: 'Love Calculator',
        summary: 'Proyek sederhana untuk bersenang-senang: pengguna memasukkan dua nama untuk mendapatkan hasil kecocokan secara interaktif. Sebuah eksplorasi dari ide spontan menjadi sesuatu yang nyata.',
        stack: []
    }
];

function initSelectedWorks() {
    const filterButtons = document.querySelectorAll('.filter-pill');
    const workItems = document.querySelectorAll('.work-item');
    const processToggleButtons = document.querySelectorAll('.btn-process-toggle');

    // 1. Instant Category Filter with Crimson Aura Flash
    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const selectedFilter = button.getAttribute('data-filter') || 'all';

            // Perbarui state tombol filter
            filterButtons.forEach((btn) => {
                const isCurrent = btn === button;
                btn.classList.toggle('is-active', isCurrent);
                btn.setAttribute('aria-pressed', String(isCurrent));
            });

            // Tampilkan karya yang sesuai dengan efek fade-in & kilatan aura merah
            workItems.forEach((item) => {
                const itemCategory = item.getAttribute('data-category');
                const shouldShow = selectedFilter === 'all' || itemCategory === selectedFilter;

                item.classList.remove('is-filtering-in');

                if (shouldShow) {
                    item.classList.remove('is-hidden');
                    // Trigger reflow agar animasi kilatan merah berjalan mulus setiap kali filter diklik
                    void item.offsetWidth;
                    item.classList.add('is-filtering-in');
                } else {
                    item.classList.add('is-hidden');
                }
            });
        });
    });

    // 2. Expandable project details drawer
    processToggleButtons.forEach((toggleBtn) => {
        toggleBtn.addEventListener('click', () => {
            const drawerId = toggleBtn.getAttribute('data-drawer-target');
            if (!drawerId) return;

            const drawerEl = document.getElementById(drawerId);
            const parentWorkItem = toggleBtn.closest('.work-item');
            const labelSpan = toggleBtn.querySelector('.btn-process-toggle__label');
            if (!drawerEl) return;

            const isCurrentlyOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
            const nextState = !isCurrentlyOpen;

            toggleBtn.setAttribute('aria-expanded', String(nextState));
            drawerEl.classList.toggle('is-open', nextState);
            drawerEl.setAttribute('aria-hidden', String(!nextState));

            if (parentWorkItem) {
                parentWorkItem.classList.toggle('is-drawer-open', nextState);
            }

            if (labelSpan) {
                labelSpan.textContent = nextState
                    ? 'Sembunyikan Detail Proyek'
                    : 'Lihat Detail Proyek';
            }
        });
    });

    // Daftarkan elemen .reveal-up baru di Part 4 ke observer global
    if (typeof window.observeRevealElements === 'function') {
        window.observeRevealElements(document);
    }
}

document.addEventListener('DOMContentLoaded', initSelectedWorks);
/* ===== PART 5 — "THE NOW" DATA, ONE-CLICK COPY EMAIL & MIDNIGHT WEB AUDIO ===== */

// Data Terstruktur Fokus Saat Ini ("The Now")
const NOW_STATUS_DATA = {
    updatedAt: 'NOVEMBER 2026',
    exploringHeadline: 'Currently exploring: WebGL Shaders, Creative Coding, & membaca buku tentang psikologi desain.',
    exploringBullets: [
        'Menulis fragmen GLSL sederhana untuk efek distorsi cahaya organik di permukaan kartu.',
        'Membangun sistem gerak berbasis fisika pegas murni tanpa ketergantungan library besar.'
    ],
    books: '“The Design of Everyday Things” & “The Poetics of Space”',
    coffee: 'V60 Bali Kintamani',
    soundtrack: 'Ambient Lo-Fi Synth'
};

function initNowFooterAndAudio() {
    // Procedural Midnight Ambient Soundscape (Web Audio API — Warm Pad + Soft Night Rain)
    const audioToggleBtn = document.getElementById('midnight-audio-toggle');
    const audioLabel = document.getElementById('midnight-audio-label');

    let audioCtx = null;
    let masterGain = null;
    let isPlayingAudio = false;

    function buildNocturnalSoundscape() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return false;

        audioCtx = new AudioContextClass();
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        masterGain.connect(audioCtx.destination);

        // Layer A: Warm Low-Frequency Lo-Fi Drone Pad (A2 + E3 gentle detuned sine/triangle)
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const padFilter = audioCtx.createBiquadFilter();
        const padGain = audioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(110, audioCtx.currentTime); // A2

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(164.81, audioCtx.currentTime); // E3

        padFilter.type = 'lowpass';
        padFilter.frequency.setValueAtTime(280, audioCtx.currentTime);

        padGain.gain.setValueAtTime(0.055, audioCtx.currentTime);

        osc1.connect(padFilter);
        osc2.connect(padFilter);
        padFilter.connect(padGain);
        padGain.connect(masterGain);

        osc1.start();
        osc2.start();

        // Layer B: Soft Nocturnal Rain Texture (Filtered Pink-ish Noise Buffer)
        const bufferSize = audioCtx.sampleRate * 3;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.015;
            b6 = white * 0.115926;
        }

        const rainSource = audioCtx.createBufferSource();
        rainSource.buffer = noiseBuffer;
        rainSource.loop = true;

        const rainFilter = audioCtx.createBiquadFilter();
        rainFilter.type = 'bandpass';
        rainFilter.frequency.setValueAtTime(620, audioCtx.currentTime);
        rainFilter.Q.setValueAtTime(0.7, audioCtx.currentTime);

        const rainGain = audioCtx.createGain();
        rainGain.gain.setValueAtTime(0.08, audioCtx.currentTime);

        rainSource.connect(rainFilter);
        rainFilter.connect(rainGain);
        rainGain.connect(masterGain);
        rainSource.start();

        return true;
    }

    if (audioToggleBtn) {
        audioToggleBtn.addEventListener('click', async () => {
            if (!audioCtx) {
                const created = buildNocturnalSoundscape();
                if (!created) return;
            }

            if (audioCtx.state === 'suspended') {
                await audioCtx.resume();
            }

            isPlayingAudio = !isPlayingAudio;
            audioToggleBtn.setAttribute('aria-pressed', String(isPlayingAudio));

            const now = audioCtx.currentTime;
            if (isPlayingAudio) {
                masterGain.gain.cancelScheduledValues(now);
                masterGain.gain.setTargetAtTime(0.32, now, 0.6);
                if (audioLabel) audioLabel.textContent = 'Midnight Audio: On';
                audioToggleBtn.setAttribute('aria-label', 'Matikan suara latar Midnight Ambient');
            } else {
                masterGain.gain.cancelScheduledValues(now);
                masterGain.gain.setTargetAtTime(0.0001, now, 0.35);
                if (audioLabel) audioLabel.textContent = 'Midnight Audio: Off';
                audioToggleBtn.setAttribute('aria-label', 'Nyalakan suara latar Midnight Ambient');
            }
        });
    }

    // Daftarkan elemen .reveal-up di Part 5 ke observer global
    if (typeof window.observeRevealElements === 'function') {
        window.observeRevealElements(document);
    }
}

document.addEventListener('DOMContentLoaded', initNowFooterAndAudio);
/* ===== PART 6 — CROSS-SECTION REFINEMENT, KEYBOARD SHORTCUTS & UX POLISH ===== */

function initFinalPolish() {
    // 1. Suntikkan Petunjuk Keyboard Shortcut Halus di Desktop (Pojok Kiri Bawah)
    const shortcutHint = document.createElement('div');
    shortcutHint.className = 'shortcut-toast';
    shortcutHint.setAttribute('aria-hidden', 'true');
    shortcutHint.innerHTML = '<span>Shortcut:</span> <kbd>M</kbd> <span>Audio</span>';
    document.body.appendChild(shortcutHint);

    // Keyboard shortcut: Tekan [M] untuk toggle audio.
    window.addEventListener('keydown', (event) => {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        const isTyping = activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable;
        if (isTyping || event.metaKey || event.ctrlKey || event.altKey) return;

        const key = event.key.toLowerCase();

        if (key === 'm') {
            const audioBtn = document.getElementById('midnight-audio-toggle');
            if (audioBtn) audioBtn.click();
        }
    });

    // 3. Penyempurnaan Auto-Focus & Scroll Halus Saat Detail Proyek Dibuka
    const processButtons = document.querySelectorAll('.btn-process-toggle');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    processButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const isExpanded = btn.getAttribute('aria-expanded') === 'true';
            const drawerId = btn.getAttribute('data-drawer-target');
            const drawerEl = drawerId ? document.getElementById(drawerId) : null;

            if (isExpanded && drawerEl) {
                setTimeout(() => {
                    const rect = drawerEl.getBoundingClientRect();
                    const isBelowViewport = rect.bottom > window.innerHeight;
                    if (isBelowViewport) {
                        window.scrollBy({
                            top: Math.min(220, rect.bottom - window.innerHeight + 48),
                            behavior: prefersReducedMotion ? 'auto' : 'smooth'
                        });
                    }
                }, 260);
            }
        });
    });

    // 4. Pastikan Active Spy Menyorot "Now" Saat Pengguna Mencapai Dasar Halaman
    window.addEventListener('scroll', () => {
        const scrolledToBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 40;
        if (scrolledToBottom) {
            const navLinks = document.querySelectorAll('.capsule-nav__link');
            navLinks.forEach((link) => {
                const isNow = link.getAttribute('data-section') === 'now';
                link.classList.toggle('is-active', isNow);
            });
        }
    }, { passive: true });
}

document.addEventListener('DOMContentLoaded', initFinalPolish);