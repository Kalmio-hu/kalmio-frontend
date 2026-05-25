import mcpEn from './posts/talk-to-kalmio-from-claude-or-chatgpt.en.md?raw'
import mcpHu from './posts/talk-to-kalmio-from-claude-or-chatgpt.hu.md?raw'
import shoppingListEn from './posts/the-shopping-list-lands.en.md?raw'
import shoppingListHu from './posts/the-shopping-list-lands.hu.md?raw'
import eightyFourEn from './posts/eighty-four-kilograms.en.md?raw'
import eightyFourHu from './posts/eighty-four-kilograms.hu.md?raw'
import twoWeekCliffEn from './posts/the-two-week-cliff.en.md?raw'
import twoWeekCliffHu from './posts/the-two-week-cliff.hu.md?raw'
import eatHealthyEn from './posts/eating-healthy-shouldnt-require-a-spreadsheet.en.md?raw'
import eatHealthyHu from './posts/eating-healthy-shouldnt-require-a-spreadsheet.hu.md?raw'
import whatsComingEn from './posts/whats-coming-to-kalmio-2026.en.md?raw'
import whatsComingHu from './posts/whats-coming-to-kalmio-2026.hu.md?raw'
import whyFreeEn from './posts/why-kalmio-is-free.en.md?raw'
import whyFreeHu from './posts/why-kalmio-is-free.hu.md?raw'
import fridgeRitualEn from './posts/the-fridge-ritual.en.md?raw'
import fridgeRitualHu from './posts/the-fridge-ritual.hu.md?raw'
import gyrosEn from './posts/the-day-you-had-a-gyros.en.md?raw'
import gyrosHu from './posts/the-day-you-had-a-gyros.hu.md?raw'
import fozelekEn from './posts/fozelek-is-back.en.md?raw'
import fozelekHu from './posts/fozelek-is-back.hu.md?raw'
import originEn from './posts/where-kalmio-comes-from.en.md?raw'
import originHu from './posts/where-kalmio-comes-from.hu.md?raw'

export type BlogCategory = 'Roadmap' | 'Feature' | 'Nutrition' | 'News'

export interface BlogPost {
  slug: string
  date: string
  category: BlogCategory
  titleEn: string
  titleHu: string
  excerptEn: string
  excerptHu: string
  contentEn: string
  contentHu: string
  readingTimeMin: number
}

