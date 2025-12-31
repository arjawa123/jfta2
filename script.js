/**
 * JFT Simulation - Modern Core Script
 * Tanpa Bootstrap - Menggunakan CSS Grid/Flexbox
 * Kompatibel dengan data: SimulationJFT1Questions, dsb.
 */

// --- Global State ---
let currentTest = null;
let userAnswers = [];
let currentQuestionIndex = 0;
let countdown = null;
const mainContainer = document.getElementById("app-container");

// Mapping Section (JFT-Basic Standard)
const sectionNames = {
    1: "Script and Vocabulary",
    2: "Conversation and Expression",
    3: "Listening",
    4: "Reading"
};

/** * 1. FUNGSI FETCH DATA (PENGGANTI POLLING)
 */
async function loadTestData(fileName) {
  console.log(fileName)
    try {
        const response = await fetch(`data/${fileName}.json`);
        if (!response.ok) throw new Error('Gagal memuat file kuis');
        currentTest = await response.json();
        startQuiz();
    } catch (error) {
        console.error("Error:", error);
        alert("Maaf, data kuis gagal dimuat.");
    }
}

/**
 * 1. INITIALIZATION
 */
const initApp = () => {
    renderLandingPage();
};

const clearMain = () => {
    mainContainer.innerHTML = "";
};

/**
 * 2. UI RENDERERS (LANDING & SELECTION)
 */
const renderLandingPage = () => {
    clearMain();
    
    // Cek data session storage
    const savedSession = JSON.parse(sessionStorage.getItem('jft_progress'));
    
    const hero = document.createElement("div");
    hero.className = "hero-section";
    hero.innerHTML = `
        <h1 class="fade-in">JFT Simulation <span>Modern</span></h1>
        <p class="fade-in">Tingkatkan skor JFT-Basic Anda dengan simulasi yang presisi dan interaktif.</p>
    `;

    const grid = document.createElement("div");
    grid.className = "test-grid";

    // Daftar nama file JSON Anda
    const availableTests = [
        { id: "simulation-1", title: "Simulation JFT-1" },
        { id: "simulation-2", title: "Simulation JFT-2" }
    ];

    // 'tests' berasal dari jft-main-db.js
    availableTests.forEach((test) => {
        // Cek apakah paket ini yang sedang tersimpan sesinya
        const isContinuing = savedSession && savedSession.testId === test.title;
        
        const card = document.createElement("div");
        card.className = `card test-card fade-in ${isContinuing ? 'has-session' : ''}`;
        card.innerHTML = `
            <div class="card-tag">${isContinuing ? 'Sedang Berjalan' : 'A2 Level'}</div>
            <h3>${test.title}</h3>
            <div class="btn-group-vertical">
                <button class="btn ${isContinuing ? 'btn-warning' : 'btn-primary'}" 
                        onclick="confirmStart('${test.title}')">
                    ${isContinuing ? '<i class="fa-solid fa-play"></i> Lanjutkan Sesi' : 'Pilih Paket'}
                </button>
                ${isContinuing ? `
                    <button class="btn btn-link-danger" onclick="resetSessionManual('${test.title}')" style="margin-top:10px; font-size:0.8rem;">
                        <i class="fa-solid fa-rotate-right"></i> Ulang dari Awal
                    </button>
                ` : ''}
            </div>
        `;
        grid.appendChild(card);
    });

    mainContainer.appendChild(hero);
    mainContainer.appendChild(grid);
};

const confirmStart = (index) => {
    // currentTest = tests[index];
    //currentTest = index;
    clearMain();

    const conf = document.createElement("div");
    conf.className = "card confirmation-card fade-in";
    conf.innerHTML = `
        <h2>Instruksi Ujian</h2>
        <div class="instruction-list">
            <div class="ins-item"><i class="fa-solid fa-check"></i> Waktu pengerjaan adalah 60 menit.</div>
            <div class="ins-item"><i class="fa-solid fa-check"></i> Anda tidak bisa kembali ke sesi sebelumnya setelah dikunci.</div>
            <div class="ins-item"><i class="fa-solid fa-check"></i> Pastikan audio Anda terdengar jelas untuk sesi Listening.</div>
        </div>
        <div class="btn-group">
            <button class="btn btn-outline" onclick="renderLandingPage()">Kembali</button>
            <button class="btn btn-primary" onclick="loadTestData('${index}')">Saya Mengerti, Mulai</button>
        </div>
    `;
    mainContainer.appendChild(conf);
};

/**
 * 3. QUIZ CORE LOGIC
 */
/**
 * 3. QUIZ CORE LOGIC (WITH SECTION SHUFFLE)
 */
