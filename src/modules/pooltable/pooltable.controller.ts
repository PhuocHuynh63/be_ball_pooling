import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PoolTableService } from './pooltable.service';
import { JwtAuthGuard } from 'src/auth/passport/jwt-auth.guard';
import { RolesGuard } from 'src/auth/passport/roles.guard';
import { CreatePoolTableDto } from './dto/create-pooltable.dto';

@Controller('pooltables')
export class PoolTableController {
  constructor(private readonly poolTableService: PoolTableService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  async create(@Body() createPoolTableDto: CreatePoolTableDto) {
    return this.poolTableService.create(createPoolTableDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async findAll() {
    return this.poolTableService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.poolTableService.findOne(id);
  }

  // Add more endpoints as needed
}