/**
 * Pre-built curriculum templates — per-class syllabus trees
 * Covers Class 1 through Class 12 (all streams) for CBSE / State boards
 */

export type TopicList = string[]
export type ChapterEntry = { name: string; topics: TopicList }
export type SubjectEntry = { name: string; chapters: ChapterEntry[] }
export type ClassEntry = { class: string; subjects: SubjectEntry[] }

// ── Class 1 ───────────────────────────────────────────────────────────────────
const CLASS_1: ClassEntry = {
  class: 'Class 1',
  subjects: [
    {
      name: 'English',
      chapters: [
        { name: 'Alphabet and Phonics', topics: ['Alphabet Recognition', 'Letter Sounds', 'Vowels and Consonants', 'Simple Words'] },
        { name: 'Reading', topics: ['Sight Words', 'Short Sentences', 'Picture Reading', 'Story Reading'] },
        { name: 'Writing', topics: ['Letter Formation', 'Copying Words', 'Fill in the Blanks', 'Simple Sentences'] },
        { name: 'Grammar Basics', topics: ['Naming Words (Nouns)', 'Doing Words (Verbs)', 'Describing Words', 'Articles a and an'] },
      ],
    },
    {
      name: 'Mathematics',
      chapters: [
        { name: 'Numbers 1 to 100', topics: ['Counting 1 to 10', 'Counting 11 to 50', 'Counting 51 to 100', 'Before After Between'] },
        { name: 'Addition', topics: ['Adding Single Digits', 'Adding with Objects', 'Story Problems', 'Number Bonds to 10'] },
        { name: 'Subtraction', topics: ['Taking Away', 'Finding the Difference', 'Subtraction Stories', 'Missing Number'] },
        { name: 'Shapes and Patterns', topics: ['Basic 2D Shapes', 'Identifying Patterns', 'Drawing Shapes', 'Symmetry Basics'] },
      ],
    },
    {
      name: 'Environmental Studies',
      chapters: [
        { name: 'My Family', topics: ['Family Members', 'Roles at Home', 'Family Activities', 'Neighbourhood'] },
        { name: 'Plants Around Us', topics: ['Parts of a Plant', 'Uses of Plants', 'Types of Plants', 'Seeds and Germination'] },
        { name: 'Animals Around Us', topics: ['Pet Animals', 'Wild Animals', 'Birds and Insects', 'Animal Sounds'] },
        { name: 'My Body', topics: ['External Body Parts', 'Sense Organs', 'Healthy Habits', 'Food We Eat'] },
      ],
    },
  ],
}

// ── Class 2 ───────────────────────────────────────────────────────────────────
const CLASS_2: ClassEntry = {
  class: 'Class 2',
  subjects: [
    {
      name: 'English',
      chapters: [
        { name: 'Grammar Basics', topics: ['Nouns', 'Pronouns', 'Verbs', 'Adjectives'] },
        { name: 'Comprehension', topics: ['Reading Short Passages', 'Answering Questions', 'Identifying Main Idea', 'Vocabulary in Context'] },
        { name: 'Creative Writing', topics: ['Describing Pictures', 'Writing Short Stories', 'Diary Entry', 'Letter to a Friend'] },
        { name: 'Punctuation', topics: ['Full Stop', 'Question Mark', 'Exclamation Mark', 'Comma Usage'] },
      ],
    },
    {
      name: 'Mathematics',
      chapters: [
        { name: 'Numbers up to 1000', topics: ['3-digit Numbers', 'Place Value', 'Ordering Numbers', 'Skip Counting'] },
        { name: 'Addition and Subtraction', topics: ['2-digit Addition', '3-digit Addition', 'Subtraction with Borrowing', 'Word Problems'] },
        { name: 'Multiplication Tables', topics: ['Tables 2 to 5', 'Tables 6 to 10', 'Skip Counting Patterns', 'Multiplication Stories'] },
        { name: 'Measurement', topics: ['Length in cm and m', 'Weight in kg and g', 'Time Hours and Minutes', 'Money'] },
      ],
    },
    {
      name: 'Environmental Studies',
      chapters: [
        { name: 'Our Food', topics: ['Types of Food', 'Food from Plants and Animals', 'Healthy Eating', 'Cooking Methods'] },
        { name: 'Our Shelter', topics: ['Types of Houses', 'Building Materials', 'Rooms and Their Uses', 'Safe Homes'] },
        { name: 'Transport', topics: ['Modes of Transport', 'Land Water and Air', 'Traffic Rules', 'Transport History'] },
        { name: 'Water', topics: ['Sources of Water', 'Uses of Water', 'Water Cycle Basics', 'Saving Water'] },
      ],
    },
  ],
}

// ── Class 3 ───────────────────────────────────────────────────────────────────
const CLASS_3: ClassEntry = {
  class: 'Class 3',
  subjects: [
    {
      name: 'English',
      chapters: [
        { name: 'Parts of Speech', topics: ['Nouns and Pronouns', 'Verbs and Tenses', 'Adjectives and Adverbs', 'Prepositions and Conjunctions'] },
        { name: 'Reading Comprehension', topics: ['Factual Passages', 'Literary Passages', 'Inferential Questions', 'Vocabulary Building'] },
        { name: 'Composition', topics: ['Paragraph Writing', 'Story Completion', 'Letter Writing', 'Notice Writing'] },
        { name: 'Tenses', topics: ['Simple Present', 'Simple Past', 'Simple Future', 'Continuous Tenses'] },
      ],
    },
    {
      name: 'Mathematics',
      chapters: [
        { name: 'Numbers up to 10000', topics: ['4-digit Numbers', 'Number Names', 'Comparison', 'Rounding Off'] },
        { name: 'Multiplication and Division', topics: ['Tables 11 to 20', 'Long Multiplication', 'Division Concepts', 'Remainder and Quotient'] },
        { name: 'Fractions', topics: ['Half Quarter Third', 'Proper Fractions', 'Equivalent Fractions', 'Comparing Fractions'] },
        { name: 'Geometry', topics: ['Lines and Angles', '2D Shapes', '3D Shapes', 'Perimeter'] },
      ],
    },
    {
      name: 'Science',
      chapters: [
        { name: 'Living and Non-living Things', topics: ['Characteristics of Life', 'Differences', 'Classification', 'Habitat'] },
        { name: 'Human Body', topics: ['Sense Organs', 'Skeletal System', 'Digestive System', 'Healthy Habits'] },
        { name: 'Water and Weather', topics: ['Sources of Water', 'Uses of Water', 'Weather Changes', 'Seasons'] },
        { name: 'Plants and Animals', topics: ['Plant Parts and Functions', 'Types of Plants', 'Animal Habitats', 'Adaptation'] },
      ],
    },
    {
      name: 'Social Studies',
      chapters: [
        { name: 'Our Earth', topics: ['Globe and Maps', 'Continents', 'Oceans', 'Compass Directions'] },
        { name: 'Communities and Cultures', topics: ['Festivals', 'Food and Dress', 'Occupations', 'National Symbols'] },
        { name: 'Our History', topics: ['Ancient Times', 'Tools and Weapons', 'Old Civilisations', 'Famous People'] },
        { name: 'Government and Citizenship', topics: ['Our Leaders', 'Rules and Laws', 'Rights and Duties', 'Community Helpers'] },
      ],
    },
  ],
}

// ── Class 4 ───────────────────────────────────────────────────────────────────
const CLASS_4: ClassEntry = {
  class: 'Class 4',
  subjects: [
    {
      name: 'English',
      chapters: [
        { name: 'Grammar', topics: ['Tenses Past Present Future', 'Active and Passive Voice', 'Direct and Indirect Speech', 'Punctuation'] },
        { name: 'Reading', topics: ['Poetry Appreciation', 'Story Analysis', 'Comprehension Strategies', 'Expanding Vocabulary'] },
        { name: 'Writing', topics: ['Essay Writing', 'Formal Letters', 'Dialogue Writing', 'Description of Events'] },
        { name: 'Literature', topics: ['Prose Reading', 'Poetry Recitation', 'Character Study', 'Moral of the Story'] },
      ],
    },
    {
      name: 'Mathematics',
      chapters: [
        { name: 'Large Numbers', topics: ['5-digit Numbers', 'Indian Place Value', 'International Place Value', 'Estimation'] },
        { name: 'Fractions and Decimals', topics: ['Mixed Fractions', 'Decimal Notation', 'Addition of Decimals', 'Comparing Decimals'] },
        { name: 'Factors and Multiples', topics: ['Prime and Composite', 'HCF and LCM', 'Divisibility Rules', 'Prime Factorisation'] },
        { name: 'Geometry and Mensuration', topics: ['Area of Rectangle and Square', 'Perimeter Problems', 'Angles', 'Lines of Symmetry'] },
      ],
    },
    {
      name: 'Science',
      chapters: [
        { name: 'Food and Nutrition', topics: ['Nutrients in Food', 'Balanced Diet', 'Deficiency Diseases', 'Digestive System Basics'] },
        { name: 'Matter and Materials', topics: ['States of Matter', 'Properties of Materials', 'Changes in Materials', 'Reversible and Irreversible Changes'] },
        { name: 'Force and Motion', topics: ['Types of Forces', 'Friction', 'Gravity', 'Simple Machines'] },
        { name: 'Earth and Space', topics: ['Earth Structure', 'Solar System', 'Day and Night', 'Stars and Constellations'] },
      ],
    },
    {
      name: 'Social Studies',
      chapters: [
        { name: 'Physical Features of India', topics: ['Mountains', 'Plains and Plateaus', 'Rivers', 'Coastal Areas'] },
        { name: 'History of Ancient India', topics: ['Indus Valley Civilisation', 'Vedic Period', 'Mauryan Empire', 'Gupta Period'] },
        { name: 'Civics', topics: ['Government Basics', 'Local Self-Government', 'Rights and Duties', 'Democracy'] },
        { name: 'Natural Resources', topics: ['Forests and Wildlife', 'Minerals', 'Water Resources', 'Conservation'] },
      ],
    },
  ],
}

// ── Class 5 ───────────────────────────────────────────────────────────────────
const CLASS_5: ClassEntry = {
  class: 'Class 5',
  subjects: [
    {
      name: 'English',
      chapters: [
        { name: 'Advanced Grammar', topics: ['Modals and Conditionals', 'Reported Speech', 'Gerunds and Infinitives', 'Clause Types'] },
        { name: 'Literature', topics: ['Prose Comprehension', 'Poetry Analysis', 'Drama and Plays', 'Literary Devices'] },
        { name: 'Writing Skills', topics: ['Formal Report Writing', 'Debate Writing', 'Notice and Poster', 'Creative Stories'] },
        { name: 'Vocabulary', topics: ['Synonyms and Antonyms', 'Idioms and Phrases', 'One-word Substitution', 'Word Forms'] },
      ],
    },
    {
      name: 'Mathematics',
      chapters: [
        { name: 'Number System', topics: ['Integers', 'Rational Numbers', 'Number Line', 'Order of Operations'] },
        { name: 'Ratio and Proportion', topics: ['Ratio Notation', 'Simplifying Ratios', 'Proportion', 'Unitary Method'] },
        { name: 'Percentage', topics: ['Percent Basics', 'Converting Fractions to Percent', 'Profit and Loss', 'Discount'] },
        { name: 'Geometry', topics: ['Triangles', 'Quadrilaterals', 'Circles', 'Area and Perimeter Advanced'] },
        { name: 'Data Handling', topics: ['Pictographs', 'Bar Graphs', 'Pie Charts', 'Mean Median Mode'] },
      ],
    },
    {
      name: 'Science',
      chapters: [
        { name: 'Crop Production', topics: ['Types of Crops', 'Farming Methods', 'Irrigation', 'Storage and Preservation'] },
        { name: 'Micro-organisms', topics: ['Bacteria and Viruses', 'Fungi and Algae', 'Useful Microbes', 'Diseases from Microbes'] },
        { name: 'Light and Sound', topics: ['Sources of Light', 'Reflection and Refraction', 'Properties of Sound', 'Pitch and Loudness'] },
        { name: 'Pollution', topics: ['Air Pollution', 'Water Pollution', 'Soil Pollution', 'Conservation Measures'] },
      ],
    },
    {
      name: 'Social Studies',
      chapters: [
        { name: 'Medieval India', topics: ['Delhi Sultanate', 'Mughal Empire', 'Bhakti and Sufi Movement', 'Arts and Architecture'] },
        { name: 'Geography of India', topics: ['Climate Zones', 'Natural Vegetation', 'Wildlife', 'Agriculture Regions'] },
        { name: 'Indian Economy', topics: ['Primary Sector', 'Industries', 'Trade', 'Transport Networks'] },
        { name: 'Modern India', topics: ['British Rule', 'Freedom Struggle', 'Independence', 'Constitution of India'] },
      ],
    },
  ],
}

