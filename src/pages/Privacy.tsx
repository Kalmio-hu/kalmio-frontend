import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

function PrivacyHu() {
  return (
    <div className="prose prose-sm max-w-none text-[#1A1A1A]/80">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Adatkezelési tájékoztató</h1>
      <p className="text-sm text-[#1A1A1A]/50 mb-8">Hatályos: 2026. január 1-től</p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">1. Az adatkezelő azonosítása</h2>
      <p>
        <strong>Cégnév:</strong> Hard Rock Coders Kereskedelmi és Szolgáltató Korlátolt Felelősségű Társaság<br />
        <strong>Rövidített név:</strong> Hard Rock Coders Kft.<br />
        <strong>Cégjegyzékszám:</strong> 01-09-353818<br />
        <strong>Székhely:</strong> 1163 Budapest, Veres Péter út 51.<br />
        <strong>Adószám:</strong> 27320507-2-42<br />
        <strong>Ügyvezető:</strong> Siegl Zoltán Balázs<br />
        <strong>Adatvédelmi kapcsolat:</strong>{' '}
        <a href="mailto:privacy@kalmio.hu" className="text-[#F28C28] hover:underline">privacy@kalmio.hu</a>
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">2. Az adatkezelés célja és jogalapja</h2>
      <p>
        A Kalmio egy étrendtervező és táplálkozási alkalmazás. A személyes adatokat az alábbi célokból és jogalapok szerint kezeljük:
      </p>
      <ul className="list-disc pl-6 space-y-2 mt-3">
        <li>
          <strong>Felhasználói fiók kezelése</strong> — az érintett hozzájárulása alapján (GDPR 6. cikk (1) bekezdés a) pont), illetve a szerződés teljesítése érdekében (GDPR 6. cikk (1) bekezdés b) pont).
        </li>
        <li>
          <strong>Személyre szabott étrendtervezés</strong> — az érintett kifejezett hozzájárulása alapján (GDPR 9. cikk (2) bekezdés a) pont), tekintettel arra, hogy egészségügyi jellegű adatokat (étkezési korlátozások, allergiák) is kezelünk.
        </li>
        <li>
          <strong>Analitika és termékfejlesztés</strong> — az érintett hozzájárulása alapján (GDPR 6. cikk (1) bekezdés a) pont), kizárólag az analitikai sütikhez való hozzájárulás esetén.
        </li>
        <li>
          <strong>Jogi kötelezettségek teljesítése</strong> — GDPR 6. cikk (1) bekezdés c) pont.
        </li>
      </ul>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">3. Kezelt személyes adatok köre</h2>
      <p>A fiók regisztrációja és az alkalmazás használata során az alábbi adatokat kezeljük:</p>
      <ul className="list-disc pl-6 space-y-2 mt-3">
        <li><strong>Azonosítási adatok:</strong> e-mail cím, felhasználónév, profilkép (feltöltés esetén).</li>
        <li><strong>Étkezési preferenciák:</strong> napi kalória cél, étkezések száma, vásárlási ciklus, étrendi korlátozások (pl. vegetáriánus, gluténmentes, allergiák).</li>
        <li><strong>Hűtő- és kamratartalmak:</strong> az érintett által manuálisan megadott hozzávalók, mennyiségek, lejárati dátumok.</li>
        <li><strong>Generált és elmentett étrendek:</strong> az alkalmazás által javasolt, illetve a felhasználó által elfogadott heti étrendek, étkezési tervek.</li>
        <li><strong>Fogyasztott ételek:</strong> az érintett által manuálisan naplózott étkezések és tápanyagadatok.</li>
        <li><strong>Technikai adatok:</strong> IP-cím, böngésző típusa, eszközinformáció — kizárólag az analitika hozzájárulása esetén, pszeudoanonimizált formában.</li>
      </ul>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">4. Adatmegőrzési idő</h2>
      <p>
        A személyes adatokat a felhasználói fiók aktív fennállása alatt kezeljük. A fiók törlésekor az összes személyes adat törlésre kerül, a jogszabályban előírt kötelező megőrzési kötelezettségek alá eső adatok kivételével.
      </p>
      <p className="mt-3">
        Inaktív fiókok esetén — ahol a felhasználó 2 éve nem jelentkezett be — az adatokat előzetes e-mailes értesítést követően töröljük, kivéve, ha a felhasználó az értesítés kézhezvételétől számított 30 napon belül bejelentkezik.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">5. Adatfeldolgozók</h2>
      <p>Az adatkezelő az alábbi adatfeldolgozókat veszi igénybe:</p>
      <ul className="list-disc pl-6 space-y-3 mt-3">
        <li>
          <strong>Supabase Inc.</strong> (hitelesítési szolgáltató) — Kizárólag a felhasználói azonosítás (bejelentkezés, munkamenet-kezelés) céljából. Adatközpont: EU (Frankfurt). Részletek: <a href="https://supabase.com/privacy" className="text-[#F28C28] hover:underline" target="_blank" rel="noopener noreferrer">supabase.com/privacy</a>.
        </li>
        <li>
          <strong>Microsoft Azure</strong> (elsődleges adatbázis és fájltárolás) — Az összes alkalmazásadat (receptek, étrendek, hűtőtartalmak, profiladatok) tárolása. Adatközpont: West Europe (Hollandia). Részletek: <a href="https://privacy.microsoft.com" className="text-[#F28C28] hover:underline" target="_blank" rel="noopener noreferrer">privacy.microsoft.com</a>.
        </li>
        <li>
          <strong>PostHog Inc.</strong> (analitika) — Kizárólag az analitikai sütikhez való hozzájárulás esetén. PII-mentes, pszeudoanonimizált eseményadatokat gyűjtünk a termékfejlesztés céljából. Adatközpont: EU. Részletek: <a href="https://posthog.com/privacy" className="text-[#F28C28] hover:underline" target="_blank" rel="noopener noreferrer">posthog.com/privacy</a>.
        </li>
        <li>
          <strong>Barion Payment Zrt.</strong> (fizetési szolgáltató) — A bankkártyás és Barion-tárcás fizetések lebonyolítása, valamint csalásmegelőzés (Barion Pixel) céljából. A fizetéshez és a csalásmegelőzéshez szükséges adatokat (pl. e-mail, fizetési és tranzakciós adatok, böngészési események) közvetlenül a Barion kezeli; a teljes bankkártyaszámhoz a Kalmio nem fér hozzá. A Barion Payment Zrt. a Magyar Nemzeti Bank felügyelete alatt áll (engedélyszám: H-EN-I-1064/2013). Adatközpont: EU (Magyarország). Részletek: <a href="https://www.barion.com/hu/adatvedelmi-tajekoztato/" className="text-[#F28C28] hover:underline" target="_blank" rel="noopener noreferrer">barion.com/hu/adatvedelmi-tajekoztato</a>.
        </li>
      </ul>
      <p className="mt-3">
        Az általunk igénybe vett adatfeldolgozók GDPR 28. cikknek megfelelő adatfeldolgozói feltételeket tesznek közzé (pl. Supabase DPA, Microsoft Online Services Terms, PostHog DPA). Az adatfeldolgozók önállóan nem jogosultak az adatokat kezelni.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">6. Sütik (cookie-k)</h2>
      <p>A Kalmio az alábbi sütiket alkalmazza:</p>
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#1A1A1A]/5">
              <th className="text-left px-3 py-2 border border-[#1A1A1A]/10 font-semibold">Süti neve</th>
              <th className="text-left px-3 py-2 border border-[#1A1A1A]/10 font-semibold">Kategória</th>
              <th className="text-left px-3 py-2 border border-[#1A1A1A]/10 font-semibold">Megőrzési idő</th>
              <th className="text-left px-3 py-2 border border-[#1A1A1A]/10 font-semibold">Cél</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-2 border border-[#1A1A1A]/10 font-mono text-xs">kalmio-lang</td>
              <td className="px-3 py-2 border border-[#1A1A1A]/10">Szükséges</td>
              <td className="px-3 py-2 border border-[#1A1A1A]/10">1 év</td>
              <td className="px-3 py-2 border border-[#1A1A1A]/10">Nyelvi beállítás megőrzése</td>
            </tr>
            <tr>
              <td className="px-3 py-2 border border-[#1A1A1A]/10 font-mono text-xs">kalmio-analytics-consent</td>
              <td className="px-3 py-2 border border-[#1A1A1A]/10">Szükséges</td>
              <td className="px-3 py-2 border border-[#1A1A1A]/10">visszavonásig</td>
              <td className="px-3 py-2 border border-[#1A1A1A]/10">Analitikai hozzájárulás állapota</td>
            </tr>
            <tr>
              <td className="px-3 py-2 border border-[#1A1A1A]/10 font-mono text-xs">ph_*</td>
              <td className="px-3 py-2 border border-[#1A1A1A]/10">Analitika (hozzájárulás alapján)</td>
              <td className="px-3 py-2 border border-[#1A1A1A]/10">1 év</td>
              <td className="px-3 py-2 border border-[#1A1A1A]/10">PostHog munkamenet-azonosító (pszeudoanonimizált)</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm">
        A sütibeállítások bármikor módosíthatók az oldal láblécében található „Sütibeállítások" linkkel.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">7. Az érintett jogai</h2>
      <p>A GDPR 15–22. cikke alapján az érintett az alábbi jogokat gyakorolhatja:</p>
      <ul className="list-disc pl-6 space-y-2 mt-3">
        <li><strong>Hozzáférési jog (15. cikk):</strong> tájékoztatást kérhet arról, hogy milyen adatait kezeljük, és másolatot kérhet azokról.</li>
        <li><strong>Helyesbítési jog (16. cikk):</strong> kérheti a pontatlan adatok kijavítását, a hiányos adatok kiegészítését.</li>
        <li><strong>Törléshez való jog / „elfeledtetés joga" (17. cikk):</strong> kérheti adatai törlését, ha az adatkezelés jogalapja megszűnt vagy visszavonta hozzájárulását.</li>
        <li><strong>Adathordozhatósághoz való jog (20. cikk):</strong> kérheti adatait géppel olvasható formátumban, vagy azok közvetlen továbbítását másik adatkezelőhöz.</li>
        <li><strong>Tiltakozáshoz való jog (21. cikk):</strong> tiltakozhat adatainak jogos érdeken alapuló kezelése ellen.</li>
        <li><strong>Az adatkezelés korlátozásához való jog (18. cikk):</strong> kérheti az adatkezelés felfüggesztését, pl. pontosság vitatása esetén.</li>
      </ul>
      <p className="mt-3">
        Kérelmeit a <a href="mailto:privacy@kalmio.hu" className="text-[#F28C28] hover:underline">privacy@kalmio.hu</a> e-mail-címre küldheti. A kérelemre 30 napon belül válaszolunk.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">8. Jogorvoslat</h2>
      <p>
        Ha úgy véli, hogy adatait jogellenesen kezeljük, panaszt tehet a Nemzeti Adatvédelmi és Információszabadság Hatóságnál:
      </p>
      <p className="mt-3">
        <strong>Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)</strong><br />
        Cím: 1055 Budapest, Falk Miksa u. 9–11.<br />
        E-mail: <a href="mailto:ugyfelszolgalat@naih.hu" className="text-[#F28C28] hover:underline">ugyfelszolgalat@naih.hu</a><br />
        Weboldal: <a href="https://www.naih.hu" className="text-[#F28C28] hover:underline" target="_blank" rel="noopener noreferrer">naih.hu</a>
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">9. Adatvédelmi kapcsolat</h2>
      <p>
        Adatvédelemmel kapcsolatos kérdéseivel forduljon hozzánk:<br />
        <a href="mailto:privacy@kalmio.hu" className="text-[#F28C28] hover:underline">privacy@kalmio.hu</a>
      </p>
      <p className="mt-3 text-sm text-[#1A1A1A]/50">
        Ez a tájékoztató legutóbb 2026. január 1-jén frissült. A változásokról az aktív felhasználókat e-mailben értesítjük.
      </p>
    </div>
  )
}

