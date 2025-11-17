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

    if (forceRefresh) {
      console.log('🔄 Force refresh requested - bypassing college insights cache');
    }

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
Based on your training data knowledge of ${college.name}, provide these SPECIFIC details. DO NOT say "varies", "not specified", or "check website":

COSTS (REQUIRED - PROVIDE ACTUAL NUMBERS WITH YEAR REFERENCE):
Examples of GOOD responses:
- "Harvard (2024-25): Tuition USD $56,550, Room & Board USD $20,374, Fees USD $4,602, Books USD $1,000, Total COA USD $82,526"
- "UAlberta (2024-25): Domestic tuition CAD $7,500, International tuition CAD $35,000, Room & Board CAD $12,000, Fees CAD $1,500, Books CAD $1,500. Domestic total: CAD $22,500 (≈ USD $16,400). International total: CAD $50,000 (≈ USD $36,500)"
- "Oxford (2024-25): Home/EU fees GBP £9,250, International fees GBP £28,950-£44,240, College fees GBP £9,500, Living costs GBP £12,000-£15,000. Total for international: GBP £50,450-£68,740 (≈ USD $63,000-$86,000)"

Provide for ${college.name}:
- Specific tuition amount in LOCAL currency (e.g., "CAD $7,500 for 2024-25" not "around CAD $7,000")
- Specific room & board (e.g., "CAD $12,000 on-campus" not "varies by housing")
- Specific fees (e.g., "CAD $1,500 mandatory student fees")
- Calculate TOTAL COA with all components
- Separate domestic vs international costs
- Convert to USD using recent exchange rate (e.g., "1 CAD ≈ 0.73 USD, 1 GBP ≈ 1.25 USD")
- State need-blind policy clearly: "Need-blind for domestic: YES/NO. Need-blind for international: YES/NO"

FINANCIAL AID (REQUIRED - USE REAL DATA FROM YOUR TRAINING):
Examples of GOOD responses:
- "Harvard: Need-blind for all applicants (domestic + international). Meets 100% demonstrated need. 55% receive aid averaging $70,000. Families <$85,000 income pay $0. Families $85,000-$150,000 pay 0-10% income. No loans in packages."
- "UAlberta: Need-based aid very limited. Merit entrance scholarships: $5,000-$20,000 CAD for 95%+ averages. International students eligible for ~10 entrance awards ($10,000-$20,000 CAD). ~30% domestic students receive some scholarship. Can work 20 hrs/week (≈$10,000 CAD/year)."
- "Stanford: Need-blind domestic, need-aware international. 100% need met. 58% receive aid averaging $65,000. Families <$75,000 pay $0. <$150,000 pay no tuition. International students: limited aid, very competitive."