// ── Class 6 ───────────────────────────────────────────────────────────────────
const CLASS_6: ClassEntry = {
  class: 'Class 6',
  subjects: [
    {
      name: 'Mathematics',
      chapters: [
        { name: 'Knowing Our Numbers', topics: ['Large Numbers', 'Estimation and Rounding', 'Roman Numerals', 'International System'] },
        { name: 'Whole Numbers', topics: ['Number Line', 'Properties of Whole Numbers', 'Patterns', 'BODMAS'] },
        { name: 'Playing with Numbers', topics: ['Factors and Multiples', 'Prime Factorisation', 'HCF and LCM', 'Divisibility Rules'] },
        { name: 'Basic Geometrical Ideas', topics: ['Points Lines and Angles', 'Curves and Polygons', 'Circle Parts', 'Parallel Lines'] },
        { name: 'Understanding Elementary Shapes', topics: ['Line Segments', 'Angles Acute Obtuse Right', '2D and 3D Shapes', 'Measuring Angles'] },
        { name: 'Integers', topics: ['Positive and Negative Numbers', 'Addition of Integers', 'Subtraction of Integers', 'Number Line Representation'] },
        { name: 'Fractions', topics: ['Types of Fractions', 'Equivalent Fractions', 'Comparing Fractions', 'Operations on Fractions'] },
        { name: 'Decimals', topics: ['Decimal Place Value', 'Comparing Decimals', 'Addition and Subtraction', 'Use in Measurement'] },
        { name: 'Data Handling', topics: ['Tally Marks', 'Bar Graphs', 'Pictographs', 'Mean and Median'] },
        { name: 'Mensuration', topics: ['Perimeter of Polygons', 'Area of Rectangle and Square', 'Area of Irregular Shapes', 'Real-life Applications'] },
        { name: 'Algebra', topics: ['Introduction to Variables', 'Expressions', 'Simple Equations', 'Application of Algebra'] },
        { name: 'Ratio and Proportion', topics: ['Ratio Basics', 'Unitary Method', 'Direct Proportion', 'Inverse Proportion'] },
        { name: 'Symmetry', topics: ['Line of Symmetry', 'Figures with Multiple Axes', 'Reflection', 'Rotational Symmetry'] },
        { name: 'Practical Geometry', topics: ['Construction of Line Segments', 'Construction of Angles', 'Constructing Circles', 'Drawing Parallel Lines'] },
      ],
    },
    {
      name: 'Science',
      chapters: [
        { name: 'Food: Where Does It Come From?', topics: ['Plant Sources', 'Animal Sources', 'Edible Parts of Plants', 'Herbivores Carnivores Omnivores'] },
        { name: 'Components of Food', topics: ['Carbohydrates', 'Proteins and Fats', 'Vitamins and Minerals', 'Balanced Diet and Deficiencies'] },
        { name: 'Fibre to Fabric', topics: ['Plant Fibres Cotton and Jute', 'Animal Fibres Wool and Silk', 'Spinning and Weaving', 'Ginning Process'] },
        { name: 'Sorting Materials into Groups', topics: ['Properties of Materials', 'Transparency', 'Solubility', 'Magnetic and Non-magnetic'] },
        { name: 'Separation of Substances', topics: ['Handpicking and Winnowing', 'Sieving', 'Filtration and Evaporation', 'Sedimentation'] },
        { name: 'Changes Around Us', topics: ['Reversible Changes', 'Irreversible Changes', 'Physical Changes', 'Chemical Changes'] },
        { name: 'Getting to Know Plants', topics: ['Herbs Shrubs and Trees', 'Root Types', 'Leaf Venation', 'Flower Parts and Functions'] },
        { name: 'Body Movements', topics: ['Types of Joints', 'Skeletal System', 'Muscles', 'Locomotion in Animals'] },
        { name: 'The Living Organisms and Their Surroundings', topics: ['Habitat and Adaptation', 'Aquatic and Terrestrial', 'Desert Animals', 'Polar Adaptations'] },
        { name: 'Motion and Measurement of Distances', topics: ['Types of Motion', 'Standard Units', 'Measuring Instruments', 'Measurement of Length'] },
        { name: 'Light Shadows and Reflections', topics: ['Transparent Opaque Translucent', 'Pinhole Camera', 'Reflection', 'Shadow Formation'] },
        { name: 'Electricity and Circuits', topics: ['Electric Cell and Bulb', 'Open and Closed Circuits', 'Conductors and Insulators', 'Series and Parallel'] },
        { name: 'Fun with Magnets', topics: ['Properties of Magnets', 'Poles', 'Finding Directions', 'Magnetisation and Demagnetisation'] },
        { name: 'Water', topics: ['Water Cycle', 'Sources of Water', 'Water Pollution', 'Conservation of Water'] },
        { name: 'Air Around Us', topics: ['Composition of Air', 'Properties of Air', 'Winds', 'Importance of Air'] },
        { name: 'Garbage In Garbage Out', topics: ['Types of Waste', 'Composting', 'Recycling', 'Reducing Waste'] },
      ],
    },
    {
      name: 'Social Science',
      chapters: [
        { name: 'What Where How and When', topics: ['Sources of History', 'Dating the Past', 'History of India', 'Archaeological Evidence'] },
        { name: 'On the Trail of the Earliest People', topics: ['Hunter-Gatherers', 'Cave Paintings', 'Tools Used', 'Finding Food'] },
        { name: 'From Gathering to Growing Food', topics: ['Domestication', 'Early Settlements', 'Agriculture Beginnings', 'Burzahom and Chirand'] },
        { name: 'In the Earliest Cities', topics: ['Harappan Cities', 'Town Planning', 'Trade and Crafts', 'Decline of Harappan Civilisation'] },
        { name: 'New Questions and Ideas', topics: ['Upanishads', 'Jainism', 'Buddhism', 'Vardhamana Mahavira'] },
        { name: 'Kingdoms Kings and an Early Republic', topics: ['Janapadas', 'Mahajanapadas', 'Rise of Magadha', 'Republics and Oligarchies'] },
        { name: 'Understanding Geography', topics: ['Earth and Solar System', 'Globe and Grid', 'Parallels and Meridians', 'Time Zones'] },
        { name: 'Globe Latitudes and Longitudes', topics: ['Latitude Lines', 'Longitude Lines', 'Prime Meridian', 'Calculating Time'] },
        { name: 'Motions of the Earth', topics: ['Rotation', 'Revolution', 'Day and Night', 'Seasons'] },
        { name: 'Maps', topics: ['Types of Maps', 'Map Components', 'Scale', 'Directions on Maps'] },
        { name: 'Major Domains of the Earth', topics: ['Lithosphere', 'Hydrosphere', 'Atmosphere', 'Biosphere'] },
        { name: 'Our Country India', topics: ['Location and Size', 'States and Union Territories', 'Neighbours', 'Physical Features Overview'] },
        { name: 'India Climate Vegetation and Wildlife', topics: ['Monsoon', 'Natural Vegetation Zones', 'Wildlife Sanctuaries', 'Conservation'] },
        { name: 'Understanding Diversity', topics: ['Unity in Diversity', 'Regional Differences', 'Culture and Tradition', 'Discrimination'] },
        { name: 'Local Government', topics: ['Gram Panchayat', 'Urban Local Bodies', 'Ward Sabha', 'Municipal Corporation'] },
      ],
    },
    {
      name: 'English',
      chapters: [
        { name: 'A Pact with the Sun', topics: ['Story Comprehension', 'Character Analysis', 'Moral Values', 'Vocabulary'] },
        { name: 'Grammar Nouns and Pronouns', topics: ['Types of Nouns', 'Pronoun Usage', 'Possessive Pronouns', 'Reflexive Pronouns'] },
        { name: 'Grammar Tenses', topics: ['Simple Tenses', 'Progressive Tenses', 'Perfect Tenses', 'Tense Timeline'] },
        { name: 'Writing Skills', topics: ['Paragraph Writing', 'Descriptive Writing', 'Informal Letters', 'Notice Writing'] },
        { name: 'Poetry Appreciation', topics: ['Rhyme Scheme', 'Figures of Speech', 'Imagery', 'Theme and Message'] },
      ],
    },
    {
      name: 'Hindi',
      chapters: [
        { name: 'Vasant Bhag 1', topics: ['Kavita Path', 'Gadya Path', 'Lekhak Parichay', 'Bodh Prashn'] },
        { name: 'Vyakaran', topics: ['Sangya evam Sarvanam', 'Visheshan aur Kriya', 'Kal', 'Sandhi aur Samas'] },
        { name: 'Lekhan Kaushal', topics: ['Anuched Lekhan', 'Patra Lekhan', 'Nibandh', 'Apathit Gadyansh'] },
      ],
    },
    {
      name: 'Computer Science',
      chapters: [
        { name: 'Introduction to Computers', topics: ['History of Computers', 'Types of Computers', 'Input and Output Devices', 'CPU and Memory'] },
        { name: 'Windows and MS Office', topics: ['Desktop and Icons', 'File Management', 'MS Word Basics', 'MS Paint'] },
        { name: 'Internet Basics', topics: ['What is Internet', 'Web Browsers', 'Email Introduction', 'Safe Surfing'] },
      ],
    },
  ],
}

// ── Class 7 ───────────────────────────────────────────────────────────────────
const CLASS_7: ClassEntry = {
  class: 'Class 7',
  subjects: [
    {
      name: 'Mathematics',
      chapters: [
        { name: 'Integers', topics: ['Properties of Integers', 'Multiplication of Integers', 'Division of Integers', 'BODMAS with Integers'] },
        { name: 'Fractions and Decimals', topics: ['Multiplication of Fractions', 'Division of Fractions', 'Decimal Multiplication', 'Decimal Division'] },
        { name: 'Data Handling', topics: ['Collection and Organisation', 'Mean Median Mode', 'Probability Basics', 'Bar Graphs and Pie Charts'] },
        { name: 'Simple Equations', topics: ['Setting Up Equations', 'Solving Linear Equations', 'Word Problems', 'Transposing'] },
        { name: 'Lines and Angles', topics: ['Related Angles', 'Pairs of Lines', 'Transversal', 'Angle Sum Properties'] },
        { name: 'Triangles', topics: ['Properties of Triangles', 'Congruence', 'Congruence Criteria SAS SSS ASA', 'Inequalities in Triangles'] },
        { name: 'Comparing Quantities', topics: ['Fractions and Percentages', 'Profit and Loss', 'Simple Interest', 'Discount and Markup'] },
        { name: 'Rational Numbers', topics: ['What are Rational Numbers', 'Positive and Negative Rationals', 'Rational Number on Number Line', 'Operations'] },
        { name: 'Practical Geometry', topics: ['Constructing Triangles SSS SAS', 'ASA and RHS Construction', 'Constructing Special Angles', 'Applications'] },
        { name: 'Perimeter and Area', topics: ['Area of Triangles', 'Area of Parallelograms', 'Circles Circumference and Area', 'Conversion of Units'] },
        { name: 'Algebraic Expressions', topics: ['Terms and Coefficients', 'Like and Unlike Terms', 'Addition and Subtraction', 'Simple Evaluation'] },
        { name: 'Exponents and Powers', topics: ['Exponential Notation', 'Laws of Exponents', 'Powers of 10', 'Scientific Notation'] },
        { name: 'Symmetry', topics: ['Lines of Symmetry in Polygons', 'Rotational Symmetry', 'Order of Rotation', 'Regular Polygons'] },
        { name: 'Visualising Solid Shapes', topics: ['3D Shapes', 'Nets of Solids', 'Faces Edges Vertices', 'Front Top Side Views'] },
      ],
    },
    {
      name: 'Science',
      chapters: [
        { name: 'Nutrition in Plants', topics: ['Photosynthesis', 'Autotrophs and Heterotrophs', 'Saprotrophic and Parasitic Nutrition', 'Pitcher Plant'] },
        { name: 'Nutrition in Animals', topics: ['Modes of Nutrition', 'Digestive System in Humans', 'Ruminants Digestion', 'Amoeba Nutrition'] },
        { name: 'Fibre to Fabric', topics: ['Sheep to Wool', 'Silk Production Sericulture', 'Synthetic Fibres', 'Properties Comparison'] },
        { name: 'Heat', topics: ['Temperature and Heat', 'Thermometer', 'Transfer of Heat', 'Land and Sea Breeze'] },
        { name: 'Acids Bases and Salts', topics: ['Natural Indicators', 'Acids and Bases Examples', 'Neutralisation', 'Everyday Applications'] },
        { name: 'Physical and Chemical Changes', topics: ['Physical Changes', 'Chemical Changes', 'Rusting and Crystallisation', 'Galvanisation'] },
        { name: 'Weather Climate and Adaptation', topics: ['Weather vs Climate', 'Tropical Rainforest', 'Polar Regions', 'Animal Adaptations'] },
        { name: 'Winds Storms and Cyclones', topics: ['Air Pressure', 'Monsoon Winds', 'Thunderstorms', 'Cyclone Safety'] },
        { name: 'Soil', topics: ['Composition of Soil', 'Types of Soil', 'Soil and Crops', 'Soil Erosion and Conservation'] },
        { name: 'Respiration in Organisms', topics: ['Breathing vs Respiration', 'Aerobic and Anaerobic', 'Respiration in Plants', 'Fermentation'] },
        { name: 'Transportation in Animals and Plants', topics: ['Circulatory System', 'Blood and Components', 'Heartbeat', 'Transport in Plants Xylem and Phloem'] },
        { name: 'Reproduction in Plants', topics: ['Vegetative Propagation', 'Sexual Reproduction', 'Seed Dispersal', 'Pollination'] },
        { name: 'Motion and Time', topics: ['Uniform and Non-uniform Motion', 'Speed', 'Distance-Time Graphs', 'Units of Speed'] },
        { name: 'Electric Current and its Effects', topics: ['Electric Circuit', 'Heating Effect', 'Magnetic Effect', 'Electromagnet'] },
        { name: 'Light', topics: ['Light Travels in Straight Lines', 'Reflection', 'Spherical Mirrors', 'Lenses Basics'] },
        { name: 'Forests Our Lifeline', topics: ['Ecosystem', 'Food Web', 'Conservation', 'Deforestation Effects'] },
        { name: 'Wastewater Story', topics: ['Sewage Treatment', 'Waterborne Diseases', 'Sanitation', 'Vermi-composting'] },
      ],
    },
    {
      name: 'Social Science',
      chapters: [
        { name: 'Tracing Changes Through a Thousand Years', topics: ['New Sources', 'Historians and History', 'Changing Maps', 'Medieval India Overview'] },
        { name: 'New Kings and Kingdoms', topics: ['Rise of New Dynasties', 'Prashastis', 'Rashtrakutas and Cholas', 'Land Revenue'] },
        { name: 'The Delhi Sultans', topics: ['First Sultans', 'Iltutmish and Razia', 'Khilji and Tughlaq', 'Administration'] },
        { name: 'The Mughal Empire', topics: ['Babur and Akbar', 'Mughal Administration', 'Military Campaigns', 'Mansabdari System'] },
        { name: 'Rulers and Buildings', topics: ['Temple Architecture', 'Regional Styles', 'Mughal Architecture', 'Significance of Structures'] },
        { name: 'Our Environment', topics: ['Lithosphere and Rocks', 'Hydrosphere', 'Atmosphere Layers', 'Biosphere and Life'] },
        { name: 'Inside the Earth', topics: ['Layers of the Earth', 'Rocks and Minerals', 'Types of Rocks', 'Rock Cycle'] },
        { name: 'Our Changing Earth', topics: ['Tectonic Plates', 'Earthquakes', 'Volcanoes', 'Denudation Forces'] },
        { name: 'Air', topics: ['Composition of Air', 'Atmospheric Pressure', 'Types of Winds', 'Humidity and Precipitation'] },
        { name: 'Water', topics: ['Water Distribution', 'Water Cycle Detailed', 'Ocean Currents', 'Water Scarcity'] },
        { name: 'Natural Vegetation and Wild Life', topics: ['Factors Affecting Vegetation', 'Tropical Forests', 'Grasslands', 'Desert Biome'] },
        { name: 'Human Environment', topics: ['Desert Life', 'Tropical Rainforest Life', 'Temperate Climate Life', 'Human Adaptations'] },
        { name: 'Equality', topics: ['Value of Equality', 'Discrimination in Society', 'Case Studies', 'Constitutional Provisions'] },
        { name: 'State Government', topics: ['State Legislature', 'Chief Minister and Cabinet', 'State Judiciary', 'Functions of State'] },
      ],
    },
    {
      name: 'English',
      chapters: [
        { name: 'Honeycomb Prose', topics: ['Three Questions by Tolstoy', 'The Ashes that Made Trees Bloom', 'Quality', 'The Invention of Vita-Wonk'] },
        { name: 'Honeycomb Poetry', topics: ['The Squirrel', 'The Rebel', 'The Trees', 'Mystery of the Talking Fan'] },
        { name: 'Grammar', topics: ['Adjectives and Degrees', 'Adverbs', 'Articles', 'Prepositions'] },
        { name: 'Writing Skills', topics: ['Formal Letter', 'Story Writing', 'Message Writing', 'Poster Making'] },
      ],
    },
    {
      name: 'Hindi',
      chapters: [
        { name: 'Vasant Bhag 2', topics: ['Gadya Path', 'Padya Path', 'Bodh Prashn', 'Shabd Bhandar'] },
        { name: 'Vyakaran', topics: ['Shabd Vichar', 'Vakya aur unke Prakar', 'Anuched', 'Patra Lekhan'] },
      ],
    },
    {
      name: 'Computer Science',
      chapters: [
        { name: 'Advanced MS Office', topics: ['MS Word Formatting', 'MS Excel Basics', 'MS PowerPoint', 'Tables and Charts'] },
        { name: 'Introduction to Programming', topics: ['What is a Program', 'Algorithms', 'Flowcharts', 'Introduction to Scratch'] },
        { name: 'Networking and Internet', topics: ['LAN WAN MAN', 'Protocols', 'Internet Services', 'Cybersafety'] },
      ],
    },
  ],
}

