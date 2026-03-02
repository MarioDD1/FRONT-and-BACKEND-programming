import React from 'react';

export default function UserItem({ user, onEdit, onDelete }) {
  return (
    <div className="userRow">
      <div className="userMain">
        <div className="userId">#{user.id}</div>

        <div className="userInfo">
          <div className="userName">{user.name}</div>
          <div className="userCategory">{user.category}</div>
          <div className="userDescription">{user.description}</div>
        </div>

        <div className="userMeta">
          <div className="userPrice">{user.price.toFixed(2)} ₽</div>
          <div className="userStock">На складе: {user.stock} шт.</div>
          {user.rating != null && (
            <div className="userRating">Рейтинг: {user.rating.toFixed(1)}★</div>
          )}
        </div>
      </div>

      <div className="userActions">
        <button className="btn" onClick={() => onEdit(user)}>
          Редактировать
        </button>
        <button className="btn btn--danger" onClick={() => onDelete(user.id)}>
          Удалить
        </button>
      </div>
    </div>
  );
}
