export type ScriptFormat = 'commercial-15' | 'commercial-30' | 'commercial-60' | 'documentary' | 'short-film'
export type Industry = 'realestate' | 'hospitality' | 'fintech' | 'education' | 'food' | 'health' | 'events' | 'retail' | 'general'

export interface ConceptScene {
  number: number
  title: string
  timecode: string
  visual: string
  audio: string
  vo: string
  onScreen?: string
}

export interface GeneratedConcept {
  id: string
  title: string
  format: string
  duration: string
  industry: Industry
  logline: string
  synopsis: string
  scenes: ConceptScene[]
  castNotes: string
  productionNotes: {
    recommendedStyle: string
    mood: string
    colorDirection: string
    musicDirection: string
  }
  generatedAt: string
}

const industryKeywords: Record<Industry, string[]> = {
  realestate:  ['house','home','apartment','property','land','estate','ruaka','westlands','rent','buy','bedroom','plot','let'],
  hospitality: ['hotel','resort','safari','stay','lodge','travel','tourism','booking','room','getaway','camp'],
  fintech:     ['money','loan','sacco','bank','finance','send','pay','mpesa','invest','save','credit','wallet'],
  education:   ['school','learn','study','student','teacher','course','online','tutor','education','class','grade','exam','university'],
  food:        ['food','restaurant','eat','meal','dish','pizza','nyama','chicken','cafe','menu','kitchen','cook','chef','delivery'],
  health:      ['clinic','hospital','doctor','health','wellness','dental','pharmacy','medicine','patient','care','therapy'],
  events:      ['event','concert','conference','wedding','party','launch','festival','show','ticket','venue'],
  retail:      ['shop','store','product','brand','fashion','sale','clothing','shoes','accessories','online shop'],
  general:     [],
}

function detectIndustry(input: string): Industry {
  const lower = input.toLowerCase()
  for (const [industry, keywords] of Object.entries(industryKeywords) as [Industry, string[]][]) {
    if (industry === 'general') continue
    if (keywords.some(k => lower.includes(k))) return industry
  }
  return 'general'
}

function formatLabel(f: ScriptFormat) {
  return {
    'commercial-15': 'Television Commercial',
    'commercial-30': 'Television Commercial',
    'commercial-60': 'Brand Film Commercial',
    'documentary':   'Mini Documentary',
    'short-film':    'Short Film',
  }[f]
}

function durationLabel(f: ScriptFormat) {
  return { 'commercial-15': '15 seconds', 'commercial-30': '30 seconds', 'commercial-60': '60 seconds', 'documentary': '3–5 minutes', 'short-film': '5–10 minutes' }[f]
}

// ─── Industry templates ─────────────────────────────────────────────

