# KAP Robotu (Scraper)

Bu robot, KAP (Kamu Aydınlatma Platformu) üzerinden fonlara ait "Portföy Dağılım Raporlarını" bulmak için tasarlanmıştır.

## Kurulum

Gerekli kütüphaneleri yükleyin:
```bash
npm install puppeteer
```

## Kullanım

Terminalde aşağıdaki komutu çalıştırın:
```bash
node kap-robot.js MAC
```
*(MAC yerine istediğiniz fon kodunu yazabilirsiniz)*

## Nasıl Çalışır?
1. `puppeteer` kullanarak sanal bir tarayıcı açar.
2. KAP ana sayfasına gider.
3. Fon kodunu arar.
4. Fon detay sayfasına gider.
5. "Bildirimler" sekmesine tıklar.
6. "Portföy Dağılım Raporu" içeren son bildirimleri tarar.
7. Bulursa linki ekrana yazar.

## Önemli Notlar
- **Bot Koruması:** KAP sitesi botlara karşı korumalıdır (Cloudflare vb.). Bu nedenle robot bazen "Navigation Timeout" hatası verebilir veya sayfayı yükleyemeyebilir.
- **Kesin Çözüm:** Profesyonel kullanım için Fintables, Matriks veya Foreks gibi veri sağlayıcıların API'lerini kullanmanız önerilir. Bu robot bir "Proof of Concept" (Kavram Kanıtı) niteliğindedir.
