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

    // Generate profile hash for cache invalidation
    const profileDataHash = JSON.stringify({
      majors: profile.majors || [],
      nationality: profile.nationality || '',
      essayCount: profile.essays?.length || 0,
      extracurricularCount: profile.extracurriculars?.length || 0,
      testScores: profile.testScores || [],
      academics: profile.academics || {},
      efc: profile.efc || null
    });

    // Check if we have cached insights for this college
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

    // Prepare user profile summary for GPT
    const userMajors = profile.majors?.map(m => m.name || m.major).join(", ") || "Not specified";
    const userGPA = profile.academics?.gpa || "Not specified";
    const userEFC = profile.efc !== undefined ? profile.efc : null;
    const userNationality = profile.nationality || "Not specified";
    
    // Determine if student is domestic or international for this college
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
      ? `${profile.essays.length} essays completed`
      : "No essays completed";

    const awardsSummary = profile.awards?.length > 0
      ? `${profile.awards.length} awards including: ${profile.awards.slice(0, 3).map(a => a.name).join(", ")}`
      : "No awards listed";

    // Check if college offers user's majors
    const collegeMajors = college.majors || [];
    const majorMatches = profile.majors?.filter(userMajor =>
      collegeMajors.some(collegeMajor =>
        collegeMajor.toLowerCase().includes(userMajor.major.toLowerCase()) ||
        userMajor.major.toLowerCase().includes(collegeMajor.toLowerCase())
      )
    ) || [];

    // Format location
    const locationString = typeof college.location === 'string'
      ? college.location
      : college.location
        ? [college.location.city, college.location.state, college.location.country].filter(Boolean).join(', ')
        : "Not specified";

    const prompt = `You are a college admissions expert. Analyze this student's fit for ${college.name}.

STUDENT PROFILE:
- Intended Majors: ${userMajors}
- Nationality: ${userNationality}
- Applicant Status: ${applicantStatus} (${isDomestic ? 'same country as college' : 'international applicant'})
- GPA: ${userGPA}
- Test Scores: ${testScoresSummary}
- Extracurriculars: ${extracurricularsSummary}
- Essays: ${essaysSummary}
- Awards: ${awardsSummary}
- Expected Family Contribution (EFC): ${userEFC !== null ? `$${userEFC.toLocaleString()}` : "Not specified"}

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

COSTS (REQUIRED - PROVIDE ACTUAL NUMBERS):
- Domestic tuition per year (e.g., "$52,000")
- Domestic room & board (e.g., "$18,000")  
- Domestic fees (e.g., "$4,000")
- Total domestic COA (e.g., "$74,000")
- International COA if different (usually same for private US colleges)
- Is college need-blind for domestic? For international?

FINANCIAL AID (REQUIRED):
- What % of students receive aid?
- Average need-based aid package
- Merit scholarships available? (amount ranges)
- International student aid available?

ADMISSIONS PROFILE (REQUIRED - PROVIDE ACTUAL RANGES):
- Middle 50% SAT range (e.g., "1460-1580")
- Middle 50% ACT range (e.g., "33-35")
- Average GPA of admitted students (e.g., "3.9-4.0 unweighted")
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
6. List 3 specific strengths this student has for this college
7. List 2-3 concerns or areas to consider
8. Provide 3 specific recommendations for the application
9. Include college information: need-blind status, international friendliness, research/internship opportunities, typical admitted student stats

SCORING GUIDELINES:
- SAT below 1000 for top colleges (acceptance <20%): 2-4/10 (very unlikely)
- SAT 1000-1200 for selective colleges (acceptance <30%): 4-6/10 (reach)
- SAT 1200-1400 for competitive colleges: 5-7/10 (match/reach)
- SAT 1400-1500 for top colleges: 7-8/10 (competitive)
- SAT 1500+ for top colleges: 8-10/10 (strong candidate)
- Consider GPA, extracurriculars, and essays in final score
- International students typically need higher scores

Return your analysis in this EXACT JSON format with SPECIFIC NUMBERS:
{
  "fitScore": <number 0-10>,
  "fitSummary": "<2-3 sentence summary of overall fit, be honest about chances>",
  "majorMatch": <true/false>,
  "majorInfo": "<explanation of major availability and any requirements>",
  "efcComparison": "<comparison of student EFC vs college EFC with financial aid insights>",
  "collegeInfo": {
    "costOfAttendance": {
      "domestic": "Tuition: $XX,XXX, Room & Board: $XX,XXX, Fees: $X,XXX, Books: $X,XXX, Total COA: $XX,XXX per year",
      "international": "Same as domestic (or specify if different): Total COA: $XX,XXX per year. Note: [any additional international student fees]"
    },
    "needBlind": "Need-blind for domestic: Yes/No. Need-blind for international: Yes/No. Explain: [details about financial aid consideration in admissions]",
    "scholarships": "Need-based aid: XX% of students receive average of $XX,XXX. Merit scholarships: [Available/Not available], amounts: $X,XXX-$XX,XXX. International students: [aid availability and restrictions]",
    "internationalFriendly": "International students: XX% of student body (~X,XXX students). Support: [International student office, visa sponsorship for OPT/CPT, cultural organizations]. Acceptance rate for international: XX%",
    "culture": "[Specific description: e.g., 'Highly intellectual and research-focused with strong pre-professional programs. Students are academically driven, collaborative, and involved in numerous extracurriculars.']",
    "opportunities": "Research: [e.g., '90% of students participate in research, funded summer programs available']. Internships: [e.g., 'Strong career services, 85% secure internships']. Study abroad: [programs available]",
    "admittedStudentProfile": "SAT middle 50%: XXXX-XXXX, ACT middle 50%: XX-XX, GPA: X.X-4.0 unweighted. Typical students have: [description of typical admits]",
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

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a college admissions expert with comprehensive knowledge of US and UK universities. You MUST provide specific numerical data (costs, test score ranges, percentages) based on your training data about colleges. Never say 'not specified' or 'information not provided' - use your knowledge to provide actual figures. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const responseText = completion.choices[0].message.content.trim();
    
    // Parse JSON response
    let insights;
    try {
      // Try to extract JSON if there's extra text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      insights = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch (parseError) {
      console.error("Failed to parse GPT response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Cache the insights
    const collegeInsights = profile.collegeInsights || [];

    // Remove old cache for this college if exists
    const updatedInsights = collegeInsights.filter(
      insight => insight.collegeId !== collegeId
    );

    // Add new cache
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
