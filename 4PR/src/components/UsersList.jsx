import React from 'react';
import UserItem from './UserItem';

export default function UsersList({ users, onEdit, onDelete }) {
  if (!users.length) {
    return <div className="empty">Товаров пока нет</div>;
  }

  return (
    <div className="list">
      {users.map((p) => (
        <UserItem key={p.id} user={p} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}