function PrivacyEn() {
  return (
    <div className="prose prose-sm max-w-none text-[#1A1A1A]/80">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Privacy Notice</h1>
      <p className="text-sm text-[#1A1A1A]/50 mb-8">Effective: 1 January 2026</p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">1. Data Controller</h2>
      <p>
        <strong>Company name:</strong> Hard Rock Coders Kereskedelmi és Szolgáltató Korlátolt Felelősségű Társaság<br />
        <strong>Short name:</strong> Hard Rock Coders Kft.<br />
        <strong>Company registration:</strong> 01-09-353818<br />
        <strong>Registered address:</strong> 1163 Budapest, Veres Péter út 51., Hungary<br />
        <strong>Tax number:</strong> 27320507-2-42<br />
        <strong>Managing director:</strong> Zoltán Balázs Siegl<br />
        <strong>Privacy contact:</strong>{' '}
        <a href="mailto:privacy@kalmio.hu" className="text-[#F28C28] hover:underline">privacy@kalmio.hu</a>
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">2. Purpose and Legal Basis of Processing</h2>
      <p>
        Kalmio is a meal planning and nutrition application. We process personal data for the following purposes and on the following legal bases:
      </p>
      <ul className="list-disc pl-6 space-y-2 mt-3">
        <li>
          <strong>User account management</strong> — consent (GDPR Art. 6(1)(a)) and performance of a contract (GDPR Art. 6(1)(b)).
        </li>
        <li>
          <strong>Personalised meal planning</strong> — explicit consent (GDPR Art. 9(2)(a)), given that we process health-related data (dietary restrictions, allergies).
        </li>
        <li>
          <strong>Analytics and product improvement</strong> — consent (GDPR Art. 6(1)(a)), only where the user has accepted analytics cookies.
        </li>
        <li>
          <strong>Compliance with legal obligations</strong> — GDPR Art. 6(1)(c).
        </li>
      </ul>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">3. Categories of Personal Data Processed</h2>
      <p>During registration and use of the application, we process the following data:</p>
      <ul className="list-disc pl-6 space-y-2 mt-3">
        <li><strong>Identity data:</strong> email address, username, profile photo (if uploaded).</li>
        <li><strong>Dietary preferences:</strong> daily calorie target, number of meals, shopping cadence, dietary restrictions (e.g. vegetarian, gluten-free, allergies).</li>
        <li><strong>Fridge and pantry contents:</strong> ingredients, quantities and expiry dates entered manually by the user.</li>
        <li><strong>Meal plans:</strong> generated and saved weekly plans, meal schedules.</li>
        <li><strong>Logged meals:</strong> meals and nutritional data manually logged by the user.</li>
        <li><strong>Technical data:</strong> IP address, browser type, device information — only with analytics consent, in pseudonymised form.</li>
      </ul>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">4. Retention Period</h2>
      <p>
        Personal data are retained for the duration of the active user account. Upon account deletion, all personal data are erased, except where retention is required by law.
      </p>
      <p className="mt-3">
        For inactive accounts — where the user has not logged in for 2 years — we will delete the data after sending prior email notice, unless the user logs in within 30 days of receiving that notice.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">5. Data Processors</h2>
      <p>The data controller engages the following processors:</p>
      <ul className="list-disc pl-6 space-y-3 mt-3">
        <li>
          <strong>Supabase Inc.</strong> (authentication provider) — Solely for user authentication (sign-in, session management). Data centre: EU (Frankfurt). Details: <a href="https://supabase.com/privacy" className="text-[#F28C28] hover:underline" target="_blank" rel="noopener noreferrer">supabase.com/privacy</a>.
        </li>
        <li>
          <strong>Microsoft Azure</strong> (primary database and file storage) — All application data (recipes, meal plans, fridge contents, profile data). Data centre: West Europe (Netherlands). Details: <a href="https://privacy.microsoft.com" className="text-[#F28C28] hover:underline" target="_blank" rel="noopener noreferrer">privacy.microsoft.com</a>.
        </li>
        <li>
          <strong>PostHog Inc.</strong> (analytics) — Only where the user has consented to analytics cookies. We collect pseudonymised, PII-free event data for product improvement. Data centre: EU. Details: <a href="https://posthog.com/privacy" className="text-[#F28C28] hover:underline" target="_blank" rel="noopener noreferrer">posthog.com/privacy</a>.
        </li>
        <li>
          <strong>Barion Payment Zrt.</strong> (payment provider) — For processing card and Barion-wallet payments and for fraud prevention (Barion Pixel). The data needed for payment and fraud prevention (e.g. email, payment and transaction data, browsing events) is handled directly by Barion; Kalmio never has access to the full card number. Barion Payment Zrt. is supervised by the National Bank of Hungary (licence number H-EN-I-1064/2013). Data centre: EU (Hungary). Details: <a href="https://www.barion.com/en/privacy-policy/" className="text-[#F28C28] hover:underline" target="_blank" rel="noopener noreferrer">barion.com/en/privacy-policy</a>.
        </li>
      </ul>
      <p className="mt-3">
        Each processor publishes GDPR Art. 28-compliant data processing terms (e.g. Supabase DPA, Microsoft Online Services Terms, PostHog DPA). Processors may not process data for their own purposes.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">6. Cookies</h2>
      <p>Kalmio uses the following cookies:</p>
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#1A1A1A]/5">
              <th className="text-left px-3 py-2 border border-[#1A1A1A]/10 font-semibold">Cookie name</th>
              <th className="text-left px-3 py-2 border border-[#1A1A1A]/10 font-semibold">Category</th>
              <th className="text-left px-3 py-2 border border-[#1A1A1A]/10 font-semibold">Retention</th>
              <th className="text-left px-3 py-2 border border-[#1A1A1A]/10 font-semibold">Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-2 border border-[#1A1A1A]/10 font-mono text-xs">kalmio-lang</td>
              <td className="px-3 py-2 border border-[#1A1A1A]/10">Necessary</td>
              <td className="px-3 py-2 border border-[#1A1A1A]/10">1 year</td>
              <td className="px-3 py-2 border border-[#1A1A1A]/10">Remembers language preference</td>
            </tr>
            <tr>
              <td className="px-3 py-2 border border-[#1A1A1A]/10 font-mono text-xs">kalmio-analytics-consent</td>
              <td className="px-3 py-2 border border-[#1A1A1A]/10">Necessary</td>
              <td className="px-3 py-2 border border-[#1A1A1A]/10">Until revoked</td>
              <td className="px-3 py-2 border border-[#1A1A1A]/10">Stores analytics consent decision</td>
            </tr>
            <tr>
              <td className="px-3 py-2 border border-[#1A1A1A]/10 font-mono text-xs">ph_*</td>
              <td className="px-3 py-2 border border-[#1A1A1A]/10">Analytics (consent-gated)</td>
              <td className="px-3 py-2 border border-[#1A1A1A]/10">1 year</td>
              <td className="px-3 py-2 border border-[#1A1A1A]/10">PostHog session identifier (pseudonymised)</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm">
        Cookie preferences can be changed at any time via the "Cookie settings" link in the page footer.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">7. Your Rights</h2>
      <p>Under GDPR Articles 15–22 you have the following rights:</p>
      <ul className="list-disc pl-6 space-y-2 mt-3">
        <li><strong>Right of access (Art. 15):</strong> you may request information about what data we hold and obtain a copy.</li>
        <li><strong>Right to rectification (Art. 16):</strong> you may request correction of inaccurate data or completion of incomplete data.</li>
        <li><strong>Right to erasure / right to be forgotten (Art. 17):</strong> you may request deletion where the legal basis has ceased or you withdraw consent.</li>
        <li><strong>Right to data portability (Art. 20):</strong> you may request your data in machine-readable format or direct transfer to another controller.</li>
        <li><strong>Right to object (Art. 21):</strong> you may object to processing based on legitimate interests.</li>
        <li><strong>Right to restriction (Art. 18):</strong> you may request suspension of processing, e.g. while accuracy is disputed.</li>
      </ul>
      <p className="mt-3">
        Send requests to <a href="mailto:privacy@kalmio.hu" className="text-[#F28C28] hover:underline">privacy@kalmio.hu</a>. We will respond within 30 days.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">8. Right to Lodge a Complaint</h2>
      <p>
        If you believe your data are being processed unlawfully, you may lodge a complaint with the Hungarian supervisory authority:
      </p>
      <p className="mt-3">
        <strong>Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)</strong><br />
        Address: 1055 Budapest, Falk Miksa u. 9–11., Hungary<br />
        Email: <a href="mailto:ugyfelszolgalat@naih.hu" className="text-[#F28C28] hover:underline">ugyfelszolgalat@naih.hu</a><br />
        Website: <a href="https://www.naih.hu" className="text-[#F28C28] hover:underline" target="_blank" rel="noopener noreferrer">naih.hu</a>
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">9. Privacy Contact</h2>
      <p>
        For any privacy-related questions, please contact us at:<br />
        <a href="mailto:privacy@kalmio.hu" className="text-[#F28C28] hover:underline">privacy@kalmio.hu</a>
      </p>
      <p className="mt-3 text-sm text-[#1A1A1A]/50">
        This notice was last updated on 1 January 2026. Active users will be notified by email of material changes.
      </p>
    </div>
  )
}

export function Privacy() {
  const { i18n } = useTranslation()
  const isHu = i18n.language?.startsWith('hu') ?? true

  return (
    <div className="min-h-screen bg-[#F9F7F2]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#F9F7F2]/90 backdrop-blur border-b border-[#1A1A1A]/8">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="font-bold text-[#1A1A1A] text-lg tracking-tight hover:opacity-70 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2 rounded"
          >
            Kalmio
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 sm:px-8 py-10 pb-16">
        {isHu ? <PrivacyHu /> : <PrivacyEn />}
      </main>
    </div>
  )
}