// ── Class 8 ───────────────────────────────────────────────────────────────────
const CLASS_8: ClassEntry = {
  class: 'Class 8',
  subjects: [
    {
      name: 'Mathematics',
      chapters: [
        { name: 'Rational Numbers', topics: ['Properties Closure Associativity', 'Additive and Multiplicative Identity', 'Rational Number on Number Line', 'Operations'] },
        { name: 'Linear Equations in One Variable', topics: ['Equations with Variables', 'Solving Word Problems', 'Equations Reducible to Linear', 'Applications'] },
        { name: 'Understanding Quadrilaterals', topics: ['Types of Quadrilaterals', 'Angle Sum Property', 'Properties of Parallelogram', 'Practical Constructions'] },
        { name: 'Data Handling', topics: ['Grouped Data', 'Histograms', 'Circle Graphs Pie Charts', 'Probability Introduction'] },
        { name: 'Squares and Square Roots', topics: ['Perfect Squares', 'Properties', 'Finding Square Roots', 'Pythagorean Triplets'] },
        { name: 'Cubes and Cube Roots', topics: ['Perfect Cubes', 'Cube Root by Estimation', 'Cube Root of Negative Numbers', 'Applications'] },
        { name: 'Comparing Quantities', topics: ['Discounts and Sale Price', 'Sales Tax and VAT', 'Compound Interest', 'Simple vs Compound Interest'] },
        { name: 'Algebraic Expressions and Identities', topics: ['Multiplying Expressions', 'Standard Identities', 'Applying Identities', 'Factorisation'] },
        { name: 'Visualising Solid Shapes', topics: ['Euler Formula', 'Polyhedra', 'Maps vs Models', 'Cross-Sections'] },
        { name: 'Mensuration', topics: ['Area of Trapezium and Polygon', 'Volume of Cuboid and Cube', 'Volume of Cylinder', 'Surface Areas'] },
        { name: 'Exponents and Powers', topics: ['Negative Exponents', 'Laws of Exponents', 'Standard Form', 'Comparing Numbers'] },
        { name: 'Direct and Inverse Proportions', topics: ['Direct Proportion', 'Inverse Proportion', 'Proportional Graphs', 'Real-life Problems'] },
        { name: 'Factorisation', topics: ['Common Factors', 'Factorisation by Regrouping', 'Factorisation Using Identities', 'Division of Polynomials'] },
        { name: 'Introduction to Graphs', topics: ['Coordinate System', 'Plotting Points', 'Line Graphs', 'Distance-Time Graphs'] },
        { name: 'Playing with Numbers', topics: ['Numbers in General Form', 'Games with Digits', 'Divisibility Tests', 'Puzzles'] },
      ],
    },
    {
      name: 'Science',
      chapters: [
        { name: 'Crop Production and Management', topics: ['Agricultural Practices', 'Preparation of Soil', 'Irrigation Methods', 'Storage of Grains'] },
        { name: 'Microorganisms Friend and Foe', topics: ['Types of Microorganisms', 'Useful Microorganisms', 'Harmful Microorganisms', 'Food Preservation'] },
        { name: 'Synthetic Fibres and Plastics', topics: ['Rayon and Nylon', 'Polyester and Acrylic', 'Types of Plastics', 'Plastics Friend or Foe'] },
        { name: 'Materials Metals and Non-metals', topics: ['Physical Properties', 'Chemical Properties', 'Reactivity Series', 'Uses of Metals and Non-metals'] },
        { name: 'Coal and Petroleum', topics: ['Fossil Fuels Formation', 'Products of Coal', 'Petroleum Refining', 'Conservation of Fuels'] },
        { name: 'Combustion and Flame', topics: ['Conditions for Combustion', 'Types of Combustion', 'Zone of Flame', 'Fire Control'] },
        { name: 'Conservation of Plants and Animals', topics: ['Deforestation', 'Conservation of Flora and Fauna', 'National Parks and Sanctuaries', 'Endangered Species'] },
        { name: 'Cell Structure and Functions', topics: ['Discovery of Cell', 'Cell Organelles', 'Plant vs Animal Cell', 'Unicellular vs Multicellular'] },
        { name: 'Reproduction in Animals', topics: ['Sexual Reproduction', 'Asexual Reproduction', 'Viviparous and Oviparous', 'Life Cycle of Frog'] },
        { name: 'Reaching the Age of Adolescence', topics: ['Puberty Changes', 'Secondary Sexual Characters', 'Reproductive Health', 'Role of Hormones'] },
        { name: 'Force and Pressure', topics: ['Contact and Non-contact Forces', 'Pressure Concept', 'Atmospheric Pressure', 'Pressure in Liquids and Gases'] },
        { name: 'Friction', topics: ['Types of Friction', 'Factors Affecting Friction', 'Advantages and Disadvantages', 'Reducing Friction'] },
        { name: 'Sound', topics: ['Production of Sound', 'Propagation of Sound', 'Frequency and Amplitude', 'Noise Pollution'] },
        { name: 'Chemical Effects of Electric Current', topics: ['Conductors of Electricity', 'LED and Its Uses', 'Electrolysis', 'Electroplating'] },
        { name: 'Some Natural Phenomena', topics: ['Lightning and Thunderstorm', 'Charging by Friction', 'Earthquakes', 'Safety Measures'] },
        { name: 'Light', topics: ['Reflection Laws', 'Kaleidoscope', 'Refraction', 'Human Eye Structure'] },
        { name: 'Stars and the Solar System', topics: ['Moon and Phases', 'Stars and Constellations', 'Solar System Planets', 'Meteors and Comets'] },
        { name: 'Pollution of Air and Water', topics: ['Air Pollutants', 'Greenhouse Effect', 'Water Pollution Sources', 'Potable Water Treatment'] },
      ],
    },
    {
      name: 'Social Science',
      chapters: [
        { name: 'How When and Where', topics: ['Colonialism and India', 'British Census', 'Surveys and Maps', 'Archives'] },
        { name: 'From Trade to Territory', topics: ['East India Company', 'Battles of Plassey and Buxar', 'Doctrine of Lapse', 'Administration'] },
        { name: 'Ruling the Countryside', topics: ['Revenue Systems Ryotwari Zamindari', 'Blue Rebellion', 'Impact on Peasants', 'Cash Crop Farming'] },
        { name: 'Tribals Dikus and the Vision of Golden Age', topics: ['Tribal Society', 'Birsa Munda', 'Forest Laws', 'Displacement'] },
        { name: 'When People Rebel 1857', topics: ['1857 Revolt Causes', 'Course and Aftermath', 'Peasant and Tribal Revolts', 'Colonial Response'] },
        { name: 'Civilising the Native', topics: ['Woods Despatch', 'Missionary Schools', 'Debate on Education', 'Indian Response'] },
        { name: 'Women Caste and Reform', topics: ['Social Reforms 19th Century', 'Ram Mohan Roy', 'Abolition of Sati', 'Caste Movements'] },
        { name: 'Resources', topics: ['Types of Resources', 'Renewable and Non-renewable', 'Resource Conservation', 'Human Resources'] },
        { name: 'Land Soil Water', topics: ['Land Use', 'Types of Soil and Erosion', 'Water Scarcity', 'Dam Controversy'] },
        { name: 'Mineral and Power Resources', topics: ['Types of Minerals', 'Mining', 'Conventional and Non-conventional Energy', 'Solar and Wind'] },
        { name: 'Agriculture', topics: ['Types of Farming', 'Cropping Patterns', 'Major Crops of the World', 'Agricultural Development'] },
        { name: 'Industries', topics: ['Classification of Industries', 'Textile Industry', 'Iron and Steel Industry', 'Industrial Pollution'] },
        { name: 'Understanding Secularism', topics: ['What is Secularism', 'Indian Secularism vs Others', 'Separation of Church and State', 'Religious Freedom'] },
        { name: 'Parliament and the Making of Laws', topics: ['Parliament Structure', 'Law-making Process', 'Parliamentary Debates', 'Role of Opposition'] },
        { name: 'Confronting Marginalisation', topics: ['Marginalised Communities', 'Constitutional Provisions', 'Dalit Rights', 'Adivasi Issues'] },
        { name: 'Public Facilities', topics: ['Right to Public Facilities', 'Water and Sanitation', 'Government Role', 'Privatisation Debate'] },
      ],
    },
    {
      name: 'English',
      chapters: [
        { name: 'Honeydew Prose', topics: ['The Best Christmas Present', 'The Tsunami', 'Glimpses of the Past', 'Jalebis'] },
        { name: 'Honeydew Poetry', topics: ['The Ant and the Cricket', 'Geography Lesson', 'Macavity the Mystery Cat', 'The Duck and the Kangaroo'] },
        { name: 'Grammar', topics: ['Subject-Verb Agreement', 'Clauses Main and Subordinate', 'Reported Speech', 'Transformation of Sentences'] },
        { name: 'Writing Skills', topics: ['Formal and Informal Letters', 'Analytical Paragraph', 'Speech Writing', 'Report Writing Basics'] },
      ],
    },
    {
      name: 'Hindi',
      chapters: [
        { name: 'Vasant Bhag 3', topics: ['Dhwani Kavita', 'Lakh ki Churiyan', 'Bus ki Yatra', 'Diwanon ki Hasti'] },
        { name: 'Vyakaran', topics: ['Vachya', 'Pad Parichay', 'Muhavare', 'Ras aur Chhand'] },
      ],
    },
    {
      name: 'Computer Science',
      chapters: [
        { name: 'Scratch Programming', topics: ['Sprites and Backdrops', 'Motion and Events', 'Loops and Conditionals', 'Creating Simple Games'] },
        { name: 'HTML Basics', topics: ['Structure of HTML', 'Tags and Attributes', 'Headings and Paragraphs', 'Lists and Links'] },
        { name: 'Database Concepts', topics: ['What is a Database', 'Tables and Records', 'Introduction to SQL', 'Sorting and Filtering'] },
      ],
    },
  ],
}

// ── Class 9 ───────────────────────────────────────────────────────────────────
const CLASS_9: ClassEntry = {
  class: 'Class 9',
  subjects: [
    {
      name: 'Mathematics',
      chapters: [
        { name: 'Number Systems', topics: ['Irrational Numbers', 'Real Numbers on Number Line', 'Laws of Exponents for Real Numbers', 'Decimal Expansions'] },
        { name: 'Polynomials', topics: ['Zeros of Polynomials', 'Remainder and Factor Theorem', 'Algebraic Identities', 'Factorisation of Polynomials'] },
        { name: 'Coordinate Geometry', topics: ['Cartesian System', 'Plotting Points', 'Graphs of Linear Equations', 'Distance from Axes'] },
        { name: 'Linear Equations in Two Variables', topics: ['Solutions of Linear Equations', 'Graph of Linear Equation', 'Equations of Axes', 'Word Problems'] },
        { name: 'Introduction to Euclid Geometry', topics: ['Euclid Definitions', 'Axioms and Postulates', 'Equivalent Versions', 'Historical Background'] },
        { name: 'Lines and Angles', topics: ['Basic Terms', 'Intersecting and Parallel Lines', 'Pairs of Angles', 'Angle Sum Property of Triangle'] },
        { name: 'Triangles', topics: ['Congruence of Triangles', 'SAS SSS ASA AAS RHS Criteria', 'Properties of Isosceles Triangle', 'Inequalities'] },
        { name: 'Quadrilaterals', topics: ['Angle Sum Property', 'Properties of Parallelogram', 'Mid-Point Theorem', 'Types of Quadrilaterals'] },
        { name: 'Circles', topics: ['Chord Properties', 'Perpendicular from Centre', 'Equal Chords and Distances', 'Angle in a Semicircle'] },
        { name: 'Heron Formula', topics: ['Area of Triangle by Heron Formula', 'Area of Quadrilateral', 'Applications in Daily Life', 'Numerical Problems'] },
        { name: 'Surface Areas and Volumes', topics: ['Surface Area of Cuboid and Cube', 'Cylinder Cone and Sphere', 'Volume of Solids', 'Combination of Solids'] },
        { name: 'Statistics', topics: ['Collection and Presentation', 'Ungrouped and Grouped Data', 'Mean Median Mode', 'Graphical Representations'] },
        { name: 'Probability', topics: ['Experimental vs Theoretical Probability', 'Events and Outcomes', 'Simple Problems', 'Real-life Applications'] },
      ],
    },
    {
      name: 'Science',
      chapters: [
        { name: 'Matter in Our Surroundings', topics: ['States of Matter', 'Evaporation', 'Interconversion of States', 'Latent Heat'] },
        { name: 'Is Matter Around Us Pure', topics: ['Pure Substances and Mixtures', 'Solutions', 'Separation Techniques', 'Physical and Chemical Changes'] },
        { name: 'Atoms and Molecules', topics: ['Laws of Chemical Combination', 'Atomic Mass', 'Molecules and Formulae', 'Mole Concept'] },
        { name: 'Structure of the Atom', topics: ['Thomson and Rutherford Models', 'Bohr Model', 'Neutrons and Isotopes', 'Valency'] },
        { name: 'The Fundamental Unit of Life', topics: ['Discovery of Cell', 'Prokaryotic and Eukaryotic', 'Cell Membrane and Wall', 'Organelles and Functions'] },
        { name: 'Tissues', topics: ['Plant Tissues', 'Animal Tissues', 'Meristematic Tissue', 'Epithelial and Connective Tissue'] },
        { name: 'Motion', topics: ['Distance and Displacement', 'Speed and Velocity', 'Acceleration', 'Equations of Motion'] },
        { name: 'Force and Newton Laws', topics: ['Newton Three Laws', 'Inertia', 'Momentum', 'Action and Reaction'] },
        { name: 'Gravitation', topics: ['Universal Law of Gravitation', 'Free Fall', 'Mass and Weight', 'Thrust and Pressure'] },
        { name: 'Work and Energy', topics: ['Work Done', 'Kinetic and Potential Energy', 'Law of Conservation of Energy', 'Power and Commercial Unit'] },
        { name: 'Sound', topics: ['Production and Propagation', 'Characteristics of Sound', 'Reflection of Sound Echo', 'Range of Hearing'] },
        { name: 'Why Do We Fall Ill', topics: ['Health and Disease', 'Infectious Diseases', 'Principles of Treatment', 'Prevention and Vaccines'] },
        { name: 'Natural Resources', topics: ['Biogeochemical Cycles', 'Nitrogen Cycle', 'Carbon Cycle', 'Ozone Layer'] },
        { name: 'Improvement in Food Resources', topics: ['Crop Improvement', 'Storage and Protection', 'Animal Husbandry', 'Poultry and Fish Farming'] },
      ],
    },
    {
      name: 'Social Science',
      chapters: [
        { name: 'The French Revolution', topics: ['Causes', 'Events of 1789', 'Napoleon', 'Legacy of Revolution'] },
        { name: 'Socialism in Europe and Russia', topics: ['Socialist Ideas', 'Russian Revolution 1917', 'Stalin Russia', 'Global Impact'] },
        { name: 'Nazism and Rise of Hitler', topics: ['Weimar Republic', 'Hitler Rise', 'Nazi Ideology', 'Holocaust'] },
        { name: 'Forest Society and Colonialism', topics: ['Colonial Forest Laws', 'Impact on Tribals', 'Java Forests', 'Resistance Movements'] },
        { name: 'Pastoralists in the Modern World', topics: ['Pastoral Nomads', 'Colonial Policies', 'African Pastoral Communities', 'Challenges Today'] },
        { name: 'India Size and Location', topics: ['Geographical Features', 'Latitudinal and Longitudinal Extent', 'Neighbours', 'Time Zone'] },
        { name: 'Physical Features of India', topics: ['Himalayan Mountains', 'Northern Plains', 'Peninsular Plateau', 'Islands'] },
        { name: 'Drainage', topics: ['Himalayan Rivers', 'Peninsular Rivers', 'Lakes', 'River Pollution'] },
        { name: 'Climate', topics: ['Factors Influencing Climate', 'Monsoon', 'Seasons', 'Climate and Human Life'] },
        { name: 'Natural Vegetation and Wildlife', topics: ['Tropical Evergreen Forests', 'Deciduous Forests', 'Thorny Shrubs', 'Endangered Species'] },
        { name: 'Population', topics: ['Population Distribution', 'Density', 'Population Growth', 'Age-Sex Composition'] },
        { name: 'What is Democracy', topics: ['Features of Democracy', 'Democratic vs Non-democratic', 'Pillars of Democracy', 'Democratic Countries'] },
        { name: 'Constitutional Design', topics: ['Constituent Assembly', 'Preamble', 'Fundamental Rights', 'DPSP'] },
        { name: 'Electoral Politics', topics: ['Election System', 'Model Code of Conduct', 'Electoral Rolls', 'Role of ECI'] },
        { name: 'Working of Institutions', topics: ['Parliament', 'Executive', 'Judiciary', 'Checks and Balances'] },
        { name: 'Democratic Rights', topics: ['Fundamental Rights', 'Right to Equality', 'Right to Freedom', 'Judicial Remedies'] },
        { name: 'The Story of Village Palampur', topics: ['Farming in Palampur', 'Non-Farm Activities', 'Capital and Credit', 'Market Structure'] },
        { name: 'People as Resource', topics: ['Human Capital', 'Quality of Population', 'Unemployment', 'Women and Economic Development'] },
        { name: 'Poverty as a Challenge', topics: ['Poverty Line', 'Poverty Estimation', 'Vulnerable Groups', 'Anti-Poverty Policies'] },
        { name: 'Food Security in India', topics: ['Food Security Meaning', 'Buffer Stock', 'PDS System', 'Hunger and Food Crisis'] },
      ],
    },
    {
      name: 'English',
      chapters: [
        { name: 'Beehive Prose', topics: ['The Fun They Had', 'The Sound of Music', 'The Little Girl', 'A Truly Beautiful Mind'] },
        { name: 'Beehive Poetry', topics: ['The Road Not Taken', 'Wind', 'Rain on the Roof', 'No Men Are Foreign'] },
        { name: 'Moments Supplementary', topics: ['The Lost Child', 'Adventures of Toto', 'Iswaran the Storyteller', 'In the Kingdom of Fools'] },
        { name: 'Grammar', topics: ['Modals', 'Determiners', 'Clauses', 'Tenses Review'] },
        { name: 'Writing Skills', topics: ['Descriptive Essay', 'Analytical Paragraph', 'Formal Letter Writing', 'Story Writing'] },
      ],
    },
    {
      name: 'Hindi',
      chapters: [
        { name: 'Kshitij Bhag 1', topics: ['Do Bailon ki Katha', 'Lhasa ki Or', 'Savle Sapno ki Yaad', 'Mata Wali'] },
        { name: 'Kritika Bhag 1', topics: ['Is Jal Pralay Mein', 'Mere Sang ki Auraten', 'Ridh ki Haddi', 'Mati Wali'] },
        { name: 'Vyakaran', topics: ['Vakya Bhed', 'Alankar', 'Samas', 'Chhand aur Ras'] },
      ],
    },
    {
      name: 'Computer Science',
      chapters: [
        { name: 'Python Introduction', topics: ['What is Python', 'Variables and Data Types', 'Input and Output', 'Basic Operators'] },
        { name: 'Control Structures', topics: ['if-else Statements', 'while Loop', 'for Loop', 'Nested Loops'] },
        { name: 'Functions and Modules', topics: ['Defining Functions', 'Parameters and Return', 'Built-in Functions', 'Import Modules'] },
        { name: 'Cyber Safety', topics: ['Online Privacy', 'Cyberbullying', 'Safe Digital Practices', 'Ethical Use of Technology'] },
      ],
    },
  ],
}

