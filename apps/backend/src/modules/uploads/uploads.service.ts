import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadsService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Get file URL path
   */
  getFileUrl(filename: string): string {
    const apiPrefix = this.configService.get('API_PREFIX', 'api');
    const port = this.configService.get('PORT', 3001);
    const host = this.configService.get('HOST', 'localhost');
    
    return `http://${host}:${port}/${apiPrefix}/v1/uploads/${filename}`;
  }

  /**
   * Get absolute file path
   */
  getFilePath(filename: string): string {
    const uploadLocation = this.configService.get('UPLOAD_LOCATION', './uploads');
    return join(process.cwd(), uploadLocation, filename);
  }

  /**
   * Check if file exists
   */
  fileExists(filename: string): boolean {
    const filePath = this.getFilePath(filename);
    return existsSync(filePath);
  }

  /**
   * Delete file from storage
   */
  deleteFile(filename: string): void {
    const filePath = this.getFilePath(filename);
    
    if (!existsSync(filePath)) {
      throw new NotFoundException(`File ${filename} not found`);
    }

    try {
      unlinkSync(filePath);
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get file info
   */
  getFileInfo(file: Express.Multer.File) {
    return {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: this.getFileUrl(file.filename),
      path: file.path,
    };
  }
}
