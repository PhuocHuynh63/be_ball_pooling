import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { MatchService } from './match.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';

@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) { }

  @Post()
  async create(@Body() createMatchDto: CreateMatchDto) {
    return this.matchService.create(createMatchDto);
  }

  @Get()
  async findAll() {
    return this.matchService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.matchService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateMatchDto: UpdateMatchDto) {
    return this.matchService.update(id, updateMatchDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.matchService.delete(id);
  }

}