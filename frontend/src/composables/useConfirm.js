import { useConfirmStore } from '@/stores/confirm';

/**
 * 现代美学风格的确认弹窗，替代原生 confirm / ElMessageBox
 * @example
 * const confirm = useConfirm();
 * const ok = await confirm({ message: '确定删除？', title: '提示' });
 * if (ok) { ... }
 */
export function useConfirm() {
  const store = useConfirmStore();
  return store.show.bind(store);
}
