import React, { useEffect, useState } from 'react';

export default function UserModal({ open, mode, initialUser, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [rating, setRating] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(initialUser?.name ?? '');
    setCategory(initialUser?.category ?? '');
    setDescription(initialUser?.description ?? '');
    setPrice(
      initialUser?.price != null ? String(initialUser.price) : ''
    );
    setStock(
      initialUser?.stock != null ? String(initialUser.stock) : ''
    );
    setRating(
      initialUser?.rating != null ? String(initialUser.rating) : ''
    );
    setImageUrl(initialUser?.imageUrl ?? '');
  }, [open, initialUser]);

  if (!open) return null;

  const title = mode === 'edit' ? 'Редактирование товара' : 'Создание товара';

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const trimmedDescription = description.trim();
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    const parsedRating = rating === '' ? null : Number(rating);

    if (!trimmedName) {
      alert('Введите название товара');
      return;
    }
    if (!trimmedCategory) {
      alert('Введите категорию');
      return;
    }
    if (!trimmedDescription) {
      alert('Введите описание');
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      alert('Введите корректную цену (>= 0)');
      return;
    }
    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      alert('Введите корректное количество на складе (целое число >= 0)');
      return;
    }
    if (
      parsedRating != null &&
      (!Number.isFinite(parsedRating) || parsedRating < 0 || parsedRating > 5)
    ) {
      alert('Рейтинг должен быть от 0 до 5');
      return;
    }

    onSubmit({
      id: initialUser?.id,
      name: trimmedName,
      category: trimmedCategory,
      description: trimmedDescription,
      price: parsedPrice,
      stock: parsedStock,
      rating: parsedRating,
      imageUrl: imageUrl.trim()
    });
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal__header">
          <div className="modal__title">{title}</div>
          <button className="iconBtn" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Название
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, Игровая мышь"
              autoFocus
            />
          </label>

          <label className="label">
            Категория
            <input
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Например, Периферия"
            />
          </label>

          <label className="label">
            Описание
            <textarea
              className="input textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание товара"
              rows={3}
            />
          </label>

          <label className="label">
            Цена (₽)
            <input
              className="input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Например, 1999"
              inputMode="decimal"
            />
          </label>

          <label className="label">
            Количество на складе
            <input
              className="input"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="Например, 10"
              inputMode="numeric"
            />
          </label>

          <label className="label">
            Рейтинг (0–5, опционально)
            <input
              className="input"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="Например, 4.5"
              inputMode="decimal"
            />
          </label>

          <label className="label">
            URL изображения (опционально)
            <input
              className="input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </label>

          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn--primary">
              {mode === 'edit' ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
