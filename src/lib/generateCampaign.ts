import { CampaignFormData, GeneratedContent } from '../types'

export function generateCampaignContent(formData: CampaignFormData): GeneratedContent {
  const { business_name, industry, product_name, objective, target_audience, location, offer, tone, platforms, cta } = formData

  const toneMap: Record<string, string> = {
    Professional: 'authoritative and trust-driven',
    Friendly: 'warm and conversational',
    Bold: 'direct and confident',
    Luxury: 'elegant and aspirational',
    Youthful: 'energetic and relatable',
    Emotional: 'story-driven and heartfelt',
    'Direct sales': 'urgent and offer-focused',
  }

  const toneDesc = toneMap[tone] || 'professional'

  const industryObjectiveMap: Record<string, string> = {
    'Real Estate': `finding the right property`,
    'Hospitality': `an unforgettable experience`,
    'Education': `quality learning outcomes`,
    'Fintech': `financial freedom and growth`,
    'Restaurant': `great food and great value`,
    'Travel': `seamless travel experiences`,
    'Retail': `premium products at great prices`,
    'Health': `better health outcomes`,
    'Events': `memorable moments`,
    'Professional Services': `expert solutions`,
  }

  const industryAngle = industryObjectiveMap[industry] || `achieving their goals`

  return {
    strategy: {
      angle: `Position ${business_name} as the trusted solution for ${target_audience} in ${location} who are looking for ${industryAngle}. Lead with the offer, build on trust, and drive action through ${cta.toLowerCase()}.`,
      painPoint: `Your target audience — ${target_audience} — is currently dealing with limited options, unclear value, or high costs in the ${industry.toLowerCase()} space. ${business_name} solves this directly.`,
      keyMessage: `${product_name} gives ${target_audience} in ${location} exactly what they need: ${offer}. No confusion. No delays. Just results.`,
      platforms: platforms,
      cta: cta,
    },
    videoScript: {
      hook: `[OPEN ON SCREEN TEXT]: "${target_audience} in ${location} — are you still settling for less?" | Cut to confident presenter or b-roll of ${industry.toLowerCase()} setting.`,
      scene1: `"At ${business_name}, we understand the challenges facing ${target_audience} today. That's why we created ${product_name} — built specifically to deliver ${offer}."`,
      scene2: `[Show product/service in action] "Whether you're just starting out or looking to grow, ${product_name} gives you the edge you need. Trusted by clients across ${location}, it's proven to work."`,
      scene3: `[Testimonial or results shot] "Our clients have seen real results — more enquiries, faster decisions, and stronger outcomes. This is what ${toneDesc} service looks like."`,
      callToAction: `"Ready to experience it for yourself? ${cta} today. ${offer}. Limited availability — don't wait." | End card: ${business_name} logo + contact`,
      visualDirection: `Use clean ${tone.toLowerCase()} visuals. Avoid clutter. Stick to brand colors. Show real people or real locations in ${location}. Text overlays should be bold, minimal, and easy to read. No stock photo clichés.`,
    },
    posterCopy: {
      headline: `${product_name}: Built for ${target_audience} in ${location}`,
      subheadline: `${offer} — Available Now from ${business_name}`,
      offerText: `🎯 ${offer}\n📍 Serving ${location}\n✅ Trusted by ${target_audience}`,
      cta: `${cta} — Contact ${business_name} Today`,
      designDirection: `Clean layout on white or off-white background. Use ${tone.toLowerCase()} typography — bold headline, clean subtext. Brand colors for accents. No gradients. Add subtle border or shadow to card. Logo top-left, CTA bottom-center. Keep whitespace generous.`,
    },
    captions: {
      facebook: `📣 Attention ${target_audience} in ${location}!\n\n${business_name} is proud to offer ${product_name} — and the deal is clear:\n\n${offer}\n\nWe've designed this specifically for people like you who want results without the runaround.\n\n✅ ${offer}\n📍 ${location}\n🎯 Built for ${target_audience}\n\n${cta} today. Reach us now. ⬇️\n\n#${business_name.replace(/\s/g, '')} #${industry.replace(/\s/g, '')} #${location.replace(/\s/g, '')} #SmallBusiness #${product_name.replace(/\s/g, '')}`,
      instagram: `${product_name} is here. And it's exactly what ${target_audience} in ${location} have been waiting for. 🔥\n\n${offer}\n\nThis is ${business_name} doing what we do best — delivering real value, no fluff.\n\n${cta} → Link in bio\n\n#${business_name.replace(/\s/g, '')} #${industry.replace(/\s/g, '')} #${product_name.replace(/\s/g, '')} #${location.replace(/\s/g, '')} #BusinessGrowth`,
      tiktok: `POV: You finally found what you were looking for 👀\n\n${business_name} just launched ${product_name} and honestly? ${offer}.\n\nIf you're a ${target_audience.toLowerCase()} in ${location} — you need to see this.\n\n${cta} right now. Comment below or DM us! 🙌\n\n#${industry.replace(/\s/g, '')} #${location.replace(/\s/g, '')} #fyp #smallbusiness #${product_name.replace(/\s/g, '')}`,
      linkedin: `${business_name} is pleased to announce the launch of ${product_name}, designed specifically for ${target_audience} in ${location}.\n\nWe recognized a clear gap in the ${industry.toLowerCase()} sector: ${target_audience} needed a solution that delivers ${offer} — reliably, efficiently, and without compromise.\n\nThat's exactly what ${product_name} provides.\n\nIf your business is ready to move forward, we'd love to connect.\n\n${cta} | ${business_name}\n\n#${industry.replace(/\s/g, '')} #BusinessGrowth #${location.replace(/\s/g, '')} #B2B`,
    },
    whatsapp: {
      status: `✨ ${product_name} is NOW available!\n${offer}\nOnly from ${business_name} 📍${location}\n${cta} today ⬇️`,
      broadcast: `Hello 👋\n\nWe have something exciting for you.\n\n${business_name} is offering *${product_name}* — and here's what you get:\n\n✅ ${offer}\n📍 Available in ${location}\n🎯 Designed for ${target_audience}\n\nThis offer is available for a limited time.\n\nTo take advantage, simply reply to this message or contact us directly.\n\n*${cta}* — we're ready when you are.\n\nWarm regards,\n${business_name} Team`,
      reply: `Hi! Thanks for reaching out to ${business_name} 😊\n\nYes, *${product_name}* is available and here are the details:\n\n📌 *Offer:* ${offer}\n📍 *Location:* ${location}\n🎯 *Who it's for:* ${target_audience}\n\nTo proceed, kindly ${cta.toLowerCase()}. We'll take it from there.\n\nFeel free to ask any questions — we're happy to help!`,
    },
    landingPage: {
      headline: `${product_name}: The Smarter Choice for ${target_audience} in ${location}`,
      subheadline: `${business_name} helps ${target_audience} access ${offer} — without the delays, confusion, or overpriced alternatives.`,
      benefits: [
        `Specifically designed for ${target_audience} in ${location}`,
        `Clear offer: ${offer}`,
        `Delivered by ${business_name} — a trusted name in ${industry.toLowerCase()}`,
        `Fast, reliable, and built around your needs`,
        `No long processes or unnecessary complexity`,
        `Get started today with a simple ${cta.toLowerCase()}`,
      ],
      cta: `${cta} — Contact ${business_name} Now`,
      faqs: [
        {
          question: `Who is ${product_name} designed for?`,
          answer: `${product_name} is built specifically for ${target_audience} in ${location} who want ${offer} without the hassle.`,
        },
        {
          question: `What do I get exactly?`,
          answer: `You get: ${offer}. Everything is clearly structured and delivered by ${business_name} with full support.`,
        },
        {
          question: `How do I get started?`,
          answer: `Simply ${cta.toLowerCase()}. Our team at ${business_name} will guide you through the next steps immediately.`,
        },
        {
          question: `Is this available in ${location}?`,
          answer: `Yes. ${business_name} currently serves clients in ${location} and surrounding areas. Reach out and we'll confirm availability for your specific location.`,
        },
      ],
    },
  }
}
