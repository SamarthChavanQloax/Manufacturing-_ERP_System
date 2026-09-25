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
    getProfileDetails(req: any): Promise<{
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
    updateProfile(req: any, body: {
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
    changePassword(req: any, body: {
        currentPassword?: string;
        newPassword?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
