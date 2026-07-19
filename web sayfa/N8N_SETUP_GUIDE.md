# 🤖 N8N Entegrasyon Rehberi
## YKS Hazırlık Platformu - GPT-4o Soru Üretim Sistemi

Bu dokümantasyon, YKS Hazırlık Platformu'na N8N ve GPT-4o entegrasyonunu adım adım anlatmaktadır.

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Sistem Mimarisi](#sistem-mimarisi)
3. [N8N Kurulumu](#n8n-kurulumu)
4. [Workflow'ların Oluşturulması](#workflowların-oluşturulması)
5. [Frontend Entegrasyonu](#frontend-entegrasyonu)
6. [Test ve Debug](#test-ve-debug)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Genel Bakış

### N8N Nedir?
N8N, açık kaynaklı bir iş akışı otomasyonu aracıdır. API entegrasyonları, veri işleme ve otomasyon görevleri için kullanılır.

### Projemizdeki Rolü
- **GPT-4o ile dinamik soru üretimi**: Konu, zorluk ve sınav tipine göre AI sorular oluşturur
- **Performans analizi**: Kullanıcı istatistiklerini işler
- **Günlük özet e-postaları**: Kullanıcılara performans raporları gönderir
- **Webhook API**: Frontend ile backend arasında köprü görevi

---

## 🏗️ Sistem Mimarisi

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   FRONTEND      │      │      N8N        │      │    GPT-4o API   │
│  (TYT/AYT)      │─────▶│   WORKFLOWS     │─────▶│   (OpenAI)      │
│                 │      │                 │      │                 │
│ - Soru Seçimi   │      │ - Webhook       │      │ - Soru Üretimi  │
│ - Zorluk        │      │ - Prompt Build  │      │ - JSON Output   │
│ - Konu          │      │ - API Call      │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
         │                        │
         │                        ▼
         │               ┌─────────────────┐
         └──────────────▶│   DATABASE      │
                         │  (Tables API)   │
                         │                 │
                         │ - Questions     │
                         │ - User Answers  │
                         │ - Performance   │
                         └─────────────────┘
```

---

## 🚀 N8N Kurulumu

### Seçenek 1: N8N Cloud (Önerilen - En Kolay)
1. [n8n.cloud](https://n8n.cloud) adresine gidin
2. Ücretsiz hesap oluşturun
3. Instance'ınız otomatik olarak hazır!

**장점:**
- ✅ Anında kullanıma hazır
- ✅ Otomatik güncelleme
- ✅ SSL sertifikası dahil
- ✅ 5.000 ücretsiz workflow execution/ay

### Seçenek 2: Docker (Self-Hosted)
```bash
# N8N'i Docker ile başlat
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

**장점:**
- ✅ Tam kontrol
- ✅ Sınırsız workflow
- ✅ Kendi sunucunuz

### Seçenek 3: npm (Geliştiriciler için)
```bash
npm install n8n -g
n8n start
```

---

## 🔧 Workflow'ların Oluşturulması

### 1️⃣ GPT-4o Soru Üretim Workflow'u

#### Adım 1: Yeni Workflow Oluşturun
1. N8N dashboard'a girin
2. "Create new workflow" tıklayın
3. İsim verin: "YKS - Question Generator"

#### Adım 2: Webhook Node Ekleyin
```javascript
Node: Webhook
Path: /generate-question
Method: POST
Response Mode: lastNode

Expected Input:
{
  "exam_type": "TYT" | "AYT",
  "subject": "Matematik",
  "topic": "Fonksiyonlar",
  "difficulty": "Kolay" | "Orta" | "Zor"
}
```

#### Adım 3: Validation Function Node
```javascript
// Input validasyonu
const body = $input.item.json.body;

if (!body.exam_type || !body.subject || !body.topic || !body.difficulty) {
  throw new Error('Missing required parameters: exam_type, subject, topic, difficulty');
}

// Geçerli değerleri kontrol et
const validExamTypes = ['TYT', 'AYT'];
const validDifficulties = ['Kolay', 'Orta', 'Zor'];

if (!validExamTypes.includes(body.exam_type)) {
  throw new Error('Invalid exam_type. Must be TYT or AYT');
}

if (!validDifficulties.includes(body.difficulty)) {
  throw new Error('Invalid difficulty. Must be Kolay, Orta, or Zor');
}

return { json: body };
```

#### Adım 4: Prompt Builder Function Node
```javascript
const data = $input.item.json;

// Zorluk seviyesi tanımları
const difficultyLevel = {
  'Kolay': 'temel seviye, basit hesaplamalar, tek adımlı çözüm',
  'Orta': 'orta seviye, birden fazla adım, kavram bilgisi gerektirir',
  'Zor': 'ileri seviye, karmaşık problemler, analitik düşünme gerektirir'
};

// Sınav tipi özel talimatlar
const examInstructions = {
  'TYT': 'Temel Yeterlilik Testi standardında, lise müfredatına uygun',
  'AYT': 'Alan Yeterlilik Testi standardında, derinlemesine alan bilgisi gerektiren'
};

// GPT-4o için detaylı prompt
const prompt = `Sen bir ${data.exam_type} (${examInstructions[data.exam_type]}) sınav sorusu oluşturma uzmanısın.

**Soru Özellikleri:**
- Konu: ${data.subject} - ${data.topic}
- Zorluk: ${data.difficulty} (${difficultyLevel[data.difficulty]})
- Sınav Tipi: ${data.exam_type}

**Göreviniz:**
Yukarıdaki kriterlere uygun, profesyonel bir çoktan seçmeli soru oluştur.

**Gereksinimler:**
1. Soru metni açık, anlaşılır ve belirsizlik içermemeli
2. 5 seçenek olmalı (A, B, C, D, E)
3. Tüm seçenekler makul ve inandırıcı olmalı
4. Tek bir doğru cevap olmalı
5. Detaylı çözüm açıklaması (adım adım)
6. YKS standartlarına uygun format

**Çıktı Formatı (Sadece JSON):**
{
  "question_text": "Soru metni buraya...",
  "option_a": "Seçenek A metni",
  "option_b": "Seçenek B metni",
  "option_c": "Seçenek C metni",
  "option_d": "Seçenek D metni",
  "option_e": "Seçenek E metni",
  "correct_answer": "A",
  "explanation": "Detaylı çözüm açıklaması: 1. adım... 2. adım..."
}

**ÖNEMLİ:** Sadece JSON çıktısı ver, başka hiçbir açıklama ekleme!`;

return {
  json: {
    ...data,
    prompt: prompt,
    model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 2000
  }
};
```

#### Adım 5: GPT-4o API Call (HTTP Request Node)
```javascript
Node: HTTP Request
Method: POST
URL: https://api.openai.com/v1/chat/completions

Authentication: Header Auth
Header Name: Authorization
Header Value: Bearer {{$env.OPENAI_API_KEY}}

Body (JSON):
{
  "model": "{{$json.model}}",
  "messages": [
    {
      "role": "system",
      "content": "Sen bir YKS sınav sorusu oluşturma uzmanısın. Daima doğru, eğitici ve standartlara uygun sorular üretirsin. Cevapların JSON formatında olmalı."
    },
    {
      "role": "user",
      "content": "{{$json.prompt}}"
    }
  ],
  "temperature": {{$json.temperature}},
  "max_tokens": {{$json.max_tokens}}
}
```

#### Adım 6: Parse GPT Response (Function Node)
```javascript
const response = $input.item.json;
const webhookData = $node['Webhook'].json.body;

// GPT-4o yanıtını al
let content = response.choices[0].message.content;

// JSON temizliği (markdown kod bloklarını kaldır)
content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

// JSON parse et
let questionData;
try {
  questionData = JSON.parse(content);
} catch (error) {
  throw new Error('GPT-4o yanıtı JSON formatında değil: ' + content);
}

// Veritabanı için hazırla
return {
  json: {
    exam_type: webhookData.exam_type,
    subject: webhookData.subject,
    topic: webhookData.topic,
    difficulty: webhookData.difficulty,
    question_text: questionData.question_text,
    option_a: questionData.option_a,
    option_b: questionData.option_b,
    option_c: questionData.option_c,
    option_d: questionData.option_d,
    option_e: questionData.option_e,
    correct_answer: questionData.correct_answer,
    explanation: questionData.explanation,
    generated_by_ai: true,
    ai_model: 'gpt-4o',
    created_date: new Date().toISOString()
  }
};
```

#### Adım 7: Save to Database (HTTP Request Node)
```javascript
Node: HTTP Request
Method: POST
URL: {{$env.API_BASE_URL}}/tables/questions
Headers:
  Content-Type: application/json

Body: {{$json}}
```

#### Adım 8: Return Response (Function Node)
```javascript
// Frontend'e başarılı yanıt döndür
return {
  json: {
    success: true,
    message: 'Soru başarıyla oluşturuldu!',
    question: $input.item.json
  }
};
```

---

### 2️⃣ Günlük Performans Özeti Workflow'u

#### Adım 1: Schedule Trigger Node
```javascript
Node: Schedule Trigger
Trigger Times: 20:00 (Her gün)
Cron: 0 20 * * *
```

#### Adım 2: Get All Active Users
```javascript
Node: HTTP Request
Method: GET
URL: {{$env.API_BASE_URL}}/tables/users?limit=1000
```

#### Adım 3: Split Into Batches
```javascript
Node: Split In Batches
Batch Size: 1
```

#### Adım 4: Get User's Today Answers
```javascript
Node: HTTP Request
Method: GET
URL: {{$env.API_BASE_URL}}/tables/user_answers?limit=1000
```

#### Adım 5: Calculate Stats (Function Node)
```javascript
const today = new Date();
today.setHours(0, 0, 0, 0);

const answers = $input.item.json.data;
const user = $node['Split In Batches'].json;

// Bugünün cevaplarını filtrele
const todayAnswers = answers.filter(a => {
  const answerDate = new Date(a.answered_date);
  answerDate.setHours(0, 0, 0, 0);
  return a.user_id === user.id && answerDate.getTime() === today.getTime();
});

// Eğer bugün soru çözülmemişse skip et
if (todayAnswers.length === 0) {
  return null;
}

// İstatistikleri hesapla
const correct = todayAnswers.filter(a => a.is_correct).length;
const wrong = todayAnswers.length - correct;
const rate = Math.round((correct / todayAnswers.length) * 100);

// Motivasyon mesajı
let motivation = '';
if (rate >= 90) motivation = 'Mükemmel! 🎉 Harika bir performans sergiliyorsun!';
else if (rate >= 70) motivation = 'Çok iyi gidiyorsun! 💪 Böyle devam et!';
else if (rate >= 50) motivation = 'İyi bir başlangıç! 📚 Biraz daha çalışarak daha da iyiye gidebilirsin!';
else motivation = 'Pes etme! 🔥 Her gün biraz daha iyiye gideceksin!';

return {
  json: {
    user: user,
    stats: {
      total: todayAnswers.length,
      correct: correct,
      wrong: wrong,
      rate: rate
    },
    motivation: motivation
  }
};
```

#### Adım 6: Send Email
```javascript
Node: Email Send / Gmail / SendGrid
From: noreply@yksplatform.com
To: {{$json.user.email}}
Subject: 📊 Günlük Performans Özeti - {{$json.user.full_name}}

Body (HTML):
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { color: #2563eb; margin: 0; }
    .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
    .stat-box { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-label { font-size: 14px; color: #666; margin-bottom: 5px; }
    .stat-value { font-size: 32px; font-weight: bold; color: #2563eb; }
    .motivation { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; font-size: 18px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 Günlük Performans Özeti</h1>
      <p>Merhaba {{$json.user.full_name}},</p>
    </div>
    
    <div class="stats">
      <div class="stat-box">
        <div class="stat-label">Çözülen Soru</div>
        <div class="stat-value">{{$json.stats.total}}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Başarı Oranı</div>
        <div class="stat-value">%{{$json.stats.rate}}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Doğru</div>
        <div class="stat-value" style="color: #10b981;">{{$json.stats.correct}}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Yanlış</div>
        <div class="stat-value" style="color: #ef4444;">{{$json.stats.wrong}}</div>
      </div>
    </div>
    
    <div class="motivation">
      {{$json.motivation}}
    </div>
    
    <div class="footer">
      <p>Yarın da soru çözmeye devam et!</p>
      <p><strong>YKS Hazırlık Platformu</strong></p>
    </div>
  </div>
</body>
</html>
```

---

## 💻 Frontend Entegrasyonu

### 1. N8N Config Dosyası (`js/n8n-config.js`)

Dosya zaten oluşturuldu! ✅ Yapılandırma için:

```javascript
// js/n8n-config.js içinde düzenleyin:

const N8N_CONFIG = {
    baseUrl: 'https://your-n8n-instance.com',  // ← N8N URL'inizi buraya
    enabled: true,  // ← true yapın
    // ...
};
```

### 2. Frontend'den Kullanım

TYT ve AYT sayfalarında otomatik olarak entegre edildi! Soru oluşturma işlemi:

```javascript
// Otomatik olarak çalışır:
// 1. Kullanıcı konu/zorluk seçer
// 2. loadQuestion() çağrılır
// 3. Eğer veritabanında soru yoksa generateNewQuestion() çalışır
// 4. N8N aktifse GPT-4o ile soru üretilir
// 5. Değilse fallback soru kullanılır
```

---

## 🧪 Test ve Debug

### N8N Bağlantı Testi
```javascript
// Browser console'da çalıştırın:
const result = await window.n8nClient.testConnection();
console.log(result);
```

### Manuel Soru Üretim Testi
```javascript
// Browser console'da:
const question = await window.n8nClient.generateQuestion(
  'TYT',
  'Matematik',
  'Fonksiyonlar',
  'Orta'
);
console.log(question);
```

### N8N Workflow Test
1. N8N Dashboard'a gidin
2. Workflow'u açın
3. "Test Workflow" butonuna tıklayın
4. Manuel input verin veya webhook'u curl ile test edin:

```bash
curl -X POST https://your-n8n-instance.com/webhook/generate-question \
  -H "Content-Type: application/json" \
  -d '{
    "exam_type": "TYT",
    "subject": "Matematik",
    "topic": "Fonksiyonlar",
    "difficulty": "Orta"
  }'
```

---

## 🔧 Environment Variables

N8N'de ayarlanması gereken değişkenler:

```bash
# OpenAI API
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Platform API
API_BASE_URL=https://your-platform-url.com

# Email (Opsiyonel - Günlük özet için)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### N8N Cloud'da Ayarlama:
1. Settings → Environment
2. Variables ekleyin
3. Save

### Docker'da Ayarlama:
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -e OPENAI_API_KEY=sk-xxx \
  -e API_BASE_URL=https://your-url.com \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

---

## 🐛 Troubleshooting

### Sorun: N8N'de webhook yanıt vermiyor
**Çözüm:**
1. Webhook URL'inin doğru olduğunu kontrol edin
2. Workflow'un "Active" olduğundan emin olun
3. N8N loglarını kontrol edin

### Sorun: GPT-4o API hatası (401 Unauthorized)
**Çözüm:**
- OpenAI API Key'i kontrol edin
- Billing ayarlarından kredi olup olmadığını kontrol edin
- API Key'in environment variable'da doğru girildiğini kontrol edin

### Sorun: Sorular veritabanına kaydedilmiyor
**Çözüm:**
- API_BASE_URL environment variable'ını kontrol edin
- Database endpoint'inin erişilebilir olduğunu test edin
- CORS ayarlarını kontrol edin

### Sorun: Frontend'de "N8N disabled" mesajı
**Çözüm:**
```javascript
// js/n8n-config.js dosyasında:
enabled: true  // ← false ise true yapın
baseUrl: 'https://your-real-n8n-url.com'  // ← Gerçek URL'i girin
```

---

## 📊 Monitoring

### N8N Execution History
- N8N Dashboard → Executions
- Başarısız workflow'ları görüntüleyin
- Hata loglarını inceleyin

### Frontend Console Logs
```javascript
// N8N durumunu kontrol et:
console.log('N8N Enabled:', window.N8N_CONFIG.enabled);
console.log('N8N Base URL:', window.N8N_CONFIG.baseUrl);

// Test çalıştır:
window.n8nClient.testConnection().then(console.log);
```

---

## 🎓 Sonuç

Bu rehberi takip ederek:
✅ N8N kurulumunu tamamladınız
✅ GPT-4o ile dinamik soru üretimi aktif
✅ Frontend entegrasyonu hazır
✅ Test ve monitoring sistemi kurulu

**Sonraki Adımlar:**
1. OpenAI API Key alın (ücretsiz $5 krediniz var)
2. N8N instance'ı kurun (n8n.cloud önerilir)
3. Workflow'ları import edin
4. Environment variables ayarlayın
5. Test edin ve kullanmaya başlayın!

---

## 📞 Destek

Sorularınız için:
- GitHub Issues
- N8N Community Forum
- OpenAI Documentation

**Başarılar! 🚀**
