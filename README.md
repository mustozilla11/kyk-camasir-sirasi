# GSB KYK Yurdu Çamaşırhane Sıra & Randevu Sistemi

Öğrenciler için adil, güvenli ve **sıfır kişisel veri** ile çalışan, yurt çamaşırhaneleri için özel olarak tasarlanmış modern Next.js web uygulaması.

---

## 🚀 Öne Çıkan Özellikler

1. **Sıfır Kişisel Veri (Tam KVKK Uyumluluğu):**
   - Sistemde isim, soyisim, TC kimlik numarası veya telefon gibi hiçbir kişisel veri **tutulmaz ve istenmez**.
   - Sadece **Kat (1-3)**, **Oda Numarası (Örn: 2116)** ve **Yatak Numarası (1-5)** kullanılır.

2. **Gizlilik Koruması:**
   - Bir sıra alındığında diğer öğrencilerin ekranında sadece **"DOLU"** yazar. Kimin aldığı asla görünmez.
   - Sadece yetkili görevli `/admin` ekranında hangi yatağın aldığını teyit edebilir.

3. **7 Günde En Fazla 2 Sıra Kuralı:**
   - Aynı yatak (Örn: `2116-3`), 7 günlük kayan zaman diliminde en fazla **2 defa** sıra alabilir. 3. sıra engellenir.
   - Sıra iptal edildiğinde hak anında geri tanımlanır.

4. **Çift Randevu (Çakışma) Koruması:**
   - Aynı makine ve saat dilimine iki öğrencinin aynı anda tıklaması durumunda veritabanı seviyesinde `UNIQUE` kısıtıyla çift kayıt %100 engellenir (HTTP 409).

5. **Öğrenci Sıra İptali (İptal Kodu ile):**
   - Öğrenci sıra aldığında ekranda 6 haneli özel bir **İptal Kodu** üretilir.
   - Başka kimse sıranızı iptal edemez; sıranızı sadece bu kod ile iptal edebilirsiniz.

6. **Görevli / Yönetici Masası (`/admin`):**
   - Şifreli giriş (Varsayılan şifre: `kykadmin123`).
   - **Teyit Arama Masası:** Çamaşırhaneye gelen öğrenci yatak numarasını söylediğinde (örn: `2116-3`), görevli arama çubuğuna yazarak öğrencinin randevusunu saniyeler içinde teyit eder.
   - **Resmi A4 Döküman Çıktısı (Yazdır / PDF):** Tek tıkla resmi başlıklı, görevli imza alanlı günlük teslim çizelgesi formatında yazıcıya gönderilebilir veya PDF kaydedilebilir.
   - **Makine Arıza / Bakım:** Bozuk makineler tek tıkla arızalıya alınabilir; öğrenci o makineye sıra alamaz.

7. **Çalışma Saatleri & Kurallar:**
   - 8 adet Çamaşır Makinesi.
   - Çalışma Saatleri: 13:30 - 21:30 (1 saatlik slotlar).
   - Hafta sonu (Cumartesi / Pazar) otomatik kapalıdır.
   - En fazla 7 gün ilerisine kadar sıra alınabilir.

---

## 💻 Yerel Geliştirme (Kurulum Gerektirmez)

Projede sıfır kurulumlu yerel SQLite desteği bulunmaktadır:

```bash
cd kyk-camasir-sirasi
npm install
npm run dev
```

Tarayıcınızdan açın:
- Öğrenci Ekranı: `http://localhost:3000`
- Yönetici Ekranı: `http://localhost:3000/admin` (Şifre: `kykadmin123`)

---

## ☁️ Vercel Ücretsiz Dağıtım (Deploy Rehberi)

Bu proje **%100 ücretsiz** olarak barındırılabilir:

1. **Vercel'e Yükleme:**
   - Projenizi GitHub'a push edin.
   - [vercel.com](https://vercel.com) adresinden **"Add New Project"** diyerek reponuzu seçin.

2. **Ücretsiz Veritabanı Bağlama (Neon Postgres):**
   - Vercel Dashboard'unuzda projenizin **"Storage"** sekmesine gidin.
   - **"Create Database"** -> **"Neon Serverless Postgres"** (Free Tier) seçin.
   - Bağlantı otomatik olarak `DATABASE_URL` veya `POSTGRES_URL` adıyla projenize eklenecektir.

3. **Ortam Değişkenleri (Environment Variables):**
   Vercel projenizin Settings -> Environment Variables bölümüne ekleyin:
   - `ADMIN_PASSWORD`: Görevlilerin gireceği şifre (örn: `yurtGuvenliSifre2026`)
   - `JWT_SECRET`: Rastgele bir gizli anahtar

4. **Deploy Et:**
   - Vercel otomatik olarak projeyi derleyip yayına alacaktır.
   - 7 günden eski kayıtlar `vercel.json` içindeki Cron Job ile her gece otomatik temizlenir.
