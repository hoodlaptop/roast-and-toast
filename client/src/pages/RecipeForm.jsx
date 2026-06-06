import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const emptyIngredient = () => ({ name: '', amount: '' });
const emptyStep = () => ({ instruction: '', durationSec: '' });

export default function RecipeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isVerifying } = useAuth();
  const isEdit = Boolean(id);

  const [type, setType] = useState('coffee');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState([emptyIngredient()]);
  const [steps, setSteps] = useState([emptyStep()]);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // 수정 모드면 기존 값 로드
  useEffect(() => {
    if (!isEdit) return;
    client.get(`/recipes/${id}`)
      .then((res) => {
        const r = res.data;
        setType(r.type);
        setTitle(r.title || '');
        setDescription(r.description || '');
        setIngredients(r.ingredients?.length ? r.ingredients : [emptyIngredient()]);
        setSteps(
          r.steps?.length
            ? r.steps.map((s) => ({
                instruction: s.instruction,
                durationSec: s.durationSec ?? '',
              }))
            : [emptyStep()]
        );
      })
      .catch((err) => setError(err.response?.data?.message || err.message));
  }, [id, isEdit]);

  // 권한 가드: 검증이 끝난 뒤 관리자가 아니면 목록으로 리다이렉트
  if (!isVerifying && !isAdmin) return <Navigate to="/" replace />;

  function handleIngredientChange(index, field, value) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );
  }
  function handleAddIngredient() {
    setIngredients((prev) => [...prev, emptyIngredient()]);
  }
  function handleRemoveIngredient(index) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function handleStepChange(index, field, value) {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, [field]: value } : step))
    );
  }
  function handleAddStep() {
    setSteps((prev) => [...prev, emptyStep()]);
  }
  function handleRemoveStep(index) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('제목을 입력하세요.');
      return;
    }

    const cleanedSteps = steps
      .filter((s) => s.instruction.trim())
      .map((s) => ({
        instruction: s.instruction.trim(),
        // 커피만 durationSec 사용, 베이킹은 항상 null
        durationSec:
          type === 'coffee' && s.durationSec !== '' && s.durationSec != null
            ? Number(s.durationSec)
            : null,
      }));

    if (cleanedSteps.length === 0) {
      setError('단계를 최소 1개 입력하세요.');
      return;
    }
    if (cleanedSteps.some((s) => s.durationSec != null && (Number.isNaN(s.durationSec) || s.durationSec < 0))) {
      setError('단계 시간(초)은 0 이상의 숫자여야 합니다.');
      return;
    }

    const payload = {
      type,
      title: title.trim(),
      description: description.trim(),
      ingredients: ingredients
        .filter((ing) => ing.name.trim())
        .map((ing) => ({ name: ing.name.trim(), amount: ing.amount.trim() })),
      steps: cleanedSteps,
    };

    setIsSaving(true);
    try {
      const res = isEdit
        ? await client.put(`/recipes/${id}`, payload)
        : await client.post('/recipes', payload);
      navigate(`/recipes/${res.data._id}`);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.errors?.join(' / ') || data?.message || '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  }

  const isCoffee = type === 'coffee';

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h1>{isEdit ? '레시피 수정' : '레시피 추가'}</h1>

      <label className="field">
        <span>종류</span>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="coffee">커피</option>
          <option value="baking">베이킹</option>
        </select>
      </label>

      <label className="field">
        <span>제목</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="레시피 제목" />
      </label>

      <label className="field">
        <span>설명</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="간단한 소개"
          rows={3}
        />
      </label>

      <fieldset className="group">
        <legend>재료</legend>
        {ingredients.map((ing, i) => (
          <div key={i} className="row">
            <input
              value={ing.name}
              onChange={(e) => handleIngredientChange(i, 'name', e.target.value)}
              placeholder="이름 (예: 원두)"
            />
            <input
              value={ing.amount}
              onChange={(e) => handleIngredientChange(i, 'amount', e.target.value)}
              placeholder="양 (예: 18g)"
            />
            <button type="button" className="btn btn-ghost" onClick={() => handleRemoveIngredient(i)}>
              삭제
            </button>
          </div>
        ))}
        <button type="button" className="btn" onClick={handleAddIngredient}>+ 재료 추가</button>
      </fieldset>

      <fieldset className="group">
        <legend>단계</legend>
        {steps.map((step, i) => (
          <div key={i} className="row">
            <span className="step-no">{i + 1}</span>
            <input
              value={step.instruction}
              onChange={(e) => handleStepChange(i, 'instruction', e.target.value)}
              placeholder="설명 (예: 30초간 뜸 들이기)"
            />
            {isCoffee && (
              <input
                type="number"
                min="0"
                value={step.durationSec}
                onChange={(e) => handleStepChange(i, 'durationSec', e.target.value)}
                placeholder="초"
                className="duration-input"
              />
            )}
            <button type="button" className="btn btn-ghost" onClick={() => handleRemoveStep(i)}>
              삭제
            </button>
          </div>
        ))}
        <button type="button" className="btn" onClick={handleAddStep}>+ 단계 추가</button>
      </fieldset>

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={isSaving}>
          {isSaving ? '저장 중…' : '저장'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
          취소
        </button>
      </div>
    </form>
  );
}
