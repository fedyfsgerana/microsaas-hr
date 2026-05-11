import api from "../api/axios";

export const attendanceService = {
  checkIn: (data) => api.post("/attendance/check-in", data),
  checkOut: (data) => api.post("/attendance/check-out", data),
  getToday: () => api.get("/attendance/today"),
  getMy: (params) => api.get("/attendance/my", { params }),
  getCompany: (params) => api.get("/attendance/company", { params }),
  manualEntry: (data) => api.post("/attendance/manual", data),
  getSummary: (month) => api.get("/attendance/summary", { params: { month } }),
};
