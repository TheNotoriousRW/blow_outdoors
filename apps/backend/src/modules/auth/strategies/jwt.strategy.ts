import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Validate user exists
    const user = await this.authService.validateUserById(payload.sub);
    if (!user) {
      return null;
    }
    
    // Return payload data that will be available in req.user
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      userId: payload.sub, // Alias for convenience
    };
  }
}
