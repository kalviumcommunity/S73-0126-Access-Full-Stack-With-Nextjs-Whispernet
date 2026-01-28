// lib/textbookData.ts
// Static textbook data with proper descriptions and chapter content

export interface Chapter {
  id: number;
  title: string;
  content: string;
  duration: string; // e.g., "15 min read"
}

export interface Textbook {
  id: number;
  subject: string;
  title: string;
  description: string;
  grade: string;
  rating: number;
  downloads: number;
  chapters: Chapter[];
  color: {
    bg: string;
    shadow: string;
  };
}

export const textbooks: Textbook[] = [
  {
    id: 1,
    subject: "Mathematics",
    title: "Fundamentals of Algebra",
    description:
      "Master the basics of algebraic expressions, equations, and problem-solving techniques. Perfect for building a strong mathematical foundation.",
    grade: "Grade 6-8",
    rating: 4.8,
    downloads: 1234,
    color: {
      bg: "from-emerald-400 to-teal-500",
      shadow: "shadow-emerald-500/30",
    },
    chapters: [
      {
        id: 1,
        title: "Introduction to Variables",
        duration: "12 min read",
        content: `# Introduction to Variables

## What is a Variable?
A **variable** is a symbol (usually a letter) that represents an unknown number or value. Think of it as a container that can hold different numbers.

### Common Variable Letters
- **x** and **y** are the most commonly used variables
- **a**, **b**, **c** are used for constants
- **n** is often used for counting numbers

## Why Do We Use Variables?
Variables help us:
1. Write general rules that work for many numbers
2. Solve problems where we don't know the answer yet
3. Create formulas we can use again and again

### Example 1: Simple Expression
If you have 5 apples and someone gives you more apples, we can write:
- **Total apples = 5 + x**
- Here, **x** represents the number of apples you received

### Example 2: Age Problem
If Ravi is 3 years older than Priya:
- Let Priya's age = **p**
- Then Ravi's age = **p + 3**

## Practice Problems
1. Write an expression for "a number increased by 7"
2. If a pencil costs ₹5, write an expression for the cost of 'n' pencils
3. Express "twice a number decreased by 4"

## Key Takeaways
- Variables are letters that represent numbers
- We use variables when we don't know the exact value
- Variables make math more flexible and powerful!`,
      },
      {
        id: 2,
        title: "Algebraic Expressions",
        duration: "15 min read",
        content: `# Algebraic Expressions

## What is an Algebraic Expression?
An **algebraic expression** is a combination of numbers, variables, and mathematical operations (+, -, ×, ÷).

### Parts of an Expression
- **Terms**: Parts separated by + or - signs
- **Coefficient**: The number multiplied with a variable
- **Constant**: A number without any variable

### Example: 3x + 5y - 7
| Part | Name |
|------|------|
| 3x | First term |
| 5y | Second term |
| 7 | Constant term |
| 3 | Coefficient of x |
| 5 | Coefficient of y |

## Types of Expressions
1. **Monomial**: One term (e.g., 5x, 3y²)
2. **Binomial**: Two terms (e.g., x + 5, 2a - 3b)
3. **Trinomial**: Three terms (e.g., x² + 2x + 1)
4. **Polynomial**: Many terms

## Simplifying Expressions
Combine **like terms** (terms with the same variable and power):
- 3x + 5x = 8x
- 2y - y = y
- 4a + 3b - 2a + b = 2a + 4b

## Practice Problems
1. Identify the terms in: 4x² - 3x + 7
2. Simplify: 5m + 3n - 2m + n
3. Write the coefficient of x in: 9x - 4

## Summary
- Expressions combine numbers, variables, and operations
- Like terms can be combined
- Practice identifying parts of expressions!`,
      },
      {
        id: 3,
        title: "Solving Linear Equations",
        duration: "20 min read",
        content: `# Solving Linear Equations

## What is an Equation?
An **equation** is a mathematical statement that shows two expressions are equal, using the "=" sign.

### Example
- 2x + 5 = 13 is an equation
- x = 4 is the **solution** (because 2(4) + 5 = 13 ✓)

## Golden Rule of Equations
Whatever you do to one side, you must do to the other side!

## Steps to Solve
1. **Simplify** both sides if needed
2. **Move** variable terms to one side
3. **Move** constant terms to the other side
4. **Divide** to find the variable value

### Detailed Example
Solve: 3x + 7 = 22

**Step 1**: Subtract 7 from both sides
- 3x + 7 - 7 = 22 - 7
- 3x = 15

**Step 2**: Divide both sides by 3
- 3x ÷ 3 = 15 ÷ 3
- x = 5

**Check**: 3(5) + 7 = 15 + 7 = 22 ✓

## Word Problems
**Problem**: The sum of a number and 12 is 35. Find the number.

**Solution**:
- Let the number be x
- Equation: x + 12 = 35
- x = 35 - 12 = 23
- The number is **23**

## Practice Problems
1. Solve: 4x - 9 = 15
2. Solve: 2(x + 3) = 14
3. A number multiplied by 5 and then increased by 3 gives 28. Find it.

## Remember
- Always check your answer by substituting back
- Keep the equation balanced!`,
      },
    ],
  },
  {
    id: 2,
    subject: "Science",
    title: "Understanding Our Environment",
    description:
      "Explore the natural world around us - from ecosystems and biodiversity to environmental conservation and sustainable practices.",
    grade: "Grade 5-7",
    rating: 4.7,
    downloads: 987,
    color: { bg: "from-blue-400 to-indigo-500", shadow: "shadow-blue-500/30" },
    chapters: [
      {
        id: 1,
        title: "Ecosystems and Habitats",
        duration: "18 min read",
        content: `# Ecosystems and Habitats

## What is an Ecosystem?
An **ecosystem** is a community of living organisms (plants, animals, microbes) interacting with their non-living environment (air, water, soil).

### Components of an Ecosystem
1. **Biotic factors**: Living things
   - Producers (plants)
   - Consumers (animals)
   - Decomposers (bacteria, fungi)

2. **Abiotic factors**: Non-living things
   - Sunlight
   - Temperature
   - Water
   - Soil

## Types of Ecosystems

### Terrestrial Ecosystems (Land)
| Ecosystem | Climate | Key Species |
|-----------|---------|-------------|
| Forest | Moderate | Trees, deer, birds |
| Desert | Hot, dry | Cacti, camels, snakes |
| Grassland | Seasonal | Grasses, zebras, lions |

### Aquatic Ecosystems (Water)
- **Freshwater**: Rivers, lakes, ponds
- **Marine**: Oceans, coral reefs
- **Wetlands**: Swamps, marshes

## Food Chains and Food Webs
Energy flows through ecosystems:
- **Producer** → Primary Consumer → Secondary Consumer → Top Predator
- Grass → Grasshopper → Frog → Snake → Eagle

## Habitat
A **habitat** is the specific place where an organism lives. It provides:
- Food
- Water
- Shelter
- Space

### Examples
- A pond is a habitat for fish and frogs
- A tree is a habitat for birds and squirrels

## Conservation
Why protect ecosystems?
- Maintain biodiversity
- Provide clean air and water
- Support human life

## Activity
Visit a nearby park or garden. List:
1. 5 living things you observe
2. 3 non-living things
3. One food chain you can identify`,
      },
      {
        id: 2,
        title: "The Water Cycle",
        duration: "14 min read",
        content: `# The Water Cycle

## Introduction
The **water cycle** (also called the hydrological cycle) describes how water moves continuously between Earth's surface and atmosphere.

## Stages of the Water Cycle

### 1. Evaporation ☀️
- Sun heats water in oceans, lakes, and rivers
- Water changes from liquid to water vapor (gas)
- Rises up into the atmosphere

### 2. Transpiration 🌿
- Plants release water vapor through their leaves
- Adds moisture to the air
- Part of the water cycle often overlooked!

### 3. Condensation ☁️
- Water vapor cools as it rises
- Changes back into tiny water droplets
- Forms clouds and fog

### 4. Precipitation 🌧️
- Water droplets combine and grow heavy
- Fall back to Earth as:
  - Rain
  - Snow
  - Hail
  - Sleet

### 5. Collection 💧
- Water collects in:
  - Oceans and seas
  - Lakes and rivers
  - Underground (groundwater)
- The cycle begins again!

## Why is the Water Cycle Important?
1. **Distributes water** around the planet
2. **Purifies water** naturally
3. **Regulates climate** and temperature
4. **Supports all life** on Earth

## Fun Facts
- The same water has been cycling for millions of years!
- Only 3% of Earth's water is freshwater
- A single water molecule spends about 9 days in the atmosphere

## Experiment: Create a Mini Water Cycle
**Materials needed:**
- A bowl of water
- Plastic wrap
- A small weight (like a coin)
- Sunlight

**Steps:**
1. Place the bowl in sunlight
2. Cover with plastic wrap
3. Put the weight in the center
4. Wait a few hours and observe!

**What you'll see:** Water droplets forming on the plastic (condensation) and dripping back (precipitation)`,
      },
      {
        id: 3,
        title: "Biodiversity and Conservation",
        duration: "16 min read",
        content: `# Biodiversity and Conservation

## What is Biodiversity?
**Biodiversity** refers to the variety of life on Earth - all the different plants, animals, fungi, and microorganisms.

### Three Levels of Biodiversity
1. **Genetic diversity**: Variations within a species
2. **Species diversity**: Different species in an area
3. **Ecosystem diversity**: Different ecosystems in a region

## Why is Biodiversity Important?

### For the Environment
- Maintains ecosystem balance
- Provides clean air and water
- Recycles nutrients

### For Humans
- Food and medicine sources
- Raw materials (wood, fiber)
- Recreation and tourism
- Cultural and spiritual value

## Threats to Biodiversity
| Threat | Example |
|--------|---------|
| Habitat loss | Deforestation |
| Pollution | Plastic in oceans |
| Climate change | Rising temperatures |
| Overexploitation | Overfishing |
| Invasive species | Foreign plants/animals |

## Endangered Species in India
- Bengal Tiger 🐅
- Asian Elephant 🐘
- Indian Rhinoceros 🦏
- Snow Leopard 🐆
- Ganges River Dolphin 🐬

## Conservation Methods

### In-situ Conservation (Natural habitat)
- National Parks
- Wildlife Sanctuaries
- Biosphere Reserves

### Ex-situ Conservation (Outside habitat)
- Zoos
- Botanical Gardens
- Seed Banks
- Aquariums

## What Can You Do?
1. **Reduce, Reuse, Recycle**
2. **Plant trees** in your community
3. **Save water** and electricity
4. **Avoid products** from endangered species
5. **Spread awareness** among friends and family

## Activity
Research one endangered animal from your state:
- Why is it endangered?
- What is being done to protect it?
- How can you help?`,
      },
    ],
  },
  {
    id: 3,
    subject: "English",
    title: "Creative Writing & Grammar",
    description:
      "Enhance your language skills with engaging lessons on grammar, vocabulary, and creative writing techniques for effective communication.",
    grade: "Grade 6-8",
    rating: 4.6,
    downloads: 856,
    color: {
      bg: "from-purple-400 to-pink-500",
      shadow: "shadow-purple-500/30",
    },
    chapters: [
      {
        id: 1,
        title: "Parts of Speech",
        duration: "15 min read",
        content: `# Parts of Speech

## Introduction
Words in English are classified into **eight parts of speech** based on their function in a sentence.

## The Eight Parts of Speech

### 1. Noun 📦
A word that names a person, place, thing, or idea.
- **Examples**: girl, Mumbai, book, happiness
- **Types**: Common, Proper, Collective, Abstract

### 2. Pronoun 👤
A word that replaces a noun.
- **Examples**: he, she, it, they, we, you
- "Ravi is smart. **He** studies hard."

### 3. Verb ⚡
A word that shows action or state of being.
- **Action verbs**: run, eat, write, play
- **Linking verbs**: is, am, are, was, were
- "She **writes** stories."

### 4. Adjective 🎨
A word that describes a noun.
- **Examples**: big, beautiful, red, three
- "The **tall** boy has **curly** hair."

### 5. Adverb 🏃
A word that modifies a verb, adjective, or another adverb.
- **Examples**: quickly, very, here, always
- "She runs **quickly**."

### 6. Preposition 📍
A word that shows relationship between nouns.
- **Examples**: in, on, at, under, between
- "The book is **on** the table."

### 7. Conjunction 🔗
A word that joins words, phrases, or clauses.
- **Coordinating**: and, but, or, so
- **Subordinating**: because, although, if
- "I like tea **and** coffee."

### 8. Interjection ❗
A word that expresses strong emotion.
- **Examples**: Wow! Oops! Hurray! Alas!
- "**Wow!** That's amazing!"

## Quick Reference Table
| Part of Speech | Question it Answers | Examples |
|---------------|---------------------|----------|
| Noun | Who? What? | dog, love |
| Verb | What action? | jump, think |
| Adjective | Which? What kind? | blue, smart |
| Adverb | How? When? Where? | slowly, now |

## Practice Exercise
Identify the parts of speech in:
"The clever fox quickly jumped over the lazy dog."

**Answer Key:**
- The: Article (type of adjective)
- clever: Adjective
- fox: Noun
- quickly: Adverb
- jumped: Verb
- over: Preposition
- the: Article
- lazy: Adjective
- dog: Noun`,
      },
      {
        id: 2,
        title: "Writing Effective Paragraphs",
        duration: "18 min read",
        content: `# Writing Effective Paragraphs

## What is a Paragraph?
A **paragraph** is a group of related sentences that develop one main idea.

## Structure of a Paragraph

### 1. Topic Sentence 🎯
- First sentence of the paragraph
- States the main idea
- Tells readers what to expect

### 2. Supporting Sentences 📝
- Explain the main idea
- Provide examples, facts, or details
- Usually 3-5 sentences

### 3. Concluding Sentence 🔚
- Wraps up the paragraph
- Restates the main idea differently
- Can transition to the next paragraph

## Example Paragraph

> **Gardening is a wonderful hobby for people of all ages.** It provides excellent physical exercise as you dig, plant, and weed. Mentally, caring for plants reduces stress and brings a sense of accomplishment. Additionally, you can grow your own vegetables, saving money and eating healthier. Whether you have a large backyard or a small balcony, **gardening offers countless benefits for both body and mind.**

**Analysis:**
- 🎯 Topic sentence (bold, first)
- 📝 Supporting sentences (middle)
- 🔚 Concluding sentence (bold, last)

## PEEL Method for Paragraphs
- **P**oint - State your main point
- **E**vidence - Give examples or proof
- **E**xplain - Explain how evidence supports your point
- **L**ink - Connect to the next paragraph or conclusion

## Common Mistakes to Avoid
1. ❌ Too many ideas in one paragraph
2. ❌ No clear topic sentence
3. ❌ Sentences that don't relate to the main idea
4. ❌ Too short (1-2 sentences) or too long (10+ sentences)

## Transition Words
Use these to connect ideas smoothly:

| Purpose | Words |
|---------|-------|
| Addition | also, furthermore, moreover |
| Contrast | however, but, although |
| Example | for instance, such as |
| Conclusion | therefore, finally, in summary |

## Practice Activity
Write a paragraph about your favorite festival using:
1. A clear topic sentence
2. Three supporting details
3. A concluding sentence`,
      },
      {
        id: 3,
        title: "Storytelling Techniques",
        duration: "20 min read",
        content: `# Storytelling Techniques

## Elements of a Good Story

### 1. Characters 👥
- **Protagonist**: Main character (hero)
- **Antagonist**: Character who creates conflict
- Give characters names, personalities, and motivations

### 2. Setting 🏰
- **Where** and **when** the story takes place
- Use descriptive words to paint a picture
- "In a small village at the foot of the misty mountains..."

### 3. Plot 📖
The sequence of events:
1. **Beginning**: Introduce characters and setting
2. **Rising Action**: Build up problems
3. **Climax**: The most exciting moment
4. **Falling Action**: Events after the climax
5. **Resolution**: How it all ends

### 4. Conflict ⚔️
The problem that drives the story:
- Person vs. Person
- Person vs. Nature
- Person vs. Self
- Person vs. Society

### 5. Theme 💡
The message or lesson of the story:
- Friendship, courage, honesty, kindness

## Show, Don't Tell

❌ **Telling**: "Riya was scared."

✅ **Showing**: "Riya's heart pounded. Her hands trembled as she gripped the flashlight. Every shadow seemed to move."

## Using Dialogue
- Makes characters come alive
- Shows personality through speech
- Use quotation marks: "Hello," she said.

**Example:**
> "Are you coming with us?" asked Vikram.
> "I... I'm not sure," Priya hesitated, glancing at the dark forest path.

## Descriptive Language

### Use the Five Senses
| Sense | Example |
|-------|---------|
| Sight | Golden sunlight streamed through the window |
| Sound | Birds chirped a cheerful melody |
| Smell | The aroma of fresh chai filled the room |
| Touch | The rough bark scratched his palms |
| Taste | The mango was sweet and juicy |

## Story Starters
Try beginning your story with:
1. **Action**: "Run!" she screamed as the ground began to shake.
2. **Dialogue**: "You won't believe what I found in the attic."
3. **Description**: The old clock had stopped at exactly midnight.
4. **Question**: Have you ever found a mysterious letter?

## Practice Exercise
Write the opening paragraph of a story using:
- An interesting main character
- A vivid setting description
- A hint of conflict or mystery`,
      },
    ],
  },
  {
    id: 4,
    subject: "History",
    title: "Ancient Indian Civilizations",
    description:
      "Journey through time to discover the rich heritage of ancient India - from the Indus Valley to the Maurya and Gupta empires.",
    grade: "Grade 6-8",
    rating: 4.5,
    downloads: 743,
    color: {
      bg: "from-amber-400 to-orange-500",
      shadow: "shadow-amber-500/30",
    },
    chapters: [
      {
        id: 1,
        title: "The Indus Valley Civilization",
        duration: "22 min read",
        content: `# The Indus Valley Civilization

## Introduction
The **Indus Valley Civilization** (also called Harappan Civilization) was one of the world's earliest urban civilizations, flourishing around **2600-1900 BCE**.

## Timeline
- **Early Phase**: 3300-2600 BCE
- **Mature Phase**: 2600-1900 BCE (peak)
- **Late Phase**: 1900-1300 BCE (decline)

## Major Cities

### Harappa (Punjab, Pakistan)
- First discovered site (1921)
- Gave the civilization its name
- Important trading center

### Mohenjo-daro (Sindh, Pakistan)
- Largest city discovered
- Name means "Mound of the Dead"
- Famous Great Bath structure

### Indian Sites
- **Lothal** (Gujarat) - Ancient port city
- **Kalibangan** (Rajasthan) - Fire altars found
- **Dholavira** (Gujarat) - Water management systems
- **Rakhigarhi** (Haryana) - Largest Indian site

## Advanced Urban Planning

### Features of Cities
| Feature | Description |
|---------|-------------|
| Grid Pattern | Streets crossing at right angles |
| Drainage | Covered drains under streets |
| Houses | Brick buildings with courtyards |
| Citadel | Raised platform with important buildings |
| Granaries | Large storage for grain |

### The Great Bath
- Located in Mohenjo-daro
- 12m × 7m × 2.4m deep
- Waterproofed with bitumen
- Possibly used for religious ceremonies

## Daily Life

### Occupations
- Farming (wheat, barley, cotton)
- Pottery making
- Bead and jewelry crafting
- Metalwork (bronze, copper)
- Trade (with Mesopotamia)

### Food
- Wheat and barley bread
- Fruits and vegetables
- Fish and meat

### Clothing
- Cotton garments
- Both men and women wore ornaments

## Mysteries
1. **Script not deciphered** - Over 400 symbols found
2. **No temples or palaces** clearly identified
3. **Reason for decline** - Flood? Invasion? Climate change?

## Activity
Draw a map of an Indus Valley city with:
- A citadel on higher ground
- Residential area with grid streets
- Drainage system
- A granary`,
      },
      {
        id: 2,
        title: "The Maurya Empire",
        duration: "20 min read",
        content: `# The Maurya Empire

## Introduction
The **Maurya Empire** (322-185 BCE) was the first empire to unite most of the Indian subcontinent under one rule.

## Important Rulers

### Chandragupta Maurya (322-298 BCE)
- **Founder** of the Maurya Empire
- Defeated Nanda Dynasty with help of **Chanakya**
- Defeated Seleucus Nicator (Greek general)
- Capital: **Pataliputra** (modern Patna)

### Bindusara (298-272 BCE)
- Son of Chandragupta
- Extended empire southward
- Called "Amitraghata" (slayer of enemies)

### Ashoka the Great (268-232 BCE)
- Greatest Mauryan emperor
- Fought the **Kalinga War** (261 BCE)
- Converted to Buddhism after war's violence
- Spread message of **Dhamma** (righteousness)

## Ashoka's Contributions

### The Kalinga War
- Fought in present-day Odisha
- 100,000+ killed, 150,000 deported
- Ashoka was deeply affected
- Turned to non-violence

### Edicts and Pillars
- Messages carved on rocks and pillars
- Written in Brahmi script
- Found across the empire
- Promoted peace, tolerance, and welfare

### The Ashoka Chakra 🔵
- 24-spoke wheel on pillars
- Represents the wheel of Dharma
- Now part of India's national flag!

## Administration

| Official | Role |
|----------|------|
| Emperor | Supreme ruler |
| Yuvaraj | Crown prince |
| Mantri Parishad | Council of ministers |
| Rajukas | District officers |
| Gramika | Village headman |

## Chanakya's Arthashastra
- Ancient treatise on statecraft
- Written by **Kautilya** (Chanakya)
- Covered economy, politics, military
- "A nation's wealth is in its agriculture and trade"

## Economy
- Agriculture was primary occupation
- Crafts: Textiles, pottery, metalwork
- Trade routes connected to Greece and China
- Standardized weights and measures

## Decline
- After Ashoka's death (232 BCE)
- Weak successors
- Economic problems
- Last ruler: Brihadratha (killed 185 BCE)
- Empire replaced by Shunga Dynasty

## Key Takeaways
1. First pan-Indian empire
2. Ashoka's transformation after Kalinga
3. Legacy of tolerance and non-violence
4. Arthashastra - foundation of political science`,
      },
      {
        id: 3,
        title: "The Golden Age: Gupta Empire",
        duration: "18 min read",
        content: `# The Golden Age: Gupta Empire

## Introduction
The **Gupta Empire** (320-550 CE) is called India's "Golden Age" due to remarkable achievements in arts, science, and culture.

## Timeline of Rulers

### Chandragupta I (320-335 CE)
- Founder of the Gupta Empire
- Married Licchavi princess Kumaradevi
- Started the Gupta Era calendar

### Samudragupta (335-375 CE)
- Great military conqueror
- Extended empire across North India
- Patron of arts and music
- Called "Indian Napoleon"

### Chandragupta II (Vikramaditya) (375-415 CE)
- Peak of Gupta power
- Defeated Shakas in Western India
- Court of the "Nine Gems" (Navaratnas)
- Fa-Hien (Chinese traveler) visited

### Later Guptas
- Kumaragupta I
- Skandagupta (fought Hunas)
- Empire declined after 550 CE

## Achievements in Science

### Mathematics 🔢
- **Aryabhata** (476-550 CE)
  - Calculated π (pi) to 4 decimal places
  - Concept of zero and decimal system
  - Earth rotates on its axis

- **Varahamihira**
  - Astronomy and astrology
  - Wrote Brihat Samhita

### Medicine 🏥
- **Sushruta** - Father of Surgery
  - Described 300 operations
  - Plastic surgery techniques
- **Charaka** - Internal medicine

### Metallurgy ⚙️
- **Iron Pillar of Delhi**
  - 1600+ years old, no rust!
  - Shows advanced iron-making skills

## Art and Literature

### Literature 📚
- **Kalidasa** - Greatest Sanskrit poet
  - Shakuntala (play)
  - Meghaduta (Cloud Messenger)
  - Raghuvamsha

### Architecture 🏛️
- Ajanta and Ellora cave paintings
- Dashavatar Temple at Deogarh
- Iron Pillar at Mehrauli

### Sculpture
- Buddha statues at Sarnath
- Intricate temple carvings

## The Nine Gems (Navaratnas)
Scholars in Chandragupta II's court:
1. Kalidasa (poet)
2. Varahamihira (astronomer)
3. Dhanvantari (physician)
4. And six others

## Society and Economy
- **Caste system** became more rigid
- Trade flourished (silk, spices)
- Villages were self-sufficient
- Gold and silver coins

## Decline
Causes:
1. Hun invasions from Central Asia
2. Weak later rulers
3. Rise of regional kingdoms
4. Economic difficulties

## Legacy
- Decimal system and zero spread to Arabia and Europe
- Sanskrit literature classics
- Architectural styles influenced later periods
- Golden standard for Indian civilization`,
      },
    ],
  },
  {
    id: 5,
    subject: "Geography",
    title: "Physical Geography of India",
    description:
      "Explore India's diverse landscapes - from the mighty Himalayas to coastal plains, understanding climate, rivers, and natural resources.",
    grade: "Grade 5-7",
    rating: 4.4,
    downloads: 612,
    color: { bg: "from-rose-400 to-red-500", shadow: "shadow-rose-500/30" },
    chapters: [
      {
        id: 1,
        title: "Major Landforms of India",
        duration: "16 min read",
        content: `# Major Landforms of India

## Introduction
India has diverse physical features, from the highest mountains to vast plains and coastal areas.

## Six Major Physiographic Divisions

### 1. The Himalayan Mountains 🏔️
**Location**: Northern border

**Ranges (North to South)**:
| Range | Features |
|-------|----------|
| Greater Himalayas | Highest peaks, Mt. Everest (8,849m) |
| Lesser Himalayas | Hill stations: Shimla, Mussoorie |
| Shiwalik Hills | Lowest range, foothills |

**Key Points**:
- World's youngest fold mountains
- Source of major rivers (Ganga, Indus)
- Natural barrier against cold winds
- Rich biodiversity

### 2. The Northern Plains 🌾
**Location**: South of Himalayas

**Features**:
- Formed by alluvial deposits
- Most fertile region
- Major rivers: Ganga, Yamuna, Brahmaputra
- India's agricultural heartland

**Subdivisions**:
- Punjab Plains (Land of Five Rivers)
- Ganga Plains
- Brahmaputra Plains

### 3. The Peninsular Plateau 🏜️
**Location**: Central and Southern India

**Features**:
- Ancient, stable landmass
- Made of igneous and metamorphic rocks
- Rich in minerals

**Parts**:
- **Deccan Plateau**: Between Ghats
- **Malwa Plateau**: North-west
- **Chota Nagpur Plateau**: Mineral-rich

### 4. The Coastal Plains 🏖️
**Western Coast**:
- Narrow strip
- Konkan, Kanara, Malabar Coast
- Good harbors: Mumbai, Goa

**Eastern Coast**:
- Wider than western
- Coromandel, Northern Circars
- Deltas: Mahanadi, Godavari, Krishna

### 5. The Indian Desert 🐪
**Location**: Western Rajasthan (Thar Desert)

**Features**:
- Hot, arid climate
- Sand dunes (barchans)
- Less than 25cm annual rainfall
- Sparse vegetation

### 6. The Islands 🏝️
**Andaman & Nicobar** (Bay of Bengal):
- Volcanic origin
- Dense forests
- Coral beaches

**Lakshadweep** (Arabian Sea):
- Coral islands
- Smallest Union Territory
- Fishing economy

## Quick Comparison
| Feature | Himalayas | Plains | Plateau |
|---------|-----------|--------|---------|
| Age | Young | Recent | Ancient |
| Soil | Rocky | Alluvial | Black, Red |
| Economy | Tourism | Agriculture | Mining |

## Map Activity
On an outline map of India, mark:
1. Three Himalayan ranges
2. Major plains
3. Eastern and Western Ghats
4. Thar Desert
5. Island groups`,
      },
      {
        id: 2,
        title: "Rivers of India",
        duration: "20 min read",
        content: `# Rivers of India

## Introduction
India has numerous rivers that are lifelines of the country, providing water for drinking, agriculture, and industry.

## Classification of Rivers

### 1. Himalayan Rivers 🏔️
**Characteristics**:
- Perennial (flow year-round)
- Fed by glaciers and rainfall
- Long courses with large basins

### 2. Peninsular Rivers 🏜️
**Characteristics**:
- Seasonal (depend on monsoon)
- Shorter courses
- Smaller basins

## Major Himalayan Rivers

### The Ganga River 🕉️
- **Length**: 2,525 km
- **Source**: Gangotri Glacier
- **Tributaries**: Yamuna, Ghaghara, Gandak, Kosi
- **End**: Bay of Bengal (Sundarbans delta)
- **Significance**: Holiest river for Hindus

### The Brahmaputra 🌊
- **Length**: 2,900 km (700 km in India)
- **Source**: Manasarovar Lake (Tibet)
- **Other Names**: Tsangpo (Tibet), Jamuna (Bangladesh)
- **Features**: 
  - Carries maximum water
  - Forms world's largest river island (Majuli)

### The Indus River
- **Length**: 2,880 km
- **Source**: Near Manasarovar
- **Tributaries**: Jhelum, Chenab, Ravi, Beas, Sutlej
- **Significance**: Indus Valley Civilization

## Major Peninsular Rivers

### East-Flowing Rivers
| River | Length | Source | Ends at |
|-------|--------|--------|---------|
| Godavari | 1,465 km | Nasik | Bay of Bengal |
| Krishna | 1,400 km | Mahabaleshwar | Bay of Bengal |
| Kaveri | 800 km | Coorg | Bay of Bengal |
| Mahanadi | 857 km | Chhattisgarh | Bay of Bengal |

### West-Flowing Rivers
- **Narmada**: Amarkantak → Arabian Sea
- **Tapi**: Satpura → Arabian Sea

**Why west-flowing?**
- Flow through rift valleys
- Narrow, deep channels

## River Basins and Deltas

### Ganga-Brahmaputra Delta
- World's largest delta
- Sundarbans mangrove forest
- Rich in biodiversity
- Prone to flooding

### Kaveri Delta
- Rice bowl of Tamil Nadu
- Ancient irrigation systems
- Fertile alluvial soil

## Uses of Rivers
1. **Irrigation**: Agriculture
2. **Hydropower**: Electricity
3. **Navigation**: Transport
4. **Drinking water**: Cities
5. **Religious**: Pilgrimages

## River Pollution 😟
**Problems**:
- Industrial waste
- Sewage
- Religious offerings
- Agricultural runoff

**Solutions**:
- Namami Gange programme
- Sewage treatment plants
- Public awareness
- Strict pollution laws

## Activity
Create a river comparison chart:
1. Choose two rivers (one Himalayan, one Peninsular)
2. Compare: length, source, tributaries, uses`,
      },
      {
        id: 3,
        title: "Climate and Monsoons",
        duration: "18 min read",
        content: `# Climate and Monsoons

## Introduction
India has a **monsoon type of climate** characterized by distinct seasons and the seasonal reversal of winds.

## Factors Affecting India's Climate
1. **Latitude**: Tropic of Cancer passes through
2. **Altitude**: Himalayas block cold winds
3. **Distance from sea**: Coastal vs. interior
4. **Monsoon winds**: Most important factor
5. **Relief features**: Mountains and plains

## The Four Seasons

### 1. Winter Season ❄️ (December-February)
**Characteristics**:
- Cool, dry weather
- Temperature: 10-15°C (North), 24-25°C (South)
- Western disturbances bring rain to Punjab
- Clear skies, pleasant days

### 2. Summer Season ☀️ (March-May)
**Characteristics**:
- Very hot in North India
- Temperature: Up to 45°C
- Loo: Hot, dry winds
- Pre-monsoon showers (Mango showers, Nor'westers)

### 3. Monsoon Season 🌧️ (June-September)
**Characteristics**:
- Rainy season
- Southwest monsoon winds
- 75% of annual rainfall
- Agriculture depends on this

### 4. Retreating Monsoon 🌤️ (October-November)
**Characteristics**:
- Monsoon withdraws
- October heat: High temperatures
- Northeast monsoon: Rain in Tamil Nadu
- Transition period

## The Monsoon Mechanism

### What is Monsoon?
- Arabic word "mausim" = season
- Seasonal reversal of wind direction

### Southwest Monsoon (June-September)
**Formation**:
1. Land heats faster than sea
2. Low pressure over North India
3. High pressure over Indian Ocean
4. Winds blow from sea to land
5. Bring moisture → Rain!

**Two Branches**:
| Branch | Path | Areas |
|--------|------|-------|
| Arabian Sea | Western Ghats | Kerala, Karnataka, Maharashtra |
| Bay of Bengal | Northeast India | Assam, Bengal, Eastern India |

### Northeast Monsoon (October-November)
- Winds from land to sea
- Bring rain to Tamil Nadu coast
- Weaker than Southwest monsoon

## Rainfall Distribution

### High Rainfall Areas (>200cm)
- Western Ghats
- Northeast India (Mawsynram: World's wettest)
- Andaman & Nicobar

### Low Rainfall Areas (<50cm)
- Western Rajasthan
- Rain shadow regions
- Parts of Punjab, Gujarat

## Monsoon and Indian Life

### Importance
1. **Agriculture**: Kharif crops depend on it
2. **Water sources**: Rivers, reservoirs fill
3. **Festivals**: Celebrated on arrival
4. **Economy**: Good monsoon = good growth

### Challenges
1. **Floods**: Excess rainfall
2. **Droughts**: Monsoon failure
3. **Variability**: Unpredictable timing

## Climate Change Impact
- More extreme weather events
- Irregular monsoon patterns
- Glacier melting in Himalayas
- Rising sea levels affecting coasts

## Activity
Collect weather data for one week:
1. Daily temperature (morning, afternoon)
2. Rainfall (if any)
3. Wind direction
4. Cloud cover
Present as a weather chart!`,
      },
    ],
  },
];

export function getTextbookById(id: number): Textbook | undefined {
  return textbooks.find((book) => book.id === id);
}

export function getChapterById(
  textbookId: number,
  chapterId: number
): { textbook: Textbook; chapter: Chapter } | undefined {
  const textbook = getTextbookById(textbookId);
  if (!textbook) return undefined;

  const chapter = textbook.chapters.find((ch) => ch.id === chapterId);
  if (!chapter) return undefined;

  return { textbook, chapter };
}
