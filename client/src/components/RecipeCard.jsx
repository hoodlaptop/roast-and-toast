import { Link } from 'react-router-dom';

const TYPE_LABEL = { coffee: '커피', baking: '베이킹' };

// 목록의 개별 레시피 카드. 클릭 시 상세로 이동.
export default function RecipeCard({ recipe }) {
  const { _id, type, title, description, ingredients = [], steps = [] } = recipe;

  return (
    <Link to={`/recipes/${_id}`} className="card">
      <span className={`badge badge-${type}`}>{TYPE_LABEL[type] || type}</span>
      <h3 className="card-title">{title}</h3>
      {description && <p className="card-desc">{description}</p>}
      <p className="card-meta">
        재료 {ingredients.length} · 단계 {steps.length}
      </p>
    </Link>
  );
}
