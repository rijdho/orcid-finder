export const es = {
  'meta.description':
    'Busca en ORCID las cuentas que declaran una institución, por identificador ROR o por nombre de la organización, acota por cargo, fecha de inicio y nombramientos vigentes, y descarga el resultado en CSV o JSON.',

  'ui.brand.tagline': 'Encuentra las cuentas ORCID que declaran una institución',
  'ui.brand.source': 'código ↗',
  'ui.lede':
    'Indica un <b>identificador ROR</b> o el nombre de una organización y la herramienta lista las cuentas ORCID que declaran esa afiliación; después puedes acotar la lista por cargo, fecha de inicio y si el nombramiento sigue vigente. La tabla se descarga en <b>CSV</b> o <b>JSON</b>. Todo se ejecuta en tu navegador contra la API pública de ORCID: sin cuenta, sin clave y sin pasar por ningún servidor nuestro.',
  'ui.lang.aria': 'Idioma',
  'ui.theme.title': 'Cambiar entre tema claro y oscuro',
  'ui.theme.aria': 'Cambiar entre tema claro y oscuro',

  'form.legend.searchBy': 'Buscar por',
  'form.legend.narrow': 'Acotar el resultado',
  'form.legend.scope': 'Alcance',
  'form.byRor': 'Identificador ROR',
  'form.byName': 'Nombre de la organización',
  'form.rors.label': 'Identificador(es) ROR, separados por comas',
  'form.rors.ph': 'p. ej. 03yrm5c26, 05gq02987',
  'form.rors.hint':
    'Varios a la vez cubren una institución registrada como ROR matriz con entradas hijas para facultades o sedes: un registro puede declarar cualquiera de ellas.',
  'form.orgNames.label': 'Nombre(s) de la organización, separados por comas',
  'form.orgNames.ph': 'p. ej. Universidad de Chile, University of Chile',
  'form.orgNames.hint':
    'Se compara con lo que escribió la persona titular de la cuenta, así que conviene añadir grafías alternativas y la forma en el idioma local.',
  'form.roleTitles.label': 'El cargo contiene',
  'form.roleTitles.ph': 'profesor, postdoc (separados por comas)',
  'form.currentOnly': 'Solo nombramientos vigentes',
  'form.requireStartDate': 'Debe tener fecha de inicio',
  'form.employmentsHint':
    'Estos tres leen el registro de empleo de cada candidato en ORCID: una petición adicional por candidato, así que la búsqueda es más lenta pero mucho más precisa.',
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

  'how.title': 'Cómo funciona',
  'how.body':
    '<p>Dos puntos de acceso de la API pública de ORCID sostienen toda la herramienta, y cuál se ejecuta lo deciden los filtros que marques.</p>' +
    '<p>El <b>modo rápido</b> es una sola llamada a <code>expanded-search</code> que une tus criterios con OR en una única consulta. Devuelve nombres y los nombres de institución que ORCID ha indexado para cada cuenta, así que responde en segundos a quién declara esa afiliación, sea cual sea el tamaño del resultado.</p>' +
    '<p>El <b>modo completo</b> se activa en cuanto filtras por cargo, fecha de inicio o nombramientos vigentes. Esos tres campos solo existen dentro del documento <code>/employments</code> de cada registro, así que la herramienta lee uno por candidato. Eso es una petición HTTP por persona: preciso y proporcionalmente más lento.</p>' +
    '<p>Un candidato encontrado por ROR se conserva aunque el nombre de la institución en el registro esté escrito de otra manera, porque <code>expanded-search</code> devuelve esos nombres sin identificadores ROR por entrada. Descartarlos sería tirar justo los registros que el criterio ROR sirve para encontrar. Esas filas van marcadas como <b>solo ROR</b>.</p>' +
    '<p>Cada recuento de lo que descartó un filtro se atribuye al filtro que realmente lo descartó, de modo que un filtro que no hace nada se ve como un cero en lugar de quedar oculto tras otro anterior.</p>',

  'caveats.title': 'Limitaciones',
  'caveats.body':
    '<ul>' +
    '<li><b>ORCID es autodeclarado.</b> Un registro dice lo que escribió su titular. La plantilla real de una institución es mayor que lo que muestra ORCID y puede diferir en cargos, grafía y fechas.</li>' +
    '<li><b>La ausencia no es prueba.</b> Quien nunca añadió la afiliación, o no tiene ORCID, no puede aparecer aquí. Esto es una herramienta de descubrimiento, no un recuento de personal.</li>' +
    '<li><b>Los nombres se comparan como subcadenas.</b> «Chile» coincide con toda institución cuyo nombre lo contenga. El identificador ROR es el criterio preciso; el nombre es el recurso para registros sin ROR.</li>' +
    '<li><b>Solo se informa del primer empleo que cumple.</b> Quien tenga varios nombramientos en la misma institución aparece una vez, bajo el que pasó tus filtros.</li>' +
    '<li><b>Una fecha de fin parcial se lee en su instante más tardío.</b> «Terminado en 2026» cuenta como vigente durante todo 2026, para no eliminar en silencio a personal activo.</li>' +
    '<li><b>La API pública limita las peticiones.</b> Una ejecución grande en modo completo puede verse frenada; la herramienta espera y reintenta, e informa de cualquier registro que aun así no pudo leer.</li>' +
    '</ul>',

  'about.title': 'Acerca de',
  'about.body':
    '<p>orcid-finder es una única página estática: sin paso de compilación, sin backend, sin rastreo y sin cookies. Habla directamente desde tu navegador con <a href="https://info.orcid.org/documentation/features/public-api/" target="_blank" rel="noreferrer">la API pública de ORCID</a>, y por eso nadie salvo ORCID ve lo que escribes.</p>' +
    '<p>El conjunto de filtros procede del descubrimiento de personal de un sistema de información de investigación, extraído de su base de datos para que cualquiera pueda hacer la misma búsqueda sin necesidad de uno.</p>',
  'about.footer':
    'Creado por <a href="https://rijdho.github.io" target="_blank" rel="noreferrer">@rijdho</a> · Licencia MIT · <a href="https://github.com/rijdho/orcid-finder" target="_blank" rel="noreferrer">código en GitHub</a> · datos de ORCID, usados conforme a sus condiciones para la API pública',
};
