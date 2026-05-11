import api from "../api/axios";

export const dashboardService = {
  getAdmin: () => api.get("/dashboard/admin"),
  getEmployee: () => api.get("/dashboard/employee"),
  getAnalytics: (year) => api.get("/dashboard/analytics", { params: { year } }),
};
