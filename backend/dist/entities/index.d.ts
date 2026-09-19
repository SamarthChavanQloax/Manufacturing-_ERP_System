export declare class UserInfo {
    id: number;
    user_email: string;
    type: string;
    user_role: string;
    user_name: string;
    user_password: string;
    date: string;
    time: string;
    timestamp: Date;
    deleted: string;
    drawing_download: string;
    drawing_upload: string;
}
export declare class Part {
    id: number;
    part_number: string;
    part_description: string;
    qty: number;
    customer_id: number;
    revision_date: string;
    customer_part_id: number;
    revision_no: string;
    diagram: string;
    model: string;
    part_family: string;
    created_id: number;
    date: string;
    time: string;
    timestamp: Date;
    deleted: number;
    revision_remark: string;
    hsn_code: string;
    uom: string;
    safety_stock: string;
}
export declare class Customer {
    id: number;
    customer_name: string;
}
export declare class Packing {
    id: number;
    barcode: string;
    part_id: number;
    part_qty: number;
    packing_details: Date;
    packing_name: string;
    created_by: number;
    created_time: string;
    created_date: string;
    status: string;
}
export declare class Box {
    id: number;
    barcode: string;
    box_name: string;
    box_size: string;
    customer_id: number;
    created_by: number;
    created_date: string;
    created_time: string;
    status: string;
    lock_status: string;
}
export declare class BoxPacking {
    id: number;
    box_id: number;
    pack_id: number;
    part_id: number;
    part_qty: number;
    created_by: number;
    created_date: string;
    created_time: string;
    status: string;
}
export declare class Invoice {
    id: number;
    barcode: string;
    invoice_number: string;
    created_by: number;
    created_date: string;
    created_time: string;
    status: string;
    lock_status: string;
    qty: number;
    part_id: number;
    status_new: string;
}
export declare class InvoiceBox {
    id: number;
    box_id: number;
    invoice_id: number;
    created_by: number;
    created_date: string;
    created_time: string;
    status: string;
}
export declare class InvoiceMatch {
    id: number;
    barcode: string;
    invoice_number: string;
    created_by: number;
    created_date: string;
    created_time: string;
    status: string;
    total_stock: number;
}
export declare class InvoiceBoxMatch {
    id: number;
    box_id: number;
    invoice_id: number;
    created_by: number;
    created_date: string;
    created_time: string;
    status: string;
}
