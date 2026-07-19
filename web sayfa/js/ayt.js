// AYT Question Module

// State management
let selectedSubject = null;
let selectedTopic = null;
let selectedDifficulty = null;
let currentQuestion = null;
let selectedAnswer = null;
let timerInterval = null;
let startTime = null;

// Session statistics
let sessionStats = {
    total: 0,
    correct: 0,
    wrong: 0
};

// Topics by subject (AYT specific)
const subjectTopics = {
    'Matematik': [
        'Türev', 'İntegral', 'Limit', 'Logaritma', 
        'Trigonometri', 'Analitik Geometri', 'Karmaşık Sayılar'
    ],
    'Fizik': [
        'Elektrik ve Manyetizma', 'Modern Fizik', 'Optik', 
        'Atom Fiziği', 'Dalga Mekaniği', 'Termodinamik'
    ],
    'Kimya': [
        'Organik Kimya', 'Reaksiyonlar', 'Elektrokimya', 
        'Kimyasal Denge', 'Termokimya', 'Karışımlar'
    ],
    'Biyoloji': [
        'Genetik', 'Ekosistem', 'Bitki Biyolojisi', 
        'Hayvan Biyolojisi', 'Hücre Bölünmesi', 'Homeostazi'
    ],
    'Edebiyat': [
        'Divan Edebiyatı', 'Halk Edebiyatı', 'Tanzimat Edebiyatı', 
        'Cumhuriyet Dönemi Edebiyatı', 'Yeni Türk Edebiyatı'
    ],
    'Tarih': [
        'İlk ve Orta Çağ Türk Tarihi', 'Yeni ve Yakınçağ Tarihi', 
        'Osmanlı Tarihi', '20. Yüzyıl Türk ve Dünya Tarihi'
    ],
    'Coğrafya': [
        'Beşeri Sistemler', 'Doğal Sistemler', 'Türkiye Coğrafyası', 
        'Çevre ve Toplum', 'Harita Bilgisi'
    ],
    'Felsefe': [
        'Bilgi Felsefesi', 'Bilim Felsefesi', 'Ahlak Felsefesi', 
        'Siyaset Felsefesi', 'Sanat Felsefesi'
    ],
    'Din Kültürü': [
        'İslam Tarihi', 'İslam Düşüncesi', 'Ahlak', 
        'İbadet', 'Kur\'an ve Siyer'
    ]
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    if (currentUser) {
        updateUserDisplay();
    }
    
    // Load pricing.js dynamically if not loaded
    if (!window.subscriptionManager) {
        const script = document.createElement('script');
        script.src = 'js/pricing.js';
        document.head.appendChild(script);
    }
});

// Update user display
function updateUserDisplay() {
    if (currentUser) {
        document.getElementById('userNameDisplay').innerHTML = 
            `<i class="fas fa-user"></i> ${currentUser.full_name}`;
    }
}

// Subject selection
function selectSubject(subject) {
    selectedSubject = subject;
    
    // Show topics for this subject
    const topics = subjectTopics[subject] || [];
    const topicGrid = document.getElementById('topicGrid');
    
    topicGrid.innerHTML = '';
    topics.forEach(topic => {
        const button = document.createElement('button');
        button.className = 'selection-card';
        button.onclick = () => selectTopic(topic);
        button.innerHTML = `
            <i class="fas fa-book-open"></i>
            <span>${topic}</span>
        `;
        topicGrid.appendChild(button);
    });
    
    // Show topic selection, hide subject selection
    document.getElementById('subjectSelection').style.display = 'none';
    document.getElementById('topicSelection').style.display = 'block';
}

// Topic selection
function selectTopic(topic) {
    selectedTopic = topic;
    
    // Show difficulty selection
    document.getElementById('topicSelection').style.display = 'none';
    document.getElementById('difficultySelection').style.display = 'block';
}

