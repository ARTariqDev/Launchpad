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
        // Validate cached data has all required fields
        const requiredFields = ['fitScore', 'fitSummary', 'majorMatch', 'comparisonToAdmits', 'collegeInfo'];
        const hasAllFields = requiredFields.every(field => cachedInsight.insights[field] !== undefined);
        
        if (!hasAllFields) {
          console.log('⚠️  Cached data incomplete for', college.name, '- missing fields:', 
            requiredFields.filter(f => cachedInsight.insights[f] === undefined));
          console.log('Regenerating with updated schema...');
          // Fall through to generate new insights
        } else {
          console.log('\n✅ Returning CACHED college insights for', college.name);
          console.log('fitScore from cache:', cachedInsight.insights.fitScore);
          console.log('Keys in cached insights:', Object.keys(cachedInsight.insights));
          return NextResponse.json({
            success: true,
            insights: cachedInsight.insights,
            cached: true
          });
        }
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

    const prompt = `Analyze student fit for ${college.name}.

STUDENT:
- Majors: ${userMajors}
- Nationality: ${userNationality} (${applicantStatus})
- Academic: ${academicsSummary}
- Tests: ${testScoresSummary}
- ECs: ${extracurricularsSummary}
- Essays: ${essaysSummary}
- Awards: ${awardsSummary}
- EFC: ${userEFC !== null ? `$${userEFC.toLocaleString()}` : "Not specified"}

COLLEGE:
- ${college.name}, ${locationString}
- Type: ${college.type || "N/A"}
- Acceptance: ${college.acceptanceRate}%
- Tuition: $${college.tuition?.toLocaleString() || "N/A"}
- Avg EFC: $${college.efc?.toLocaleString() || "N/A"}
- Majors: ${collegeMajors.slice(0, 10).join(", ")}${collegeMajors.length > 10 ? '...' : ''}

TASK:
Provide detailed comparison in valid JSON format. For comparisonToAdmits, include SPECIFIC data:
- testScores: Student's scores vs ${college.name}'s middle 50% (if they use tests)
- academics: Student's grades vs typical admits (use their grading system)
- extracurriculars: Top 3 activities vs typical admit profile
- essays: Analyze actual content, themes, what ${college.name} values, gaps
- awards: List each with level, compare to typical admits
- financialNeed: Calculate exact gap with ${college.name}'s COA and aid

Include collegeInfo with specific costs, aid %, admission stats, application URL, requirements.

Keep responses concise. All comparisonToAdmits fields must be strings with \\n, not objects.

Return EXACTLY this JSON structure:
{
  "fitScore": <number 0-10>,
  "fitSummary": "<2-3 sentence summary>",
  "majorMatch": <true/false>,
  "majorInfo": "<explanation>",
  "efcComparison": "<financial comparison>",
  "comparisonToAdmits": {
    "testScores": "<detailed string>",
    "academics": "<detailed string>",
    "extracurriculars": "<detailed string>",
    "essays": "<detailed string>",
    "awards": "<detailed string>",
    "financialNeed": "<detailed string>"
  },
  "collegeInfo": {
    "costOfAttendance": {
      "domestic": "<specific costs>",
      "international": "<specific costs>"
    },
    "needBlind": "<policy>",
    "scholarships": "<details>",
    "internationalFriendly": "<stats>",
    "culture": "<description>",
    "opportunities": "<examples>",
    "admittedStudentProfile": "<ranges>",
    "supplements": "<essay requirements>",
    "requirements": {
      "applicationPlatform": "<URL>",
      "recommendationLetters": "<number>",
      "transcripts": "<details>",
      "testRequirements": "<details>",
      "deadlines": "<dates>",
      "applicationURL": "<URL>",
      "additionalRequirements": "<details>"
    }
  },
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "concerns": ["<concern 1>", "<concern 2>"],
  "recommendations": ["<rec 1>", "<rec 2>", "<rec 3>"]
}`;

    console.log('\n' + '='.repeat(80));
    console.log('COLLEGE INSIGHTS - API CALL');
    console.log('='.repeat(80));
    console.log('College:', college.name);
    console.log('Student Majors:', userMajors);
    console.log('Prompt Length:', prompt.length, 'characters');
    console.log('Max Tokens:', 1200);
    console.log('='.repeat(80) + '\n');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a college admissions expert. Analyze ${college.name} fit for this student.

CRITICAL RULES:
1. Provide SPECIFIC data - never say "not specified" or "varies"
2. Use your training knowledge about ${college.name} or regional averages
3. Recognize grading systems: GPA (US), A-Levels/O-Levels (UK), IB (International), Percentage (Canada)
4. Only mention SAT/ACT if college actually uses them (US=yes, UK/Canada/Europe=mostly no)
5. Use local currency first, then USD conversion
6. All comparisonToAdmits fields MUST be plain text strings with \\n for line breaks, NOT nested objects
7. Keep responses concise but specific

For ${college.name} (Location: ${locationString}), provide:
- Actual costs in local currency + USD
- Real admission stats (test ranges if used, typical grades)
- Specific aid data (% receiving aid, average amounts)
- Application requirements with URLs

Be realistic with fit scores based on acceptance rates and student stats.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 1200
    });

    const responseText = completion.choices[0].message.content.trim();
    
    console.log('\n' + '='.repeat(80));
    console.log('COLLEGE INSIGHTS - RAW AI RESPONSE');
    console.log('='.repeat(80));
    console.log(responseText);
    console.log('='.repeat(80) + '\n');
    
    let insights;
    try {
      let cleanedResponse = responseText;
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0].replace(/,(\s*[}\]])/g, '$1');
      }
      
      insights = JSON.parse(cleanedResponse);
      
      console.log('\n' + '='.repeat(80));
      console.log('COLLEGE INSIGHTS - PARSED INSIGHTS');
      console.log('='.repeat(80));
      console.log('fitScore:', insights.fitScore);
      console.log('fitSummary:', insights.fitSummary);
      console.log('majorMatch:', insights.majorMatch);
      console.log('majorInfo:', insights.majorInfo);
      console.log('efcComparison:', insights.efcComparison);
      console.log('comparisonToAdmits keys:', Object.keys(insights.comparisonToAdmits || {}));
      console.log('collegeInfo keys:', Object.keys(insights.collegeInfo || {}));
      console.log('strengths count:', insights.strengths?.length || 0);
      console.log('concerns count:', insights.concerns?.length || 0);
      console.log('recommendations count:', insights.recommendations?.length || 0);
      console.log('='.repeat(80) + '\n');
      
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
      console.log('\n' + '='.repeat(80));
      console.log('COLLEGE INSIGHTS - FINAL CLEANED INSIGHTS');
      console.log('='.repeat(80));
      console.log(JSON.stringify(insights, null, 2));
      console.log('='.repeat(80) + '\n');
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
