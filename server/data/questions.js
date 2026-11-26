/*
 * Starter mock-test question bank (original questions written for this project).
 * Each question: text, 4 options, answerIndex (0-3), explanation, subject, chapter.
 * Add more questions here and re-run `npm run seed`.
 */
const q = (subject, chapter, text, options, answerIndex, explanation) => ({
  subject, chapter, text, options, answerIndex, explanation,
});

const P = 'Physics', C = 'Chemistry', M = 'Mathematics', B = 'Biology';

const physics = [
  q(P, 'Motion in a Straight Line', 'A body starts from rest and moves with a uniform acceleration of 2 m/s². How far does it travel in 5 s?', ['10 m', '25 m', '50 m', '20 m'], 1, 's = ut + ½at² = 0 + ½ × 2 × 25 = 25 m.'),
  q(P, 'Units and Measurements', "What is the dimensional formula of Planck's constant?", ['[ML²T⁻²]', '[MLT⁻¹]', '[ML²T⁻¹]', '[M²LT⁻¹]'], 2, 'h = E/ν → [ML²T⁻²]/[T⁻¹] = [ML²T⁻¹].'),
  q(P, 'Motion in a Plane', 'For a given initial speed, at what angle of projection is the horizontal range of a projectile maximum (ignoring air resistance)?', ['30°', '45°', '60°', '90°'], 1, 'R = u² sin2θ / g is maximum when sin2θ = 1, i.e. θ = 45°.'),
  q(P, 'Laws of Motion', 'A force of 10 N acts on a 2 kg block on a frictionless surface. What is its acceleration?', ['2 m/s²', '5 m/s²', '10 m/s²', '20 m/s²'], 1, 'a = F/m = 10/2 = 5 m/s².'),
  q(P, 'Gravitation', 'The escape velocity from the surface of the Earth is approximately:', ['7.9 km/s', '11.2 km/s', '3.0 km/s', '42 km/s'], 1, 'vₑ = √(2gR) ≈ 11.2 km/s.'),
  q(P, 'Oscillations', 'The time period of a simple pendulum of length l (small oscillations) is:', ['2π√(g/l)', '2π√(l/g)', '√(l/g)/2π', 'π√(l/g)'], 1, 'T = 2π√(l/g).'),
  q(P, 'Current Electricity', 'Two 6 Ω resistors are connected in parallel. The equivalent resistance is:', ['12 Ω', '6 Ω', '3 Ω', '1.5 Ω'], 2, '1/R = 1/6 + 1/6 = 1/3 → R = 3 Ω.'),
  q(P, 'Work, Energy and Power', 'What is the kinetic energy of a 2 kg body moving at 3 m/s?', ['6 J', '9 J', '18 J', '3 J'], 1, 'KE = ½mv² = ½ × 2 × 9 = 9 J.'),
  q(P, 'System of Particles and Rotational Motion', 'The moment of inertia of a thin ring of mass M and radius R about an axis through its centre, perpendicular to its plane, is:', ['MR²/2', 'MR²', '2MR²/5', '3MR²/2'], 1, 'All mass is at distance R from the axis, so I = MR².'),
  q(P, 'Electric Charges and Fields', 'The electric field inside a charged conductor in electrostatic equilibrium is:', ['Maximum at the centre', 'Zero', 'Uniform and non-zero', 'Inversely proportional to r²'], 1, 'Charges reside on the surface; the field inside a conductor in equilibrium is zero.'),
  q(P, 'Electrostatic Potential and Capacitance', 'The capacitance of a parallel-plate capacitor doubles when:', ['Plate area is halved', 'Plate separation is halved', 'Plate separation is doubled', 'Charge is doubled'], 1, 'C = ε₀A/d, so halving d doubles C. C does not depend on charge.'),
  q(P, 'Dual Nature of Radiation and Matter', 'In the photoelectric effect, the maximum kinetic energy of emitted photoelectrons depends on:', ['Intensity of light', 'Frequency of light', 'Exposure time', 'Area of the metal surface'], 1, 'KEmax = hν − φ; it depends on frequency, not intensity.'),
  q(P, 'Ray Optics and Optical Instruments', 'What is the power of a convex lens of focal length 50 cm?', ['+0.5 D', '+2 D', '−2 D', '+50 D'], 1, 'P = 1/f (in metres) = 1/0.5 = +2 D.'),
  q(P, 'Wave Optics', "In Young's double-slit experiment, if the slit separation is doubled (all else unchanged), the fringe width:", ['Doubles', 'Halves', 'Stays the same', 'Becomes four times'], 1, 'β = λD/d, so doubling d halves β.'),
  q(P, 'Thermodynamics', 'A Carnot engine works between 500 K and 300 K. Its efficiency is:', ['60%', '40%', '30%', '20%'], 1, 'η = 1 − T₂/T₁ = 1 − 300/500 = 0.4 = 40%.'),
];

