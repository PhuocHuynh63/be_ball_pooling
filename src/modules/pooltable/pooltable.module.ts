import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PoolTableService } from './pooltable.service';
import { PoolTableController } from './pooltable.controller';
import { PoolTable, PoolTableSchema } from './entities/PoolTable.schema';
import { StoreModule } from '../store/store.module'; 
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PoolTable.name, schema: PoolTableSchema }]),
    StoreModule, 
    AuthModule,
  ],
  providers: [PoolTableService],
  controllers: [PoolTableController],
  exports: [PoolTableService],
})
export class PoolTableModule {}