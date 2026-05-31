import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

function TermsHu() {
  return (
    <div className="prose prose-sm max-w-none text-[#1A1A1A]/80">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Felhasználási feltételek</h1>
      <p className="text-sm text-[#1A1A1A]/50 mb-8">Hatályos: 2026. január 1-től</p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">1. A szolgáltatás leírása</h2>
      <p>
        A Kalmio (<a href="https://kalmio.hu" className="text-[#F28C28] hover:underline">kalmio.hu</a>) egy személyre szabott étrendtervező és táplálkozási alkalmazás. A platform lehetővé teszi heti étrendek automatikus generálását, bevásárlólista összeállítását, hűtő- és kamratartalmak nyilvántartását, valamint a napi táplálkozás nyomon követését.
      </p>
      <p className="mt-3">
        A szolgáltatást a <strong>Hard Rock Coders Kereskedelmi és Szolgáltató Korlátolt Felelősségű Társaság</strong> (cégjegyzékszám: 01-09-353818, adószám: 27320507-2-42, székhely: 1163 Budapest, Veres Péter út 51., telefon: +36 30 828 5151, e-mail: privacy@kalmio.hu) üzemelteti.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">2. A szolgáltatás igénybevételének feltételei</h2>
      <p>A Kalmio használatához az alábbi feltételek szükségesek:</p>
      <ul className="list-disc pl-6 space-y-2 mt-3">
        <li>A felhasználónak legalább 16 évesnek kell lennie. 16 év alatti felhasználók csak törvényes képviselőjük hozzájárulásával regisztrálhatnak.</li>
        <li>A felhasználó elfogadja a jelen felhasználási feltételeket és az <Link to="/privacy" className="text-[#F28C28] hover:underline">adatkezelési tájékoztatót</Link>.</li>
        <li>A szolgáltatás jelenleg béta fázisban érhető el. Egyes funkciók módosulhatnak vagy megszűnhetnek.</li>
      </ul>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">3. Felhasználói fiók</h2>
      <p>
        A regisztrációhoz érvényes e-mail cím megadása szükséges. A felhasználó felelős fiókja biztonságáért, és köteles haladéktalanul értesíteni a Hard Rock Coders Kft.-t, ha jogosulatlan hozzáférést észlel.
      </p>
      <p className="mt-3">
        Egy természetes személynek csak egy fiókja lehet. Fiókok átruházása, eladása vagy bérbeadása tilos.
      </p>
      <p className="mt-3">
        A fiók bármikor törölhető a beállítások oldalon. A törlés a személyes adatok végleges eltávolítását vonja maga után, az adatkezelési tájékoztatóban foglaltak szerint.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">4. Szellemi tulajdon</h2>
      <p>
        A Kalmio platform — beleértve a forráskódot, a felhasználói felületet, a receptadatbázist, a logót és a márkaelemet — a Hard Rock Coders Kft. kizárólagos szellemi tulajdona, vagy a platform jogszerű licenszeltje.
      </p>
      <p className="mt-3">
        A felhasználó által feltöltött tartalmak (saját receptek, profiladatok) a felhasználó tulajdonát képezik. A feltöltéssel a felhasználó nem kizárólagos, ingyenes licenszt ad a Hard Rock Coders Kft.-nek a tartalom megjelenítéséhez és a szolgáltatás nyújtásához szükséges mértékben.
      </p>
      <p className="mt-3">
        A platform tartalmainak másolása, terjesztése, értékesítése vagy kereskedelmi célú hasznosítása kizárólag előzetes írásos engedéllyel megengedett.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">5. Elfogadhatatlan használat</h2>
      <p>A felhasználó nem jogosult:</p>
      <ul className="list-disc pl-6 space-y-2 mt-3">
        <li>a szolgáltatás automatizált módon való igénybevételére (scraping, robotok, crawlerek) engedély nélkül;</li>
        <li>más felhasználók hozzáférési adatainak megszerzésére;</li>
        <li>a rendszer biztonságát veszélyeztető tevékenységre (pl. SQL injection, XSS, DDoS);</li>
        <li>hamis, félrevezető vagy más személyek adatainak megadására regisztrációkor;</li>
        <li>olyan tartalom feltöltésére, amely jogsértő, sértő, fenyegető, zaklatást vagy gyűlöletet kelt.</li>
      </ul>
      <p className="mt-3">
        A szabályokat megsértő fiókokat előzetes értesítés nélkül felfüggeszthetjük vagy törölhetjük.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">6. Felelősségkorlátozás</h2>
      <p>
        A Kalmio táplálkozási ajánlásai tájékoztató jellegűek, és nem minősülnek orvosi vagy dietetikai tanácsadásnak. Egészségügyi állapottal, allergiával vagy speciális diétával összefüggő döntések előtt forduljon orvoshoz vagy dietetikushoz.
      </p>
      <p className="mt-3">
        A Hard Rock Coders Kft. nem vállal felelősséget:
      </p>
      <ul className="list-disc pl-6 space-y-2 mt-3">
        <li>a táplálkozási adatok pontosságáért vagy teljességéért;</li>
        <li>a felhasználó egészségi állapotában bekövetkező változásokért;</li>
        <li>a szolgáltatás átmeneti elérhetetlenségéért;</li>
        <li>harmadik felek által okozott károkért.</li>
      </ul>
      <p className="mt-3">
        A felelősség mértéke minden esetben az érintett felhasználó által az adott naptári évben ténylegesen megfizetett díjra korlátozódik. Ingyenes felhasználás esetén a felelősség mértéke 0 Ft.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">7. A szolgáltatás módosítása és megszüntetése</h2>
      <p>
        A Hard Rock Coders Kft. jogosult a szolgáltatást bármikor módosítani, bővíteni vagy szűkíteni. Lényeges változásokról az aktív felhasználókat legalább 30 nappal előre értesítjük e-mailben.
      </p>
      <p className="mt-3">
        Amennyiben a felhasználó a módosított feltételeket nem fogadja el, jogosult fiókját törölni. A módosítás hatályba lépése utáni további használat a feltételek elfogadásának minősül.
      </p>
      <p className="mt-3">
        A szolgáltatás teljes megszüntetése esetén a felhasználókat legalább 60 nappal előre tájékoztatjuk, és lehetőséget biztosítunk adataik exportálására.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">8. Alkalmazandó jog és jogvita rendezése</h2>
      <p>
        Jelen felhasználási feltételekre a magyar jog irányadó. A felek közötti jogviták rendezésére — hatáskörüktől függően — a <strong>Budai Központi Kerületi Bíróság</strong>, illetve a <strong>Budapest Környéki Törvényszék</strong> rendelkezik illetékességgel.
      </p>
      <p className="mt-3">
        A fogyasztók a jogvitákat alternatív vitarendezési fórumon (online vitarendezési platform: <a href="https://ec.europa.eu/consumers/odr" className="text-[#F28C28] hover:underline" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>) is rendezhetik.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">9. Fizetés, teljesítés és csalásmegelőzés</h2>
      <p>
        Az Alapító tagság egyszeri díjas, digitális szolgáltatás. A vásárlás a weboldalon történik; a megrendelés véglegesítésének előfeltétele a jelen feltételek elfogadása.
      </p>
      <p className="mt-3">
        <strong>Fizetési mód.</strong> Az online bankkártyás fizetések a Barion rendszerén keresztül valósulnak meg (elfogadott kártyatípusok: Visa, Mastercard, Maestro), illetve Barion-tárcával is fizethetsz. A bankkártya adatait a Barion kezeli, azokhoz a Kalmio (Hard Rock Coders Kft.) nem fér hozzá. A szolgáltatást nyújtó Barion Payment Zrt. a Magyar Nemzeti Bank felügyelete alatt álló intézmény, engedélyének száma: H-EN-I-1064/2013.
      </p>
      <p className="mt-3">
        <strong>Teljesítés ideje.</strong> Az Alapító tagság digitális szolgáltatás, fizikai kiszállítás nincs. A hozzáférés a sikeres fizetést követően azonnal, jellemzően néhány percen belül aktiválódik.
      </p>
      <p className="mt-3">
        <strong>Elállás.</strong> Olyan digitális szolgáltatás esetén, amelynek teljesítését a kifejezett, előzetes hozzájárulásoddal azonnal megkezdjük, a 45/2014. (II. 26.) Korm. rendelet szerinti 14 napos elállási jog a teljesítés megkezdése után nem gyakorolható.
      </p>
      <p className="mt-3">
        <strong>Csalásmegelőzés (Barion Pixel).</strong> A weboldal csalásmegelőzési célból a Barion Pixel nevű JavaScript-kódot használja, amely a böngészési és vásárlási eseményekről adatokat továbbít a Barion Payment Zrt. részére. Erről bővebben az <Link to="/privacy" className="text-[#F28C28] hover:underline">Adatkezelési tájékoztatóban</Link> olvashatsz.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">10. Kapcsolat</h2>
      <p>
        Hard Rock Coders Kft.<br />
        Székhely: 1163 Budapest, Veres Péter út 51.<br />
        Cégjegyzékszám: 01-09-353818<br />
        Adószám: 27320507-2-42<br />
        Telefon: <a href="tel:+36308285151" className="text-[#F28C28] hover:underline">+36 30 828 5151</a><br />
        E-mail: <a href="mailto:privacy@kalmio.hu" className="text-[#F28C28] hover:underline">privacy@kalmio.hu</a>
      </p>
      <p className="mt-3 text-sm text-[#1A1A1A]/50">
        Jelen feltételek legutóbb 2026. január 1-jén frissültek.
      </p>
    </div>
  )
}

