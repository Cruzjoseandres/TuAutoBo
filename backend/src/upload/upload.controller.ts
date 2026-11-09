import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { Request } from 'express';
import { UploadService } from './upload.service';
import type { IStorageResult } from './upload.service';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'repuestos');
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('repuesto')
  @ApiOperation({
    summary: 'Subir imagen de repuesto automotriz',
    description:
      'Almacena temporalmente la imagen optimizada en el backend local antes de la integración con Cloudinary.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Imagen subida exitosamente con URL pública.' })
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!existsSync(UPLOAD_DIR)) {
            mkdirSync(UPLOAD_DIR, { recursive: true });
          }
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const extension = extname(file.originalname).toLowerCase() || '.webp';
          const randomSuffix = Math.random().toString(36).substring(2, 10);
          const cleanName = `repuesto-${Date.now()}-${randomSuffix}${extension}`;
          cb(null, cleanName);
        },
      }),
      limits: {
        fileSize: 8 * 1024 * 1024, // Máximo 8 MB de archivo crudo
      },
      fileFilter: (_req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Formato de imagen inválido. Solo se admiten archivos JPG, PNG y WebP.',
            ),
            false,
          );
        }
      },
    }),
  )
  async subirImagenRepuesto(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ): Promise<IStorageResult> {
    return await this.uploadService.procesarArchivoRepuesto(file, req);
  }
}

