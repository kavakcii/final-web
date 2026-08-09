import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://finai.net.tr';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/varlik/',
          '/about',
          '/hakkimizda',
          '/dashboard/data',
          '/dashboard/economic-calendar',
          '/dashboard/news',
          '/dashboard/reports',
          '/llms.txt',
        ],
        disallow: [
          '/api/',
          '/dashboard/settings',
          '/dashboard/account',
          '/3d-login-dev',
          '/reset-password',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
