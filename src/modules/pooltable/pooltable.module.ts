import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PoolTableService } from './pooltable.service';
import { PoolTableController } from './pooltable.controller';
import { PoolTable, PoolTableSchema } from '../../schemas/pooltable.schema';
import { Store, StoreSchema } from '../../schemas/store.schema';
import { AuthModule } from 'src/auth/auth.module'; 

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PoolTable.name, schema: PoolTableSchema },
      { name: Store.name, schema: StoreSchema },
    ]),
    AuthModule, 
  ],
  providers: [PoolTableService],
  controllers: [PoolTableController],
})
export class PoolTableModule {}