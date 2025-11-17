import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import OpenAI from 'openai';

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { profile, category, currentScore } = await request.json();
    
    let categoryData = '';
    let categoryName = '';
    
    switch(category) {
      case 'academics':
        categoryName = 'Academic Excellence';
        const subjects = profile.academics?.subjects || [];
        const advancedCourses = subjects.filter(s => 
          s.level?.includes('AP') || s.level?.includes('IB') || s.level?.includes('Honors') || s.level?.includes('HL')
        );
        
        categoryData = `
Academic Information:
- Curriculum Type: ${profile.academics?.type || 'Not specified'}
- GPA: ${profile.academics?.gpa || 'Not specified'}
- Number of Subjects: ${subjects.length}

DETAILED SUBJECT LIST (Analyze rigor, grades, and relevance):
${subjects.length > 0 ? subjects.map((s, idx) => `
${idx + 1}. ${s.name || 'Unnamed subject'}
   - Level: ${s.level || 'Standard'}
   - Grade: ${s.grade || 'Not specified'}
   - Grade Type: ${s.gradeType || 'N/A'} (Predicted/Actual)
   - Curriculum: ${s.curriculumType || profile.academics?.type || 'N/A'}
`).join('') : 'No subjects listed'}

Advanced Course Summary:
- ${advancedCourses.length} advanced courses (AP/IB/Honors/HL)
- Advanced subjects: ${advancedCourses.map(s => s.name).join(', ') || 'None'}

CRITICAL: Analyze the ACTUAL course rigor, grade distribution, and how well subjects align with intended major!
`;
        break;
        
      case 'testScores':
        categoryName = 'Test Scores';
        const testScores = profile.testScores || [];
        
        categoryData = `
Test Scores (${testScores.length} test(s) recorded):

DETAILED TEST SCORE ANALYSIS:
${testScores.length > 0 ? testScores.map((test, i) => {
  const scoreDetails = Object.entries(test.scores || {})
    .filter(([_, value]) => value)
    .map(([key, value]) => `  ${key}: ${value}`)
    .join('\n');
    
  let analysis = '';
  
  if (test.testType === 'SAT') {
    const total = parseInt(test.scores?.total) || 0;
    const math = parseInt(test.scores?.math) || 0;
    const verbal = parseInt(test.scores?.verbal) || 0;
    
    analysis = `
  Competitiveness Analysis:
  - Total ${total}: ${total >= 1550 ? 'EXCEPTIONAL (99th percentile)' : 
                       total >= 1500 ? 'EXCELLENT (top 2%)' : 
                       total >= 1400 ? 'VERY GOOD (top 5%)' : 
                       total >= 1300 ? 'GOOD (top 15%)' : 
                       total >= 1200 ? 'ABOVE AVERAGE (top 25%)' : 'BELOW AVERAGE for selective colleges'}
  - Math ${math}/800: ${math >= 780 ? 'Outstanding' : math >= 700 ? 'Strong' : math >= 600 ? 'Good' : 'Needs improvement'}
  - Verbal ${verbal}/800: ${verbal >= 780 ? 'Outstanding' : verbal >= 700 ? 'Strong' : verbal >= 600 ? 'Good' : 'Needs improvement'}
  - Balance: Math and Verbal are ${Math.abs(math - verbal) <= 50 ? 'well-balanced' : 'notably different (consider retaking to balance)'}`;
  }
  
  if (test.testType === 'ACT') {
    const composite = parseInt(test.scores?.composite) || 0;
    analysis = `
  Competitiveness Analysis:
  - Composite ${composite}: ${composite >= 35 ? 'EXCEPTIONAL (99th percentile)' : 
                              composite >= 33 ? 'EXCELLENT (top 2%)' : 
                              composite >= 30 ? 'VERY GOOD (top 5%)' : 
                              composite >= 27 ? 'GOOD (top 15%)' : 'BELOW AVERAGE for selective colleges'}`;
  }
  
  if (test.testType === 'AP') {
    const score = parseInt(test.scores?.score) || 0;
    analysis = `
  AP Score Analysis:
  - Score ${score}/5 in ${test.scores?.subject}: ${score === 5 ? 'EXCELLENT - College credit likely' : 
                                                   score === 4 ? 'VERY GOOD - Credit at most colleges' : 
                                                   score === 3 ? 'GOOD - Credit at some colleges' : 'May not receive college credit'}`;
  }
  
  return `
${i + 1}. ${test.testType}:
${scoreDetails || '  No scores recorded'}${analysis}
`;
}).join('') : '- No test scores recorded'}

Scoring Guidelines for Analysis:
- SAT 1600 or ACT 36: 10/10 (Perfect, admits to any school)
- SAT 1550-1590 or ACT 35: 9-10/10 (Exceptional, competitive for top schools)
- SAT 1500-1540 or ACT 34: 8-9/10 (Excellent, strong for most schools)
- SAT 1400-1490 or ACT 31-33: 7-8/10 (Very good, competitive for many schools)
- SAT 1300-1390 or ACT 28-30: 6-7/10 (Good, above average)
- SAT 1200-1290 or ACT 24-27: 5-6/10 (Average, may limit options at selective schools)
- Below SAT 1200 or ACT 24: 3-5/10 (Below average for competitive colleges)

CRITICAL: Provide specific feedback based on the ACTUAL scores:
- Are these scores competitive for the student's target schools?
- Should they retake to improve chances?
- Are section scores balanced or is one notably weaker?
- For AP scores, do they demonstrate subject mastery?
`;
        break;
        
      case 'extracurriculars':
        categoryName = 'Extracurricular Impact';
        const extracurriculars = profile.extracurriculars || [];
        const leadershipECs = extracurriculars.filter(ec => 
          ec.role?.toLowerCase().includes('leader') || 
          ec.role?.toLowerCase().includes('president') || 
          ec.role?.toLowerCase().includes('director') ||
          ec.role?.toLowerCase().includes('founder') ||
          ec.role?.toLowerCase().includes('captain')
        );
        
        categoryData = `
Extracurricular Activities (${extracurriculars.length} total):

DETAILED ACTIVITY LIST (Analyze depth, impact, and leadership):
${extracurriculars.length > 0 ? extracurriculars.map((ec, i) => `
${i + 1}. ${ec.name || 'Unnamed activity'}
   Role: ${ec.role || 'Member'}
   Duration: ${ec.duration || 'Not specified'}
   
   FULL DESCRIPTION:
   ${ec.description || 'No description provided - this is a concern as it shows lack of detail about impact'}
   
   Analysis points:
   - Does this show leadership? ${ec.role?.toLowerCase().includes('leader') || ec.role?.toLowerCase().includes('president') || ec.role?.toLowerCase().includes('director') ? 'YES' : 'NO'}
   - Does the description quantify impact? (Look for numbers, achievements, tangible results)
   - Is there demonstrated commitment? (Look at duration)
   - How does this relate to intended major?
`).join('') : 'No extracurricular activities listed'}

Leadership Summary: ${leadershipECs.length} activities with leadership roles

CRITICAL: Read each activity description! Analyze:
- Depth vs breadth (10 shallow activities vs 3-4 deep commitments?)
- Tangible impact (specific achievements, numbers, outcomes)
- Leadership and initiative (did they create something, lead others, make change?)
- Alignment with academic interests
- Time commitment and sustained involvement
`;
        break;
        
      case 'awards':
        categoryName = 'Awards & Recognition';
        const awards = profile.awards || [];
        const internationalAwards = awards.filter(a => a.level?.toLowerCase().includes('international'));
        const nationalAwards = awards.filter(a => a.level?.toLowerCase().includes('national'));
        const regionalAwards = awards.filter(a => a.level?.toLowerCase().includes('regional') || a.level?.toLowerCase().includes('state'));
        const schoolAwards = awards.filter(a => a.level?.toLowerCase().includes('school'));
        
        const awardsList = awards.length > 0 ? awards.map((award, i) => {
          return `
${i + 1}. ${award.name || 'Unnamed award'}
   Level: ${award.level || 'Not specified'}
   Year: ${award.year || 'Not specified'}
   
   FULL DESCRIPTION:
   ${award.description || 'No description provided - unable to assess significance'}
   
   Analysis points:
   - Prestige level: ${award.level || 'Unknown'}
   - Competitiveness: (How selective is this award? How many compete?)
   - Relevance: (Does this relate to the student's intended major/interests?)
   - Significance: (Is this a well-known, prestigious recognition?)
`;
        }).join('') : 'No awards or honors listed';
        
        categoryData = `
Awards and Honors (${awards.length} total):

DETAILED AWARDS LIST (Analyze prestige, competitiveness, and relevance):
${awardsList}

Prestige Breakdown:
- International: ${internationalAwards.length} (e.g., ${internationalAwards.map(a => a.name).slice(0, 2).join(', ') || 'none'})
- National: ${nationalAwards.length}
- Regional/State: ${regionalAwards.length}
- School: ${schoolAwards.length}

⚠️ CRITICAL AWARD EVALUATION FRAMEWORK - READ CAREFULLY ⚠️

MANDATORY RATING RULES - FOLLOW EXACTLY:

1. IF award level = "International" → MUST rate 9-10/10 (unless clearly participation-only)
2. IF award includes "Gold Medal" at international level → MUST be 10/10
3. IF award includes "Medal" (any color) at international level → MUST be 9-10/10
4. ONE international medal = MORE PRESTIGIOUS than 10 school awards combined

RATING BY LEVEL (APPLY TO ANY AWARD IN ANY FIELD):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTERNATIONAL LEVEL → 9-10/10
  ✓ Any medal (Gold/Silver/Bronze) at international competition
  ✓ Global top 500 in any field
  ✓ Acceptance rate <1%
  ✓ Winner/finalist in recognized international competition
  Examples: Math olympiads, science competitions, research awards, debate championships

NATIONAL LEVEL → 7-9/10
  ✓ Top performer in country-wide competition
  ✓ National team selection
  ✓ Top 100 nationally in competitive field
  Examples: National competitions, merit programs, national recognition

REGIONAL/STATE → 5-7/10
  ✓ Regional competition winners
  ✓ State-level recognition

SCHOOL/LOCAL → 2-4/10
  ✓ Honor roll, school awards
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL REMINDERS:
❌ DO NOT rate international awards as 4/10 - this is incorrect
❌ DO NOT penalize for "lack of quantity" if they have 1-2 elite awards
❌ DO NOT require specific competition names - evaluate by level and selectivity
✓ DO recognize that international medals are EXCEPTIONAL achievements
✓ DO understand that one international gold medal > 100 school awards
`;
        break;
        
      case 'essays':
        categoryName = 'Essay Quality';
        const essays = profile.essays || [];
        
        console.log('Essays array length:', essays.length);
        if (essays.length > 0) {
          console.log('First essay structure:', {
            title: essays[0].title,
            hasSections: !!essays[0].sections,
            sectionsCount: essays[0].sections?.length,
            hasContent: !!essays[0].content,
            contentLength: essays[0].content?.length || 0
          });
        }
        
        categoryData = `
Essays (${essays.length} total):
${essays.length > 0 ? essays.map((essay, i) => {
  let totalContent = essay.content || '';
  let totalWordCount = 0;
  let totalCharCount = 0;
  
  if (essay.sections && Array.isArray(essay.sections) && essay.sections.length > 0) {
    console.log(`Essay ${i} has ${essay.sections.length} sections`);
    const sectionsContent = essay.sections.map(s => {
      const sectionText = s.content || s.answer || '';
      console.log(`  Section content length: ${sectionText.length}`);
      return sectionText;
    }).join(' ');
    totalContent = sectionsContent || totalContent;
    totalCharCount = sectionsContent.length;
    totalWordCount = sectionsContent.split(/\s+/).filter(w => w).length;
    console.log(`  Total from sections: ${totalCharCount} chars, ${totalWordCount} words`);
  } else {
    totalWordCount = totalContent.split(/\s+/).filter(w => w).length;
    totalCharCount = totalContent.length;
    console.log(`  Total from content field: ${totalCharCount} chars, ${totalWordCount} words`);
  }
  
  const maxCount = essay.maxCharCount ? essay.maxCharCount : essay.maxWordCount || 650;
  const countLabel = essay.maxCharCount ? 'characters' : 'words';
  const currentCount = essay.maxCharCount ? totalCharCount : totalWordCount;
  
  const status = currentCount > 0 ? (currentCount >= maxCount * 0.8 ? 'Complete' : 'In Progress') : 'Not started';
  const completionPercent = maxCount > 0 ? Math.round((currentCount / maxCount) * 100) : 0;
  
  let preview = 'No content yet';
  const firstSectionContent = essay.sections && essay.sections.length > 0 ? (essay.sections[0].content || essay.sections[0].answer) : null;
  if (firstSectionContent) {
    preview = firstSectionContent.substring(0, 150).replace(/[\n\r]/g, ' ').replace(/"/g, "'") + '...';
  } else if (essay.content) {
    preview = essay.content.substring(0, 150).replace(/[\n\r]/g, ' ').replace(/"/g, "'") + '...';
  }
  
  let sectionDetails = '';
  let fullEssayText = '';
  
  if (essay.sections && essay.sections.length > 0) {
    sectionDetails = `
   Sections (${essay.sections.length} total):`;
    
    essay.sections.forEach((s, idx) => {
      const sContent = s.content || s.answer || '';
      const sWordCount = sContent.split(/\s+/).filter(w => w).length;
      const sCharCount = sContent.length;
      
      sectionDetails += `
     - Section ${idx + 1}: ${s.question || 'No question'} (${essay.maxCharCount ? sCharCount : sWordCount} ${essay.maxCharCount ? 'chars' : 'words'})
       CONTENT: ${sContent}`;
       
      fullEssayText += (fullEssayText ? '\n\n' : '') + `[${s.question}]\n${sContent}`;
    });
  } else if (totalContent) {
    fullEssayText = totalContent;
  }
  
  return `
${i + 1}. ${essay.title || 'Untitled'}
   Type: ${essay.essayType || 'Not specified'}
   ${countLabel === 'characters' ? 'Character' : 'Word'} Count: ${currentCount}/${maxCount} ${countLabel} (${completionPercent}% complete)
   Status: ${status}${sectionDetails}
   
   FULL ESSAY TEXT FOR ANALYSIS:
   ${fullEssayText || 'No content written yet'}
`;
}).join('') : 'No essays written'}

CRITICAL: You MUST read and analyze the ACTUAL essay content above, not just the character counts!
Consider: 
- Content quality: Does the essay tell a compelling story?
- Authenticity: Does it feel genuine and personal?
- Showing vs telling: Are there specific examples and anecdotes?
- Personal insight: Does it reveal who the student is?
- Grammar/style: Is it well-written and clear?
- Engagement: Would an admissions officer remember this essay?
- Structure: Does it flow logically from section to section?

Base your feedback on the ACTUAL WORDS WRITTEN, not just completion percentage!
`;
        break;
        
      default:
        throw new Error('Invalid category');
    }

    const prompt = `You are an experienced college admissions counselor providing detailed feedback on a specific aspect of a student's application profile.

Category: ${categoryName}
Current Score: ${currentScore}/10

${categoryData}

Provide a comprehensive analysis in the following JSON format only (no additional text before or after):

CRITICAL JSON FORMATTING RULES:
- Use double quotes for all strings
- Escape any quotes inside strings with backslash: \"
- Do not use newlines inside string values - use spaces instead
- Ensure all arrays and objects are properly closed
- Do not include comments or extra text

{
  "assessment": "A detailed 2-3 sentence overall assessment explaining why this category received its score. Reference specific numbers from the data above.",
  "strengths": [
    "Specific strength 1 with concrete details from the profile data",
    "Specific strength 2 with concrete details from the profile data",
    "Specific strength 3 if applicable"
  ],
  "weaknesses": [
    "Specific weakness or concern 1 with explanation based on data",
    "Specific weakness or concern 2 with explanation based on data"
  ],
  "recommendations": [
    "Actionable recommendation 1 - be specific and practical",
    "Actionable recommendation 2 - be specific and practical",
    "Actionable recommendation 3 - be specific and practical"
  ]
}

Be EXTREMELY specific and constructive. You MUST:
- Quote actual text from essays, descriptions, and activities
- Reference specific course names, award names, activity names
- Cite actual numbers (scores, grades, character counts, years)
- Provide concrete, actionable advice based on what you read

Examples of GOOD feedback:
✓ "The transition from 'confused about linked lists' to reading Goodrich's textbook is excellent storytelling"
✓ "Your SAT 1440 (720M/720V) is competitive but below the 1500+ typically seen at top CS programs"
✓ "The CERN Beamline for Schools Outreach Award demonstrates international-level achievement in a relevant field"
✓ "While you have 10 activities, consider deepening your role in HackClub rather than adding more breadth"

Examples of BAD feedback (DO NOT DO THIS):
✗ "Your essay could use more depth" (too vague)
✗ "Test scores are okay" (not specific enough)
✗ "Add more activities" (generic advice)

If the score is high (8+), acknowledge specific excellences and suggest minor strategic refinements.
If the score is medium (5-7), identify 2-3 concrete improvement areas with specific action steps.
If the score is low (<5), provide urgent priorities with clear, achievable next steps.

For test scores specifically: A perfect SAT 1600 or ACT 36 deserves high praise. 1550+ or 35+ is excellent for any school.
For academics: Consider course rigor, GPA competitiveness, grade trends.
For extracurriculars: Look for depth over breadth, leadership, meaningful impact.
For essays: READ THE ACTUAL ESSAY TEXT PROVIDED! Analyze:
  - Story quality: Is it compelling, unique, memorable?
  - Authenticity: Does it sound genuine or generic?
  - Specific examples: Does it show (not just tell) through concrete anecdotes?
  - Personal growth: Does it reveal character development or self-awareness?
  - Writing quality: Grammar, vocabulary, sentence variety, transitions
  - Engagement: Would this stand out to an admissions officer?
  DO NOT just say "it's complete" - provide SPECIFIC feedback on the actual writing!`;

    const apiKey = process.env.Gpt;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`CATEGORY FEEDBACK - ${category.toUpperCase()}`);
    console.log('='.repeat(80));
    console.log('Current Score:', currentScore);
    console.log('\nPrompt being sent:');
    console.log('-'.repeat(80));
    console.log(prompt);
    console.log('='.repeat(80));
    
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a college admissions expert and writing coach. When analyzing essays, you MUST read and critique the ACTUAL essay text provided. Give specific feedback on writing quality, storytelling, authenticity, and impact - not just completion status. You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON. Ensure all strings use double quotes and escape any quotes inside strings. Do not use newlines inside string values."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });
    
    const responseText = completion.choices[0].message.content.trim();
    
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    console.log('Raw AI response:', responseText.substring(0, 200) + '...');

    let feedback;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Could not find JSON in response:', responseText);
        throw new Error('Could not parse OpenAI response - no JSON found');
      }

      let jsonString = jsonMatch[0]
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
      
      feedback = JSON.parse(jsonString);
      
      if (!feedback.assessment || !feedback.strengths || !feedback.weaknesses || !feedback.recommendations) {
        throw new Error('Invalid feedback structure - missing required fields');
      }
      
      console.log(`Feedback generated for ${category}`);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Failed to parse:', responseText);
      
      feedback = {
        assessment: 'Unable to generate detailed feedback at this time. Please try refreshing the analysis.',
        strengths: ['Analysis data is available but formatting failed'],
        weaknesses: ['Please refresh to try again'],
        recommendations: ['Click refresh analysis button and try viewing feedback again']
      };
    }

    return NextResponse.json({
      success: true,
      feedback
    });

  } catch (error) {
    console.error('Category feedback error:', error);
    
    if (error.status === 429) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please wait a moment and try again.',
          rateLimitExceeded: true
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate feedback', details: error.message },
      { status: 500 }
    );
  }
}
