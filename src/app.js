import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';
import { adminJS, adminRouter } from './config/adminConfig.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import { requestLogger } from './middleware/loggingMiddleware.js';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Security and Logging Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Required for AdminJS to work properly without extra config
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// Serve static files with CORS headers
const staticCorsHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
};
app.use('/product_images', express.static(path.join(__dirname, 'assets/product_images'), { setHeaders: staticCorsHeaders }));
app.use('/brand_logos', express.static(path.join(__dirname, 'assets/brand_logos'), { setHeaders: staticCorsHeaders }));
app.use('/brand_images', express.static(path.join(__dirname, 'assets/brand_images'), { setHeaders: staticCorsHeaders }));

// AdminJS Dashboard (authenticated)
app.use(adminJS.options.rootPath, adminRouter);

// Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Global Error Handler
app.use(errorMiddleware);

export default app;
