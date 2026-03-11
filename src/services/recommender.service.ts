import apiClient from './api-client';
import { SamagriItem } from './api';

export async function fetchBookingSamagri(bookingId: number): Promise<SamagriItem[]> {
    const response = await apiClient.get(`/recommender/bookings/${bookingId}/samagri/`);
    return response.data;
}

export async function fetchBookingSamagriRecommendations(bookingId: number): Promise<SamagriItem[]> {
    const response = await apiClient.post(`/recommender/bookings/${bookingId}/samagri/recommendations/`);
    return response.data;
}