Provide for ${college.name}:
- Exact % receiving aid (e.g., "58%" not "many students")
- Specific average package in LOCAL currency (e.g., "CAD $15,000" not "varies")
- Actual income thresholds if known (e.g., "families earning <$65,000 receive average $45,000")
- Merit scholarship ranges in LOCAL currency (e.g., "$5,000-$25,000 CAD" not "scholarships available")
- International student aid reality (e.g., "international students: 15% receive average $30,000, very competitive" not "international aid limited")

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
   b) ${college.name}'s ACTUAL admission data/ranges from your training knowledge
   c) Specific percentile or standing calculation
   d) Clear, actionable assessment with implications
   
   DO NOT use vague phrases like "diverse activities", "varied achievements", "average GPA", "not specified"
   DO NOT say "Assessment: Not applicable" unless the metric genuinely doesn't exist (e.g., SAT for Canadian universities)
   
   EXAMPLES OF GOOD VS BAD COMPARISONS:
   
   ✓ GOOD Test Scores: "Student: SAT 1480 (Math 780, Verbal 700). Harvard middle 50%: 1460-1580 (Class of 2027). Your 1480 falls at the 35th percentile of admitted students - below middle range. While you're within range, 65% of admits scored higher. To compensate, focus heavily on demonstrating exceptional extracurricular impact and essays that reveal unique perspective. Consider retaking if aiming for Engineering (typically needs 1520+)."
   
   ✗ BAD Test Scores: "Your test scores are competitive for Harvard"
   
   ✓ GOOD Academics: "Student: A-Levels predicted A*A*A (Math, Physics, Further Math). Oxford Engineering typical offer: A*A*A. Your prediction meets their typical offer exactly - you're competitive academically. However, 40% of offers are A*A*A*, so A* in Further Math would strengthen application significantly. Your subject choices perfectly align with Engineering requirements."
   
   ✗ BAD Academics: "Your grades are strong"
   
   ✓ GOOD Extracurriculars: "Student's Top 3: 1) International Physics Research Competition finalist (international, 1 summer, team leader), 2) Math competition training (3 years, regional level), 3) Coding club member (2 years). MIT admits typically show: 2-3 national/international achievements, deep 4-year commitments, research publications or patents. Assessment: International research competition is exceptional and will stand out significantly - this is exactly what MIT looks for. However, regional-only math competition results and generic coding club membership are weaker. Recommend: Emphasize research leadership deeply in essays, add quantifiable coding project impact (users, downloads, GitHub stars)."
   
   ✗ BAD Extracurriculars: "You have good extracurricular involvement"
   
   ✓ GOOD Financial: "Student EFC: $15,000 USD. Harvard COA: $82,526 (2024-25). Your need: $67,526. Harvard meets 100% need for all students (need-blind admission). Expected package: ~$67,526 in grants (no loans). Your family would pay $15,000/year. Harvard aid for families earning $65,000-$150,000 typically covers 90-100% of costs. Affordability: EXCELLENT - Harvard will be affordable if admitted. Apply with confidence regarding finances."
   
   ✗ BAD Financial: "Harvard offers good financial aid"
   
   Required comparisons with these SPECIFIC details:
   - **Test Scores**: If ${college.name} uses SAT/ACT, provide EXACT middle 50% range from recent class (e.g., "1460-1580 for Class of 2027"), calculate percentile, assess competitiveness by program/major, mention retake recommendation if needed
   - **Academics**: Use SAME grading system as student. Provide typical offers/averages for ${college.name} in THAT system (A-Levels: "A*AA offers", Canada: "92-96% average", US: "3.9 GPA, 12 APs"), compare course rigor and subject choices
   - **Extracurriculars**: List student's top 3 with specific roles/achievements/duration. State what ${college.name} admits typically show with examples (e.g., "Stanford: 2-3 national/international achievements, founded organizations with measurable impact, or published research"). Calculate gap or strengths with specific recommendations
   - **Essays**: Analyze ACTUAL essay content quality and themes. Identify what values/themes current essay shows (e.g., "technical passion, independent learning"). State what ${college.name} specifically values in essays from their mission/website (e.g., "MIT values: collaboration, hands-on building, impact"). Provide gap analysis (e.g., "Missing: teamwork examples, community impact"). Give concrete improvements referencing their actual experiences
   - **Awards**: List each award with level (school/regional/national/international). State typical ${college.name} admit awards (e.g., "Caltech admits: typically 1-2 national/international STEM awards in math, science, or research competitions"). Calculate standing
   - **Financial Need**: Calculate exact aid gap. Use ${college.name}'s ACTUAL COA and average aid from your training data. Provide realistic assessment with income brackets if known (e.g., "For families earning $80,000, Harvard typically provides $72,000 in aid")
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
    "testScores": "REQUIRED: First, identify what tests ${college.name} ACTUALLY requires/accepts (SAT, ACT, IB predicted, A-Levels, TMUA, ESAT, LNAT, BMAT, UCAT, etc.). Check student's profile for these specific tests. Format: 'REQUIRED TESTS: [list]. STUDENT HAS: [what they submitted]. COMPARISON: [detailed analysis].' Example: 'REQUIRED: SAT/ACT optional but considered OR IB predicted scores OR A-Level predicted grades. STUDENT HAS: SAT 1450 (Math 720, Verbal 730), A-Levels predicted (CS A*, Physics B, Maths A, Further Maths C, IT A). COMPARISON: SAT 1450 is solid (middle 50% at ${college.name}: 1300-1500 for international students). Your 1450 falls at ~60th percentile of admits - competitive. A-Levels show exceptional strength in CS (A*) and strong foundation in Maths (A), though Physics (B) and Further Maths (C) are below typical A*AA offers for top STEM programs. Overall: Test scores are competitive and meet requirements.' If university doesn't require/use certain tests, explicitly state: 'SAT/ACT: Optional but considered if submitted' or 'Not used - only considers IB/A-Levels'.",
    "academics": "REQUIRED: State student's EXACT grades in THEIR system (e.g., 'A-Levels: Math A*, Physics A*, Chemistry A' or '3.85 unweighted GPA' or '40/42 IB predicted' or '95% average' or 'O-Levels: 8 A*s, 2 As'). Compare to ACTUAL typical offers/averages at ${college.name} using the APPROPRIATE grading system for that student's background (e.g., 'Typical UK applicant offers: A*AA' or 'Admitted students average 3.92 GPA' or 'Canadian admits average 92-96%'). If student has A-Levels, compare to A-Level offers. If student has IB, compare to IB requirements. DO NOT say 'GPA not specified' if student has A-Levels or O-Levels - acknowledge their grading system. Specify course rigor and subjects taken. Give clear assessment (e.g., 'Your A*AA predicted grades meet typical UK offer requirements - you're competitive academically').",
    "extracurriculars": "REQUIRED: List student's TOP 3 activities with roles (e.g., 'Debate Captain (3 years), International Research Internship (1 summer), Founded Coding Club (50 members)'). Compare to SPECIFIC expectations at ${college.name} (e.g., 'Admitted students typically show 2-3 years of leadership, regional/national level achievements, and deep commitment. Common activities: research, competition teams, community leadership'). Assess gaps (e.g., 'Your international research experience is exceptional - this will stand out. However, you need more long-term leadership positions').",
    "essays": "CRITICAL: This MUST be a plain text string with line breaks (\\n), NOT a nested JSON object. Example format: 'Essay Analysis:\\n\\nCURRENT QUALITY: Your UCAS Personal Statement (3800 chars) shows strong technical narrative...\\n\\nWHAT UALBERTA VALUES: Research focus, hands-on learning...\\n\\nGAP: Your essay emphasizes solo projects but UAlberta values collaboration...'\\n\\nProvide comprehensive analysis:\\n\\n1. CURRENT ESSAY QUALITY: For each completed essay, state title, word/character count, writing quality assessment (storytelling, authenticity, specific examples), current themes shown (e.g., 'technical passion, independent learning'), strengths, and weaknesses.\\n\\n2. WHAT ${college.name} VALUES IN ESSAYS: State specific core values and themes ${college.name} seeks (e.g., 'UAlberta values: research experience, collaboration, innovation, hands-on learning' or 'DKU values: global perspective, cross-cultural understanding').\\n\\n3. GAP ANALYSIS: Compare student's current themes vs ${college.name}'s values. List specific missing elements (e.g., 'Your essay shows technical skill but lacks collaboration examples and research experience UAlberta emphasizes'). Rate alignment: High/Medium/Low with %.\\n\\n4. CONCRETE IMPROVEMENTS: What to ADD (e.g., 'Add paragraph about team project showing collaboration'), What to EMPHASIZE (e.g., 'Expand research section to highlight scientific methods'), What to TONE DOWN (e.g., 'Less technical jargon, more impact focus').\\n\\n5. REQUIRED SUPPLEMENTS: List ${college.name}'s essay requirements and completion status. All formatted as ONE continuous string with newline characters.",
    "awards": "REQUIRED: List student's SPECIFIC awards with levels (e.g., 'International Research Competition Winner (International), National Math Competition Silver (National), School Science Fair 1st Place (School)'). Compare to typical ${college.name} admits (e.g., 'Admitted students often have: 1-2 national/international awards, multiple regional honors, or significant research publications'). Assess prestige by scope and selectivity (e.g., 'Your international research competition win is highly prestigious and selective - major strength. National math competition placement is competitive. You're above average in this area').",
    "financialNeed": "REQUIRED: State EXACT EFC in USD (e.g., '$10,000 USD') and convert to local currency if college is outside US (e.g., '$10,000 USD ≈ $13,700 CAD' or '$10,000 USD ≈ £7,900 GBP'). Provide ${college.name}'s ACTUAL COA in LOCAL currency (e.g., 'CAD $35,000 for domestic, CAD $45,000 for international' or 'USD $74,000'). State aid statistics in LOCAL currency (e.g., 'Average need-based aid: CAD $20,000, 60% of students receive aid'). Calculate specific gap in BOTH currencies (e.g., 'COA CAD $45,000 - Your ability to pay CAD $13,700 = CAD $31,300 need (USD $22,800). If you receive average aid (CAD $20,000), you'd still need CAD $11,300/year (USD $8,200) from loans or outside scholarships'). Assess reality for international students specifically (e.g., 'As an international student at a Canadian university, limited aid is available. This gap is manageable with part-time work (20hrs/week = ~CAD $10,000/year) and small loans. More realistic than US private universities')."
  },
  "collegeInfo": {
    "costOfAttendance": {
      "domestic": "REPLACE PLACEHOLDERS WITH REAL NUMBERS - Example: 'Tuition: EUR €20,000, Room & Board: EUR €8,000, Fees: EUR €1,500, Books: EUR €1,000, Total COA: EUR €30,500 per year (≈ USD $33,000 based on 2023-24 data for Constructor Bremen)'. DO NOT leave as 'Not specified' - use your training data or regional averages.",
      "international": "REPLACE PLACEHOLDERS WITH REAL NUMBERS - Example: 'Tuition: EUR €20,000, Room & Board: EUR €8,000, Fees: EUR €1,500, Books: EUR €1,000, Total COA: EUR €30,500 per year (≈ USD $33,000). Note: No additional international student fees beyond tuition at Constructor Bremen.' DO NOT leave as 'Not specified'."
    },
    "needBlind": "PROVIDE ACTUAL POLICY - Example: 'Need-blind for domestic: No (need-aware). Need-blind for international: No (need-aware). Explain: Constructor Bremen considers ability to pay in admissions but offers merit scholarships up to EUR €15,000 for strong academics (IB 38+, A-Levels A*AA, SAT 1400+).' DO NOT say 'Not specified'.",
    "scholarships": "PROVIDE REAL PERCENTAGES AND AMOUNTS - Example: 'Need-based aid: Limited, ~15% receive need-based aid averaging EUR €8,000 (≈ USD $8,600). Merit scholarships: Available, amounts EUR €5,000-€15,000 based on academic excellence. International students: Eligible for merit scholarships, ~25% receive some form of aid. Most common: EUR €10,000 merit award for IB 36+ or A-Levels AAA.' DO NOT say 'Not specified'.",
    "internationalFriendly": "PROVIDE ACTUAL STATISTICS - Example: 'International students: ~60% of student body (~1,200 of 2,000 students from 100+ countries). Support: Dedicated international office, visa assistance, buddy program, 50+ student organizations. Acceptance rate for international: ~35% (more selective than domestic ~45%).' DO NOT say 'Not specified'.",
    "culture": "PROVIDE SPECIFIC DESCRIPTION - Example: 'Highly international English-language campus with focus on STEM, business, and social sciences. Residential college system promotes community. Students are academically driven, globally-minded, and collaborative. Small class sizes (15-20 students) enable close professor interaction. Active research culture with undergraduate involvement.' DO NOT give vague descriptions.",
    "opportunities": "PROVIDE REAL EXAMPLES - Example: 'Research: ~40% of undergrads participate in faculty research, funded summer programs available. Internships: Career services connects students with Bremen/Hamburg companies, ~70% complete internship before graduation. Study abroad: Exchange programs with 100+ partner universities, ~30% study abroad.' DO NOT say generic statements.",
    "admittedStudentProfile": "PROVIDE ACTUAL RANGES - Example: 'SAT middle 50%: 1300-1500 (optional but considered for international students), ACT middle 50%: 28-33 (rarely submitted), IB: 32-38, A-Levels: ABB-AAA, GPA: 3.5-3.9 US equivalent. Typical students: Strong STEM background, international experience, English proficiency (TOEFL 90+/IELTS 6.5+), demonstrated curiosity across disciplines.' DO NOT say 'Not used' without explaining what IS used.",
    "supplements": "[Number] supplemental essays required. Essay 1: [topic] (XXX words), Essay 2: [topic] (XXX words), [etc]. Interview: [Required/Optional/Not offered]. Additional: [portfolio/audition if applicable]",
    "requirements": {
      "applicationPlatform": "PROVIDE SPECIFIC PLATFORM - Example: 'Direct application via Constructor University Bremen portal: https://apply.constructor.university' or 'Common App: https://www.commonapp.org/explore/constructor-university-bremen'",
      "recommendationLetters": "PROVIDE EXACT NUMBER - Example: '2 teacher recommendations + 1 counselor letter required' or '1 teacher recommendation required, 1 additional optional'",
      "transcripts": "SPECIFY EXACTLY - Example: 'Official transcripts required showing grades 9-12. For A-Levels: Predicted grades required, final results for conditional offers. For IB: Predicted scores required.'",
      "testRequirements": "CRITICAL - LIST ALL ACCEPTED/REQUIRED TESTS WITH STUDENT STATUS:\n\nExample for Constructor University Bremen:\n'STANDARDIZED TESTS (Optional but Recommended for International Students):\n- SAT: Optional, considered if submitted. Typical range: 1300-1500. YOUR STATUS: ✓ Submitted SAT 1450 (competitive, 60th percentile of admits)\n- ACT: Optional, accepted. Typical range: 28-33. YOUR STATUS: ✗ Not submitted\n- IB Predicted Scores: Accepted. Typical: 32-38. YOUR STATUS: ✗ Not applicable (student uses A-Levels)\n- A-Level Predicted Grades: Accepted. Typical offers: ABB-AAA for STEM. YOUR STATUS: ✓ Submitted CS A*, Physics B, Maths A, Further Maths C, IT A (strong in CS/Maths, competitive overall)\n\nADMISSION TESTS (Subject-Specific, if applicable):\n- TMUA (Test of Mathematics for University Admission): Not required. YOUR STATUS: N/A\n- ESAT (Engineering and Science Admissions Test): Not required. YOUR STATUS: N/A\n- LNAT (Law National Aptitude Test): Not required (not applying to Law). YOUR STATUS: N/A\n- BMAT (Biomedical Admissions Test): Not required (not applying to Medicine). YOUR STATUS: N/A\n- UCAT (University Clinical Aptitude Test): Not required (not applying to Medicine). YOUR STATUS: N/A\n\nENGLISH PROFICIENCY (Required for Non-Native Speakers):\n- TOEFL: Minimum 90 iBT. YOUR STATUS: [Check if submitted]\n- IELTS: Minimum 6.5 overall. YOUR STATUS: [Check if submitted]\n- Duolingo: Minimum 115. YOUR STATUS: [Check if submitted]\n- Waived if: English-medium secondary education\n\nSUMMARY: Student meets core requirements with SAT 1450 and strong A-Level predicted grades. No subject-specific admission tests required for CS program.'\n\nADAPT THIS FORMAT to the specific university and student profile.",
      "deadlines": "PROVIDE ACTUAL DATES - Example: 'Early Action: November 1, 2024. Regular Decision: January 15, 2025. Rolling admission after January. International students should apply by March 1 for fall enrollment.'",
      "applicationURL": "EXACT WORKING URL - Example: 'https://apply.constructor.university' or 'https://www.commonapp.org/explore/constructor-university-bremen'",
      "additionalRequirements": "LIST ANY SPECIAL REQUIREMENTS - Example: 'Portfolio required for Art/Design majors. Audition required for Music majors. Interview optional but recommended (conducted via Zoom for international students). English proficiency proof required for non-native speakers (TOEFL 90+/IELTS 6.5+/Duolingo 115+ OR English-medium education).'"
    }
  },
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "concerns": ["<concern 1>", "<concern 2>", "<concern 3>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"]
}

