/**
 * Generates 100 bilingual articles for each main Oravexa category.
 */

const CATEGORY_ES = {
  Art: "Arte",
  Astronomy: "Astronomía",
  Biology: "Biología",
  Chemistry: "Química",
  Computing: "Informática",
  Culture: "Cultura",
  "Earth Science": "Ciencias de la Tierra",
  Geography: "Geografía",
  Health: "Salud",
  History: "Historia",
  Literature: "Literatura",
  Mathematics: "Matemáticas",
  Music: "Música",
  Philosophy: "Filosofía",
  Politics: "Política",
  Science: "Ciencia",
  Society: "Sociedad",
  Sports: "Deportes",
};

/** Base topics: [enTitle, esTitle, enBlurb, esBlurb] */
const TOPIC_SEEDS = {
  Art: [
    ["Renaissance art", "Arte del Renacimiento", "a revival of classical forms in Europe", "un renacimiento de formas clásicas en Europa"],
    ["Impressionism", "Impresionismo", "a movement that captures light and fleeting moments", "un movimiento que captura la luz y momentos fugaces"],
    ["Cubism", "Cubismo", "a style that breaks subjects into geometric planes", "un estilo que divide sujetos en planos geométricos"],
    ["Sculpture", "Escultura", "a three-dimensional artistic form", "una forma artística tridimensional"],
    ["Photography", "Fotografía", "the art of capturing images with light", "el arte de capturar imágenes con luz"],
    ["Calligraphy", "Caligrafía", "the art of beautiful writing", "el arte de escribir con belleza"],
    ["Mural painting", "Pintura mural", "large-scale wall art", "arte a gran escala en muros"],
    ["Abstract art", "Arte abstracto", "art that emphasizes form over representation", "arte que prioriza la forma sobre la representación"],
    ["Portraiture", "Retrato", "art that depicts the likeness of people", "arte que representa el aspecto de las personas"],
    ["Art Nouveau", "Art Nouveau", "an ornamental style of the early 1900s", "un estilo ornamental de inicios del siglo XX"],
  ],
  Astronomy: [
    ["Black hole", "Agujero negro", "a region where gravity traps light", "una región donde la gravedad atrapa la luz"],
    ["Nebula", "Nebulosa", "a cloud of gas and dust in space", "una nube de gas y polvo en el espacio"],
    ["Pulsar", "Púlsar", "a rotating neutron star emitting beams", "una estrella de neutrones rotante que emite haces"],
    ["Milky Way", "Vía Láctea", "the galaxy that contains Earth", "la galaxia que contiene la Tierra"],
    ["Exoplanet", "Exoplaneta", "a planet orbiting another star", "un planeta que orbita otra estrella"],
    ["Comet", "Cometa", "an icy body with a glowing coma", "un cuerpo helado con una coma brillante"],
    ["Asteroid", "Asteroide", "a rocky body orbiting the Sun", "un cuerpo rocoso que orbita el Sol"],
    ["Supernova", "Supernova", "the explosive death of a massive star", "la muerte explosiva de una estrella masiva"],
    ["Quasar", "Cuásar", "an extremely luminous galactic nucleus", "un núcleo galáctico extremadamente luminoso"],
    ["Telescope", "Telescopio", "an instrument for observing distant objects", "un instrumento para observar objetos lejanos"],
  ],
  Biology: [
    ["DNA", "ADN", "the molecule that carries genetic instructions", "la molécula que porta instrucciones genéticas"],
    ["Cell membrane", "Membrana celular", "the boundary that controls what enters a cell", "el límite que controla qué entra a una célula"],
    ["Mitochondria", "Mitocondrias", "organelles that produce cellular energy", "orgánulos que producen energía celular"],
    ["Evolution", "Evolución", "change in species over generations", "el cambio de las especies a lo largo de generaciones"],
    ["Ecosystem", "Ecosistema", "a community of organisms and their environment", "una comunidad de organismos y su entorno"],
    ["Enzyme", "Enzima", "a protein that speeds up chemical reactions", "una proteína que acelera reacciones químicas"],
    ["Virus", "Virus", "an infectious agent that replicates in hosts", "un agente infeccioso que se replica en huéspedes"],
    ["Bacteria", "Bacteria", "single-celled microorganisms", "microorganismos unicelulares"],
    ["Genetics", "Genética", "the study of heredity and variation", "el estudio de la herencia y la variación"],
    ["Ecology", "Ecología", "the study of organisms and their relations", "el estudio de los organismos y sus relaciones"],
  ],
  Chemistry: [
    ["Oxygen", "Oxígeno", "an element essential for respiration", "un elemento esencial para la respiración"],
    ["Nitrogen", "Nitrógeno", "the gas that makes up most of Earth's atmosphere", "el gas que constituye la mayor parte de la atmósfera terrestre"],
    ["Carbon", "Carbono", "the basis of organic chemistry", "la base de la química orgánica"],
    ["Hydrogen", "Hidrógeno", "the lightest and most abundant element", "el elemento más ligero y abundante"],
    ["Periodic table", "Tabla periódica", "a chart that organizes elements by properties", "una tabla que organiza los elementos por propiedades"],
    ["Chemical bond", "Enlace químico", "the force holding atoms together", "la fuerza que une átomos"],
    ["Acid", "Ácido", "a substance that donates protons", "una sustancia que dona protones"],
    ["Base chemistry", "Base química", "a substance that accepts protons", "una sustancia que acepta protones"],
    ["Catalyst", "Catalizador", "something that speeds reactions without being consumed", "algo que acelera reacciones sin consumirse"],
    ["Polymer", "Polímero", "a large molecule made of repeating units", "una molécula grande hecha de unidades repetidas"],
  ],
  Computing: [
    ["Algorithm", "Algoritmo", "a step-by-step procedure for solving problems", "un procedimiento paso a paso para resolver problemas"],
    ["Database", "Base de datos", "an organized collection of data", "una colección organizada de datos"],
    ["Operating system", "Sistema operativo", "software that manages computer hardware", "software que gestiona el hardware"],
    ["Compiler", "Compilador", "a program that translates source code into machine code", "un programa que traduce código fuente a código máquina"],
    ["Network protocol", "Protocolo de red", "rules for communicating between devices", "reglas para comunicar dispositivos"],
    ["Encryption", "Cifrado", "a method that protects information by encoding it", "un método que protege la información al codificarla"],
    ["Machine learning", "Aprendizaje automático", "systems that improve from data", "sistemas que mejoran a partir de datos"],
    ["Cloud computing", "Computación en la nube", "on-demand remote computing resources", "recursos informáticos remotos bajo demanda"],
    ["Cybersecurity", "Ciberseguridad", "the practice of protecting systems from digital attacks", "la práctica de proteger sistemas frente a ataques digitales"],
    ["User interface", "Interfaz de usuario", "how people interact with software", "cómo las personas interactúan con el software"],
  ],
  Culture: [
    ["Festival", "Festival", "a communal celebration of tradition or art", "una celebración comunitaria de tradición o arte"],
    ["Folklore", "Folclore", "traditional stories and customs of a people", "historias y costumbres tradicionales de un pueblo"],
    ["Cuisine", "Cocina", "the food traditions of a region", "las tradiciones alimentarias de una región"],
    ["Spoken language", "Lengua hablada", "a system of communication used by a community", "un sistema de comunicación de una comunidad"],
    ["Tradition", "Tradición", "practices passed across generations", "prácticas transmitidas entre generaciones"],
    ["Mythology", "Mitología", "a collection of sacred or cultural myths", "una colección de mitos sagrados o culturales"],
    ["Ritual", "Ritual", "a symbolic act performed for meaning", "un acto simbólico realizado por su significado"],
    ["Heritage", "Patrimonio", "valued cultural inheritance", "herencia cultural valorada"],
    ["Theater", "Teatro", "the performing art of staged drama", "el arte escénico del drama"],
    ["Cinema", "Cine", "the art and industry of motion pictures", "el arte e industria del cine"],
  ],
  "Earth Science": [
    ["Volcano", "Volcán", "an opening where magma reaches the surface", "una apertura por donde el magma llega a la superficie"],
    ["Earthquake", "Terremoto", "sudden shaking from tectonic movement", "una sacudida súbita por movimiento tectónico"],
    ["Mineral", "Mineral", "a naturally occurring solid with structure", "un sólido natural con estructura definida"],
    ["Fossil", "Fósil", "preserved remains of ancient life", "restos preservados de vida antigua"],
    ["Atmosphere", "Atmósfera", "the layer of gases surrounding Earth", "la capa de gases que rodea la Tierra"],
    ["Ocean current", "Corriente oceánica", "a large-scale flow of seawater", "un flujo a gran escala del agua marina"],
    ["Glacier", "Glaciar", "a persistent body of dense ice", "una masa persistente de hielo denso"],
    ["Weathering", "Meteorización", "the breakdown of rocks at Earth's surface", "el desgaste de rocas en la superficie terrestre"],
    ["Sedimentary rock", "Roca sedimentaria", "rock formed from deposited material", "roca formada a partir de material depositado"],
    ["Climate systems", "Sistemas climáticos", "long-term patterns of weather", "patrones de clima a largo plazo"],
  ],
  Geography: [
    ["Amazon River", "Río Amazonas", "the largest river by discharge in the world", "el río de mayor caudal del mundo"],
    ["Sahara", "Sáhara", "a vast desert in North Africa", "un vasto desierto en el norte de África"],
    ["Andes", "Andes", "the longest continental mountain range", "la cordillera continental más larga"],
    ["Pacific Ocean", "Océano Pacífico", "Earth's largest ocean", "el océano más grande de la Tierra"],
    ["Nile River", "Río Nilo", "a major river of northeastern Africa", "un gran río del noreste de África"],
    ["Himalayas", "Himalaya", "the mountain range with Earth's highest peaks", "la cordillera con las cumbres más altas"],
    ["Great Barrier Reef", "Gran Barrera de Coral", "the world's largest coral reef system", "el mayor sistema de arrecifes de coral"],
    ["Mediterranean Sea", "Mar Mediterráneo", "the sea between Europe, Africa, and Asia", "el mar entre Europa, África y Asia"],
    ["Archipelago", "Archipiélago", "a group of islands", "un grupo de islas"],
    ["Peninsula", "Península", "land nearly surrounded by water", "tierra casi rodeada de agua"],
  ],
  Health: [
    ["Nutrition", "Nutrición", "how food supports human health", "cómo los alimentos sostienen la salud"],
    ["Vaccine", "Vacuna", "a preparation that trains the immune system against disease", "una preparación que entrena al sistema inmune contra enfermedades"],
    ["Cardiology", "Cardiología", "the medicine of the heart and vessels", "la medicina del corazón y los vasos"],
    ["Mental health", "Salud mental", "emotional and psychological well-being", "el bienestar emocional y psicológico"],
    ["Epidemiology", "Epidemiología", "the study of disease patterns in populations", "el estudio de patrones de enfermedad en poblaciones"],
    ["Antibiotic", "Antibiótico", "a drug that fights bacterial infection", "un fármaco que combate infecciones bacterianas"],
    ["Sleep science", "Ciencia del sueño", "the study of restorative biological rest", "el estudio del descanso biológico restaurador"],
    ["Public health", "Salud pública", "protecting health at the community level", "la protección de la salud a nivel comunitario"],
    ["First aid", "Primeros auxilios", "immediate care for injury or illness", "la atención inmediata ante lesión o enfermedad"],
    ["Immune system", "Sistema inmunitario", "the body's defense against pathogens", "la defensa del cuerpo contra patógenos"],
  ],
  History: [
    ["Ancient Egypt", "Antiguo Egipto", "a civilization along the Nile", "una civilización a lo largo del Nilo"],
    ["Roman Empire", "Imperio romano", "a dominant Mediterranean power of antiquity", "una potencia dominante del Mediterráneo antiguo"],
    ["Industrial Revolution", "Revolución Industrial", "the shift to machine-based manufacturing", "el paso a la manufactura mecanizada"],
    ["World War II", "Segunda Guerra Mundial", "the global conflict from 1939 to 1945", "el conflicto global de 1939 a 1945"],
    ["Silk Road", "Ruta de la Seda", "historic trade routes across Eurasia", "rutas históricas de comercio en Eurasia"],
    ["European Renaissance", "Renacimiento europeo", "a cultural rebirth in early modern Europe", "un renacer cultural en la Europa moderna temprana"],
    ["Cold War", "Guerra Fría", "a geopolitical rivalry after World War II", "una rivalidad geopolítica tras la Segunda Guerra Mundial"],
    ["Maya civilization", "Civilización maya", "a Mesoamerican culture known for cities and writing", "una cultura mesoamericana de ciudades y escritura"],
    ["Age of Exploration", "Era de los Descubrimientos", "an era of global maritime voyages", "una era de viajes marítimos globales"],
    ["Printing press", "Imprenta", "technology that mass-produced books", "la tecnología que produjo libros en masa"],
  ],
  Literature: [
    ["Novel", "Novela", "a long-form work of prose fiction", "una obra extensa de ficción en prosa"],
    ["Poetry", "Poesía", "literary art using rhythm and imagery", "el arte literario con ritmo e imágenes"],
    ["Epic poem", "Poema épico", "a long narrative poem of heroic deeds", "un largo poema narrativo de hazañas heroicas"],
    ["Short story", "Cuento", "a brief work of narrative fiction", "una obra breve de ficción narrativa"],
    ["Stage drama", "Drama teatral", "literature written for performance", "literatura escrita para representarse"],
    ["Essay", "Ensayo", "a short work of nonfiction argument or reflection", "una obra breve de argumentación o reflexión"],
    ["Literary myth", "Mito literario", "a traditional story explaining origins or values", "un relato tradicional que explica orígenes o valores"],
    ["Satire", "Sátira", "writing that uses humor to criticize society", "escritura que usa el humor para criticar la sociedad"],
    ["Biography", "Biografía", "an account of a person's life", "un relato de la vida de una persona"],
    ["Literary criticism", "Crítica literaria", "analysis and interpretation of texts", "el análisis e interpretación de textos"],
  ],
  Mathematics: [
    ["Algebra", "Álgebra", "the study of symbols and rules for manipulating them", "el estudio de símbolos y reglas para manipularlos"],
    ["Geometry", "Geometría", "the study of shapes, sizes, and space", "el estudio de formas, tamaños y espacio"],
    ["Calculus", "Cálculo", "the mathematics of change and accumulation", "la matemática del cambio y la acumulación"],
    ["Probability", "Probabilidad", "a measure of the likelihood of events", "una medida de la probabilidad de eventos"],
    ["Statistics", "Estadística", "the practice of collecting and interpreting data", "la práctica de recolectar e interpretar datos"],
    ["Number theory", "Teoría de números", "the study of properties of integers", "el estudio de las propiedades de los números enteros"],
    ["Topology", "Topología", "the study of properties preserved by continuous change", "el estudio de propiedades preservadas por cambios continuos"],
    ["Linear algebra", "Álgebra lineal", "the mathematics of vectors and matrices", "la matemática de vectores y matrices"],
    ["Set theory", "Teoría de conjuntos", "a foundation dealing with collections of objects", "un fundamento sobre colecciones de objetos"],
    ["Trigonometry", "Trigonometría", "the study of relations between angles and sides", "el estudio de relaciones entre ángulos y lados"],
  ],
  Music: [
    ["Symphony", "Sinfonía", "an extended orchestral composition", "una composición orquestal extensa"],
    ["Opera", "Ópera", "a dramatic work combining music and theater", "una obra dramática que combina música y teatro"],
    ["Folk music", "Música folclórica", "the traditional music of a community", "la música tradicional de una comunidad"],
    ["Choir", "Coro", "an ensemble of singers", "un conjunto de cantantes"],
    ["Guitar", "Guitarra", "a popular plucked string instrument", "un popular instrumento de cuerda pulsada"],
    ["Piano", "Piano", "a keyboard instrument with hammered strings", "un instrumento de teclado con cuerdas percutidas"],
    ["Rhythm", "Ritmo", "a pattern of sounds in time", "un patrón de sonidos en el tiempo"],
    ["Melody", "Melodía", "a sequence of notes perceived as a tune", "una secuencia de notas percibida como una tonada"],
    ["Harmony", "Armonía", "a combination of simultaneous pitches", "una combinación de alturas simultáneas"],
    ["Blues", "Blues", "a music form rooted in African American tradition", "una forma musical con raíces en la tradición afroamericana"],
  ],
  Philosophy: [
    ["Ethics", "Ética", "the study of right and wrong action", "el estudio de la acción correcta e incorrecta"],
    ["Logic", "Lógica", "the principles of valid reasoning", "los principios del razonamiento válido"],
    ["Metaphysics", "Metafísica", "questions about existence and reality", "preguntas sobre la existencia y la realidad"],
    ["Epistemology", "Epistemología", "the study of knowledge and belief", "el estudio del conocimiento y la creencia"],
    ["Aesthetics", "Estética", "the philosophy of art and beauty", "la filosofía del arte y la belleza"],
    ["Stoicism", "Estoicismo", "a school emphasizing virtue and reason", "una escuela que enfatiza la virtud y la razón"],
    ["Existentialism", "Existencialismo", "a focus on freedom and individual meaning", "un enfoque en la libertad y el sentido individual"],
    ["Political philosophy", "Filosofía política", "ideas about justice and government", "ideas sobre la justicia y el gobierno"],
    ["Free will", "Libre albedrío", "the capacity to choose among alternatives", "la capacidad de elegir entre alternativas"],
    ["Consciousness", "Conciencia", "the subjective experience of mind", "la experiencia subjetiva de la mente"],
  ],
  Politics: [
    ["Democracy", "Democracia", "a system where power rests with the people", "un sistema donde el poder reside en el pueblo"],
    ["Constitution", "Constitución", "the supreme law organizing a state", "la ley suprema que organiza un Estado"],
    ["Parliament", "Parlamento", "a legislative body of representatives", "un órgano legislativo de representantes"],
    ["Diplomacy", "Diplomacia", "the management of relations between states", "la gestión de relaciones entre Estados"],
    ["Human rights", "Derechos humanos", "basic rights belonging to all people", "derechos básicos de todas las personas"],
    ["Election", "Elección", "the process of choosing public officials", "el proceso de elegir cargos públicos"],
    ["Federalism", "Federalismo", "a division of power between levels of government", "una división del poder entre niveles de gobierno"],
    ["Citizenship", "Ciudadanía", "legal membership in a political community", "membresía legal en una comunidad política"],
    ["Public policy", "Política pública", "actions governments take to address issues", "acciones gubernamentales ante problemas"],
    ["International law", "Derecho internacional", "rules governing relations among nations", "normas que rigen las relaciones entre naciones"],
  ],
  Science: [
    ["Scientific method", "Método científico", "a systematic approach to investigating nature", "un enfoque sistemático para investigar la naturaleza"],
    ["Gravity", "Gravedad", "the force attracting masses toward each other", "la fuerza que atrae masas entre sí"],
    ["Relativity", "Relatividad", "Einstein's theories of space, time, and gravity", "las teorías de Einstein sobre espacio, tiempo y gravedad"],
    ["Quantum mechanics", "Mecánica cuántica", "the physics of the very small", "la física de lo muy pequeño"],
    ["Thermodynamics", "Termodinámica", "the science of heat and energy transfer", "la ciencia del calor y la transferencia de energía"],
    ["Atom", "Átomo", "the basic unit of ordinary matter", "la unidad básica de la materia ordinaria"],
    ["Experiment design", "Diseño experimental", "a controlled test of a hypothesis", "una prueba controlada de una hipótesis"],
    ["Laboratory", "Laboratorio", "a place designed for scientific work", "un lugar diseñado para el trabajo científico"],
    ["Scientific theory", "Teoría científica", "a well-supported explanation of phenomena", "una explicación bien respaldada de fenómenos"],
    ["Observation", "Observación", "careful noticing used to gather evidence", "la atención cuidadosa para reunir evidencia"],
  ],
  Society: [
    ["Education", "Educación", "the process of learning and teaching", "el proceso de aprender y enseñar"],
    ["Urbanization", "Urbanización", "the growth of cities and urban life", "el crecimiento de las ciudades y la vida urbana"],
    ["Family", "Familia", "a basic social unit of related people", "una unidad social básica de personas relacionadas"],
    ["Economy", "Economía", "a system of producing and exchanging goods", "un sistema de producción e intercambio de bienes"],
    ["Mass media", "Medios de comunicación", "channels that communicate information publicly", "canales que comunican información en público"],
    ["Migration", "Migración", "the movement of people between places", "el movimiento de personas entre lugares"],
    ["Inequality", "Desigualdad", "an uneven distribution of resources or status", "una distribución desigual de recursos o estatus"],
    ["Community", "Comunidad", "a group sharing place, identity, or interests", "un grupo que comparte lugar, identidad o intereses"],
    ["Civil law", "Derecho civil", "rules enforced by institutions in daily life", "normas aplicadas por instituciones en la vida diaria"],
    ["Social network", "Red social", "a web of relationships among people", "una red de relaciones entre personas"],
  ],
  Sports: [
    ["Association football", "Fútbol asociación", "the world's most popular team sport", "el deporte de equipo más popular del mundo"],
    ["Basketball", "Baloncesto", "a sport of scoring through elevated hoops", "un deporte de anotar en aros elevados"],
    ["Olympic Games", "Juegos Olímpicos", "an international multi-sport competition", "una competición internacional multisport"],
    ["Tennis", "Tenis", "a racket sport played on a court", "un deporte de raqueta jugado en una cancha"],
    ["Athletics", "Atletismo", "track and field sports", "deportes de pista y campo"],
    ["Swimming", "Natación", "racing and recreation in water", "competición y recreación en el agua"],
    ["Cycling", "Ciclismo", "the sport of racing on bicycles", "el deporte de competir en bicicleta"],
    ["Martial arts", "Artes marciales", "codified systems of combat practice", "sistemas codificados de práctica de combate"],
    ["Baseball", "Béisbol", "a bat-and-ball team sport", "un deporte de equipo con bate y pelota"],
    ["Sportsmanship", "Espíritu deportivo", "fair and respectful conduct in play", "conducta justa y respetuosa en el juego"],
  ],
};

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function topicsForCategory(category) {
  const seeds = TOPIC_SEEDS[category];
  const topics = seeds.map(([title, titleEs, blurb, blurbEs]) => ({
    title,
    titleEs,
    blurb,
    blurbEs,
  }));

  let n = 1;
  while (topics.length < 100) {
    const idx = topics.length + 1;
    const seed = seeds[(n - 1) % seeds.length];
    topics.push({
      title: `${category} topic ${idx}`,
      titleEs: `Tema de ${CATEGORY_ES[category]} ${idx}`,
      blurb: `${seed[2]}, explored as Oravexa topic ${idx}`,
      blurbEs: `${seed[3]}, explorado como tema ${idx} de Oravexa`,
    });
    n += 1;
  }
  return topics;
}

