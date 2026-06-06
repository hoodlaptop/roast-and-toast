import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import BrewTimer from '../components/BrewTimer.jsx';

const TYPE_LABEL = { coffee: '커피', baking: '베이킹' };
const TYPE_ICON = { coffee: '☕', baking: '🥐' };

// durationSec(초)을 "m분 s초" 형태로 표시
function formatDuration(sec) {
  if (sec == null) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m && s) return `${m}분 ${s}초`;
  if (m) return `${m}분`;
  return `${s}초`;
}

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    client.get(`/recipes/${id}`)
      .then((res) => setRecipe(res.data))
      .catch((err) => setError(err.response?.data?.message || err.message));
  }, [id]);

  async function handleDelete() {
    if (!window.confirm('이 레시피를 삭제할까요? 되돌릴 수 없습니다.')) return;
    try {
      await client.delete(`/recipes/${id}`);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '삭제에 실패했습니다.');
    }
  }

  if (error) return <p className="error">{error}</p>;
  if (!recipe) {
    return (
      <div className="state">
        <div className="spinner" aria-hidden="true" />
        <p className="muted">불러오는 중…</p>
      </div>
    );
  }

  const { type, title, description, ingredients = [], steps = [] } = recipe;

  return (
    <article className="detail">
      <div className="detail-head">
        <div>
          <span className={`badge badge-${type}`}>
            <span aria-hidden="true">{TYPE_ICON[type]}</span>
            {TYPE_LABEL[type] || type}
          </span>
          <h1>{title}</h1>
        </div>
        {isAdmin && (
          <div className="detail-actions">
            <Link to={`/recipes/${id}/edit`} className="btn">수정</Link>
            <button className="btn btn-danger" onClick={handleDelete}>삭제</button>
          </div>
        )}
      </div>

      {description && <p className="detail-desc">{description}</p>}

      {type === 'coffee' && <BrewTimer steps={steps} />}

      <section>
        <h2>재료</h2>
        {ingredients.length === 0 ? (
          <p className="muted">등록된 재료가 없습니다.</p>
        ) : (
          <ul className="ingredient-list">
            {ingredients.map((ing, i) => (
              <li key={i}>
                <span>{ing.name}</span>
                {ing.amount && <span className="muted">{ing.amount}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>단계</h2>
        {steps.length === 0 ? (
          <p className="muted">등록된 단계가 없습니다.</p>
        ) : (
          <ol className="step-list">
            {steps.map((step) => (
              <li key={step.order}>
                <span>{step.instruction}</span>
                {step.durationSec != null && (
                  <span className="step-time">{formatDuration(step.durationSec)}</span>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </article>
  );
}
