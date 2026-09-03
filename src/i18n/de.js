export const de = {
  'meta.description':
    'ORCID nach den Konten durchsuchen, die eine Einrichtung angeben: nach ROR-ID oder Organisationsnamen, eingegrenzt nach Funktionsbezeichnung, Startdatum, laufenden Anstellungen und danach, wer den Eintrag vorgenommen hat. Ergebnis als CSV oder JSON herunterladbar.',

  'ui.brand.tagline': 'Die ORCID-Konten finden, die eine Einrichtung angeben',
  'ui.brand.source': 'Quellcode ↗',
  'ui.lede':
    'Geben Sie eine <b>ROR-ID</b> oder einen Organisationsnamen ein, und das Werkzeug listet die ORCID-Konten auf, die diese Zugehörigkeit angeben. Danach lässt sich die Liste nach Schlagwort, Funktion, Abteilung, Land, Startdatum, laufender Anstellung und danach eingrenzen, ob eine Organisation den Eintrag vorgenommen hat statt der Person selbst. Die Tabelle steht als <b>CSV</b> oder <b>JSON</b> zum Download bereit. Alles läuft in Ihrem Browser gegen die öffentlichen APIs von ORCID und ROR: ohne Konto, ohne Schlüssel, und nichts läuft über einen Server von uns.',
  'ui.lang.aria': 'Sprache',
  'ui.theme.title': 'Helles/dunkles Design umschalten',
  'ui.theme.aria': 'Helles/dunkles Design umschalten',

  'form.byRor': 'ROR-ID',
  'form.byName': 'Organisationsname',
  'form.rors.label': 'ROR-ID(s), kommagetrennt',
  'form.rors.ph': 'z. B. 056d84691',
  'form.rors.hint':
    'Mehrere zugleich erfassen eine Einrichtung, die als übergeordnete ROR mit untergeordneten Einträgen für Fakultäten oder Standorte registriert ist: ein Datensatz kann jede davon angeben. Die GRID-ID, die ROR zu jeder führt, kommt automatisch in die Abfrage, denn ORCID indexiert beide getrennt.',
  'form.orgNames.label': 'Organisationsname(n), kommagetrennt',
  'form.orgNames.ph': 'z. B. Karolinska Institutet',
  'form.orgNames.hint':
    'Abgeglichen wird, was die Kontoinhaberin oder der Kontoinhaber geschrieben hat: alternative Schreibweisen und die landessprachliche Form lohnen sich.',
  'form.roleTitles.label': 'Funktionsbezeichnung enthält',
  'form.roleTitles.ph': 'Professor, Postdoc (kommagetrennt)',
  'form.currentOnly': 'Nur laufende Anstellungen',
  'form.requireStartDate': 'Muss ein Startdatum haben',
  'form.employmentsHint':
    'Alles in dieser Spalte liest den ORCID-Anstellungsdatensatz jeder Kandidatin und jedes Kandidaten: eine zusätzliche Anfrage pro Person, also langsamer, aber deutlich genauer. Der Ausschluss von Funktionsbezeichnungen geschieht hier, weil ORCIDs Abfragesprache keine Verneinung kennt.',
  'form.maxRows.label': 'Maximale Anzahl Kandidaten',
  'form.maxRows.hint':
    'Wie viele der passenden Konten abgerufen und geprüft werden. ORCID liefert sie in Seiten zu 100; 2000 ist hier die Obergrenze. Jeder Filter in der mittleren Spalte kostet eine Anfrage pro Kandidat, ein Lauf an der Obergrenze also rund 2000 weitere, und dauert Minuten.',
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

  'res.rorNames': 'Zusätzlich abgeglichen mit den Namen, die ROR für die ID führt: {names}',
  'bd.title': 'Was die Filter aussortiert haben',
  'bd.noOrgMatch': '{n} ohne Übereinstimmung der Zugehörigkeit',
  'bd.noRoleMatch': '{n} Funktionsbezeichnung passte nicht',
  'bd.noStartDate': '{n} ohne Startdatum',
  'bd.pastEmployment': '{n} Anstellung bereits beendet',
  'bd.unreachable': '{n} Datensatz nicht lesbar',

  'export.csv': 'CSV herunterladen',
  'export.json': 'JSON herunterladen',
  'export.hint': 'Die Datei enthält alle Zeilen der Tabelle, nicht nur die angezeigte Seite.',
  'export.provenance': 'CSV signieren: Zitations- und Abfragekopf',
  'export.provenance.hint': 'Fügt über der Tabelle Kommentarzeilen ein, die das Werkzeug, seinen DOI und die Abfrage nennen, aus der die Zeilen stammen. Jede Zeile beginnt mit #; ein Programm, das Kommentare nicht überspringt (pandas: comment=\'#\'), zeigt sie als Datenzeilen. Der JSON-Export enthält diese Angaben immer.',
  'alt.names': 'auch bekannt als',
  'alt.names.title': 'Weitere Namen, die dieser ORCID-Datensatz führt: der Publikationsname und die Einträge unter „auch bekannt als“. Exportiert als credit_name und other_names.',

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


  'nav.label': 'Ansicht',
  'nav.search': 'Suche',
  'rail.cite': 'Dieses Werkzeug zitieren',
  'rail.data': 'Daten von ORCID und ROR',
  'form.assertedOnly': 'Nur von einer Organisation eingetragene Datensätze',
  'bd.selfAsserted': '{n} nur selbst eingetragen',
  'col.asserted': 'Eingetragen von',
  'asserted.self': 'selbst',
  'asserted.organization': 'Organisation',
  'asserted.other': 'andere iD',
  'asserted.unknown': 'unbekannt',
  'asserted.unknown.title':
    'Die Anstellung trägt keine Quelle, wer sie eingetragen hat, lässt sich also nicht sagen. Das heißt nicht, dass die Person selbst es war.',
  'asserted.self.title':
    'Die Person hat diese Anstellung selbst eingetragen. Das kann völlig zutreffen, aber außerhalb des Datensatzes steht nichts dafür ein.',
  'asserted.organization.title':
    'Das System einer Mitgliedsorganisation hat diese Anstellung in den Datensatz geschrieben, es steht also eine zweite Partei dafür ein.',
  'asserted.other.title':
    'Eine andere ORCID iD hat diese Anstellung eingetragen, was ORCID über eine Delegation an eine vertraute Person erlaubt.',

  'form.legend.institution': 'Die Einrichtung',
  'form.legend.employment': 'Die Anstellung',
  'form.legend.topic': 'Thema und Umfang',
  'form.ringgolds.label': 'Ringgold-ID(s), kommagetrennt',
  'form.ringgolds.ph': 'z. B. 27106',
  'form.ringgolds.hint':
    'ORCID indexiert Ringgold-IDs getrennt, und das System einer Einrichtung vergibt möglicherweise eine statt einer ROR-ID: sie hinzuzunehmen kann mehr als verdoppeln, was die Suche sieht. Sie ist zugleich gröber als eine ROR-ID und kann verwandte Organisationen mitbringen, etwa ein Universitätsklinikum. Lesen Sie also die Spalte Organisation.',
  'form.status.label': 'Zugehörigkeit',
  'form.status.any': 'Beliebig',
  'form.status.current': 'Laufend',
  'form.status.past': 'Früher',
  'form.status.hint':
    'Laufend und früher indexiert ORCID nur über den Organisationsnamen. Wird eines davon gewählt, wird allein nach Namen gesucht und die ID-Felder bleiben außen vor. Über „früher“ finden Sie ehemaliges Personal und Alumni. Das ist nicht dasselbe wie „Nur laufende Anstellungen“: hier wird ORCID gefragt, welche Konten es als laufend führt, dort wird das Enddatum jeder Anstellung gelesen. „Früher“ zusammen mit jenem Häkchen fragt nach Personen, die hier zugleich eine beendete und eine laufende Anstellung haben, was selten gemeint ist.',
  'form.keywords.label': 'Schlagwort(e), kommagetrennt',
  'form.keywords.ph': 'Epidemiologie, Onkologie',
  'form.keywords.hint':
    'Die Schlagworte, die Forschende selbst in ihrem ORCID-Datensatz führen. Mehrere werden mit ODER verknüpft, und das Ganze grenzt die Einrichtung ein. So lässt sich fragen, wer hier woran arbeitet. Kostenlos: es geht in dieselbe eine Abfrage.',
  'form.excludeRoleTitles.label': 'Funktionsbezeichnung darf nicht enthalten',
  'form.excludeRoleTitles.ph': 'Promotion, Student',
  'form.departments.label': 'Abteilung enthält',
  'form.departments.ph': 'Molekulare Medizin',
  'form.countries.label': 'Ländercode(s)',
  'form.countries.ph': 'SE, AT',
  'form.range.hint': 'Ein Zeitraum setzt ein Startdatum bereits voraus. „Muss ein Startdatum haben“ bewirkt daneben nichts und ändert nur, welche Zahl den Ausschluss meldet.',
  'form.startFrom.label': 'Beginn ab',
  'form.startTo.label': 'Beginn bis',
  'err.badRinggold': '„{id}“ ist keine gültige Ringgold-ID. Das sind reine Zahlen, etwa 27106.',
  'err.statusNeedsName':
    'Eine Suche nach laufend oder früher braucht einen Organisationsnamen. ORCID indexiert diese beiden nur über den Namen, nie über eine ROR-, GRID- oder Ringgold-ID.',
  'err.badStartRange': 'Der Zeitraum läuft rückwärts: das erste Jahr liegt nach dem letzten.',
  'bd.noCountryMatch': '{n} in einem anderen Land',
  'bd.noDepartmentMatch': '{n} Abteilung passte nicht',
  'bd.roleExcluded': '{n} Funktionsbezeichnung ausgeschlossen',
  'bd.startOutOfRange': '{n} Beginn außerhalb des Zeitraums',
  'col.country': 'Land',
  'how.title': 'Wie es funktioniert',
  'how.body':
    '<p>Das Werkzeug nutzt zwei Endpunkte der öffentlichen ORCID-API. Welcher davon läuft, entscheiden die gesetzten Filter.</p>' +
    '<p>Der <b>schnelle Modus</b> ist ein einziger Aufruf von <code>expanded-search</code>, der Ihre Kriterien mit ODER zu einer Abfrage verbindet. Er liefert Namen und die von ORCID indexierten Einrichtungsnamen je Konto und beantwortet damit in Sekunden, wer diese Zugehörigkeit angibt, unabhängig von der Größe des Ergebnisses.</p>' +
    '<p>Der <b>vollständige Modus</b> beginnt, sobald Sie nach Funktionsbezeichnung, Startdatum, laufenden Anstellungen oder danach filtern, wer den Eintrag vorgenommen hat. Diese Felder stehen nur im Dokument <code>/employments</code> eines Datensatzes, das Werkzeug liest also eines pro Kandidat. Das ist je eine HTTP-Anfrage: genau, und entsprechend langsamer.</p>' +
    '<p><b>Wer den Eintrag vorgenommen hat</b> ist das Feld, das ORCID Quelle nennt. Eine selbst eingetragene Anstellung trägt die eigene iD als Quelle; eine, die das System einer Mitgliedsorganisation geschrieben hat, typischerweise die Hochschule selbst, trägt stattdessen deren Client, und die Tabelle nennt ihn. Beides wird gezeigt, denn der Unterschied liegt zwischen einer Behauptung und einer, für die eine zweite Partei einsteht.</p>' +
    '<p>Ein über ROR gefundener Kandidat wird auch dann behalten, wenn der Einrichtungsname im Datensatz anders lautet, denn <code>expanded-search</code> liefert diese Namen ohne ROR-IDs je Eintrag. Sie zu verwerfen hieße, genau die Datensätze wegzuwerfen, für die das ROR-Kriterium gewählt wurde. Solche Zeilen sind mit <b>nur ROR</b> gekennzeichnet.</p>' +
    '<p><b>Die ROR-ID allein genügt nicht</b>, um eine Anstellung zu erkennen. ORCID lässt jedes Schema zur Eindeutigmachung zu, und die Kennungen, die das System einer Einrichtung selbst schreibt, sind nicht immer ROR: sie können RINGGOLD oder FUNDREF sein. Genau die von Organisationen eingetragenen Datensätze fielen damit heraus. Deshalb wird jede ROR-ID zuerst zu den Namen aufgelöst, die das Register für sie führt, und auch diese werden abgeglichen. Das Ergebnis nennt die verwendeten Namen. Eingetragene Akronyme bleiben außen vor: ein zweibuchstabiger Suchbegriff trifft einen großen Teil von ORCID.</p>' +
    '<p>Jede Zahl darüber, was ein Filter aussortiert hat, wird dem Filter zugeschrieben, der tatsächlich aussortiert hat. Ein Filter, der nichts tut, ist so als Null sichtbar statt hinter einem früheren verborgen.</p>' +
    '<p><b>Was mit der Datei hinausgeht.</b> Beide Exporte nennen sich selbst. Die CSV-Datei beginnt mit Kommentarzeilen, die das Werkzeug, seine Version, seinen DOI und die Abfrage nennen, aus der die Zeilen stammen: Eine weitergereichte Tabelle bleibt so zitierbar und wiederholbar; die JSON-Datei enthält dies seit jeher. Die Signatur lässt sich abschalten, wenn die Datei an ein Programm geht, das Kommentare nicht überspringt. Beide Dateien führen außerdem die weiteren Namen eines Datensatzes als <code>credit_name</code> und <code>other_names</code>: Der angezeigte Name entsteht aus Vor- und Nachnamensfeld, und das ist häufig eine amtliche oder transliterierte Form, unter der niemand publiziert.</p>',

  'caveats.title': 'Einschränkungen',
  'caveats.body':
    '<ul>' +
    '<li><b>Das E-Mail-Feld wird nie angezeigt und nie exportiert.</b> ORCID liefert eines für Datensätze, deren Inhaberinnen und Inhaber es öffentlich gemacht haben; dieses Werkzeug verwirft es. Eine heruntergeladene Personenliste sind personenbezogene Daten, und wozu sie dient, liegt in Ihrer Verantwortung: ein Verteiler soll nicht der bequemste Weg sein.</li>' +
    '<li><b>ORCID beruht überwiegend auf Selbstauskunft.</b> Ein Datensatz sagt meist, was seine Inhaberin oder sein Inhaber eingetragen hat. Der tatsächliche Personalbestand einer Einrichtung ist größer als das, was ORCID zeigt, und kann in Funktionsbezeichnungen, Schreibweise und Daten abweichen.</li>' +
    '<li><b>Eine von einer Organisation eingetragene Anstellung ist ein Beleg, kein Beweis für die Gegenwart.</b> Sie besagt, dass das System einer Mitgliedsorganisation den Eintrag irgendwann geschrieben hat. Sie besagt nicht, dass die Anstellung noch läuft, und auch nicht, dass die eintragende Organisation die Arbeitgeberin ist: auch Förderorganisationen und nationale Aggregatoren tragen ein, weshalb die Tabelle die Quelle nennt.</li>' +
    '<li><b>Im schnellen Modus wird gar keine Quelle gemeldet.</b> Wer eine Anstellung eingetragen hat, steht im Anstellungsdatensatz, die Spalte bleibt also leer, bis ein Filter ihn öffnet. Leer heißt unbekannt, nie selbst eingetragen.</li>' +
    '<li><b>Abwesenheit ist kein Beleg.</b> Wer die Zugehörigkeit nie eingetragen hat oder gar keine ORCID besitzt, kann hier nicht erscheinen. Das ist ein Suchwerkzeug, keine Personalzählung.</li>' +
    '<li><b>Namen werden als Teilzeichenketten abgeglichen.</b> „Vienna“ trifft jede Einrichtung, deren Name das enthält. Die ROR-ID ist das genaue Kriterium, der Name der Rückfall für Datensätze ohne ROR.</li>' +
    '<li><b>Gemeldet wird nur die erste passende Anstellung.</b> Wer mehrere Anstellungen an derselben Einrichtung hat, erscheint einmal, unter derjenigen, die Ihre Filter bestanden hat.</li>' +
    '<li><b>Ein unvollständiges Enddatum zählt bis zu seinem spätesten Zeitpunkt.</b> „Beendet 2026“ gilt für das ganze Jahr 2026 als laufend, damit aktives Personal nicht stillschweigend entfällt.</li>' +
    '<li><b>Die öffentliche API drosselt.</b> Ein großer Lauf im vollständigen Modus kann gebremst werden; das Werkzeug wartet ab und versucht es erneut und meldet jeden Datensatz, den es dennoch nicht lesen konnte.</li>' +
    '<li><b>Die Namensvarianten sind so unvollständig wie der übrige Datensatz.</b> Sie sind das, was die Person selbst als Publikationsname und unter „auch bekannt als“ eingetragen hat. Eine leere Spalte heißt, dass nichts angegeben wurde, nicht, dass die Person nur einen Namen führt.</li>' +
    '<li><b>Die CSV-Signatur besteht aus Kommentarzeilen, und das ist eine Konvention, kein Standard.</b> Jede beginnt mit <code>#</code>, und ein Programm, das Kommentare nicht überspringt, liest sie als Datenzeilen. Das Häkchen entfernen, wenn die Datei dorthin geht.</li>' +
    '</ul>',

  'about.title': 'Über dieses Werkzeug',
  'about.body':
    '<p>orcid-finder ist eine einzelne statische Seite: kein Build-Schritt, kein Backend, kein Tracking, keine Cookies. Sie spricht direkt aus Ihrem Browser mit <a href="https://info.orcid.org/documentation/features/public-api/" target="_blank" rel="noreferrer">der öffentlichen ORCID-API</a> und mit <a href="https://ror.readme.io/" target="_blank" rel="noreferrer">der ROR-API</a>, sodass kein Server von uns je sieht, wonach Sie suchen. Diese beiden sind die einzigen Hosts, die die Seite kontaktiert. Gespeichert wird allein Ihre Sprach- und Designwahl, im Speicher Ihres eigenen Browsers.</p>' +
    '<p>Der Filtersatz stammt aus der Personalsuche eines Forschungsinformationssystems und wurde aus dessen Datenbank herausgelöst, damit dieselbe Suche auch ohne ein solches System möglich ist.</p>',
  'about.footer':
    'Erstellt von <a href="https://rijdho.github.io" target="_blank" rel="noreferrer">@rijdho</a> · AGPL-3.0-or-later · <a href="https://github.com/rijdho/orcid-finder" target="_blank" rel="noreferrer">Quellcode auf GitHub</a> · Daten von ORCID und ROR, genutzt gemäß deren Bedingungen für die öffentlichen APIs',
};