// ── Class 10 ──────────────────────────────────────────────────────────────────
const CLASS_10: ClassEntry = {
  class: 'Class 10',
  subjects: [
    {
      name: 'Mathematics',
      chapters: [
        { name: 'Real Numbers', topics: ['Introduction', 'The Fundamental Theorem of Arithmetic', 'Revisiting Irrational Numbers'] },
        { name: 'Polynomials', topics: ['Introduction', 'Geometrical Meaning of the Zeroes of a Polynomial', 'Relationship between Zeroes and Coefficients of a Polynomial'] },
        { name: 'Pair of Linear Equations in Two Variables', topics: ['Introduction', 'Graphical Method of Solution of a Pair of Linear Equations', 'Substitution Method', 'Elimination Method'] },
        { name: 'Quadratic Equations', topics: ['Introduction', 'Quadratic Equations', 'Solution of a Quadratic Equation by Factorisation', 'Nature of Roots'] },
        { name: 'Arithmetic Progressions', topics: ['Introduction', 'Arithmetic Progressions', 'nth Term of an AP', 'Sum of First n Terms of an AP'] },
        { name: 'Triangles', topics: ['Introduction', 'Similar Figures', 'Similarity of Triangles', 'Criteria for Similarity of Triangles'] },
        { name: 'Coordinate Geometry', topics: ['Introduction', 'Distance Formula', 'Section Formula'] },
        { name: 'Introduction to Trigonometry', topics: ['Introduction', 'Trigonometric Ratios', 'Trigonometric Ratios of Some Specific Angles', 'Trigonometric Identities'] },
        { name: 'Some Applications of Trigonometry', topics: ['Heights and Distances'] },
        { name: 'Circles', topics: ['Introduction', 'Tangent to a Circle', 'Number of Tangents from a Point on a Circle'] },
        { name: 'Areas Related to Circles', topics: ['Areas of Sector and Segment of a Circle'] },
        { name: 'Surface Areas and Volumes', topics: ['Introduction', 'Surface Area of a Combination of Solids', 'Volume of a Combination of Solids'] },
        { name: 'Statistics', topics: ['Introduction', 'Mean of Grouped Data', 'Mode of Grouped Data', 'Median of Grouped Data'] },
        { name: 'Probability', topics: ['Probability – A Theoretical Approach'] },
      ],
    },
    {
      name: 'Science',
      chapters: [
        { name: 'Chemical Reactions and Equations', topics: ['Writing Chemical Equations', 'Types of Chemical Reactions', 'Oxidation and Reduction', 'Effects of Oxidation'] },
        { name: 'Acids Bases and Salts', topics: ['Properties of Acids and Bases', 'pH Scale', 'Salts', 'Bleaching Powder and Baking Soda'] },
        { name: 'Metals and Non-metals', topics: ['Physical and Chemical Properties', 'Reactivity Series', 'Extraction of Metals', 'Corrosion'] },
        { name: 'Carbon and Its Compounds', topics: ['Bonding in Carbon', 'Functional Groups', 'Homologous Series', 'Soaps and Detergents'] },
        { name: 'Periodic Classification of Elements', topics: ['Dobereiner Triads', 'Newland Law of Octaves', 'Mendeleev Periodic Table', 'Modern Periodic Table'] },
        { name: 'Life Processes', topics: ['Nutrition Autotrophic and Heterotrophic', 'Respiration', 'Transportation', 'Excretion'] },
        { name: 'Control and Coordination', topics: ['Nervous System', 'Reflex Action', 'Hormones in Animals', 'Tropic Movements in Plants'] },
        { name: 'How Do Organisms Reproduce', topics: ['Modes of Reproduction', 'Asexual Reproduction', 'Sexual Reproduction in Flowering Plants', 'Human Reproduction'] },
        { name: 'Heredity and Evolution', topics: ['Mendel Laws', 'Sex Determination', 'Evolution Darwin', 'Speciation'] },
        { name: 'Light Reflection and Refraction', topics: ['Reflection Laws and Mirror Formula', 'Refraction and Snell Law', 'Lens Formula', 'Power of Lens'] },
        { name: 'Human Eye and Colourful World', topics: ['Parts of the Eye', 'Power of Accommodation', 'Defects of Vision', 'Dispersion of Light'] },
        { name: 'Electricity', topics: ['Ohm Law', 'Resistance', 'Series and Parallel Circuits', 'Heating Effect of Current'] },
        { name: 'Magnetic Effects of Electric Current', topics: ['Magnetic Field', 'Electromagnet', 'Electric Motor', 'Electromagnetic Induction and Generator'] },
        { name: 'Sources of Energy', topics: ['Conventional Sources', 'Non-conventional Sources Solar Wind Bio', 'Nuclear Energy', 'Environment and Energy'] },
        { name: 'Our Environment', topics: ['Ecosystem', 'Food Chains and Webs', 'Biodegradable Waste', 'Ozone Layer Depletion'] },
        { name: 'Sustainable Management of Natural Resources', topics: ['Natural Resource Management', 'Forest Conservation', 'Water Harvesting', 'Coal and Petroleum Conservation'] },
      ],
    },
    {
      name: 'Social Science',
      chapters: [
        { name: 'The Rise of Nationalism in Europe', topics: ['Romanticism and Nationalism', 'Unification of Italy', 'Unification of Germany', 'Balkan Conflict'] },
        { name: 'Nationalism in India', topics: ['Non-Cooperation Movement', 'Civil Disobedience', 'Quit India Movement', 'Partition and Independence'] },
        { name: 'The Making of a Global World', topics: ['Pre-modern World Trade', 'Colonial World', 'Interwar Economy', 'Bretton Woods System'] },
        { name: 'The Age of Industrialisation', topics: ['Proto-Industrialisation', 'Industrial Revolution', 'Factories and Workers', 'Industrialisation in India'] },
        { name: 'Print Culture and Modern World', topics: ['Gutenberg Press', 'Print and Nationalism', 'Print in Colonial India', 'Women and Print'] },
        { name: 'Resources and Development', topics: ['Types of Resources', 'Resource Planning', 'Land Resources', 'Soil Erosion and Conservation'] },
        { name: 'Forest and Wildlife Resources', topics: ['Types of Forests', 'Biodiversity Loss', 'Conservation Projects', 'Community and Conservation'] },
        { name: 'Water Resources', topics: ['Water Scarcity', 'Multipurpose River Projects', 'Rainwater Harvesting', 'Groundwater Depletion'] },
        { name: 'Agriculture', topics: ['Types of Farming', 'Cropping Pattern', 'Major Crops', 'Technological and Institutional Reforms'] },
        { name: 'Minerals and Energy Resources', topics: ['Types of Minerals', 'Distribution of Minerals', 'Conservation', 'Energy Resources'] },
        { name: 'Manufacturing Industries', topics: ['Classification', 'Textile Industry', 'Steel and Iron', 'Industrial Pollution'] },
        { name: 'Lifelines of National Economy', topics: ['Roadways', 'Railways', 'Pipelines', 'Airways and Waterways'] },
        { name: 'Power Sharing', topics: ['Why Power Sharing', 'Forms of Power Sharing', 'Belgium and Sri Lanka Case', 'Majoritarianism vs Accommodation'] },
        { name: 'Federalism', topics: ['What is Federalism', 'Indian Federalism', 'Decentralisation', 'Language Policy'] },
        { name: 'Gender Religion and Caste', topics: ['Gender and Politics', 'Communalism', 'Caste and Politics', 'Secularism in India'] },
        { name: 'Political Parties', topics: ['Functions of Parties', 'National vs Regional Parties', 'Challenges to Political Parties', 'Party Reforms'] },
        { name: 'Outcomes of Democracy', topics: ['Accountability', 'Economic Growth', 'Inequality and Poverty', 'Dignity and Freedom'] },
        { name: 'Development', topics: ['Development Goals', 'National Development vs Per Capita', 'HDI and Sustainability', 'Economic vs Human Development'] },
        { name: 'Sectors of the Indian Economy', topics: ['Primary Secondary and Tertiary', 'Organised vs Unorganised', 'GDP Contribution', 'Employment Patterns'] },
        { name: 'Money and Credit', topics: ['Money as Medium of Exchange', 'Modern Forms of Money', 'Credit and Role of Banks', 'Formal vs Informal Credit'] },
        { name: 'Globalisation and Indian Economy', topics: ['Globalisation Meaning', 'MNCs', 'WTO', 'Impact on Indian Producers and Consumers'] },
        { name: 'Consumer Rights', topics: ['Consumer Rights', 'Consumer Protection Act', 'Consumer Courts', 'Consumer Awareness'] },
      ],
    },
    {
      name: 'English',
      chapters: [
        { name: 'First Flight Prose', topics: ['A Letter to God', 'Nelson Mandela Long Walk to Freedom', 'Two Stories about Flying', 'The Hundred Dresses'] },
        { name: 'First Flight Poetry', topics: ['Dust of Snow', 'Fire and Ice', 'A Tiger in the Zoo', 'The Ball Poem', 'Amanda'] },
        { name: 'Footprints Without Feet', topics: ['A Triumph of Surgery', 'The Thief Story', 'The Midnight Visitor', 'Bholi'] },
        { name: 'Grammar', topics: ['Determiners', 'Modals', 'Subject-Verb Agreement', 'Integrated Grammar Exercises'] },
        { name: 'Writing Skills', topics: ['Formal Letter Writing', 'Article Writing', 'Analytical Paragraph', 'Debate and Speech Writing'] },
      ],
    },
    {
      name: 'Hindi',
      chapters: [
        { name: 'Kshitij Bhag 2', topics: ['Surdas ki Padavali', 'Tulsidas ke Dohe', 'Dev ki Kavita', 'Jayshankar Prasad'] },
        { name: 'Kritika Bhag 2', topics: ['Mata ka Anchal', 'George Pancham ki Naak', 'Sana Sana Hath Jodi', 'Ehi Thaiyaan Jhulni'] },
        { name: 'Vyakaran', topics: ['Pad Parichay', 'Vakya Bhed', 'Rachna ke Aadhar par Vakya', 'Apathit Gadyansh aur Kavyansh'] },
      ],
    },
    {
      name: 'Computer Science',
      chapters: [
        { name: 'Python Advanced', topics: ['Lists and Tuples', 'Dictionaries and Sets', 'File Handling', 'Exception Handling'] },
        { name: 'Data Science Basics', topics: ['Introduction to Data', 'Matplotlib and Plotting', 'NumPy Basics', 'Data Visualisation'] },
        { name: 'Database with SQL', topics: ['CREATE and INSERT', 'SELECT Queries', 'WHERE Clause and Aggregates', 'Joins'] },
        { name: 'Web Development', topics: ['HTML5', 'CSS3 Basics', 'Responsive Design', 'Introduction to JavaScript'] },
      ],
    },
  ],
}

