<template>
  <div class="page-container">
    <h1 class="page-title">收货地址</h1>
    <el-button type="primary" @click="openForm()" style="margin-bottom: 24px">+ 新增地址</el-button>
    <div v-loading="loading" class="address-list">
      <el-card v-for="addr in addresses" :key="addr.id" shadow="hover" class="address-card">
        <div class="addr-header">
          <span class="receiver">{{ addr.receiver }}</span>
          <span class="phone">{{ addr.phone }}</span>
          <span class="default-tag" v-if="addr.is_default">默认</span>
        </div>
        <div class="addr-detail">{{ addr.province }} {{ addr.city }} {{ addr.district }} {{ addr.detail }}</div>
        <div class="addr-actions">
          <el-button type="primary" text @click="openForm(addr)">编辑</el-button>
          <el-button v-if="!addr.is_default" type="primary" text @click="setDefault(addr.id)">设为默认</el-button>
          <el-button type="danger" text @click="remove(addr.id)">删除</el-button>
        </div>
      </el-card>
      <el-empty v-if="!loading && !addresses.length" description="暂无收货地址" />
    </div>
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑地址' : '新增地址'" width="500px" destroy-on-close>
      <el-form :model="form" label-width="80px">
        <el-form-item label="收货人" required>
          <el-input v-model="form.receiver" placeholder="请输入收货人" />
        </el-form-item>
        <el-form-item label="手机号" required>
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="省份" required>
          <el-input v-model="form.province" placeholder="如：广东省" />
        </el-form-item>
        <el-form-item label="城市" required>
          <el-input v-model="form.city" placeholder="如：深圳市" />
        </el-form-item>
        <el-form-item label="区县" required>
          <el-input v-model="form.district" placeholder="如：南山区" />
        </el-form-item>
        <el-form-item label="详细地址" required>
          <el-input v-model="form.detail" placeholder="街道、门牌号等" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="form.is_default">设为默认地址</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useConfirm } from '@/composables/useConfirm';
import { addressesApi } from '@/api';

const confirm = useConfirm();

const loading = ref(true);
const addresses = ref([]);
const dialogVisible = ref(false);
const editing = ref(null);

const form = reactive({
  receiver: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  is_default: false
});

onMounted(load);

async function load() {
  loading.value = true;
  try {
    addresses.value = await addressesApi.list();
  } finally {
    loading.value = false;
  }
}

function openForm(addr) {
  editing.value = addr;
  if (addr) {
    Object.assign(form, {
      receiver: addr.receiver,
      phone: addr.phone,
      province: addr.province,
      city: addr.city,
      district: addr.district,
      detail: addr.detail,
      is_default: addr.is_default
    });
  } else {
    Object.assign(form, {
      receiver: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      detail: '',
      is_default: false
    });
  }
  dialogVisible.value = true;
}

async function save() {
  if (!form.receiver || !form.phone || !form.province || !form.city || !form.district || !form.detail) {
    ElMessage.warning('请填写完整信息');
    return;
  }
  try {
    if (editing.value) {
      await addressesApi.update(editing.value.id, form);
      ElMessage.success('更新成功');
    } else {
      await addressesApi.create(form);
      ElMessage.success('添加成功');
    }
    dialogVisible.value = false;
    await load();
  } catch (e) {}
}

async function setDefault(id) {
  await addressesApi.setDefault(id);
  ElMessage.success('已设为默认');
  await load();
}

async function remove(id) {
  const ok = await confirm({ title: '删除地址', message: '确定要删除该收货地址吗？', type: 'danger' });
  if (!ok) return;
  await addressesApi.remove(id);
  ElMessage.success('已删除');
  await load();
}
</script>

<style scoped>
.address-list { display: flex; flex-direction: column; gap: 16px; }
.address-card {
  max-width: 600px;
}
.addr-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.receiver { font-weight: 600; }
.default-tag { font-size: 12px; color: #6366f1; background: #eef2ff; padding: 2px 8px; border-radius: 4px; }
.addr-detail { color: #64748b; margin-bottom: 12px; }
.addr-actions { display: flex; gap: 8px; }
</style>
