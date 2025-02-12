import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { Store, StoreSchema } from './entities/store.schema';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Store.name, schema: StoreSchema }]),
    AuthModule,
    UserModule,
  ],
  providers: [StoreService],
  controllers: [StoreController],
  exports: [StoreService],
})
export class StoreModule {}