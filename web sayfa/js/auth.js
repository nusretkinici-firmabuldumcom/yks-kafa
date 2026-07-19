// Authentication State Management
let currentUser = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
});

// Check if user is logged in
function checkAuthStatus() {
    const userData = localStorage.getItem('currentUser');
    
    if (userData) {
        currentUser = JSON.parse(userData);
        showDashboard();
        loadUserData();
    } else {
        showAuthModal();
    }
}

// Switch between login and register forms
function switchToRegister() {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.add('active');
}

function switchToLogin() {
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        // Fetch all users and check credentials
        const response = await fetch('tables/users?limit=100');
        const data = await response.json();
        
        const user = data.data.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Update last login
            await fetch(`tables/users/${user.id}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    last_login: new Date().toISOString()
                })
            });
            
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            showDashboard();
            loadUserData();
            showAlert('Başarıyla giriş yaptınız!', 'success');
        } else {
            showAlert('E-posta veya şifre hatalı!', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Giriş yapılırken bir hata oluştu!', 'error');
    }
}

// Handle Register
async function handleRegister(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('registerFullName').value;
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        // Check if user already exists
        const checkResponse = await fetch('tables/users?limit=100');
        const checkData = await checkResponse.json();
        
        const existingUser = checkData.data.find(u => u.email === email || u.username === username);
        
        if (existingUser) {
            showAlert('Bu e-posta veya kullanıcı adı zaten kullanılıyor!', 'error');
            return;
        }
        
        // Create new user
        const response = await fetch('tables/users', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                username: username,
                email: email,
                password: password,
                full_name: fullName,
                registration_date: new Date().toISOString(),
                last_login: new Date().toISOString(),
                total_questions_solved: 0,
                total_correct: 0
            })
        });
        
        if (response.ok) {
            const newUser = await response.json();
            currentUser = newUser;
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            
            // Create free subscription for new user
            try {
                await fetch('tables/subscriptions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: newUser.id,
                        plan_type: 'free',
                        price: 0,
                        start_date: new Date().toISOString(),
                        end_date: null,
                        is_active: true,
                        free_questions_used: 0,
                        payment_status: 'completed',
                        created_at: new Date().toISOString()
                    })
                });
            } catch (subError) {
                console.error('Error creating subscription:', subError);
            }
            
            showDashboard();
            loadUserData();
            showAlert('Kayıt başarılı! Hoş geldin! 20 ücretsiz soru hakkın var! 🎉', 'success');
        } else {
            showAlert('Kayıt olurken bir hata oluştu!', 'error');
        }
    } catch (error) {
        console.error('Register error:', error);
        showAlert('Kayıt olurken bir hata oluştu!', 'error');
    }
}

// Handle Logout
function handleLogout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        localStorage.removeItem('currentUser');
        currentUser = null;
        window.location.reload();
    }
}

// Show/Hide UI Elements
function showAuthModal() {
    document.getElementById('authModal').classList.add('active');
    document.getElementById('dashboard').classList.remove('active');
}

function showDashboard() {
    document.getElementById('authModal').classList.remove('active');
    document.getElementById('dashboard').classList.add('active');
}

// Load User Data
async function loadUserData() {
    if (!currentUser) return;
    
    // Update UI with user info
    document.getElementById('userNameDisplay').innerHTML = `<i class="fas fa-user"></i> ${currentUser.full_name}`;
    document.getElementById('welcomeUserName').textContent = currentUser.full_name;
    
    // Load subscription info
    try {
        const subResponse = await fetch('tables/subscriptions?limit=100');
        const subData = await subResponse.json();
        const userSub = subData.data.find(s => s.user_id === currentUser.id && s.is_active === true);
        
        if (userSub) {
            const planNames = { free: 'ÜCRETSİZ', monthly: 'AYLIK', '6months': '6 AYLIK', yearly: 'YILLIK' };
            const planNameEl = document.getElementById('planName');
            const planQuotaEl = document.getElementById('planQuota');
            
            if (planNameEl) {
                planNameEl.textContent = planNames[userSub.plan_type] || 'ÜCRETSİZ';
            }
            
            if (planQuotaEl) {
                if (userSub.plan_type === 'free') {
                    const remaining = 20 - (userSub.free_questions_used || 0);
                    planQuotaEl.textContent = remaining + ' / 20 Soru';
                } else {
                    planQuotaEl.textContent = 'Sınırsız Soru';
                }
            }
        }
    } catch (error) {
        console.error('Error loading subscription:', error);
    }
    
    // Load user statistics
    try {
        // Get user answers
        const answersResponse = await fetch(`tables/user_answers?limit=1000`);
        const answersData = await answersResponse.json();
        const userAnswers = answersData.data.filter(a => a.user_id === currentUser.id);
        
        const totalQuestions = userAnswers.length;
        const totalCorrect = userAnswers.filter(a => a.is_correct).length;
        const successRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
        
        // Update stats
        document.getElementById('totalQuestions').textContent = totalQuestions;
        document.getElementById('totalCorrect').textContent = totalCorrect;
        document.getElementById('successRate').textContent = successRate + '%';
        
        // Calculate current streak (consecutive days) - removed as we replaced with subscription card
        
        // Load recent activity
        loadRecentActivity(userAnswers);
        
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Calculate streak
function calculateStreak(answers) {
    if (answers.length === 0) return 0;
    
    // Sort answers by date
    const sortedAnswers = answers.sort((a, b) => 
        new Date(b.answered_date) - new Date(a.answered_date)
    );
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (let answer of sortedAnswers) {
        const answerDate = new Date(answer.answered_date);
        answerDate.setHours(0, 0, 0, 0);
        
        const dayDiff = Math.floor((currentDate - answerDate) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === streak) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else if (dayDiff > streak) {
            break;
        }
    }
    
    return streak;
}

// Load recent activity
async function loadRecentActivity(userAnswers) {
    const activityList = document.getElementById('recentActivityList');
    
    if (userAnswers.length === 0) {
        activityList.innerHTML = `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="activity-content">
                    <p>Henüz soru çözmedin. Hemen başla!</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Get recent answers (last 5)
    const recentAnswers = userAnswers
        .sort((a, b) => new Date(b.answered_date) - new Date(a.answered_date))
        .slice(0, 5);
    
    // Fetch questions for these answers
    try {
        const questionsResponse = await fetch('tables/questions?limit=1000');
        const questionsData = await questionsResponse.json();
        
        activityList.innerHTML = '';
        
        for (let answer of recentAnswers) {
            const question = questionsData.data.find(q => q.id === answer.question_id);
            
            if (question) {
                const date = new Date(answer.answered_date);
                const timeAgo = getTimeAgo(date);
                
                activityList.innerHTML += `
                    <div class="activity-item">
                        <div class="activity-icon" style="background: ${answer.is_correct ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' : 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)'};">
                            <i class="fas fa-${answer.is_correct ? 'check' : 'times'}"></i>
                        </div>
                        <div class="activity-content">
                            <p><strong>${question.exam_type} - ${question.subject}</strong> | ${question.topic}</p>
                            <small>${answer.is_correct ? 'Doğru' : 'Yanlış'} - ${timeAgo}</small>
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading activity:', error);
    }
}

// Get time ago text
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' yıl önce';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' ay önce';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' gün önce';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' saat önce';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' dakika önce';
    
    return 'Az önce';
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
    // Insert at top of main content
    const mainContent = document.querySelector('.main-content .container');
    if (mainContent) {
        mainContent.insertBefore(alertDiv, mainContent.firstChild);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }
}
