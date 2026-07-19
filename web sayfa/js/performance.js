// Performance Page Logic

let allPerformanceData = [];
let allAnswers = [];
let charts = {};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    if (currentUser) {
        updateUserDisplay();
        loadPerformanceData();
    }
});

// Update user display
function updateUserDisplay() {
    if (currentUser) {
        document.getElementById('userNameDisplay').innerHTML = 
            `<i class="fas fa-user"></i> ${currentUser.full_name}`;
    }
}

// Load all performance data
async function loadPerformanceData() {
    try {
        // Load performance stats
        const statsResponse = await fetch('tables/performance_stats?limit=1000');
        const statsData = await statsResponse.json();
        allPerformanceData = statsData.data.filter(s => s.user_id === currentUser.id);
        
        // Load all answers
        const answersResponse = await fetch('tables/user_answers?limit=1000');
        const answersData = await answersResponse.json();
        allAnswers = answersData.data.filter(a => a.user_id === currentUser.id);
        
        // Update UI
        updateOverallStats();
        loadSubjectFilter();
        renderTable();
        renderCharts();
        renderTopicProgress();
        generateRecommendations();
        
    } catch (error) {
        console.error('Error loading performance data:', error);
        showAlert('Performans verileri yüklenirken bir hata oluştu!', 'error');
    }
}

// Update overall statistics
function updateOverallStats() {
    const total = allAnswers.length;
    const correct = allAnswers.filter(a => a.is_correct).length;
    const wrong = total - correct;
    const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    document.getElementById('overallTotal').textContent = total;
    document.getElementById('overallCorrect').textContent = correct;
    document.getElementById('overallWrong').textContent = wrong;
    document.getElementById('overallRate').textContent = rate + '%';
}

// Load subject filter options
function loadSubjectFilter() {
    const subjects = [...new Set(allPerformanceData.map(s => s.subject))];
    const subjectFilter = document.getElementById('subjectFilter');
    
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        subjectFilter.appendChild(option);
    });
}

// Filter table
function filterTable() {
    renderTable();
}

