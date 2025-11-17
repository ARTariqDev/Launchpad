import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { UserProfile } from "@/models/UserProfile";
import { University } from "@/models/University";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.Gpt,
});

export async function POST(request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { collegeId, forceRefresh } = await request.json();

    if (!collegeId) {
      return NextResponse.json(
        { error: "College ID is required" },
        { status: 400 }
      );
    }

    const profile = await UserProfile.findByUserId(session.userId);
    const college = await University.findById(collegeId);

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    if (!college) {
      return NextResponse.json(
        { error: "College not found" },
        { status: 404 }
      );
    }

    const profileDataHash = JSON.stringify({
      majors: profile.majors || [],
      nationality: profile.nationality || '',
      essayCount: profile.essays?.length || 0,
      extracurricularCount: profile.extracurriculars?.length || 0,
      testScores: profile.testScores || [],
      academics: profile.academics || {},
      efc: profile.efc || null
    });

    if (!forceRefresh && profile.collegeInsights) {
      const cachedInsight = profile.collegeInsights.find(
        insight => insight.collegeId === collegeId && insight.profileHash === profileDataHash
      );

      if (cachedInsight) {
        return NextResponse.json({
          success: true,
          insights: cachedInsight.insights,
          cached: true
        });
      }
    }

    const userMajors = profile.majors?.map(m => m.name || m.major).join(", ") || "Not specified";
    
    let academicsSummary = "Not specified";
    if (profile.academics) {
      const parts = [];
      
      if (profile.academics.type) {
        parts.push(`Curriculum: ${profile.academics.type}`);
      }
      
      if (profile.academics.gpa) {
        parts.push(`GPA: ${profile.academics.gpa}`);
      }
      
      const subjects = profile.academics.subjects || [];
      if (subjects.length > 0) {
        const aLevelSubjects = subjects.filter(s => s.curriculumType === 'A-Levels');
        const oLevelSubjects = subjects.filter(s => s.curriculumType === 'O-Levels' || s.curriculumType === 'IGCSE');
        const ibSubjects = subjects.filter(s => s.curriculumType === 'IB');
        const apSubjects = subjects.filter(s => s.curriculumType === 'AP');
        
        if (aLevelSubjects.length > 0) {
          const aLevelGrades = aLevelSubjects.map(s => {
            const gradeType = s.gradeType === 'Predicted' ? ' (Predicted)' : '';
            return `${s.name}: ${s.grade}${gradeType}`;
          }).join(", ");
          parts.push(`A-Levels: ${aLevelGrades}`);
        }
        
        if (oLevelSubjects.length > 0) {
          const oLevelGrades = oLevelSubjects.map(s => `${s.name}: ${s.grade}`).join(", ");
          parts.push(`O-Levels/IGCSE: ${oLevelGrades}`);
        }
        
        if (ibSubjects.length > 0) {
          const ibGrades = ibSubjects.map(s => {
            const gradeType = s.gradeType === 'Predicted' ? ' (Predicted)' : '';
            return `${s.name}: ${s.grade}${gradeType}`;
          }).join(", ");
          parts.push(`IB: ${ibGrades}`);
        }
        
        if (apSubjects.length > 0) {
          const apGrades = apSubjects.map(s => `${s.name}: ${s.grade}`).join(", ");
          parts.push(`AP: ${apGrades}`);
        }
        
        const otherSubjects = subjects.filter(s => 
          !['A-Levels', 'O-Levels', 'IGCSE', 'IB', 'AP'].includes(s.curriculumType)
        );
        if (otherSubjects.length > 0 && !profile.academics.gpa) {
          const otherGrades = otherSubjects.map(s => `${s.name}: ${s.grade}`).join(", ");
          parts.push(`Other: ${otherGrades}`);
        }
      }
      
      academicsSummary = parts.length > 0 ? parts.join(" | ") : "Not specified";
    }
    
    const userEFC = profile.efc !== undefined ? profile.efc : null;
    const userNationality = profile.nationality || "Not specified";
    
    const collegeCountry = typeof college.location === 'string'
      ? college.country
      : college.location?.country;
    const isDomestic = userNationality === collegeCountry;
    const applicantStatus = isDomestic ? "Domestic" : "International";
    
    const testScoresSummary = profile.testScores?.length > 0
      ? profile.testScores.map(score => {
          if (score.testType === "SAT") {
            return `SAT (total: ${score.scores?.total || 'N/A'}, math: ${score.scores?.math || 'N/A'}, verbal: ${score.scores?.verbal || 'N/A'})`;
          } else if (score.testType === "ACT") {
            return `ACT (composite: ${score.scores?.composite || 'N/A'})`;
          } else if (score.testType === "AP") {
            return `AP ${score.scores?.subject || 'N/A'} (score: ${score.scores?.score || 'N/A'})`;
          } else if (score.testType === "IB") {
            return `IB ${score.scores?.subject || 'N/A'} (score: ${score.scores?.score || 'N/A'})`;
          } else if (score.testType) {
            const scoreValues = Object.entries(score.scores || {})
              .map(([key, val]) => `${key}: ${val}`)
              .join(", ");
            return scoreValues ? `${score.testType} (${scoreValues})` : score.testType;
          }
          return "Incomplete test score";
        }).join(", ")
      : "No test scores provided";

    const extracurricularsSummary = profile.extracurriculars?.length > 0
      ? `${profile.extracurriculars.length} activities including: ${profile.extracurriculars.slice(0, 3).map(e => e.name).join(", ")}`
      : "No extracurriculars listed";

    const essaysSummary = profile.essays?.length > 0
      ? profile.essays.map((e, idx) => {
          let fullContent = '';
          let wordCount = 0;
          let charCount = 0;
          let sectionsDetail = '';
          
          if (e.sections && Array.isArray(e.sections) && e.sections.length > 0) {
            fullContent = e.sections.map(s => (s.answer || s.content || '')).join(' ');
            charCount = fullContent.length;
            wordCount = fullContent.split(/\s+/).filter(w => w).length;
            
            sectionsDetail = e.sections.map((s, sIdx) => {
              const sContent = s.answer || s.content || '';
              const sWordCount = sContent.split(/\s+/).filter(w => w).length;
              const sCharCount = sContent.length;
              return `  Section ${sIdx + 1}: ${s.question || 'No question'}
  (${e.maxCharCount ? sCharCount + ' characters' : sWordCount + ' words'})
  Answer: ${sContent || 'No answer yet'}`;
            }).join('\n\n');
          } else if (e.content) {
            fullContent = e.content;
            charCount = e.content.length;
            wordCount = e.content.split(/\s+/).filter(w => w).length;
          }
          
          const countType = e.styleType === 'UK' || e.maxCharCount ? 'characters' : 'words';
          const count = countType === 'characters' ? charCount : wordCount;
          const maxCount = e.maxCharCount || e.maxWordCount || (e.styleType === 'UK' ? 4000 : 650);
          const topic = e.essayType || 'Not specified';
          
          return `Essay ${idx + 1}: "${e.title || 'Untitled'}" 
Type: ${topic}
Style: ${e.styleType || 'US'}
Total: ${count}/${maxCount} ${countType}
Completion: ${count > 0 ? Math.round((count / maxCount) * 100) : 0}%

${sectionsDetail ? 'SECTIONS:\n' + sectionsDetail : 'FULL CONTENT:\n' + (fullContent || 'No content written yet')}`;
        }).join("\n\n" + "=".repeat(80) + "\n\n")
      : "No essays completed";

    const awardsSummary = profile.awards?.length > 0
      ? `${profile.awards.length} awards including: ${profile.awards.slice(0, 3).map(a => a.name).join(", ")}`
      : "No awards listed";

    const collegeMajors = college.majors || [];
    const majorMatches = profile.majors?.filter(userMajor =>
      collegeMajors.some(collegeMajor =>
        collegeMajor.toLowerCase().includes(userMajor.major.toLowerCase()) ||
        userMajor.major.toLowerCase().includes(collegeMajor.toLowerCase())
      )
    ) || [];

    const locationString = typeof college.location === 'string'
      ? college.location
      : college.location
        ? [college.location.city, college.location.state, college.location.country].filter(Boolean).join(', ')
        : "Not specified";

    const prompt = `You are a college admissions expert. Analyze this student's fit for ${college.name}.

CRITICAL INSTRUCTIONS: 

1. ADMISSION CRITERIA - Identify what ${college.name} actually uses:
   - Canadian universities (Alberta, UofT, UBC, McGill): HIGH SCHOOL GRADES only, NOT SAT/ACT
   - UK universities: A-Levels, IB, or equivalent, NOT SAT/ACT  
   - US universities: SAT/ACT, GPA, and holistic review
   DO NOT mention SAT/ACT as weaknesses if college doesn't use them!

2. GRADING SYSTEMS - Recognize what system the student uses:
   - If student has A-Levels: They're likely UK/Commonwealth system (no GPA)
   - If student has O-Levels: Foundation before A-Levels (no GPA)
   - If student has IB: International Baccalaureate (scored out of 45)
   - If student has GPA: US system (4.0 scale)
   - If student has percentage: Canadian/Indian system
   DO NOT say "GPA not specified" if student uses A-Levels, O-Levels, IB, or percentage system!

3. CURRENCY - Use college's local currency then convert to USD:
   - Canadian universities: CAD first, then USD equivalent
   - UK universities: GBP first, then USD equivalent
   - US universities: USD only
   - Always show both for international cost comparisons

4. ESSAY CONTENT - Student's essays are provided with full content. Assess:
   - Quality of writing and storytelling
   - Specificity and personal details
   - Structure and coherence
   - How well it addresses the prompt
   DO NOT just count essays - evaluate their actual content!

STUDENT PROFILE:
- Intended Majors: ${userMajors}
- Nationality: ${userNationality}
- Applicant Status: ${applicantStatus} (${isDomestic ? 'same country as college' : 'international applicant'})
- Academic Credentials: ${academicsSummary}
- Test Scores: ${testScoresSummary}
- Extracurriculars: ${extracurricularsSummary}
- Essays Completed:
${essaysSummary}
- Awards: ${awardsSummary}
- Expected Family Contribution (EFC): ${userEFC !== null ? `$${userEFC.toLocaleString()} USD` : "Not specified"}

COLLEGE DETAILS:
- Name: ${college.name}
- Location: ${locationString}
- Type: ${college.type || "Not specified"}
- Acceptance Rate: ${college.acceptanceRate}%
- Average Tuition: $${college.tuition?.toLocaleString() || "Not specified"}
- College's Average EFC: $${college.efc?.toLocaleString() || "Not specified"}
- Available Majors: ${collegeMajors.length > 0 ? collegeMajors.join(", ") : "Not specified"}

REQUIRED COLLEGE INFORMATION (YOU MUST PROVIDE SPECIFIC NUMBERS):
Based on your knowledge of ${college.name}, provide these SPECIFIC details:

COSTS (REQUIRED - PROVIDE ACTUAL NUMBERS IN LOCAL CURRENCY):
- Use the college's LOCAL currency (CAD for Canadian universities, GBP for UK, USD for US, etc.)
- Domestic tuition per year (e.g., "CAD $7,000" or "USD $52,000")
- Domestic room & board (e.g., "CAD $12,000" or "USD $18,000")  
- Domestic fees (e.g., "CAD $2,000" or "USD $4,000")
- Total domestic COA (e.g., "CAD $21,000" or "USD $74,000")
- International tuition per year (e.g., "CAD $35,000" or "USD $52,000")
- International total COA (e.g., "CAD $49,000" or "USD $74,000")
- Convert to USD for comparison (e.g., "CAD $49,000 ≈ USD $35,700")
- Is college need-blind for domestic? For international?

FINANCIAL AID (REQUIRED):
- What % of students receive aid?
- Average need-based aid package
- Merit scholarships available? (amount ranges)
- International student aid available?

ADMISSIONS PROFILE (REQUIRED - PROVIDE ACTUAL RANGES):
- IMPORTANT: Only include SAT/ACT if this college actually uses them for admissions!
- For Canadian universities: Most use high school grades/GPA only, NOT SAT/ACT
- For UK universities: Use A-Levels, IB, or equivalent, NOT SAT/ACT
- For US universities: Include SAT/ACT ranges
- Middle 50% SAT range if used (e.g., "1460-1580" or "Not used for admissions")
- Middle 50% ACT range if used (e.g., "33-35" or "Not used for admissions")
- Average GPA/grades of admitted students (use local system: GPA for US, average % for Canada, A-Level grades for UK)
- Acceptance rate for domestic vs international
- % of international students (e.g., "12%")

SUPPLEMENTAL ESSAYS (REQUIRED):
- How many supplements? (e.g., "2-5 essays")
- Word counts (e.g., "250 words, 150 words")
- Topics covered (e.g., "Why this college, Community impact, Intellectual curiosity")

APPLICATION REQUIREMENTS (REQUIRED):
- Common App or Coalition App or other?
- Number of recommendation letters (e.g., "2 teacher + 1 counselor")
- Test-optional policy?
- Interview required/optional/not offered?
- Any portfolio, audition, or special requirements?
- EXACT application portal URL (e.g., "https://apply.college.edu" or "https://www.commonapp.org/explore/college-name")

CAMPUS & OPPORTUNITIES (REQUIRED):
- Campus culture: nerdy/tech/pre-professional/liberal arts/party
- Research opportunities: undergraduate research programs?
- Internship programs: co-op availability?
- Study abroad programs?

ANALYSIS REQUIRED:
1. Provide an overall fit score (0-10) - BE REALISTIC based on test scores and acceptance rate
2. Determine if the college offers the student's intended majors
3. Compare student's EFC with college's average EFC and discuss financial feasibility
4. Consider if student is domestic or international (affects acceptance rates and aid)
5. Describe the college culture and whether it matches the student's profile
6. **COMPARE STUDENT TO ADMITTED APPLICANTS** - THIS MUST BE EXTREMELY DETAILED AND SPECIFIC:
   
   For EACH metric below, you MUST include:
   a) Student's EXACT data with numbers
   b) ${college.name}'s ACTUAL admission data/ranges from your knowledge
   c) Specific percentile or standing calculation
   d) Clear, actionable assessment with implications
   
   DO NOT use vague phrases like "diverse activities", "varied achievements", "average GPA", "not specified"
   DO NOT say "Assessment: Not applicable" unless the metric genuinely doesn't exist (e.g., SAT for Canadian universities)
   
   Required comparisons:
   - **Test Scores**: If ${college.name} uses SAT/ACT, provide EXACT middle 50% range and calculate where student falls. If they use other tests (IB predicted, A-Levels, etc.), compare those. If no standardized tests used, explicitly state "Not considered for admission" and skip.
   - **Academics**: Use the SAME grading system as the college's country. For UK: typical offers (e.g., "A*AA"). For Canada: percentage averages (e.g., "92-96%"). For US: GPA (e.g., "3.85-3.95"). Include course rigor comparison.
   - **Extracurriculars**: List student's top 3 with specific roles/achievements. State what ${college.name} typically sees (e.g., "2-3 years leadership, regional+ achievements"). Identify specific gaps or strengths.
   - **Essays**: Analyze ACTUAL essay content quality. Identify what values/themes the essay currently shows vs. what ${college.name} specifically looks for in essays (their institutional values, mission, unique programs). Provide gap analysis showing what's missing and concrete ways to incorporate their experiences to better align with ${college.name}'s values. List required supplements with completion %.
   - **Awards**: List each award with level (school/regional/national/international). Compare to typical ${college.name} admits' award profile. Assess prestige and competitiveness.
   - **Financial Need**: Calculate exact aid gap using ${college.name}'s actual COA and average aid. Provide realistic assessment of affordability with specific numbers.
7. List 3 specific strengths this student has for this college
8. List 2-3 concerns or areas to consider
9. Provide 3 specific recommendations for the application
10. Include college information: need-blind status, international friendliness, research/internship opportunities, typical admitted student stats

SCORING GUIDELINES:

CRITICAL: Only use SAT/ACT scores if ${college.name} actually requires or accepts them for admissions!

**Canadian Universities** (UofT, UBC, McGill, Alberta, etc.):
- Base score ONLY on high school grades/percentage average
- Typical competitive range: 85-95%+ depending on program and university
- 90%+: 8-10/10 for most programs
- 85-89%: 6-8/10  
- 80-84%: 4-6/10
- Below 80%: 2-4/10
- DO NOT consider SAT/ACT at all - they're irrelevant

**UK Universities** (Oxford, Cambridge, Imperial, etc.):
- Base score on A-Levels, IB predicted, or equivalent
- A*A*A: 9-10/10 for most courses
- AAA or A*AA: 7-9/10
- AAB or ABB: 5-7/10  
- BBB or below: 3-5/10
- For IB: 38-45 competitive (7-10/10), 30-37 moderate (5-7/10)
- DO NOT consider SAT/ACT unless explicitly required

**US Colleges** (use SAT/ACT + GPA + holistic review):
- SAT 1500-1600 + GPA 3.8+: 9-10/10 for top schools
- SAT 1400-1500 + GPA 3.7+: 7-8/10
- SAT 1300-1400 + GPA 3.5+: 5-7/10
- SAT below 1300: 3-5/10 for selective schools

**For ALL colleges, also consider:**
- Course rigor (AP/IB/A-Level subjects)
- Extracurricular depth and leadership
- Essay quality (based on actual content provided)
- Awards and recognition level
- Fit with intended major/program
- Domestic vs. international acceptance rates

CRITICAL JSON RULES:
1. Return VALID JSON with NO trailing commas
2. comparisonToAdmits ONLY contains: testScores, academics, extracurriculars, essays, awards, financialNeed
3. collegeInfo, strengths, concerns, recommendations are TOP-LEVEL fields (NOT inside comparisonToAdmits)
4. All fields in comparisonToAdmits MUST be strings, not objects

Return your analysis in this EXACT JSON format with SPECIFIC NUMBERS:
{
  "fitScore": <number 0-10>,
  "fitSummary": "<2-3 sentence summary of overall fit, be honest about chances>",
  "majorMatch": <true/false>,
  "majorInfo": "<explanation of major availability and any requirements>",
  "efcComparison": "<comparison of student EFC vs college EFC with financial aid insights>",
  "comparisonToAdmits": {
    "testScores": "REQUIRED: State student's EXACT scores (e.g., 'SAT 1470: Math 780, Verbal 690') vs. admitted students' ACTUAL middle 50% range from ${college.name} (e.g., '1450-1560'). Then calculate percentile (e.g., 'Your 1470 falls at the 45th percentile'). Provide specific implications (e.g., 'This is in the middle of the range - competitive but not outstanding. To stand out, focus on essays and extracurriculars'). If college doesn't use these scores, say 'Not used for admissions' and skip detailed analysis.",
    "academics": "REQUIRED: State student's EXACT grades in THEIR system (e.g., 'A-Levels: Math A*, Physics A*, Chemistry A' or '3.85 unweighted GPA' or '40/42 IB predicted' or '95% average' or 'O-Levels: 8 A*s, 2 As'). Compare to ACTUAL typical offers/averages at ${college.name} using the APPROPRIATE grading system for that student's background (e.g., 'Typical UK applicant offers: A*AA' or 'Admitted students average 3.92 GPA' or 'Canadian admits average 92-96%'). If student has A-Levels, compare to A-Level offers. If student has IB, compare to IB requirements. DO NOT say 'GPA not specified' if student has A-Levels or O-Levels - acknowledge their grading system. Specify course rigor and subjects taken. Give clear assessment (e.g., 'Your A*AA predicted grades meet typical UK offer requirements - you're competitive academically').",
    "extracurriculars": "REQUIRED: List student's TOP 3 activities with roles (e.g., 'Debate Captain (3 years), Research Intern at CERN (1 summer), Founded Coding Club (50 members)'). Compare to SPECIFIC expectations at ${college.name} (e.g., 'Admitted students typically show 2-3 years of leadership, regional/national level achievements, and deep commitment. Common activities: research, competition teams, community leadership'). Assess gaps (e.g., 'Your CERN internship is exceptional - this will stand out. However, you need more long-term leadership positions').",
    "essays": "CRITICAL: This MUST be a plain text string with line breaks (\\n), NOT a nested JSON object. Example format: 'Essay Analysis:\\n\\nCURRENT QUALITY: Your UCAS Personal Statement (3800 chars) shows strong technical narrative...\\n\\nWHAT UALBERTA VALUES: Research focus, hands-on learning...\\n\\nGAP: Your essay emphasizes solo projects but UAlberta values collaboration...'\\n\\nProvide comprehensive analysis:\\n\\n1. CURRENT ESSAY QUALITY: For each completed essay, state title, word/character count, writing quality assessment (storytelling, authenticity, specific examples), current themes shown (e.g., 'technical passion, independent learning'), strengths, and weaknesses.\\n\\n2. WHAT ${college.name} VALUES IN ESSAYS: State specific core values and themes ${college.name} seeks (e.g., 'UAlberta values: research experience, collaboration, innovation, hands-on learning' or 'DKU values: global perspective, cross-cultural understanding').\\n\\n3. GAP ANALYSIS: Compare student's current themes vs ${college.name}'s values. List specific missing elements (e.g., 'Your essay shows technical skill but lacks collaboration examples and research experience UAlberta emphasizes'). Rate alignment: High/Medium/Low with %.\\n\\n4. CONCRETE IMPROVEMENTS: What to ADD (e.g., 'Add paragraph about HackClub teamwork showing collaboration'), What to EMPHASIZE (e.g., 'Expand CERN section to highlight research methods'), What to TONE DOWN (e.g., 'Less code details, more impact focus').\\n\\n5. REQUIRED SUPPLEMENTS: List ${college.name}'s essay requirements and completion status. All formatted as ONE continuous string with newline characters.",
    "awards": "REQUIRED: List student's SPECIFIC awards with levels (e.g., 'CERN Beamline for Schools (International), National Math Olympiad Silver (National), School Science Fair 1st Place (School)'). Compare to typical ${college.name} admits (e.g., 'Admitted students often have: 1-2 national/international awards, multiple regional honors, or significant research publications'). Assess prestige (e.g., 'CERN Bl4S is highly prestigious and rare - major strength. National Math Olympiad Silver is competitive. You're above average in this area').",
    "financialNeed": "REQUIRED: State EXACT EFC in USD (e.g., '$10,000 USD') and convert to local currency if college is outside US (e.g., '$10,000 USD ≈ $13,700 CAD' or '$10,000 USD ≈ £7,900 GBP'). Provide ${college.name}'s ACTUAL COA in LOCAL currency (e.g., 'CAD $35,000 for domestic, CAD $45,000 for international' or 'USD $74,000'). State aid statistics in LOCAL currency (e.g., 'Average need-based aid: CAD $20,000, 60% of students receive aid'). Calculate specific gap in BOTH currencies (e.g., 'COA CAD $45,000 - Your ability to pay CAD $13,700 = CAD $31,300 need (USD $22,800). If you receive average aid (CAD $20,000), you'd still need CAD $11,300/year (USD $8,200) from loans or outside scholarships'). Assess reality for international students specifically (e.g., 'As an international student at a Canadian university, limited aid is available. This gap is manageable with part-time work (20hrs/week = ~CAD $10,000/year) and small loans. More realistic than US private universities')."
  },
  "collegeInfo": {
    "costOfAttendance": {
      "domestic": "Tuition: [CURRENCY] $XX,XXX, Room & Board: [CURRENCY] $XX,XXX, Fees: [CURRENCY] $X,XXX, Books: [CURRENCY] $X,XXX, Total COA: [CURRENCY] $XX,XXX per year (≈ USD $XX,XXX)",
      "international": "Tuition: [CURRENCY] $XX,XXX, Room & Board: [CURRENCY] $XX,XXX, Fees: [CURRENCY] $X,XXX, Books: [CURRENCY] $X,XXX, Total COA: [CURRENCY] $XX,XXX per year (≈ USD $XX,XXX). Note: [any additional international student fees or work permit costs]"
    },
    "needBlind": "Need-blind for domestic: Yes/No. Need-blind for international: Yes/No. Explain: [details about financial aid consideration in admissions]",
    "scholarships": "Need-based aid: XX% of students receive average of [CURRENCY] $XX,XXX (≈ USD $XX,XXX). Merit scholarships: [Available/Not available], amounts: [CURRENCY] $X,XXX-$XX,XXX. International students: [aid availability and restrictions, specify if limited or none, mention entrance scholarships if available]",
    "internationalFriendly": "International students: XX% of student body (~X,XXX students). Support: [International student office, visa sponsorship for OPT/CPT, cultural organizations]. Acceptance rate for international: XX%",
    "culture": "[Specific description: e.g., 'Highly intellectual and research-focused with strong pre-professional programs. Students are academically driven, collaborative, and involved in numerous extracurriculars.']",
    "opportunities": "Research: [e.g., '90% of students participate in research, funded summer programs available']. Internships: [e.g., 'Strong career services, 85% secure internships']. Study abroad: [programs available]",
    "admittedStudentProfile": "SAT middle 50%: XXXX-XXXX (or 'Not used for admissions'), ACT middle 50%: XX-XX (or 'Not used for admissions'), GPA/Grades: [use appropriate grading system for country]. Typical students have: [description of typical admits including relevant admission criteria for this college]",
    "supplements": "[Number] supplemental essays required. Essay 1: [topic] (XXX words), Essay 2: [topic] (XXX words), [etc]. Interview: [Required/Optional/Not offered]. Additional: [portfolio/audition if applicable]",
    "requirements": "Application platform: [Common App/Coalition/etc]. Recommendation letters: [X teacher + X counselor]. Transcripts: Required. Test-optional: Yes/No. Deadlines: [REA/EA/ED/RD dates]. Application URL: [EXACT link like 'https://apply.college.edu' or 'https://www.commonapp.org/explore/college-name']. Additional: [any special requirements]"
  },
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "concerns": ["<concern 1>", "<concern 2>", "<concern 3>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"]
}

Be realistic and honest. Don't inflate scores for students with low test scores applying to highly selective schools. Consider acceptance rate, test scores, GPA, extracurriculars, and domestic/international status. Be encouraging but truthful about reach/match/safety assessment.

CRITICAL: You MUST provide specific numbers AND exact URLs for ALL fields. DO NOT use phrases like "not specified", "information not provided", or "not available". Use your training data knowledge about ${college.name} to provide:
- Actual tuition costs (e.g., "$52,000")
- Actual SAT/ACT ranges (e.g., "1460-1580")
- Actual percentages (e.g., "12% international students")
- Specific essay requirements (e.g., "3 supplements: 250 words, 150 words, 100 words")
- EXACT application portal URLs (these are publicly available - provide the full URL)
If you don't have exact current year data, provide approximate figures based on your knowledge with a note that they are approximate.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a college admissions expert with comprehensive knowledge of universities worldwide (US, UK, Canada, Europe, Asia, etc.). You MUST provide specific numerical data (costs in local currency, grade ranges, percentages) based on your training data. Recognize different grading systems (GPA, A-Levels, O-Levels, IB, percentages) and compare appropriately. Evaluate essay content quality, not just count. Use college's local currency with USD conversion. Never say 'not specified' or 'information not provided' - use your knowledge to provide actual figures. \n\nCRITICAL JSON FORMATTING RULES:\n1. ALL fields in comparisonToAdmits MUST be plain text strings, NEVER nested objects or arrays\n2. The 'essays' field MUST be a single string with \\n for line breaks, NOT {\"1\": {\"2\": {...}}}\n3. DO NOT create nested JSON structures within string fields\n4. Use escaped newlines (\\n) for formatting, not actual objects\n5. Example CORRECT format: \"essays\": \"Current Quality: Strong narrative...\\n\\nWhat UAlberta Values: Research...\\n\\nGap: Missing collaboration...\"\n6. Example WRONG format: \"essays\": {\"1\": {\"current\": \"...\"}}\n\nAlways respond with valid, flat JSON structure only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const responseText = completion.choices[0].message.content.trim();
    
    let insights;
    try {
      let cleanedResponse = responseText;
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0].replace(/,(\s*[}\]])/g, '$1');
      }
      
      insights = JSON.parse(cleanedResponse);
      
      if (insights.comparisonToAdmits) {
        const validKeys = ['testScores', 'academics', 'extracurriculars', 'essays', 'awards', 'financialNeed'];
        
        Object.keys(insights.comparisonToAdmits).forEach(key => {
          if (!validKeys.includes(key)) {
            console.warn(`Warning: Moving comparisonToAdmits.${key} to top level`);
            if (!insights[key]) {
              insights[key] = insights.comparisonToAdmits[key];
            }
            delete insights.comparisonToAdmits[key];
          } else if (typeof insights.comparisonToAdmits[key] === 'object' && insights.comparisonToAdmits[key] !== null) {
            console.warn(`Warning: comparisonToAdmits.${key} is an object, converting to string`);
            insights.comparisonToAdmits[key] = JSON.stringify(insights.comparisonToAdmits[key], null, 2);
          }
        });
      }
    } catch (parseError) {
      console.error("Failed to parse GPT response:", responseText.substring(0, 500));
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const collegeInsights = profile.collegeInsights || [];

    const updatedInsights = collegeInsights.filter(
      insight => insight.collegeId !== collegeId
    );

    updatedInsights.push({
      collegeId,
      insights,
      profileHash: profileDataHash,
      generatedAt: new Date()
    });

    await UserProfile.updateField(session.userId, 'collegeInsights', updatedInsights);

    return NextResponse.json({
      success: true,
      insights,
      cached: false
    });

  } catch (error) {
    console.error("Error generating college insights:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate insights" },
      { status: 500 }
    );
  }
}