// ── Class 11 Science ──────────────────────────────────────────────────────────
const CLASS_11_SCIENCE: ClassEntry = {
  class: 'Class 11 Science',
  subjects: [
    {
      name: 'Physics',
      chapters: [
        { name: 'Physical World', topics: ['Scope of Physics', 'Fundamental Forces', 'Conservation Laws', 'Measurement Accuracy'] },
        { name: 'Units and Measurements', topics: ['SI Units', 'Dimensional Analysis', 'Significant Figures', 'Errors in Measurement'] },
        { name: 'Motion in a Straight Line', topics: ['Position Path Length and Displacement', 'Average and Instantaneous Velocity', 'Acceleration', 'Kinematic Equations'] },
        { name: 'Motion in a Plane', topics: ['Vectors', 'Projectile Motion', 'Relative Velocity', 'Uniform Circular Motion'] },
        { name: 'Laws of Motion', topics: ['Newton Three Laws', 'Friction', 'Circular Motion Dynamics', 'Conservation of Momentum'] },
        { name: 'Work Energy and Power', topics: ['Work-Energy Theorem', 'Kinetic and Potential Energy', 'Collisions', 'Conservation of Energy'] },
        { name: 'Rotational Motion', topics: ['Torque and Angular Momentum', 'Moment of Inertia', 'Rotational Kinetic Energy', 'Rolling Motion'] },
        { name: 'Gravitation', topics: ['Kepler Laws', 'Gravitational Field', 'Escape Velocity', 'Satellites and Orbital Velocity'] },
        { name: 'Mechanical Properties of Solids', topics: ['Stress and Strain', 'Young Modulus', 'Elastic Moduli', 'Poisson Ratio'] },
        { name: 'Mechanical Properties of Fluids', topics: ['Pressure in Fluids', 'Bernoulli Principle', 'Viscosity and Stokes Law', 'Surface Tension'] },
        { name: 'Thermal Properties of Matter', topics: ['Heat and Temperature', 'Thermal Expansion', 'Specific Heat Capacity', 'Calorimetry'] },
        { name: 'Thermodynamics', topics: ['Thermodynamic State', 'Laws of Thermodynamics', 'Carnot Engine', 'Entropy'] },
        { name: 'Kinetic Theory of Gases', topics: ['Kinetic Molecular Theory', 'Mean Free Path', 'Degrees of Freedom', 'Equipartition of Energy'] },
        { name: 'Oscillations', topics: ['SHM', 'Energy in SHM', 'Simple Pendulum', 'Damped and Forced Oscillations'] },
        { name: 'Waves', topics: ['Wave Motion', 'Principle of Superposition', 'Stationary Waves', 'Beats and Doppler Effect'] },
      ],
    },
    {
      name: 'Chemistry',
      chapters: [
        { name: 'Some Basic Concepts of Chemistry', topics: ['Laws of Chemical Combination', 'Atomic and Molecular Masses', 'Mole Concept', 'Stoichiometry'] },
        { name: 'Structure of Atom', topics: ['Bohr Model', 'Quantum Mechanical Model', 'Orbitals and Quantum Numbers', 'Electronic Configuration'] },
        { name: 'Classification of Elements', topics: ['Periodic Law', 'Electronic Configuration and Table', 'Periodic Trends', 'Anomalous Properties'] },
        { name: 'Chemical Bonding', topics: ['Ionic Bond', 'Covalent Bond', 'VSEPR Theory', 'Hybridisation and Molecular Orbital Theory'] },
        { name: 'States of Matter', topics: ['Intermolecular Forces', 'Gas Laws', 'Ideal Gas Equation', 'Liquefaction of Gases'] },
        { name: 'Thermodynamics Chemistry', topics: ['System and Surroundings', 'Enthalpy', 'Hess Law', 'Gibbs Free Energy'] },
        { name: 'Equilibrium', topics: ['Chemical Equilibrium', 'Le Chatelier Principle', 'Ionic Equilibrium', 'Buffer Solutions'] },
        { name: 'Redox Reactions', topics: ['Oxidation States', 'Balancing Redox Equations', 'Types of Redox', 'Applications'] },
        { name: 'Hydrogen', topics: ['Properties of Hydrogen', 'Preparation of H2', 'Water', 'Heavy Water and Hydrogen Peroxide'] },
        { name: 's-Block Elements', topics: ['Group 1 Alkali Metals', 'Group 2 Alkaline Earth', 'Compounds', 'Biological Importance'] },
        { name: 'p-Block Elements Part 1', topics: ['Group 13 Boron Family', 'Group 14 Carbon Family', 'Oxides and Hydrides', 'Allotropy'] },
        { name: 'Organic Chemistry Basics', topics: ['IUPAC Nomenclature', 'Types of Organic Reactions', 'Reaction Intermediates', 'Inductive and Resonance Effects'] },
        { name: 'Hydrocarbons', topics: ['Alkanes', 'Alkenes', 'Alkynes', 'Aromatic Compounds Benzene'] },
        { name: 'Environmental Chemistry', topics: ['Atmospheric Pollution', 'Water Pollution', 'Soil Pollution', 'Green Chemistry'] },
      ],
    },
    {
      name: 'Biology',
      chapters: [
        { name: 'The Living World', topics: ['Characteristics of Life', 'Classification Hierarchy', 'Nomenclature', 'Keys and Herbaria'] },
        { name: 'Biological Classification', topics: ['Five Kingdom System', 'Bacteria and Viruses', 'Kingdom Fungi', 'Lichens and Mycorrhiza'] },
        { name: 'Plant Kingdom', topics: ['Algae Bryophytes Pteridophytes', 'Gymnosperms and Angiosperms', 'Plant Life Cycles', 'Economic Importance'] },
        { name: 'Animal Kingdom', topics: ['Non-chordates', 'Chordates', 'Classification Criteria', 'Salient Features of Phyla'] },
        { name: 'Morphology of Flowering Plants', topics: ['Root Stem Leaf', 'Flower Fruit Seed', 'Modifications', 'Family Descriptions'] },
        { name: 'Anatomy of Flowering Plants', topics: ['Tissues', 'Anatomy of Root Stem Leaf', 'Secondary Growth', 'Wood and Cork'] },
        { name: 'Structural Organisation in Animals', topics: ['Tissue Types in Animals', 'Frog Morphology', 'Organ Systems of Frog', 'Comparison'] },
        { name: 'Cell The Unit of Life', topics: ['Cell Theory', 'Prokaryotic vs Eukaryotic', 'Cell Organelles', 'Endomembrane System'] },
        { name: 'Biomolecules', topics: ['Carbohydrates', 'Proteins and Enzymes', 'Lipids', 'Nucleic Acids'] },
        { name: 'Cell Cycle and Division', topics: ['Interphase', 'Mitosis', 'Meiosis', 'Significance of Cell Division'] },
        { name: 'Transport in Plants', topics: ['Diffusion and Osmosis', 'Water Potential', 'Long Distance Transport', 'Transpiration'] },
        { name: 'Mineral Nutrition', topics: ['Essential Mineral Elements', 'Macro and Micronutrients', 'Deficiency Symptoms', 'Nitrogen Fixation'] },
        { name: 'Photosynthesis', topics: ['Light Reactions Z-scheme', 'Calvin Cycle C3', 'C4 and CAM Pathway', 'Factors Affecting Photosynthesis'] },
        { name: 'Respiration in Plants', topics: ['Glycolysis', 'Krebs Cycle', 'Oxidative Phosphorylation', 'Fermentation'] },
        { name: 'Plant Growth and Development', topics: ['Growth Phases', 'Plant Growth Regulators', 'Vernalisation', 'Photoperiodism'] },
        { name: 'Digestion and Absorption', topics: ['Alimentary Canal', 'Digestive Enzymes', 'Absorption and Assimilation', 'Disorders'] },
        { name: 'Breathing and Exchange of Gases', topics: ['Respiratory Organs', 'Mechanism of Breathing', 'Exchange and Transport of Gases', 'Disorders'] },
        { name: 'Body Fluids and Circulation', topics: ['Blood Composition', 'Blood Groups', 'Heart and Cardiac Cycle', 'Disorders of Circulatory System'] },
        { name: 'Excretory Products', topics: ['Modes of Excretion', 'Nephron Structure', 'Urine Formation', 'Disorders of Excretory System'] },
        { name: 'Locomotion and Movement', topics: ['Types of Movement', 'Skeletal Muscle', 'Skeletal System', 'Disorders'] },
        { name: 'Neural Control and Coordination', topics: ['Neuron Structure', 'Nerve Impulse', 'Central Nervous System', 'Reflex Action'] },
        { name: 'Chemical Coordination', topics: ['Endocrine Glands', 'Hormones', 'Feedback Mechanism', 'Disorders'] },
      ],
    },
    {
      name: 'Mathematics',
      chapters: [
        { name: 'Sets', topics: ['Types of Sets', 'Operations on Sets', 'Venn Diagrams', 'De Morgan Laws'] },
        { name: 'Relations and Functions', topics: ['Types of Relations', 'Types of Functions', 'Composition of Functions', 'Inverse Functions'] },
        { name: 'Trigonometric Functions', topics: ['Radian and Degree Measure', 'Trigonometric Ratios and Identities', 'Graphs of Trig Functions', 'Inverse Trig Basics'] },
        { name: 'Principle of Mathematical Induction', topics: ['PMI Statement', 'Steps of PMI', 'Applications', 'Sigma Notation'] },
        { name: 'Complex Numbers', topics: ['Imaginary Unit', 'Algebra of Complex Numbers', 'Modulus and Argument', 'Argand Plane and Polar Form'] },
        { name: 'Linear Inequalities', topics: ['Algebraic Solutions', 'Graphical Solution', 'System of Inequalities', 'Real-life Applications'] },
        { name: 'Permutations and Combinations', topics: ['Fundamental Principle', 'Permutations', 'Combinations', 'Applications'] },
        { name: 'Binomial Theorem', topics: ['Binomial Expansion', 'General Term', 'Middle Term', 'Properties'] },
        { name: 'Sequences and Series', topics: ['AP and Its Sum', 'GP and Its Sum', 'Infinite GP', 'Special Series'] },
        { name: 'Straight Lines', topics: ['Slope of a Line', 'Various Forms of Equations', 'Distance of Point from Line', 'Family of Lines'] },
        { name: 'Conic Sections', topics: ['Circle', 'Parabola', 'Ellipse', 'Hyperbola'] },
        { name: 'Introduction to 3D Geometry', topics: ['Coordinate Axes', 'Distance Formula', 'Section Formula', 'Locus in 3D'] },
        { name: 'Limits and Derivatives', topics: ['Limit of a Function', 'Algebra of Limits', 'Derivatives', 'Product and Quotient Rule'] },
        { name: 'Statistics', topics: ['Measures of Dispersion', 'Range and Mean Deviation', 'Variance and Standard Deviation', 'Analysis of Distributions'] },
        { name: 'Probability', topics: ['Random Experiments', 'Events and Algebra of Events', 'Axiomatic Approach', 'Addition Theorem'] },
      ],
    },
    {
      name: 'English',
      chapters: [
        { name: 'Hornbill Prose', topics: ['The Portrait of a Lady', 'We Are Not Afraid to Die', 'Discovering Tut', 'Landscape of the Soul'] },
        { name: 'Hornbill Poetry', topics: ['A Photograph', 'The Laburnum Top', 'The Voice of the Rain', 'Childhood'] },
        { name: 'Snapshots', topics: ['The Summer of the Beautiful White Horse', 'The Address', 'Ranga Marriage', 'Albert Einstein at School'] },
        { name: 'Writing Skills', topics: ['Note Making and Summary', 'Formal Letters', 'Article and Report Writing', 'Classified Advertisements'] },
      ],
    },
    {
      name: 'Computer Science',
      chapters: [
        { name: 'Python Fundamentals', topics: ['Data Types and Variables', 'Control Structures', 'Functions', 'Recursion'] },
        { name: 'Data Structures', topics: ['Lists and Stacks', 'Queues', 'Tuples and Dictionaries', 'File Handling'] },
        { name: 'Database Concepts', topics: ['Introduction to DBMS', 'SQL Queries', 'Aggregation', 'Joins and Subqueries'] },
        { name: 'Networking and Web', topics: ['Introduction to Networks', 'IP Addressing', 'Protocols', 'Web Services Basics'] },
      ],
    },
  ],
}

// ── Class 11 Commerce ─────────────────────────────────────────────────────────
const CLASS_11_COMMERCE: ClassEntry = {
  class: 'Class 11 Commerce',
  subjects: [
    {
      name: 'Accountancy',
      chapters: [
        { name: 'Introduction to Accounting', topics: ['Basic Accounting Terms', 'Accounting Equation', 'Objectives and Limitations', 'Accounting Standards'] },
        { name: 'Recording of Transactions', topics: ['Journal Entries', 'Ledger Posting', 'Trial Balance', 'Cash Book'] },
        { name: 'Bank Reconciliation Statement', topics: ['Need for BRS', 'Preparation of BRS', 'Errors and Omissions', 'Adjusted Cash Book'] },
        { name: 'Depreciation', topics: ['Meaning and Causes', 'Straight Line Method', 'Written Down Value Method', 'Comparative Analysis'] },
        { name: 'Provisions and Reserves', topics: ['Difference Between Provision and Reserve', 'Types of Reserves', 'Creating Provisions', 'Accounting Treatment'] },
        { name: 'Bills of Exchange', topics: ['Meaning and Types', 'Accounting for Bills', 'Dishonour and Renewal', 'Accommodation Bills'] },
        { name: 'Rectification of Errors', topics: ['Types of Errors', 'Suspense Account', 'Effect on Profit', 'Revised Trial Balance'] },
        { name: 'Financial Statements', topics: ['Trading and Profit Loss Account', 'Balance Sheet', 'Adjustments', 'Incomplete Records'] },
      ],
    },
    {
      name: 'Business Studies',
      chapters: [
        { name: 'Nature and Purpose of Business', topics: ['Business Activities', 'Objectives of Business', 'Business vs Profession', 'Social Responsibility'] },
        { name: 'Forms of Business', topics: ['Sole Proprietorship', 'Partnership', 'Company', 'Cooperative Societies and PSU'] },
        { name: 'Private Public and Global Enterprises', topics: ['Public Sector', 'Private Sector', 'MNCs', 'Global Business'] },
        { name: 'Business Services', topics: ['Banking Services', 'Insurance', 'Transportation', 'Warehousing and Communication'] },
        { name: 'Emerging Modes of Business', topics: ['E-commerce', 'Outsourcing BPO KPO', 'B2B and B2C', 'M-commerce'] },
        { name: 'Social Responsibilities', topics: ['Concept of Social Responsibility', 'CSR Activities', 'Business Ethics', 'Environment Responsibility'] },
        { name: 'Formation of a Company', topics: ['Stages of Formation', 'Memorandum of Association', 'Articles of Association', 'Prospectus'] },
        { name: 'Sources of Business Finance', topics: ['Owners Funds', 'Borrowed Funds', 'Equity vs Debt', 'Debentures'] },
        { name: 'Small Business', topics: ['Classification', 'Role of SSI in India', 'Government Support', 'Problems of Small Business'] },
        { name: 'Internal Trade', topics: ['Retail Trade', 'Wholesale Trade', 'Types of Retail Outlets', 'Consumer Cooperatives'] },
        { name: 'International Trade', topics: ['Benefits of International Trade', 'Barriers to Trade', 'Documents', 'WTO and Trade Agreements'] },
      ],
    },
    {
      name: 'Economics',
      chapters: [
        { name: 'Introduction to Statistics', topics: ['What is Statistics', 'Collection of Data', 'Census vs Sampling', 'Questionnaires'] },
        { name: 'Organisation of Data', topics: ['Frequency Distribution', 'Bivariate Frequency', 'Types of Data', 'Classification of Data'] },
        { name: 'Presentation of Data', topics: ['Tabular Presentation', 'Diagrammatic Presentation', 'Bar and Pie Diagrams', 'Frequency Histograms'] },
        { name: 'Measures of Central Tendency', topics: ['Arithmetic Mean', 'Median', 'Mode', 'Quartiles and Percentiles'] },
        { name: 'Measures of Dispersion', topics: ['Range and Quartile Deviation', 'Mean Deviation', 'Standard Deviation', 'Lorenz Curve'] },
        { name: 'Correlation', topics: ['Types of Correlation', 'Scatter Diagram', 'Karl Pearson Coefficient', 'Rank Correlation Spearman'] },
        { name: 'Index Numbers', topics: ['Meaning and Importance', 'Methods of Construction', 'WPI and CPI', 'Limitations'] },
        { name: 'Indian Economy on the Eve of Independence', topics: ['Economic Background', 'Agriculture in Colonial India', 'Industry and Infrastructure', 'Foreign Trade'] },
        { name: 'Indian Economy 1950 to 1990', topics: ['Five-Year Plans', 'Green Revolution', 'Industrial Policy', 'Trade and FDI Policy'] },
        { name: 'Liberalisation Privatisation and Globalisation', topics: ['Economic Reforms 1991', 'Privatisation', 'Globalisation Impact', 'WTO and TRIPS'] },
        { name: 'Poverty', topics: ['Poverty in India', 'Poverty Line', 'Vulnerable Groups', 'Government Programmes'] },
        { name: 'Human Capital Formation', topics: ['Education and Health as Investment', 'Role of Government', 'Education System', 'Health Indicators'] },
        { name: 'Rural Development', topics: ['Rural Economy', 'Land Reforms', 'Agricultural Credit', 'Rural Diversification'] },
        { name: 'Employment', topics: ['Formal and Informal Sector', 'Worker Population Ratio', 'Unemployment Types', 'MGNREGA'] },
        { name: 'Infrastructure', topics: ['Energy Sector', 'Health Infrastructure', 'Digital India', 'Challenges'] },
        { name: 'Environment and Sustainable Development', topics: ['Environment as Asset', 'Environmental Degradation', 'Sustainable Development', 'Agenda 21'] },
        { name: 'Comparative Development Experiences', topics: ['India vs Pakistan vs China', 'Development Strategies', 'Indicators Comparison', 'Lessons Learnt'] },
      ],
    },
    {
      name: 'Mathematics',
      chapters: [
        { name: 'Sets', topics: ['Types of Sets', 'Set Operations', 'Venn Diagrams', 'De Morgan Laws'] },
        { name: 'Relations and Functions', topics: ['Types of Relations', 'Types of Functions', 'Domain and Range', 'Inverse Functions'] },
        { name: 'Permutations and Combinations', topics: ['Counting Principles', 'Permutations', 'Combinations', 'Applications in Commerce'] },
        { name: 'Sequences and Series', topics: ['AP', 'GP', 'Sum of Series', 'Applications in Finance'] },
        { name: 'Straight Lines', topics: ['Equation of Lines', 'Slope', 'Applications in Business', 'Break-even Analysis'] },
        { name: 'Statistics', topics: ['Measures of Central Tendency', 'Measures of Dispersion', 'Correlation', 'Regression Basics'] },
        { name: 'Probability', topics: ['Random Experiments', 'Probability Theorems', 'Conditional Probability', 'Applications in Business'] },
        { name: 'Linear Programming', topics: ['Formulation of LPP', 'Graphical Method', 'Corner Point Method', 'Business Applications'] },
      ],
    },
    {
      name: 'English',
      chapters: [
        { name: 'Hornbill Prose and Poetry', topics: ['The Portrait of a Lady', 'A Photograph', 'We Are Not Afraid to Die', 'Discovering Tut'] },
        { name: 'Writing Skills', topics: ['Note Making', 'Business Letter Writing', 'Advertisement Writing', 'Report and Article Writing'] },
        { name: 'Grammar', topics: ['Error Correction', 'Fill in the Blanks', 'Rearranging Sentences', 'Reading Comprehension'] },
      ],
    },
  ],
}

