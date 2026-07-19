# YKS KAFA — N8N Workflow Kurulum Rehberi

## 📁 Dosyalar

| Dosya | İşlev |
|-------|-------|
| `workflow_1_soru_uretimi.json` | GPT-4o ile otomatik soru üretimi |
| `workflow_2_kayit_onboarding.json` | Kullanıcı kayıt + karşılama e-postası |
| `workflow_3a_iyzico_checkout_baslat.json` | iyzico: Checkout Form token al (Adım 1) |
| `workflow_3b_iyzico_callback_webhook.json` | iyzico: Callback + Webhook doğrula + Premium aktif (Adım 2-3) |
| `workflow_4_performans_analiz.json` | Cevap değerlendirme + istatistik + AI koç |
| `workflow_5_foto_cozum.json` | **(Solvi tarzı)** GPT-4o Vision ile fotoğraf/metin soru çözümü — adım adım sonuç üretir |
| `workflow_5b_foto_cozum_chat.json` | Foto çözüm ekranındaki AI sohbet kutusu için takip sorusu yanıtlayıcı (gpt-4o-mini) |
| `workflow_6_ogren_uretici.json` | **(Solvi "Learn" tarzı)** Not/PDF metnini özet + flashcard + mini quiz setine çevirir |

> Yeni 3 frontend sayfası bu workflow'ları kullanır: `ykskafa_solve.html` (Fotoğrafla Çöz), `ykskafa_ogren.html` (Öğren) ve `ykskafa_kutuphane.html` (Kütüphane — şu an localStorage ile çalışıyor, `kutuphane_cozumler` / `kutuphane_ogren_setleri` tabloları bağlanınca gerçek verilerle senkron edilebilir).

---

## ⚙️ Environment Variables (n8n → Settings → Variables)

```
OPENAI_API_KEY        = sk-...
SUPABASE_URL          = https://xxxx.supabase.co
SUPABASE_ANON_KEY     = eyJ...
IYZICO_API_KEY        = sandbox-xxx  (canlıda: gerçek api key)
IYZICO_SECRET_KEY     = sandbox-xxx  (canlıda: gerçek secret key)
IYZICO_CALLBACK_URL   = https://n8n.ykskafa.com/webhook/iyzico-callback
```

> ⚠️ Önce **sandbox** modda test et! iyzico sandbox: https://sandbox-api.iyzipay.com
> Canlıya geçince URL'i `https://api.iyzipay.com` olarak değiştir.

---

## 💳 iyzico Ödeme Akışı (Kredi Kartı)

```
[1] Frontend → POST /webhook/iyzico-start-payment
              { kullanici_id, email, ad, soyad, plan, ip }
                       ↓
         n8n: HMAC-SHA256 imzalı istek → iyzico API
                       ↓
         iyzico: token + checkoutFormContent döner
                       ↓
[2] Frontend: checkoutFormContent'i sayfaya render eder
              (iyzico'nun yerleşik kart formu açılır)
              Kullanıcı kart bilgisini girer ve öder
                       ↓
[3] iyzico → POST callbackUrl (/webhook/iyzico-callback)
              n8n: Retrieve ile ödemeyi doğrular
              → Başarılıysa: Kullanıcı premium'a yükseltilir
              → Başarısız: Hata sayfasına yönlendirilir
                       ↓
[4] iyzico → POST /webhook/iyzico-webhook (ek doğrulama)
              n8n: X-IYZ-SIGNATURE-V3 imzası doğrulanır
              → DB'ye webhook onayı kaydedilir
```

---

## 🔧 iyzico Merchant Portal Kurulum

1. https://merchant.iyzico.com → giriş yap
2. **Settings → Merchant Settings → Merchant Notifications**
   - Webhook URL: `https://n8n.ykskafa.com/webhook/iyzico-webhook`
   - Success + Failure → her ikisini de aktif et
3. **X-IYZ-SIGNATURE-V3** için: `integrations@iyzico.com`'a mail at ve aktifleştirmelerini iste
4. Test için iyzico sandbox kart numaraları:
   - Başarılı: `5528790000000008` CVV: `123` Son Kullanma: `12/30`
   - Başarısız: `5528790000000024`

---

## 🗄️ Supabase Tabloları

