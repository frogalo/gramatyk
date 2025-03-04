export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url");
    // Note: You can also check for disableCache if needed.
    if (!targetUrl) {
        return new Response(JSON.stringify({ error: "Missing URL parameter" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const response = await fetch(targetUrl);
        if (!response.ok) {
            return new Response(
                JSON.stringify({ error: "Error fetching URL" }),
                {
                    status: response.status,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }
        const data = await response.text();
        const headers = new Headers();
        headers.set("Access-Control-Allow-Origin", "*");
        return new Response(data, {
            status: 200,
            headers: headers,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