// ── Class 11 Arts ─────────────────────────────────────────────────────────────
const CLASS_11_ARTS: ClassEntry = {
  class: 'Class 11 Arts',
  subjects: [
    {
      name: 'History',
      chapters: [
        { name: 'Writing and City Life Mesopotamia', topics: ['Emergence of Cities', 'Sumerian Civilisation', 'Cuneiform Writing', 'Trade and Economy'] },
        { name: 'An Empire Across Three Continents Rome', topics: ['Roman Republic and Empire', 'Slavery', 'Economy and Religion', 'Fall of Roman Empire'] },
        { name: 'Nomadic Empires Mongols', topics: ['Mongol Pastoralism', 'Rise of Genghis Khan', 'Mongol Conquests', 'Legacy'] },
        { name: 'The Three Orders Medieval Europe', topics: ['Feudalism', 'Serfdom', 'Church and Society', 'Crusades'] },
        { name: 'Changing Cultural Traditions 14th to 17th Century Europe', topics: ['Renaissance', 'Humanism', 'Printing Press', 'Reformation'] },
        { name: 'Displacing Indigenous Peoples', topics: ['Colonisation of Americas', 'Native Peoples Lives', 'Slave Trade', 'Impact of Colonisation'] },
        { name: 'Paths to Modernisation', topics: ['Industrialisation and its Spread', 'Russia Modernisation', 'China Modernisation', 'Japan Modernisation'] },
      ],
    },
    {
      name: 'Political Science',
      chapters: [
        { name: 'Political Theory Introduction', topics: ['What is Political Theory', 'Freedom', 'Equality', 'Social Justice'] },
        { name: 'Rights', topics: ['Meaning and Types', 'Rights in a Democracy', 'Rights and Duties', 'Natural vs Legal Rights'] },
        { name: 'Citizenship', topics: ['Meaning of Citizenship', 'Indian Citizenship', 'Citizenship and Identity', 'Global Citizenship'] },
        { name: 'Nationalism', topics: ['Nation and Nationalism', 'Theories of Nationalism', 'Self-determination', 'Nationalism and Minority Rights'] },
        { name: 'Secularism', topics: ['What is Secularism', 'Indian Secularism', 'Critiques of Secularism', 'Religion and State'] },
        { name: 'Constitution Why and How', topics: ['Need for Constitution', 'Making of Indian Constitution', 'Constituent Assembly', 'Guiding Values'] },
        { name: 'Election and Representation', topics: ['Electoral Systems', 'First Past the Post', 'Proportional Representation', 'Indian Election System'] },
        { name: 'Executive', topics: ['Parliamentary and Presidential', 'PM and Cabinet', 'Bureaucracy', 'Accountability'] },
        { name: 'Legislature', topics: ['Why Legislatures', 'Two Houses of Parliament', 'Legislative Procedures', 'Parliamentary Committees'] },
        { name: 'Judiciary', topics: ['Independent Judiciary', 'Structure of Courts', 'Judicial Review', 'Appointment of Judges'] },
        { name: 'Local Governments', topics: ['Why Local Government', '73rd and 74th Amendment', 'Panchayati Raj', 'Urban Local Bodies'] },
        { name: 'Federalism', topics: ['Federal Principles', 'Federal Systems in India', 'Centre-State Relations', 'Inter-State Disputes'] },
        { name: 'Development', topics: ['Meaning of Development', 'Poverty and Inequality', 'Environmental Concerns', 'Development Alternatives'] },
      ],
    },
    {
      name: 'Geography',
      chapters: [
        { name: 'Geography as a Discipline', topics: ['Scope and Subject Matter', 'Physical and Human Geography', 'Branches of Geography', 'Geography and Other Sciences'] },
        { name: 'The Earth', topics: ['Earth Origin', 'Interior of the Earth', 'Rocks and Minerals', 'Earthquakes and Volcanoes'] },
        { name: 'Landforms', topics: ['Mountains', 'Plateaus', 'Plains', 'Work of River Wind and Ice'] },
        { name: 'Climate', topics: ['Atmospheric Composition', 'Insolation', 'Pressure and Winds', 'Precipitation Types'] },
        { name: 'Water Oceans', topics: ['Ocean Basins', 'Temperature and Salinity', 'Ocean Currents', 'Tides and Waves'] },
        { name: 'Life on Earth', topics: ['Ecosystem Concept', 'Biodiversity', 'Biomes', 'Threats and Conservation'] },
        { name: 'India Physical Environment', topics: ['Geological Structure', 'Relief Features', 'Drainage System', 'Climate of India'] },
        { name: 'Natural Hazards', topics: ['Earthquake and Tsunami', 'Cyclones', 'Floods and Droughts', 'Landslides'] },
      ],
    },
    {
      name: 'Sociology',
      chapters: [
        { name: 'Society and Sociology', topics: ['Understanding Society', 'Sociological Perspective', 'Common Sense vs Sociology', 'Sociology and Other Sciences'] },
        { name: 'Terms Concepts and Methods', topics: ['Social Groups', 'Status and Role', 'Institutions', 'Research Methods'] },
        { name: 'Sociological Thinkers', topics: ['Karl Marx', 'Emile Durkheim', 'Max Weber', 'Indian Sociologists'] },
        { name: 'Culture and Society', topics: ['Defining Culture', 'Cultural Change', 'Mass Media and Culture', 'Cultural Relativism'] },
        { name: 'Social Institutions', topics: ['Family', 'Marriage', 'Kinship', 'Education and Economy'] },
        { name: 'Social Inequality and Exclusion', topics: ['Dimensions of Inequality', 'Caste', 'Tribe', 'Gender and Disability'] },
        { name: 'Structures of Government', topics: ['Types of Government', 'Democracy in India', 'Political Parties', 'Elections'] },
      ],
    },
    {
      name: 'English',
      chapters: [
        { name: 'Hornbill Prose and Poetry', topics: ['Literature Appreciation', 'Character and Theme Analysis', 'Poetic Devices', 'Critical Thinking'] },
        { name: 'Writing Skills', topics: ['Note Making and Summary', 'Letter Writing', 'Article Writing', 'Creative Writing'] },
        { name: 'Grammar', topics: ['Reading Comprehension', 'Sentence Transformation', 'Error Correction', 'Vocabulary Enhancement'] },
      ],
    },
  ],
}

// ── Class 12 Science ──────────────────────────────────────────────────────────
const CLASS_12_SCIENCE: ClassEntry = {
  class: 'Class 12 Science',
  subjects: [
    {
      name: 'Physics',
      chapters: [
        { name: 'Electric Charges and Fields', topics: ['Coulomb Law', 'Electric Field', 'Electric Flux', 'Gauss Law'] },
        { name: 'Electrostatic Potential and Capacitance', topics: ['Electric Potential', 'Equipotential Surfaces', 'Capacitors', 'Energy in Capacitors'] },
        { name: 'Current Electricity', topics: ['Ohm Law', 'Kirchhoff Laws', 'Wheatstone Bridge', 'Potentiometer'] },
        { name: 'Moving Charges and Magnetism', topics: ['Biot-Savart Law', 'Ampere Law', 'Lorentz Force', 'Cyclotron'] },
        { name: 'Magnetism and Matter', topics: ['Bar Magnet', 'Earth Magnetism', 'Magnetic Properties', 'Hysteresis'] },
        { name: 'Electromagnetic Induction', topics: ['Faraday Laws', 'Lenz Law', 'Mutual and Self Inductance', 'Eddy Currents'] },
        { name: 'Alternating Current', topics: ['AC Generator', 'LCR Circuit', 'Resonance', 'Transformer'] },
        { name: 'Electromagnetic Waves', topics: ['Displacement Current', 'EM Spectrum', 'Properties of EM Waves', 'Applications'] },
        { name: 'Ray Optics and Optical Instruments', topics: ['Reflection and Refraction', 'Prism and Total Internal Reflection', 'Lens Maker Equation', 'Optical Instruments'] },
        { name: 'Wave Optics', topics: ['Huygens Principle', 'Interference', 'Diffraction', 'Polarisation'] },
        { name: 'Dual Nature of Matter', topics: ['Photoelectric Effect', 'Einstein Equation', 'de Broglie Hypothesis', 'Davisson-Germer Experiment'] },
        { name: 'Atoms', topics: ['Bohr Model', 'Hydrogen Spectrum', 'Excitation and Ionisation', 'Limitations of Bohr Model'] },
        { name: 'Nuclei', topics: ['Composition of Nucleus', 'Binding Energy', 'Radioactivity', 'Nuclear Fission and Fusion'] },
        { name: 'Semiconductor Devices', topics: ['p-n Junction', 'Diode as Rectifier', 'Transistor', 'Logic Gates'] },
      ],
    },
    {
      name: 'Chemistry',
      chapters: [
        { name: 'Solid State', topics: ['Types of Solids', 'Crystal Systems', 'Unit Cell and Packing', 'Defects and Properties'] },
        { name: 'Solutions', topics: ['Types of Solutions', 'Concentration Terms', 'Colligative Properties', 'Abnormal Molecular Mass'] },
        { name: 'Electrochemistry', topics: ['Galvanic Cells', 'Nernst Equation', 'Electrolytic Cells', 'Kohlrausch Law'] },
        { name: 'Chemical Kinetics', topics: ['Rate of Reaction', 'Rate Laws and Order', 'Activation Energy', 'Arrhenius Equation'] },
        { name: 'Surface Chemistry', topics: ['Adsorption', 'Colloids', 'Emulsions', 'Catalysis'] },
        { name: 'd and f Block Elements', topics: ['Electronic Configuration', 'Properties of Transition Metals', 'Lanthanides and Actinides', 'Compounds'] },
        { name: 'Coordination Compounds', topics: ['Ligands and Coordination Number', 'Nomenclature', 'Isomerism', 'Bonding Theories'] },
        { name: 'Haloalkanes and Haloarenes', topics: ['Classification and Nomenclature', 'Preparation Methods', 'Reactions', 'Polyhalogen Compounds'] },
        { name: 'Alcohols Phenols and Ethers', topics: ['Preparation', 'Physical Properties', 'Chemical Reactions', 'Uses'] },
        { name: 'Aldehydes Ketones and Carboxylic Acids', topics: ['Preparation', 'Nucleophilic Addition', 'Cannizzaro and Aldol Reactions', 'Carboxylic Acid Reactions'] },
        { name: 'Amines', topics: ['Classification', 'Preparation Methods', 'Chemical Properties', 'Diazonium Salts'] },
        { name: 'Biomolecules', topics: ['Carbohydrates', 'Proteins and Enzymes', 'Nucleic Acids', 'Vitamins and Hormones'] },
        { name: 'Polymers', topics: ['Classification of Polymers', 'Preparation of Polymers', 'Biodegradable Polymers', 'Commercial Importance'] },
        { name: 'Chemistry in Everyday Life', topics: ['Drugs and Medicines', 'Chemicals in Food', 'Cleansing Agents', 'Dyes and Pesticides'] },
      ],
    },
    {
      name: 'Biology',
      chapters: [
        { name: 'Reproduction in Organisms', topics: ['Asexual Reproduction Modes', 'Sexual Reproduction', 'Events of Sexual Reproduction', 'Pre-fertilisation Events'] },
        { name: 'Sexual Reproduction in Flowering Plants', topics: ['Flower Structure', 'Pollination', 'Double Fertilisation', 'Fruit and Seed Development'] },
        { name: 'Human Reproduction', topics: ['Male Reproductive System', 'Female Reproductive System', 'Gametogenesis', 'Fertilisation and Embryogenesis'] },
        { name: 'Reproductive Health', topics: ['Reproductive Health and Disease', 'Birth Control Methods', 'STIs', 'Infertility and ART'] },
        { name: 'Principles of Inheritance', topics: ['Mendel Laws', 'Dominance', 'Incomplete Dominance', 'ABO Blood Groups'] },
        { name: 'Molecular Basis of Inheritance', topics: ['DNA Structure and Replication', 'Transcription', 'Translation', 'Regulation of Gene Expression'] },
        { name: 'Evolution', topics: ['Origin of Life', 'Evidences of Evolution', 'Darwin Theory', 'Speciation and Human Evolution'] },
        { name: 'Human Health and Disease', topics: ['Immunity', 'AIDS and Cancer', 'Drug and Alcohol Abuse', 'Vaccines'] },
        { name: 'Biotechnology Principles and Processes', topics: ['Tools of Biotechnology', 'Restriction Enzymes', 'PCR', 'Gel Electrophoresis'] },
        { name: 'Biotechnology and Its Applications', topics: ['Transgenic Organisms', 'Insulin Production', 'Bt Cotton', 'Bioethics'] },
        { name: 'Organisms and Populations', topics: ['Population Attributes', 'Natality and Mortality', 'Population Interactions', 'Ecological Adaptations'] },
        { name: 'Ecosystem', topics: ['Components', 'Productivity', 'Decomposition', 'Energy Flow and Nutrient Cycling'] },
        { name: 'Biodiversity and Conservation', topics: ['Biodiversity Levels', 'Loss of Biodiversity', 'In-situ Conservation', 'Ex-situ Conservation'] },
        { name: 'Environmental Issues', topics: ['Air and Water Pollution', 'Solid Waste', 'Agrochemicals', 'Deforestation'] },
      ],
    },
    {
      name: 'Mathematics',
      chapters: [
        { name: 'Relations and Functions', topics: ['Types of Relations', 'Types of Functions', 'Composition of Functions', 'Invertible Functions'] },
        { name: 'Inverse Trigonometric Functions', topics: ['Principal Value Branch', 'Graphs', 'Elementary Properties', 'Inverse Trig Equations'] },
        { name: 'Matrices', topics: ['Types of Matrices', 'Operations on Matrices', 'Transpose', 'Symmetric and Skew-Symmetric'] },
        { name: 'Determinants', topics: ['Expansion of Determinants', 'Properties', 'Adjoint and Inverse', 'Cramer Rule'] },
        { name: 'Continuity and Differentiability', topics: ['Continuity', 'Chain Rule', 'Implicit and Explicit Differentiation', 'Rolle and Mean Value Theorem'] },
        { name: 'Application of Derivatives', topics: ['Rate of Change', 'Increasing and Decreasing Functions', 'Tangents and Normals', 'Maxima and Minima'] },
        { name: 'Integrals', topics: ['Integration by Substitution', 'Integration by Parts', 'Partial Fractions', 'Definite Integrals'] },
        { name: 'Application of Integrals', topics: ['Area Under Curves', 'Area Between Two Curves', 'Area of Bounded Regions', 'Applications'] },
        { name: 'Differential Equations', topics: ['Order and Degree', 'General and Particular Solutions', 'Variable Separable', 'Homogeneous and Linear Equations'] },
        { name: 'Vector Algebra', topics: ['Types of Vectors', 'Operations on Vectors', 'Dot Product', 'Cross Product'] },
        { name: 'Three Dimensional Geometry', topics: ['Direction Cosines', 'Equation of Lines', 'Equation of Planes', 'Angle Between Lines and Planes'] },
        { name: 'Linear Programming', topics: ['Mathematical Formulation', 'Graphical Method', 'Corner Point Method', 'Diet and Allocation Problems'] },
        { name: 'Probability', topics: ['Conditional Probability', 'Multiplication Theorem', 'Bayes Theorem', 'Random Variables and Distributions'] },
      ],
    },
    {
      name: 'English',
      chapters: [
        { name: 'Flamingo Prose', topics: ['The Last Lesson', 'Lost Spring', 'Deep Water', 'The Rattrap', 'Indigo', 'Going Places'] },
        { name: 'Flamingo Poetry', topics: ['My Mother at Sixty-six', 'An Elementary School Classroom', 'Keeping Quiet', 'A Thing of Beauty', 'Aunt Jennifer Tigers'] },
        { name: 'Vistas Supplementary', topics: ['The Third Level', 'The Tiger King', 'On the Face of It', 'Evans Tries an O-Level'] },
        { name: 'Writing Skills', topics: ['Note Making', 'Formal and Informal Letters', 'Article and Report Writing', 'Advertisement and Classified'] },
      ],
    },
    {
      name: 'Computer Science',
      chapters: [
        { name: 'Python Advanced Concepts', topics: ['OOP Concepts', 'Inheritance and Polymorphism', 'File Handling', 'Exception Handling'] },
        { name: 'Data Structures in Python', topics: ['Stacks and Queues using Lists', 'Linked Lists', 'Sorting and Searching', 'Time Complexity'] },
        { name: 'Database Management', topics: ['Advanced SQL', 'Stored Procedures', 'Triggers', 'MySQL with Python'] },
        { name: 'Networking and Web', topics: ['OSI Model', 'TCP IP', 'Web Technologies HTML CSS', 'Cybersecurity'] },
      ],
    },
  ],
}