Be realistic and honest. Don't inflate scores for students with low test scores applying to highly selective schools. Consider acceptance rate, test scores, GPA, extracurriculars, and domestic/international status. Be encouraging but truthful about reach/match/safety assessment.

CRITICAL: You MUST provide specific numbers AND exact URLs for ALL fields. DO NOT use phrases like "not specified", "information not provided", or "not available". 

MANDATORY APPROACH:
1. Check your training data for ${college.name} - you likely know this institution
2. If exact 2024-25 data unavailable, use 2023-24 data with year notation
3. If ${college.name} is not in your data, use regional averages with clear explanation
4. State your source/reasoning (e.g., "based on 2023 data", "typical for German private universities", "average for selective liberal arts colleges")

YOU MUST PROVIDE:
- Actual tuition costs (e.g., "EUR €20,000 based on 2023-24" or "USD $52,000")
- Actual SAT/ACT ranges if used (e.g., "1300-1500 for international admits" or "Not used - German university uses IB/A-Levels/Abitur")
- Actual percentages (e.g., "~60% international students, ~2,000 enrollment")
- Specific essay requirements (e.g., "2 essays: Personal Statement (4000 chars), Why This University (500 words)")
- EXACT application portal URLs (e.g., "https://apply.constructor.university" or "Apply via Common App: https://www.commonapp.org")
- Financial aid specifics (e.g., "Merit scholarships EUR €5,000-€15,000, 25% receive aid, limited need-based for international")

