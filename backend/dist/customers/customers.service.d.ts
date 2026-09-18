import { Repository } from 'typeorm';
import { Customer } from '../entities';
export declare class CustomersService {
    private customerRepo;
    constructor(customerRepo: Repository<Customer>);
    findAll(): Promise<Customer[]>;
    create(customerName: string): Promise<Customer>;
    update(id: number, customerName: string): Promise<Customer>;
}
