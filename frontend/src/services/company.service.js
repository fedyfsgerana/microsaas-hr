import api from "../api/axios";

export const companyService = {
  create: (data) => api.post("/company", data),
  getMyCompany: () => api.get("/company/me"),
  update: (data) => api.patch("/company", data),
  createDepartment: (name) => api.post("/company/departments", { name }),
  getDepartments: (companyId) => api.get(`/company/${companyId}/departments`),
  deleteDepartment: (id) => api.delete(`/company/departments/${id}`),
  createWorkPolicy: (data) => api.post("/company/work-policies", data),
  createLeavePolicy: (data) => api.post("/company/leave-policies", data),
};
