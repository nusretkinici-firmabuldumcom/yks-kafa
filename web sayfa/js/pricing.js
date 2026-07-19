// Pricing and Subscription Management

let selectedPlan = null;
let currentSubscription = null;

// Plan details
const PLANS = {
    free: { 
        name: 'Ücretsiz', 
        price: 0, 
        duration: 15,  // 15 gün
        questions: -1,  // Sınırsız soru (15 gün içinde)
        per_subject_limit: 40  // Her dersten 40 soru
    },
    monthly: { name: 'Aylık', price: 250, duration: 30, questions: -1, per_subject_limit: -1 },
    '6months': { name: '6 Aylık', price: 600, duration: 180, questions: -1, per_subject_limit: -1 },
    yearly: { name: 'Yıllık', price: 1000, duration: 365, questions: -1, per_subject_limit: -1 }
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    if (currentUser) {
        updateUserDisplay();
        loadCurrentSubscription();
    }
    
    // Card number formatting
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', formatCardNumber);
    }
    
    // Expiry date formatting
    const cardExpiryInput = document.getElementById('cardExpiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', formatExpiryDate);
    }
    
    // CVV validation
    const cardCvvInput = document.getElementById('cardCvv');
    if (cardCvvInput) {
        cardCvvInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/\D/g, '');
        });
    }
});

// Update user display
function updateUserDisplay() {
    if (currentUser) {
        document.getElementById('userNameDisplay').innerHTML = 
            `<i class="fas fa-user"></i> ${currentUser.full_name}`;
    }
}

// Load current subscription
async function loadCurrentSubscription() {
    try {
        const response = await fetch('tables/subscriptions?limit=100');
        const data = await response.json();
        
        // Find user's active subscription
        const userSub = data.data.find(s => 
            s.user_id === currentUser.id && 
            s.is_active === true
        );
        
        if (userSub) {
            currentSubscription = userSub;
            updateCurrentPlanDisplay(userSub);
        } else {
            // Create free subscription
            await createFreeSubscription();
        }
    } catch (error) {
        console.error('Error loading subscription:', error);
        await createFreeSubscription();
    }
}

// Create free subscription for new users
async function createFreeSubscription() {
    try {
        const response = await fetch('tables/subscriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.id,
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
        
        if (response.ok) {
            currentSubscription = await response.json();
            updateCurrentPlanDisplay(currentSubscription);
        }
    } catch (error) {
        console.error('Error creating free subscription:', error);
    }
}

// Update current plan display
function updateCurrentPlanDisplay(subscription) {
    const plan = PLANS[subscription.plan_type];
    const planName = plan.name.toUpperCase();
    
    document.getElementById('currentPlanBadge').textContent = planName;
    
    if (subscription.plan_type === 'free') {
        // Calculate remaining days
        const startDate = new Date(subscription.start_date);
        const currentDate = new Date();
        const daysPassed = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, plan.duration - daysPassed);
        
        // Calculate total used questions across all subjects
        const subjectUsage = subscription.subject_usage || {};
        const totalUsed = Object.values(subjectUsage).reduce((a, b) => a + b, 0);
        
        // Total available: 17 dersler (8 TYT + 9 AYT) x 40 = 680 soru
        const totalAvailable = 680;
        const totalRemaining = totalAvailable - totalUsed;
        
        document.getElementById('remainingQuestions').innerHTML = 
            `<strong>${daysRemaining} Gün</strong> kaldı<br><small>${totalRemaining}/${totalAvailable} soru</small>`;
        
        const usagePercent = (totalUsed / totalAvailable) * 100;
        document.getElementById('usageProgressBar').style.width = usagePercent + '%';
        
        if (daysRemaining === 0 || totalRemaining === 0) {
            document.getElementById('usageProgressBar').style.background = 
                'linear-gradient(90deg, var(--danger-color) 0%, #f093fb 100%)';
            showAlert('Ücretsiz süreniz veya soru hakkınız doldu! Premium plana geçin.', 'warning');
            document.getElementById('upgradeBtn').style.display = 'block';
        } else if (daysRemaining <= 3 || usagePercent >= 80) {
            document.getElementById('usageProgressBar').style.background = 
                'linear-gradient(90deg, var(--warning-color) 0%, #fb8c00 100%)';
        } else {
            document.getElementById('usageProgressBar').style.background = 
                'linear-gradient(90deg, var(--primary-color) 0%, var(--secondary-color) 100%)';
        }
        
        const upgradeBtn = document.getElementById('upgradeBtn');
        if (upgradeBtn) {
            upgradeBtn.style.display = daysRemaining <= 3 ? 'block' : 'none';
        }
    } else {
        // Premium plans
        document.getElementById('remainingQuestions').innerHTML = '∞ <strong>Sınırsız</strong>';
        document.getElementById('usageProgressBar').style.width = '100%';
        document.getElementById('usageProgressBar').style.background = 
            'linear-gradient(90deg, var(--success-color) 0%, #38f9d7 100%)';
        
        const upgradeBtn = document.getElementById('upgradeBtn');
        if (upgradeBtn) {
            upgradeBtn.style.display = 'none';
        }
    }
}
    }
}