export const posts: BlogPost[] = [
  {
    slug: 'talk-to-kalmio-from-claude-or-chatgpt',
    date: '2026-05-17',
    category: 'Feature',
    titleEn: 'Talk to Kalmio from Claude or ChatGPT',
    titleHu: 'Kalmio Claude-ból és ChatGPT-ből',
    excerptEn:
      "Kalmio now has an MCP server (for Claude Desktop and other MCP clients) and a ChatGPT Custom GPT Actions spec. Eight tools, OAuth 2.0 / PKCE, free for everyone. The kitchen comes with you to wherever you already think out loud.",
    excerptHu:
      'A Kalmiónak mostantól MCP szervere (Claude Desktophoz és más MCP kliensekhez) és ChatGPT Custom GPT Actions speckje van. Nyolc tool, OAuth 2.0 / PKCE, mindenkinek ingyenesen. A konyha veled jön oda, ahol már most is hangosan gondolkozol.',
    readingTimeMin: 4,
    contentEn: mcpEn,
    contentHu: mcpHu,
  },
  {
    slug: 'the-shopping-list-lands',
    date: '2026-05-14',
    category: 'Feature',
    titleEn: 'The shopping list lands',
    titleHu: 'Megérkezik a bevásárlólista',
    excerptEn:
      "Three small things ordinary shopping lists don't do: subtract the fridge, group by aisle in the order a Hungarian shop is actually laid out, and round to real package sizes. Now live — in your hand, on Saturday morning.",
    excerptHu:
      'Három apróság, amit átlagos bevásárlólisták nem csinálnak: kivonják a hűtőt, a magyar bolt elrendezése szerint csoportosítanak, és valódi csomagméretre kerekítenek. Élesben — a kezedben, szombat reggel.',
    readingTimeMin: 4,
    contentEn: shoppingListEn,
    contentHu: shoppingListHu,
  },
  {
    slug: 'eighty-four-kilograms',
    date: '2026-05-09',
    category: 'Nutrition',
    titleEn: 'Eighty-four kilograms',
    titleHu: 'Nyolcvannégy kilogramm',
    excerptEn:
      "The new EEA report puts Hungarian household food waste at 84 kg per person, per year — a few kilos higher than what we'd been quoting. Why we're updating the number, what 2024's separate biowaste collection changed, and what the planner does with it.",
    excerptHu:
      'Az új EEA-jelentés 84 kg-ra teszi a magyar háztartási élelmiszer-hulladékot fejenként, évente — pár kilóval afölött, mint amit eddig idéztünk. Miért frissítjük a számot, mit változtatott a 2024-es szelektív biohulladékgyűjtés, és mit kezd ezzel a tervező.',
    readingTimeMin: 4,
    contentEn: eightyFourEn,
    contentHu: eightyFourHu,
  },
  {
    slug: 'the-two-week-cliff',
    date: '2026-05-05',
    category: 'News',
    titleEn: 'The two-week cliff',
    titleHu: 'A kétheti szakadék',
    excerptEn:
      'Roughly 70 percent of diet-app users quit within two weeks. The mainstream answer is streaks, push notifications, and stickier loops. We disagree. Reality is what breaks plans, and the replan diff exists for exactly that.',
    excerptHu:
      'A diéta-app felhasználók nagyjából 70 százaléka két héten belül kilép. A mainstream válasz: streakek, push-ok, ragacsosabb loopok. Nem értünk egyet. A valóság az, ami eltöri a terveket, és a replan diff pontosan emiatt létezik.',
    readingTimeMin: 4,
    contentEn: twoWeekCliffEn,
    contentHu: twoWeekCliffHu,
  },
  {
    slug: 'whats-coming-to-kalmio-2026',
    date: '2026-05-15',
    category: 'Roadmap',
    titleEn: "What's coming to Kalmio in 2026",
    titleHu: 'Mi jön a Kalmióba 2026-ban',
    excerptEn:
      'Calendar-anchored plans, the fridge grooming ritual, the "git diff" replan, a daily commander dashboard, auto-tracking without logging, and a Founding Member tier. Honest update on what works today and what ships next.',
    excerptHu:
      'Naptárhoz horgonyzott tervek, hűtő-rituálé, "git diff" replan, napi parancsnoki dashboard, automatikus kalória-követés naplózás nélkül, és egy Founding Member szint. Őszinte beszámoló arról, mi működik ma és mi jön legközelebb.',
    readingTimeMin: 5,
    contentEn: whatsComingEn,
    contentHu: whatsComingHu,
  },
  {
    slug: 'the-day-you-had-a-gyros',
    date: '2026-05-12',
    category: 'Feature',
    titleEn: 'The day you had a gyros',
    titleHu: 'Aznap, amikor gyros lett',
    excerptEn:
      'Most meal planners die at the first deviation. Kalmio absorbs the gyros, recomputes the rest of your week, and shows you what would change as a small narrative — accept or decline. Reality always wins.',
    excerptHu:
      'A legtöbb étrendtervező az első eltérésnél elhalálozik. A Kalmio felszívja a gyrost, újraszámolja a hét hátralévő részét, és kis narratívában mutatja meg, mi változna — elfogadod vagy elveted. A valóság mindig nyer.',
    readingTimeMin: 4,
    contentEn: gyrosEn,
    contentHu: gyrosHu,
  },
  {
    slug: 'the-fridge-ritual',
    date: '2026-05-08',
    category: 'Feature',
    titleEn: 'The fridge ritual',
    titleHu: 'A hűtő-rituálé',
    excerptEn:
      'Hungarian households throw out about 65 kg of food per person per year. Most meal planners ignore this. Kalmio walks you through your fridge in a 2–3 minute ritual before each new plan — quick, dignified, ending with one button.',
    excerptHu:
      'Egy magyar háztartás évente kb. 65 kg ételt dob ki fejenként. A legtöbb étrendtervező ezt figyelmen kívül hagyja. A Kalmio minden új terv előtt egy 2–3 perces rituáléban átvezet a hűtődön — gyors, méltóságteljes, és egyetlen gombbal végződik.',
    readingTimeMin: 4,
    contentEn: fridgeRitualEn,
    contentHu: fridgeRitualHu,
  },
  {
    slug: 'why-kalmio-is-free',
    date: '2026-05-02',
    category: 'News',
    titleEn: 'Why Kalmio is free (and stays that way)',
    titleHu: 'Miért ingyenes a Kalmio (és miért marad az)',
    excerptEn:
      'No trial, no hidden gate, no "free for the first plan." The core product stays free for everyone, forever. The story behind the partner-funded model, the deterministic-vs-agentic split for premium, and the Founding Member tier.',
    excerptHu:
      'Nincs próbaverzió, nincs rejtett fal, nincs "az első terv ingyenes". Az alapélmény mindenkinek ingyenes marad, örökre. A partner-finanszírozású modell története, a determinisztikus-vs-agentic választóvonal a prémiumhoz, és a Founding Member szint.',
    readingTimeMin: 4,
    contentEn: whyFreeEn,
    contentHu: whyFreeHu,
  },
  {
    slug: 'eating-healthy-shouldnt-require-a-spreadsheet',
    date: '2026-04-22',
    category: 'Nutrition',
    titleEn: "Eating healthy shouldn't require a spreadsheet",
    titleHu: 'Az egészséges étkezéshez nem kell táblázat',
    excerptEn:
      'Most nutrition apps ask you to prove you ate something. Kalmio asks the opposite: tell us only when you didn\'t. The plan is the food log — eat what\'s in it and your day is tracked, silently and automatically.',
    excerptHu:
      'A legtöbb táplálkozási app azt kéri, hogy bizonyítsd, megettél valamit. A Kalmio az ellenkezőjét: csak akkor szólj, ha nem. A terv maga a kalória-napló — megeszed, ami benne van, a napod magától, csendben le van könyvelve.',
    readingTimeMin: 3,
    contentEn: eatHealthyEn,
    contentHu: eatHealthyHu,
  },
  {
    slug: 'fozelek-is-back',
    date: '2026-04-12',
    category: 'Nutrition',
    titleEn: 'Főzelék is back',
    titleHu: 'A főzelék visszatér',
    excerptEn:
      'A wellness industry that forgot to look in its own pantry, an ideal one-pot meal hiding in plain sight, and eight recipes joining the library — with respect for the people who do this dish justice for a living.',
    excerptHu:
      'Egy wellness-ipar, ami elfelejtett a saját kamrájába nézni, egy szinte tökéletes egyfazékos étel, ami nyíltan rejtőzik, és nyolc recept, ami érkezik a könyvtárba — tisztelettel azok felé, akik ezt az ételt kenyérkeresetből csinálják méltó módon.',
    readingTimeMin: 4,
    contentEn: fozelekEn,
    contentHu: fozelekHu,
  },
  {
    slug: 'where-kalmio-comes-from',
    date: '2026-04-01',
    category: 'News',
    titleEn: 'Where Kalmio comes from',
    titleHu: 'Honnan jön a Kalmio',
    excerptEn:
      'The 1972 North Karelia project cut Finnish heart disease by 80% in a generation — not by treating individuals, but by changing cultural defaults. Hungary today has the cardiovascular profile Finland had then. That\'s why we\'re here.',
    excerptHu:
      'Az 1972-es Észak-Karélia projekt egy generáció alatt 80%-kal csökkentette a finn szívbetegséget — nem egyéni kezeléssel, hanem a kulturális alapértelmezettek átállításával. Magyarország ma azzal a profillal él, amilyennel Finnország akkor. Ezért vagyunk itt.',
    readingTimeMin: 5,
    contentEn: originEn,
    contentHu: originHu,
  },
]

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug)
}

export function getLatestPosts(n = 2): BlogPost[] {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, n)
}

/**
 * Posts surfaced on the public landing page.
 *
 * Maria persona QA (2026-05-25) found that "Feature" posts about the
 * MCP server / OAuth / ChatGPT integration push tech jargon at the
 * day-1 acquisition audience (a 58-year-old Hungarian teacher), eroding
 * trust before she even reads the headline. The landing should only
 * surface posts that speak to the target user's life — Nutrition tips,
 * Roadmap, News — not engineering announcements. The full set is still
 * reachable at /blog.
 */
const LANDING_HIDDEN_SLUGS = new Set<string>([
  'talk-to-kalmio-from-claude-or-chatgpt',
])

export function getLatestPostsForLanding(n = 2): BlogPost[] {
  return [...posts]
    .filter((p) => !LANDING_HIDDEN_SLUGS.has(p.slug))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, n)
}
