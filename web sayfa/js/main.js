// Main application logic

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('YKS Hazırlık Platformu yüklendi');
});

// Generate UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Format date to Turkish locale
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Calculate percentage
function calculatePercentage(correct, total) {
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
}

// Smooth scroll to element
function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showAlert('Panoya kopyalandı!', 'success');
    }).catch(err => {
        console.error('Copy failed:', err);
        showAlert('Kopyalama başarısız!', 'error');
    });
}

// Export data as JSON
function exportData(data, filename) {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
}

// Print page
function printPage() {
    window.print();
}

// Share on social media
function shareOnSocial(platform, text, url) {
    const shareUrls = {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    };
    
    if (shareUrls[platform]) {
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Local storage helpers
const storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },
    
    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Storage get error:', e);
            return null;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },
    
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    }
};

// API helpers for N8N integration
const api = {
    // Base URL for N8N webhooks (to be configured)
    baseUrl: '',
    
    // Generate question using AI
    async generateQuestion(examType, subject, topic, difficulty) {
        try {
            // This will be integrated with N8N webhook that calls GPT-4o
            const response = await fetch(`${this.baseUrl}/generate-question`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exam_type: examType,
                    subject: subject,
                    topic: topic,
                    difficulty: difficulty
                })
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Question generation failed');
            }
        } catch (error) {
            console.error('Generate question error:', error);
            return null;
        }
    },
    
    // Save question to database
    async saveQuestion(questionData) {
        try {
            const response = await fetch('tables/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(questionData)
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Save question failed');
            }
        } catch (error) {
            console.error('Save question error:', error);
            return null;
        }
    },
    
    // Save user answer
    async saveAnswer(answerData) {
        try {
            const response = await fetch('tables/user_answers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(answerData)
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Save answer failed');
            }
        } catch (error) {
            console.error('Save answer error:', error);
            return null;
        }
    },
    
    // Update performance stats
    async updateStats(statsData) {
        try {
            // Check if stats exist
            const checkResponse = await fetch(`tables/performance_stats?limit=1000`);
            const checkData = await checkResponse.json();
            
            const existingStats = checkData.data.find(s => 
                s.user_id === statsData.user_id &&
                s.exam_type === statsData.exam_type &&
                s.subject === statsData.subject &&
                s.topic === statsData.topic &&
                s.difficulty === statsData.difficulty
            );
            
            if (existingStats) {
                // Update existing stats
                const response = await fetch(`tables/performance_stats/${existingStats.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        total_questions: statsData.total_questions,
                        correct_answers: statsData.correct_answers,
                        wrong_answers: statsData.wrong_answers,
                        success_rate: statsData.success_rate,
                        last_updated: new Date().toISOString()
                    })
                });
                
                return response.ok ? await response.json() : null;
            } else {
                // Create new stats
                const response = await fetch('tables/performance_stats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...statsData,
                        last_updated: new Date().toISOString()
                    })
                });
                
                return response.ok ? await response.json() : null;
            }
        } catch (error) {
            console.error('Update stats error:', error);
            return null;
        }
    }
};

// Export utilities
window.utils = {
    generateUUID,
    formatDate,
    calculatePercentage,
    scrollToElement,
    copyToClipboard,
    exportData,
    printPage,
    shareOnSocial,
    debounce,
    throttle,
    storage,
    api
};
