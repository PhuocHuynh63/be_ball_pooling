import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { Store, StoreSchema } from './entities/store.schema';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from '../user/user.module';
import { RolesGuard } from 'src/auth/passport/roles.guard';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';
import { UserService } from '@modules/user/user.service';
import { PoolTableService } from '@modules/pooltable/pooltable.service';
import { PoolTableModule } from '@modules/pooltable/pooltable.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Store.name, schema: StoreSchema }]),
    AuthModule,
    UserModule,
    PoolTableModule
  ],
  providers: [StoreService,
    RolesGuard, JwtAuthGuard],
  controllers: [StoreController],
  exports: [StoreService],
})


export class StoreModule { }