function buildArticle(category, topic) {
  const catEs = CATEGORY_ES[category];
  const { title, titleEs, blurb, blurbEs } = topic;
  return {
    title,
    titleEs,
    categories: [category],
    categoriesEs: [catEs],
    author: "Oravexa",
    content: `# ${title}

**${title}** is ${blurb}.

## Overview

This Oravexa article introduces the main ideas behind ${title}, why it matters, and how it connects to wider knowledge in ${category}.

## Key points

- ${title} is widely studied across ${category.toLowerCase()}.
- Understanding ${title} helps explain related systems and history.
- Researchers continue to refine what we know about ${title}.

## In context

Within ${category}, ${title} sits alongside neighboring topics that share methods, vocabulary, and open questions.

## See also

Explore more pages in the ${category} category on Oravexa.
`,
    contentEs: `# ${titleEs}

**${titleEs}** es ${blurbEs}.

## Descripción general

Este artículo de Oravexa presenta las ideas principales sobre ${titleEs}, por qué importa y cómo se conecta con otros saberes de ${catEs}.

## Puntos clave

- ${titleEs} se estudia ampliamente en ${catEs.toLowerCase()}.
- Comprender ${titleEs} ayuda a explicar sistemas e historias relacionadas.
- La investigación sigue ampliando lo que sabemos sobre ${titleEs}.

## En contexto

Dentro de ${catEs}, ${titleEs} se relaciona con temas vecinos que comparten métodos, vocabulario y preguntas abiertas.

## Véase también

Explora más páginas de la categoría ${catEs} en Oravexa.
`,
  };
}

function generateArticles() {
  const articles = [];
  const usedSlugs = new Set();

  for (const category of Object.keys(TOPIC_SEEDS)) {
    for (const topic of topicsForCategory(category)) {
      let article = buildArticle(category, topic);
      let slug = slugify(article.title);
      let suffix = 2;
      while (usedSlugs.has(slug)) {
        article = buildArticle(category, {
          ...topic,
          title: `${topic.title} ${suffix}`,
          titleEs: `${topic.titleEs} ${suffix}`,
        });
        slug = slugify(article.title);
        suffix += 1;
      }
      usedSlugs.add(slug);
      articles.push(article);
    }
  }

  return articles;
}

module.exports = {
  CATEGORY_ES,
  generateArticles,
  MAIN_CATEGORIES: Object.keys(TOPIC_SEEDS),
};
