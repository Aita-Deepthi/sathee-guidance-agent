/*
 * Structured syllabus dataset (NCERT-aligned chapters and topics).
 *
 * Format of each chapter: [name, classLevel, priority, estHours, [topics]]
 *   priority  - indicative importance used by the planner (NOT official weightage)
 *   estHours  - base study hours for an Intermediate student
 *
 * IMPORTANT: Official syllabi are published by NTA (JEE Main, NEET) and the JEE
 * Advanced organising IIT. Verify against the latest official information
 * bulletin and edit this file if the syllabus changes. Re-run `npm run seed`.
 */

const PHYSICS = [
  ['Units and Measurements', 11, 'low', 6, ['SI units and dimensions', 'Errors and significant figures', 'Dimensional analysis']],
  ['Motion in a Straight Line', 11, 'medium', 8, ['Displacement, velocity and acceleration', 'Equations of uniformly accelerated motion', 'Motion graphs', 'Relative velocity in one dimension']],
  ['Motion in a Plane', 11, 'high', 10, ['Vectors and their resolution', 'Projectile motion', 'Uniform circular motion', 'Relative velocity in two dimensions']],
  ['Laws of Motion', 11, 'high', 12, ["Newton's laws and free-body diagrams", 'Friction', 'Connected bodies and pulleys', 'Dynamics of circular motion']],
  ['Work, Energy and Power', 11, 'high', 10, ['Work-energy theorem', 'Potential energy and conservation of energy', 'Power', 'Collisions']],
  ['System of Particles and Rotational Motion', 11, 'high', 16, ['Centre of mass', 'Torque and angular momentum', 'Moment of inertia', 'Rolling motion']],
  ['Gravitation', 11, 'medium', 8, ["Newton's law of gravitation", 'Gravitational potential and potential energy', 'Escape velocity and satellites', "Kepler's laws"]],
  ['Mechanical Properties of Solids', 11, 'low', 5, ["Stress, strain and Hooke's law", 'Elastic moduli']],
  ['Mechanical Properties of Fluids', 11, 'medium', 8, ["Pressure and Pascal's law", "Bernoulli's principle", 'Viscosity and surface tension']],
  ['Thermal Properties of Matter', 11, 'medium', 7, ['Thermal expansion', 'Calorimetry', 'Heat transfer']],
  ['Thermodynamics', 11, 'high', 10, ['First law of thermodynamics', 'Thermodynamic processes', 'Second law and heat engines']],
  ['Kinetic Theory', 11, 'medium', 5, ['Ideal gas equation', 'Kinetic interpretation of temperature', 'Degrees of freedom and equipartition']],
  ['Oscillations', 11, 'high', 9, ['Simple harmonic motion', 'Spring and pendulum systems', 'Energy in SHM']],
  ['Waves', 11, 'medium', 9, ['Wave equation', 'Speed of waves on strings', 'Standing waves and harmonics', 'Beats and Doppler effect']],
  ['Electric Charges and Fields', 12, 'high', 10, ["Coulomb's law", 'Electric field and field lines', "Gauss's law and applications", 'Electric dipole']],
  ['Electrostatic Potential and Capacitance', 12, 'high', 10, ['Potential and potential energy', 'Equipotential surfaces', 'Capacitors and dielectrics', 'Combination of capacitors']],
  ['Current Electricity', 12, 'high', 12, ["Ohm's law and resistivity", "Kirchhoff's laws", 'Wheatstone bridge and meter bridge', 'Cells, EMF and internal resistance']],
  ['Moving Charges and Magnetism', 12, 'high', 12, ['Biot-Savart law', "Ampere's circuital law", 'Force on moving charges and currents', 'Moving coil galvanometer']],
  ['Magnetism and Matter', 12, 'low', 5, ['Bar magnet and magnetic field lines', 'Magnetic properties of materials']],
  ['Electromagnetic Induction', 12, 'high', 9, ["Faraday's and Lenz's laws", 'Motional EMF', 'Self and mutual inductance']],
  ['Alternating Current', 12, 'medium', 8, ['AC circuits and phasors', 'LCR series circuit and resonance', 'Power in AC circuits and transformers']],
  ['Electromagnetic Waves', 12, 'low', 3, ['Displacement current', 'Electromagnetic spectrum']],
  ['Ray Optics and Optical Instruments', 12, 'high', 12, ['Reflection and spherical mirrors', 'Refraction and lenses', 'Prism and dispersion', 'Optical instruments']],
  ['Wave Optics', 12, 'medium', 8, ["Huygens' principle", "Young's double-slit experiment", 'Diffraction and polarisation']],
  ['Dual Nature of Radiation and Matter', 12, 'medium', 6, ['Photoelectric effect', 'de Broglie wavelength']],
  ['Atoms', 12, 'medium', 5, ['Rutherford model', 'Bohr model and hydrogen spectrum']],
  ['Nuclei', 12, 'medium', 5, ['Mass defect and binding energy', 'Radioactivity', 'Nuclear fission and fusion']],
  ['Semiconductor Electronics', 12, 'medium', 7, ['Energy bands and p-n junction', 'Diodes and rectifiers', 'Logic gates']],
];

