const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function login(req, res) {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'username 과 password 가 필요합니다.' });
  }

  const user = await User.findOne({ username });
  // 계정 존재 여부를 노출하지 않도록 실패 메시지를 동일하게 유지
  if (!user) return res.status(401).json({ message: '계정 정보가 올바르지 않습니다.' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: '계정 정보가 올바르지 않습니다.' });

  res.json({ token: signToken(user), role: user.role, username: user.username });
}

// 토큰 유효성 검사 + 현재 사용자 정보 (프론트가 새로고침 시 role 을 신뢰성 있게 재확인)
async function me(req, res) {
  const user = await User.findById(req.user.id).select('username role');
  if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
  res.json({ username: user.username, role: user.role });
}

module.exports = { login, me };