// ── Class 12 Commerce ─────────────────────────────────────────────────────────
const CLASS_12_COMMERCE: ClassEntry = {
  class: 'Class 12 Commerce',
  subjects: [
    {
      name: 'Accountancy',
      chapters: [
        { name: 'Partnership Accounts', topics: ['Partnership Deed', 'Fixed and Fluctuating Capital', 'Admission of Partner', 'Retirement and Death'] },
        { name: 'Reconstitution of Partnership', topics: ['Revaluation Account', 'Treatment of Goodwill', 'Dissolution of Firm', 'Piecemeal Distribution'] },
        { name: 'Company Accounts', topics: ['Issue of Shares', 'Forfeiture and Reissue', 'Issue of Debentures', 'Redemption of Debentures'] },
        { name: 'Financial Statements of Companies', topics: ['Profit and Loss Account', 'Balance Sheet Schedule VI', 'Statement of Changes in Equity', 'Notes to Accounts'] },
        { name: 'Analysis of Financial Statements', topics: ['Comparative Statements', 'Common-Size Statements', 'Trend Analysis', 'Ratio Analysis'] },
        { name: 'Cash Flow Statement', topics: ['Operating Activities', 'Investing Activities', 'Financing Activities', 'Preparation of CFS'] },
      ],
    },
    {
      name: 'Business Studies',
      chapters: [
        { name: 'Nature and Significance of Management', topics: ['Management Concept', 'Objectives and Importance', 'Management as Profession', 'Levels of Management'] },
        { name: 'Principles of Management', topics: ['Fayol 14 Principles', 'Taylor Scientific Management', 'Difference Fayol vs Taylor', 'Applications'] },
        { name: 'Business Environment', topics: ['Dimensions of Environment', 'Demonetisation Impact', 'LPG Reforms', 'SWOT Analysis'] },
        { name: 'Planning', topics: ['Nature of Planning', 'Types of Plans', 'Planning Process', 'Limitations of Planning'] },
        { name: 'Organising', topics: ['Delegation', 'Decentralisation', 'Formal vs Informal Organisation', 'Span of Management'] },
        { name: 'Staffing', topics: ['Staffing Process', 'Recruitment and Selection', 'Training and Development', 'Performance Appraisal'] },
        { name: 'Directing', topics: ['Motivation Theories Maslow Herzberg', 'Leadership Styles', 'Communication Barriers', 'Informal Organisation'] },
        { name: 'Controlling', topics: ['Controlling Process', 'Techniques of Control', 'Relationship with Planning', 'Deviations Analysis'] },
        { name: 'Financial Markets', topics: ['Capital Market', 'Primary vs Secondary Market', 'Stock Exchange', 'SEBI'] },
        { name: 'Marketing Management', topics: ['Marketing Mix 4Ps', 'Product Life Cycle', 'Pricing Strategies', 'Channels of Distribution'] },
        { name: 'Consumer Protection', topics: ['Consumer Rights', 'COPRA and Consumer Forums', 'Redressal Mechanisms', 'Consumer Awareness'] },
      ],
    },
    {
      name: 'Economics',
      chapters: [
        { name: 'Introduction to Macroeconomics', topics: ['Microeconomics vs Macroeconomics', 'Economy and its Problems', 'Economic Systems', 'Circular Flow'] },
        { name: 'National Income Accounting', topics: ['GDP Concepts', 'Methods of Measuring National Income', 'GDP vs GNP', 'Real vs Nominal GDP'] },
        { name: 'Money and Banking', topics: ['Money Supply', 'Commercial Banks and Functions', 'Credit Creation', 'Central Bank and RBI Functions'] },
        { name: 'Determination of Income and Employment', topics: ['Aggregate Demand and Supply', 'Consumption Function', 'Investment', 'Multiplier Concept'] },
        { name: 'Government Budget and the Economy', topics: ['Types of Budget', 'Revenue and Capital Receipts Expenditure', 'Fiscal Deficit', 'Deficit Financing'] },
        { name: 'Open Economy Macroeconomics', topics: ['Balance of Payments', 'Foreign Exchange Market', 'Exchange Rate', 'Managed Floating'] },
        { name: 'Indian Economy on Eve of Independence', topics: ['Agricultural Sector', 'Industrial Sector', 'Demographic Conditions', 'Infrastructure'] },
        { name: 'Economic Reforms since 1991', topics: ['LPG Policy', 'Privatisation', 'Globalisation', 'Assessment of Reforms'] },
        { name: 'Agriculture', topics: ['Role of Agriculture', 'Land Reforms', 'Green Revolution', 'Agriculture Marketing'] },
        { name: 'Industry and Trade', topics: ['Industrial Growth', 'Public Sector', 'Disinvestment', 'Foreign Trade Policy'] },
        { name: 'Infrastructure', topics: ['Power', 'Health and Education Infrastructure', 'Information Technology', 'India vs China Comparison'] },
        { name: 'Environment', topics: ['Sustainable Development', 'Strategies for Sustainable Development', 'Climate Change', 'Global Initiatives'] },
        { name: 'Comparative Development Experiences', topics: ['Pakistan India China', 'Human Development Index', 'Areas of Comparison', 'Lessons'] },
      ],
    },
    {
      name: 'Mathematics',
      chapters: [
        { name: 'Relations and Functions', topics: ['Functions and Their Types', 'Composition', 'Inverse', 'Applications in Commerce'] },
        { name: 'Matrices and Determinants', topics: ['Matrix Operations', 'Determinant Evaluation', 'Inverse Matrix', 'Application in Solving Equations'] },
        { name: 'Differential Calculus', topics: ['Continuity and Differentiability', 'Applications of Derivatives', 'Maxima and Minima', 'Cost and Revenue Optimization'] },
        { name: 'Integral Calculus', topics: ['Integration Techniques', 'Definite Integrals', 'Area Applications', 'Business Applications'] },
        { name: 'Linear Programming', topics: ['LPP Formulation', 'Graphical Solutions', 'Corner Points', 'Production and Profit Problems'] },
        { name: 'Probability', topics: ['Conditional Probability', 'Bayes Theorem', 'Random Variables', 'Expected Value in Business'] },
      ],
    },
    {
      name: 'English',
      chapters: [
        { name: 'Flamingo Prose', topics: ['The Last Lesson', 'Lost Spring', 'Indigo', 'Going Places'] },
        { name: 'Flamingo Poetry', topics: ['My Mother at Sixty-six', 'Keeping Quiet', 'A Thing of Beauty', 'Aunt Jennifer Tigers'] },
        { name: 'Writing Skills', topics: ['Note Making and Summary', 'Letter Writing', 'Article and Report', 'Advertisement Writing'] },
      ],
    },
  ],
}

// ── Class 12 Arts ─────────────────────────────────────────────────────────────
const CLASS_12_ARTS: ClassEntry = {
  class: 'Class 12 Arts',
  subjects: [
    {
      name: 'History',
      chapters: [
        { name: 'Bricks Beads and Bones Harappan', topics: ['Discovery of Harappa', 'Urban Planning', 'Crafts and Trade', 'Interpreting the Past'] },
        { name: 'Kings Farmers and Towns 600 BCE to 600 CE', topics: ['Janapadas to Empire', 'Inscriptions of Ashoka', 'Agriculture and Economy', 'Urban Centres'] },
        { name: 'Kinship Caste and Class', topics: ['Mahabharata as Source', 'Caste System', 'Gender Relations', 'Social Stratification'] },
        { name: 'Thinkers Beliefs and Buildings 600 to 1200 CE', topics: ['Buddhism', 'Jainism', 'Popular Bhakti', 'Temples and Mosque Architecture'] },
        { name: 'Through the Eyes of Travellers', topics: ['Al-Biruni', 'Ibn Battuta', 'Francois Bernier', 'Understanding Other Cultures'] },
        { name: 'Bhakti-Sufi Traditions', topics: ['Bhakti Movement', 'Alvars and Nayanars', 'Sufi Movement', 'Kabir and Mirabai'] },
        { name: 'An Imperial Capital Vijayanagara', topics: ['Founding of Vijayanagara', 'Krishnadeva Raya', 'Architecture', 'Decline'] },
        { name: 'Peasants Zamindars and the State', topics: ['Mughal Agrarian Relations', 'Zamindars', 'Village Communities', 'Agricultural Technology'] },
        { name: 'Kings and Chronicles Mughal Courts', topics: ['Akbarnama and Badshahname', 'Court Culture', 'Women and Court', 'Scribes and Historians'] },
        { name: 'Colonialism and the Countryside', topics: ['Bengal and Ryots', 'Deccan Peasants', 'Blue Indigo Revolt', 'Colonial Land Revenue'] },
        { name: 'Rebels and Raj 1857', topics: ['Causes of 1857 Revolt', 'Course of Revolt', 'British Response', 'Interpretation and Legacy'] },
        { name: 'Colonial Cities', topics: ['Urbanisation', 'Bombay and Calcutta', 'Hill Stations', 'Public Spaces'] },
        { name: 'Mahatma Gandhi and the Nationalist Movement', topics: ['Early Campaigns Champaran Kheda', 'Non-Cooperation Movement', 'Civil Disobedience', 'Quit India'] },
        { name: 'Understanding Partition', topics: ['Communal Politics', 'Partition of 1947', 'Violence and Displacement', 'Oral History'] },
        { name: 'Framing the Constitution', topics: ['Constituent Assembly', 'Debates and Key Issues', 'Fundamental Rights and DPSP', 'Making of the Constitution'] },
      ],
    },
    {
      name: 'Political Science',
      chapters: [
        { name: 'The Cold War Era', topics: ['Cold War Origins', 'Arms Race', 'Proxy Wars', 'Detente and End of Cold War'] },
        { name: 'The End of Bipolarity', topics: ['Disintegration of USSR', 'Consequences', 'New World Order', 'India-Russia Relations'] },
        { name: 'US Hegemony in World Politics', topics: ['Gulf War 1991', 'US Post-Cold War Policy', 'Resistance to Hegemony', '9/11 Impact'] },
        { name: 'Alternative Centres of Power', topics: ['European Union', 'China Rise', 'ASEAN', 'India Role in Asia'] },
        { name: 'Contemporary South Asia', topics: ['Nations of South Asia', 'Democracy in South Asia', 'Conflicts and Peace', 'India and Neighbours'] },
        { name: 'International Organisations', topics: ['UN and Reform', 'World Bank and IMF', 'WTO', 'India and International Organisations'] },
        { name: 'Security in Contemporary World', topics: ['Traditional Security', 'New Sources of Threat', 'Human Security', 'India Security Challenges'] },
        { name: 'Environment and Natural Resources', topics: ['Global Environmental Issues', 'Common Property Resources', 'Rio Summit', 'India Policy'] },
        { name: 'Globalisation', topics: ['Defining Globalisation', 'Political and Economic Dimensions', 'Resistance Movements', 'India and Globalisation'] },
        { name: 'Nation-Building After Independence', topics: ['Partition Legacy', 'Problem of Integration', 'Kashmir Issue', 'Reorganisation of States'] },
        { name: 'Era of One-Party Dominance', topics: ['Congress Hegemony', 'Nature of Congress', 'Other Political Parties', 'First General Election'] },
        { name: 'Politics of Planned Development', topics: ['Planning Commission', 'Five-Year Plans', 'Economic Policies', 'Kerala and Punjab Models'] },
        { name: 'India External Relations', topics: ['Foreign Policy Basics', 'Relations with China and Pakistan', 'Non-Alignment', 'Nuclear Programme'] },
        { name: 'Crisis of Democratic Order', topics: ['Economic Context', 'JP Movement', 'Emergency and its Effects', 'Return of Democracy'] },
        { name: 'Rise of Popular Movements', topics: ['Chipko and Dalit Movements', 'Anti-Arrack Movement', 'Farmers Movements', 'Role of New Movements'] },
        { name: 'Regional Aspirations', topics: ['Punjab Crisis', 'North-East Demands', 'Jammu and Kashmir', 'Regional Parties'] },
        { name: 'Recent Developments in Indian Politics', topics: ['Coalitions', 'Mandal Issue', 'Ram Janmabhoomi', 'Economic Reforms and Politics'] },
      ],
    },
    {
      name: 'Geography',
      chapters: [
        { name: 'Human Geography Nature and Scope', topics: ['Defining Human Geography', 'Schools of Human Geography', 'Approaches', 'Fields of Human Geography'] },
        { name: 'The World Population', topics: ['Distribution and Density', 'Growth of Population', 'Age-Sex Composition', 'Demographic Transition'] },
        { name: 'Population Composition', topics: ['Rural-Urban Population', 'Linguistic and Religious Composition', 'Occupational Structure', 'Human Development Index'] },
        { name: 'Human Development', topics: ['Concept of Human Development', 'HDI Components', 'International Comparisons', 'Human Development in India'] },
        { name: 'Primary Activities', topics: ['Gathering and Pastoral', 'Mining and Quarrying', 'Agriculture Types', 'Agricultural Development'] },
        { name: 'Secondary Activities', topics: ['Manufacturing', 'Types of Industries', 'High-tech Industries', 'Industrial Complexes'] },
        { name: 'Tertiary and Quaternary Activities', topics: ['Trade', 'Transport and Communication', 'IT Sector', 'Tourism'] },
        { name: 'Transport and Communication', topics: ['Land Transport', 'Water Transport', 'Air Transport', 'Digital Communication'] },
        { name: 'International Trade', topics: ['Basis of Trade', 'Volume and Pattern', 'Trade Balance', 'World Trade Organisation'] },
        { name: 'Human Settlements', topics: ['Rural Settlements', 'Urban Settlements', 'Functional Classification', 'Urbanisation Problems'] },
        { name: 'India Physical Environment', topics: ['Geological Structure', 'Physiographic Divisions', 'Drainage System', 'Climate of India'] },
        { name: 'India Population', topics: ['Growth of Population', 'Distribution and Density', 'Age-Sex and Migration', 'Literacy and Occupation'] },
        { name: 'India Human Settlements', topics: ['Types of Rural Settlements', 'Urban Agglomerations', 'Smart Cities', 'Urbanisation Trends'] },
        { name: 'Land Resources and Agriculture', topics: ['Land Use Pattern', 'Land Degradation', 'Wastelands', 'Agricultural Development'] },
        { name: 'Water Resources', topics: ['Availability and Utilisation', 'Irrigation Methods', 'Multi-purpose Projects', 'Water Quality'] },
        { name: 'Mineral and Energy Resources', topics: ['Mineral Resources Distribution', 'Conventional Energy', 'Non-conventional Energy', 'Energy Conservation'] },
        { name: 'Manufacturing Industries', topics: ['Agro-based Industries', 'Mineral-based Industries', 'Chemical Industries', 'IT and Electronics'] },
        { name: 'Planning and Sustainable Development', topics: ['Regional Planning', 'Environmental Planning', 'Sustainable Development Goals', 'India Plans'] },
        { name: 'Transport Communication and Trade', topics: ['Roadways and Railways', 'Pipelines and Waterways', 'International Trade of India', 'SEZs'] },
        { name: 'Geographical Perspective on Issues', topics: ['Land Degradation', 'Water Scarcity', 'Environmental Pollution', 'Urbanisation Challenges'] },
      ],
    },
    {
      name: 'Sociology',
      chapters: [
        { name: 'Introducing Indian Society', topics: ['Colonialism and Society', 'Caste and Tribe', 'Industrialisation and Urbanisation', 'Diversity'] },
        { name: 'Demographic Structure', topics: ['Population Size and Growth', 'Demographic Dividend', 'Age-Sex Ratio', 'Literacy and Health'] },
        { name: 'Social Institutions Continuity and Change', topics: ['Family and Kinship', 'Marriage Patterns', 'Economic Institutions', 'Political Institutions'] },
        { name: 'Market as Social Institution', topics: ['Barter vs Market', 'Sociology of Markets', 'Indigenous Markets', 'Tribal Markets'] },
        { name: 'Patterns of Social Inequality and Exclusion', topics: ['Caste Discrimination', 'Adivasi Issues', 'Women and Marginalisation', 'Disability'] },
        { name: 'The Challenges of Cultural Diversity', topics: ['Regional and Religious Communities', 'Community Identities', 'Communalism', 'Civil Society'] },
        { name: 'Change and Development in India', topics: ['Development Projects and Displacement', 'Environmental Movements', 'Dalits Struggles', 'Feminist Movements'] },
        { name: 'Globalisation and Social Change', topics: ['Economic Liberalisation', 'Cultural Globalisation', 'Media and Society', 'Youth and Globalisation'] },
        { name: 'Mass Media and Communication', topics: ['Types of Media', 'Media and Democracy', 'Social Media and Identity', 'Media Ethics'] },
        { name: 'Social Movements', topics: ['Meaning and Types', 'Civil Rights Movements', 'Peasant and Labour Movements', 'New Social Movements'] },
      ],
    },
    {
      name: 'English',
      chapters: [
        { name: 'Flamingo Prose', topics: ['The Last Lesson', 'Lost Spring', 'Indigo', 'Going Places'] },
        { name: 'Flamingo Poetry', topics: ['My Mother at Sixty-six', 'Keeping Quiet', 'A Thing of Beauty', 'Aunt Jennifer Tigers'] },
        { name: 'Vistas', topics: ['The Third Level', 'The Tiger King', 'On the Face of It', 'Evans Tries an O-Level'] },
        { name: 'Writing Skills', topics: ['Note Making', 'Formal Letters', 'Article and Report', 'Advertisement and Classified'] },
      ],
    },
  ],
}