const CHEMISTRY = [
  ['Some Basic Concepts of Chemistry', 11, 'high', 7, ['Mole concept', 'Stoichiometry', 'Concentration terms']],
  ['Structure of Atom', 11, 'high', 9, ['Bohr model', 'Quantum numbers and orbitals', 'Electronic configuration']],
  ['Classification of Elements and Periodicity', 11, 'medium', 5, ['Modern periodic table', 'Periodic trends in properties']],
  ['Chemical Bonding and Molecular Structure', 11, 'high', 12, ['Ionic and covalent bonds', 'VSEPR theory', 'Hybridisation', 'Molecular orbital theory']],
  ['Chemical Thermodynamics', 11, 'high', 9, ["Enthalpy and Hess's law", 'Entropy and Gibbs energy', 'Spontaneity']],
  ['Equilibrium', 11, 'high', 12, ['Chemical equilibrium, Kc and Kp', "Le Chatelier's principle", 'Ionic equilibrium and pH', 'Buffers and solubility product']],
  ['Redox Reactions', 11, 'medium', 5, ['Oxidation number', 'Balancing redox equations']],
  ['Organic Chemistry: Basic Principles and Techniques', 11, 'high', 12, ['IUPAC nomenclature', 'Isomerism', 'Electronic effects', 'Reaction intermediates']],
  ['Hydrocarbons', 11, 'high', 10, ['Alkanes', 'Alkenes', 'Alkynes', 'Aromatic hydrocarbons']],
  ['Solutions', 12, 'medium', 7, ["Concentration and Raoult's law", 'Colligative properties']],
  ['Electrochemistry', 12, 'high', 9, ['Electrochemical cells and Nernst equation', 'Conductance of electrolytes', 'Electrolysis']],
  ['Chemical Kinetics', 12, 'high', 8, ['Rate law and order', 'Integrated rate equations', 'Arrhenius equation']],
  ['p-Block Elements', 12, 'high', 12, ['Group 13 and 14 elements', 'Group 15 elements', 'Group 16 elements', 'Group 17 and 18 elements']],
  ['The d- and f-Block Elements', 12, 'medium', 6, ['Properties of transition elements', 'Lanthanoids and actinoids', 'KMnO4 and K2Cr2O7']],
  ['Coordination Compounds', 12, 'high', 9, ["Werner's theory and nomenclature", 'Isomerism in complexes', 'Valence bond and crystal field theory']],
  ['Haloalkanes and Haloarenes', 12, 'high', 8, ['Nomenclature and preparation', 'SN1 and SN2 mechanisms', 'Reactions of haloarenes']],
  ['Alcohols, Phenols and Ethers', 12, 'high', 8, ['Preparation and properties of alcohols', 'Properties of phenols', 'Ethers']],
  ['Aldehydes, Ketones and Carboxylic Acids', 12, 'high', 10, ['Nucleophilic addition reactions', 'Important named reactions', 'Carboxylic acids']],
  ['Amines', 12, 'medium', 6, ['Basicity of amines', 'Preparation and reactions', 'Diazonium salts']],
  ['Biomolecules', 12, 'medium', 5, ['Carbohydrates', 'Proteins and amino acids', 'Nucleic acids and vitamins']],
];

