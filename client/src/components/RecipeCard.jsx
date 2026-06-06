import { Link } from 'react-router-dom';

const TYPE_LABEL = { coffee: '커피', baking: '베이킹' };
const TYPE_ICON = { coffee: '☕', baking: '🥐' };

// 초 → "m:ss"
function formatClock(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// 목록의 개별 레시피 카드. 클릭 시 상세로 이동.
export default function RecipeCard({ recipe }) {
  const { _id, type, title, description, ingredients = [], steps = [] } = recipe;

  // 커피는 단계별 durationSec 합으로 총 추출시간을 메타에 표시 (파생값, 새 필드 아님)
  const totalSec = steps.reduce((sum, s) => sum + (s.durationSec || 0), 0);

  return (
    <Link to={`/recipes/${_id}`} className="card">
      <div className={`card-thumb card-thumb-${type}`} aria-hidden="true">
        {TYPE_ICON[type] || '🍽️'}
      </div>
      <div className="card-body">
        <span className={`badge badge-${type}`}>
          <span aria-hidden="true">{TYPE_ICON[type]}</span>
          {TYPE_LABEL[type] || type}
        </span>
        <h3 className="card-title">{title}</h3>
        {description && <p className="card-desc">{description}</p>}
        <p className="card-meta">
          재료 {ingredients.length} · 단계 {steps.length}
          {type === 'coffee' && totalSec > 0 && ` · ⏱ ${formatClock(totalSec)}`}
        </p>
      </div>
    </Link>
  );
}
