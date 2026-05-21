import axiosClient from "./axiosClient";

const promotionApi = {
  // ───────────────────────────────────────
  // GET ALL PROMOTIONS
  // ───────────────────────────────────────
  getAllPromotions: (params) => {
    return axiosClient.get("/promotions", { params });
  },

  // ───────────────────────────────────────
  // GET PROMOTION DETAIL
  // ───────────────────────────────────────
  getPromotionDetail: (id) => {
    return axiosClient.get(`/promotions/${id}`);
  },

  // ───────────────────────────────────────
  // VALIDATE VOUCHER
  // GET /api/v1/vouchers/validate?code=XXX
  // ───────────────────────────────────────
  validateVoucher: (code) => {
    return axiosClient.get("/vouchers/validate", {
      params: { code },
    });
  },

  // ───────────────────────────────────────
  // MEMBER BENEFITS
  // ───────────────────────────────────────
  getMemberBenefits: () => {
    return axiosClient.get("/promotions/member-benefits");
  },

  // ───────────────────────────────────────
  // EVENTS
  // ───────────────────────────────────────
  getEvents: () => {
    return axiosClient.get("/promotions/events");
  },

  // ───────────────────────────────────────
  // PARTNERS
  // ───────────────────────────────────────
  getPartners: () => {
    return axiosClient.get("/promotions/partners");
  },
};

export default promotionApi;