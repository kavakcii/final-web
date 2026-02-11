
async function testFF() {
    const url = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
    console.log(`Fetching: ${url}`);
    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            console.log(`Success! Found ${data.length} events.`);
            console.log(data.slice(0, 3));
        } else {
            console.log(`Failed: ${response.status}`);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}
testFF();
