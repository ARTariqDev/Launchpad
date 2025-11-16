import clientPromise from '../lib/mongodb';

const EXTRACURRICULARS_COLLECTION = 'extracurriculars';

export class Extracurricular {
  static async getCollection() {
    const client = await clientPromise;
    const db = client.db('launchpad');
    return db.collection(EXTRACURRICULARS_COLLECTION);
  }

  static async create({ name, date, description, thumbnail }) {
    const collection = await this.getCollection();
    
    const extracurricular = {
      name,
      date,
      description,
      thumbnail: thumbnail || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(extracurricular);
    return { ...extracurricular, _id: result.insertedId };
  }

  static async findAll() {
    const collection = await this.getCollection();
    return await collection.find({}).sort({ createdAt: -1 }).toArray();
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