function TermsEn() {
  return (
    <div className="prose prose-sm max-w-none text-[#1A1A1A]/80">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Terms of Service</h1>
      <p className="text-sm text-[#1A1A1A]/50 mb-8">Effective: 1 January 2026</p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">1. About the Service</h2>
      <p>
        Kalmio (<a href="https://kalmio.hu" className="text-[#F28C28] hover:underline">kalmio.hu</a>) is a personalised meal planning and nutrition application. The platform generates weekly meal plans automatically, creates shopping lists, tracks fridge and pantry contents, and logs daily nutrition.
      </p>
      <p className="mt-3">
        The service is operated by <strong>Hard Rock Coders Kereskedelmi és Szolgáltató Korlátolt Felelősségű Társaság</strong> (company registration: 01-09-353818, tax number: 27320507-2-42, registered address: 1163 Budapest, Veres Péter út 51., Hungary, phone: +36 30 828 5151, email: privacy@kalmio.hu).
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">2. Eligibility</h2>
      <p>To use Kalmio, you must:</p>
      <ul className="list-disc pl-6 space-y-2 mt-3">
        <li>Be at least 16 years old. Users under 16 may only register with the consent of a legal guardian.</li>
        <li>Accept these Terms and our <Link to="/privacy" className="text-[#F28C28] hover:underline">Privacy Notice</Link>.</li>
        <li>Note that the service is currently in beta. Some features may change or be discontinued.</li>
      </ul>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">3. User Account</h2>
      <p>
        Registration requires a valid email address. You are responsible for the security of your account and must notify Hard Rock Coders Kft. immediately if you suspect unauthorised access.
      </p>
      <p className="mt-3">
        Each individual may hold only one account. Accounts may not be transferred, sold or lent to others.
      </p>
      <p className="mt-3">
        You may delete your account at any time via the settings page. Deletion results in permanent removal of your personal data in accordance with the Privacy Notice.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">4. Intellectual Property</h2>
      <p>
        The Kalmio platform — including source code, user interface, recipe database, logo and brand elements — is the exclusive intellectual property of Hard Rock Coders Kft. or its licensors.
      </p>
      <p className="mt-3">
        Content you upload (own recipes, profile data) remains your property. By uploading it, you grant Hard Rock Coders Kft. a non-exclusive, royalty-free licence to display that content to the extent necessary to provide the service.
      </p>
      <p className="mt-3">
        Copying, distributing, selling or commercially exploiting platform content is permitted only with prior written consent.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">5. Prohibited Use</h2>
      <p>You must not:</p>
      <ul className="list-disc pl-6 space-y-2 mt-3">
        <li>access the service by automated means (scraping, bots, crawlers) without permission;</li>
        <li>attempt to obtain the credentials of other users;</li>
        <li>engage in activities that compromise system security (SQL injection, XSS, DDoS, etc.);</li>
        <li>provide false, misleading or third-party information during registration;</li>
        <li>upload content that is unlawful, offensive, threatening, harassing or hateful.</li>
      </ul>
      <p className="mt-3">
        Accounts that violate these rules may be suspended or deleted without prior notice.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">6. Limitation of Liability</h2>
      <p>
        Kalmio's nutritional recommendations are for informational purposes only and do not constitute medical or dietetic advice. Please consult a doctor or dietitian before making decisions related to a health condition, allergy or special diet.
      </p>
      <p className="mt-3">
        Hard Rock Coders Kft. accepts no liability for:
      </p>
      <ul className="list-disc pl-6 space-y-2 mt-3">
        <li>the accuracy or completeness of nutritional data;</li>
        <li>changes to the user's health;</li>
        <li>temporary unavailability of the service;</li>
        <li>damage caused by third parties.</li>
      </ul>
      <p className="mt-3">
        Liability is in all cases limited to the fees actually paid by the relevant user in the applicable calendar year. For free-tier use, liability is limited to HUF 0.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">7. Changes and Termination</h2>
      <p>
        Hard Rock Coders Kft. may modify, expand or reduce the service at any time. Active users will be notified by email at least 30 days in advance of material changes.
      </p>
      <p className="mt-3">
        If you do not accept the revised terms, you may delete your account. Continued use after the effective date constitutes acceptance.
      </p>
      <p className="mt-3">
        If the service is shut down entirely, users will be given at least 60 days' notice and the opportunity to export their data.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">8. Governing Law and Disputes</h2>
      <p>
        These Terms are governed by Hungarian law. Disputes shall be subject to the exclusive jurisdiction of the <strong>Budai Központi Kerületi Bíróság</strong> or the <strong>Budapest Környéki Törvényszék</strong>, depending on the value of the claim.
      </p>
      <p className="mt-3">
        Consumers may also resolve disputes through the EU online dispute resolution platform: <a href="https://ec.europa.eu/consumers/odr" className="text-[#F28C28] hover:underline" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">9. Payment, Fulfilment and Fraud Prevention</h2>
      <p>
        Founding Membership is a one-off, digital service. The purchase takes place on the website; accepting these Terms is a precondition of completing the order.
      </p>
      <p className="mt-3">
        <strong>Payment method.</strong> Online card payments are processed through the Barion system (accepted card types: Visa, Mastercard, Maestro), or you may pay with a Barion wallet. Card details are handled by Barion and are never accessible to Kalmio (Hard Rock Coders Kft.). Barion Payment Zrt., the payment provider, is an institution supervised by the National Bank of Hungary under licence number H-EN-I-1064/2013.
      </p>
      <p className="mt-3">
        <strong>Fulfilment time.</strong> Founding Membership is a digital service with no physical delivery. Access is activated immediately after a successful payment, typically within a few minutes.
      </p>
      <p className="mt-3">
        <strong>Right of withdrawal.</strong> For a digital service whose performance begins immediately with your express prior consent, the 14-day right of withdrawal under Hungarian Government Decree 45/2014 (II. 26.) cannot be exercised once performance has begun.
      </p>
      <p className="mt-3">
        <strong>Fraud prevention (Barion Pixel).</strong> For fraud-prevention purposes the website uses a JavaScript snippet called the Barion Pixel, which transmits browsing and purchase events to Barion Payment Zrt. You can read more in our <Link to="/privacy" className="text-[#F28C28] hover:underline">Privacy Notice</Link>.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">10. Contact</h2>
      <p>
        Hard Rock Coders Kft.<br />
        Registered address: 1163 Budapest, Veres Péter út 51., Hungary<br />
        Company registration: 01-09-353818<br />
        Tax number: 27320507-2-42<br />
        Phone: <a href="tel:+36308285151" className="text-[#F28C28] hover:underline">+36 30 828 5151</a><br />
        Email: <a href="mailto:privacy@kalmio.hu" className="text-[#F28C28] hover:underline">privacy@kalmio.hu</a>
      </p>
      <p className="mt-3 text-sm text-[#1A1A1A]/50">
        These Terms were last updated on 1 January 2026.
      </p>
    </div>
  )
}

export function Terms() {
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
        {isHu ? <TermsHu /> : <TermsEn />}
      </main>
    </div>
  )
}
