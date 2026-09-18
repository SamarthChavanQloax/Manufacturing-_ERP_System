import { CustomersService } from './customers.service';
export declare class CustomersController {
    private customersService;
    constructor(customersService: CustomersService);
    getAll(): Promise<import("../entities").Customer[]>;
    create(body: {
        customer_name?: string;
        customerName?: string;
    }): Promise<import("../entities").Customer>;
}
