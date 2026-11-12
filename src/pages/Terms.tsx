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

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">9. Kalmio Prémium előfizetés</h2>
      <p>
        A Kalmio Prémium a prémium funkciókhoz (különösen az AI-alapú funkciókhoz) hozzáférést biztosító, határozatlan időre szóló, időszakonként ismétlődő díjas digitális szolgáltatás. Az előfizetés a weboldalon, a számlázási adatok megadásával, jelen feltételek elfogadásával és az első díj megfizetésével jön létre.
      </p>
      <p className="mt-3">
        <strong>Díjak.</strong> Havi előfizetés: 1 990 Ft/hó; éves előfizetés: 14 990 Ft/év. A feltüntetett árak a fizetendő teljes (bruttó) összeget tartalmazzák. A már megkötött előfizetés díja a futamideje alatt nem emelkedik: a megújuló terhelés összege nem haladja meg az első díjat.
      </p>
      <p className="mt-3">
        <strong>Automatikus megújulás és terhelés.</strong> Az előfizetés a választott időszak (egy hónap, illetve egy év) leteltével – lemondásig – automatikusan ugyanilyen időtartamra megújul. Az első díjat a Barion fizetőoldalán bankkártyával fizeted meg; ekkor hozzájárulsz ahhoz, hogy a Barion a kártyádat az ismétlődő díjak terheléséhez regisztrálja. A megújuló díjat az aktuális időszak lejártakor, külön jóváhagyás nélkül terheljük a regisztrált kártyára. Minden sikeres terhelésről elektronikus számlát küldünk.
      </p>
      <p className="mt-3">
        <strong>Lemondás.</strong> Az előfizetést bármikor lemondhatod a Beállítások oldalon. A lemondás az aktuális, már kifizetett időszak végén lép hatályba: addig a prémium funkciók elérhetők maradnak, további terhelés nem történik. Az időszak végéig a lemondást visszavonhatod. A megkezdett időszak díját – a jogszabályban kötelezően előírt esetek kivételével – nem térítjük vissza.
      </p>
      <p className="mt-3">
        <strong>Sikertelen terhelés.</strong> Ha a megújuló díj terhelése nem sikerül (például lejárt vagy letiltott kártya, illetve fedezethiány miatt), a terhelést az esedékességet követő 1., 3. és 5. napon megismételjük. Az esedékességtől számított 7 napig (türelmi idő) a prémium funkciók elérhetők maradnak, és az elmaradt díjat a Beállítások oldalon másik bankkártyával is rendezheted. Ha a díj a türelmi idő végéig sem kerül megfizetésre, az előfizetés megszűnik, a fiók ingyenes hozzáférésre vált, az adataid pedig megmaradnak.
      </p>
      <p className="mt-3">
        <strong>A teljesítés megkezdése és az elállási jog.</strong> A Kalmio Prémium nem tárgyi adathordozón nyújtott digitális adattartalom, amelynek teljesítését a sikeres első fizetést követően azonnal megkezdjük. A megrendeléskor kifejezetten kéred a szolgáltatás azonnali megkezdését, és tudomásul veszed, hogy ezzel elveszíted a 14 napos elállási jogodat (45/2014. (II. 26.) Korm. rendelet 29. § (1) bekezdés m) pont). E kérés és nyilatkozat nélkül az előfizetés nem rendelhető meg. A beleegyezésedet és a nyilatkozatodat a szerződés megkötését követően e-mailben visszaigazoljuk.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">10. Alapító tagság</h2>
      <p>
        Az Alapító tagság egyszeri díjért nyújtott, a szolgáltatás fennállásáig tartó hozzáférés minden prémium funkcióhoz, legfeljebb 1000 tag részére. Díja 19 900 Ft (bruttó), amelyet egyszer kell megfizetni.
      </p>
      <p className="mt-3">
        <strong>Fizetés kizárólag banki átutalással.</strong> Az Alapító tagság díja kizárólag banki átutalással fizethető meg. Az Alapító tagság esetében bankkártyás fizetésre, Barion-fizetésre vagy más online fizetési módra nincs lehetőség.
      </p>
      <p className="mt-3">
        <strong>A megrendelés menete.</strong> A megrendelés leadásakor (a számlázási adatok megadásával és jelen feltételek elfogadásával) díjbekérőt állítunk ki, amelyet e-mailben megküldünk. Az átutalás közleményében a megrendeléskor kapott azonosítót (KALMIO-AT-…) kell feltüntetni. A megrendelés 8 napig foglalja a helyet; ha a díj ez idő alatt nem érkezik meg, a megrendelés lejár, és a hely felszabadul. A díj megfizetéséig a megrendelés következmények nélkül, egyszerűen az átutalás elmaradásával lemondható.
      </p>
      <p className="mt-3">
        <strong>Teljesítés.</strong> A tagságot azt követően aktiváljuk, hogy az átutalt összeg a bankszámlánkon jóváírásra került; a jóváírást kézzel ellenőrizzük, ezért ez jellemzően egy-két munkanapot vesz igénybe. Az aktiválásról e-mailben értesítünk, és kiállítjuk a végszámlát. Ha a megrendelést fiók nélkül adtad le, a tagság a megrendeléskor megadott e-mail-címmel létrehozott fiókhoz kapcsolható.
      </p>
      <p className="mt-3">
        <strong>Elállási jog.</strong> Az Alapító tagság megrendelésétől elállhatsz a szerződés megkötésétől (a megrendelés leadásától) számított 14 napon belül, indoklás nélkül, a privacy@kalmio.hu címre küldött nyilatkozattal. Elállás esetén a már megfizetett díjat az elállásról való tudomásszerzésünktől számított 14 napon belül visszautaljuk arra a bankszámlára, amelyről érkezett.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">11. Fizetés, számlázás és csalásmegelőzés</h2>
      <p>
        <strong>Bankkártyás fizetés (csak a Kalmio Prémium előfizetésnél).</strong> Az online bankkártyás fizetések a Barion rendszerén keresztül valósulnak meg (elfogadott kártyatípusok: Visa, Mastercard, Maestro). A bankkártya adatait a Barion kezeli, azokhoz a Kalmio (Hard Rock Coders Kft.) nem fér hozzá; az ismétlődő terheléshez a Barion által kiadott azonosítót és a kártya maszkolt adatait (kártyatípus, utolsó négy számjegy, lejárat) tároljuk. A szolgáltatást nyújtó Barion Payment Zrt. a Magyar Nemzeti Bank felügyelete alatt álló intézmény, engedélyének száma: H-EN-I-1064/2013.
      </p>
      <p className="mt-3">
        <strong>Számlázás.</strong> Minden megfizetett díjról elektronikus számlát állítunk ki, amelyet e-mailben küldünk meg.
      </p>
      <p className="mt-3">
        <strong>Barion Pixel.</strong> A weboldal a Barion Payment Zrt. Barion Pixel nevű eszközét használja. Az alapfunkció csalásmegelőzési célból minden oldalon működik, és a böngészési, illetve vásárlási eseményekről adatokat továbbít a Barion részére. A marketing célú (teljes) funkció csak akkor működik, ha a sütibeállításokban a marketing sütikhez hozzájárultál. Erről bővebben az <Link to="/privacy" className="text-[#F28C28] hover:underline">Adatkezelési tájékoztatóban</Link> olvashatsz.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">12. Kapcsolat</h2>
      <p>
        Hard Rock Coders Kft.<br />
        Székhely: 1163 Budapest, Veres Péter út 51.<br />
        Cégjegyzékszám: 01-09-353818<br />
        Adószám: 27320507-2-42<br />
        Telefon: <a href="tel:+36308285151" className="text-[#F28C28] hover:underline">+36 30 828 5151</a><br />
        E-mail: <a href="mailto:privacy@kalmio.hu" className="text-[#F28C28] hover:underline">privacy@kalmio.hu</a>
      </p>
      <p className="mt-3 text-sm text-[#1A1A1A]/50">
        Jelen feltételek legutóbb 2026. november 12-én frissültek.
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

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">9. Kalmio Premium Subscription</h2>
      <p>
        Kalmio Premium is a digital service with a recurring fee, concluded for an indefinite period, that gives access to the premium features (in particular the AI-based features). The subscription is concluded on the website by entering your billing details, accepting these Terms and paying the first fee.
      </p>
      <p className="mt-3">
        <strong>Fees.</strong> Monthly subscription: HUF 1,990 per month; yearly subscription: HUF 14,990 per year. The prices shown are the full (gross) amounts payable. The fee of an existing subscription does not increase during its term: a renewal charge never exceeds the first fee.
      </p>
      <p className="mt-3">
        <strong>Automatic renewal and charging.</strong> Until cancelled, the subscription renews automatically for the same period (one month or one year) when the chosen period ends. You pay the first fee by card on Barion's payment page and, in doing so, consent to Barion registering your card for the recurring charges. Each renewal fee is charged to the registered card when the current period ends, without separate approval. We send an electronic invoice for every successful charge.
      </p>
      <p className="mt-3">
        <strong>Cancellation.</strong> You can cancel the subscription at any time on the Settings page. Cancellation takes effect at the end of the current, already paid period: until then the premium features remain available and no further charge is made. You can withdraw the cancellation until the period ends. Fees for a period that has begun are not refunded, except where the law requires it.
      </p>
      <p className="mt-3">
        <strong>Failed charges.</strong> If a renewal charge fails (for example because the card has expired or been blocked, or for lack of funds), we retry it on the 1st, 3rd and 5th day after the due date. For 7 days from the due date (grace period) the premium features remain available, and you can settle the overdue fee with another card on the Settings page. If the fee is still unpaid at the end of the grace period, the subscription ends, the account reverts to free access and your data is kept.
      </p>
      <p className="mt-3">
        <strong>Start of performance and right of withdrawal.</strong> Kalmio Premium is digital content not supplied on a tangible medium, and we begin performance immediately after the first successful payment. When ordering, you expressly request the immediate start of the service and acknowledge that you thereby lose your 14-day right of withdrawal (Hungarian Government Decree 45/2014 (II. 26.), Section 29(1)(m)). Without this request and acknowledgement the subscription cannot be ordered. We confirm your consent and acknowledgement by email after the contract is concluded.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">10. Founding Membership</h2>
      <p>
        Founding Membership is access to every premium feature for as long as the service exists, for a one-off fee, limited to 1,000 members. The fee is HUF 19,900 (gross), payable once.
      </p>
      <p className="mt-3">
        <strong>Payment by bank transfer only.</strong> The Founding Membership fee can be paid by bank transfer only. Card payment, Barion payment or any other online payment method is not available for Founding Membership.
      </p>
      <p className="mt-3">
        <strong>How ordering works.</strong> When you place the order (by entering your billing details and accepting these Terms) we issue a pro forma invoice and send it by email. The transfer must carry the order reference you receive (KALMIO-AT-…) in its remittance information (közlemény). The order holds your seat for 8 days; if the fee has not arrived by then, the order lapses and the seat is released. Until the fee is paid, you can cancel the order without consequence simply by not making the transfer.
      </p>
      <p className="mt-3">
        <strong>Fulfilment.</strong> We activate the membership once the transferred amount has been credited to our bank account; we check transfers manually, so this typically takes one or two business days. We notify you of the activation by email and issue the final invoice. If you ordered without an account, the membership can be linked to an account created with the email address given in the order.
      </p>
      <p className="mt-3">
        <strong>Right of withdrawal.</strong> You may withdraw from a Founding Membership order within 14 days of concluding the contract (placing the order), without giving reasons, by sending a statement to privacy@kalmio.hu. If you withdraw, we refund the fee already paid within 14 days of learning of your withdrawal, to the bank account it came from.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">11. Payment, Invoicing and Fraud Prevention</h2>
      <p>
        <strong>Card payment (Kalmio Premium subscription only).</strong> Online card payments are processed through the Barion system (accepted card types: Visa, Mastercard, Maestro). Card details are handled by Barion and are never accessible to Kalmio (Hard Rock Coders Kft.); for the recurring charges we store the identifier issued by Barion and the card's masked details (card type, last four digits, expiry). Barion Payment Zrt., the payment provider, is an institution supervised by the National Bank of Hungary under licence number H-EN-I-1064/2013.
      </p>
      <p className="mt-3">
        <strong>Invoicing.</strong> We issue an electronic invoice for every fee paid and send it by email.
      </p>
      <p className="mt-3">
        <strong>Barion Pixel.</strong> The website uses the Barion Pixel of Barion Payment Zrt. Its base function runs on every page for fraud prevention and transmits browsing and purchase events to Barion. Its marketing (full) function runs only if you have consented to marketing cookies in the cookie settings. You can read more in our <Link to="/privacy" className="text-[#F28C28] hover:underline">Privacy Notice</Link>.
      </p>

      <h2 className="text-lg font-semibold text-[#1A1A1A] mt-8 mb-3">12. Contact</h2>
      <p>
        Hard Rock Coders Kft.<br />
        Registered address: 1163 Budapest, Veres Péter út 51., Hungary<br />
        Company registration: 01-09-353818<br />
        Tax number: 27320507-2-42<br />
        Phone: <a href="tel:+36308285151" className="text-[#F28C28] hover:underline">+36 30 828 5151</a><br />
        Email: <a href="mailto:privacy@kalmio.hu" className="text-[#F28C28] hover:underline">privacy@kalmio.hu</a>
      </p>
      <p className="mt-3 text-sm text-[#1A1A1A]/50">
        These Terms were last updated on 12 November 2026.
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
