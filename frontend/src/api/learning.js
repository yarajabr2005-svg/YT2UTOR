import { api } from "./auth";

export async function fetchSkills() {
  const response = await api.get("skills/");
  return response.data;
}

export async function searchTutors(params) {
  const response = await api.get("search/", { params });
  return response.data;
}

export async function fetchTutorProfile(tutorId) {
  const response = await api.get(`tutors/${tutorId}/`);
  return response.data;
}

export async function fetchTutorAvailability(tutorId) {
  const response = await api.get(`tutors/${tutorId}/availability/`);
  return response.data;
}

export async function recommendTutors(payload) {
  const response = await api.post("ai/recommend/", payload);
  return response.data;
}

export async function createBooking(payload) {
  const response = await api.post("bookings/", payload);
  return response.data;
}

export async function fetchBookings(params) {
  const response = await api.get("bookings/", { params });
  return response.data;
}

export async function confirmBooking(bookingId) {
  const response = await api.patch(`bookings/${bookingId}/confirm/`);
  return response.data;
}

export async function rejectBooking(bookingId) {
  const response = await api.patch(`bookings/${bookingId}/reject/`);
  return response.data;
}

export async function cancelBooking(bookingId) {
  const response = await api.patch(`bookings/${bookingId}/cancel/`);
  return response.data;
}

export async function completeBooking(bookingId) {
  const response = await api.patch(`bookings/${bookingId}/complete/`);
  return response.data;
}

export async function createReview(payload) {
  const response = await api.post("reviews/", payload);
  return response.data;
}

export async function fetchTutorReviews(tutorId) {
  const response = await api.get(`tutors/${tutorId}/reviews/`);
  return response.data;
}

export async function updateTutorSkills(skillIds) {
  const response = await api.put("tutors/skills/", { skill_ids: skillIds });
  return response.data;
}

export async function createAvailability(payload) {
  const response = await api.post("tutors/availability/", payload);
  return response.data;
}

export async function updateAvailability(slotId, payload) {
  const response = await api.put(`tutors/availability/${slotId}/`, payload);
  return response.data;
}

export async function deleteAvailability(slotId) {
  const response = await api.delete(`tutors/availability/${slotId}/`);
  return response.data;
}

export async function uploadQualification(formData) {
  const response = await api.post("qualifications/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function deleteQualification(qualificationId) {
  const response = await api.delete(`qualifications/${qualificationId}/`);
  return response.data;
}

export async function fetchPendingQualifications() {
  const response = await api.get("qualifications/pending/");
  return response.data;
}

export async function verifyQualification(qualificationId, payload) {
  const response = await api.put(
    `qualifications/${qualificationId}/verify/`,
    payload,
  );
  return response.data;
}
