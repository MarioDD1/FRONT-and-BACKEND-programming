const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const swaggerUi = require("swagger-ui-express");

const app = express();
app.use(express.json());

const PORT = 3000;

// ---------------- JWT CONFIG ----------------
const JWT_SECRET = "access_secret"; 
const ACCESS_EXPIRES_IN = "15m";

// ---------------- DATA ----------------
let users = [];
let products = [];

// ---------------- SWAGGER ----------------
const swaggerDocument = {
    openapi: "3.0.0",
    info: {
        title: "Auth Products API",
        version: "1.0.0",
        description: "API for user authentication and product management",
    },
    servers: [
        {
            url: "http://localhost:3000",
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
    paths: {
        "/api/auth/register": {
            post: {
                summary: "Register a new user",
                tags: ["Auth"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["username", "password", "age"],
                                properties: {
                                    username: { type: "string", example: "john" },
                                    password: { type: "string", example: "secret123" },
                                    age: { type: "number", example: 25 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "User registered successfully",
                    },
                    400: {
                        description: "Missing required fields",
                    },
                },
            },
        },
        "/api/auth/login": {
            post: {
                summary: "Login user",
                tags: ["Auth"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["username", "password"],
                                properties: {
                                    username: { type: "string", example: "john" },
                                    password: { type: "string", example: "secret123" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "JWT access token",
                    },
                    400: {
                        description: "Missing required fields",
                    },
                    401: {
                        description: "Invalid credentials",
                    },
                },
            },
        },
        "/api/auth/me": {
            get: {
                summary: "Get current user profile",
                tags: ["Auth"],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Current user data",
                    },
                    401: {
                        description: "Missing or invalid token",
                    },
                    404: {
                        description: "User not found",
                    },
                },
            },
        },
        "/api/products": {
            post: {
                summary: "Create a product",
                tags: ["Products"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    title: { type: "string", example: "Laptop" },
                                    category: { type: "string", example: "Electronics" },
                                    description: { type: "string", example: "Fast and lightweight" },
                                    price: { type: "number", example: 1200 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Product created successfully",
                    },
                },
            },
            get: {
                summary: "Get all products",
                tags: ["Products"],
                responses: {
                    200: {
                        description: "List of products",
                    },
                },
            },
        },
        "/api/products/{id}": {
            get: {
                summary: "Get product by ID",
                tags: ["Products"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    200: {
                        description: "Product data",
                    },
                    401: {
                        description: "Missing or invalid token",
                    },
                    404: {
                        description: "Product not found",
                    },
                },
            },
            put: {
                summary: "Update product by ID",
                tags: ["Products"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    200: {
                        description: "Updated product",
                    },
                    401: {
                        description: "Missing or invalid token",
                    },
                    404: {
                        description: "Product not found",
                    },
                },
            },
            delete: {
                summary: "Delete product by ID",
                tags: ["Products"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    200: {
                        description: "Product deleted",
                    },
                    401: {
                        description: "Missing or invalid token",
                    },
                    404: {
                        description: "Product not found",
                    },
                },
            },
        },
    },
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/api-docs.json", (req, res) => {
    res.json(swaggerDocument);
});

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

// REGISTER
app.post("/api/auth/register", async (req, res) => {
    const { username, password, age } = req.body;

    if (!username || !password || age === undefined) {
        return res.status(400).json({
            error: "username, password and age are required",
        });
    }

    const passwordHash = await bcrypt.hash(password, 10);

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

// LOGIN
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

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
        return res.status(401).json({
            error: "Invalid credentials",
        });
    }

    const accessToken = jwt.sign(
        {
            sub: user.id,
            username: user.username,
        },
        JWT_SECRET,
        {
            expiresIn: ACCESS_EXPIRES_IN,
        }
    );

    res.json({
        accessToken,
    });
});

// ---------------- PROTECTED ROUTE ----------------

// GET /api/auth/me
app.get("/api/auth/me", authMiddleware, (req, res) => {
    const userId = req.user.sub;
    const user = users.find((u) => u.id === userId);

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

// CREATE PRODUCT (public)
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

// GET ALL PRODUCTS (public)
app.get("/api/products", (req, res) => {
    res.json(products);
});

// GET PRODUCT BY ID (protected)
app.get("/api/products/:id", authMiddleware, (req, res) => {
    const product = products.find((p) => p.id === req.params.id);

    if (!product) {
        return res.status(404).json({
            error: "Product not found",
        });
    }

    res.json(product);
});

// UPDATE PRODUCT (protected)
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

// DELETE PRODUCT (protected)
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