// Check if user can solve questions
async function canSolveQuestion(subject = null) {
    if (!currentSubscription) {
        await loadCurrentSubscription();
    }
    
    const plan = PLANS[currentSubscription.plan_type];
    
    // Unlimited plan (Premium)
    if (plan.per_subject_limit === -1) {
        return true;
    }
    
    // Free plan - check time limit first
    if (currentSubscription.plan_type === 'free') {
        const startDate = new Date(currentSubscription.start_date);
        const currentDate = new Date();
        const daysPassed = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
        
        // Check if 15 days have passed
        if (daysPassed >= plan.duration) {
            return false; // Ücretsiz süre doldu
        }
        
        // Check per-subject limit if subject is provided
        if (subject) {
            const subjectUsage = currentSubscription.subject_usage || {};
            const usedInSubject = subjectUsage[subject] || 0;
            
            if (usedInSubject >= plan.per_subject_limit) {
                return false; // Bu dersten 40 soru kullanıldı
            }
        }
        
        return true;
    }
    
    return true;
}

// Increment used questions counter
async function incrementQuestionUsage(subject) {
    if (!currentSubscription || currentSubscription.plan_type !== 'free') {
        return; // Only track for free plan
    }
    
    try {
        // Get current subject usage
        const subjectUsage = currentSubscription.subject_usage || {};
        
        // Increment for this subject
        subjectUsage[subject] = (subjectUsage[subject] || 0) + 1;
        
        // Calculate total questions used
        const totalUsed = Object.values(subjectUsage).reduce((a, b) => a + b, 0);
        
        await fetch(`tables/subscriptions/${currentSubscription.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subject_usage: subjectUsage,
                free_questions_used: totalUsed
            })
        });
        
        currentSubscription.subject_usage = subjectUsage;
        currentSubscription.free_questions_used = totalUsed;
        updateCurrentPlanDisplay(currentSubscription);
    } catch (error) {
        console.error('Error incrementing question usage:', error);
    }
}

// Show upgrade modal
function showUpgradeModal() {
    window.location.href = 'pricing.html#plans';
    
    // Smooth scroll to plans
    setTimeout(() => {
        const pricingSection = document.querySelector('.pricing-section');
        if (pricingSection) {
            pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

// Select plan
function selectPlan(planType, price) {
    selectedPlan = { type: planType, price: price };
    
    const planName = PLANS[planType].name;
    document.getElementById('selectedPlanName').textContent = planName;
    document.getElementById('selectedPlanPrice').textContent = price + ' TL';
    
    // Show payment modal
    document.getElementById('paymentModal').classList.add('active');
}

// Close payment modal
function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
    document.getElementById('paymentForm').reset();
}

// Format card number (XXXX XXXX XXXX XXXX)
function formatCardNumber(e) {
    let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    e.target.value = formattedValue;
}

// Format expiry date (MM/YY)
function formatExpiryDate(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    e.target.value = value;
}

// Process payment
async function processPayment(event) {
    event.preventDefault();
    
    if (!selectedPlan) {
        showAlert('Lütfen bir plan seçin!', 'error');
        return;
    }
    
    // Get form data
    const cardName = document.getElementById('cardName').value;
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCvv = document.getElementById('cardCvv').value;
    
    // Basic validation
    if (cardNumber.length !== 16) {
        showAlert('Geçersiz kart numarası!', 'error');
        return;
    }
    
    if (cardCvv.length !== 3) {
        showAlert('Geçersiz CVV!', 'error');
        return;
    }
    
    // Show loading
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> İşleniyor...';
    submitBtn.disabled = true;
    
    try {
        // Simulate payment processing (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create payment record
        const paymentResponse = await fetch('tables/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.id,
                subscription_id: currentSubscription?.id || '',
                amount: selectedPlan.price,
                payment_method: 'credit_card',
                payment_date: new Date().toISOString(),
                status: 'completed',
                transaction_id: 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase()
            })
        });
        
        if (!paymentResponse.ok) throw new Error('Payment record failed');
        
        const payment = await paymentResponse.json();
        
        // Deactivate old subscription
        if (currentSubscription) {
            await fetch(`tables/subscriptions/${currentSubscription.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: false })
            });
        }
        
        // Create new subscription
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + PLANS[selectedPlan.type].duration);
        
        const subscriptionResponse = await fetch('tables/subscriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.id,
                plan_type: selectedPlan.type,
                price: selectedPlan.price,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                is_active: true,
                free_questions_used: 0,
                payment_status: 'completed',
                created_at: new Date().toISOString()
            })
        });
        
        if (!subscriptionResponse.ok) throw new Error('Subscription creation failed');
        
        currentSubscription = await subscriptionResponse.json();
        
        // Success!
        showAlert('Ödeme başarılı! Planınız aktif edildi. 🎉', 'success');
        closePaymentModal();
        updateCurrentPlanDisplay(currentSubscription);
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        console.error('Payment error:', error);
        showAlert('Ödeme işlemi başarısız oldu. Lütfen tekrar deneyin.', 'error');
        
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Show terms modal
function showTerms() {
    alert('Kullanım Koşulları:\n\n' +
          '1. Hizmet sadece eğitim amaçlıdır.\n' +
          '2. Hesap bilgilerinizi başkalarıyla paylaşmayınız.\n' +
          '3. İlk 7 gün içinde %100 iade garantisi.\n' +
          '4. Planlar otomatik yenilenmez.\n' +
          '5. Detaylı bilgi için: info@yksplatform.com');
}

// Show privacy policy
function showPrivacy() {
    alert('Gizlilik Politikası:\n\n' +
          '1. Kişisel verileriniz güvende tutulur.\n' +
          '2. Kart bilgileri saklanmaz.\n' +
          '3. Verileriniz üçüncü şahıslarla paylaşılmaz.\n' +
          '4. SSL şifreleme kullanılır.\n' +
          '5. Detaylı bilgi için: privacy@yksplatform.com');
}

// Export for use in other modules
window.subscriptionManager = {
    canSolveQuestion,
    incrementQuestionUsage,
    currentSubscription
};
