# YKS Hazırlık Platformu - Hızlı Başlangıç Kılavuzu 🚀

## ✅ Proje Durumu

**Tüm temel özellikler tamamlandı!** Platform kullanıma hazır.

---

## 📦 Projeyi Kullanmaya Başlama

### Adım 1: Platformu Test Edin

1. **Publish sekmesine gidin**
2. "Publish" butonuna tıklayın
3. Canlı URL'inizi alın

### Adım 2: İlk Kullanıcıyı Oluşturun

1. Platform açıldığında kayıt formunu göreceksiniz
2. Bilgilerinizi girin ve "Kayıt Ol" butonuna tıklayın
3. Otomatik olarak giriş yapılacak ve **15 günlük ücretsiz deneme** (680 soru hakkı) kazanacaksınız

### Adım 3: Soru Çözmeye Başlayın

1. **TYT** veya **AYT** kartına tıklayın
2. Bir **ders** seçin (Matematik, Fizik, vb.)
3. Bir **konu** seçin
4. **Zorluk seviyesi** seçin (Kolay, Orta, Zor)
5. Soruyu okuyun ve cevabınızı işaretleyin
6. "Cevapla" butonuna tıklayın
7. Anında geri bildirim ve çözüm açıklaması görün

### Adım 4: Performansınızı İzleyin

1. Üst menüden **"Performans"** sekmesine gidin
2. Genel istatistiklerinizi görün
3. Grafiklerde ders bazlı performansınızı inceleyin
4. Detaylı tablo ile konu bazlı analizinizi yapın
5. Akıllı önerileri okuyun
6. İsterseniz Excel raporu indirin

---

## 💎 Ücretsiz Plan (15 Günlük Deneme)

- ✅ **680 Toplam Soru** (TYT: 320 + AYT: 360)
- ✅ **Her Dersten 40 Soru** (TYT 8 ders, AYT 9 ders)
- ✅ **15 Gün Süre** (Kayıt tarihinden itibaren)
- ✅ TYT & AYT Tam Erişimi
- ✅ Yapay Zeka Destekli Sorular
- ⚠️ 15 gün veya 680 soru bitince premium'a geçiş gerekir

---

## 🔧 N8N Entegrasyonu (GPT-4o Soru Üretimi)

Şu anda platform, veritabanındaki örnek sorular ile çalışıyor. **GPT-4o ile otomatik soru üretimi** için N8N kurulumu yapmanız gerekiyor:

### N8N Kurulum Adımları

1. **N8N hesabınızı oluşturun** (https://n8n.io/)
2. Yeni workflow oluşturun
3. `n8n-workflows.json` dosyasındaki `generate_question_gpt4o` workflow'unu import edin
4. OpenAI API anahtarınızı ekleyin
5. Webhook URL'ini alın
6. `js/main.js` dosyasında `api.baseUrl` değerini güncelleyin

**Detaylı adımlar için:** `n8n-workflows.json` ve `README.md` dosyalarına bakın.

---

## 📊 Veritabanı Durumu

### Oluşturulan Tablolar
✅ **users** - Kullanıcı bilgileri
✅ **questions** - Soru bankası (3 örnek soru ekli)
✅ **user_answers** - Çözülen sorular
✅ **performance_stats** - Performans istatistikleri

### Örnek Sorular
Platform, her sınav tipi için birer örnek soru içeriyor:
- ✓ TYT Matematik (Kolay)
- ✓ TYT Türkçe (Orta)
- ✓ AYT Matematik (Zor)

Daha fazla soru eklemek için:
1. **Manuel:** Veritabanına doğrudan ekleyin
2. **Otomatik:** N8N + GPT-4o entegrasyonunu kurun

---

## 🎯 Test Senaryoları

### Senaryo 1: Yeni Kullanıcı Kaydı
1. Sayfayı açın
2. "Kayıt Ol" sekmesine geçin
3. Formu doldurun
4. Kayıt olun ve otomatik giriş yapın

### Senaryo 2: Soru Çözme (TYT)
1. Ana sayfadan "TYT" kartına tıklayın
2. "Matematik" seçin
3. "Sayılar" konusunu seçin
4. "Kolay" zorluk seviyesini seçin
5. Örnek soruyu çözün
6. Geri bildirim ve çözümü görün
7. "Sonraki Soru" butonuna tıklayın

### Senaryo 3: Performans Analizi
1. Birkaç soru çözün
2. "Performans" sekmesine gidin
3. İstatistikleri ve grafikleri görün
4. Filtreleri kullanarak verileri inceleyin
5. Excel raporu indirin

---

## 🐛 Bilinen Sınırlamalar

1. **Soru Bankası:** Şu anda sadece örnek sorular var. Daha fazla içerik için N8N entegrasyonu gerekli.
2. **Şifre Güvenliği:** Şifreler hash'lenmemiş (production için bcrypt gibi bir çözüm kullanın).
3. **E-posta Doğrulama:** E-posta doğrulama sistemi yok (gelecekte eklenebilir).

---

## 🚀 Önerilen Geliştirmeler

### Kısa Vadeli
1. N8N + GPT-4o entegrasyonunu kurun
2. Daha fazla örnek soru ekleyin
3. Gerçek kullanıcılarla test edin

### Orta Vadeli
1. Deneme sınavları modülü ekleyin
2. Video ders entegrasyonu
3. Liderlik tablosu (leaderboard)

### Uzun Vadeli
1. Mobil uygulama
2. Öğretmen paneli
3. Canlı dersler

---

## 📞 Destek ve Yardım

Herhangi bir sorunuz varsa:
1. `README.md` dosyasını inceleyin
2. `n8n-workflows.json` dosyasındaki workflow'ları kontrol edin
3. Kod içindeki yorumları okuyun

---

## ✨ Tebrikler!

YKS Hazırlık Platformunuz hazır! 🎉

**Sıradaki adımlar:**
1. ✅ Platformu test edin
2. ✅ Kullanıcı deneyimini iyileştirin
3. ✅ N8N entegrasyonunu kurun
4. ✅ Daha fazla içerik ekleyin
5. ✅ Öğrencilerle paylaşın

**Başarılar! 🚀🎓**