const MATHEMATICS = [
  ['Sets, Relations and Functions', 11, 'medium', 8, ['Sets and Venn diagrams', 'Relations', 'Functions and their types']],
  ['Trigonometric Functions', 11, 'high', 10, ['Trigonometric ratios and identities', 'Compound and multiple angles', 'Trigonometric equations']],
  ['Complex Numbers and Quadratic Equations', 11, 'high', 10, ['Algebra of complex numbers', 'Argand plane and polar form', 'Quadratic equations and nature of roots']],
  ['Permutations and Combinations', 11, 'high', 8, ['Fundamental principle of counting', 'Permutations', 'Combinations']],
  ['Binomial Theorem', 11, 'medium', 5, ['Binomial expansion', 'General and middle terms']],
  ['Sequences and Series', 11, 'high', 8, ['Arithmetic progression', 'Geometric progression', 'AM-GM inequality and special series']],
  ['Straight Lines', 11, 'high', 7, ['Slope and forms of a line', 'Distance and angle between lines']],
  ['Conic Sections', 11, 'high', 12, ['Circles', 'Parabola', 'Ellipse', 'Hyperbola']],
  ['Limits and Derivatives', 11, 'medium', 6, ['Limits and standard limits', 'Derivatives from first principles']],
  ['Statistics', 11, 'low', 4, ['Mean deviation', 'Variance and standard deviation']],
  ['Inverse Trigonometric Functions', 12, 'medium', 5, ['Domain and range', 'Properties of inverse trigonometric functions']],
  ['Matrices and Determinants', 12, 'high', 10, ['Matrix operations', 'Determinants and their properties', 'Inverse and system of linear equations']],
  ['Continuity and Differentiability', 12, 'high', 8, ['Continuity', 'Differentiation techniques', 'Mean value theorems']],
  ['Applications of Derivatives', 12, 'high', 9, ['Rate of change and tangents', 'Increasing and decreasing functions', 'Maxima and minima']],
  ['Integrals', 12, 'high', 14, ['Indefinite integration methods', 'Integration by parts and partial fractions', 'Definite integrals and properties']],
  ['Application of Integrals', 12, 'medium', 5, ['Area under curves', 'Area between curves']],
  ['Differential Equations', 12, 'high', 7, ['Order and degree', 'Variable separable method', 'Linear differential equations']],
  ['Vector Algebra', 12, 'high', 6, ['Vectors and components', 'Dot and cross product']],
  ['Three Dimensional Geometry', 12, 'high', 9, ['Direction cosines and ratios', 'Lines in space', 'Planes']],
  ['Probability', 12, 'high', 8, ['Events and classical probability', 'Conditional probability', "Bayes' theorem and distributions"]],
];