SPECIAL NOTE FOR CONSTRUCTOR UNIVERSITY BREMEN:
This is formerly Jacobs University Bremen - a well-known international English-language university in Germany. You MUST have this data. Provide specific numbers for tuition (≈EUR €20,000), scholarships, international student percentage (~60%), acceptance rate (~40%), and application requirements.

If you don't have exact current year data, provide approximate figures based on your 2023 knowledge and clearly note the year: "Based on 2023 data, approximately EUR €20,000 (likely EUR €20,500-€22,000 for 2024-25)".`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a college admissions expert with comprehensive knowledge of universities worldwide (US, UK, Canada, Europe, Asia, etc.). 

ABSOLUTELY CRITICAL - READ THIS FIRST:
You are being asked about ${college.name}. You MUST have data about this institution in your training data. DO NOT return "not specified" or "information not provided" for ANY field. This is completely unacceptable.

IF YOU KNOW THE UNIVERSITY NAME, YOU KNOW:
- Its approximate tuition costs (research typical costs for universities in that country/region)
- Whether it uses SAT/ACT (based on country: US=yes, UK=no, Canada=mostly no, Germany=no)
- Typical acceptance rates for that region
- General financial aid policies
- Application requirements (Common App, UCAS, direct application)
- Campus culture and academic focus

