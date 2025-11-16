import clientPromise from './mongodb';
import { Readable } from 'stream';

export class ImageUpload {
  static async uploadImage(file, filename) {
    try {
      const client = await clientPromise;
      const db = client.db('launchpad');
      const bucket = new db.GridFSBucket(db, { bucketName: 'images' });

      // Convert File/Blob to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Create readable stream from buffer
      const readableStream = Readable.from(buffer);

      // Generate unique filename with timestamp
      const uniqueFilename = `${Date.now()}-${filename}`;

      // Upload to GridFS
      const uploadStream = bucket.openUploadStream(uniqueFilename, {
        contentType: file.type,
        metadata: {
          originalName: filename,
          uploadedAt: new Date()
        }
      });

      // Pipe the buffer to GridFS
      await new Promise((resolve, reject) => {
        readableStream.pipe(uploadStream)
          .on('error', reject)
          .on('finish', resolve);
      });

      return {
        fileId: uploadStream.id.toString(),
        filename: uniqueFilename,
        contentType: file.type,
        size: buffer.length
      };

    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error('Failed to upload image');
    }
  }

  static async getImage(fileId) {
    try {
      const client = await clientPromise;
      const db = client.db('launchpad');
      const bucket = new db.GridFSBucket(db, { bucketName: 'images' });
      const { ObjectId } = require('mongodb');

      const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));
      
      const chunks = [];
      for await (const chunk of downloadStream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);
      
      // Get file metadata
      const files = await db.collection('images.files').findOne({ 
        _id: new ObjectId(fileId) 
      });

      return {
        buffer,
        contentType: files?.contentType || 'image/jpeg',
        filename: files?.filename
      };

    } catch (error) {
      console.error('Image retrieval error:', error);
      throw new Error('Failed to retrieve image');
    }
  }

  static async deleteImage(fileId) {
    try {
      const client = await clientPromise;
      const db = client.db('launchpad');
      const bucket = new db.GridFSBucket(db, { bucketName: 'images' });
      const { ObjectId } = require('mongodb');

      await bucket.delete(new ObjectId(fileId));
      return true;

    } catch (error) {
      console.error('Image deletion error:', error);
      return false;
    }
  }

  // Alternative: Store base64 encoded images directly in document
  static async convertToBase64(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      
      return {
        data: `data:${file.type};base64,${base64}`,
        contentType: file.type,
        size: buffer.length
      };

    } catch (error) {
      console.error('Base64 conversion error:', error);
      throw new Error('Failed to convert image');
    }
  }
}
