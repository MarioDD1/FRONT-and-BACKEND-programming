import React, { useEffect, useState } from 'react';
import './UsersPage.scss';

import UsersList from '../../components/UsersList';
import UserModal from '../../components/UserModal';
import { api } from '../../api';

export default function UsersPage() {
  const [users, setUsers] = useState([]); // здесь users = товары
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create | edit
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setUsers(data);
    } catch (err) {
      console.error(err);
      alert('Ошибка загрузки товаров');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setModalMode('create');
    setEditingUser(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setModalMode('edit');
    setEditingUser(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleDelete = async (id) => {
    const ok = window.confirm('Удалить товар?');
    if (!ok) return;
    try {
      await api.deleteProduct(id);
      setUsers((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert('Ошибка удаления товара');
    }
  };

  const handleSubmitModal = async (payload) => {
    try {
      if (modalMode === 'create') {
        const newProduct = await api.createProduct(payload);
        setUsers((prev) => [...prev, newProduct]);
      } else {
        const updatedProduct = await api.updateProduct(payload.id, payload);
        setUsers((prev) =>
          prev.map((p) => (p.id === payload.id ? updatedProduct : p))
        );
      }
      closeModal();
    } catch (err) {
      console.error(err);
      alert('Ошибка сохранения товара');
    }
  };

  return (
    <div className="page">
      <header className="header">
        <div className="header__inner">
          <div className="brand">Shop App</div>
          <div className="header__right">React + API</div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="toolbar">
            <h1 className="title">Товары интернет‑магазина</h1>
            <button className="btn btn--primary" onClick={openCreate}>
              + Добавить товар
            </button>
          </div>

          {loading ? (
            <div className="empty">Загрузка...</div>
          ) : (
            <UsersList users={users} onEdit={openEdit} onDelete={handleDelete} />
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="footer__inner">
          © {new Date().getFullYear()} Shop App
        </div>
      </footer>

      <UserModal
        open={modalOpen}
        mode={modalMode}
        initialUser={editingUser}
        onClose={closeModal}
        onSubmit={handleSubmitModal}
      />
    </div>
  );
}
