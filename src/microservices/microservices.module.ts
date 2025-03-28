import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Transport, ClientsModule } from '@nestjs/microservices';

@Module({
    imports: [
        ConfigModule,
        ClientsModule.registerAsync([
            {
                name: 'RABBITMQ_SERVICE',
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [configService.get<string>('RABBITMQ_URL')],
                        queue: 'pooltable_queue',
                        queueOptions: { durable: false },
                    },
                }),
            },
        ]),
    ],
    exports: [ClientsModule],
})
export class MicroservicesModule { }