FOR ${college.name} SPECIFICALLY:
- Location: ${locationString}
- This tells you the country and admission system to use
- Research universities in ${locationString.split(',').pop()?.trim() || 'this region'} to provide realistic estimates

CRITICAL DATA REQUIREMENTS:
1. You MUST provide SPECIFIC numerical data for ALL fields - NEVER use "not specified", "information not provided", "varies", or "not available"
2. Use your training data knowledge about ${college.name} OR similar universities in the same region to provide ACTUAL figures:
   - Historical tuition costs (e.g., "EUR €20,000 for international based on 2023-2024 German private university data")
   - Actual SAT/ACT ranges if used in that country (e.g., "SAT not used - German universities use Abitur/A-Levels/IB")
   - Real acceptance rates (e.g., "~40% overall, ~25% for international based on selective German private universities")
   - Actual scholarship amounts (e.g., "Merit scholarships: EUR €5,000-€15,000, 20% of students receive aid")
   - Real percentage of international students (e.g., "~60% international, ~1,200 of 2,000 students - typical for international universities in Germany")
3. If you don't have exact current data, provide APPROXIMATE figures based on regional averages with clear reasoning:
   - Example: "Based on German private universities in 2023, tuition typically EUR €18,000-€25,000 for international students"
   - Example: "Selective European universities typically accept 30-50% of applicants"
