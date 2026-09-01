export const es = {
  'meta.description':
    'Busca en ORCID las cuentas que declaran una institución, por identificador ROR o por nombre de la organización, acota por cargo, fecha de inicio, nombramientos vigentes y quién declaró el registro, y descarga el resultado en CSV o JSON.',

  'ui.brand.tagline': 'Encuentra las cuentas ORCID que declaran una institución',
  'ui.brand.source': 'código ↗',
  'ui.lede':
    'Indica un <b>identificador ROR</b> o el nombre de una organización y la herramienta lista las cuentas ORCID que declaran esa afiliación; después puedes acotar la lista por palabra clave, cargo, departamento, país, fecha de inicio, si el nombramiento sigue vigente y si lo declaró una organización en lugar de la propia persona. La tabla se descarga en <b>CSV</b> o <b>JSON</b>. Todo se ejecuta en tu navegador contra las API públicas de ORCID y ROR: sin cuenta, sin clave y sin pasar por ningún servidor nuestro.',
  'ui.lang.aria': 'Idioma',
  'ui.theme.title': 'Cambiar entre tema claro y oscuro',
  'ui.theme.aria': 'Cambiar entre tema claro y oscuro',

  'form.byRor': 'Identificador ROR',
  'form.byName': 'Nombre de la organización',
  'form.rors.label': 'Identificador(es) ROR, separados por comas',
  'form.rors.ph': 'p. ej. 056d84691',
  'form.rors.hint':
    'Varios a la vez cubren una institución registrada como ROR matriz con entradas hijas para facultades o sedes: un registro puede declarar cualquiera de ellas. El identificador GRID que ROR guarda para cada uno se añade a la consulta automáticamente, porque ORCID indexa los dos por separado.',
  'form.orgNames.label': 'Nombre(s) de la organización, separados por comas',
  'form.orgNames.ph': 'p. ej. Karolinska Institutet',
  'form.orgNames.hint':
    'Se compara con lo que escribió la persona titular de la cuenta, así que conviene añadir grafías alternativas y la forma en el idioma local.',
  'form.roleTitles.label': 'El cargo contiene',
  'form.roleTitles.ph': 'profesor, postdoc (separados por comas)',
  'form.currentOnly': 'Solo nombramientos vigentes',
  'form.requireStartDate': 'Debe tener fecha de inicio',
  'form.employmentsHint':
    'Todo lo de esta columna lee el registro de empleo de cada candidato en ORCID: una petición adicional por candidato, así que la búsqueda es más lenta pero mucho más precisa. La exclusión de cargos ocurre aquí porque el lenguaje de consulta de ORCID no tiene negación.',
  'form.maxRows.label': 'Máximo de candidatos',
  'form.maxRows.hint':
    'Cuántas de las cuentas coincidentes se descargan y se examinan. ORCID las pagina de 100 en 100; aquí el techo es 1000.',
  'form.submit': 'Buscar en ORCID',
  'form.searching': 'Buscando…',
  'form.cancel': 'Cancelar',
  'form.reset': 'Restablecer',

  'err.noCriteria':
    'Elige al menos un criterio: un identificador ROR o un nombre de organización, con su casilla marcada.',
  'err.badRor':
    '«{id}» no es un identificador ROR válido (nueve caracteres que empiezan por 0, p. ej. 03jzk4720).',
  'err.failed':
    'La búsqueda falló. Es posible que la API pública de ORCID esté limitando las peticiones: inténtalo de nuevo en un minuto.',

  'status.searching': 'Consultando a ORCID…',
  'status.reading': 'Leyendo registros de empleo: {done} de {total}',

  'res.title': 'Resultados',
  'res.summary': 'Se conservan {kept} de {scanned} candidatos examinados.',
  'res.totalFound': 'ORCID informa de {total} cuentas coincidentes.',
  'res.mode.fast': 'modo rápido',
  'res.mode.full': 'modo completo',
  'res.aborted': 'Cancelado: abajo aparece lo examinado hasta ese momento.',
  'res.empty': 'Ninguna cuenta coincidió. Relaja algún filtro o revisa el identificador ROR.',
  'res.query': 'Consulta enviada a ORCID',

  'res.rorNames': 'También se comparó con los nombres que ROR registra para el identificador: {names}',
  'bd.title': 'Lo que descartaron los filtros',
  'bd.noOrgMatch': '{n} sin coincidencia de afiliación',
  'bd.noRoleMatch': '{n} el cargo no coincidió',
  'bd.noStartDate': '{n} sin fecha de inicio',
  'bd.pastEmployment': '{n} nombramiento ya terminado',
  'bd.unreachable': '{n} registro que no se pudo leer',

  'export.csv': 'Descargar CSV',
  'export.json': 'Descargar JSON',
  'export.hint': 'El archivo lleva todas las filas de la tabla, no la página en pantalla.',

  'col.orcid': 'ORCID iD',
  'col.name': 'Nombre',
  'col.role': 'Cargo',
  'col.department': 'Departamento',
  'col.organization': 'Organización',
  'col.start': 'Inicio',
  'col.end': 'Fin',
  'col.matched': 'Coincidencia por',

  'matched.name': 'nombre',
  'matched.ror_only': 'solo ROR',
  'matched.employment': 'empleo',
  'matched.ror_only.title':
    'ORCID coincidió con el identificador ROR, pero el nombre de la institución que figura está escrito de otra forma. Es normal y la coincidencia es real.',


  'nav.label': 'Vista',
  'nav.search': 'Búsqueda',
  'rail.cite': 'Citar esta herramienta',
  'rail.data': 'Datos de ORCID y ROR',
  'form.assertedOnly': 'Solo registros declarados por una organización',
  'bd.selfAsserted': '{n} solo autodeclarados',
  'col.asserted': 'Declarado por',
  'asserted.self': 'la persona',
  'asserted.organization': 'organización',
  'asserted.other': 'otra iD',
  'asserted.unknown': 'desconocido',
  'asserted.unknown.title':
    'El empleo no lleva fuente, así que no se puede decir quién lo escribió. Esto no significa que lo escribiera la propia persona.',
  'asserted.self.title':
    'La persona introdujo este empleo por su cuenta. Puede ser del todo exacto, pero fuera del registro no hay nada que lo respalde.',
  'asserted.organization.title':
    'El sistema de una organización miembro escribió este empleo en el registro, así que hay una segunda parte que lo respalda.',
  'asserted.other.title':
    'Otra iD de ORCID escribió este empleo, algo que ORCID permite mediante delegación en una persona de confianza.',

  'form.legend.institution': 'La institución',
  'form.legend.employment': 'El empleo',
  'form.legend.topic': 'Tema y alcance',
  'form.ringgolds.label': 'Identificador(es) Ringgold, separados por comas',
  'form.ringgolds.ph': 'p. ej. 27106',
  'form.ringgolds.hint':
    'ORCID indexa los identificadores Ringgold por separado, y el sistema de la propia institución suele estampar uno: añadirlo puede más que duplicar lo que ve la búsqueda. También es más grueso que un ROR y puede arrastrar organizaciones relacionadas, como un hospital universitario, así que revisa la columna de organización.',
  'form.status.label': 'Afiliación',
  'form.status.any': 'Cualquiera',
  'form.status.current': 'Vigente',
  'form.status.past': 'Pasada',
  'form.status.hint':
    'ORCID indexa vigente y pasada solo por el nombre de la organización, así que elegir una busca solo por nombre y los campos de identificador quedan fuera. Con «pasada» encuentras ex personal y egresados.',
  'form.keywords.label': 'Palabra(s) clave, separadas por comas',
  'form.keywords.ph': 'epidemiología, oncología',
  'form.keywords.hint':
    'Las palabras clave que cada persona pone en su propio registro ORCID. Varias se unen con O, y el conjunto acota la institución, así que esto responde a quién trabaja aquí en algo. Sale gratis: va en la misma consulta única.',
  'form.excludeRoleTitles.label': 'El cargo no debe contener',
  'form.excludeRoleTitles.ph': 'doctorando, estudiante',
  'form.departments.label': 'El departamento contiene',
  'form.departments.ph': 'medicina molecular',
  'form.countries.label': 'Código(s) de país',
  'form.countries.ph': 'SE, AT',
  'form.startFrom.label': 'Inicio desde',
  'form.startTo.label': 'Inicio hasta',
  'err.badRinggold': '«{id}» no es un identificador Ringgold válido. Son números simples, por ejemplo 27106.',
  'err.statusNeedsName':
    'Una búsqueda por vigente o pasada necesita un nombre de organización. ORCID indexa esas dos solo por el nombre, nunca por un identificador ROR, GRID o Ringgold.',
  'err.badStartRange': 'El rango de inicio va al revés: el primer año es posterior al último.',
  'bd.noCountryMatch': '{n} en otro país',
  'bd.noDepartmentMatch': '{n} el departamento no coincidió',
  'bd.roleExcluded': '{n} cargo excluido',
  'bd.startOutOfRange': '{n} inicio fuera del rango',
  'col.country': 'País',
  'how.title': 'Cómo funciona',
  'how.body':
    '<p>La herramienta usa dos puntos de acceso de la API pública de ORCID. Cuál de ellos se ejecuta lo deciden los filtros que marques.</p>' +
    '<p>El <b>modo rápido</b> es una sola llamada a <code>expanded-search</code> que une tus criterios con OR en una única consulta. Devuelve nombres y los nombres de institución que ORCID ha indexado para cada cuenta, así que responde en segundos a quién declara esa afiliación, sea cual sea el tamaño del resultado.</p>' +
    '<p>El <b>modo completo</b> se activa en cuanto filtras por cargo, fecha de inicio, nombramientos vigentes o quién declaró el registro. Esos campos solo existen dentro del documento <code>/employments</code> de cada registro, así que la herramienta lee uno por candidato. Eso es una petición HTTP por persona: preciso y proporcionalmente más lento.</p>' +
    '<p><b>Quién declaró el registro</b> es el campo que ORCID llama fuente. Un empleo que escribió la propia persona lleva su iD como fuente; uno escrito por el sistema de una organización miembro, típicamente la propia universidad, lleva ese cliente, y la tabla lo nombra. Se muestran ambos, porque la diferencia está entre una afirmación y una afirmación que respalda una segunda parte.</p>' +
    '<p>Un candidato encontrado por ROR se conserva aunque el nombre de la institución en el registro esté escrito de otra manera, porque <code>expanded-search</code> devuelve esos nombres sin identificadores ROR por entrada. Descartarlos sería tirar justo los registros que el criterio ROR sirve para encontrar. Esas filas van marcadas como <b>solo ROR</b>.</p>' +
    '<p><b>El identificador ROR por sí solo no basta</b> para reconocer un empleo. ORCID admite cualquier esquema de desambiguación, y los identificadores que escribe el sistema de la propia institución suelen ser RINGGOLD o FUNDREF en lugar de ROR, con lo que se caerían justo los registros declarados por la organización. Por eso cada identificador ROR se resuelve primero a los nombres que el registro guarda para él, y también se compara con esos. El resultado dice qué nombres usó. Los acrónimos registrados quedan fuera: una aguja de dos letras coincide con buena parte de ORCID.</p>' +
    '<p>Cada recuento de lo que descartó un filtro se atribuye al filtro que realmente lo descartó, de modo que un filtro que no hace nada se ve como un cero en lugar de quedar oculto tras otro anterior.</p>',

  'caveats.title': 'Limitaciones',
  'caveats.body':
    '<ul>' +
    '<li><b>El campo de correo nunca se muestra ni se exporta.</b> ORCID devuelve uno en los registros cuya titular o titular lo hizo público; esta herramienta lo descarta. Una lista de personas descargada son datos personales, y para qué se use es responsabilidad tuya: armar una lista de correo no debería ser el camino fácil.</li>' +
    '<li><b>ORCID es autodeclarado en su mayor parte.</b> Un registro suele decir lo que escribió su titular. La plantilla real de una institución es mayor que lo que muestra ORCID y puede diferir en cargos, grafía y fechas.</li>' +
    '<li><b>Un empleo declarado por una organización es evidencia, no prueba del presente.</b> Dice que el sistema de una organización miembro escribió la entrada en algún momento. No dice que el nombramiento siga vigente, ni que la organización que declara sea la empleadora: también declaran financiadores y agregadores nacionales, y por eso la tabla nombra la fuente.</li>' +
    '<li><b>El modo rápido no informa de ninguna fuente.</b> Quién declaró un empleo vive en el registro de empleo, así que la columna queda vacía hasta que un filtro lo abre. Vacío significa desconocido, nunca autodeclarado.</li>' +
    '<li><b>La ausencia no es prueba.</b> Quien nunca añadió la afiliación, o no tiene ORCID, no puede aparecer aquí. Esto es una herramienta de descubrimiento, no un recuento de personal.</li>' +
    '<li><b>Los nombres se comparan como subcadenas.</b> «Chile» coincide con toda institución cuyo nombre lo contenga. El identificador ROR es el criterio preciso; el nombre es el recurso para registros sin ROR.</li>' +
    '<li><b>Solo se informa del primer empleo que cumple.</b> Quien tenga varios nombramientos en la misma institución aparece una vez, bajo el que pasó tus filtros.</li>' +
    '<li><b>Una fecha de fin parcial se lee en su instante más tardío.</b> «Terminado en 2026» cuenta como vigente durante todo 2026, para no eliminar en silencio a personal activo.</li>' +
    '<li><b>La API pública limita las peticiones.</b> Una ejecución grande en modo completo puede verse frenada; la herramienta espera y reintenta, e informa de cualquier registro que aun así no pudo leer.</li>' +
    '</ul>',

  'about.title': 'Acerca de',
  'about.body':
    '<p>orcid-finder es una única página estática: sin paso de compilación, sin backend, sin rastreo y sin cookies. Habla directamente desde tu navegador con <a href="https://info.orcid.org/documentation/features/public-api/" target="_blank" rel="noreferrer">la API pública de ORCID</a> y con <a href="https://ror.readme.io/" target="_blank" rel="noreferrer">la API de ROR</a>, así que ningún servidor nuestro ve nunca lo que buscas. Esos dos son los únicos hosts con los que contacta la página. Lo único que guarda es tu elección de idioma y de tema, en el almacenamiento de tu propio navegador.</p>' +
    '<p>El conjunto de filtros procede del descubrimiento de personal de un sistema de información de investigación, extraído de su base de datos para que cualquiera pueda hacer la misma búsqueda sin necesidad de uno.</p>',
  'about.footer':
    'Creado por <a href="https://rijdho.github.io" target="_blank" rel="noreferrer">@rijdho</a> · AGPL-3.0-or-later · <a href="https://github.com/rijdho/orcid-finder" target="_blank" rel="noreferrer">código en GitHub</a> · datos de ORCID y ROR, usados conforme a sus condiciones para las API públicas',
};
