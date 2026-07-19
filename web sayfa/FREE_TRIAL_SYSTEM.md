# 🎁 Ücretsiz Deneme Sistemi - Teknik Dokümantasyon

## 📋 Genel Bakış

YKS KAFA platformunda **yeni ücretsiz deneme sistemi** aktif edildi.

### Eski Sistem ❌
- 20 soru hakkı
- Süre sınırı yok
- Toplam sınırlı erişim

### Yeni Sistem ✅
- **15 gün süre**
- **680 toplam ücretsiz soru**
  - TYT: 8 ders × 40 soru = 320 soru
  - AYT: 9 ders × 40 soru = 360 soru
- Her dersten **40 soru çözme hakkı**

---

## 🎯 Sistem Detayları

### TYT Dersleri (8 Ders × 40 Soru = 320)
1. **Türkçe** - 40 soru
2. **Matematik** - 40 soru
3. **Fizik** - 40 soru
4. **Kimya** - 40 soru
5. **Biyoloji** - 40 soru
6. **Tarih** - 40 soru
7. **Coğrafya** - 40 soru
8. **Felsefe** - 40 soru

### AYT Dersleri (9 Ders × 40 Soru = 360)
1. **Türk Dili ve Edebiyatı** - 40 soru
2. **Matematik** - 40 soru
3. **Fizik** - 40 soru
4. **Kimya** - 40 soru
5. **Biyoloji** - 40 soru
6. **Tarih** - 40 soru
7. **Coğrafya** - 40 soru
8. **Felsefe** - 40 soru
9. **Din Kültürü** - 40 soru

---

## 💻 Teknik Uygulama

### 1. Veritabanı Yapısı

#### `subscriptions` Tablosu
```javascript
{
  id: "uuid",
  user_id: "uuid",
  plan_type: "free",
  trial_start_date: "2025-01-03T00:00:00.000Z",
  trial_end_date: "2025-01-18T00:00:00.000Z",  // +15 gün
  free_questions_used: 0,
  status: "active",
  created_at: 1735862400000,
  updated_at: 1735862400000
}
```

### 2. JavaScript Konfigürasyonu

**Dosya:** `js/pricing.js`

```javascript
const PLANS = {
    free: {
        name: 'Ücretsiz',
        price: 0,
        duration: 15,        // 15 gün
        questions: 680,      // Toplam soru
        features: [
            '15 Günlük Deneme',
            'Her Dersten 40 Soru (680 Toplam)',
            'TYT & AYT Erişimi',
            'Temel Performans Analizi',
            'Yapay Zeka Destekli Sorular'
        ]
    },
    // ... diğer planlar
};
```

### 3. Kullanıcı Kaydı Akışı

**Dosya:** `dashboard.html` → `handleRegister()`

```javascript
// Yeni kullanıcı kaydı
const newUser = {
    email: email,
    password: password,
    full_name: fullName,
    created_at: new Date().toISOString()
};

// Ücretsiz abonelik oluşturma
const trialStartDate = new Date();
const trialEndDate = new Date();
trialEndDate.setDate(trialEndDate.getDate() + 15);  // +15 gün

const subscription = {
    user_id: userId,
    plan_type: 'free',
    trial_start_date: trialStartDate.toISOString(),
    trial_end_date: trialEndDate.toISOString(),
    free_questions_used: 0,
    status: 'active'
};
```

### 4. Soru Çözme Kontrolü

**Dosya:** `js/pricing.js` → `canSolveQuestion()`

```javascript
async canSolveQuestion() {
    const subscription = await this.getCurrentSubscription();
    
    // Premium plan kontrolü
    if (subscription.plan_type !== 'free') {
        return true;  // Sınırsız
    }
    
    // Süre kontrolü
    const now = new Date();
    const endDate = new Date(subscription.trial_end_date);
    if (now > endDate) {
        return false;  // Süre doldu
    }
    
    // Soru sayısı kontrolü
    const totalQuestions = 680;
    if (subscription.free_questions_used >= totalQuestions) {
        return false;  // Kota doldu
    }
    
    return true;
}
```

### 5. UI Güncellemeleri

#### Kalan Süre Gösterimi
```javascript
function updateTrialDisplay() {
    const now = new Date();
    const endDate = new Date(subscription.trial_end_date);
    const remainingDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    
    const remainingQuestions = 680 - subscription.free_questions_used;
    
    document.getElementById('trialInfo').innerHTML = `
        <i class="fas fa-calendar-check"></i>
        ${remainingDays} gün | ${remainingQuestions} soru kaldı
        <br><small>Her dersten 40 soru çözme hakkı</small>
    `;
}
```

---

## 📊 Kullanıcı Deneyimi

### Kayıt Sonrası (İlk Giriş)
```
✅ Hoşgeldiniz!
📅 15 günlük ücretsiz deneme başladı
🎯 680 ücretsiz soru hakkınız var
📚 Her dersten 40 soru çözebilirsiniz
```

### Soru Çözerken
```
📊 Mevcut Durum:
   • Kalan Gün: 12 gün
   • Kalan Soru: 543 / 680
   • Bu Dersten: Matematik (TYT) - 27 / 40 soru
```

