import { Repository } from 'typeorm';
import { UserInfo } from '../entities';
export declare class UsersService {
    private userRepository;
    constructor(userRepository: Repository<UserInfo>);
    findAll(): Promise<UserInfo[]>;
    create(data: {
        user_name: string;
        user_email: string;
        user_password: string;
        user_role: string;
    }): Promise<UserInfo>;
}
