"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const dotenv = require("dotenv");
const entities_1 = require("./entities");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const parts_module_1 = require("./parts/parts.module");
const customers_module_1 = require("./customers/customers.module");
const packing_module_1 = require("./packing/packing.module");
const boxes_module_1 = require("./boxes/boxes.module");
const invoices_module_1 = require("./invoices/invoices.module");
const verification_module_1 = require("./verification/verification.module");
const reports_module_1 = require("./reports/reports.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const settings_module_1 = require("./settings/settings.module");
const health_controller_1 = require("./health/health.controller");
dotenv.config();
const isSslEnabled = process.env.DB_SSL === 'true';
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: 'mysql',
                ...(process.env.DATABASE_URL
                    ? { url: process.env.DATABASE_URL }
                    : {
                        host: process.env.DB_HOST || '127.0.0.1',
                        port: Number(process.env.DB_PORT) || 3306,
                        username: process.env.DB_USER || 'root',
                        password: process.env.DB_PASS || 'Outlook@123',
                        database: process.env.DB_NAME || 'barcode',
                    }),
                ssl: isSslEnabled ? { rejectUnauthorized: false } : undefined,
                entities: [
                    entities_1.UserInfo,
                    entities_1.Part,
                    entities_1.Customer,
                    entities_1.Packing,
                    entities_1.Box,
                    entities_1.BoxPacking,
                    entities_1.Invoice,
                    entities_1.InvoiceBox,
                    entities_1.InvoiceMatch,
                    entities_1.InvoiceBoxMatch,
                ],
                synchronize: false,
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            parts_module_1.PartsModule,
            customers_module_1.CustomersModule,
            packing_module_1.PackingModule,
            boxes_module_1.BoxesModule,
            invoices_module_1.InvoicesModule,
            verification_module_1.VerificationModule,
            reports_module_1.ReportsModule,
            dashboard_module_1.DashboardModule,
            settings_module_1.SettingsModule,
        ],
        controllers: [health_controller_1.HealthController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map