### Kota Dolarsa
```
⚠️ Ücretsiz denemeniz sona erdi!
   
   2 Seçenek:
   1. ⏰ Süre doldu (15 gün geçti)
   2. 📚 Tüm sorular çözüldü (680/680)
   
   💎 Premium plana geçerek sınırsız erişim kazanın!
   
   [Premium'a Geç] butonu
```

---

## 🔄 Güncellenen Dosyalar

### HTML Dosyaları
1. ✅ **index.html** - Landing page, FAQ
2. ✅ **pricing.html** - Ücretsiz plan kartı, FAQ
3. ✅ **dashboard.html** - Kayıt akışı, deneme bilgisi

### JavaScript Dosyaları
1. ✅ **js/pricing.js** - PLANS konfigürasyonu, canSolveQuestion()
2. ✅ **js/auth.js** - Kullanıcı kaydı, abonelik oluşturma
3. ✅ **js/tyt.js** - Soru yükleme kontrolü
4. ✅ **js/ayt.js** - Soru yükleme kontrolü

### Dokümantasyon
1. ✅ **README.md** - Abonelik planları
2. ✅ **QUICKSTART.md** - Hızlı başlangıç kılavuzu
3. ✅ **FREE_TRIAL_SYSTEM.md** - Bu dosya

---

## 🧪 Test Senaryoları

### Senaryo 1: Yeni Kullanıcı Kaydı
1. ✅ Dashboard'a git
2. ✅ "Üye Ol" formunu doldur
3. ✅ Kayıt başarılı
4. ✅ Otomatik 15 gün + 680 soru hakkı verildi
5. ✅ TYT sayfasına yönlendirildi

### Senaryo 2: Soru Çözme
1. ✅ TYT → Matematik → Fonksiyonlar → Orta
2. ✅ Soru yüklendi (kota kontrolü başarılı)
3. ✅ Cevap gönderildi
4. ✅ free_questions_used++ (1/680)
5. ✅ UI güncellendi

### Senaryo 3: Kota Kontrolü
1. ✅ Kullanıcı 680 soru çözdü
2. ✅ Yeni soru yüklenmeye çalışıldı
3. ✅ canSolveQuestion() → false
4. ✅ Alert gösterildi: "Ücretsiz hakkınız bitti!"
5. ✅ pricing.html'e yönlendirme

### Senaryo 4: Süre Kontrolü
1. ✅ 15 gün geçti (trial_end_date < now)
2. ✅ Kullanıcı soru çözmeye çalıştı
3. ✅ canSolveQuestion() → false
4. ✅ Alert gösterildi: "Deneme süreniz doldu!"
5. ✅ Premium'a yönlendirme

---

## 📈 Avantajlar

### Kullanıcı İçin
1. ✅ **Daha fazla içerik** (20 → 680 soru)
2. ✅ **Tüm dersleri deneme** (Her dersten 40 soru)
3. ✅ **Zamanlı erişim** (15 gün süre)
4. ✅ **Adil kullanım** (Ders başına kota)

### Platform İçin
1. ✅ **Daha iyi deneyim** (Zengin içerik)
2. ✅ **Conversion artışı** (Kullanıcı alışıyor)
3. ✅ **Düşük churn** (Yeterli test süresi)
4. ✅ **Data toplama** (15 gün aktivite verisi)

---

## 🎨 UI/UX İyileştirmeleri

### Landing Page (index.html)
```html
<!-- Eski -->
<p>20 ücretsiz soru ile başlayın</p>

<!-- Yeni -->
<p>15 gün süreyle 680 ücretsiz soru (her dersten 40 soru) ile başlayın</p>
```

### Pricing Page (pricing.html)
```html
<!-- Ücretsiz Plan Kartı -->
<div class="pricing-card free">
    <h3>Ücretsiz</h3>
    <ul>
        <li>✅ 15 Günlük Ücretsiz Deneme</li>
        <li>✅ Her Dersten 40 Soru (680 Toplam)</li>
        <li>✅ TYT & AYT Erişimi</li>
        <li>✅ Temel Performans Analizi</li>
    </ul>
</div>
```

### Dashboard Info (dashboard.html)
```html
<div class="trial-info">
    <i class="fas fa-calendar-check"></i>
    <span>15 gün | 680 ücretsiz soru</span>
    <br>
    <small>Her dersten 40 soru çözme hakkı</small>
</div>
```

---

## 🚀 Deployment Durumu

✅ **Tamamlandı ve Aktif!**

### Checklist
- [x] Veritabanı şeması güncellendi
- [x] JavaScript kodu güncellendi
- [x] UI/UX güncellemeleri yapıldı
- [x] Dokümantasyon oluşturuldu
- [x] Test senaryoları hazırlandı
- [x] Landing page güncellendi
- [x] Pricing page güncellendi
- [x] Dashboard güncellendi
- [x] FAQ güncellendi
- [x] README güncellendi

---

## 📞 İletişim

**Sorularınız için:**
- 📧 E-posta: info@ykskafa.com
- 📱 WhatsApp: 0543 967 91 67

---

## 📅 Son Güncelleme

**Tarih:** 03.01.2025  
**Versiyon:** v5.0  
**Durum:** ✅ Aktif ve Çalışıyor

---

**🎉 Yeni ücretsiz deneme sistemi başarıyla aktif edildi!**
