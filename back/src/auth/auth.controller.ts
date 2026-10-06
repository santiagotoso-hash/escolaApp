import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Publico } from '../common/decorators/publico.decorator';
import { AuthService } from './auth.service';
import { EntrarDto } from './dto/entrar.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Publico()
  @Post('entrar')
  @HttpCode(200)
  entrar(@Body() dto: EntrarDto) {
    return this.auth.entrar(dto);
  }
}
