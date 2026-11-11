import { Controller, Get, Patch, Post, Body, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { ParametrosService } from './parametros.service';
import { ActualizarParametroDto, CrearParametroDto } from './dto/actualizar-parametro.dto';
import { Parametro } from './entities/parametro.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { RolEnum } from '../common/enums';

@ApiTags('parametros')
@Controller('parametros')
@UseGuards(RolesGuard)
export class ParametrosController {
  constructor(private readonly parametrosService: ParametrosService) {}

  @Get()
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Listar todos los parámetros del sistema (Solo Administrador)' })
  @ApiResponse({ status: 200, type: [Parametro] })
  async findAll(): Promise<Parametro[]> {
    return this.parametrosService.findAll();
  }

  @Get('app-version')
  @ApiOperation({ summary: 'Consultar versión oficial de la aplicación móvil APK (Público)' })
  async getAppVersion() {
    const VERSION_OFICIAL = '1.2.0';
    const versionDb = await this.parametrosService.obtener('APP_VERSION_ANDROID', VERSION_OFICIAL);
    const version = this.esVersionMayor(VERSION_OFICIAL, versionDb) ? VERSION_OFICIAL : versionDb;

    const apkUrl = 'https://tuautobo.onrender.com/api/parametros/descargar-apk?v=1.2.0';
    const novedades = await this.parametrosService.obtener(
      'APP_NOVEDADES_ACTUALIZACION',
      'Actualización obligatoria v1.2.0: Ubicaciones de entrega con pin exacto en Maps, bandeja de chats en vivo (Comprador y Tienda) y estados de pedidos en tiempo real con WebSockets.',
    );

    return {
      version,
      apk_url: apkUrl,
      novedades,
      obligatoria: true,
      fecha_actualizacion: new Date().toISOString(),
    };
  }

  @Get('descargar-apk')
  @ApiOperation({ summary: 'Descargar instalador APK oficial sin redirecciones cruzadas (Público)' })
  async descargarApk(@Res() res: Response) {
    const VERSION_OFICIAL = '1.2.0';
    const githubReleaseUrl =
      'https://github.com/Cruzjoseandres/TuAutoBo/releases/download/latest/TuAuto.apk';

    try {
      const response = await fetch(githubReleaseUrl, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'TuAuto-Backend-Downloader/1.2.0',
          Accept: 'application/octet-stream, application/vnd.android.package-archive, */*',
        },
      });

      if (!response.ok) {
        return res.redirect(githubReleaseUrl);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="TuAuto-v${VERSION_OFICIAL}.apk"`,
      );
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.status(200).end(buffer);
    } catch {
      return res.redirect(githubReleaseUrl);
    }
  }

  private esVersionMayor(vA: string, vB: string): boolean {
    const a = (vA || '').split('.').map((n) => parseInt(n, 10) || 0);
    const b = (vB || '').split('.').map((n) => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if ((a[i] || 0) > (b[i] || 0)) return true;
      if ((a[i] || 0) < (b[i] || 0)) return false;
    }
    return false;
  }

  @Get(':clave')
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Obtener el valor y descripción de un parámetro específico' })
  @ApiResponse({ status: 200, type: Parametro })
  async findByClave(@Param('clave') clave: string): Promise<Parametro> {
    return this.parametrosService.findByClave(clave);
  }

  @Patch(':clave')
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Actualizar el valor de un parámetro del negocio' })
  @ApiResponse({ status: 200, type: Parametro })
  async actualizar(
    @Param('clave') clave: string,
    @Body() dto: ActualizarParametroDto,
  ): Promise<Parametro> {
    return this.parametrosService.actualizar(clave, dto);
  }

  @Post()
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Crear un nuevo parámetro configurable' })
  @ApiResponse({ status: 201, type: Parametro })
  async create(@Body() dto: CrearParametroDto): Promise<Parametro> {
    return this.parametrosService.create(dto);
  }
}

