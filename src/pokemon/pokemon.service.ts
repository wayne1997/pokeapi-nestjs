import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';


import { isValidObjectId, Model } from 'mongoose';

import { PaginationDto } from 'src/common/dto/pagintation.dto';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';

@Injectable()
export class PokemonService {

  private defaultLimit: number;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>){
       this.defaultLimit = configService.get<number>('DEFAULT_LIMIT'); 
    }

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();
    try{
      const pokemon = await this.pokemonModel.create( createPokemonDto ); 
      return pokemon;
    }catch(error){
      this.handleExceptions(error);
    }
  }

  findAll(paginationDto : PaginationDto) {
    const {limit = this.defaultLimit, offset = 0 } = paginationDto;

    return this.pokemonModel.find()
    .limit(limit)
    .skip(offset)
    .sort({
      no: 1
    })
    .select(
      '-__v'
    );
  }

  async findOne(term: string) {
    let pokemon : Pokemon;

    if(!isNaN(+term)){
      pokemon = await this.pokemonModel.findOne({ no: term});
    }
    //verificacion por MongoId
    if( !pokemon  && isValidObjectId(term) ){
      pokemon = await this.pokemonModel.findById(term);
    }
    //Verificacion por Name
    if(!pokemon){
      pokemon = await this.pokemonModel.findOne({name: term.toLocaleLowerCase().trim()});
    }
    if(!pokemon) throw new NotFoundException(`Pokemon id, name or no "${term}" not found!`);
    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne(term);
    try{
    if(updatePokemonDto.name) updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
    await pokemon.updateOne( updatePokemonDto, {new: true} ); //devuelve el objeto actualizado
    return {...pokemon.toJSON(), ...updatePokemonDto};
    }catch(error){
     this.handleExceptions(error);

    }
  }

  async remove(id: string) {
    // const pokemon = await this.findOne( id );
    // await pokemon.deleteOne(); 
    //return {id};
    // const result =  await this.pokemonModel.findByIdAndDelete( id );
    const {deletedCount} = await this.pokemonModel.deleteOne({ _id: id });
   
    if( deletedCount === 0 ){
      throw new BadRequestException(`Pokemon with id "${ id }" not found`);
    }
    return ;
  }


  private handleExceptions(error: any){
    if( error.code === 11_000 ){
      throw new BadRequestException(`A pokemon is already registered in the db. Error: ${JSON.stringify(error.keyValue)}`);
    }
    console.log(error); //crear un archivo de logs
    throw new InternalServerErrorException(`Can't create a pokemon.`);

  }
}
