import { Injectable, Inject } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor(@Inject('Cloudinary') private cloudinary) {}

  //#region uploadFile   
  async uploadFile(file: Express.Multer.File): Promise<{ message: string; url: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        { folder: 'uploads', public_id: file.originalname.split('.')[0] },
        (error, result: UploadApiResponse) => {
          if (error) {
            console.error('Upload Error:', error);
            return reject(new Error('Upload failed!'));
          }
          resolve({ message: 'Upload thành công!', url: result.secure_url });
        },
      );
  
      uploadStream.end(file.buffer); // Đẩy buffer vào Cloudinary
    });
  }
  //#endregion

  //#region uploadImage 
  async uploadImage(file: Express.Multer.File): Promise<string> {
        return new Promise((resolve, reject) => {
            this.cloudinary.uploader.upload_stream(
            { folder: 'avatars' }, // Lưu vào thư mục 'avatars'
            (error, result: UploadApiResponse) => {
            if (error) return reject(error);
            resolve(result.secure_url); // Trả về URL ảnh
            }
        ).end(file.buffer);
        });  
   }
   //#endregion
}