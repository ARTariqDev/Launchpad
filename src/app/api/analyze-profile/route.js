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

    const { profile, forceRefresh } = await request.json();
    
    // Create a hash of profile data to detect changes
    const profileDataHash = JSON.stringify({
      majors: profile.majors,
      essays: profile.essays?.length,
      extracurriculars: profile.extracurriculars?.length,
      awards: profile.awards?.length,
      testScores: profile.testScores,
      academics: profile.academics
    });
    
    // Check if we have cached analysis and profile hasn't changed
    if (!forceRefresh && profile.profileAnalysis && profile.profileAnalysis.profileHash === profileDataHash) {
      console.log('Using cached analysis - profile unchanged');
      return NextResponse.json({
        success: true,
        analysis: profile.profileAnalysis,
        cached: true
      });
    }
    
    console.log('Profile data changed or no cache - generating new analysis');
    
    // Prepare profile data for Gemini
    const profileSummary = {
      majors: profile.majors?.map(m => m.name).filter(Boolean) || [],
      essayCount: profile.essays?.length || 0,
      essays: profile.essays?.map(e => ({
        title: e.title,
        type: e.essayType,
        wordCount: e.content?.split(/\s+/).filter(w => w).length || 0
      })) || [],
      extracurriculars: profile.extracurriculars?.map(e => ({
        name: e.name,
        role: e.role
      })) || [],
      awards: profile.awards?.map(a => ({
        name: a.name,
        level: a.level
      })) || [],
      testScores: profile.testScores?.map(t => ({
        type: t.testType,
        scores: t.scores
      })) || [],
      academics: {
        type: profile.academics?.type || '',
        gpa: profile.academics?.gpa || '',
        subjectCount: profile.academics?.subjects?.length || 0
      }
    };

    // Format test scores for display
    const testScoresDisplay = profileSummary.testScores.map(test => {
      const scoreDetails = Object.entries(test.scores || {})
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      return `${test.type} (${scoreDetails || 'No scores'})`;
    }).join('; ') || 'None';

    const prompt = `You are a harsh but fair college admissions expert analyzing a student's application profile. Provide a realistic, holistic assessment.

Profile Data:
- Intended Majors: ${profileSummary.majors.join(', ') || 'None'}
- Essays: ${profileSummary.essayCount} essays written
- Extracurriculars: ${profileSummary.extracurriculars.length} activities
- Awards: ${profileSummary.awards.length} awards/honors
- Test Scores: ${testScoresDisplay}
- Academic Type: ${profileSummary.academics.type || 'Not specified'}
- GPA: ${profileSummary.academics.gpa || 'Not specified'}
- Subjects: ${profileSummary.academics.subjectCount} subjects

Rate each category from 1-10 (be realistic but fair):
1. Academic Excellence (grades, rigor, consistency)
2. Test Scores (standardized test performance - SAT 1550-1600 or ACT 35-36 = 9-10; SAT 1450-1540 or ACT 33-34 = 7-8; SAT 1350-1440 or ACT 30-32 = 6-7)
3. Extracurricular Impact (depth, leadership, commitment)
4. Awards & Recognition (prestige, relevance, achievement)
5. Essay Quality (based on completion and variety)
6. Overall Profile Coherence (how well everything ties together)

Provide your response in the following JSON format only (no additional text):
{
  "scores": {
    "academics": <number 1-10>,
    "testScores": <number 1-10>,
    "extracurriculars": <number 1-10>,
    "awards": <number 1-10>,
    "essays": <number 1-10>,
    "coherence": <number 1-10>
  },
  "overallScore": <average of all scores, 1 decimal>,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "improvements": ["improvement1", "improvement2", "improvement3"]
}

Be realistic and constructive. Consider:
- Are academics rigorous enough for top-tier schools?
- Test scores: A perfect SAT 1600 or ACT 36 deserves a 10. Near-perfect (1550+, 35+) deserves 9-10.
- Do extracurriculars show genuine passion and impact?
- Are awards prestigious and relevant?
- Do essays appear complete and well-thought-out?
- Does everything tell a coherent story about the student's interests and goals?

IMPORTANT: Give appropriate credit for excellent test scores. A 1600 SAT is exceptional and should be rated 10/10.`;

    // Verify API key
    const apiKey = process.env.Gpt;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Initializing OpenAI...');
    
    // Initialize OpenAI with API key
    const openai = new OpenAI({ apiKey });

    console.log('Generating analysis with GPT-3.5-Turbo...');
    
    // Generate content with gpt-3.5-turbo model
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });
    
    const responseText = completion.choices[0].message.content;
    
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    console.log('Parsing OpenAI response...');
    
    // Parse the JSON response from OpenAI
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not find JSON in response:', responseText);
      throw new Error('Could not parse OpenAI response');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    console.log('Analysis complete:', analysis.overallScore);

    // Add hash to analysis for cache validation
    analysis.profileHash = profileDataHash;

    return NextResponse.json({
      success: true,
      analysis,
      shouldCache: true
    });

  } catch (error) {
    console.error('Profile analysis error:', error);
    
    // Handle rate limit errors specifically
    if (error.status === 429) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please wait a moment and try again.',
          details: 'The OpenAI API rate limit has been reached. Please try refreshing in a few seconds.',
          rateLimitExceeded: true
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to analyze profile', details: error.message },
      { status: 500 }
    );
  }
}
