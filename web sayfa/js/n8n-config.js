// N8N Configuration and API Integration
// YKS Hazırlık Platformu - N8N Webhook Integration

const N8N_CONFIG = {
    // N8N instance base URL - Update this with your n8n instance
    baseUrl: 'https://your-n8n-instance.com',
    
    // Webhook endpoints
    endpoints: {
        generateQuestion: '/webhook/generate-question',
        submitAnswer: '/webhook/submit-answer',
        getPerformance: '/webhook/get-performance',
        sendDailySummary: '/webhook/send-daily-summary'
    },
    
    // API timeout (ms)
    timeout: 30000,
    
    // Retry configuration
    retry: {
        maxAttempts: 3,
        delay: 1000
    },
    
    // Enable/disable N8N integration
    enabled: false, // Set to true when n8n is configured
    
    // Fallback to local data when n8n is disabled
    useFallback: true
};

// N8N API Helper Class
class N8NClient {
    constructor(config) {
        this.config = config;
    }
    
    // Check if N8N is enabled and available
    isEnabled() {
        return this.config.enabled;
    }
    
    // Make HTTP request with retry logic
    async request(endpoint, method = 'POST', data = null, attempt = 1) {
        if (!this.isEnabled()) {
            throw new Error('N8N integration is disabled');
        }
        
        const url = `${this.config.baseUrl}${endpoint}`;
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
            
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error(`N8N request failed (attempt ${attempt}):`, error);
            
            // Retry logic
            if (attempt < this.config.retry.maxAttempts) {
                await this.sleep(this.config.retry.delay * attempt);
                return this.request(endpoint, method, data, attempt + 1);
            }
            
            throw error;
        }
    }
    
    // Sleep helper for retry
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Generate Question via N8N + GPT-4o
    async generateQuestion(examType, subject, topic, difficulty) {
        try {
            const response = await this.request(
                this.config.endpoints.generateQuestion,
                'POST',
                {
                    exam_type: examType,
                    subject: subject,
                    topic: topic,
                    difficulty: difficulty
                }
            );
            
            return response;
            
        } catch (error) {
            console.error('Generate question failed:', error);
            
            if (this.config.useFallback) {
                // Return local/fallback question
                return this.getFallbackQuestion(examType, subject, topic, difficulty);
            }
            
            throw error;
        }
    }
    
    // Submit Answer via N8N
    async submitAnswer(userId, questionId, selectedAnswer, isCorrect, timeSpent) {
        try {
            const response = await this.request(
                this.config.endpoints.submitAnswer,
                'POST',
                {
                    user_id: userId,
                    question_id: questionId,
                    selected_answer: selectedAnswer,
                    is_correct: isCorrect,
                    time_spent_seconds: timeSpent,
                    answered_date: new Date().toISOString()
                }
            );
            
            return response;
            
        } catch (error) {
            console.error('Submit answer failed:', error);
            // Continue without blocking user experience
            return null;
        }
    }
    
    // Get Performance Stats via N8N
    async getPerformanceStats(userId, examType = null) {
        try {
            const params = new URLSearchParams({
                user_id: userId
            });
            
            if (examType) {
                params.append('exam_type', examType);
            }
            
            const response = await this.request(
                `${this.config.endpoints.getPerformance}?${params}`,
                'GET'
            );
            
            return response;
            
        } catch (error) {
            console.error('Get performance failed:', error);
            return null;
        }
    }
    
    // Fallback Question Generator (when N8N is disabled)
    getFallbackQuestion(examType, subject, topic, difficulty) {
        // Return sample question structure
        return {
            id: `fallback_${Date.now()}`,
            exam_type: examType,
            subject: subject,
            topic: topic,
            difficulty: difficulty,
            question_text: `Bu bir örnek ${difficulty.toLowerCase()} seviye ${subject} sorusudur. (N8N entegrasyonu aktif değil - Fallback modu)`,
            option_a: 'Seçenek A',
            option_b: 'Seçenek B',
            option_c: 'Seçenek C',
            option_d: 'Seçenek D',
            option_e: 'Seçenek E',
            correct_answer: 'A',
            explanation: 'N8N entegrasyonu şu anda aktif değil. Gerçek sorular için N8N yapılandırmasını tamamlayın.',
            generated_by_ai: false,
            is_fallback: true
        };
    }
    
    // Test N8N Connection
    async testConnection() {
        try {
            const response = await this.request('/webhook/health-check', 'GET');
            return {
                success: true,
                message: 'N8N bağlantısı başarılı',
                data: response
            };
        } catch (error) {
            return {
                success: false,
                message: 'N8N bağlantısı başarısız: ' + error.message,
                error: error
            };
        }
    }
}

// Create global N8N client instance
const n8nClient = new N8NClient(N8N_CONFIG);

// Export for use in other modules
window.N8N_CONFIG = N8N_CONFIG;
window.n8nClient = n8nClient;

// Show N8N status on console
console.log('🤖 N8N Integration Status:', N8N_CONFIG.enabled ? '✅ Enabled' : '⚠️ Disabled (using fallback)');
