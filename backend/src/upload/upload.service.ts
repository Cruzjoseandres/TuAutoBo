import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export interface IStorageResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadPath = join(process.cwd(), 'uploads', 'repuestos');
  private readonly cloudinaryConfigurado: boolean = false;

  constructor() {
    if (!existsSync(this.uploadPath)) {
      mkdirSync(this.uploadPath, { recursive: true });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.cloudinaryConfigurado = true;
      this.logger.log(`Cloudinary configurado exitosamente para el cloud: ${cloudName}`);
    } else {
      this.logger.warn('Credenciales de Cloudinary incompletas. Se usará almacenamiento local en disco.');
    }
  }

  async procesarArchivoRepuesto(
    file: Express.Multer.File,
    req: Request,
  ): Promise<IStorageResult> {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ninguna imagen para subir.');
    }

    // Si Cloudinary está configurado, subir al CDN de Cloudinary
    if (this.cloudinaryConfigurado && file.path) {
      try {
        const resultado: UploadApiResponse = await cloudinary.uploader.upload(file.path, {
          folder: 'tuauto/repuestos',
          resource_type: 'image',
          use_filename: true,
          unique_filename: true,
        });

        // Eliminar el archivo temporal local para no consumir disco
        try {
          if (existsSync(file.path)) {
            unlinkSync(file.path);
          }
        } catch (unlinkErr) {
          this.logger.warn(`No se pudo eliminar el archivo temporal ${file.path}: ${unlinkErr.message}`);
        }

        this.logger.log(`Imagen subida a Cloudinary exitosamente: ${resultado.secure_url}`);

        return {
          url: resultado.secure_url,
          filename: resultado.public_id,
          size: resultado.bytes,
          mimetype: file.mimetype,
        };
      } catch (error) {
        this.logger.error(`Error al subir a Cloudinary: ${error.message}. Utilizando fallback local.`);
      }
    }

    // Fallback de almacenamiento local
    const protocol = req.protocol;
    const host = req.get('host') || 'localhost:3000';
    const publicUrl = `${protocol}://${host}/uploads/repuestos/${file.filename}`;

    this.logger.log(`Imagen de repuesto almacenada localmente: ${file.filename} (${file.size} bytes)`);

    return {
      url: publicUrl,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}

