import api from "../api/axios";

export const leaveService = {
  create: (data) => api.post("/leaves", data),
  getMy: (params) => api.get("/leaves/my", { params }),
  getCompany: (params) => api.get("/leaves/company", { params }),
  getCalendar: (companyId, month) =>
    api.get("/leaves/calendar", { params: { companyId, month } }),
  approve: (id, data) => api.patch(`/leaves/${id}/approve`, data),
  cancel: (id) => api.patch(`/leaves/${id}/cancel`),
};
