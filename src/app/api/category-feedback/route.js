import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getSession } from '@/lib/auth';

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

    if (!profile || !category) {
      return NextResponse.json(
        { error: 'Profile and category are required' },
        { status: 400 }
      );
    }

    const categoryLabels = {
      academics: 'Academic Profile',
      testScores: 'Test Scores',
      extracurriculars: 'Extracurricular Activities',
      essays: 'Essays',
      awards: 'Awards & Honors'
    };

    // Provide FULL profile for complete context
    const fullProfileSummary = {
      majors: profile.majors?.map(m => m.name).filter(Boolean) || [],
      nationality: profile.nationality || 'Not specified',
      efc: profile.efc,
      
      academics: {
        type: profile.academics?.type || 'Not specified',
        gpa: profile.academics?.gpa || 'Not specified',
        subjects: profile.academics?.subjects || []
      },
      
      testScores: profile.testScores || {},
      
      extracurriculars: profile.extracurriculars?.map(e => ({
        name: e.name,
        role: e.role,
        description: e.description
      })) || [],
      
      awards: profile.awards?.map(a => ({
        name: a.name,
        level: a.level,
        description: a.description
      })) || [],
      
      essays: profile.essays?.map(e => ({
        title: e.title,
        essayType: e.essayType,
        wordCount: e.content?.split(/\s+/).length || 0
      })) || []
    };

    console.log('\n' + '='.repeat(80));
    console.log('CATEGORY FEEDBACK REQUEST');
    console.log('='.repeat(80));
    console.log('Category:', category);
    console.log('Current Score:', currentScore);
    console.log('Full Profile Summary:', JSON.stringify(fullProfileSummary, null, 2));
    console.log('='.repeat(80) + '\n');

    const prompt = `You are an experienced college admissions counselor. You will analyze ONE specific category of a student's profile, but FIRST you must read and understand their ENTIRE profile for context.

📋 COMPLETE STUDENT PROFILE (READ THIS FIRST):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STUDENT BACKGROUND:
- Intended Majors: ${fullProfileSummary.majors.join(', ') || 'None specified'}
- Nationality: ${fullProfileSummary.nationality}
- EFC: ${fullProfileSummary.efc || 'Not specified'}

ACADEMICS:
  • Type: ${fullProfileSummary.academics.type}
  • GPA: ${fullProfileSummary.academics.gpa}
  • Subjects: ${fullProfileSummary.academics.subjects.join(', ') || 'None specified'}

TEST SCORES:
${Object.entries(fullProfileSummary.testScores).map(([test, scores]) => {
  if (!scores || typeof scores !== 'object') return null;
  const scoreStr = Object.entries(scores).filter(([k,v]) => v).map(([k,v]) => `${k}: ${v}`).join(', ');
  return scoreStr ? `  • ${test.toUpperCase()}: ${scoreStr}` : null;
}).filter(Boolean).join('\n') || '  • No test scores recorded'}

EXTRACURRICULARS (${fullProfileSummary.extracurriculars.length} activities):
${fullProfileSummary.extracurriculars.length > 0 
  ? fullProfileSummary.extracurriculars.map(e => `  • ${e.name} - ${e.role}`).join('\n')
  : '  • No extracurriculars recorded'}

AWARDS & HONORS (${fullProfileSummary.awards.length} awards):
${fullProfileSummary.awards.length > 0
  ? fullProfileSummary.awards.map(a => `  • ${a.name} (${a.level || 'Level not specified'})`).join('\n')
  : '  • No awards recorded'}

ESSAYS (${fullProfileSummary.essays.length} essays):
${fullProfileSummary.essays.length > 0
  ? fullProfileSummary.essays.map(e => `  • ${e.title} - ${e.essayType} (${e.wordCount} words)`).join('\n')
  : '  • No essays recorded'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 YOUR TASK: Analyze their ${categoryLabels[category].toUpperCase()}
Current Score: ${currentScore}/10

Specific Data for ${categoryLabels[category]}:
${JSON.stringify(profile[category] || {}, null, 2)}

🚨 CRITICAL INSTRUCTIONS - READ CAREFULLY 🚨

1. **MANDATORY CROSS-REFERENCE CHECKS**
   Before making ANY suggestion, you MUST check if it already exists elsewhere in the profile:
   
   ❌ WRONG: Essays feedback says "show more teamwork" 
   ✅ CHECK FIRST: Do they have team-based extracurriculars? Team leadership roles?
   
   ❌ WRONG: Essays feedback says "demonstrate leadership"
   ✅ CHECK FIRST: Are they already a Leader, Director, Founder, or Captain?
   
   ❌ WRONG: Awards feedback says "get more recognition"
   ✅ CHECK FIRST: Do they already have international awards or honors?
   
   ❌ WRONG: ECs feedback says "win competitions"
   ✅ CHECK FIRST: Do they already have competition wins in the awards section?
   
   Common cross-reference checks:
   * Teamwork/collaboration → CHECK: EXTRACURRICULARS for team roles (leader, member, captain)
   * Leadership → CHECK: EXTRACURRICULARS for leadership titles (leader, director, founder, president)
   * Competition success → CHECK: AWARDS for competition wins
   * Academic rigor → CHECK: ACADEMICS for course difficulty and grades
   * Community service → CHECK: EXTRACURRICULARS for volunteer/service roles
   * Technical skills → CHECK: EXTRACURRICULARS for projects, internships, courses

2. **WEAKNESSES ARE OPTIONAL**
   - If score is 8-10/10: You can say "No significant weaknesses" or leave weaknesses array EMPTY []
   - If score is 7-8/10: Only mention gaps that genuinely limit their competitiveness
   - If score is <7/10: Identify real areas needing improvement
   
   **Do NOT force weaknesses just to fill the array!** It's better to have [] than fabricate issues.

3. **FOCUS ON THIS CATEGORY ONLY**
   - Awards → Evaluate prestige/recognition ONLY (not leadership or service)
   - Extracurriculars → Evaluate involvement/impact ONLY (not awards or test scores)
   - Essays → Evaluate writing/narrative ONLY (not activities or test scores)
   - Keep boundaries clear between categories

4. **BE ENCOURAGING**
   - Acknowledge real strengths enthusiastically
   - Frame recommendations as "next level" enhancements, not fixes for problems
   - If they're already strong (7+), focus on polishing, not major changes

Provide feedback in this JSON format:
{
  "assessment": "A 2-3 sentence balanced assessment that acknowledges the student's accomplishments and context",
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "weaknesses": [],  // ← CAN BE EMPTY if score is 8+ or no real gaps exist
  "recommendations": ["enhancement idea 1", "next-level opportunity 2"]  // ← Focus on growth, not fixing problems
}

Be specific, reference their actual achievements, and be genuinely helpful rather than discouraging.`;

    const apiKey = process.env.Gpt;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const openai = new OpenAI({ apiKey });

const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{
    role: 'user',
    content: prompt
  }],
  temperature: 0.5,
  max_tokens: 800
});

const responseText = completion.choices[0]?.message?.content;

console.log('\n' + '='.repeat(80));
console.log('AI RESPONSE FOR', category.toUpperCase());
console.log('='.repeat(80));
console.log(responseText);
console.log('='.repeat(80) + '\n');
    
    // Parse JSON from response
    let feedback;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
    console.log('✅ Parsed feedback successfully:', JSON.stringify(feedback, null, 2));

      console.error('Failed to parse AI response:', parseError);
      feedback = {
        assessment: responseText.substring(0, 300),
        strengths: ['Analysis in progress'],
        weaknesses: ['Please review your profile'],
        recommendations: ['Continue building your profile']
      };
    }

    return NextResponse.json({ feedback });

  } catch (error) {
    console.error('Category feedback error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate feedback' },
      { status: 500 }
    );
  }
}
