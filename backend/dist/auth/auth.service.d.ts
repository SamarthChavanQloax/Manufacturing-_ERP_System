import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UserInfo } from '../entities';
export declare class AuthService {
    private userRepository;
    private jwtService;
    constructor(userRepository: Repository<UserInfo>, jwtService: JwtService);
    validateUser(email: string, pass: string): Promise<UserInfo>;
    login(email: string, pass: string): Promise<{
        access_token: string;
        user: {
            id: number;
            user_name: string;
            user_email: string;
            type: string;
        };
    }>;
    getProfile(userId: number): Promise<{
        id: number;
        user_name: string;
        user_email: string;
        type: string;
    }>;
    getProfileDetails(userId: number): Promise<{
        id: number;
        user_name: string;
        user_email: string;
        type: string;
        user_role: string;
        employee_id: string;
        mobile: string;
        department: string;
        status: string;
        last_login: string;
        drawing_download: string;
        drawing_upload: string;
    }>;
    updateProfile(userId: number, data: {
        user_name?: string;
        mobile?: string;
    }): Promise<{
        success: boolean;
        message: string;
        user: {
            id: number;
            user_name: string;
            user_email: string;
            type: string;
        };
    }>;
    changePassword(userId: number, currentPass: string, newPass: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
