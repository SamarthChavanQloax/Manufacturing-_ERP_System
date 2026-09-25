import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getAll(): Promise<import("../entities").UserInfo[]>;
    create(body: {
        user_name: string;
        user_email: string;
        user_password: string;
        user_role: string;
    }): Promise<import("../entities").UserInfo>;
    delete(id: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
