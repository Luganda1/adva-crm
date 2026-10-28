// Shared copy for the public marketing pages (/, /about, /services) — kept
// in one place so the landing page's feature grid and the dedicated
// /services page can't drift apart.

export const FEATURES = [
  { icon: '📋', title: 'Lead pipeline', body: 'Track every property from first contact through close — notes, follow-ups, and status in one board.' },
  { icon: '🗺️', title: 'Map & property lookup', body: 'Search any address on a live map and pull real listing data — beds, baths, sqft, price — straight into a lead.' },
  { icon: '🏛️', title: 'Free HUD REO leads', body: "Browse HUD's official foreclosure list nationwide and add the ones you want — nothing gets imported automatically." },
  { icon: '🤝', title: 'Money partners', body: 'A separate pipeline for tracking capital partners and matching deals to funding.' },
  { icon: '🤖', title: 'AI lead triage', body: 'An AI assistant scores and summarizes incoming leads so your team works the hot ones first.' },
  { icon: '💬', title: 'AI assistant', body: 'Ask questions about your pipeline in plain English, right from any screen.' },
  { icon: '⬆️', title: 'Bulletproof CSV import', body: 'Bring in leads from anywhere with column-mapping and a preview before anything touches your data.' },
  { icon: '✉️', title: 'Letters & follow-up', body: 'Mail-merge letter generation and a dedicated view for leads with upcoming or overdue follow-ups.' },
]

export const STEPS = [
  { n: '01', title: 'Leads land in one place', body: 'From Realeflow via Zapier, a map search, or HUD’s free foreclosure list — every lead ends up in the same pipeline.' },
  { n: '02', title: 'AI triages, your team works it', body: 'New leads get scored and summarized automatically, so the team calls the hottest ones first instead of digging through a spreadsheet.' },
  { n: '03', title: 'Match funding, close it out', body: 'Pair active leads with money partners, log the deal, and move on to the next one.' },
]
