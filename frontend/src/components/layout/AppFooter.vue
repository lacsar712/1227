<template>
  <footer class="app-footer">
    <div class="footer-inner">
      <div class="footer-links">
        <a href="#">关于我们</a>
        <a href="#">帮助中心</a>
        <a href="#">联系客服</a>
        <a href="#">隐私政策</a>
      </div>
      <p class="copyright">© 2024 优选商城 · 品质生活，触手可及</p>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  margin-top: 48px;
  padding: 32px 24px;
  background: linear-gradient(180deg, rgba(241,245,249,0.8) 0%, rgba(226,232,240,0.9) 100%);
  text-align: center;
}
.footer-inner {
  max-width: 1280px;
  margin: 0 auto;
}
.footer-links {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 16px;
}
.footer-links a {
  color: #64748b;
  font-size: 14px;
  transition: color 0.2s;
}
.footer-links a:hover {
  color: #6366f1;
}
.copyright {
  margin: 0;
  font-size: 13px;
  color: #94a3b8;
}
</style>
