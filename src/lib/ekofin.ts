export async function fetchEkofinFunds(page = 2, pageSize = 100) {
  const url = `https://ekofin.net/fonlar?page=${page}&pageSize=${pageSize}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ekofin page ${page}: ${res.status}`);
  }
  const html = await res.text();
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error('__NEXT_DATA__ not found in ekofin page');
  }
  const data = JSON.parse(match[1]);
  const funds = data?.props?.pageProps?.funds ?? [];
  return funds;
}
