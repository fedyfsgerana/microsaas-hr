import api from "../api/axios";

export const payrollService = {
  generate: (data) => api.post("/payroll/generate", data),
  getAll: (period) => api.get("/payroll", { params: { period } }),
  getMy: () => api.get("/payroll/my"),
  getOne: (id) => api.get(`/payroll/${id}`),
  update: (id, data) => api.patch(`/payroll/${id}`, data),
  approve: (id) => api.patch(`/payroll/${id}/approve`),
  send: (id) => api.patch(`/payroll/${id}/send`),
  getSummary: (period) => api.get("/payroll/summary", { params: { period } }),
};
