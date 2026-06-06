require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');

async function seed() {
  await connectDB();
  const username = process.env.SEED_ADMIN_USERNAME || 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD || 'changeme';

  if (password === 'changeme') {
    console.warn('⚠ 기본 비밀번호(changeme)를 사용 중입니다. 운영 전 반드시 변경하세요.');
  }

  const existing = await User.findOne({ username });
  if (existing) {
    console.log(`이미 존재하는 계정: ${username}`);
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ username, passwordHash, role: 'admin' });
    console.log(`관리자 계정 생성됨 -> id: ${username} / pw: ${password}`);
  }
  await mongoose.connection.close();
}

seed();
