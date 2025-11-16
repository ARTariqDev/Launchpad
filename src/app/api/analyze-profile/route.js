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
    
    const categoryHashes = {
      academics: JSON.stringify({
        type: profile.academics?.type,
        gpa: profile.academics?.gpa,
        subjects: profile.academics?.subjects
      }),
      testScores: JSON.stringify(profile.testScores || []),
      extracurriculars: JSON.stringify(profile.extracurriculars || []),
      awards: JSON.stringify(profile.awards || []),
      essays: JSON.stringify(profile.essays || []),
      context: JSON.stringify({
        majors: profile.majors,
        nationality: profile.nationality,
        efc: profile.efc
      })
    };
    
    const existingAnalysis = profile.profileAnalysis;
    const hasExistingCache = existingAnalysis && existingAnalysis.categoryHashes;
    
    let categoriesToUpdate = ['academics', 'testScores', 'extracurriculars', 'awards', 'essays'];
    let shouldUpdateContext = false;
    
    if (!forceRefresh && hasExistingCache) {
      categoriesToUpdate = categoriesToUpdate.filter(category => {
        const changed = categoryHashes[category] !== existingAnalysis.categoryHashes[category];
        if (changed) {
          console.log(`Category '${category}' has changed - will update`);
        }
        return changed;
      });
      
      shouldUpdateContext = categoryHashes.context !== existingAnalysis.categoryHashes?.context;
      
      if (categoriesToUpdate.length === 0 && !shouldUpdateContext) {
        console.log('Using cached analysis - no changes detected');
        return NextResponse.json({
          success: true,
          analysis: existingAnalysis,
          cached: true
        });
      }
      
      console.log('Partial update needed for categories:', categoriesToUpdate);
      if (shouldUpdateContext) {
        console.log('Context has changed - will update overall score');
      }
    } else {
      console.log('Full profile analysis needed');
    }
    
    const profileSummary = {
      majors: profile.majors?.map(m => m.name).filter(Boolean) || [],
      nationality: profile.nationality || 'Not specified',
      efc: profile.efc !== undefined && profile.efc !== null ? profile.efc : 'Not specified',
      essayCount: profile.essays?.length || 0,
      essays: profile.essays?.map(e => {
        let totalWordCount = 0;
        let totalCharCount = 0;
        
        if (e.sections && Array.isArray(e.sections) && e.sections.length > 0) {
          const allContent = e.sections.map(s => s.content || s.answer || '').join(' ');
          totalWordCount = allContent.split(/\s+/).filter(w => w).length;
          totalCharCount = allContent.length;
        } else if (e.content) {
          totalWordCount = e.content.split(/\s+/).filter(w => w).length;
          totalCharCount = e.content.length;
        }
        
        return {
          title: e.title,
          type: e.essayType,
          wordCount: totalWordCount,
          charCount: totalCharCount,
          maxCount: e.maxCharCount || e.maxWordCount || 650,
          sectionsCount: e.sections?.length || 0,
          isComplete: e.maxCharCount ? totalCharCount > 0 : totalWordCount > 0
        };
      }) || [],
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

    const testScoresDisplay = profileSummary.testScores.map(test => {
      const scoreDetails = Object.entries(test.scores || {})
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      return `${test.type} (${scoreDetails || 'No scores'})`;
    }).join('; ') || 'None';

    const isPartialUpdate = hasExistingCache && categoriesToUpdate.length > 0 && categoriesToUpdate.length < 5;
    
    let prompt;
    if (isPartialUpdate) {
      const categoryDescriptions = {
        academics: `Academic Excellence: GPA ${profileSummary.academics.gpa || 'Not specified'}, ${profileSummary.academics.subjectCount} subjects, Type: ${profileSummary.academics.type || 'Not specified'}`,
        testScores: `Test Scores: ${testScoresDisplay}`,
        extracurriculars: `Extracurriculars: ${profileSummary.extracurriculars.length} activities`,
        awards: `Awards: ${profileSummary.awards.length} awards/honors`,
        essays: `Essays: ${profileSummary.essayCount} essays - ${profileSummary.essays.map(e => 
          `${e.title} (${e.isComplete ? e.charCount || e.wordCount : 0}/${e.maxCount} ${e.charCount ? 'characters' : 'words'}${e.sectionsCount > 0 ? `, ${e.sectionsCount} sections` : ''})`
        ).join(', ')}`
      };
      
      const categoriesToRate = categoriesToUpdate.map(cat => categoryDescriptions[cat]).join('\n- ');
      
      prompt = `You are a college admissions expert. Rate ONLY the following categories that have been updated (1-10 scale):

Updated Categories:
- ${categoriesToRate}

Context:
- Intended Majors: ${profileSummary.majors.join(', ') || 'None'}
- Nationality: ${profileSummary.nationality}
- EFC: ${typeof profileSummary.efc === 'number' ? `$${profileSummary.efc.toLocaleString()}` : profileSummary.efc}

Previous scores for unchanged categories:
${Object.entries(existingAnalysis.scores)
  .filter(([key]) => !categoriesToUpdate.includes(key))
  .map(([key, value]) => `- ${key}: ${value}/10`)
  .join('\n')}

Provide ONLY the updated scores in JSON format:
{
  "scores": {
    ${categoriesToUpdate.map(cat => `"${cat}": <number 1-10>`).join(',\n    ')}
  }
}

Rating guidelines:
- Academic Excellence: GPA, rigor, consistency
- Test Scores: SAT 1550-1600 or ACT 35-36 = 9-10; SAT 1450-1540 or ACT 33-34 = 7-8
- Extracurriculars: depth, leadership, commitment
- Awards: prestige, relevance, achievement
- Essays: completion, variety, quality`;
    } else {
      prompt = `You are a harsh but fair college admissions expert analyzing a student's application profile. Provide a realistic, holistic assessment.

Profile Data:
- Intended Majors: ${profileSummary.majors.join(', ') || 'None'}
- Nationality: ${profileSummary.nationality}
- Expected Family Contribution (EFC): ${typeof profileSummary.efc === 'number' ? `$${profileSummary.efc.toLocaleString()}` : profileSummary.efc}
- Essays: ${profileSummary.essayCount} essays - ${profileSummary.essays.map(e => 
    `${e.title} (${e.isComplete ? e.charCount || e.wordCount : 0}/${e.maxCount} ${e.charCount ? 'characters' : 'words'}${e.sectionsCount > 0 ? `, ${e.sectionsCount} sections` : ''})`
  ).join(', ')}
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

Provide your response in the following JSON format only (no additional text):
{
  "scores": {
    "academics": <number 1-10>,
    "testScores": <number 1-10>,
    "extracurriculars": <number 1-10>,
    "awards": <number 1-10>,
    "essays": <number 1-10>
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
- Do essays appear complete and well-thought-out? (Consider TOTAL content across ALL sections, not just word count)
- Does everything tell a coherent story about the student's interests and goals?

IMPORTANT: 
- Give appropriate credit for excellent test scores. A 1600 SAT is exceptional and should be rated 10/10.
- For essays with sections: An essay with 3998/4000 characters across multiple sections is COMPLETE, not incomplete!
- Judge essay quality on total content length and number of sections completed, not individual section lengths.`;
    }

    const apiKey = process.env.Gpt;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Initializing OpenAI...');
    
    const openai = new OpenAI({ apiKey });

    console.log('Generating analysis with GPT-3.5-Turbo...');
    
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
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not find JSON in response:', responseText);
      throw new Error('Could not parse OpenAI response');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    let finalAnalysis;
    
    if (isPartialUpdate) {
      finalAnalysis = {
        ...existingAnalysis,
        scores: {
          ...existingAnalysis.scores,
          ...parsedResponse.scores
        },
        categoryHashes: categoryHashes
      };
      
      const scores = Object.values(finalAnalysis.scores);
      finalAnalysis.overallScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
      
      if (!shouldUpdateContext) {
        console.log('Partial update complete - scores updated, context preserved');
      } else {
        console.log('Partial update with context change - consider full refresh for detailed feedback');
      }
      
    } else {
      finalAnalysis = {
        ...parsedResponse,
        categoryHashes: categoryHashes
      };
      console.log('Full analysis complete:', finalAnalysis.overallScore);
    }

    return NextResponse.json({
      success: true,
      analysis: finalAnalysis,
      shouldCache: true,
      partial: isPartialUpdate
    });

  } catch (error) {
    console.error('Profile analysis error:', error);
    
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
