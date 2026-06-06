const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI 가 설정되지 않았습니다. server/.env 를 확인하세요.');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log('MongoDB Atlas 연결 성공');
  } catch (err) {
    console.error('MongoDB 연결 실패:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
