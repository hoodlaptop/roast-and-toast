import { Routes, Route, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import RecipeList from './pages/RecipeList.jsx';
import RecipeDetail from './pages/RecipeDetail.jsx';
import RecipeForm from './pages/RecipeForm.jsx';
import Login from './pages/Login.jsx';

export default function App() {
  const { auth, isAdmin, logout } = useAuth();

  return (
    <div className="app">
      <header className="nav">
        <Link to="/" className="brand">Roast &amp; Toast</Link>
        <nav>
          {isAdmin && <Link to="/recipes/new">레시피 추가</Link>}
          {auth ? (
            <button onClick={logout}>로그아웃 ({auth.username})</button>
          ) : (
            <Link to="/login">로그인</Link>
          )}
        </nav>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<RecipeList />} />
          <Route path="/recipes/new" element={<RecipeForm />} />
          <Route path="/recipes/:id/edit" element={<RecipeForm />} />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </div>
  );
}
