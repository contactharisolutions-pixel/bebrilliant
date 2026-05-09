/**
 * Pre-built curriculum templates for AI generation
 * Used when auto-generating a full academic hierarchy
 */
export const CURRICULUM_TEMPLATES: Record<string, {
    classes: string[]
    subjects: Record<string, { chapters: string[]; topics?: Record<string, string[]> }>
    category: 'School' | 'Entrance' | 'Competitive'
}> = {
    // --- SCHOOL SYLLABUS ---
    'CBSE': {
        category: 'School',
        classes: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11 Science', 'Grade 11 Commerce', 'Grade 11 Arts', 'Grade 12 Science', 'Grade 12 Commerce', 'Grade 12 Arts'],
        subjects: {
            'Mathematics': { chapters: ['Number Systems', 'Algebra', 'Trigonometry', 'Calculus', 'Statistics'] },
            'Science': { chapters: ['Physics', 'Chemistry', 'Biology'] },
            'Physics': { chapters: ['Mechanics', 'Electrostatics', 'Optics', 'Modern Physics'] },
            'Chemistry': { chapters: ['Solid State', 'Solutions', 'Electrochemistry', 'Organic Compounds'] },
            'Biology': { chapters: ['Reproduction', 'Genetics', 'Ecology', 'Human Welfare'] },
            'Social Science': { chapters: ['History', 'Geography', 'Polity', 'Economics'] },
            'English': { chapters: ['Literature', 'Grammar', 'Writing Skills'] },
            'Business Studies': { chapters: ['Management', 'Finance', 'Marketing'] },
            'Accountancy': { chapters: ['Partnership', 'Company Accounts', 'Financial Analysis'] }
        }
    },
    'ICSE': {
        category: 'School',
        classes: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
        subjects: {
            'Mathematics': { chapters: ['Commercial Math', 'Algebra', 'Geometry', 'Mensuration', 'Trigonometry'] },
            'Physics': { chapters: ['Force', 'Work', 'Light', 'Sound', 'Electricity'] },
            'Chemistry': { chapters: ['Periodic Table', 'Chemical Bonding', 'Acids Bases Salts', 'Metallurgy'] },
            'Biology': { chapters: ['Cell', 'Plants', 'Human Anatomy', 'Health'] }
        }
    },
    'IB Board': {
        category: 'School',
        classes: ['PYP (Grade 1-5)', 'MYP (Grade 6-10)', 'DP Year 1 (Grade 11)', 'DP Year 2 (Grade 12)'],
        subjects: {
            'Mathematics Analysis': { chapters: ['Number and Algebra', 'Functions', 'Geometry and Trigonometry', 'Statistics', 'Calculus'] },
            'Physics HL/SL': { chapters: ['Measurements', 'Mechanics', 'Thermal Physics', 'Waves', 'Electricity'] },
            'Chemistry HL/SL': { chapters: ['Stoichiometry', 'Atomic Structure', 'Periodicity', 'Chemical Bonding'] }
        }
    },
    'NIOS Board': {
        category: 'School',
        classes: ['Secondary (Class 10)', 'Senior Secondary (Class 12)'],
        subjects: {
            'Mathematics': { chapters: ['Sets', 'Sequences', 'Trigonometry', 'Algebra', 'Coordinate Geometry'] },
            'Science & Technology': { chapters: ['Measurement', 'Matter', 'Energy', 'Living World'] }
        }
    },
    'Gujarat Board (English Medium)': {
        category: 'School',
        classes: ['Std 1', 'Std 2', 'Std 3', 'Std 4', 'Std 5', 'Std 6', 'Std 7', 'Std 8', 'Std 9', 'Std 10', 'Std 11 Science', 'Std 11 Commerce', 'Std 12 Science', 'Std 12 Commerce'],
        subjects: {
            'Mathematics': { chapters: ['Real Numbers', 'Polynomials', 'Linear Equations'] },
            'Science': { chapters: ['Chemical Reactions', 'Acids Bases', 'Metals Non-Metals', 'Life Processes'] }
        }
    },
    'Gujarat Board (Gujarati Medium)': {
        category: 'School',
        classes: ['Std 1', 'Std 2', 'Std 3', 'Std 4', 'Std 5', 'Std 6', 'Std 7', 'Std 8', 'Std 9', 'Std 10', 'Std 11 Science', 'Std 11 Commerce', 'Std 12 Science', 'Std 12 Commerce'],
        subjects: {
            'Mathematics': { chapters: ['Vasthavik Sankhyayo', 'Bahupadiyo', 'Dwichal Chal'] },
            'Science': { chapters: ['Chemical Reactions', 'Acids Bases', 'Metals Non-Metals', 'Life Processes'] }
        }
    },

    // --- ENTRANCE EXAMS ---
    'JEE Main': {
        category: 'Entrance',
        classes: ['JEE Foundation', 'Class 11 Target', 'Class 12 Target', 'Dropper Batch'],
        subjects: {
            'Physics': { chapters: ['Units and Dimensions', 'Mechanics', 'Kinematics', 'Dynamics', 'Rotational Motion', 'Gravitation', 'Thermodynamics', 'Waves', 'Electrostatics', 'Current Electricity', 'Magnetism', 'Optics', 'Modern Physics'] },
            'Chemistry': { chapters: ['Mole Concept', 'Atomic Structure', 'Bonding', 'States of Matter', 'Equilibrium', 'Organic Basics', 'Hydrocarbons', 'Functional Groups', 'Coordination Compounds'] },
            'Mathematics': { chapters: ['Sets and Relations', 'Complex Numbers', 'Matrices', 'Trigonometry', 'Calculus', 'Vectors', '3D Geometry', 'Probability'] }
        }
    },
    'JEE Advanced': {
        category: 'Entrance',
        classes: ['Advanced Level Physics', 'Advanced Level Chemistry', 'Advanced Level Mathematics'],
        subjects: {
            'Physics': { chapters: ['General Physics', 'Mechanics', 'Thermal Physics', 'Electricity', 'Optics', 'Modern Physics'] },
            'Chemistry': { chapters: ['Physical Chemistry', 'Inorganic Chemistry', 'Organic Chemistry'] },
            'Mathematics': { chapters: ['Algebra', 'Calculus', 'Geometry', 'Probability'] }
        }
    },
    'NEET': {
        category: 'Entrance',
        classes: ['Medical Prep Phase 1', 'Medical Prep Phase 2'],
        subjects: {
            'Physics': { chapters: ['Physical World', 'Motion', 'Energy', 'Thermodynamics', 'Optics', 'Atoms'] },
            'Chemistry': { chapters: ['Structure of Atom', 'Classification of Elements', 'Redox Reactions', 'Polymers'] },
            'Biology (Botany)': { chapters: ['Diversity in Living World', 'Plant Structure', 'Plant Physiology', 'Genetics'] },
            'Biology (Zoology)': { chapters: ['Human Physiology', 'Reproduction', 'Evolution', 'Health'] }
        }
    },
    'CUET': {
        category: 'Entrance',
        classes: ['Undergraduate Level'],
        subjects: {
            'Language': { chapters: ['Reading Comprehension', 'Vocabulary', 'Verbal Ability'] },
            'Domain Subject (Arts)': { chapters: ['History', 'Geography', 'Sociology'] },
            'Domain Subject (Science)': { chapters: ['Physics', 'Chemistry', 'Mathematics', 'Biology'] },
            'General Test': { chapters: ['General Knowledge', 'Current Affairs', 'Numerical Ability'] }
        }
    },
    'CLAT': {
        category: 'Entrance',
        classes: ['Law Entrance Level'],
        subjects: {
            'English Language': { chapters: ['Reading Comprehension'] },
            'Current Affairs': { chapters: ['General Knowledge'] },
            'Legal Reasoning': { chapters: ['Legal Principles', 'Case Laws'] },
            'Logical Reasoning': { chapters: ['Critical Reasoning', 'Analytic Reasoning'] }
        }
    },
    'CAT': {
        category: 'Entrance',
        classes: ['MBA Preparation'],
        subjects: {
            'VARC': { chapters: ['RC Passages', 'Parajumbles', 'Sentence Correction'] },
            'DILR': { chapters: ['Data Interpretation', 'Logical Reasoning Sets'] },
            'QA': { chapters: ['Arithmetic', 'Algebra', 'Geometry', 'Number System', 'Modern Math'] }
        }
    },
    'IPMAT/JIPMAT': {
        category: 'Entrance',
        classes: ['IIM Integrated Program Level'],
        subjects: {
            'Quantitative Ability': { chapters: ['Numbers', 'Algebra', 'Arithmetic', 'Data Interpretation'] },
            'Verbal Ability': { chapters: ['Vocabulary', 'Grammar', 'Reading Comprehension'] }
        }
    },
    'NID Entrance Exam': {
        category: 'Entrance',
        classes: ['B.Des Design Prep', 'M.Des Design Prep'],
        subjects: {
            'Design Aptitude Test (DAT)': { chapters: ['Color Theory', 'Optical Illusion', 'Sketching', 'Composition'] },
            'Studio Test': { chapters: ['Model Making', 'Material Handling'] }
        }
    },
    'NATA': {
        category: 'Entrance',
        classes: ['Architecture Entrance Level'],
        subjects: {
            'Drawing Test': { chapters: ['Perspective', 'Proportion', 'Aesthetics'] },
            'Aptitude Test': { chapters: ['Mathematics', 'General Aptitude'] }
        }
    },

    // --- COMPETITIVE EXAMS ---
    'UPSC Civil Services': {
        category: 'Competitive',
        classes: ['UPSC IAS - Prelims', 'UPSC IAS - Mains', 'UPSC IPS - Prelims', 'UPSC IPS - Mains'],
        subjects: {
            'General Studies 1': { chapters: ['History', 'Geography', 'Economy', 'Polity', 'Current Affairs'] },
            'General Studies 2 (CSAT)': { chapters: ['Aptitude', 'Reasoning', 'Comprehension'] },
            'Ethics (GS 4)': { chapters: ['Integrity', 'Aptitude', 'Case Studies'] }
        }
    },
    'SSC CGL': {
        category: 'Competitive',
        classes: ['Tier 1 Preparation', 'Tier 2 Preparation'],
        subjects: {
            'General Intelligence': { chapters: ['Reasoning', 'Analogies', 'Blood Relations'] },
            'Quantitative Aptitude': { chapters: ['Arithmetic', 'Algebra', 'Geometry', 'Trigonometry'] },
            'General Awareness': { chapters: ['History', 'Geography', 'Curent Affairs'] }
        }
    },
    'SSC CHSL': {
        category: 'Competitive',
        classes: ['LDC/JSA Preparation', 'DEO Preparation'],
        subjects: {
            'English Language': { chapters: ['Grammar', 'Vocabulary'] },
            'General Awareness': { chapters: ['Indian Polity', 'Economy', 'General Science'] }
        }
    },
    'SBI PO & Clerk': {
        category: 'Competitive',
        classes: ['SBI PO Prelims', 'SBI PO Mains', 'SBI Clerk Prelims', 'SBI Clerk Mains'],
        subjects: {
            'English Language': { chapters: ['Reading Comprehension', 'Cloze Test', 'Error Detection'] },
            'Quantitative Aptitude': { chapters: ['Simplification', 'DI', 'Arithmetic Word Problems'] },
            'Reasoning Ability': { chapters: ['Puzzles', 'Seating Arrangement', 'Syllogism'] }
        }
    },
    'IBPS PO & Clerk': {
        category: 'Competitive',
        classes: ['IBPS PO Exam Level', 'IBPS Clerk Exam Level'],
        subjects: {
            'Computer Aptitude': { chapters: ['Basics of Computer', 'Networking', 'Security'] },
            'Banking Awareness': { chapters: ['History of Banking', 'RBI Functions', 'Financial Terms'] }
        }
    },
    'RBI Grade B & Assistant': {
        category: 'Competitive',
        classes: ['Phase 1', 'Phase 2 (ESI & FM)', 'RBI Assistant level'],
        subjects: {
            'Economic & Social Issues': { chapters: ['Growth and Development', 'Social Structure'] },
            'Finance & Management': { chapters: ['Financial System', 'Market', 'Management Basics'] }
        }
    },
    'RRB NTPC': {
        category: 'Competitive',
        classes: ['CBT 1', 'CBT 2'],
        subjects: {
            'General Awareness': { chapters: ['Current Events', 'Games & Sports', 'Art & Culture'] },
            'General Science': { chapters: ['Physics', 'Chemistry', 'Life Sciences (up to 10th CBSE)'] }
        }
    },
    'NDA': {
        category: 'Competitive',
        classes: ['NDA Written Exam Prep'],
        subjects: {
            'Mathematics': { chapters: ['Algebra', 'Matrices', 'Trigonometry', 'Analytical Geometry of 2D/3D'] },
            'General Ability Test (GAT)': { chapters: ['English', 'Physics', 'History', 'Geography'] }
        }
    },
    'CDS': {
        category: 'Competitive',
        classes: ['CDS Written Prep'],
        subjects: {
            'Elementary Mathematics': { chapters: ['Arithmetic', 'Algebra', 'Trigonometry', 'Geometry'] },
            'English': { chapters: ['Reading Comprehension', 'Inferences', 'Grammar'] }
        }
    },
    'GATE': {
        category: 'Competitive',
        classes: ['CS & IT', 'Mechanical', 'Electrical', 'Civil', 'Electronics'],
        subjects: {
            'Engineering Mathematics': { chapters: ['Linear Algebra', 'Calculus', 'Differential Equations', 'Probability'] },
            'Core Technical': { chapters: ['System Design', 'Algorithms', 'Thermodynamics', 'Structures'] }
        }
    },
    'UPPSC/MPSC/TNPSC': {
        category: 'Competitive',
        classes: ['State PCS Preparation'],
        subjects: {
            'General Studies': { chapters: ['Ancient History', 'Medieval History', 'Modern History', 'World Geography'] },
            'Regional Knowledge': { chapters: ['State History', 'State Geography', 'State Culture'] }
        }
    }
}
