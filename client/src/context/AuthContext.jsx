import { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return {
      token,
      role: localStorage.getItem('role'),
      username: localStorage.getItem('username'),
    };
  });
  // 토큰이 있으면 서버 재확인이 끝날 때까지 검증 중 상태로 둔다
  const [isVerifying, setIsVerifying] = useState(() => !!localStorage.getItem('token'));

  // 앱 로드 시 토큰이 있으면 GET /auth/me 로 role 을 재확인한다.
  // localStorage 의 role 값 자체는 신뢰하지 않고 서버 응답으로 덮어쓴다.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsVerifying(false);
      return;
    }
    let active = true;
    client.get('/auth/me')
      .then((res) => {
        if (!active) return;
        const { username, role } = res.data;
        localStorage.setItem('role', role);
        localStorage.setItem('username', username);
        setAuth({ token, role, username });
      })
      .catch(() => {
        // 토큰 만료/위조 등 → 로컬 상태 폐기
        if (!active) return;
        localStorage.clear();
        setAuth(null);
      })
      .finally(() => {
        if (active) setIsVerifying(false);
      });
    return () => { active = false; };
  }, []);

  function login({ token, role, username }) {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('username', username);
    setAuth({ token, role, username });
  }

  function logout() {
    localStorage.clear();
    setAuth(null);
  }

  const isAdmin = auth?.role === 'admin';

  return (
    <AuthContext.Provider value={{ auth, isAdmin, isVerifying, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
