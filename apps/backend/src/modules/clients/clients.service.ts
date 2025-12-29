import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Client } from './client.entity';
import { User } from '../users/user.entity';
import { UserRole } from '../../common/enums';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<Client[]> {
    return this.clientRepository.find({ relations: ['user', 'billboards'] });
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['user', 'billboards', 'payments'],
    });
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
    return client;
  }

  async findByUserId(userId: string): Promise<Client | null> {
    return this.clientRepository
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.user', 'user')
      .leftJoinAndSelect('client.billboards', 'billboards')
      .where('client.userId = :userId', { userId })
      .getOne();
  }

  async create(createClientDto: any): Promise<Client> {
    console.log('===== CREATE CLIENT DEBUG =====');
    console.log('DTO:', JSON.stringify(createClientDto, null, 2));
    console.log('Has user?', !!createClientDto.user);
    console.log('Has email?', createClientDto.user?.email);
    console.log('Has password?', createClientDto.user?.password);
    
    // If user data is provided, create user first
    if (createClientDto.user && createClientDto.user.email && createClientDto.user.password) {
      console.log('ENTERING USER CREATION BLOCK');
      try {
        // Check if user already exists
        const existingUser = await this.userRepository.findOne({ 
          where: { email: createClientDto.user.email } 
        });
        if (existingUser) {
          throw new ConflictException('User with this email already exists');
        }

        console.log('Creating user...');
        // Hash password
        const hashedPassword = await bcrypt.hash(createClientDto.user.password, 10);

        // Create user
        const user = this.userRepository.create({
          email: createClientDto.user.email,
          password: hashedPassword,
          firstName: createClientDto.user.firstName,
          lastName: createClientDto.user.lastName,
          phone: createClientDto.user.phone,
          role: UserRole.CLIENT,
        });

        const createdUser = await this.userRepository.save(user);
        console.log('User created:', createdUser.id);
        
        // Remove user data from DTO
        const { user: _, ...clientData } = createClientDto;
        
        // Create client with the user ID
        const client = this.clientRepository.create({
          ...clientData,
          user: createdUser,
        });
        const savedClient = (await this.clientRepository.save(client)) as unknown as Client;
        console.log('Client created with userId:', savedClient.user?.id);
        return savedClient;
      } catch (error) {
        console.log('ERROR in user creation:', error.message);
        throw new BadRequestException(`Failed to create client with user: ${error.message}`);
      }
    }
    
    console.log('SKIPPING USER CREATION - Creating client only');
    // If userId is provided, use existing user
    const client = this.clientRepository.create(createClientDto);
    return (await this.clientRepository.save(client)) as unknown as Client;
  }

  async update(id: string, updateClientDto: any): Promise<Client> {
    await this.clientRepository.update(id, updateClientDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.clientRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
  }
}
