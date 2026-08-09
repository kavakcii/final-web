import { MetadataRoute } from 'next';
import { sectorMapping } from '@/data/sectorMapping';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://finai.net.tr';
  const lastModified = new Date();

  // Sabit Sayfalar
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/dashboard/data`,
      lastModified,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/dashboard/economic-calendar`,
      lastModified,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/dashboard/news`,
      lastModified,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/dashboard/reports`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/hakkimizda`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/legal/terms`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/kvkk`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // BIST Hisseleri Dinamik Sayfaları (Tüm BIST Şirketleri)
  const stockSymbols = Object.keys(sectorMapping);
  const stockPages: MetadataRoute.Sitemap = stockSymbols.map((symbol) => ({
    url: `${baseUrl}/varlik/${symbol}`,
    lastModified,
    changeFrequency: 'daily',
    priority: 0.85,
  }));

  return [...staticPages, ...stockPages];
}