const templates: Record<Industry, {
  title: string; logline: string; synopsis: string
  scenes30s: ConceptScene[]; scenes15s: ConceptScene[]
  scenesDoco: ConceptScene[]
  castNotes: string
  productionNotes: GeneratedConcept['productionNotes']
}> = {

  realestate: {
    title: 'Where Your Story Begins',
    logline: 'A cinematic journey into a life reimagined — where every wall tells a story and every sunrise belongs to you.',
    synopsis: `The film opens on the exhaustion of everyday Nairobi life — packed commutes, rented walls, borrowed time. Slowly, a shift. A door opens onto something different.\n\nWe follow a young couple discovering their first real home — not just as walls and a roof, but as the foundation of everything they have been building toward. Every shot is bathed in golden light: a modern kitchen, a child's laughter echoing through corridors, a night skyline viewed from their own balcony.\n\nThe film closes with a quiet, powerful moment — the couple sitting in their living room in the early morning, the city waking up outside, everything finally theirs.`,
    scenes30s: [
      { number: 1, title: 'The Weight of Renting', timecode: '0:00–0:07', visual: 'WIDE SHOT: Busy Nairobi CBD, matatus, crowds. CUT TO: CLOSE UP — a couple in a cramped rental apartment. Peeling walls. Landlord\'s notice on the door.', audio: 'Low city ambience fades to sparse, melancholic piano.', vo: '"Every month, you pay for someone else\'s dream."' },
      { number: 2, title: 'The Arrival', timecode: '0:07–0:16', visual: 'DRONE SHOT: Aerial glide over a lush estate at golden hour. MATCH CUT to the couple\'s faces — amazed. Children play on manicured lawns below.', audio: 'Piano lifts. Warm Afro-soul melody rises.', vo: '"Imagine coming home to something that is truly yours."' },
      { number: 3, title: 'The Life Inside', timecode: '0:16–0:25', visual: 'RAPID MONTAGE: Fitted kitchen. Family at the dining table. Private parking. Rooftop terrace with city views. The couple dancing in their living room.', audio: 'Music swells — upbeat, warm, hopeful.', vo: '"Sunrise Gardens. 2 & 3 bedroom apartments from KES 6.5M. Built for the life you deserve."' },
      { number: 4, title: 'The Key', timecode: '0:25–0:30', visual: 'CLOSE UP: A hand turns a key in a bright front door. REVEAL: The couple stepping inside. Wide smile. The door closes. SUPER: Logo + contact.', audio: 'Music resolves to a warm, simple chord.', vo: '"Your story starts here."', onScreen: 'SUNRISE GARDENS | RUAKA, NAIROBI | 0700 000 000' },
    ],
    scenes15s: [
      { number: 1, title: 'Hook', timecode: '0:00–0:04', visual: 'CLOSE UP: A landlord\'s notice on a door. PAN to a couple looking stressed.', audio: 'Tense silence, then a single piano note.', vo: '"Still paying rent?"' },
      { number: 2, title: 'Reveal', timecode: '0:04–0:11', visual: 'DRONE SHOT: Beautiful estate at golden hour. MONTAGE: Kitchen, balcony, children playing.', audio: 'Warm, hopeful Afro-soul music kicks in.', vo: '"Sunrise Gardens. Own your 2-bedroom home from KES 6.5M — just 10% deposit."' },
      { number: 3, title: 'CTA', timecode: '0:11–0:15', visual: 'LOGO on clean background. WhatsApp icon pulses.', audio: 'Music fades to a resolved chord.', vo: '"Call now. Only 12 units left."', onScreen: '0700 000 000 | sunrisegardens.co.ke' },
    ],
    scenesDoco: [
      { number: 1, title: 'Opening — The City\'s Heartbeat', timecode: '0:00–0:40', visual: 'WIDE ESTABLISHING: Time-lapse of Nairobi at dawn. People moving, matatus, hawkers. TALKING HEAD: A young professional speaking directly to camera.', audio: 'Natural city ambience. Soft documentary score underneath.', vo: 'NARRATOR: "For millions of Kenyans, the city is a place of opportunity — and of waiting. Waiting for the right moment to stop renting and start owning."' },
      { number: 2, title: 'The Dream Deferred', timecode: '0:40–1:20', visual: 'VÉRITÉ: Footage inside a rental apartment. Personal items. A savings jar on the counter. INTERVIEW: Couple talking about their homeownership journey.', audio: 'Intimate, quiet score.', vo: 'SUBJECT (INTERVIEW): "We had been saving for four years. Every month it felt further away."' },
      { number: 3, title: 'Discovery', timecode: '1:20–2:10', visual: 'SITE VISIT: The couple walking through Sunrise Gardens for the first time. Genuine reactions. Architect walking them through the unit.', audio: 'Hopeful, warmer music begins.', vo: 'NARRATOR: "But for many, the breakthrough came from an unexpected place — a development built not for the wealthy, but for the determined."' },
      { number: 4, title: 'The Community', timecode: '2:10–3:00', visual: 'MONTAGE: Residents going about their day. Children in the garden. Neighbours greeting each other. Evening light.', audio: 'Full, warm documentary score.', vo: 'NARRATOR: "Sunrise Gardens, Ruaka. More than a development — a community built for those who chose not to wait any longer."', onScreen: 'sunrisegardens.co.ke | 0700 000 000' },
    ],
    castNotes: 'NARRATOR: Male or female, Kenyan accent, warm and authoritative. Age feel: 30–45.\nFEATURED COUPLE: Aspirational but relatable. Ages 28–38. Nairobi middle-class aesthetic.\nCHILDREN: 1–2 children, ages 4–8, natural and unscripted.',
    productionNotes: { recommendedStyle: 'Cinematic Live Action', mood: 'Warm & Aspirational', colorDirection: 'Golden hour tones. Deep warm ambers, soft creams, rich greens.', musicDirection: 'Afro-soul or acoustic Kenyan contemporary. Emotional without being sentimental.' },
  },

  fintech: {
    title: 'Money, But Make It Simple',
    logline: 'A confident, modern story of financial freedom — for people who are done waiting for tomorrow.',
    synopsis: `Open on the quiet frustration of financial bureaucracy — long queues, hidden fees, confusing forms. Then, a smartphone. A tap. Done.\n\nThe film follows three different Kenyans — a mama mboga, a young entrepreneur, a university student — each using the platform in their own world. Each one moving forward.\n\nThe film closes with all three looking directly at the camera, money transferred, goals met, futures unlocked.`,
    scenes30s: [
      { number: 1, title: 'The Old Way', timecode: '0:00–0:07', visual: 'QUICK CUTS: Bank queue snaking out the door. ATM "Service Unavailable" screen. Frustrated customer at a teller window.', audio: 'Ticking clock sound. Tension builds.', vo: '"Your money shouldn\'t be this complicated."' },
      { number: 2, title: 'The Switch', timecode: '0:07–0:15', visual: 'CLOSE UP: A phone screen. A thumb taps "Send". GRAPHIC: Money flies across a map of Kenya — Mombasa to Kisumu to Nairobi.', audio: 'Single clean "whoosh". Upbeat electronic Afro-beat begins.', vo: '"PesaSure. Send, save, and grow your money — from your phone, in seconds."' },
      { number: 3, title: 'Real People, Real Results', timecode: '0:15–0:25', visual: 'MONTAGE: Mama mboga checking her savings. Young entrepreneur receiving a payment notification. University student paying fees with a smile.', audio: 'Music is confident and modern — Afro-fusion.', vo: '"Trusted by over 50,000 Kenyans. Zero hidden fees."' },
      { number: 4, title: 'CTA', timecode: '0:25–0:30', visual: 'PRODUCT SCREEN: App interface on phone. App Store / Google Play badges appear. Logo.', audio: 'Music resolves cleanly.', vo: '"Download PesaSure today. Your money, your rules."', onScreen: 'PESASURE | Download on the App Store & Google Play' },
    ],
    scenes15s: [
      { number: 1, title: 'Problem', timecode: '0:00–0:04', visual: 'Quick cuts: Bank queue, ATM error, frustrated face.', audio: 'Ticking clock.', vo: '"Tired of banks making it hard?"' },
      { number: 2, title: 'Solution', timecode: '0:04–0:11', visual: 'CLOSE UP: Phone screen — tap, send, done. GRAPHIC animation of money moving across Kenya.', audio: 'Afro-beat drops.', vo: '"PesaSure. Send money in seconds. Zero fees."' },
      { number: 3, title: 'Download', timecode: '0:11–0:15', visual: 'App on phone. App badges.', audio: 'Music resolves.', vo: '"Download now."', onScreen: 'PESASURE — Available on iOS & Android' },
    ],
    scenesDoco: [
      { number: 1, title: 'The Problem with Money in Kenya', timecode: '0:00–0:45', visual: 'Archive footage of long bank queues. DATA OVERLAY: Statistics on financial exclusion in Kenya.', audio: 'Serious documentary score.', vo: 'NARRATOR: "In Kenya, 40% of adults still struggle to access basic financial services. Not because they don\'t have money — but because the system wasn\'t built for them."' },
      { number: 2, title: 'Three Stories', timecode: '0:45–2:00', visual: 'Three intercut stories: mama mboga, entrepreneur, student. Each filmed in their natural environment.', audio: 'Intimate. Personal. Score shifts warmer.', vo: 'NARRATOR: "But a new generation of Kenyans is choosing differently."' },
      { number: 3, title: 'The Platform', timecode: '2:00–3:00', visual: 'PRODUCT DEMO interwoven with testimonials. Clean, modern UI shots. Founder interview.', audio: 'Hopeful, forward-looking music.', vo: 'NARRATOR: "PesaSure — built by Kenyans, for Kenyans. Simple, secure, and finally — for everyone."', onScreen: 'pesasure.co.ke | Download Today' },
    ],
    castNotes: 'NARRATOR: Confident Kenyan female voice, 30–40 years. Modern, clear, no-nonsense.\nFEATURED USERS: 3 real-looking people (not actors if possible). Diverse — urban & peri-urban Kenya.\nNO SUITS: Cast should feel real and accessible, not corporate.',
    productionNotes: { recommendedStyle: 'Modern Documentary / Brand Film Hybrid', mood: 'Confident & Empowering', colorDirection: 'Clean blues and whites with warm accent pops. Modern fintech palette.', musicDirection: 'Contemporary Afro-electronic. Confident, not aggressive.' },
  },

  hospitality: {
    title: 'The World Can Wait',
    logline: 'A sensory invitation to leave everything behind — if only for a weekend.',
    synopsis: `The film opens in the middle of a hectic week — deadlines, notifications, traffic. Then — one decision. A booking.\n\nWe follow a couple from the noise of the city to the quiet of a boutique safari lodge at the coast. Every frame is a postcard: warm light on the water, the sound of birds, a meal eaten slowly.\n\nThe film is less about the hotel and more about how it feels to finally breathe.`,
    scenes30s: [
      { number: 1, title: 'The Noise', timecode: '0:00–0:06', visual: 'FAST CUTS: Email notifications. Traffic. Office meeting. Alarm clock at 5AM. Tired face in a bathroom mirror.', audio: 'City noise. Stress sounds. Builds to almost uncomfortable.', vo: '"You have been saying \'next weekend\' for three months."' },
      { number: 2, title: 'The Escape', timecode: '0:06–0:14', visual: 'SLOW MOTION: A car window opening. The city fades to countryside. Coast appears. A wooden gate opens onto a lush resort.', audio: 'All noise cuts to silence. Then: gentle waves, birdsong, acoustic guitar.', vo: '"Safari Stays. Your escape is closer than you think."' },
      { number: 3, title: 'The Experience', timecode: '0:14–0:24', visual: 'LUSH MONTAGE: Infinity pool. Seafood platter at sunset. Couple watching elephants from a private deck. Spa treatment. Open-air bedroom with ocean breeze.', audio: 'Full warm acoustic track. Dreamy.', vo: '"Private lodges, world-class dining, wildlife experiences — from KES 8,500 per night."' },
      { number: 4, title: 'Book Now', timecode: '0:24–0:30', visual: 'SIMPLE SHOT: Couple on the deck as the sun sets. She leans on his shoulder. Perfect peace. SUPER: Logo and booking link.', audio: 'Music fades to a single guitar note.', vo: '"You deserve this. Book now."', onScreen: 'SAFARI STAYS | safaristairs.co.ke | 0722 000 000' },
    ],
    scenes15s: [
      { number: 1, title: 'Escape', timecode: '0:00–0:05', visual: 'FAST CUTS of city stress → slow reveal of coastal resort at golden hour.', audio: 'Noise → silence → waves.', vo: '"You need this more than you know."' },
      { number: 2, title: 'Experience', timecode: '0:05–0:11', visual: 'Beautiful montage: pool, wildlife, sunset dinner.', audio: 'Acoustic guitar.', vo: '"Safari Stays. Private lodges from KES 8,500. Diani, Samburu, Naivasha."' },
      { number: 3, title: 'CTA', timecode: '0:11–0:15', visual: 'Logo + booking button.', audio: 'Resolves.', vo: '"Book your escape today."', onScreen: 'safaristairs.co.ke' },
    ],
    scenesDoco: [
      { number: 1, title: 'The Forgotten Art of Rest', timecode: '0:00–0:30', visual: 'Opening montage of Nairobi working life.', audio: 'Documentary score.', vo: 'NARRATOR: "Kenyans work harder than almost anyone. But when did we last truly rest?"' },
      { number: 2, title: 'The Properties', timecode: '0:30–2:00', visual: 'Cinematic tour of each Safari Stays property. Owner interview.', audio: 'Warm, textured score.', vo: 'NARRATOR: "Safari Stays was built on a simple belief: that world-class experiences should be within reach of every Kenyan family."' },
      { number: 3, title: 'The Guests Speak', timecode: '2:00–3:00', visual: 'Guest testimonials filmed at the property. Genuine moments.', audio: 'Gentle closing score.', vo: 'NARRATOR: "Because the world can wait. But the memories you make here — those stay forever."', onScreen: 'safaristairs.co.ke' },
    ],
    castNotes: 'NARRATOR: Warm, feminine Kenyan voice. Relaxed and aspirational.\nFEATURED GUESTS: Real-looking couples and families. Diverse ages 25–50.\nNO FORCED SMILING: Capture genuine reactions to the environment.',
    productionNotes: { recommendedStyle: 'Cinematic Live Action', mood: 'Dreamy & Escape-Focused', colorDirection: 'Warm golden hours, deep oceanic blues, lush greens. Saturated but natural.', musicDirection: 'Acoustic guitar, soft Afro-soul, coastal vibes. No electronic beats.' },
  },

  education: {
    title: 'The Future Is Earned Here',
    logline: 'A tribute to the quiet ambition of every student who chose to bet on themselves.',
    synopsis: `The film opens on a student late at night — studying by the glow of a phone screen. No fancy setup. Just will.\n\nWe move through the journey: the decision to enrol, the first lesson, the community of learners, the breakthrough moment when something clicks.\n\nThe film ends not at graduation — but at the moment a student realizes they already became the person they were studying to be.`,
    scenes30s: [
      { number: 1, title: 'The Gap', timecode: '0:00–0:07', visual: 'CLOSE UP: A job posting. "Minimum: Bachelor\'s Degree." Cut to: A young person staring at it. Back to a laptop — an online course platform opens.', audio: 'Quiet, determined underscore.', vo: '"The best investment you will ever make is in yourself."' },
      { number: 2, title: 'The Learning', timecode: '0:07–0:18', visual: 'MONTAGE: Student watching lesson on phone during commute. Group session over video call. Notebook filling with notes. Late-night study with coffee. First certificate downloading.', audio: 'Music builds — inspiring, forward-moving.', vo: '"Elimu Hub. Professional courses designed for Kenyan careers. Learn at your pace. Earn on your terms."' },
      { number: 3, title: 'The Win', timecode: '0:18–0:25', visual: 'Student in a job interview — confident. MATCH CUT to them at a desk, new role, smiling. A phone call. Good news. They look at the camera.', audio: 'Music peaks — triumphant but not over the top.', vo: '"Over 12,000 learners have already started. When will you?"' },
      { number: 4, title: 'Enrol Now', timecode: '0:25–0:30', visual: 'Platform UI on screen. Course catalogue. "Enrol" button. Logo.', audio: 'Music resolves cleanly.', vo: '"Elimu Hub. Learn today. Lead tomorrow."', onScreen: 'ELIMU HUB | elimuhub.co.ke | Start Free Today' },
    ],
    scenes15s: [
      { number: 1, title: 'Ambition', timecode: '0:00–0:05', visual: 'Late-night study. Phone glow. Determined eyes.', audio: 'Quiet piano.', vo: '"Your career doesn\'t wait for perfect conditions."' },
      { number: 2, title: 'Platform', timecode: '0:05–0:11', visual: 'Fast montage: courses, certificates, student winning.', audio: 'Inspiring build.', vo: '"Elimu Hub. 200+ courses. Learn from your phone. Certificates that employers recognise."' },
      { number: 3, title: 'CTA', timecode: '0:11–0:15', visual: 'Logo. Website.', audio: 'Resolves.', vo: '"Start free today."', onScreen: 'elimuhub.co.ke' },
    ],
    scenesDoco: [
      { number: 1, title: 'The Skills Gap', timecode: '0:00–0:40', visual: 'Interviews with employers talking about the talent shortage in Kenya.', audio: 'Documentary score.', vo: 'NARRATOR: "Kenya produces over 500,000 graduates per year. Yet employers say they cannot find the skills they need. Something, somewhere, is missing."' },
      { number: 2, title: 'The Students', timecode: '0:40–2:00', visual: 'Three learner profiles. Different backgrounds, same drive.', audio: 'Warm, personal score.', vo: 'NARRATOR: "Elimu Hub was built for the learners the system forgot — practical, accessible, and built around real Kenyan careers."' },
      { number: 3, title: 'The Outcome', timecode: '2:00–3:00', visual: 'Success stories. Data overlays. Platform highlights.', audio: 'Hopeful close.', vo: 'NARRATOR: "Because education isn\'t about the classroom. It\'s about what you do with what you learn."', onScreen: 'elimuhub.co.ke | Start Free Today' },
    ],
    castNotes: 'NARRATOR: Young, Kenyan, gender-neutral. Aspirational but not preachy.\nFEATURED STUDENTS: Diverse backgrounds. Rural and urban. Ages 18–35.\nAVOID: Stock-photo-looking setups. Everything should feel real.',
    productionNotes: { recommendedStyle: 'Hybrid Documentary / Commercial', mood: 'Determined & Hopeful', colorDirection: 'Deep blues and warm amber. Night study scenes contrast with bright, optimistic outcome scenes.', musicDirection: 'Piano-led with a modern Kenyan twist. Builds steadily to an inspiring close.' },
  },

  food: {
    title: 'Taste That Stays With You',
    logline: 'A sensory film about the food that brings us back — told through the hands that make it.',
    synopsis: `No narration needed for the opening — just sound. Oil in a pan, a knife on a chopping board, the sizzle of nyama on a grill. The film is a feast for the senses before a single word is spoken.\n\nWe move through the kitchen — not a commercial kitchen, a real one. The chef's hands are the star. Then — the guests. The first taste. The closed eyes. The smile.\n\nFood is not just food. It is memory, identity, and belonging. This film makes that case — beautifully.`,
    scenes30s: [
      { number: 1, title: 'The Craft', timecode: '0:00–0:08', visual: 'EXTREME CLOSE UPS: Fresh ingredients. Knife work. Marination. Charcoal grill smoke rising. The chef\'s focused face.', audio: 'ASMR kitchen sounds: sizzle, chop, steam. No music yet.', vo: '"Some people cook food. Some people make it speak."' },
      { number: 2, title: 'The Dish', timecode: '0:08–0:18', visual: 'HERO SHOT: The signature dish arrives at the table. Slow motion steam. Colours pop. CLOSE UP: First forkful. The guest closes their eyes.', audio: 'Music begins: warm, soulful Afro-jazz.', vo: '"At The Grill House, every plate is a conversation. Every visit, a memory."' },
      { number: 3, title: 'The People', timecode: '0:18–0:25', visual: 'MONTAGE: Families sharing a meal. Friends laughing. A couple on a date. The chef coming out to greet guests.', audio: 'Music reaches its warmest point.', vo: '"Open daily. Westlands, Nairobi. Dine-in and delivery."' },
      { number: 4, title: 'CTA', timecode: '0:25–0:30', visual: 'Restaurant exterior at evening — warm light inside. Logo. Call to action.', audio: 'Music fades warmly.', vo: '"Book your table tonight."', onScreen: 'THE GRILL HOUSE | 0711 000 000 | Westlands, Nairobi' },
    ],
    scenes15s: [
      { number: 1, title: 'Senses First', timecode: '0:00–0:05', visual: 'CLOSE UPS: Sizzling grill, fresh ingredients, hero dish on the plate.', audio: 'ASMR kitchen sounds → warm jazz.', vo: '"Some food you eat. Some food you remember."' },
      { number: 2, title: 'Restaurant', timecode: '0:05–0:11', visual: 'Happy guests. Warm restaurant interior. Chef waving.', audio: 'Jazz continues.', vo: '"The Grill House, Westlands. Open daily. Dine-in & delivery."' },
      { number: 3, title: 'CTA', timecode: '0:11–0:15', visual: 'Logo. Phone number.', audio: 'Resolves.', vo: '"Call to book."', onScreen: '0711 000 000' },
    ],
    scenesDoco: [
      { number: 1, title: 'The Hands Behind the Plate', timecode: '0:00–0:40', visual: 'Chef profile — in the kitchen before service starts. Personal, quiet moment.', audio: 'Sparse kitchen sounds.', vo: 'NARRATOR: "Before a restaurant opens its doors, there is a story — told in preparation, in seasoning, in love."' },
      { number: 2, title: 'The Ingredients', timecode: '0:40–1:30', visual: 'Market sourcing footage. Fresh produce. Farmer interviews.', audio: 'Warm documentary score.', vo: 'NARRATOR: "The Grill House built its menu around one conviction: the best food in Nairobi should come from the best farms in Kenya."' },
      { number: 3, title: 'The Guests', timecode: '1:30–3:00', visual: 'Real guests. Real reactions. Stories of why they keep coming back.', audio: 'Warm, closing jazz.', vo: 'NARRATOR: "Because a great restaurant isn\'t just a place you eat. It\'s a place you belong."', onScreen: 'The Grill House | thegrillhouse.co.ke' },
    ],
    castNotes: 'CHEF/TALENT: Ideally the real chef or owner. Authentic beats polished here.\nGUESTS: Real customers if possible. Or diverse cast — families, couples, young professionals.\nNARRATOR: Warm Kenyan female or male voice. Storytelling tone, not sales.',
    productionNotes: { recommendedStyle: 'Cinematic ASMR / Brand Documentary', mood: 'Warm, Sensory & Soulful', colorDirection: 'Warm ambers, rich deep browns, pops of fresh green. Restaurant warm lighting.', musicDirection: 'Afro-jazz or acoustic soul. Food deserves music that breathes.' },
  },

  health: {
    title: 'Care That Sees You',
    logline: 'A human-first story about the healthcare provider that treats the whole person — not just the condition.',
    synopsis: 'Healthcare advertising that feels different: warm, not clinical. Human, not institutional. We follow real patient journeys — not the illness, but the return to life.',
    scenes30s: [
      { number: 1, title: 'The Worry', timecode: '0:00–0:07', visual: 'CLOSE UP: A parent looking concerned. A child with a fever. Night-time. Searching Google. Confused and scared.', audio: 'Quiet, tense ambience.', vo: '"Health concerns should never wait. And neither should you."' },
      { number: 2, title: 'The Clinic', timecode: '0:07–0:18', visual: 'WARM SHOTS: A clean, modern clinic. A doctor greeting a family with a genuine smile. Consultation — attentive, unhurried.', audio: 'Calm, warm piano music begins.', vo: '"HealthCare Plus. Expert doctors. Real care. Walk-in or book online."' },
      { number: 3, title: 'Relief', timecode: '0:18–0:25', visual: 'MONTAGE: The child playing again. A patient leaving with a smile. A follow-up message from the doctor on the phone.', audio: 'Music brightens.', vo: '"Affordable consultation. Lab services. Specialist referrals. All under one roof."' },
      { number: 4, title: 'CTA', timecode: '0:25–0:30', visual: 'Clinic exterior — clean, welcoming. Logo.', audio: 'Music resolves.', vo: '"Your health. Our priority."', onScreen: 'HEALTHCARE PLUS | 0700 000 000 | healthcareplus.co.ke' },
    ],
    scenes15s: [
      { number: 1, title: 'The Need', timecode: '0:00–0:05', visual: 'Concerned parent. Night-time worry.', audio: 'Tense quiet.', vo: '"Don\'t wait. Don\'t guess."' },
      { number: 2, title: 'The Clinic', timecode: '0:05–0:11', visual: 'Warm clinic. Smiling doctor. Happy patient.', audio: 'Warm music.', vo: '"HealthCare Plus. Expert doctors. Walk-in welcome."' },
      { number: 3, title: 'Book Now', timecode: '0:11–0:15', visual: 'Logo. Contact.', audio: 'Resolves.', vo: '"Book your appointment today."', onScreen: '0700 000 000' },
    ],
    scenesDoco: [
      { number: 1, title: 'The Healthcare Reality', timecode: '0:00–0:40', visual: 'Data overlays about healthcare access in Kenya. Doctor interview.', audio: 'Serious, documentary score.', vo: 'NARRATOR: "For most Kenyan families, healthcare means waiting — in queues, in uncertainty, in fear."' },
      { number: 2, title: 'A Different Model', timecode: '0:40–2:00', visual: 'Clinic tour. Staff interviews. Patient stories.', audio: 'Warmer score.', vo: 'NARRATOR: "HealthCare Plus was built around a radical idea: what if every patient felt like the most important person in the room?"' },
      { number: 3, title: 'Community Impact', timecode: '2:00–3:00', visual: 'Community outreach. Patient testimonials. Family outcomes.', audio: 'Hopeful close.', vo: 'NARRATOR: "Care that sees you. Not just what you have — but who you are."', onScreen: 'healthcareplus.co.ke' },
    ],
    castNotes: 'DOCTORS: Real doctors if possible. White coats but warm approach — not stiff.\nPATIENTS: Real or realistic. Diverse ages. Family-centric.\nNARRATOR: Calm, reassuring voice. Male or female.',
    productionNotes: { recommendedStyle: 'Warm Documentary / Brand Film', mood: 'Reassuring & Human', colorDirection: 'Clean whites with warm accent colours. Soft blues and greens. Avoid harsh clinical lighting.', musicDirection: 'Soft piano or strings. Calm and reassuring — not sad.' },
  },

  events: {
    title: 'The Night You Won\'t Forget',
    logline: 'A high-energy invitation to be part of something larger than everyday life.',
    synopsis: 'Energy, community, spectacle — the film captures the electric anticipation before the doors open and the pure euphoria of the event itself.',
    scenes30s: [
      { number: 1, title: 'The Build', timecode: '0:00–0:08', visual: 'TIME LAPSE: Venue being set up. Lights rigged. Stage built. Catering laid out. First guests arriving.', audio: 'Rising electronic music — anticipation.', vo: '"Something big is coming to Nairobi."' },
      { number: 2, title: 'The Night', timecode: '0:08–0:20', visual: 'RAPID MONTAGE: Crowd energy. Performer on stage. Lights. Fireworks. People dancing, laughing, connecting.', audio: 'Full drop. Peak energy music.', vo: '"The Annual Business Summit. 2,000 professionals. World-class speakers. One unforgettable night."' },
      { number: 3, title: 'CTA', timecode: '0:20–0:30', visual: 'Date, venue. Ticket QR code. Logo.', audio: 'Music fades to an exciting close.', vo: '"Tickets selling fast. Secure yours now."', onScreen: 'NAIROBI BUSINESS SUMMIT | 15 MARCH 2025 | KICC | Tickets at nairobisummit.co.ke' },
    ],
    scenes15s: [
      { number: 1, title: 'Energy', timecode: '0:00–0:06', visual: 'Crowd, lights, excitement.', audio: 'Big music drop.', vo: '"Nairobi\'s biggest business event is back."' },
      { number: 2, title: 'Details', timecode: '0:06–0:12', visual: 'Speakers. Venue. Date graphic.', audio: 'Music continues.', vo: '"15 March. KICC. 2,000 leaders. One stage."' },
      { number: 3, title: 'CTA', timecode: '0:12–0:15', visual: 'Ticket QR code.', audio: 'Resolves.', vo: '"Get your ticket."', onScreen: 'nairobisummit.co.ke' },
    ],
    scenesDoco: [
      { number: 1, title: 'Why This Event Matters', timecode: '0:00–0:40', visual: 'Organiser interview. Behind-the-scenes preparation.', audio: 'Anticipation score.', vo: 'NARRATOR: "Every year, the most ambitious minds in Kenya come together — not just to network, but to build."' },
      { number: 2, title: 'The Experience', timecode: '0:40–2:00', visual: 'Past event highlights. Speaker moments. Networking footage.', audio: 'Builds to energy.', vo: 'NARRATOR: "The Nairobi Business Summit has become more than a conference. It\'s where careers change, deals close, and futures begin."' },
      { number: 3, title: 'Be There', timecode: '2:00–3:00', visual: 'Attendee testimonials. This year\'s teaser.', audio: 'Epic close.', vo: 'NARRATOR: "This March, be part of it."', onScreen: 'nairobisummit.co.ke | Get Tickets' },
    ],
    castNotes: 'HOST/NARRATOR: High-energy, confident Kenyan voice. Hype without being gimmicky.\nATTENDEES: Real people from past events if possible. Professional but excited.\nSPEAKERS: Feature actual speakers for credibility.',
    productionNotes: { recommendedStyle: 'High-Energy Promo Film', mood: 'Electric & Aspirational', colorDirection: 'Deep blacks with electric neon accents. Gold. Dramatic lighting.', musicDirection: 'Big beats, orchestral elements. Epic and modern.' },
  },

  retail: {
    title: 'Wear Your Story',
    logline: 'A style-forward visual story that turns a product into a statement.',
    synopsis: 'The film is not about the clothes — it\'s about the person wearing them. Confidence, identity, and the quiet power of looking exactly how you feel.',
    scenes30s: [
      { number: 1, title: 'The Mirror', timecode: '0:00–0:07', visual: 'CLOSE UP: Getting dressed. Hands buttoning. Shoes on. A final look in the mirror — satisfaction.', audio: 'Minimal, cool beat starts building.', vo: '"Getting dressed should feel like something."' },
      { number: 2, title: 'The Look', timecode: '0:07–0:18', visual: 'FASHION MONTAGE: Models in real Nairobi locations — CBD streets, rooftop, matatu, coffee shop. Confident, candid.', audio: 'Beat fully drops — Afro-fusion.', vo: '"New collection. 100% Kenyan-made. Ships nationwide."' },
      { number: 3, title: 'CTA', timecode: '0:18–0:30', visual: 'Website on phone. "Shop Now" button. New collection items rotating.', audio: 'Beat fades to a clean close.', vo: '"Shop the new collection now. Free delivery over KES 2,000."', onScreen: 'BRAND NAME | yourstore.co.ke | @yourstore' },
    ],
    scenes15s: [
      { number: 1, title: 'Style', timecode: '0:00–0:06', visual: 'Fast fashion montage. Real Nairobi locations.', audio: 'Afro-fusion drop.', vo: '"New collection. Kenyan-made. Ships nationwide."' },
      { number: 2, title: 'Shop', timecode: '0:06–0:12', visual: 'Products. Website. Mobile shopping.', audio: 'Music continues.', vo: '"Free delivery over KES 2,000."' },
      { number: 3, title: 'CTA', timecode: '0:12–0:15', visual: 'Brand logo. Social handles.', audio: 'Resolves.', vo: '"Shop now."', onScreen: 'yourstore.co.ke | @yourstore' },
    ],
    scenesDoco: [
      { number: 1, title: 'Made in Kenya', timecode: '0:00–0:40', visual: 'The production process. Tailors at work. Fabric sourcing.', audio: 'Textured, rhythmic score.', vo: 'NARRATOR: "Every piece tells a story — starting with the people who made it."' },
      { number: 2, title: 'The Wearers', timecode: '0:40–2:00', visual: 'Diverse customers in their everyday lives. Styling interviews.', audio: 'Warm, confident music.', vo: 'NARRATOR: "Fashion is not about what you wear. It\'s about who you become when you wear it."' },
      { number: 3, title: 'Shop Kenya', timecode: '2:00–3:00', visual: 'New collection showcase.', audio: 'Strong, forward-looking close.', vo: 'NARRATOR: "Buy Kenyan. Wear your story."', onScreen: 'yourstore.co.ke' },
    ],
    castNotes: 'MODELS: Diverse, real-looking Kenyans — not international model types. Confident and authentic.\nFASHION CREDITS: Show the tailors/makers if applicable.\nLOCATIONS: Real Nairobi — avoid generic studio-only looks.',
    productionNotes: { recommendedStyle: 'Fashion Film / Brand Documentary', mood: 'Confident & Culturally Proud', colorDirection: 'Bold, rich colours that reflect the collection. Warm African earth tones or vibrant contemporary palette.', musicDirection: 'Afro-fusion or contemporary Kenyan music. Confident and stylish.' },
  },

  general: {
    title: 'A Story Worth Telling',
    logline: 'A compelling visual narrative that positions your brand at the heart of your customer\'s world.',
    synopsis: `Every great brand has a story that was there before the logo — a reason it exists, a problem it solves, a life it improves.\n\nThis film finds that story and tells it with clarity and emotion. We follow a real person whose life is genuinely better because of what you do. We see the before. We feel the after.\n\nThe film ends not with a call to action, but with a feeling — the kind that makes people remember a brand long after they have scrolled past.`,
    scenes30s: [
      { number: 1, title: 'The Problem', timecode: '0:00–0:07', visual: 'Cinematic opening shot establishing the world of your customer. Their challenge or need, shown visually — not explained.', audio: 'Atmospheric. Minimal. Moody.', vo: '"There is a better way."' },
      { number: 2, title: 'The Brand', timecode: '0:07–0:18', visual: 'Your product or service in use. Real environment. Real people. The moment things get better.', audio: 'Music lifts — warm and confident.', vo: '"[Your Brand Name]. Built for [your customer]. Designed to [your key benefit]."' },
      { number: 3, title: 'The Result', timecode: '0:18–0:25', visual: 'MONTAGE: The outcome. Customers at their best. Satisfaction, relief, joy — whatever your brand delivers.', audio: 'Music reaches its peak.', vo: '"Trusted by thousands of Kenyans. Available now."' },
      { number: 4, title: 'CTA', timecode: '0:25–0:30', visual: 'Brand logo. Contact or website. Clean background.', audio: 'Music resolves to silence.', vo: '"Find us online or call us today."', onScreen: '[BRAND NAME] | [WEBSITE] | [PHONE NUMBER]' },
    ],
    scenes15s: [
      { number: 1, title: 'Hook', timecode: '0:00–0:05', visual: 'Strong opening visual establishing the problem or the brand world.', audio: 'Punchy atmospheric open.', vo: '"The [problem] stops here."' },
      { number: 2, title: 'Solution', timecode: '0:05–0:11', visual: 'Product/service in action. Real and confident.', audio: 'Music builds.', vo: '"[Brand Name]. [Key benefit in 8 words or less]."' },
      { number: 3, title: 'CTA', timecode: '0:11–0:15', visual: 'Logo. Contact.', audio: 'Resolves.', vo: '"Get started today."', onScreen: '[BRAND] | [CONTACT]' },
    ],
    scenesDoco: [
      { number: 1, title: 'Why We Started', timecode: '0:00–0:45', visual: 'Founder interview. Origin story. Problem being addressed.', audio: 'Personal, documentary score.', vo: 'NARRATOR: "Every business begins with a problem that someone refused to ignore."' },
      { number: 2, title: 'The Work', timecode: '0:45–2:00', visual: 'Behind the scenes. Product being made or service being delivered. Staff interviews.', audio: 'Warm, mid-section score.', vo: 'NARRATOR: "Behind every great brand is a team that shows up — every day — for the people they serve."' },
      { number: 3, title: 'The Impact', timecode: '2:00–3:00', visual: 'Customer success stories. Growth metrics. Looking forward.', audio: 'Hopeful close.', vo: 'NARRATOR: "This is not just a business. This is a commitment — to make things better."', onScreen: '[BRAND] | [WEBSITE]' },
    ],
    castNotes: 'Talent should reflect your actual customer. Avoid generic "stock photo" casting.\nNARRATOR: Voice should feel like your brand — professional, warm, and authentic.\nSEEK REAL CUSTOMERS wherever possible — they always outperform actors.',
    productionNotes: { recommendedStyle: 'Brand Film (style TBD with client)', mood: 'Authentic & Purposeful', colorDirection: 'To be defined based on brand identity and audience.', musicDirection: 'To be defined based on brand personality.' },
  },
}

export function generateConcept(input: string, format: ScriptFormat): GeneratedConcept {
  const industry = detectIndustry(input)
  const t = templates[industry]

  let scenes: ConceptScene[]
  if (format === 'commercial-15') scenes = t.scenes15s
  else if (format === 'documentary' || format === 'short-film') scenes = t.scenesDoco
  else scenes = t.scenes30s

  return {
    id: `concept-${Date.now()}`,
    title: t.title,
    format: formatLabel(format),
    duration: durationLabel(format),
    industry,
    logline: t.logline,
    synopsis: t.synopsis,
    scenes,
    castNotes: t.castNotes,
    productionNotes: t.productionNotes,
    generatedAt: new Date().toISOString(),
  }
}
