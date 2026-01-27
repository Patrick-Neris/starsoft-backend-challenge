import { Module } from '@nestjs/common';
import { CacheUtilsService } from './cache.util';

@Module({
  imports: [],
  providers: [CacheUtilsService],
  exports: [CacheUtilsService],
})
export class UtilsModule {}
