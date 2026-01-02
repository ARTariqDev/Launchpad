import clientPromise from '../lib/mongodb';

const USER_PROFILES_COLLECTION = 'userProfiles';

export class UserProfile {
  static async getCollection() {
    const client = await clientPromise;
    const db = client.db('launchpad');
    return db.collection(USER_PROFILES_COLLECTION);
  }

  static async findByUserId(userId) {
    const collection = await this.getCollection();
    return await collection.findOne({ userId });
  }

  static async createOrUpdate(userId, profileData) {
    const collection = await this.getCollection();
    
    // Get existing profile to preserve lists that aren't being updated
    const existingProfile = await this.findByUserId(userId);
    
    const profile = {
      userId,
      major: profileData.major || '',
      majors: profileData.majors || [],
      nationality: profileData.nationality || '',
      efc: profileData.efc !== undefined ? profileData.efc : null,
      essays: profileData.essays || [],
      extracurriculars: profileData.extracurriculars || [],
      awards: profileData.awards || [],
      testScores: profileData.testScores || {
        sat: { total: null, math: null, verbal: null },
        act: { composite: null },
        tmua: { score: null },
        esat: { score: null }
      },
      academics: profileData.academics || {
        type: '', // 'AP', 'IB', 'A-Levels', 'Other'
        gpa: null,
        subjects: []
      },
      sectionCompletion: profileData.sectionCompletion || {
        majors: false,
        essays: false,
        extracurriculars: false,
        awards: false,
        testScores: false,
        academics: false
      },
      profileAnalysis: profileData.profileAnalysis || null,
      // Preserve existing saved/completed lists if not explicitly provided
      savedColleges: profileData.savedColleges !== undefined ? profileData.savedColleges : (existingProfile?.savedColleges || []),
      savedScholarships: profileData.savedScholarships !== undefined ? profileData.savedScholarships : (existingProfile?.savedScholarships || []),
      savedExtracurriculars: profileData.savedExtracurriculars !== undefined ? profileData.savedExtracurriculars : (existingProfile?.savedExtracurriculars || []),
      completedColleges: profileData.completedColleges !== undefined ? profileData.completedColleges : (existingProfile?.completedColleges || []),
      completedScholarships: profileData.completedScholarships !== undefined ? profileData.completedScholarships : (existingProfile?.completedScholarships || []),
      completedExtracurriculars: profileData.completedExtracurriculars !== undefined ? profileData.completedExtracurriculars : (existingProfile?.completedExtracurriculars || []),
      collegeInsights: profileData.collegeInsights || [],
      updatedAt: new Date()
    };

    const result = await collection.findOneAndUpdate(
      { userId },
      { 
        $set: profile,
        $setOnInsert: { createdAt: new Date() }
      },
      { 
        upsert: true,
        returnDocument: 'after'
      }
    );

    return result;
  }

  static async updateField(userId, field, value) {
    const collection = await this.getCollection();
    
    const result = await collection.findOneAndUpdate(
      { userId },
      { 
        $set: { 
          [field]: value,
          updatedAt: new Date()
        }
      },
      { 
        upsert: true,
        returnDocument: 'after'
      }
    );

    return result;
  }

  static async delete(userId) {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ userId });
    return result.deletedCount > 0;
  }
}
