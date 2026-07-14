export async function notifyZapier(property: Record<string, unknown>) {
  const url = process.env.ZAP_INBOUND_URL
  if (!url) return
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(property),
    })
  } catch (e) {
    console.error('[notify-zap] Failed to reach Zapier:', e)
  }
}