const physicsAdv = [
  q(P, 'System of Particles and Rotational Motion', 'A uniform solid sphere rolls without slipping on a horizontal surface. What fraction of its total kinetic energy is rotational?', ['2/7', '2/5', '1/3', '5/7'], 0, 'KE_rot = ½(2/5 mR²)ω² = mv²/5; total = 7mv²/10; fraction = (1/5)/(7/10) = 2/7.'),
  q(P, 'Electrostatic Potential and Capacitance', 'Two equal charges +q are separated by distance d. At the midpoint, the electric field E and potential V are:', ['E = 0, V = 0', 'E = 0, V = 4kq/d', 'E = 8kq/d², V = 0', 'E = 8kq/d², V = 4kq/d'], 1, 'Fields cancel by symmetry; potentials add: V = 2 × kq/(d/2) = 4kq/d.'),
  q(P, 'Oscillations', 'A particle performs SHM with amplitude A. At what displacement from the mean position are its kinetic and potential energies equal?', ['A/2', 'A/√2', 'A/√3', '√3A/2'], 1, 'PE = ½kx², total = ½kA². PE = total/2 → x = A/√2.'),
];

const chemistry = [
  q(C, 'Some Basic Concepts of Chemistry', 'How many moles are present in 22 g of CO₂? (Molar mass = 44 g/mol)', ['0.25', '0.5', '1', '2'], 1, 'n = 22/44 = 0.5 mol.'),
  q(C, 'Chemical Bonding and Molecular Structure', 'The hybridisation of each carbon atom in ethyne (C₂H₂) is:', ['sp³', 'sp²', 'sp', 'dsp²'], 2, 'Each carbon forms a triple bond and one σ bond → linear, sp hybridised.'),
  q(C, 'Chemical Bonding and Molecular Structure', 'The shape of the NH₃ molecule is:', ['Trigonal planar', 'Trigonal pyramidal', 'Tetrahedral', 'T-shaped'], 1, 'Three bond pairs and one lone pair → trigonal pyramidal.'),
  q(C, 'Equilibrium', 'What is the pH of a 0.001 M HCl solution?', ['1', '2', '3', '11'], 2, 'HCl is a strong acid: [H⁺] = 10⁻³ M → pH = 3.'),
  q(C, 'Structure of Atom', 'The maximum number of electrons that can be accommodated in the shell with n = 3 is:', ['8', '9', '18', '32'], 2, 'Maximum electrons = 2n² = 18.'),
  q(C, 'Chemical Kinetics', 'A reaction has a rate constant with units s⁻¹. The order of the reaction is:', ['Zero', 'First', 'Second', 'Third'], 1, 'Units of k are (mol L⁻¹)^(1−n) s⁻¹; s⁻¹ corresponds to n = 1.'),
  q(C, 'Organic Chemistry: Basic Principles and Techniques', 'The IUPAC name of CH₃–CH(CH₃)–CH₃ is:', ['Butane', '2-Methylpropane', '1-Methylpropane', 'Isopropane'], 1, 'The longest chain has 3 carbons with a methyl group at C-2.'),
  q(C, 'Haloalkanes and Haloarenes', 'Which compound undergoes the SN1 reaction fastest?', ['CH₃Br', 'CH₃CH₂Br', '(CH₃)₂CHBr', '(CH₃)₃CBr'], 3, 'Tertiary carbocations are the most stable, so tert-butyl bromide reacts fastest by SN1.'),
  q(C, 'Coordination Compounds', 'What is the coordination number of Fe in [Fe(CN)₆]⁴⁻?', ['2', '4', '6', '8'], 2, 'Six monodentate CN⁻ ligands → coordination number 6.'),
  q(C, 'Chemical Thermodynamics', 'At constant temperature and pressure, a process is spontaneous when:', ['ΔG > 0', 'ΔG < 0', 'ΔH > 0', 'ΔS < 0'], 1, 'Spontaneity at constant T and P requires ΔG < 0.'),
  q(C, 'Chemical Kinetics', 'The half-life of a first-order reaction with rate constant k is:', ['0.693/k', 'k/0.693', '1/k', '0.693k'], 0, 't½ = ln2/k = 0.693/k, independent of initial concentration.'),
  q(C, 'Solutions', 'Which of the following is NOT a colligative property?', ['Osmotic pressure', 'Elevation of boiling point', 'Relative lowering of vapour pressure', 'Viscosity'], 3, 'Colligative properties depend only on the number of solute particles; viscosity does not.'),
  q(C, 'Aldehydes, Ketones and Carboxylic Acids', "Which compound gives a positive Tollens' (silver mirror) test?", ['Ethanal', 'Propanone', 'Ethanol', 'Ethanoic acid'], 0, "Aldehydes reduce Tollens' reagent; ketones like propanone generally do not."),
  q(C, 'Electrochemistry', 'The value of one Faraday is approximately:', ['9650 C/mol', '96500 C/mol', '965 C/mol', '1.6 × 10⁻¹⁹ C'], 1, '1 F = charge of one mole of electrons ≈ 96500 C/mol.'),
  q(C, 'Classification of Elements and Periodicity', 'Which is the most electronegative element?', ['Oxygen', 'Chlorine', 'Fluorine', 'Nitrogen'], 2, 'Fluorine has the highest electronegativity (about 4.0 on the Pauling scale).'),
];

