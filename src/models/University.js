import clientPromise from '../lib/mongodb';

const UNIVERSITIES_COLLECTION = 'universities';

export class University {
  static async getCollection() {
    const client = await clientPromise;
    const db = client.db('launchpad');
    return db.collection(UNIVERSITIES_COLLECTION);
  }

  static async create({ name, deadlines, location, thumbnail, adminNotes }) {
    const collection = await this.getCollection();
    
    const university = {
      name,
      deadlines: deadlines || [], // Array of { type: 'REA'|'EA'|'ED1'|'ED2'|'RD', date: 'YYYY-MM-DD' }
      location: location || { city: '', state: '', country: '' }, // { city, state, country }
      thumbnail: thumbnail || null,
      adminNotes: adminNotes || '', // Admin notes for college
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(university);
    return { ...university, _id: result.insertedId };
  }

  static async findAll() {
    const collection = await this.getCollection();
    return await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(200) // Limit results to prevent huge payloads
      .toArray();
  }

  static async findById(id) {
    const collection = await this.getCollection();
    const { ObjectId } = require('mongodb');
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  static async update(id, updates) {
    const collection = await this.getCollection();
    const { ObjectId } = require('mongodb');
    
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updates,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    return result;
  }

  static async delete(id) {
    const collection = await this.getCollection();
    const { ObjectId } = require('mongodb');
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  static async search(query) {
    const collection = await this.getCollection();
    return await collection.find({
      name: { $regex: query, $options: 'i' }
    }).toArray();
  }
}
