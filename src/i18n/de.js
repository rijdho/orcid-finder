export const de = {
  'meta.description':
    'ORCID nach den Konten durchsuchen, die eine Einrichtung angeben: nach ROR-ID oder Organisationsnamen, eingegrenzt nach Funktionsbezeichnung, Startdatum und laufenden Anstellungen. Ergebnis als CSV oder JSON herunterladbar.',

  'ui.brand.tagline': 'Die ORCID-Konten finden, die eine Einrichtung angeben',
  'ui.brand.source': 'Quellcode ↗',
  'ui.lede':
    'Geben Sie eine <b>ROR-ID</b> oder einen Organisationsnamen ein, und das Werkzeug listet die ORCID-Konten auf, die diese Zugehörigkeit angeben. Danach lässt sich die Liste nach Funktionsbezeichnung, Startdatum und laufender Anstellung eingrenzen. Die Tabelle steht als <b>CSV</b> oder <b>JSON</b> zum Download bereit. Alles läuft in Ihrem Browser gegen die öffentliche ORCID-API: ohne Konto, ohne Schlüssel, und nichts läuft über einen Server von uns.',
  'ui.lang.aria': 'Sprache',
  'ui.theme.title': 'Helles/dunkles Design umschalten',
  'ui.theme.aria': 'Helles/dunkles Design umschalten',

  'form.legend.searchBy': 'Suchen nach',
  'form.legend.narrow': 'Ergebnis eingrenzen',
  'form.legend.scope': 'Umfang',
  'form.byRor': 'ROR-ID',
  'form.byName': 'Organisationsname',
  'form.rors.label': 'ROR-ID(s), kommagetrennt',
  'form.rors.ph': 'z. B. 03yrm5c26, 05gq02987',
  'form.rors.hint':
    'Mehrere zugleich erfassen eine Einrichtung, die als übergeordnete ROR mit untergeordneten Einträgen für Fakultäten oder Standorte registriert ist: ein Datensatz kann jede davon angeben.',
  'form.orgNames.label': 'Organisationsname(n), kommagetrennt',
  'form.orgNames.ph': 'z. B. Universität Wien, University of Vienna',
  'form.orgNames.hint':
    'Abgeglichen wird, was die Kontoinhaberin oder der Kontoinhaber geschrieben hat: alternative Schreibweisen und die landessprachliche Form lohnen sich.',
  'form.roleTitles.label': 'Funktionsbezeichnung enthält',
  'form.roleTitles.ph': 'Professor, Postdoc (kommagetrennt)',
  'form.currentOnly': 'Nur laufende Anstellungen',
  'form.requireStartDate': 'Muss ein Startdatum haben',
  'form.employmentsHint':
    'Diese drei lesen den ORCID-Anstellungsdatensatz jeder Kandidatin und jedes Kandidaten: eine zusätzliche Anfrage pro Person, also langsamer, aber deutlich genauer.',
  'form.maxRows.label': 'Maximale Anzahl Kandidaten',
  'form.maxRows.hint':
    'Wie viele der passenden Konten abgerufen und geprüft werden. ORCID liefert sie in Seiten zu 100; 1000 ist hier die Obergrenze.',
  'form.submit': 'ORCID durchsuchen',
  'form.searching': 'Suche läuft…',
  'form.cancel': 'Abbrechen',
  'form.reset': 'Zurücksetzen',

  'err.noCriteria':
    'Wählen Sie mindestens ein Kriterium: eine ROR-ID oder einen Organisationsnamen, mit gesetztem Häkchen.',
  'err.badRor': '„{id}“ ist keine gültige ROR-ID (neun Zeichen, beginnend mit 0, z. B. 03jzk4720).',
  'err.failed':
    'Die Suche ist fehlgeschlagen. Die öffentliche ORCID-API drosselt möglicherweise: bitte in einer Minute erneut versuchen.',

  'status.searching': 'ORCID wird abgefragt…',
  'status.reading': 'Anstellungsdatensätze werden gelesen: {done} von {total}',

  'res.title': 'Ergebnisse',
  'res.summary': '{kept} von {scanned} geprüften Kandidaten behalten.',
  'res.totalFound': 'ORCID meldet {total} passende Konten.',
  'res.mode.fast': 'schneller Modus',
  'res.mode.full': 'vollständiger Modus',
  'res.aborted': 'Abgebrochen: was bis dahin geprüft wurde, steht unten.',
  'res.empty': 'Kein Konto passte. Lockern Sie einen Filter, oder prüfen Sie die ROR-ID.',
  'res.query': 'An ORCID gesendete Abfrage',

  'bd.title': 'Was die Filter aussortiert haben',
  'bd.noOrgMatch': '{n} ohne Übereinstimmung der Zugehörigkeit',
  'bd.noRoleMatch': '{n} Funktionsbezeichnung passte nicht',
  'bd.noStartDate': '{n} ohne Startdatum',
  'bd.pastEmployment': '{n} Anstellung bereits beendet',
  'bd.unreachable': '{n} Datensatz nicht lesbar',

  'export.csv': 'CSV herunterladen',
  'export.json': 'JSON herunterladen',
  'export.hint': 'Die Datei enthält alle Zeilen der Tabelle, nicht nur die angezeigte Seite.',

  'col.orcid': 'ORCID iD',
  'col.name': 'Name',
  'col.role': 'Funktionsbezeichnung',
  'col.department': 'Abteilung',
  'col.organization': 'Organisation',
  'col.start': 'Beginn',
  'col.end': 'Ende',
  'col.matched': 'Treffer über',

  'matched.name': 'Name',
  'matched.ror_only': 'nur ROR',
  'matched.employment': 'Anstellung',
  'matched.ror_only.title':
    'ORCID hat die ROR-ID getroffen, der dort geführte Einrichtungsname ist aber anders geschrieben. Das ist normal, der Treffer ist echt.',

  'how.title': 'Wie es funktioniert',
  'how.body':
    '<p>Das Werkzeug nutzt zwei Endpunkte der öffentlichen ORCID-API. Welcher davon läuft, entscheiden die gesetzten Filter.</p>' +
    '<p>Der <b>schnelle Modus</b> ist ein einziger Aufruf von <code>expanded-search</code>, der Ihre Kriterien mit ODER zu einer Abfrage verbindet. Er liefert Namen und die von ORCID indexierten Einrichtungsnamen je Konto und beantwortet damit in Sekunden, wer diese Zugehörigkeit angibt, unabhängig von der Größe des Ergebnisses.</p>' +
    '<p>Der <b>vollständige Modus</b> beginnt, sobald Sie nach Funktionsbezeichnung, Startdatum oder laufenden Anstellungen filtern. Diese drei Felder stehen nur im Dokument <code>/employments</code> eines Datensatzes, das Werkzeug liest also eines pro Kandidat. Das ist je eine HTTP-Anfrage: genau, und entsprechend langsamer.</p>' +
    '<p>Ein über ROR gefundener Kandidat wird auch dann behalten, wenn der Einrichtungsname im Datensatz anders lautet, denn <code>expanded-search</code> liefert diese Namen ohne ROR-IDs je Eintrag. Sie zu verwerfen hieße, genau die Datensätze wegzuwerfen, für die das ROR-Kriterium gewählt wurde. Solche Zeilen sind mit <b>nur ROR</b> gekennzeichnet.</p>' +
    '<p>Jede Zahl darüber, was ein Filter aussortiert hat, wird dem Filter zugeschrieben, der tatsächlich aussortiert hat. Ein Filter, der nichts tut, ist so als Null sichtbar statt hinter einem früheren verborgen.</p>',

  'caveats.title': 'Einschränkungen',
  'caveats.body':
    '<ul>' +
    '<li><b>ORCID beruht auf Selbstauskunft.</b> Ein Datensatz sagt, was seine Inhaberin oder sein Inhaber eingetragen hat. Der tatsächliche Personalbestand einer Einrichtung ist größer als das, was ORCID zeigt, und kann in Funktionsbezeichnungen, Schreibweise und Daten abweichen.</li>' +
    '<li><b>Abwesenheit ist kein Beleg.</b> Wer die Zugehörigkeit nie eingetragen hat oder gar keine ORCID besitzt, kann hier nicht erscheinen. Das ist ein Suchwerkzeug, keine Personalzählung.</li>' +
    '<li><b>Namen werden als Teilzeichenketten abgeglichen.</b> „Vienna“ trifft jede Einrichtung, deren Name das enthält. Die ROR-ID ist das genaue Kriterium, der Name der Rückfall für Datensätze ohne ROR.</li>' +
    '<li><b>Gemeldet wird nur die erste passende Anstellung.</b> Wer mehrere Anstellungen an derselben Einrichtung hat, erscheint einmal, unter derjenigen, die Ihre Filter bestanden hat.</li>' +
    '<li><b>Ein unvollständiges Enddatum zählt bis zu seinem spätesten Zeitpunkt.</b> „Beendet 2026“ gilt für das ganze Jahr 2026 als laufend, damit aktives Personal nicht stillschweigend entfällt.</li>' +
    '<li><b>Die öffentliche API drosselt.</b> Ein großer Lauf im vollständigen Modus kann gebremst werden; das Werkzeug wartet ab und versucht es erneut und meldet jeden Datensatz, den es dennoch nicht lesen konnte.</li>' +
    '</ul>',

  'about.title': 'Über dieses Werkzeug',
  'about.body':
    '<p>orcid-finder ist eine einzelne statische Seite: kein Build-Schritt, kein Backend, kein Tracking, keine Cookies. Sie spricht direkt aus Ihrem Browser mit <a href="https://info.orcid.org/documentation/features/public-api/" target="_blank" rel="noreferrer">der öffentlichen ORCID-API</a>, sodass kein Server von uns je sieht, wonach Sie suchen. Gespeichert wird allein Ihre Sprach- und Designwahl, im Speicher Ihres eigenen Browsers.</p>' +
    '<p>Der Filtersatz stammt aus der Personalsuche eines Forschungsinformationssystems und wurde aus dessen Datenbank herausgelöst, damit dieselbe Suche auch ohne ein solches System möglich ist.</p>',
  'about.footer':
    'Erstellt von <a href="https://rijdho.github.io" target="_blank" rel="noreferrer">@rijdho</a> · MIT-Lizenz · <a href="https://github.com/rijdho/orcid-finder" target="_blank" rel="noreferrer">Quellcode auf GitHub</a> · Daten von ORCID, genutzt gemäß deren Bedingungen für die öffentliche API',
};