const chemistryAdv = [
  q(C, 'The d- and f-Block Elements', 'How many unpaired electrons are present in the Fe³⁺ ion?', ['3', '4', '5', '6'], 2, 'Fe³⁺ is 3d⁵; by Hund\'s rule all five d electrons are unpaired.'),
  q(C, 'Hydrocarbons', 'Benzene mainly undergoes which type of reaction?', ['Electrophilic substitution', 'Nucleophilic substitution', 'Electrophilic addition', 'Free-radical elimination'], 0, 'Aromatic stability is retained in electrophilic substitution reactions.'),
];

const maths = [
  q(M, 'Sequences and Series', 'What is the sum of the first 20 natural numbers?', ['200', '210', '220', '190'], 1, 'n(n+1)/2 = 20 × 21 / 2 = 210.'),
  q(M, 'Complex Numbers and Quadratic Equations', 'The value of (1 + i)² is:', ['2', '2i', '−2i', '0'], 1, '(1 + i)² = 1 + 2i + i² = 2i.'),
  q(M, 'Permutations and Combinations', 'How many distinct arrangements of the letters of the word LEVEL are possible?', ['120', '60', '30', '20'], 2, '5!/(2! × 2!) = 120/4 = 30 (L and E each repeat twice).'),
  q(M, 'Continuity and Differentiability', 'd/dx (sin x · cos x) equals:', ['cos 2x', 'sin 2x', '−sin 2x', '2 cos x'], 0, 'sin x cos x = ½ sin 2x, whose derivative is cos 2x.'),
  q(M, 'Integrals', 'The value of ∫₀^(π/2) sin x dx is:', ['0', '1', 'π/2', '2'], 1, '[−cos x] from 0 to π/2 = 0 − (−1) = 1.'),
  q(M, 'Matrices and Determinants', 'The determinant of the matrix [[2, 3], [1, 4]] is:', ['5', '11', '8', '−5'], 0, '2 × 4 − 3 × 1 = 5.'),
  q(M, 'Straight Lines', 'The distance between the parallel lines 3x + 4y = 5 and 3x + 4y = 15 is:', ['1', '2', '3', '10'], 1, '|15 − 5| / √(3² + 4²) = 10/5 = 2.'),
  q(M, 'Conic Sections', 'The eccentricity of a parabola is:', ['0', 'Between 0 and 1', '1', 'Greater than 1'], 2, 'By definition, a parabola has eccentricity e = 1.'),
  q(M, 'Probability', 'Two fair dice are thrown. What is the probability that the sum is 7?', ['1/6', '1/12', '5/36', '7/36'], 0, '6 favourable outcomes out of 36 → 1/6.'),
  q(M, 'Binomial Theorem', 'The coefficient of x² in the expansion of (1 + x)⁵ is:', ['5', '10', '20', '15'], 1, '⁵C₂ = 10.'),
  q(M, 'Differential Equations', 'The order of the differential equation (d²y/dx²)³ + dy/dx = 0 is:', ['1', '2', '3', '6'], 1, 'Order is the highest derivative present, which is the second derivative.'),
  q(M, 'Vector Algebra', 'The angle between the vectors î + ĵ and î − ĵ is:', ['0°', '45°', '90°', '180°'], 2, 'Dot product = 1 − 1 = 0, so the vectors are perpendicular.'),
  q(M, 'Trigonometric Functions', 'The maximum value of 3 sin x + 4 cos x is:', ['7', '5', '4', '3'], 1, 'Maximum of a sin x + b cos x is √(a² + b²) = 5.'),
  q(M, 'Limits and Derivatives', 'lim (x→0) sin(3x)/x equals:', ['0', '1', '3', '1/3'], 2, 'sin(3x)/x = 3 · sin(3x)/(3x) → 3 × 1 = 3.'),
];

