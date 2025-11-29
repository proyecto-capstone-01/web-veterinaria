import axios from 'axios';
import type { ContactFormType } from "@/types.ts";
// @ts-ignore
import { PUBLIC_CONTACT_API_URL, PUBLIC_CMS_API_URL } from "astro:env/client";

export const submitContactForm = async (data: ContactFormType) => {
    try {
        const response = await axios.post(`${PUBLIC_CONTACT_API_URL}/contact-form`, data, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error submitting contact form:', error);
        throw error;
    }
};

export const submitAppointmentForm = async (data: any) => {
    try {
        const response = await axios.post(`${PUBLIC_CMS_API_URL}/appointments`, data, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error submitting appointment form:', error);
        throw error;
    }
}


export const fetchProducts = async (id?: number) => {
    try {
        if (id) {
            const response = await axios.get(`${PUBLIC_CMS_API_URL}/api/products/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        const response = await axios.get(`${PUBLIC_CMS_API_URL}/api/products`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data.docs;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }

};

export const fetchServices = async () => {
    try {
        const response = await axios.get(`${PUBLIC_CMS_API_URL}/api/services`, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data; // expects shape with docs[]
    } catch (error) {
        console.error('Error fetching services:', error);
        throw error;
    }
};

export const fetchWeekAvailability = async () => {
    try {
        const response = await axios.get(`${PUBLIC_CMS_API_URL}/availability/week`, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data; // expects shape of date keys mapping to array of {hour, availability}
    } catch (error) {
        console.error('Error fetching week availability:', error);
        throw error;
    }
};
