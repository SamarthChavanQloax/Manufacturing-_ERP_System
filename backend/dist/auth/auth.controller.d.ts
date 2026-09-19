import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: {
        email?: string;
        password?: string;
        user_email?: string;
        user_password?: string;
    }): Promise<{
        access_token: string;
        user: {
            id: number;
            user_name: string;
            user_email: string;
            type: string;
        };
    }>;
    getProfile(req: any): Promise<{
        id: number;
        user_name: string;
        user_email: string;
        type: string;
    }>;
}
