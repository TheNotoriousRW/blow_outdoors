import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { UploadsService } from './uploads.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Uploads')
@ApiBearerAuth('JWT-auth')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('single')
  @ApiOperation({ summary: 'Upload single file (image or PDF)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(@UploadedFile() file: Express.Multer.File) {
    return {
      message: 'File uploaded successfully',
      file: this.uploadsService.getFileInfo(file),
    };
  }

  @Post('multiple')
  @ApiOperation({ summary: 'Upload multiple files (max 10)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    const uploadedFiles = files.map((file) => this.uploadsService.getFileInfo(file));

    return {
      message: `${files.length} files uploaded successfully`,
      files: uploadedFiles,
    };
  }

  @Post('payment-proof')
  @ApiOperation({ summary: 'Upload payment proof document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Payment proof (PDF, JPG, PNG)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Payment proof uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPaymentProof(@UploadedFile() file: Express.Multer.File) {
    return {
      message: 'Payment proof uploaded successfully',
      file: this.uploadsService.getFileInfo(file),
    };
  }

  @Get(':filename')
  @ApiOperation({ summary: 'Download/view uploaded file' })
  @ApiResponse({ status: 200, description: 'File retrieved successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = this.uploadsService.getFilePath(filename);

    if (!this.uploadsService.fileExists(filename)) {
      throw new NotFoundException('File not found');
    }

    return res.sendFile(filePath);
  }

  @Delete(':filename')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Delete uploaded file (Admin/Finance only)' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFile(@Param('filename') filename: string) {
    this.uploadsService.deleteFile(filename);
    return { message: 'File deleted successfully' };
  }
}
