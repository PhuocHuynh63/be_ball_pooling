import { Module } from '@nestjs/common';
import { RabbitmqService } from './rabbitmq.service';
import { RabbitmqController } from './rabbitmq.controller';
import { MicroservicesModule } from '../microservices.module';
import { PoolTableModule } from '@modules/pooltable/pooltable.module';

@Module({
  imports: [MicroservicesModule, PoolTableModule],
  controllers: [RabbitmqController],
  providers: [RabbitmqService],
  exports: [RabbitmqService],
})
export class RabbitmqModule { }