const startQuiz = () => {
    // Cek apakah ada progres tersimpan
    const hasProgress = loadProgress();
    // 1. Kelompokkan soal berdasarkan section (1-4)
    const sections = { 1: [], 2: [], 3: [], 4: [] };
    currentTest.questions.forEach(q => {
        if (sections[q.section]) {
            sections[q.section].push(q);
        }
    });

    // 2. Shuffle soal di dalam masing-masing section
    // 3. Gabungkan kembali menjadi satu array berurutan: Sec 1 -> Sec 2 -> Sec 3 -> Sec 4
    let shuffledQuestions = [];
    for (let i = 1; i <= 4; i++) {
        const shuffledGroup = shuffleArray(sections[i]);
        shuffledQuestions = [...shuffledQuestions, ...shuffledGroup];
    }

    // 4. Timpa data soal asli dengan yang sudah di-shuffle (per section)
    currentTest.questions = shuffledQuestions;

    // 5. Inisialisasi jawaban kosong
    const saved = sessionStorage.getItem('jft_progress');
    let timeLimit = 3600; // Default 60 menit

    if (saved) {
        const data = JSON.parse(saved);
        if (data.testId === currentTest.name) {
            userAnswers = data.answers; //
            currentQuestionIndex = data.currentIndex; //
            timeLimit = data.remainingTime; // Gunakan sisa waktu tersimpan
        }
    } else {
        // Jika tidak ada, buat inisialisasi baru seperti biasa
        userAnswers = currentTest.questions.map(q => ({
            id: q.id,
            section: q.section,
            answer: null,
            visited: false
        }));
        currentQuestionIndex = 0;
    }

    //currentQuestionIndex = 0;
    renderQuizInterface();
    startTimer(timeLimit); // 60 Menit
};

/**
 * Fungsi pembantu untuk mengacak array (Fisher-Yates Shuffle)
 */
function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}


const renderQuizInterface = () => {
    clearMain();

    // Top Bar (Timer & Progress)
    const topBar = document.createElement("div");
    topBar.className = "quiz-header no-print";
    topBar.innerHTML = `
        <div class="header-left">
            <span class="test-name-label">${currentTest.name}</span>
            <span class="section-badge" id="section-label">Section 1</span>
        </div>
        <div class="timer-display" id="main-timer">00:00</div>
        <button class="btn btn-danger" onclick="handleFinishSession()">Kunci Sesi</button>
    `;
    
    // Tambahkan Progress Bar tepat di bawah Top Bar
    const progressBar = document.createElement("div");
    progressBar.className = "progress-container no-print";
    progressBar.innerHTML = `<div class="progress-fill" id="quiz-progress"></div>`;


    // Main Content (Question & Nav)
    const quizBody = document.createElement("div");
    quizBody.className = "quiz-body";
    
    const questionArea = document.createElement("div");
    questionArea.id = "question-display-area";
    questionArea.className = "question-area";

    const sidebar = document.createElement("div");
    sidebar.className = "quiz-sidebar no-print";
    sidebar.innerHTML = `
        <div class="sidebar-title">Nomor Soal</div>
        <div class="q-navigation-grid" id="q-nav"></div>
    `;

    quizBody.appendChild(questionArea);
    quizBody.appendChild(sidebar);

    mainContainer.appendChild(topBar);
    mainContainer.appendChild(progressBar); // Masukkan progress bar ke main
    mainContainer.appendChild(quizBody);

    updateQuestionDisplay();
    renderNavigationGrid();
    updateProgressBar(); // Panggil fungsi update pertama kali
};

/**
 * 4. QUESTION DISPLAY LOGIC
 */
