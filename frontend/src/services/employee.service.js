import api from "../api/axios";

export const employeeService = {
  create: (data) => api.post("/employees", data),
  getAll: (params) => api.get("/employees", { params }),
  getOne: (id) => api.get(`/employees/${id}`),
  update: (id, data) => api.patch(`/employees/${id}`, data),
  archive: (id) => api.delete(`/employees/${id}`),
  getLeaveBalances: (id) => api.get(`/employees/${id}/leave-balances`),
};
