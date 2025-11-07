import axios from 'axios';
import type { ContactFormType, ProductType } from "@/types.ts";

export const submitContactForm = async (data: ContactFormType) => {

    const apiUrl = import.meta.env.PUBLIC_CONTACT_API_URL;

    try {
        const response = await axios.post(`${apiUrl}/contact-form`, data, {
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

    const apiUrl = import.meta.env.PUBLIC_CMS_API_URL;

    try {
        const response = await axios.post(`${apiUrl}/appointment-form`, data, {
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


export const fetchProducts = async () => {

    const apiUrl = import.meta.env.PUBLIC_CMS_API_URL;

    try {
        const response = await axios.get(`${apiUrl}/products`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }

};