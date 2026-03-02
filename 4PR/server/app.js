const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');

const app = express();
const port = 3000;

// Товары интернет‑магазина
let products = [
  {
    id: nanoid(6),
    name: 'Игровая мышь HyperClaw',
    category: 'Периферия',
    description: 'Игровая мышь с RGB‑подсветкой и настраиваемыми кнопками.',
    price: 49.99,
    stock: 25,
    rating: 4.5,
    imageUrl: 'https://via.placeholder.com/150?text=Mouse'
  },
  {
    id: nanoid(6),
    name: 'Механическая клавиатура SteelKey',
    category: 'Периферия',
    description: 'Механическая клавиатура с синими свитчами и подсветкой.',
    price: 89.99,
    stock: 15,
    rating: 4.7,
    imageUrl: 'https://via.placeholder.com/150?text=Keyboard'
  },
  {
    id: nanoid(6),
    name: 'Игровой монитор 27"',
    category: 'Мониторы',
    description: '27‑дюймовый монитор 144 Гц, IPS‑матрица.',
    price: 299.99,
    stock: 8,
    rating: 4.8,
    imageUrl: 'https://via.placeholder.com/150?text=Monitor'
  },
  {
    id: nanoid(6),
    name: 'Наушники SoundStorm',
    category: 'Аудио',
    description: 'Игровая гарнитура с микрофоном и объемным звуком.',
    price: 69.99,
    stock: 30,
    rating: 4.3,
    imageUrl: 'https://via.placeholder.com/150?text=Headset'
  },
  {
    id: nanoid(6),
    name: 'Кресло GamerSeat',
    category: 'Мебель',
    description: 'Игровое кресло с поддержкой поясницы и регулировкой высоты.',
    price: 199.99,
    stock: 12,
    rating: 4.6,
    imageUrl: 'https://via.placeholder.com/150?text=Chair'
  },
  {
    id: nanoid(6),
    name: 'Коврик для мыши XL',
    category: 'Периферия',
    description: 'Большой коврик для мыши с прошитыми краями.',
    price: 19.99,
    stock: 40,
    rating: 4.4,
    imageUrl: 'https://via.placeholder.com/150?text=Pad'
  },
  {
    id: nanoid(6),
    name: 'Веб‑камера StreamCam',
    category: 'Видеоустройства',
    description: 'Веб‑камера Full HD для стриминга и видеозвонков.',
    price: 79.99,
    stock: 18,
    rating: 4.2,
    imageUrl: 'https://via.placeholder.com/150?text=Webcam'
  },
  {
    id: nanoid(6),
    name: 'Микрофон ProVoice',
    category: 'Аудио',
    description: 'Конденсаторный микрофон для подкастов и стримов.',
    price: 129.99,
    stock: 10,
    rating: 4.7,
    imageUrl: 'https://via.placeholder.com/150?text=Mic'
  },
  {
    id: nanoid(6),
    name: 'Колонки BassBoom',
    category: 'Аудио',
    description: 'Настольные колонки с глубоким басом.',
    price: 59.99,
    stock: 22,
    rating: 4.1,
    imageUrl: 'https://via.placeholder.com/150?text=Speakers'
  },
  {
    id: nanoid(6),
    name: 'USB‑хаб 7‑портовый',
    category: 'Аксессуары',
    description: 'USB‑хаб с питанием для подключения множества устройств.',
    price: 24.99,
    stock: 35,
    rating: 4.0,
    imageUrl: 'https://via.placeholder.com/150?text=USB+Hub'
  }
];

// Парсинг JSON
app.use(express.json());

// CORS, как в методичке: «Теперь мы разрешили все запросы от клиента с адресом http://localhost: 3001…» 
app.use(
  cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Логирование запросов
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(
      `[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`
    );
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      console.log('Body:', req.body);
    }
  });
  next();
});

// Хелпер для поиска товара
function findProductOr404(id, res) {
  const product = products.find((p) => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return null;
  }
  return product;
}

// POST /api/products — создание товара
app.post('/api/products', (req, res) => {
  const { name, category, description, price, stock, rating, imageUrl } = req.body;

  if (!name || !category || !description || price == null || stock == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newProduct = {
    id: nanoid(6),
    name: String(name).trim(),
    category: String(category).trim(),
    description: String(description).trim(),
    price: Number(price),
    stock: Number(stock),
    rating: rating != null ? Number(rating) : null,
    imageUrl: imageUrl ? String(imageUrl).trim() : ''
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

// GET /api/products — список товаров
app.get('/api/products', (req, res) => {
  res.json(products);
});

// GET /api/products/:id — один товар
app.get('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;
  res.json(product);
});

// PATCH /api/products/:id — обновление товара
app.patch('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;

  if (
    req.body?.name === undefined &&
    req.body?.category === undefined &&
    req.body?.description === undefined &&
    req.body?.price === undefined &&
    req.body?.stock === undefined &&
    req.body?.rating === undefined &&
    req.body?.imageUrl === undefined
  ) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  const { name, category, description, price, stock, rating, imageUrl } = req.body;

  if (name !== undefined) product.name = String(name).trim();
  if (category !== undefined) product.category = String(category).trim();
  if (description !== undefined) product.description = String(description).trim();
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);
  if (rating !== undefined) product.rating = Number(rating);
  if (imageUrl !== undefined) product.imageUrl = String(imageUrl).trim();

  res.json(product);
});

// DELETE /api/products/:id — удаление товара
app.delete('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const exists = products.some((p) => p.id === id);
  if (!exists) return res.status(404).json({ error: 'Product not found' });

  products = products.filter((p) => p.id !== id);
  res.status(204).send();
});

// 404 для остальных маршрутов
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});