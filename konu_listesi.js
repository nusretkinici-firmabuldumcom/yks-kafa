/*
 * YKS KAFA — TYT / AYT Konu Listesi
 * Kaynak: ÖSYM 2026 YKS kılavuzu + güncel TYT-AYT konu dağılımı derlemeleri
 * (osym.gov.tr, unirehberi.com, xyzakademi.com.tr, unikazan.com — Ocak 2026 itibarıyla güncel).
 * 2026 YKS'de konu listesi bir önceki yılla aynıdır (yeni müfredatın tam yansıması 2028-2029'dan itibaren bekleniyor).
 * Bu dosya tüm YKSKAFA sayfalarında ders/konu seçicilerini beslemek için kullanılır.
 */
const YKSKAFA_KONULAR = {
  TYT: {
    "Türkçe": { soru: 40, konular: [
      "Sözcükte Anlam","Cümlede Anlam","Paragrafta Anlatım Teknikleri","Paragrafta Düşünceyi Geliştirme Yolları",
      "Paragrafta Yapı","Paragrafta Konu-Ana Düşünce","Paragrafta Yardımcı Düşünce","Ses Bilgisi","Yazım Kuralları",
      "Noktalama İşaretleri","Sözcükte Yapı","İsimler","Zamirler","Sıfatlar","Zarflar","Edat-Bağlaç-Ünlem",
      "Fiiller","Fiilimsi","Cümlenin Ögeleri","Cümle Türleri","Anlatım Bozukluğu"
    ]},
    "Matematik": { soru: 30, konular: [
      "Temel Kavramlar","Sayı Basamakları","Bölme ve Bölünebilme","EBOB-EKOK","Rasyonel Sayılar",
      "Basit Eşitsizlikler","Mutlak Değer","Üslü Sayılar","Köklü Sayılar","Çarpanlara Ayırma","Oran Orantı",
      "Denklem Çözme","Problemler (Sayı-Kesir-Yaş)","Problemler (Yüzde-Kar Zarar)","Problemler (Karışım-Hareket-İşçi)",
      "Problemler (Tablo-Grafik)","Kümeler","Mantık","Fonksiyonlar","Polinomlar","2. Dereceden Denklemler",
      "Permütasyon ve Kombinasyon","Olasılık","Veri ve İstatistik"
    ]},
    "Geometri": { soru: 10, konular: [
      "Doğruda Açı","Üçgende Açı","Ek Çizimler","Özel Üçgenler","Açıortay","Kenarortay","Üçgende Eşlik-Benzerlik",
      "Açı-Kenar Bağıntıları","Üçgende Alan","Üçgende Merkezler","Çokgenler","Dörtgenler","Çember ve Daire",
      "Analitik Geometri","Katı Cisimler"
    ]},
    "Tarih": { soru: 5, konular: [
      "Tarih ve Zaman","İnsanlığın İlk Dönemleri","İlk ve Orta Çağlarda Türk Dünyası",
      "İslam Medeniyetinin Doğuşu ve İlk İslam Devletleri","Türklerin İslamiyet'i Kabulü ve İlk Türk İslam Devletleri",
      "Orta Çağ'da Dünya","Yerleşme ve Devletleşme Sürecinde Selçuklu Türkiyesi","Beylikten Devlete Osmanlı Siyaseti",
      "Beylikten Devlete Osmanlı Medeniyeti","Dünya Gücü Osmanlı","Klasik Çağda Osmanlı Toplum Düzeni",
      "Değişen Dünya Dengeleri Karşısında Osmanlı Siyaseti","Değişim Çağında Avrupa ve Osmanlı",
      "Devrimler Çağında Değişen Devlet-Toplum İlişkileri","XX. Yüzyıl Başlarında Osmanlı Devleti ve Dünya",
      "Milli Mücadele","Atatürkçülük ve Türk İnkılabı"
    ]},
    "Coğrafya": { soru: 5, konular: [
      "Doğa ve İnsan","Dünya'nın Şekli ve Hareketleri","Coğrafi Konum","Harita Bilgisi","İklim Bilgisi",
      "Dünya'nın Tektonik Oluşumu","Jeolojik Zamanlar","İç Kuvvetler ve Dış Kuvvetler","Kayaçlar",
      "Türkiye'nin Yer Şekilleri","Su, Toprak ve Bitkiler","Nüfus","Türkiye'de Nüfus","Göç",
      "Ekonomik Faaliyetler","Bölgeler","Uluslararası Ulaşım Hatları","Çevre ve Toplum","Doğal Afetler"
    ]},
    "Felsefe": { soru: 5, konular: [
      "Felsefenin Konusu","Bilgi Felsefesi","Varlık Felsefesi","Ahlak Felsefesi","Sanat Felsefesi",
      "Din Felsefesi","Siyaset Felsefesi","Bilim Felsefesi","İlk Çağ Felsefesi","2.-15. Yüzyıl Felsefeleri",
      "15.-17. Yüzyıl Felsefeleri","18.-19. Yüzyıl Felsefeleri","20. Yüzyıl Felsefesi"
    ]},
    "Din Kültürü": { soru: 5, konular: [
      "Bilgi ve İnanç","Din ve İslam","İslam ve İbadet","Gençlik ve Değerler","İslam Medeniyeti ve Özellikleri",
      "Allah İnancı ve İnsan","Allah'ın Varlığı ve Birliği","Kur'an-ı Kerim'de İnsan","Bir Genç Olarak Hz. Muhammed",
      "Din ve Aile","Din, Kültür ve Sanat","Din ve Çevre","Din ve Sosyal Değişim","Ahlaki Tutum ve Davranışlar"
    ]},
    "Fizik": { soru: 7, konular: [
      "Fizik Bilimine Giriş","Madde ve Özellikleri","Hareket ve Kuvvet","İş, Güç ve Enerji",
      "Isı, Sıcaklık ve Genleşme","Basınç","Kaldırma Kuvveti","Elektrostatik","Elektrik ve Manyetizma",
      "Dalgalar","Optik"
    ]},
    "Kimya": { soru: 7, konular: [
      "Kimya Bilimi","Atom ve Periyodik Sistem","Kimyasal Türler Arası Etkileşimler","Maddenin Halleri",
      "Doğa ve Kimya","Kimyanın Temel Kanunları","Kimyasal Hesaplamalar","Karışımlar","Asit, Baz ve Tuz",
      "Kimya Her Yerde"
    ]},
    "Biyoloji": { soru: 6, konular: [
      "Canlıların Ortak Özellikleri","Canlıların Temel Bileşenleri","Hücre ve Organelleri",
      "Hücre Zarından Madde Geçişi","Canlıların Sınıflandırılması","Mitoz ve Eşeysiz Üreme",
      "Mayoz ve Eşeyli Üreme","Kalıtım","Ekosistem Ekolojisi","Güncel Çevre Sorunları"
    ]}
  },
  AYT: {
    "Matematik": { soru: 40, konular: [
      "Temel Kavramlar","Kümeler","Mantık","Fonksiyonlar","Polinomlar","2. Dereceden Denklemler",
      "Binom","Permütasyon ve Kombinasyon","Olasılık","Veri ve İstatistik","Karmaşık Sayılar",
      "2. Dereceden Eşitsizlikler","Parabol","Trigonometri","Logaritma","Diziler","Limit","Türev","İntegral"
    ]},
    "Geometri": { konular: [
      "Üçgende Eşlik-Benzerlik","Üçgende Alan","Üçgende Merkezler","Çokgenler","Özel Dörtgenler",
      "Çember ve Daire","Analitik Geometri (Nokta-Doğru)","Dönüşüm Geometrisi","Çemberin Analitiği","Katı Cisimler"
    ]},
    "Fizik": { konular: [
      "Vektörler","Kuvvet, Tork ve Denge","Kütle Merkezi","Basit Makineler","Hareket",
      "Newton'un Hareket Yasaları","İş, Güç ve Enerji","Atışlar","İtme ve Momentum",
      "Elektrik Alan ve Potansiyel","Paralel Levhalar ve Sığa","Manyetik Alan ve Manyetik Kuvvet",
      "İndüksiyon, Alternatif Akım ve Transformatörler","Düzgün Çembersel Hareket",
      "Dönme, Yuvarlanma ve Açısal Momentum","Kütle Çekim ve Kepler Yasaları","Basit Harmonik Hareket",
      "Dalga Mekaniği","Atom Fiziğine Giriş ve Radyoaktivite","Modern Fizik"
    ]},
    "Kimya": { konular: [
      "Modern Atom Teorisi","Gazlar","Sıvı Çözeltiler ve Çözünürlük","Kimyasal Tepkimelerde Enerji",
      "Kimyasal Tepkimelerde Hız","Kimyasal Tepkimelerde Denge","Asit-Baz Dengesi","Çözünürlük Dengesi",
      "Kimya ve Elektrik","Karbon Kimyasına Giriş","Organik Kimya","Enerji Kaynakları ve Bilimsel Gelişmeler"
    ]},
    "Biyoloji": { konular: [
      "Sinir Sistemi","Endokrin Sistem","Duyu Organları","Destek ve Hareket Sistemi","Sindirim Sistemi",
      "Dolaşım ve Bağışıklık Sistemi","Solunum Sistemi","Üriner Sistem (Boşaltım)","Üreme Sistemi ve Embriyonik Gelişim",
      "Komünite Ekolojisi","Popülasyon Ekolojisi","Genden Proteine","Canlılarda Enerji Dönüşümleri (Fotosentez-Solunum)",
      "Bitki Biyolojisi","Canlılar ve Çevre"
    ]},
    "Edebiyat": { konular: [
      "Anlam Bilgisi","Şiir Bilgisi","Söz Sanatları","İslamiyet Öncesi Türk Edebiyatı","Halk Edebiyatı",
      "Divan Edebiyatı","Tanzimat Edebiyatı","Servet-i Fünun Edebiyatı","Fecr-i Ati Edebiyatı","Milli Edebiyat",
      "Cumhuriyet Dönemi Edebiyatı","Dünya Edebiyatı","Edebi Akımlar","Roman Özetleri"
    ]},
    "Tarih": { konular: [
      "Tarih ve Zaman","İlk ve Orta Çağlarda Türk Dünyası","Yerleşme ve Devletleşme Sürecinde Selçuklu Türkiyesi",
      "Beylikten Devlete Osmanlı Siyaseti","Dünya Gücü Osmanlı","Değişen Dünya Dengeleri Karşısında Osmanlı Siyaseti",
      "Değişim Çağında Avrupa ve Osmanlı","Uluslararası İlişkilerde Denge Stratejisi (1774-1914)",
      "Devrimler Çağında Değişen Devlet-Toplum İlişkileri","Sermaye ve Emek",
      "XIX. ve XX. Yüzyılda Değişen Gündelik Hayat","Milli Mücadele","Atatürkçülük ve Türk İnkılabı",
      "İki Savaş Arasındaki Dönemde Türkiye ve Dünya","II. Dünya Savaşı Sürecinde Türkiye ve Dünya",
      "II. Dünya Savaşı Sonrasında Türkiye ve Dünya","Toplumsal Devrim Çağında Dünya ve Türkiye",
      "XXI. Yüzyılın Eşiğinde Türkiye ve Dünya"
    ]},
    "Coğrafya": { konular: [
      "Ekosistemlerin Özellikleri ve İşleyişi","Küresel İklim Değişimi","Nüfus Politikaları","Yerleşmelerin Özellikleri",
      "Ekonomik Faaliyetler ve Doğal Kaynaklar","Türkiye'de Ekonomi","Geçmişten Geleceğe Şehir ve Ekonomi",
      "Türkiye'nin İşlevsel Bölgeleri ve Kalkınma Projeleri","Hizmet Sektörünün Ekonomideki Yeri","Küresel Ticaret",
      "Türkiye Turizmi","Kültür Bölgeleri","Jeopolitik Konum","Ülkeler Arası Etkileşim","Çevre ve Toplum"
    ]},
    "Felsefe": { konular: [
      "Felsefenin Konusu","Bilgi Felsefesi","Varlık Felsefesi","Ahlak Felsefesi","Sanat Felsefesi","Din Felsefesi",
      "Siyaset Felsefesi","Bilim Felsefesi","İlk Çağ Felsefesi","MÖ 6.-MS 2. Yüzyıl Felsefesi",
      "MS 2.-MS 15. Yüzyıl Felsefesi","15.-17. Yüzyıl Felsefesi","18.-19. Yüzyıl Felsefesi","20. Yüzyıl Felsefesi"
    ]},
    "Mantık": { konular: ["Mantığa Giriş","Klasik Mantık","Mantık ve Dil","Sembolik Mantık"] },
    "Psikoloji": { konular: ["Psikoloji Bilimini Tanıyalım","Psikolojinin Temel Süreçleri","Öğrenme, Bellek, Düşünme","Ruh Sağlığının Temelleri"] },
    "Sosyoloji": { konular: ["Sosyolojiye Giriş","Birey ve Toplum","Toplumsal Yapı","Toplumsal Değişme ve Gelişme","Toplum ve Kültür","Toplumsal Kurumlar"] },
    "Din Kültürü": { konular: [
      "Dünya ve Ahiret","Kur'an'a Göre Hz. Muhammed","Kur'an'da Bazı Kavramlar","İnançla İlgili Meseleler",
      "Yahudilik ve Hristiyanlık","İslam ve Bilim","Anadolu'da İslam","İslam Düşüncesinde Tasavvufi Yorumlar",
      "Güncel Dini Meseleler","Hint ve Çin Dinleri"
    ]}
  }
};

// ── YARDIMCI FONKSİYONLAR ──

// Tüm dersleri (TYT ∪ AYT) tekilleştirip döndürür.
function ykskafaTumDersler(){
  return [...new Set([...Object.keys(YKSKAFA_KONULAR.TYT), ...Object.keys(YKSKAFA_KONULAR.AYT)])];
}

// Bir ders için TYT ve AYT konularını birleştirip döndürür (yoksa boş dizi).
function ykskafaKonular(ders){
  const t = (YKSKAFA_KONULAR.TYT[ders] && YKSKAFA_KONULAR.TYT[ders].konular) || [];
  const a = (YKSKAFA_KONULAR.AYT[ders] && YKSKAFA_KONULAR.AYT[ders].konular) || [];
  return [...new Set([...t, ...a])];
}

// Bir dersten rastgele bir konu adı döndürür (mock/demo verisi için).
function ykskafaRastgeleKonu(ders){
  const list = ykskafaKonular(ders);
  return list.length ? list[Math.floor(Math.random()*list.length)] : 'Genel Konu Tekrarı';
}
