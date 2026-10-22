function connectionStatus({ authenticated, composerVisible, challenge, sessionChecked }) {
  if (challenge) return { connected: false, authenticated, state: 'verification_required', message: 'ChatGPT đang yêu cầu xác minh trình duyệt. Hoàn tất xác minh trong cửa sổ đang mở rồi bấm Kiểm tra kết nối; không cần nhập lại cookie.' };
  if (authenticated && composerVisible) return { connected: true, authenticated: true, state: 'ready', message: 'Cookie đã đăng nhập thành công. ChatGPT sẵn sàng tạo hoạt hình.' };
  if (authenticated) return { connected: false, authenticated: true, state: 'page_not_ready', message: 'Cookie đã đăng nhập thành công nhưng ô chat chưa sẵn sàng. Kiểm tra cửa sổ ChatGPT rồi thử lại.' };
  if (!sessionChecked) return { connected: false, authenticated: false, state: 'session_unavailable', message: 'Chưa kiểm tra được phiên ChatGPT. Kiểm tra kết nối mạng hoặc xác minh trong cửa sổ trình duyệt rồi thử lại.' };
  return { connected: false, authenticated: false, state: 'login_required', message: 'ChatGPT chưa nhận phiên đăng nhập. Thay chatgpt-cookie.json bằng cookie mới từ tài khoản đã đăng nhập rồi bấm Mở ChatGPT đăng nhập.' };
}
module.exports = { connectionStatus };
