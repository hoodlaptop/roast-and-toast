import { useEffect, useState } from 'react';
import client from '../api/client.js';
import RecipeCard from '../components/RecipeCard.jsx';

const TYPE_TABS = [
  { value: '', label: '전체' },
  { value: 'coffee', label: '커피' },
  { value: 'baking', label: '베이킹' },
];

export default function RecipeList() {
  const [recipes, setRecipes] = useState([]);
  const [type, setType] = useState('');
  const [q, setQ] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // type / 검색어 변경 시 서버 쿼리로 다시 조회 (검색어는 약간의 디바운스)
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = {};
      if (type) params.type = type;
      if (q.trim()) params.q = q.trim();

      setIsLoading(true);
      setError(null);
      client.get('/recipes', { params })
        .then((res) => setRecipes(res.data))
        .catch((err) => setError(err.response?.data?.message || err.message))
        .finally(() => setIsLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [type, q]);

  return (
    <div>
      <div className="list-head">
        <h1>레시피 목록</h1>
      </div>

      <div className="toolbar">
        <div className="tabs">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              className={type === tab.value ? 'tab tab-active' : 'tab'}
              onClick={() => setType(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <input
          className="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="제목 검색"
        />
      </div>

      {error && <p className="error">불러오기 실패: {error}</p>}

      {!error && isLoading && (
        <div className="state">
          <div className="spinner" aria-hidden="true" />
          <p className="muted">불러오는 중…</p>
        </div>
      )}

      {!error && !isLoading && recipes.length === 0 && (
        <div className="state">
          <span className="state-icon" aria-hidden="true">🔍</span>
          <p className="muted">
            {type || q.trim()
              ? '조건에 맞는 레시피가 없습니다.'
              : '아직 등록된 레시피가 없습니다.'}
          </p>
        </div>
      )}

      {!error && !isLoading && recipes.length > 0 && (
        <div className="card-grid">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe._id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