// Render performance table
function renderTable() {
    const examTypeFilter = document.getElementById('examTypeFilter').value;
    const subjectFilter = document.getElementById('subjectFilter').value;
    const difficultyFilter = document.getElementById('difficultyFilter').value;
    
    let filteredData = allPerformanceData;
    
    if (examTypeFilter) {
        filteredData = filteredData.filter(d => d.exam_type === examTypeFilter);
    }
    if (subjectFilter) {
        filteredData = filteredData.filter(d => d.subject === subjectFilter);
    }
    if (difficultyFilter) {
        filteredData = filteredData.filter(d => d.difficulty === difficultyFilter);
    }
    
    const tbody = document.getElementById('performanceTableBody');
    
    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">Veri bulunamadı</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    filteredData.forEach(item => {
        const row = document.createElement('tr');
        
        const successRateClass = 
            item.success_rate >= 70 ? 'high' : 
            item.success_rate >= 40 ? 'medium' : 'low';
        
        const difficultyBadge = 
            item.difficulty === 'Kolay' ? 'kolay' :
            item.difficulty === 'Orta' ? 'orta' : 'zor';
        
        row.innerHTML = `
            <td><span class="badge-exam badge-${item.exam_type.toLowerCase()}">${item.exam_type}</span></td>
            <td>${item.subject}</td>
            <td>${item.topic}</td>
            <td><span class="badge-difficulty badge-${difficultyBadge}">${item.difficulty}</span></td>
            <td><strong>${item.total_questions}</strong></td>
            <td><span style="color: var(--success-color); font-weight: 600;">${item.correct_answers}</span></td>
            <td><span style="color: var(--danger-color); font-weight: 600;">${item.wrong_answers}</span></td>
            <td>
                <span class="success-rate ${successRateClass}">
                    <i class="fas fa-${successRateClass === 'high' ? 'check' : successRateClass === 'medium' ? 'minus' : 'times'}-circle"></i>
                    ${item.success_rate}%
                </span>
            </td>
            <td>${new Date(item.last_updated).toLocaleDateString('tr-TR')}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// Render charts
function renderCharts() {
    renderSubjectChart();
    renderExamTypeChart();
}

// Render subject performance chart
function renderSubjectChart() {
    const subjectData = {};
    
    allPerformanceData.forEach(item => {
        if (!subjectData[item.subject]) {
            subjectData[item.subject] = { correct: 0, wrong: 0 };
        }
        subjectData[item.subject].correct += item.correct_answers;
        subjectData[item.subject].wrong += item.wrong_answers;
    });
    
    const labels = Object.keys(subjectData);
    const correctData = labels.map(s => subjectData[s].correct);
    const wrongData = labels.map(s => subjectData[s].wrong);
    
    const ctx = document.getElementById('subjectChart');
    
    if (charts.subjectChart) {
        charts.subjectChart.destroy();
    }
    
    charts.subjectChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Doğru',
                    data: correctData,
                    backgroundColor: 'rgba(67, 233, 123, 0.8)',
                    borderColor: 'rgba(67, 233, 123, 1)',
                    borderWidth: 2
                },
                {
                    label: 'Yanlış',
                    data: wrongData,
                    backgroundColor: 'rgba(245, 87, 108, 0.8)',
                    borderColor: 'rgba(245, 87, 108, 1)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: { size: 14, weight: '600' },
                        padding: 15
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: { size: 12 }
                    }
                },
                x: {
                    ticks: {
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

// Render exam type distribution chart
function renderExamTypeChart() {
    const examTypeData = { TYT: 0, AYT: 0 };
    
    allPerformanceData.forEach(item => {
        examTypeData[item.exam_type] += item.total_questions;
    });
    
    const ctx = document.getElementById('examTypeChart');
    
    if (charts.examTypeChart) {
        charts.examTypeChart.destroy();
    }
    
    charts.examTypeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['TYT', 'AYT'],
            datasets: [{
                data: [examTypeData.TYT, examTypeData.AYT],
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(245, 87, 108, 0.8)'
                ],
                borderColor: [
                    'rgba(102, 126, 234, 1)',
                    'rgba(245, 87, 108, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 14, weight: '600' },
                        padding: 20
                    }
                }
            }
        }
    });
}

// Render topic progress
function renderTopicProgress() {
    const container = document.getElementById('topicProgressContainer');
    
    if (allPerformanceData.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Henüz veri yok</p>';
        return;
    }
    
    container.innerHTML = '';
    
    // Sort by success rate
    const sortedData = [...allPerformanceData].sort((a, b) => b.success_rate - a.success_rate);
    
    // Show top 10
    sortedData.slice(0, 10).forEach(item => {
        const progressItem = document.createElement('div');
        progressItem.className = 'topic-progress-item';
        
        progressItem.innerHTML = `
            <div class="topic-header">
                <div class="topic-info">
                    <h4>${item.subject} - ${item.topic}</h4>
                    <p>${item.exam_type} | ${item.difficulty}</p>
                </div>
                <div class="topic-stats">
                    <strong>${item.success_rate}%</strong>
                    <small>${item.correct_answers}/${item.total_questions}</small>
                </div>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${item.success_rate}%"></div>
            </div>
        `;
        
        container.appendChild(progressItem);
    });
}

// Generate recommendations
function generateRecommendations() {
    const container = document.getElementById('recommendationsContainer');
    container.innerHTML = '';
    
    if (allPerformanceData.length === 0) {
        container.innerHTML = `
            <div class="recommendation-card">
                <div class="recommendation-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="recommendation-content">
                    <h4>Soru Çözmeye Başla</h4>
                    <p>Henüz soru çözmediniz. Performans analiziniz için soru çözmeye başlayın.</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Find weak topics (success rate < 50%)
    const weakTopics = allPerformanceData.filter(d => d.success_rate < 50);
    
    if (weakTopics.length > 0) {
        weakTopics.slice(0, 3).forEach(topic => {
            const card = document.createElement('div');
            card.className = 'recommendation-card danger';
            card.innerHTML = `
                <div class="recommendation-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="recommendation-content">
                    <h4>Geliştirilmesi Gereken Alan</h4>
                    <p><strong>${topic.subject} - ${topic.topic}</strong> konusunda başarı oranınız %${topic.success_rate}. Bu konuda daha fazla çalışmanız önerilir.</p>
                </div>
            `;
            container.appendChild(card);
        });
    }
    
    // Find strong topics (success rate > 80%)
    const strongTopics = allPerformanceData.filter(d => d.success_rate > 80);
    
    if (strongTopics.length > 0) {
        const card = document.createElement('div');
        card.className = 'recommendation-card success';
        card.innerHTML = `
            <div class="recommendation-icon">
                <i class="fas fa-trophy"></i>
            </div>
            <div class="recommendation-content">
                <h4>Harika Performans!</h4>
                <p>${strongTopics.length} konuda %80'in üzerinde başarı oranına ulaştınız. Harika gidiyorsunuz!</p>
            </div>
        `;
        container.appendChild(card);
    }
    
    // General tip
    const avgRate = allPerformanceData.reduce((sum, d) => sum + d.success_rate, 0) / allPerformanceData.length;
    const card = document.createElement('div');
    card.className = avgRate >= 70 ? 'recommendation-card success' : 'recommendation-card warning';
    card.innerHTML = `
        <div class="recommendation-icon">
            <i class="fas fa-chart-line"></i>
        </div>
        <div class="recommendation-content">
            <h4>Genel Performans</h4>
            <p>Ortalama başarı oranınız %${Math.round(avgRate)}. ${avgRate >= 70 ? 'Mükemmel bir performans!' : 'Düzenli çalışmayla daha da iyileştirebilirsiniz.'}</p>
        </div>
    `;
    container.appendChild(card);
}

// Export table data
function exportTableData() {
    if (allPerformanceData.length === 0) {
        showAlert('Henüz veri yok!', 'info');
        return;
    }
    
    // Create CSV content
    let csv = 'Sınav Tipi,Ders,Konu,Zorluk,Toplam Soru,Doğru,Yanlış,Başarı Oranı,Son Güncelleme\n';
    
    allPerformanceData.forEach(item => {
        csv += `${item.exam_type},${item.subject},${item.topic},${item.difficulty},${item.total_questions},${item.correct_answers},${item.wrong_answers},${item.success_rate}%,${new Date(item.last_updated).toLocaleDateString('tr-TR')}\n`;
    });
    
    // Download CSV
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `performans_raporu_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert('Rapor başarıyla indirildi!', 'success');
}
