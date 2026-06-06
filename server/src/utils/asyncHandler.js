// 컨트롤러의 async 에러를 중앙 에러 핸들러로 넘겨주는 래퍼
module.exports = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
