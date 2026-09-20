import { DynamicModule, Module, type FactoryProvider, type ModuleMetadata } from '@nestjs/common';
import { AUTH_OPTIONS } from './auth.constants';
import { AuthService } from './auth.service';
import type { AuthModuleOptions } from './auth.types';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { SessionIssuer } from './session-issuer';

export type AuthModuleAsyncOptions<TArgs extends unknown[] = unknown[]> = {
  readonly imports?: ModuleMetadata['imports'];
  readonly inject?: FactoryProvider['inject'];
  readonly useFactory: (...args: TArgs) => AuthModuleOptions | Promise<AuthModuleOptions>;
};

@Module({})
export class AuthModule {
  static registerAsync<TArgs extends unknown[] = unknown[]>(
    options: AuthModuleAsyncOptions<TArgs>,
  ): DynamicModule {
    return {
      module: AuthModule,
      imports: options.imports ?? [],
      providers: [
        { provide: AUTH_OPTIONS, inject: options.inject ?? [], useFactory: options.useFactory },
        PasswordService,
        TokenService,
        SessionIssuer,
        AuthService,
      ],
      exports: [AuthService, TokenService, SessionIssuer],
    };
  }
}
