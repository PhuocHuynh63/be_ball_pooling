import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PoolTableService } from './pooltable.service';
import { PoolTableController } from './pooltable.controller';
import { PoolTable, PoolTableSchema } from './entities/poolTable.schema';
import { StoreModule } from '../store/store.module';
import { AuthModule } from 'src/auth/auth.module';
import { UploadService } from 'src/upload/upload.service';
import { CloudinaryModule } from 'src/upload/cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PoolTable.name, schema: PoolTableSchema }]),
    AuthModule,
    CloudinaryModule,
  ],
  providers: [PoolTableService, UploadService],
  controllers: [PoolTableController],
  exports: [PoolTableService],
})
export class PoolTableModule { }