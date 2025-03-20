import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MatchService } from './match.service';
import { MatchController } from './match.controller';
import { Match, MatchSchema } from './entities/match.schema';
import { UserModule } from '../user/user.module';
import { PoolTableModule } from '../pooltable/pooltable.module';
import { RolesGuard } from 'src/auth/passport/roles.guard';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Match.name, schema: MatchSchema }]),
    UserModule,
    PoolTableModule,
  ],
  providers: [MatchService, RolesGuard, JwtAuthGuard],
  controllers: [MatchController],
  exports: [MongooseModule, MatchService]

})
export class MatchModule { }