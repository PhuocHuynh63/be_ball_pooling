import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MatchService } from './match.service';
import { MatchController } from './match.controller';
import { Match, MatchSchema } from './entities/match.schema';
import { UserModule } from '../user/user.module'; 
import { PoolTableModule } from '../pooltable/pooltable.module'; 

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Match.name, schema: MatchSchema }]),
    UserModule,
    PoolTableModule, 
  ],
  providers: [MatchService],
  controllers: [MatchController],
  exports: [MongooseModule],
})
export class MatchModule {}