const updateQuestionDisplay = () => {
    const area = document.getElementById("question-display-area");
    // Memberikan efek animasi "reset" setiap ganti soal
    //area.style.animation = 'none';
    //area.offsetHeight; /* trigger reflow */
    //area.style.animation = null; 
    //area.classList.add('fade-in');
    
       // Animasi fade hanya saat ganti soal
    area.classList.remove('fade-in');
    void area.offsetWidth; // Trigger reflow agar animasi bisa mulai lagi
    area.classList.add('fade-in');
    
    
    const q = currentTest.questions[currentQuestionIndex];
    const uAns = userAnswers[currentQuestionIndex];
    
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update Section Label
    document.getElementById("section-label").innerText = sectionNames[q.section];
    
    let mediaHTML = "";
    if (q.sound) {
        mediaHTML += `
            <div class="audio-container card">
                <p><i class="fa-solid fa-volume-up"></i> Sesi Listening</p>
                <audio controls src="./assets/sounds/${q.sound}"></audio>
            </div>
        `;
    }
    if (q.image) {
        mediaHTML += `
            <div class="image-container">
                <img src="./assets/images/${q.image}" class="img-fluid" alt="Soal ${q.id}">
            </div>
        `;
    }

    // Bagian di dalam updateQuestionDisplay
    area.innerHTML = `
        <div class="question-card fade-in">
            <div class="q-number" style="font-weight:bold; margin-bottom:10px; color:var(--text-light)">
                Soal #${currentQuestionIndex + 1}
            </div>
            ${mediaHTML}
            <div class="q-text" style="font-size:1.2rem; margin-bottom:1.5rem;">${q.text}</div>
            
            <div class="options-grid">
                ${q.answers.map((ans, idx) => `
                    <div class="option-card ${uAns.answer === idx ? 'selected' : ''}" 
                         onclick="recordAnswer(${idx})">
                        <span class="opt-index">${String.fromCharCode(65 + idx)}</span>
                        <span class="opt-text">${ans.text}</span>
                    </div>
                `).join('')}
            </div>
    
            <div class="nav-controls no-print">
                <button class="btn btn-outline" ${currentQuestionIndex === 0 ? 'disabled' : ''} onclick="navigate(-1)">
                    <i class="fa-solid fa-chevron-left"></i> Sebelumnya
                </button>
                <button class="btn btn-outline" ${currentQuestionIndex === currentTest.questions.length - 1 ? 'disabled' : ''} onclick="navigate(1)">
                    Berikutnya <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `;
    
    uAns.visited = true;
    renderNavigationGrid();
};

