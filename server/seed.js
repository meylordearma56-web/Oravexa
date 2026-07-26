const fs = require("fs");
const path = require("path");
const store = require("./store");

const DB_PATH = path.join(__dirname, "..", "data", "wiki.json");

const seedArticles = [
  {
    title: "Oravexa",
    categories: ["Help", "Meta"],
    author: "System",
    content: `# Welcome to Oravexa

**Oravexa** is a free, collaborative encyclopedia you can read and edit in your browser. Every article is written in Markdown, versioned automatically, and organized by categories.

## What you can do

- **Browse** featured and recently updated articles from the home page
- **Search** the full encyclopedia by title or content
- **Create** new articles and expand existing ones
- **Review history** and restore earlier revisions when needed
- Open a **random article** whenever you want a surprise

## Editing basics

Articles use Markdown:

\`\`\`
## Heading
**Bold** and *italic* text
[Links](Article_Title)
- Lists
\`\`\`

Link to other articles with wiki-style titles in the search box, or create a missing page from the Create page.

## Community spirit

Be clear, be curious, and cite what you know. Knowledge grows when many hands tend it.
`,
  },
  {
    title: "Solar System",
    categories: ["Astronomy", "Science"],
    author: "Nova",
    content: `# Solar System

The **Solar System** is the gravitationally bound system of the Sun and the objects that orbit it. It formed about 4.6 billion years ago from the gravitational collapse of a giant molecular cloud.

## Structure

At the center sits the **Sun**, a G-type main-sequence star that holds more than 99% of the system's mass. Around it orbit eight planets, dwarf planets, moons, asteroids, and comets.

### Inner planets

The rocky worlds closest to the Sun:

1. Mercury
2. Venus
3. Earth
4. Mars

### Outer planets

Beyond the asteroid belt lie the gas and ice giants:

1. Jupiter
2. Saturn
3. Uranus
4. Neptune

## The Kuiper Belt

Past Neptune stretches a disk of icy bodies known as the Kuiper Belt. Pluto, once counted as the ninth planet, is the most famous resident of this region.

## Exploration

Robotic probes such as Voyager, Cassini, and Perseverance have transformed our picture of neighboring worlds—from Saturn's rings to ancient riverbeds on Mars.
`,
  },
  {
    title: "JavaScript",
    categories: ["Computing", "Programming"],
    author: "Ada",
    content: `# JavaScript

**JavaScript** is a high-level, multi-paradigm programming language that powers interactive web pages and, increasingly, servers, mobile apps, and desktop tools.

## Origins

Created by Brendan Eich in 1995 for Netscape Navigator, JavaScript was standardized as **ECMAScript**. Today it runs in every major browser and on servers via runtimes such as Node.js.

## Core ideas

- **Dynamic typing** — values carry types, not variables
- **First-class functions** — functions are values you can pass and return
- **Prototypal inheritance** — objects inherit directly from other objects
- **Event loop** — asynchronous work is scheduled without blocking the main thread

## Modern JavaScript

ES modules, \`async\`/\`await\`, destructuring, and optional chaining make contemporary JavaScript expressive and readable:

\`\`\`js
const greet = async (name) => {
  const message = \`Hello, \${name ?? "world"}\`;
  return message;
};
\`\`\`

## Ecosystem

Package managers, bundlers, frameworks, and testing libraries form a vast ecosystem. From React UIs to Express APIs, JavaScript remains one of the most widely used languages on Earth.
`,
  },
  {
    title: "Photosynthesis",
    categories: ["Biology", "Science"],
    author: "Leaf",
    content: `# Photosynthesis

**Photosynthesis** is the process by which green plants, algae, and some bacteria convert light energy into chemical energy stored in sugars.

## The basic equation

In oxygenic photosynthesis:

> 6 CO₂ + 6 H₂O + light → C₆H₁₂O₆ + 6 O₂

Carbon dioxide and water become glucose and oxygen, with sunlight providing the energy.

## Where it happens

In plants, photosynthesis occurs mainly in **chloroplasts**, organelles packed with the green pigment **chlorophyll**. Leaves are optimized as solar collectors: broad surfaces, stomata for gas exchange, and dense chloroplast populations.

## Two stages

### Light-dependent reactions

Chlorophyll absorbs photons. Water is split, oxygen is released, and energy carriers (ATP and NADPH) are produced.

### Calvin cycle

ATP and NADPH drive the fixation of carbon dioxide into sugars in the stroma of the chloroplast.

## Why it matters

Photosynthesis fills the atmosphere with oxygen and forms the base of nearly every food web on the planet.
`,
  },
  {
    title: "Library of Alexandria",
    categories: ["History", "Culture"],
    author: "Clio",
    content: `# Library of Alexandria

The **Library of Alexandria** was one of the largest and most significant libraries of the ancient world. Founded in the Egyptian city of Alexandria during the reign of the Ptolemaic dynasty, it became a symbol of universal knowledge.

## Ambition

The library aimed to collect all the world's books. Ships docking at Alexandria were said to be searched for scrolls, which were copied for the collection—sometimes with the originals kept and copies returned.

## Scholars

Mathematicians, astronomers, poets, and physicians worked under its roof. Figures associated with the broader Mouseion community include Euclid, Eratosthenes, and Hypatia.

## Decline

The library's end was not a single cinematic fire. Centuries of political turmoil, budget cuts, and shifting priorities eroded its collections. What remains is a powerful idea: that knowledge should be gathered, shared, and preserved.

## Legacy

Modern libraries, archives, and collaborative encyclopedias inherit that Alexandrian dream—making the world's knowledge reachable to anyone who seeks it.
`,
  },
  {
    title: "Plate Tectonics",
    categories: ["Earth Science", "Science"],
    author: "Geo",
    content: `# Plate Tectonics

**Plate tectonics** is the scientific theory that Earth's outer shell is divided into rigid plates that move over the mantle. Their interactions shape continents, oceans, mountains, and earthquakes.

## The plates

Roughly a dozen major plates—and many smaller ones—tile the planet. Boundaries fall into three types:

- **Divergent** — plates pull apart; new crust forms (mid-ocean ridges)
- **Convergent** — plates collide; crust is recycled or crumpled into mountains
- **Transform** — plates slide past each other (like California's San Andreas Fault)

## Evidence

Fossil matches across oceans, magnetic striping on the seafloor, and GPS measurements of continental drift all support the theory. What Wegener once called *continental drift* became a unified model of Earth's dynamic surface.

## Living planet

Volcanoes rim the Pacific in the "Ring of Fire." The Himalayas rise as India continues to press into Asia. Plate tectonics explains why the ground beneath us is never entirely still.
`,
  },
  {
    title: "Jazz",
    categories: ["Music", "Culture"],
    author: "Blue",
    content: `# Jazz

**Jazz** is a music genre that originated in African American communities of New Orleans in the late 19th and early 20th centuries. It blends blues, ragtime, brass-band marches, and improvisation into a living art form.

## Hallmarks

- Syncopation and swing feel
- Blue notes and expressive tone
- Improvisation as conversation
- Call-and-response patterns

## Eras

From early Dixieland to swing big bands, bebop, cool jazz, free jazz, and fusion, each generation reinvented what jazz could be. Artists such as Louis Armstrong, Duke Ellington, Charlie Parker, Miles Davis, and John Coltrane redefined the vocabulary of modern music.

## Beyond the stage

Jazz shaped film scores, civil rights soundtracks, and global popular music. It remains a language of freedom—structured enough to share, open enough to surprise.
`,
  },
  {
    title: "Markdown",
    categories: ["Computing", "Help"],
    author: "System",
    content: `# Markdown

**Markdown** is a lightweight markup language for formatting plain text. Oravexa articles are written in Markdown so they stay easy to edit and pleasant to read.

## Common syntax

| You type | You get |
| --- | --- |
| \`# Heading\` | A top-level heading |
| \`**bold**\` | **bold** |
| \`*italic*\` | *italic* |
| \`[link](url)\` | A hyperlink |
| \`- item\` | A list item |

## Code blocks

Fenced code blocks use triple backticks:

\`\`\`
function hello() {
  return "world";
}
\`\`\`

## Tips for wiki editors

Keep the first paragraph clear and self-contained—it becomes the article summary. Use headings to structure long pages. Prefer short sections over walls of text.
`,
  },
];

function seed() {
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }

  const db = store.load();

  for (const article of seedArticles) {
    store.createArticle(db, article);
  }

  console.log(`Seeded ${seedArticles.length} articles → ${DB_PATH}`);
}

seed();
