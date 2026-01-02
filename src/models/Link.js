import clientPromise from '../lib/mongodb';

const LINKS_COLLECTION = 'links';

export class Link {
  static async getCollection() {
    const client = await clientPromise;
    const db = client.db('launchpad');
    return db.collection(LINKS_COLLECTION);
  }

  static async create({ userId, label, url, type, customType, notes }) {
    const collection = await this.getCollection();
    
    const link = {
      userId,
      label,
      url,
      type,
      customType: type === 'Other' ? customType : null,
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(link);
    return { ...link, _id: result.insertedId };
  }

  static async findByUserId(userId) {
    const collection = await this.getCollection();
    return await collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  static async findById(id) {
    const collection = await this.getCollection();
    const { ObjectId } = require('mongodb');
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  static async update(id, userId, updates) {
    const collection = await this.getCollection();
    const { ObjectId } = require('mongodb');
    
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), userId },
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

  static async delete(id, userId) {
    const collection = await this.getCollection();
    const { ObjectId } = require('mongodb');
    
    const result = await collection.deleteOne({ 
      _id: new ObjectId(id),
      userId 
    });
    return result.deletedCount > 0;
  }
}
