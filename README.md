This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


TODO: data/content-data.json ==> olarak tek dosyaya düşür.
      veri ayrımı "type": "news" | "announcements" olarak ayrım yapılabilir.
      "newsType": "news", sadece news verilerinde bulunacak
TODO: data/content-data.json ==> slug değeri değişebilir olacak
TODO: data/content-data.json ==> her değer unique id değerine sahip olacak
TODO: data/content-data.json ==> içinde files array elemanları id değerleri unique değere sahip olacak
TODO: data/content-data.json ==> içinde files array elemanlarının path değeri /uploads/unique_id şeklinde olacak 
      unique_id content id değeri olacak
TODO: files: "originalName": alanı gereksiz kaldır
TODO: uploads/[contenId] ==> burada aynı isim ve uzantıda dosya olmayacağının kontrolünü yap.

contenId ==> type-yyyy-mm-dd-hh

 bu şekilde bir id üretilebilir
const simdi = new Date();

const yil = simdi.getFullYear();
// Aylar 0-11 arası olduğu için 1 ekliyoruz
const ay = String(simdi.getMonth() + 1).padStart(2, '0'); 
const gun = String(simdi.getDate()).padStart(2, '0');

const saat = String(simdi.getHours()).padStart(2, '0');
const dakika = String(simdi.getMinutes()).padStart(2, '0');
const saniye = String(simdi.getSeconds()).padStart(2, '0');
// Milisaniye 3 haneli olduğu için padStart(3, '0') kullanıyoruz
const milisaniye = String(simdi.getMilliseconds()).padStart(3, '0');

// İstediğin formatta birleştirme (Şablon Dizisi - Template Literal ile)
const formatliTarih = `${yil}-${ay}-${gun} ${saat}:${dakika}:${saniye}.${milisaniye}`;

console.log(formatliTarih); 
// Çıktı Örneği: "2026-06-10 20:23:36.145"