// Difficulty selection
function selectDifficulty(difficulty) {
    selectedDifficulty = difficulty;
    
    // Hide difficulty selection, show question section
    document.getElementById('difficultySelection').style.display = 'none';
    document.getElementById('questionSection').style.display = 'block';
    
    // Update badges
    document.getElementById('subjectBadge').textContent = selectedSubject;
    document.getElementById('topicBadge').textContent = selectedTopic;
    document.getElementById('difficultyBadge').textContent = selectedDifficulty;
    
    // Load first question
    loadQuestion();
}

// Back navigation
function backToSubjectSelection() {
    document.getElementById('topicSelection').style.display = 'none';
    document.getElementById('subjectSelection').style.display = 'block';
    selectedSubject = null;
}

function backToTopicSelection() {
    document.getElementById('difficultySelection').style.display = 'none';
    document.getElementById('topicSelection').style.display = 'block';
    selectedTopic = null;
}

function backToDifficultySelection() {
    if (confirm('Soru çözmeyi bitirmek istediğinizden emin misiniz?')) {
        stopTimer();
        document.getElementById('questionSection').style.display = 'none';
        document.getElementById('difficultySelection').style.display = 'block';
        selectedDifficulty = null;
        resetSession();
    }
}

// Load question
async function loadQuestion() {
    // Check subscription limit
    if (window.subscriptionManager) {
        const canSolve = await window.subscriptionManager.canSolveQuestion(selectedSubject);
        if (!canSolve) {
            showAlert(`${selectedSubject} dersinden 40 soru hakkınızı kullandınız veya ücretsiz süreniz doldu! Premium plana geçmek için <a href="pricing.html" style="color: white; text-decoration: underline;">buraya tıklayın</a>.', 'error');
            setTimeout(() => {
                window.location.href = 'pricing.html';
            }, 3000);
            return;
        }
    }
    
    showLoading();
    selectedAnswer = null;
    
    try {
        // First, try to load from database
        const response = await fetch('tables/questions?limit=1000');
        const data = await response.json();
        
        // Filter questions by criteria
        const matchingQuestions = data.data.filter(q => 
            q.exam_type === 'AYT' &&
            q.subject === selectedSubject &&
            q.topic === selectedTopic &&
            q.difficulty === selectedDifficulty
        );
        
        if (matchingQuestions.length > 0) {
            // Select random question from matching ones
            currentQuestion = matchingQuestions[Math.floor(Math.random() * matchingQuestions.length)];
            displayQuestion();
        } else {
            // Generate new question with AI
            await generateNewQuestion();
        }
    } catch (error) {
        console.error('Error loading question:', error);
        showAlert('Soru yüklenirken bir hata oluştu!', 'error');
        hideLoading();
    }
}

// Generate new question using AI (via N8N + GPT-4o)
async function generateNewQuestion() {
    showLoading();
    
    try {
        let questionData;
        
        // Check if N8N integration is enabled
        if (window.n8nClient && window.n8nClient.isEnabled()) {
            console.log('🤖 Generating question with N8N + GPT-4o...');
            
            // Call N8N webhook to generate question using GPT-4o
            questionData = await window.n8nClient.generateQuestion(
                'AYT',
                selectedSubject,
                selectedTopic,
                selectedDifficulty
            );
            
            console.log('✅ Question generated by AI:', questionData);
            
        } else {
            console.log('⚠️ N8N disabled, using fallback question...');
            // Use fallback sample question
            questionData = createSampleQuestion();
        }
        
        // If question has ID (already saved by N8N), use it directly
        if (questionData.id) {
            currentQuestion = questionData;
            displayQuestion();
        } else {
            // Save to database if not already saved
            const response = await fetch('tables/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(questionData)
            });
            
            if (response.ok) {
                currentQuestion = await response.json();
                displayQuestion();
            } else {
                throw new Error('Failed to save question');
            }
        }
        
    } catch (error) {
        console.error('Error generating question:', error);
        showAlert('Soru oluşturulurken bir hata oluştu! Fallback soru kullanılıyor...', 'warning');
        
        // Fallback to sample question on error
        try {
            const fallbackQuestion = createSampleQuestion();
            const response = await fetch('tables/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fallbackQuestion)
            });
            
            if (response.ok) {
                currentQuestion = await response.json();
                displayQuestion();
            }
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            hideLoading();
        }
    }
}

// Create sample question
function createSampleQuestion() {
    const templates = {
        'Matematik': {
            'Sayılar': [
                {
                    question: `${Math.floor(Math.random() * 5) + 2}x + ${Math.floor(Math.random() * 10) + 5} = ${Math.floor(Math.random() * 20) + 10} denkleminde x kaçtır?`,
                    options: ['2', '3', '4', '5', '6'],
                    correct: 1,
                    explanation: 'Denklemi çözmek için önce sabitleri sağa alalım, sonra x katsayısına bölelim.'
                }
            ]
        }
    };
    
    const questionData = {
        exam_type: 'AYT',
        subject: selectedSubject,
        topic: selectedTopic,
        difficulty: selectedDifficulty,
        question_text: 'Bu soru AI tarafından oluşturulacak. N8N entegrasyonu ile GPT-4o kullanılarak dinamik sorular üretilecek.',
        option_a: 'Seçenek A',
        option_b: 'Seçenek B',
        option_c: 'Seçenek C',
        option_d: 'Seçenek D',
        option_e: 'Seçenek E',
        correct_answer: 'A',
        explanation: 'Bu çözüm AI tarafından oluşturulacak.',
        generated_by_ai: true,
        created_date: new Date().toISOString()
    };
    
    return questionData;
}

// Display question
function displayQuestion() {
    hideLoading();
    
    // Show question content
    document.getElementById('questionContent').style.display = 'block';
    document.getElementById('answerFeedback').style.display = 'none';
    
    // Set question text
    document.getElementById('questionText').innerHTML = currentQuestion.question_text;
    
    // Set options
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    const options = [
        { letter: 'A', text: currentQuestion.option_a },
        { letter: 'B', text: currentQuestion.option_b },
        { letter: 'C', text: currentQuestion.option_c },
        { letter: 'D', text: currentQuestion.option_d },
        { letter: 'E', text: currentQuestion.option_e }
    ];
    
    options.forEach(option => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.onclick = () => selectOption(option.letter, optionDiv);
        optionDiv.innerHTML = `
            <div class="option-letter">${option.letter}</div>
            <div class="option-text">${option.text}</div>
        `;
        optionsContainer.appendChild(optionDiv);
    });
    
    // Start timer
    startTimer();
    
    // Enable submit button
    document.getElementById('submitBtn').disabled = false;
}

// Select option
function selectOption(letter, element) {
    // Remove previous selection
    document.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Add selection to clicked option
    element.classList.add('selected');
    selectedAnswer = letter;
}

// Submit answer
async function submitAnswer() {
    if (!selectedAnswer) {
        showAlert('Lütfen bir seçenek işaretleyin!', 'info');
        return;
    }
    
    stopTimer();
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    
    // Update UI
    document.querySelectorAll('.option').forEach(opt => {
        const letter = opt.querySelector('.option-letter').textContent;
        if (letter === currentQuestion.correct_answer) {
            opt.classList.add('correct');
        } else if (letter === selectedAnswer && !isCorrect) {
            opt.classList.add('wrong');
        }
        opt.onclick = null; // Disable clicking
    });
    
    // Show feedback
    showFeedback(isCorrect);
    
    // Update session stats
    sessionStats.total++;
    if (isCorrect) {
        sessionStats.correct++;
    } else {
        sessionStats.wrong++;
    }
    updateSessionStats();
    
    // Save answer to database
    try {
        await fetch('tables/user_answers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.id,
                question_id: currentQuestion.id,
                user_answer: selectedAnswer,
                is_correct: isCorrect,
                answered_date: new Date().toISOString(),
                time_spent: timeSpent
            })
        });
        
        // Increment question usage counter (pass subject name)
        if (window.subscriptionManager) {
            await window.subscriptionManager.incrementQuestionUsage(selectedSubject);
        }
        
        // Update performance stats
        await updatePerformanceStats(isCorrect);
        
    } catch (error) {
        console.error('Error saving answer:', error);
    }
    
    // Disable submit button
    document.getElementById('submitBtn').disabled = true;
}

// Show feedback
function showFeedback(isCorrect) {
    const feedbackDiv = document.getElementById('answerFeedback');
    feedbackDiv.className = `answer-feedback ${isCorrect ? 'correct' : 'wrong'}`;
    feedbackDiv.innerHTML = `
        <div class="feedback-header">
            <div class="feedback-icon">
                <i class="fas fa-${isCorrect ? 'check' : 'times'}"></i>
            </div>
            <div>
                <div class="feedback-title">${isCorrect ? 'Tebrikler! Doğru Cevap!' : 'Yanlış Cevap'}</div>
                <p>Doğru cevap: <strong>${currentQuestion.correct_answer}</strong></p>
            </div>
        </div>
        <div class="feedback-explanation">
            <h4><i class="fas fa-lightbulb"></i> Çözüm:</h4>
            <p>${currentQuestion.explanation}</p>
        </div>
        <div style="margin-top: 20px; text-align: center;">
            <button onclick="loadQuestion()" class="btn btn-primary">
                <i class="fas fa-arrow-right"></i> Sonraki Soru
            </button>
        </div>
    `;
    feedbackDiv.style.display = 'block';
}

// Timer functions
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('timer').textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Update session stats
function updateSessionStats() {
    document.getElementById('sessionTotal').textContent = sessionStats.total;
    document.getElementById('sessionCorrect').textContent = sessionStats.correct;
    document.getElementById('sessionWrong').textContent = sessionStats.wrong;
    
    const rate = sessionStats.total > 0 
        ? Math.round((sessionStats.correct / sessionStats.total) * 100) 
        : 0;
    document.getElementById('sessionRate').textContent = rate + '%';
}

// Reset session
function resetSession() {
    sessionStats = { total: 0, correct: 0, wrong: 0 };
    updateSessionStats();
}

// Update performance stats
async function updatePerformanceStats(isCorrect) {
    try {
        // Get current stats
        const response = await fetch('tables/performance_stats?limit=1000');
        const data = await response.json();
        
        const existing = data.data.find(s => 
            s.user_id === currentUser.id &&
            s.exam_type === 'AYT' &&
            s.subject === selectedSubject &&
            s.topic === selectedTopic &&
            s.difficulty === selectedDifficulty
        );
        
        if (existing) {
            const totalQuestions = existing.total_questions + 1;
            const correctAnswers = existing.correct_answers + (isCorrect ? 1 : 0);
            const wrongAnswers = existing.wrong_answers + (isCorrect ? 0 : 1);
            const successRate = Math.round((correctAnswers / totalQuestions) * 100);
            
            await fetch(`tables/performance_stats/${existing.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    total_questions: totalQuestions,
                    correct_answers: correctAnswers,
                    wrong_answers: wrongAnswers,
                    success_rate: successRate,
                    last_updated: new Date().toISOString()
                })
            });
        } else {
            await fetch('tables/performance_stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: currentUser.id,
                    exam_type: 'AYT',
                    subject: selectedSubject,
                    topic: selectedTopic,
                    difficulty: selectedDifficulty,
                    total_questions: 1,
                    correct_answers: isCorrect ? 1 : 0,
                    wrong_answers: isCorrect ? 0 : 1,
                    success_rate: isCorrect ? 100 : 0,
                    last_updated: new Date().toISOString()
                })
            });
        }
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// UI helpers
function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'block';
    document.getElementById('questionContent').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
}
