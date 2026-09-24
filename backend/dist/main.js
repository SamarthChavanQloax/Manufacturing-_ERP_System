"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configuredOrigins = [];
    if (process.env.FRONTEND_URL) {
        configuredOrigins.push(process.env.FRONTEND_URL.replace(/\/+$/, ''));
    }
    if (process.env.CORS_ORIGINS) {
        const list = process.env.CORS_ORIGINS.split(',').map((o) => o.trim().replace(/\/+$/, ''));
        configuredOrigins.push(...list);
    }
    const localOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ];
    const allowedOrigins = Array.from(new Set([...configuredOrigins, ...localOrigins])).filter(Boolean);
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) {
                return callback(null, true);
            }
            if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
                return callback(null, true);
            }
            try {
                const parsed = new URL(origin);
                if (parsed.hostname.endsWith('.vercel.app')) {
                    return callback(null, true);
                }
            }
            catch (e) {
            }
            if (allowedOrigins.length === localOrigins.length) {
                return callback(null, true);
            }
            callback(null, true);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
    const port = Number(process.env.PORT) || 5001;
    await app.listen(port, '0.0.0.0');
    console.log(`ERP Barcode Backend server is running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map