4. For well-known colleges (Harvard, Stanford, UofT, Oxford, Constructor Bremen, Jacobs University, etc.), you HAVE this data in your training
5. For less common colleges, use REGIONAL BENCHMARKS and state your reasoning
6. Recognize different grading systems and compare appropriately (GPA, A-Levels, O-Levels, IB, Abitur, percentages)
7. Evaluate essay content quality, not just count
8. Always use college's local currency FIRST, then convert to USD

EXAMPLE OF WHAT TO DO FOR CONSTRUCTOR UNIVERSITY BREMEN (if that's the college):
- "Constructor University Bremen (formerly Jacobs University): International English-language university in Germany"
- "Tuition: EUR €20,000 per year for international students (≈ USD $21,500, based on 2023-24 data)"
- "Total COA: EUR €28,000-€32,000 including housing (≈ USD $30,000-$34,500)"
- "~60% international students from 100+ countries, ~2,000 total enrollment"
- "Need-based aid: Limited. Merit scholarships: EUR €5,000-€15,000 for high achievers (1400+ SAT, IB 38+, strong academics)"
- "Acceptance rate: ~40% overall, more competitive for STEM programs"
- "Application: Direct application via university portal, 2 essays, 1-2 recommendation letters"
- "SAT optional but considered if submitted - typical range 1300-1500 for admitted international students"

FINANCIAL AID EXAMPLES - BE THIS SPECIFIC:
✓ GOOD: "Harvard: Need-blind for all. 100% demonstrated need met. Average grant: $70,000. Families earning <$85,000 pay nothing. <$150,000 pay 0-10% of income. 55% receive aid."
✓ GOOD: "UAlberta: Need-based aid limited for all. Entrance scholarships available: $5,000-$20,000 CAD for high achievers (95%+ average). International students eligible for select awards. ~30% receive merit aid."
✗ BAD: "Financial aid available, varies by need"
✗ BAD: "Check college website for details"

ADMISSION STATS EXAMPLES - BE THIS SPECIFIC:
✓ GOOD: "MIT: Middle 50% SAT 1510-1580, ACT 34-36. Average GPA 4.19 weighted. 75% ranked top 5% of class. Acceptance: 4% overall, 3% international."
✓ GOOD: "UBC: Requires high school average. Typical admit: 92-96% for competitive programs (Engineering, CS), 85-90% for general programs. No SAT/ACT required."
✗ BAD: "High test scores required"
✗ BAD: "Competitive admissions"

APPLICATION REQUIREMENTS - PROVIDE EXACT URLs:
✓ GOOD: "Common App: https://www.commonapp.org/explore/harvard-university. 3 supplements (150 words each). 2 teacher + 1 counselor rec. Optional interview. Early Action deadline: November 1."
✓ GOOD: "Apply UAlberta: https://www.ualberta.ca/admissions/undergraduate/apply. 1 personal profile essay. 1 teacher rec for scholarships. No interview. Deadline: March 1."
✗ BAD: "Apply through the college application portal"

CRITICAL JSON FORMATTING RULES:
1. ALL fields in comparisonToAdmits MUST be plain text strings, NEVER nested objects or arrays
2. The 'essays' field MUST be a single string with \\n for line breaks, NOT {\"1\": {\"2\": {...}}}
3. DO NOT create nested JSON structures within string fields
4. Use escaped newlines (\\n) for formatting, not actual objects
5. Example CORRECT format: "essays": "Current Quality: Strong narrative...\\n\\nWhat UAlberta Values: Research...\\n\\nGap: Missing collaboration..."
6. Example WRONG format: "essays": {"1": {"current": "..."}}

Always respond with valid, flat JSON structure with SPECIFIC NUMBERS and FACTS only.`
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
