import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SeriesService } from './series.service';

@Controller('series')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Post()
  create(@Body() body: any) { return this.seriesService.create(body); }

  @Get()
  findAll() { return this.seriesService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.seriesService.findOne(id); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.seriesService.update(id, body); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.seriesService.remove(id); }
}