const mathsAdv = [
  q(M, 'Integrals', 'The value of ∫₀¹ x·eˣ dx is:', ['1', 'e', 'e − 1', '2e − 1'], 0, 'By parts: [x eˣ − eˣ]₀¹ = (e − e) − (0 − 1) = 1.'),
  q(M, 'Complex Numbers and Quadratic Equations', 'How many real solutions does x² − 5|x| + 6 = 0 have?', ['2', '3', '4', '0'], 2, 'Let t = |x|: t² − 5t + 6 = 0 → t = 2 or 3, giving x = ±2, ±3.'),
];

const biology = [
  q(B, 'Cell: The Unit of Life', 'Which organelle is called the powerhouse of the cell?', ['Ribosome', 'Golgi apparatus', 'Mitochondrion', 'Lysosome'], 2, 'Mitochondria are the site of aerobic respiration and most ATP synthesis.'),
  q(B, 'Photosynthesis in Higher Plants', 'The Calvin cycle takes place in the:', ['Thylakoid membrane', 'Stroma of the chloroplast', 'Cytoplasm', 'Mitochondrial matrix'], 1, 'The enzymes of the Calvin cycle, including RuBisCO, are in the stroma.'),
  q(B, 'Cell Cycle and Cell Division', 'Crossing over occurs during which stage of meiosis?', ['Leptotene', 'Zygotene', 'Pachytene', 'Diakinesis'], 2, 'Crossing over between non-sister chromatids occurs at pachytene of prophase I.'),
  q(B, 'Principles of Inheritance and Variation', 'The F2 phenotypic ratio of a Mendelian dihybrid cross is:', ['3:1', '1:2:1', '9:3:3:1', '1:1:1:1'], 2, 'Independent assortment of two genes gives 9:3:3:1 in F2.'),
  q(B, 'Molecular Basis of Inheritance', 'Which enzyme synthesises RNA from a DNA template during transcription?', ['DNA polymerase', 'RNA polymerase', 'Ligase', 'Helicase'], 1, 'RNA polymerase catalyses transcription.'),
  q(B, 'Chemical Coordination and Integration', 'Which hormone lowers blood glucose levels?', ['Glucagon', 'Insulin', 'Adrenaline', 'Cortisol'], 1, 'Insulin from pancreatic β-cells promotes glucose uptake, lowering blood glucose.'),
  q(B, 'Excretory Products and their Elimination', 'The structural and functional unit of the kidney is the:', ['Neuron', 'Nephron', 'Alveolus', 'Glomerulus only'], 1, 'Each kidney contains about a million nephrons.'),
  q(B, 'Body Fluids and Circulation', 'The pacemaker of the human heart is the:', ['AV node', 'SA node', 'Bundle of His', 'Purkinje fibres'], 1, 'The SA node initiates each heartbeat.'),
  q(B, 'Evolution', 'In the Hardy-Weinberg equation p² + 2pq + q² = 1, the term 2pq represents the frequency of:', ['Homozygous dominant', 'Heterozygotes', 'Homozygous recessive', 'The recessive allele'], 1, '2pq is the expected frequency of heterozygous individuals.'),
  q(B, 'Biotechnology: Principles and Processes', 'The restriction enzyme EcoRI is obtained from:', ['Bacillus thuringiensis', 'Escherichia coli', 'Agrobacterium tumefaciens', 'Thermus aquaticus'], 1, 'Eco = Escherichia coli, R = strain RY13.'),
  q(B, 'Photosynthesis in Higher Plants', 'Kranz anatomy is characteristic of:', ['C3 plants', 'C4 plants', 'CAM plants only', 'Bryophytes'], 1, 'C4 plants have bundle-sheath cells arranged in a wreath (Kranz) pattern.'),
  q(B, 'Sexual Reproduction in Flowering Plants', 'Double fertilisation is a characteristic feature of:', ['Gymnosperms', 'Angiosperms', 'Pteridophytes', 'Bryophytes'], 1, 'Syngamy plus triple fusion occurs in angiosperms.'),
  q(B, 'Body Fluids and Circulation', 'In the ABO system, which blood group is called the universal donor?', ['A', 'B', 'AB', 'O'], 3, 'Group O red cells carry neither A nor B antigens.'),
  q(B, 'Biotechnology and its Applications', 'Bt toxin used in pest-resistant crops is produced by:', ['Bacillus thuringiensis', 'Bacillus subtilis', 'Escherichia coli', 'Rhizobium'], 0, 'Cry genes from Bacillus thuringiensis encode the Bt toxin.'),
  q(B, 'Respiration in Plants', 'What is the net gain of ATP from glycolysis of one glucose molecule?', ['2', '4', '36', '38'], 0, '4 ATP are produced and 2 are used, giving a net gain of 2 ATP.'),
  q(B, 'Ecosystem', 'The 10 percent law of energy transfer in food chains was given by:', ['Odum', 'Lindeman', 'Tansley', 'Darwin'], 1, 'Raymond Lindeman proposed the 10% law in 1942.'),
];