const BIOLOGY = [
  ['The Living World', 11, 'low', 3, ['Diversity and taxonomy', 'Taxonomic categories']],
  ['Biological Classification', 11, 'medium', 5, ['Five kingdom classification', 'Monera, Protista and Fungi', 'Viruses and lichens']],
  ['Plant Kingdom', 11, 'medium', 5, ['Algae and bryophytes', 'Pteridophytes', 'Gymnosperms and angiosperms']],
  ['Animal Kingdom', 11, 'high', 8, ['Basis of classification', 'Non-chordates', 'Chordates']],
  ['Morphology of Flowering Plants', 11, 'medium', 6, ['Root, stem and leaf', 'Inflorescence and flower', 'Fruit, seed and plant families']],
  ['Anatomy of Flowering Plants', 11, 'medium', 5, ['Plant tissues', 'Anatomy of dicot and monocot plants']],
  ['Structural Organisation in Animals', 11, 'medium', 5, ['Animal tissues', 'Morphology and anatomy of frog']],
  ['Cell: The Unit of Life', 11, 'high', 6, ['Prokaryotic and eukaryotic cells', 'Cell organelles']],
  ['Biomolecules', 11, 'high', 6, ['Carbohydrates, proteins and lipids', 'Enzymes']],
  ['Cell Cycle and Cell Division', 11, 'high', 5, ['Cell cycle', 'Mitosis', 'Meiosis']],
  ['Photosynthesis in Higher Plants', 11, 'high', 7, ['Light reactions', 'Calvin cycle', 'C4 pathway and photorespiration']],
  ['Respiration in Plants', 11, 'medium', 5, ['Glycolysis', 'Krebs cycle and electron transport system']],
  ['Plant Growth and Development', 11, 'medium', 5, ['Phases of growth', 'Plant growth regulators']],
  ['Breathing and Exchange of Gases', 11, 'medium', 5, ['Respiratory organs', 'Mechanism of breathing', 'Transport of gases']],
  ['Body Fluids and Circulation', 11, 'high', 6, ['Blood and lymph', 'Human heart and cardiac cycle', 'Disorders of circulation']],
  ['Excretory Products and their Elimination', 11, 'medium', 5, ['Human excretory system', 'Urine formation and regulation']],
  ['Locomotion and Movement', 11, 'medium', 5, ['Muscle contraction', 'Skeletal system and joints']],
  ['Neural Control and Coordination', 11, 'medium', 6, ['Neuron and nerve impulse', 'Central nervous system', 'Reflex action']],
  ['Chemical Coordination and Integration', 11, 'high', 6, ['Endocrine glands', 'Mechanism of hormone action']],
  ['Sexual Reproduction in Flowering Plants', 12, 'high', 7, ['Flower structure', 'Pollination', 'Double fertilisation and seed formation']],
  ['Human Reproduction', 12, 'high', 7, ['Male and female reproductive systems', 'Gametogenesis', 'Menstrual cycle and fertilisation']],
  ['Reproductive Health', 12, 'medium', 4, ['Contraception', 'STIs and infertility']],
  ['Principles of Inheritance and Variation', 12, 'high', 10, ["Mendel's laws", 'Chromosomal theory and linkage', 'Sex determination', 'Genetic disorders']],
  ['Molecular Basis of Inheritance', 12, 'high', 10, ['DNA structure and replication', 'Transcription and translation', 'Gene regulation (lac operon)', 'Human Genome Project and DNA fingerprinting']],
  ['Evolution', 12, 'medium', 6, ['Origin of life', 'Evidence and theories of evolution', 'Hardy-Weinberg principle']],
  ['Human Health and Disease', 12, 'high', 6, ['Common human diseases', 'Immunity', 'Cancer and drug abuse']],
  ['Microbes in Human Welfare', 12, 'low', 3, ['Microbes in industry', 'Sewage treatment and biocontrol']],
  ['Biotechnology: Principles and Processes', 12, 'high', 6, ['Restriction enzymes and vectors', 'Recombinant DNA process']],
  ['Biotechnology and its Applications', 12, 'medium', 4, ['Applications in agriculture', 'Applications in medicine']],
  ['Organisms and Populations', 12, 'medium', 5, ['Population attributes', 'Population interactions']],
  ['Ecosystem', 12, 'medium', 4, ['Productivity and decomposition', 'Energy flow and ecological pyramids']],
  ['Biodiversity and Conservation', 12, 'medium', 4, ['Patterns of biodiversity', 'Loss and conservation of biodiversity']],
];

function toChapters(rows, hourFactor = 1) {
  return rows.map(([name, classLevel, priority, estHours, topics]) => ({
    name,
    classLevel,
    priority,
    estHours: Math.round(estHours * hourFactor),
    topics,
  }));
}

// JEE Advanced covers similar chapters but needs deeper problem practice → more hours.
module.exports = [
  { exam: 'JEE Main', subject: 'Physics', chapters: toChapters(PHYSICS) },
  { exam: 'JEE Main', subject: 'Chemistry', chapters: toChapters(CHEMISTRY) },
  { exam: 'JEE Main', subject: 'Mathematics', chapters: toChapters(MATHEMATICS) },
  { exam: 'JEE Advanced', subject: 'Physics', chapters: toChapters(PHYSICS, 1.3) },
  { exam: 'JEE Advanced', subject: 'Chemistry', chapters: toChapters(CHEMISTRY, 1.3) },
  { exam: 'JEE Advanced', subject: 'Mathematics', chapters: toChapters(MATHEMATICS, 1.3) },
  { exam: 'NEET', subject: 'Physics', chapters: toChapters(PHYSICS) },
  { exam: 'NEET', subject: 'Chemistry', chapters: toChapters(CHEMISTRY) },
  { exam: 'NEET', subject: 'Biology', chapters: toChapters(BIOLOGY) },
];