### `kullanicilar` (workflow 2'den mevcut)
```sql
-- iyzico için ek kolon ekle:
alter table kullanicilar add column if not exists iyzico_payment_id text;
```

### `odeme_oturumlari` ← iyzico için yeni tablo
```sql
create table odeme_oturumlari (
  id uuid default gen_random_uuid() primary key,
  kullanici_id uuid references kullanicilar(id),
  email text not null,
  plan text not null,
  tutar numeric not null,
  iyzico_token text unique not null,
  iyzico_payment_id text,
  conversation_id text,
  basket_id text,
  durum text default 'beklemede',
  -- durum değerleri: beklemede | basarili | basarisiz | webhook_onaylandi
  hata text,
  olusturulma timestamptz default now(),
  tamamlanma timestamptz,
  webhook_tarihi timestamptz
);
```

---

## 🌐 Tüm Webhook Endpoint'leri

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/webhook/register` | Kullanıcı kaydı |
| POST | `/webhook/generate-question` | Soru üretme |
| POST | `/webhook/answer-question` | Cevap gönderme |
| POST | `/webhook/iyzico-start-payment` | iyzico checkout başlat |
| POST | `/webhook/iyzico-callback` | iyzico ödeme sonucu (callbackUrl) |
| POST | `/webhook/iyzico-webhook` | iyzico sunucu bildirimi |
| POST | `/webhook/foto-coz` | Fotoğraf/metin soru çözümü (GPT-4o Vision) |
| POST | `/webhook/foto-coz-chat` | Çözüm sonrası AI sohbet takip sorusu |
| POST | `/webhook/ogren-uret` | Not/PDF'ten flashcard + quiz seti üretme |

---

## 🗄️ Yeni Supabase Tabloları (Solvi özellikleri için)

```sql
create table kutuphane_cozumler (
  id uuid default gen_random_uuid() primary key,
  kullanici_id uuid references kullanicilar(id),
  ders text not null,
  konu text,
  adimlar jsonb not null,       -- string[] — adım adım çözüm
  cevap text,
  etiketler jsonb default '[]', -- string[]
  tur text default 'foto_cozum',
  favori boolean default true,
  olusturulma_tarihi timestamptz default now()
);

create table kutuphane_ogren_setleri (
  id uuid default gen_random_uuid() primary key,
  kullanici_id uuid references kullanicilar(id),
  ders text not null,
  konu text,
  ozet jsonb not null,   -- string[]
  kartlar jsonb not null, -- {front, back}[]
  quiz jsonb not null,    -- {q, opts, correct, explain}[]
  favori boolean default true,
  olusturulma_tarihi timestamptz default now()
);
```

> Not: `ykskafa_kutuphane.html` şu an demo amaçlı `localStorage` (`ykskafa_library` anahtarı) üzerinden çalışıyor — kayıt/favori/sil işlemleri tarayıcıda tutuluyor. Gerçek çoklu-cihaz senkronu için `saveToLibrary()` / `saveSet()` fonksiyonlarındaki localStorage çağrılarını yukarıdaki tablolara yazan bir fetch çağrısıyla değiştirmen yeterli.

---

## 🔗 Frontend Entegrasyonu

```javascript
// Adım 1: Ödeme başlat
const res = await fetch('https://n8n.ykskafa.com/webhook/iyzico-start-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    kullanici_id: userId,
    email: 'ogr@mail.com',
    ad: 'Ahmet',
    soyad: 'Yılmaz',
    plan: 'premium_6ay',   // veya 'premium_yillik'
    ip: '1.2.3.4'          // kullanıcının IP'si
  })
});

const { token, checkoutFormContent } = await res.json();

// Adım 2: iyzico formunu sayfana göm
document.getElementById('iyzico-checkout').innerHTML = checkoutFormContent;
// → İyzico'nun kart formu otomatik açılır, kullanıcı ödemeyi tamamlar
// → iyzico otomatik olarak callbackUrl'e yönlendirir
```

---

## 🔒 Güvenlik Notları

- iyzico HTTPS gerektiriyor → n8n'in URL'i SSL'li olmalı
- `X-IYZ-SIGNATURE-V3` doğrulamasını aktif et (HMAC-SHA256)
- Sandbox'ta test et, canlıya geçmeden önce tüm senaryoları dene
- `IYZICO_SECRET_KEY` asla frontend'e gönderilmemeli
