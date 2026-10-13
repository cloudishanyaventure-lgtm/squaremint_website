const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin');
  if (!origin || origin !== new URL(request.url).origin) return json({ error: 'Please submit the enquiry from this website.' }, 403);
  if (!request.headers.get('Content-Type')?.includes('application/json')) return json({ error: 'Expected a JSON enquiry.' }, 415);
  if (Number(request.headers.get('Content-Length')) > 4096) return json({ error: 'Enquiry is too large.' }, 413);
  let data;
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'Enquiry is empty.' }, 400);
    const chunks = []; let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) { await reader.cancel(); return json({ error: 'Enquiry is too large.' }, 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    data = JSON.parse(new TextDecoder().decode(bytes));
  } catch { return json({ error: 'Please check your enquiry and try again.' }, 400); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return json({ error: 'Invalid enquiry.' }, 400);
  if (data.website) return json({ error: 'Your enquiry could not be accepted.' }, 400);
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim() : '';
  const cities = ['Bengaluru', 'Mumbai', 'Hyderabad', 'Pune', 'Delhi NCR'];
  const interests = { buy: 'Buying a home', fractional: 'Fractional ownership', rto: 'Rent-to-own' };
  if (!name || name.length > 100 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !cities.includes(data.city) || !Object.hasOwn(interests, data.interest) || data.consent !== 'on' || (data.property && (typeof data.property !== 'string' || data.property.length > 150))) return json({ error: 'Please provide a valid name, email, city, interest, and consent.' }, 400);
  if (!env.RESEND_API_KEY || !env.ENQUIRY_TO || !env.ENQUIRY_FROM) return json({ error: 'Enquiries are not connected yet. You can download your enquiry below.' }, 503);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000),
      body: JSON.stringify({ from: env.ENQUIRY_FROM, to: [env.ENQUIRY_TO], reply_to: email, subject: `Squaremint enquiry: ${interests[data.interest]}`, text: `Name: ${name}\nEmail: ${email}\nCity: ${data.city}\nInterest: ${interests[data.interest]}\nProperty: ${data.property || 'Not specified'}\nContact consent: provided` })
    });
    if (!response.ok) return json({ error: 'Your enquiry could not be sent. Please try again later or download a copy.' }, 502);
    return json({ ok: true });
  } catch { return json({ error: 'Email delivery could not be confirmed. Please download a copy of your enquiry.' }, 502); }
}
export function onRequestGet() { return json({ error: 'Use the enquiry form to send a message.' }, 405); }