// ── Master class tree (all 16 classes) ───────────────────────────────────────
export const CBSE_CLASS_TREES: ClassEntry[] = [
  CLASS_1, CLASS_2, CLASS_3, CLASS_4, CLASS_5,
  CLASS_6, CLASS_7, CLASS_8, CLASS_9, CLASS_10,
  CLASS_11_SCIENCE, CLASS_11_COMMERCE, CLASS_11_ARTS,
  CLASS_12_SCIENCE, CLASS_12_COMMERCE, CLASS_12_ARTS,
]

// ── Board → class tree lookup ─────────────────────────────────────────────────
const CLASS_TREE_LOOKUP: Record<string, ClassEntry[]> = {
  'CBSE': CBSE_CLASS_TREES,
  'ICSE': CBSE_CLASS_TREES,
  'Gujarat Board (English Medium)': CBSE_CLASS_TREES,
  'Gujarat Board (Gujarati Medium)': CBSE_CLASS_TREES,
  'NIOS Board': CBSE_CLASS_TREES,
  'IB Board': CBSE_CLASS_TREES,
}

/** Returns the full per-class syllabus tree for a given board name */
export function getClassTree(boardName: string): ClassEntry[] {
  return CLASS_TREE_LOOKUP[boardName] || CBSE_CLASS_TREES
}

// ── Board type detection ───────────────────────────────────────────────────────
const ENTRANCE_BOARDS = new Set([
  'JEE Main', 'JEE Advanced', 'NEET', 'CUET', 'CLAT', 'CAT',
  'IPMAT/JIPMAT', 'NID Entrance Exam', 'NATA',
])
const COMPETITIVE_BOARDS = new Set([
  'UPSC Civil Services', 'SSC CGL', 'SSC CHSL', 'SBI PO & Clerk',
  'IBPS PO & Clerk', 'RBI Grade B & Assistant', 'RRB NTPC',
  'NDA', 'CDS', 'GATE', 'UPPSC/MPSC/TNPSC',
])

export type BoardType = 'School' | 'Entrance' | 'Competitive'

/** Classify any board name into its type — drives prompt & save logic */
export function getBoardType(boardName: string): BoardType {
  if (ENTRANCE_BOARDS.has(boardName)) return 'Entrance'
  if (COMPETITIVE_BOARDS.has(boardName)) return 'Competitive'
  return 'School'
}

/** For non-school boards: returns a flat array of { subject, chapters[] } */
export function getEntranceSubjects(boardName: string): { subject: string; chapters: { name: string; topics: string[] }[] }[] {
  const t = CURRICULUM_TEMPLATES[boardName]
  if (!t) return []
  return Object.entries(t.subjects).map(([subjectName, data]) => ({
    subject: subjectName,
    chapters: data.chapters.map((ch: string) => ({
      name: ch,
      topics: (data.topics as any)?.[ch] ?? ['Introduction', 'Core Concepts', 'Practice Questions', 'Exam Tips'],
    })),
  }))
}

// ── Legacy CURRICULUM_TEMPLATES (for GET /api/owner/syllabus/generate) ────────
export const CURRICULUM_TEMPLATES: Record<string, {
  classes: string[]
  subjects: Record<string, { chapters: string[]; topics?: Record<string, string[]> }>
  category: 'School' | 'Entrance' | 'Competitive'
}> = {
  'CBSE': {
    category: 'School',
    classes: CBSE_CLASS_TREES.map(c => c.class),
    subjects: {
      'Mathematics': { chapters: ['Number Systems', 'Algebra', 'Trigonometry', 'Calculus', 'Statistics'] },
      'Science': { chapters: ['Physics', 'Chemistry', 'Biology'] },
      'Physics': { chapters: ['Mechanics', 'Electrostatics', 'Optics', 'Modern Physics'] },
      'Chemistry': { chapters: ['Solid State', 'Solutions', 'Electrochemistry', 'Organic Compounds'] },
      'Biology': { chapters: ['Reproduction', 'Genetics', 'Ecology', 'Human Welfare'] },
      'Social Science': { chapters: ['History', 'Geography', 'Polity', 'Economics'] },
      'English': { chapters: ['Literature', 'Grammar', 'Writing Skills'] },
      'Business Studies': { chapters: ['Management', 'Finance', 'Marketing'] },
      'Accountancy': { chapters: ['Partnership', 'Company Accounts', 'Financial Analysis'] },
    },
  },
  'ICSE': {
    category: 'School',
    classes: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
    subjects: {
      'Mathematics': { chapters: ['Commercial Math', 'Algebra', 'Geometry', 'Mensuration', 'Trigonometry'] },
      'Physics': { chapters: ['Force', 'Work', 'Light', 'Sound', 'Electricity'] },
      'Chemistry': { chapters: ['Periodic Table', 'Chemical Bonding', 'Acids Bases Salts', 'Metallurgy'] },
      'Biology': { chapters: ['Cell', 'Plants', 'Human Anatomy', 'Health'] },
    },
  },
  'IB Board': {
    category: 'School',
    classes: ['PYP Grade 1-5', 'MYP Grade 6-10', 'DP Year 1 Grade 11', 'DP Year 2 Grade 12'],
    subjects: {
      'Mathematics Analysis': { chapters: ['Number and Algebra', 'Functions', 'Geometry and Trigonometry', 'Statistics', 'Calculus'] },
      'Physics HL SL': { chapters: ['Measurements', 'Mechanics', 'Thermal Physics', 'Waves', 'Electricity'] },
      'Chemistry HL SL': { chapters: ['Stoichiometry', 'Atomic Structure', 'Periodicity', 'Chemical Bonding'] },
    },
  },
  'NIOS Board': {
    category: 'School',
    classes: ['Secondary Class 10', 'Senior Secondary Class 12'],
    subjects: {
      'Mathematics': { chapters: ['Sets', 'Sequences', 'Trigonometry', 'Algebra', 'Coordinate Geometry'] },
      'Science and Technology': { chapters: ['Measurement', 'Matter', 'Energy', 'Living World'] },
    },
  },
  'Gujarat Board (English Medium)': {
    category: 'School',
    classes: ['Std 1', 'Std 2', 'Std 3', 'Std 4', 'Std 5', 'Std 6', 'Std 7', 'Std 8', 'Std 9', 'Std 10', 'Std 11 Science', 'Std 11 Commerce', 'Std 12 Science', 'Std 12 Commerce'],
    subjects: {
      'Mathematics': { chapters: ['Real Numbers', 'Polynomials', 'Linear Equations'] },
      'Science': { chapters: ['Chemical Reactions', 'Acids Bases', 'Metals Non-Metals', 'Life Processes'] },
    },
  },
  'Gujarat Board (Gujarati Medium)': {
    category: 'School',
    classes: ['Std 1', 'Std 2', 'Std 3', 'Std 4', 'Std 5', 'Std 6', 'Std 7', 'Std 8', 'Std 9', 'Std 10', 'Std 11 Science', 'Std 11 Commerce', 'Std 12 Science', 'Std 12 Commerce'],
    subjects: {
      'Mathematics': { chapters: ['Vasthavik Sankhyayo', 'Bahupadiyo', 'Dwichal Chal'] },
      'Science': { chapters: ['Chemical Reactions', 'Acids Bases', 'Metals Non-Metals', 'Life Processes'] },
    },
  },
  'JEE Main': {
    category: 'Entrance',
    classes: ['JEE Foundation', 'Class 11 Target', 'Class 12 Target', 'Dropper Batch'],
    subjects: {
      'Physics': { chapters: ['Units and Dimensions', 'Mechanics', 'Kinematics', 'Dynamics', 'Rotational Motion', 'Gravitation', 'Thermodynamics', 'Waves', 'Electrostatics', 'Current Electricity', 'Magnetism', 'Optics', 'Modern Physics'] },
      'Chemistry': { chapters: ['Mole Concept', 'Atomic Structure', 'Bonding', 'States of Matter', 'Equilibrium', 'Organic Basics', 'Hydrocarbons', 'Functional Groups', 'Coordination Compounds'] },
      'Mathematics': { chapters: ['Sets and Relations', 'Complex Numbers', 'Matrices', 'Trigonometry', 'Calculus', 'Vectors', '3D Geometry', 'Probability'] },
    },
  },
  'JEE Advanced': {
    category: 'Entrance',
    classes: ['Advanced Level Physics', 'Advanced Level Chemistry', 'Advanced Level Mathematics'],
    subjects: {
      'Physics': { chapters: ['General Physics', 'Mechanics', 'Thermal Physics', 'Electricity', 'Optics', 'Modern Physics'] },
      'Chemistry': { chapters: ['Physical Chemistry', 'Inorganic Chemistry', 'Organic Chemistry'] },
      'Mathematics': { chapters: ['Algebra', 'Calculus', 'Geometry', 'Probability'] },
    },
  },
  'NEET': {
    category: 'Entrance',
    classes: ['Medical Prep Phase 1', 'Medical Prep Phase 2'],
    subjects: {
      'Physics': { chapters: ['Physical World', 'Motion', 'Energy', 'Thermodynamics', 'Optics', 'Atoms'] },
      'Chemistry': { chapters: ['Structure of Atom', 'Classification of Elements', 'Redox Reactions', 'Polymers'] },
      'Biology Botany': { chapters: ['Diversity in Living World', 'Plant Structure', 'Plant Physiology', 'Genetics'] },
      'Biology Zoology': { chapters: ['Human Physiology', 'Reproduction', 'Evolution', 'Health'] },
    },
  },
  'CUET': {
    category: 'Entrance',
    classes: ['Undergraduate Level'],
    subjects: {
      'Language': { chapters: ['Reading Comprehension', 'Vocabulary', 'Verbal Ability'] },
      'Domain Subject Arts': { chapters: ['History', 'Geography', 'Sociology'] },
      'Domain Subject Science': { chapters: ['Physics', 'Chemistry', 'Mathematics', 'Biology'] },
      'General Test': { chapters: ['General Knowledge', 'Current Affairs', 'Numerical Ability'] },
    },
  },
  'CLAT': {
    category: 'Entrance',
    classes: ['Law Entrance Level'],
    subjects: {
      'English Language': { chapters: ['Reading Comprehension'] },
      'Current Affairs': { chapters: ['General Knowledge'] },
      'Legal Reasoning': { chapters: ['Legal Principles', 'Case Laws'] },
      'Logical Reasoning': { chapters: ['Critical Reasoning', 'Analytic Reasoning'] },
    },
  },
  'CAT': {
    category: 'Entrance',
    classes: ['MBA Preparation'],
    subjects: {
      'VARC': { chapters: ['RC Passages', 'Parajumbles', 'Sentence Correction'] },
      'DILR': { chapters: ['Data Interpretation', 'Logical Reasoning Sets'] },
      'QA': { chapters: ['Arithmetic', 'Algebra', 'Geometry', 'Number System', 'Modern Math'] },
    },
  },
  'IPMAT/JIPMAT': {
    category: 'Entrance',
    classes: ['IIM Integrated Program Level'],
    subjects: {
      'Quantitative Ability': { chapters: ['Numbers', 'Algebra', 'Arithmetic', 'Data Interpretation'] },
      'Verbal Ability': { chapters: ['Vocabulary', 'Grammar', 'Reading Comprehension'] },
    },
  },
  'NID Entrance Exam': {
    category: 'Entrance',
    classes: ['B.Des Design Prep', 'M.Des Design Prep'],
    subjects: {
      'Design Aptitude Test DAT': { chapters: ['Color Theory', 'Optical Illusion', 'Sketching', 'Composition'] },
      'Studio Test': { chapters: ['Model Making', 'Material Handling'] },
    },
  },
  'NATA': {
    category: 'Entrance',
    classes: ['Architecture Entrance Level'],
    subjects: {
      'Drawing Test': { chapters: ['Perspective', 'Proportion', 'Aesthetics'] },
      'Aptitude Test': { chapters: ['Mathematics', 'General Aptitude'] },
    },
  },
  'UPSC Civil Services': {
    category: 'Competitive',
    classes: ['UPSC IAS Prelims', 'UPSC IAS Mains', 'UPSC IPS Prelims', 'UPSC IPS Mains'],
    subjects: {
      'General Studies 1': { chapters: ['History', 'Geography', 'Economy', 'Polity', 'Current Affairs'] },
      'General Studies 2 CSAT': { chapters: ['Aptitude', 'Reasoning', 'Comprehension'] },
      'Ethics GS 4': { chapters: ['Integrity', 'Aptitude', 'Case Studies'] },
    },
  },
  'SSC CGL': {
    category: 'Competitive',
    classes: ['Tier 1 Preparation', 'Tier 2 Preparation'],
    subjects: {
      'General Intelligence': { chapters: ['Reasoning', 'Analogies', 'Blood Relations'] },
      'Quantitative Aptitude': { chapters: ['Arithmetic', 'Algebra', 'Geometry', 'Trigonometry'] },
      'General Awareness': { chapters: ['History', 'Geography', 'Current Affairs'] },
    },
  },
  'SSC CHSL': {
    category: 'Competitive',
    classes: ['LDC JSA Preparation', 'DEO Preparation'],
    subjects: {
      'English Language': { chapters: ['Grammar', 'Vocabulary'] },
      'General Awareness': { chapters: ['Indian Polity', 'Economy', 'General Science'] },
    },
  },
  'SBI PO & Clerk': {
    category: 'Competitive',
    classes: ['SBI PO Prelims', 'SBI PO Mains', 'SBI Clerk Prelims', 'SBI Clerk Mains'],
    subjects: {
      'English Language': { chapters: ['Reading Comprehension', 'Cloze Test', 'Error Detection'] },
      'Quantitative Aptitude': { chapters: ['Simplification', 'DI', 'Arithmetic Word Problems'] },
      'Reasoning Ability': { chapters: ['Puzzles', 'Seating Arrangement', 'Syllogism'] },
    },
  },
  'IBPS PO & Clerk': {
    category: 'Competitive',
    classes: ['IBPS PO Exam Level', 'IBPS Clerk Exam Level'],
    subjects: {
      'Computer Aptitude': { chapters: ['Basics of Computer', 'Networking', 'Security'] },
      'Banking Awareness': { chapters: ['History of Banking', 'RBI Functions', 'Financial Terms'] },
    },
  },
  'RBI Grade B & Assistant': {
    category: 'Competitive',
    classes: ['Phase 1', 'Phase 2 ESI and FM', 'RBI Assistant level'],
    subjects: {
      'Economic and Social Issues': { chapters: ['Growth and Development', 'Social Structure'] },
      'Finance and Management': { chapters: ['Financial System', 'Market', 'Management Basics'] },
    },
  },
  'RRB NTPC': {
    category: 'Competitive',
    classes: ['CBT 1', 'CBT 2'],
    subjects: {
      'General Awareness': { chapters: ['Current Events', 'Games and Sports', 'Art and Culture'] },
      'General Science': { chapters: ['Physics', 'Chemistry', 'Life Sciences up to 10th CBSE'] },
    },
  },
  'NDA': {
    category: 'Competitive',
    classes: ['NDA Written Exam Prep'],
    subjects: {
      'Mathematics': { chapters: ['Algebra', 'Matrices', 'Trigonometry', 'Analytical Geometry of 2D 3D'] },
      'General Ability Test GAT': { chapters: ['English', 'Physics', 'History', 'Geography'] },
    },
  },
  'CDS': {
    category: 'Competitive',
    classes: ['CDS Written Prep'],
    subjects: {
      'Elementary Mathematics': { chapters: ['Arithmetic', 'Algebra', 'Trigonometry', 'Geometry'] },
      'English': { chapters: ['Reading Comprehension', 'Inferences', 'Grammar'] },
    },
  },
  'GATE': {
    category: 'Competitive',
    classes: ['CS and IT', 'Mechanical', 'Electrical', 'Civil', 'Electronics'],
    subjects: {
      'Engineering Mathematics': { chapters: ['Linear Algebra', 'Calculus', 'Differential Equations', 'Probability'] },
      'Core Technical': { chapters: ['System Design', 'Algorithms', 'Thermodynamics', 'Structures'] },
    },
  },
  'UPPSC/MPSC/TNPSC': {
    category: 'Competitive',
    classes: ['State PCS Preparation'],
    subjects: {
      'General Studies': { chapters: ['Ancient History', 'Medieval History', 'Modern History', 'World Geography'] },
      'Regional Knowledge': { chapters: ['State History', 'State Geography', 'State Culture'] },
    },
  },
}
