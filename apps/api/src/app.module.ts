import { Module } from '@nestjs/common';
import { DatabaseModule } from '@repo/database';
import { ConfigModule, ConfigService } from '@/config';
import { HealthController } from '@/health.controller';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        url: config.db.url,
      }),
    }),
  ],
  controllers: [HealthController],
})
export class AppModule {}
