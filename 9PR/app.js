const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ---------------- JWT CONFIG ----------------
const JWT_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

// ---------------- DATA ----------------
let users = [];
let products = [];

// ---------------- SWAGGER ----------------
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Auth Products API with Refresh Tokens",
            version: "1.0.0",
            description: "API for user authentication, refresh tokens and product management",
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    apis: [__filename],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => {
    res.json(swaggerSpec);
});

// ---------------- HELPERS ----------------
async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

async function verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
}

function signAccessToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            username: user.username,
        },
        JWT_SECRET,
        {
            expiresIn: ACCESS_EXPIRES_IN,
        }
    );
}

function signRefreshToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            username: user.username,
        },
        REFRESH_SECRET,
        {
            expiresIn: REFRESH_EXPIRES_IN,
        }
    );
}

function issueTokenPair(user) {
    return {
        accessToken: signAccessToken(user),
        refreshToken: signRefreshToken(user),
    };
}

function getRefreshTokenFromHeaders(req) {
    const headerToken = req.headers["x-refresh-token"] || req.headers["refresh-token"];
    if (typeof headerToken === "string" && headerToken.trim()) {
        return headerToken.trim();
    }

    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");
    if (scheme === "Bearer" && token) {
        return token;
    }

    return null;
}

function findUserById(id) {
    return users.find((u) => u.id === id);
}

// ---------------- AUTH MIDDLEWARE ----------------
function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({
            error: "Missing or invalid Authorization header",
        });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({
            error: "Invalid or expired token",
        });
    }
}

// ---------------- AUTH ROUTES ----------------

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, age]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               age:
 *                 type: number
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing required fields
 */
app.post("/api/auth/register", async (req, res) => {
    const { username, password, age } = req.body;

    if (!username || !password || age === undefined) {
        return res.status(400).json({
            error: "username, password and age are required",
        });
    }

    const passwordHash = await hashPassword(password);

    const user = {
        id: String(users.length + 1),
        username,
        age,
        passwordHash,
    };

    users.push(user);

    res.status(201).json({
        id: user.id,
        username: user.username,
        age: user.age,
    });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user and get token pair
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: JWT token pair
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Invalid credentials
 */
app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            error: "username and password are required",
        });
    }

    const user = users.find((u) => u.username === username);
    if (!user) {
        return res.status(401).json({
            error: "Invalid credentials",
        });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
        return res.status(401).json({
            error: "Invalid credentials",
        });
    }

    res.json(issueTokenPair(user));
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access and refresh tokens
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: x-refresh-token
 *         required: true
 *         schema:
 *           type: string
 *         description: Refresh token received from /api/auth/login
 *     responses:
 *       200:
 *         description: New token pair
 *       401:
 *         description: Missing, invalid or expired refresh token
 *       404:
 *         description: User not found
 */
app.post("/api/auth/refresh", (req, res) => {
    const refreshToken = getRefreshTokenFromHeaders(req);

    if (!refreshToken) {
        return res.status(401).json({
            error: "Missing refresh token in headers",
        });
    }

    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        const user = findUserById(payload.sub);

        if (!user) {
            return res.status(404).json({
                error: "User not found",
            });
        }

        res.json(issueTokenPair(user));
    } catch (err) {
        return res.status(401).json({
            error: "Invalid or expired refresh token",
        });
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Missing or invalid token
 *       404:
 *         description: User not found
 */
app.get("/api/auth/me", authMiddleware, (req, res) => {
    const userId = req.user.sub;
    const user = findUserById(userId);

    if (!user) {
        return res.status(404).json({
            error: "User not found",
        });
    }

    res.json({
        id: user.id,
        username: user.username,
        age: user.age,
    });
});

// ---------------- PRODUCTS ROUTES ----------------

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Product created successfully
 */
app.post("/api/products", (req, res) => {
    const { title, category, description, price } = req.body;

    const newProduct = {
        id: nanoid(),
        title,
        category,
        description,
        price: Number(price),
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of products
 */
app.get("/api/products", (req, res) => {
    res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product data
 *       401:
 *         description: Missing or invalid token
 *       404:
 *         description: Product not found
 */
app.get("/api/products/:id", authMiddleware, (req, res) => {
    const product = products.find((p) => p.id === req.params.id);

    if (!product) {
        return res.status(404).json({
            error: "Product not found",
        });
    }

    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated product
 *       401:
 *         description: Missing or invalid token
 *       404:
 *         description: Product not found
 */
app.put("/api/products/:id", authMiddleware, (req, res) => {
    const product = products.find((p) => p.id === req.params.id);

    if (!product) {
        return res.status(404).json({
            error: "Product not found",
        });
    }

    const { title, category, description, price } = req.body;

    if (title) product.title = title;
    if (category) product.category = category;
    if (description) product.description = description;
    if (price !== undefined) product.price = Number(price);

    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted
 *       401:
 *         description: Missing or invalid token
 *       404:
 *         description: Product not found
 */
app.delete("/api/products/:id", authMiddleware, (req, res) => {
    const index = products.findIndex((p) => p.id === req.params.id);

    if (index === -1) {
        return res.status(404).json({
            error: "Product not found",
        });
    }

    products.splice(index, 1);
    res.json({ deleted: true });
});

// ---------------- START SERVER ----------------
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
});