const recordAnswer = (index) => {
    // Simpan jawaban
    userAnswers[currentQuestionIndex].answer = index;

    // Update tampilan pilihan secara instan tanpa re-render seluruh area
    const options = document.querySelectorAll('.option-card');
    options.forEach((card, i) => {
        if (i === index) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    
    // Update navigasi di sidebar
    renderNavigationGrid();
    saveProgress(); // Simpan setiap kali menjawab
    updateProgressBar(); // Tambahkan ini agar bar bergerak
};

const updateProgressBar = () => {
    const progressFill = document.getElementById("quiz-progress");
    if (!progressFill) return;

    const totalQuestions = userAnswers.length;
    const answeredCount = userAnswers.filter(ans => ans.answer !== null).length;
    const percentage = (answeredCount / totalQuestions) * 100;

    progressFill.style.width = `${percentage}%`;
};


const navigate = (step) => {
    currentQuestionIndex += step;
    updateQuestionDisplay();
};

const jumpToQuestion = (index) => {
    currentQuestionIndex = index;
    updateQuestionDisplay();
};

const renderNavigationGrid = () => {
    const navGrid = document.getElementById("q-nav");
    if (!navGrid) return;

    navGrid.innerHTML = userAnswers.map((ans, idx) => {
        // Tambahkan class khusus berdasarkan section (opsional untuk styling)
        const sectionClass = `sec-color-${ans.section}`;
        return `
            <div class="nav-item ${ans.answer !== null ? 'answered' : ''} ${currentQuestionIndex === idx ? 'current' : ''} ${sectionClass}" 
                 onclick="jumpToQuestion(${idx})">
                ${idx + 1}
            </div>
        `;
    }).join('');
};


/**
 * 5. TIMER & END LOGIC
 */
const startTimer = (seconds) => {
    let time = seconds;
    const timerEl = document.getElementById("main-timer"); //
    
    countdown = setInterval(() => {
        time--;
        let mins = Math.floor(time / 60);
        let secs = time % 60;
        timerEl.innerText = `${mins}:${secs < 10 ? '0' + secs : secs}`;

        // Simpan sisa waktu ke storage setiap 5 detik (agar tidak terlalu berat)
        if (time % 5 === 0) saveProgress(time);

        if (time < 300) timerEl.style.color = "#ef4444"; //
        
        if (time <= 0) {
            clearInterval(countdown);
            showFinalResult(); //
        }
    }, 1000);
};

const resetSessionManual = (testTitle) => {
    if (confirm(`Apakah Anda yakin ingin menghapus progres di ${testTitle} dan mengulang dari awal?`)) {
        sessionStorage.removeItem('jft_progress');
        renderLandingPage(); // Refresh tampilan menu utama
    }
};

const handleFinishSession = () => {
    const unanswered = userAnswers.filter(a => a.answer === null).length;
    let msg = "Apakah Anda yakin ingin menyelesaikan simulasi?";
    if (unanswered > 0) msg += `\n(Ada ${unanswered} soal yang belum dijawab)`;

    if (confirm(msg)) {
        showFinalResult();
    }
};

/**
 * 6. SCORING & RESULTS
 */
const showFinalResult = () => {
    clearInterval(countdown);
    sessionStorage.removeItem('jft_progress'); // Hapus saat ujian berakhir
    clearMain();

    // Hitung Skor per Seksi
    const sectionScores = [1, 2, 3, 4].map(sId => {
        const qInSec = currentTest.questions.filter(q => q.section === sId);
        let correct = 0;
        
        qInSec.forEach(q => {
            const uAns = userAnswers.find(ua => ua.id === q.id);
            if (uAns && uAns.answer === q.keyid) correct++;
        });

        // Logika skor JFT (4.4 per soal di Sec 1-2, 6 per soal di Sec 3-4)
        let weighted = (sId <= 2) ? (correct * 4.4) : (correct * 6);
        return {
            id: sId,
            name: sectionNames[sId],
            correct: correct,
            totalQ: qInSec.length,
            points: Math.round(weighted)
        };
    });

    const totalPoints = sectionScores.reduce((a, b) => a + b.points, 0);
    const passed = totalPoints >= 200;

    const resultPage = document.createElement("div");
    resultPage.className = "result-container fade-in";
        const today = new Date().toLocaleDateString('id-ID', { 
        day: 'numeric', month: 'long', year: 'numeric' 
    });

    resultPage.innerHTML = `
        <div class="result-container fade-in">
            <div class="result-card card">
                <div class="result-header">
                    <div class="no-print status-icon ${passed ? 'pass' : 'fail'}" style="font-size: 3rem; margin-bottom: 1rem;">
                        <i class="fa-solid ${passed ? 'fa-circle-check' : 'fa-circle-xmark'}" style="color: ${passed ? '#10b981' : '#ef4444'}"></i>
                    </div>
                    <h1 style="margin-bottom: 0.5rem;">${passed ? 'LULUS' : 'TIDAK LULUS'}</h1>
                    <p style="color: var(--text-light); margin-bottom: 1.5rem;">Dikeluarkan pada: ${today}</p>
                    <div class="total-score" style="font-size: 3rem; font-weight: 700; color: var(--primary);">
                        ${totalPoints} <span style="font-size: 1.5rem; color: var(--text-light);">/ 250</span>
                    </div>
                </div>

                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 2rem 0;">

                <div class="score-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    ${sectionScores.map(s => `
                        <div class="score-item" style="padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <label style="display: block; font-size: 0.8rem; color: var(--text-light);">${s.name}</label>
                            <div class="score-val" style="font-size: 1.2rem; font-weight: bold;">${s.points} Pts</div>
                            <small>${s.correct}/${s.totalQ} Jawaban Benar</small>
                        </div>
                    `).join('')}
                </div>

                <div class="result-actions no-print" style="margin-top: 2.5rem; display: flex; gap: 10px; justify-content: center;">
                    <button class="btn btn-primary" onclick="renderReviewPage()">Review Jawaban</button>
                    <button class="btn btn-outline" onclick="window.print()">
                        <i class="fa-solid fa-print"></i> Cetak Hasil
                    </button>
                    <button class="btn btn-outline" onclick="location.reload()">Selesai</button>
                </div>
            </div>
        </div>
    `;


    mainContainer.appendChild(resultPage);
};

const renderReviewPage = () => {
    clearMain();
    
    const reviewContainer = document.createElement("div");
    reviewContainer.className = "review-container fade-in";
    
    // --- 1. Hitung Statistik Per Section ---
    const stats = [1, 2, 3, 4].map(sId => {
        const questionsInSec = currentTest.questions.filter(q => q.section === sId);
        const correctCount = questionsInSec.filter(q => {
            const uAns = userAnswers.find(ua => ua.id === q.id);
            return uAns && uAns.answer === q.keyid;
        }).length;
        
        const total = questionsInSec.length;
        const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
        
        return {
            id: sId,
            name: sectionNames[sId],
            correct: correctCount,
            total: total,
            percent: percentage
        };
    });

    // --- 2. Header & Bar Statistik ---
    let headerHTML = `
        <div class="review-header card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="margin:0;">Review & Statistik</h2>
                <button class="btn btn-primary" onclick="location.reload()">Selesai & Kembali</button>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                ${stats.map(s => `
                    <div class="stat-box" style="padding: 10px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0;">
                        <small style="display: block; color: var(--text-light); font-size: 0.75rem;">${s.name}</small>
                        <div style="font-weight: bold; font-size: 1.1rem; color: ${s.percent >= 80 ? '#10b981' : '#f59e0b'}">${s.percent}%</div>
                        <div style="width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; margin-top: 5px; overflow: hidden;">
                            <div style="width: ${s.percent}%; height: 100%; background: ${s.id === 1 ? '#3b82f6' : s.id === 2 ? '#f59e0b' : s.id === 3 ? '#8b5cf6' : '#ec4899'}"></div>
                        </div>
                        <small style="font-size: 0.7rem;">${s.correct}/${s.total} Benar</small>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // --- 3. Pemisahan Soal (Salah vs Benar) ---
    const incorrectQuestions = [];
    const correctQuestions = [];

    currentTest.questions.forEach((q, idx) => {
        const uAns = userAnswers.find(ua => ua.id === q.id);
        const isCorrect = uAns && uAns.answer === q.keyid;
        const questionData = { ...q, originalIndex: idx + 1, userResponse: uAns };
        
        if (isCorrect) correctQuestions.push(questionData);
        else incorrectQuestions.push(questionData);
    });

    const sortedQuestions = [...incorrectQuestions, ...correctQuestions];
    let reviewHTML = headerHTML;

    // --- 4. Render Soal (Urutan: Salah -> Benar) ---
    sortedQuestions.forEach((q) => {
        const isCorrect = q.userResponse && q.userResponse.answer === q.keyid;
        const sColor = q.section === 1 ? '#3b82f6' : q.section === 2 ? '#f59e0b' : q.section === 3 ? '#8b5cf6' : '#ec4899';
        
        reviewHTML += `
            <div class="question-card card" style="margin-bottom: 1.5rem; border-left: 6px solid ${isCorrect ? '#10b981' : '#ef4444'}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="background: ${sColor}15; color: ${sColor}; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
                        ${sectionNames[q.section]}
                    </span>
                    <span style="font-weight: bold; font-size: 0.85rem; color: ${isCorrect ? '#10b981' : '#ef4444'}">
                        ${isCorrect ? '<i class="fa-solid fa-check-circle"></i> Benar' : '<i class="fa-solid fa-circle-xmark"></i> Salah'}
                    </span>
                </div>
                
                <div class="q-text" style="margin-top: 15px; font-size: 1.05rem;">
                    <strong>Soal #${q.originalIndex}:</strong> ${q.text}
                </div>
                
                ${q.image ? `<img src="./assets/images/${q.image}" style="max-width:100%; max-height: 250px; margin: 15px 0; border-radius: 8px;">` : ''}

                <div style="margin-top: 15px; display: grid; gap: 8px;">
                    ${q.answers.map((ans, aIdx) => {
                        let bgColor = "transparent";
                        let borderColor = "#e2e8f0";
                        let icon = "";

                        if (aIdx === q.keyid) {
                            bgColor = "#d1fae5"; 
                            borderColor = "#10b981";
                            icon = '<i class="fa-solid fa-check-circle" style="float: right;"></i>';
                        } else if (q.userResponse && aIdx === q.userResponse.answer && !isCorrect) {
                            bgColor = "#fee2e2"; 
                            borderColor = "#ef4444";
                            icon = '<i class="fa-solid fa-circle-xmark" style="float: right;"></i>';
                        }
                        
                        return `
                            <div style="padding: 10px 15px; border-radius: 10px; border: 2px solid ${borderColor}; background: ${bgColor}; font-size: 0.95rem;">
                                <span style="font-weight: bold; margin-right: 8px;">${String.fromCharCode(65 + aIdx)}</span> 
                                ${ans.text} ${icon}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    });

    reviewContainer.innerHTML = reviewHTML;
    mainContainer.appendChild(reviewContainer);
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const saveProgress = (currentTime) => {
    const progressData = {
        testId: currentTest.name, //
        answers: userAnswers, //
        currentIndex: currentQuestionIndex, //
        remainingTime: currentTime // Simpan sisa detik terakhir
    };
    sessionStorage.setItem('jft_progress', JSON.stringify(progressData));
};


const loadProgress = () => {
    const saved = sessionStorage.getItem('jft_progress');
    if (saved) {
        const data = JSON.parse(saved);
        
        // Pastikan paket yang dimuat sama dengan yang sedang dikerjakan
        if (data.testId === currentTest.name) {
            userAnswers = data.answers;
            currentQuestionIndex = data.currentIndex;
            return true;
        }
    }
    return false;
};



// Tambahkan di bagian paling bawah script.js
window.addEventListener('scroll', () => {
    const header = document.querySelector('.main-header');
    if (window.scrollY > 10) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});


// Start the app
initApp();