const jeeMain = { correct: 4, incorrect: -1 };
const jeeAdv = { correct: 3, incorrect: -1 };
const neet = { correct: 4, incorrect: -1 };

module.exports = [
  { title: 'JEE Main Mock Test 1', exam: 'JEE Main', subject: 'Mixed', durationMinutes: 30, marking: jeeMain,
    questions: [...physics.slice(0, 5), ...chemistry.slice(0, 5), ...maths.slice(0, 5)] },
  { title: 'JEE Main Mock Test 2', exam: 'JEE Main', subject: 'Mixed', durationMinutes: 30, marking: jeeMain,
    questions: [...physics.slice(5, 10), ...chemistry.slice(5, 10), ...maths.slice(5, 10)] },
  { title: 'JEE Main Mathematics Practice', exam: 'JEE Main', subject: 'Mathematics', durationMinutes: 15, marking: jeeMain,
    questions: maths.slice(7, 14) },
  { title: 'JEE Advanced Practice Test', exam: 'JEE Advanced', subject: 'Mixed', durationMinutes: 30, marking: jeeAdv,
    questions: [...physicsAdv, ...physics.slice(10, 15), ...chemistryAdv, ...chemistry.slice(10, 13), ...mathsAdv, ...maths.slice(10, 14)] },
  { title: 'NEET Mock Test 1', exam: 'NEET', subject: 'Mixed', durationMinutes: 25, marking: neet,
    questions: [...physics.slice(0, 4), ...chemistry.slice(0, 4), ...biology.slice(0, 8)] },
  { title: 'NEET Mock Test 2', exam: 'NEET', subject: 'Mixed', durationMinutes: 25, marking: neet,
    questions: [...physics.slice(9, 13), ...chemistry.slice(8, 12), ...biology.slice(8, 16)] },
  { title: 'NEET Biology Practice', exam: 'NEET', subject: 'Biology', durationMinutes: 15, marking: neet,
    questions: biology.slice(4, 14) },
];
